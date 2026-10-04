# watch-render.sh

The collector loop for a distributed render, made for the Monitor tool: every `--interval` seconds it fetches the
helper branches, restores their pieces (`restore-from-branches.py`, with the wanted fingerprints from
`status --json` when the status tool supports it), runs the status command, and counts the pieces still **missing
or stale**. It prints a line only when that line changes.

Copy it and `restore-from-branches.py` into the film repository's `tools/` together (it runs the restore from its
own folder), and commit both.

```bash
tools/watch-render.sh --branches 'claude/my-film-h*' --plan film-plan.json --dirs dist/my-film-v3
tools/watch-render.sh --branches 'claude/my-film-st*' --plan plans-v3/film-plan.json \
    --status 'node tools/chunk.mjs status --plan plans-v3/film-plan.json'
```
`--plan` also goes to the restore (only pieces of that plan's current block grid come back): pass the plan your
`--status` command reads.

| Last line | Exit | Meaning |
|---|---|---|
| `DONE ...` | 0 | nothing missing or stale |
| `FAIL ...` | 1 | restore or status failed; the reason is on the line |
| `REARM n left` | 3 | `--max-minutes` (default 28) reached: start a new watcher. Monitors stop at 30 minutes. |

Give the Monitor a filter that matches all three words. A watcher whose filter only matches success sits silent on
a crashed job. Stale pieces count as unfinished: they were rendered under other sources.

Don't edit the script while a copy is running. Bash reads scripts as it goes, so editing one mid-run breaks it.
To stop a watcher, kill it by PID. `pkill -f <pattern>` can match the shell that runs it (Nova saw exit 144).

Provenance: generalised from the "Nova, Episode 1" session's `watch-sd.sh` (Oct 2026). That script counted the
pieces of one scene only and never stopped before the Monitor's 30 minutes. Tested here on a finished cut (DONE,
exit 0) and an unfinished one (REARM, exit 3), and again after the `--plan` change (DONE on the v4 David cut).
