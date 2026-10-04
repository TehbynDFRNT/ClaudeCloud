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
tools/watch-render.sh --branches 'claude/my-film-hd1,claude/my-film-hd2' --plan film-plan-4k.json \
    --status 'node tools/chunk.mjs status --plan film-plan-4k.json'      # a 72-frame-block master plan
```
`--plan` also goes to the restore (only pieces of that plan's current block grid come back): pass the plan your
`--status` command reads. The restore takes the block length from the plan's own `block` (Nova's 4K plan: 72), else
`film.config.json`, else 240, the same rule `chunk.mjs` renders by. `--block N` passes an explicit length through to
the restore for a layout recorded nowhere else. With the 240 grid every piece of a 72-frame plan counts as obsolete
and nothing comes back.

| Last line | Exit | Meaning |
|---|---|---|
| `DONE ...` | 0 | nothing missing or stale |
| `FAIL ...` | 1 | restore or status failed, including a fetch that still fails after 3 tries; the reason is on the line |
| `REARM n left` | 3 | `--max-minutes` (default 28) reached: start a new watcher. Monitors stop at 30 minutes. |

Give the Monitor a filter that matches all three words. A watcher whose filter only matches success sits silent on
a crashed job. Stale pieces count as unfinished: they were rendered under other sources.

Don't edit the script while a copy is running. Bash reads scripts as it goes, so editing one mid-run breaks it.
To stop a watcher, kill it by PID. `pkill -f <pattern>` can match the shell that runs it (Nova saw exit 144), and
`pgrep -f` matches it too, so a liveness check like `pgrep -f watch-render.sh || start` sees itself and starts
nothing. Use the bracket trick (`pgrep -f '[w]atch-render.sh'`) or the PID you recorded.

Provenance: generalised from the "Nova, Episode 1" session's `watch-sd.sh` (Oct 2026). That script counted the
pieces of one scene only and never stopped before the Monitor's 30 minutes. Tested here on a finished cut (DONE,
exit 0) and an unfinished one (REARM, exit 3), and again after the `--plan` change (DONE on the v4 David cut).
`--block` is a plain passthrough (argument parsing and `bash -n` checked; not run against helper branches).
