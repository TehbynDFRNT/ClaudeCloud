# helper-prompts.py

Writes one self-contained prompt per render helper session, plus the `create_session` arguments: `source_url`,
`source_revision` (the full SHA) and `outcome_branch` (`<base>-<tag>`). Ranges are balanced by what their frames
cost.

```bash
node tools/chunk.mjs status --plan film-plan.json --json > out/status.json
python3 $SKILL/scripts/helper-prompts.py --plan film-plan.json --parts 6 \
    --log 'out/frames-*/render-log.jsonl' --scene-cost statue=1400 --status-json out/status.json
python3 $SKILL/scripts/helper-prompts.py --plan film-plan.json --parts 3 --only-scenes statue --tag-prefix st --json
# a 4K master plan (72-frame blocks): a measured default cost, since no 4K render log exists yet
python3 $SKILL/scripts/helper-prompts.py --plan film-plan-4k.json --parts 14 --default-ms 9500 --tag-prefix hd --json > hd-helpers.json
```

Built-in guards from the Nova lessons:
- **Full SHA only.** The script resolves `--rev` (default `HEAD`) to 40 hex characters and refuses a commit that no
  remote branch contains. Helpers clone from the remote, and short SHAs failed with `ref_not_found`.
- **Fresh outcome branches.** It refuses a branch name that already exists on the remote, because the helper's push
  would be rejected. Pick a new `--tag-prefix`.
- **Cost balance.** It uses an optimal linear partition of the block grid. Per-frame cost comes from `--costs`
  (shot ms), then `--scene-cost`, then the render-log medians, then `--default-ms` (1000). Dissolves count ×1.9.
  With `--status-json`, final pieces cost nothing. With `--only-scenes`, other scenes cost nothing. For a new frame
  size, measure first and pass `--default-ms`: 4K in SwiftShader costs about 9-10 s a frame on a 4-core container,
  about 3x 1080p. Nova's 2160x3840 master used `--default-ms 9500`: 14 ranges of 288 frames (4 blocks), about
  46 minutes each (53 for the heaviest). `chunk.mjs plan` without a costs file assumes 1,500 ms a frame and
  estimated 110 minutes in all, useless for planning.
- **The plan's block length.** The grid and the prompt use the block length `chunk.mjs` renders with:
  `plan.block`, else `film.config.json` `block`, else 240. `--block` may only restate it: `chunk.mjs render` refuses
  range edges that are not multiples of the block (`--from/--to must be multiples of 72`), and 240 is not a multiple
  of 72, so a contradicting `--block` is an error. The prompt says "the pieces of each 72-frame (3 s) block"; it used
  to say "each 10 s block" whatever the plan.
- **A prompt for an agent you can't redirect.** Each prompt gives exact commands and the checkout check. The helper
  must not edit files, must stop and report on any surprise, and must keep its replies short.
- **A render longer than a tool call.** Ranges come out at 25-30 minutes (26.7 / 29.0 / 26.3 in a dry run on Nova),
  and a foreground command is cut off at 10. The prompt starts the render as
  `nohup sh -c '<cmd>; echo "RENDER exit=$?"' > out/render-<tag>.log 2>&1 &`, has the helper poll the log (or watch
  it with Monitor), says its own tool timeouts are not failures, and re-runs the same command (it resumes) until
  `status` shows the range final, at most 3 runs. Only two runs ending in a non-zero `RENDER exit=` make it stop
  and report. `--cmd` may not contain single quotes.
- **Permission mode.** The `create_session` arguments leave `permission_mode` out, so each helper inherits yours
  (it can't be more permissive). The helper must run Bash unattended. `--permission-mode <mode>` adds one; `plan`
  is refused, because it blocks on an approval nobody gives.

Before generating: commit and push the engine, tool and plan changes the render needs. The helpers check out the
exact full SHA, so anything unpushed is missing on every one of them.

Launching: call `create_session` one helper at a time (or in small groups) and record each returned session id. On
Nova a batch of 7 parallel `create_session` calls never returned until a worker restart 46 minutes later, and only
one helper existed afterwards; one call at a time took about 7 s each, all succeeding. After any restart, check what
exists before relaunching (`list_sessions`, `git ls-remote origin 'refs/heads/<base>-<prefix>*'`), so two helpers
never share an outcome branch.

After launching: watch with `watch-render.sh --branches '<base>-<prefix>*'`. Check piece sizes on a helper branch
without restoring anything:
`git fetch -q origin <branch> && git ls-tree -r -l origin/<branch> -- dist/<id> | awk '{printf "%s %.1fMB\n", $5, $4/1e6}'`.
A helper only follows its first prompt, so if its work became moot, interrupt and archive it, then start a new
helper for any new work.

Provenance: new for the skill; it encodes the "Nova, Episode 1" helper practice (Oct 2026). Tested on the Nova plans:
pending-only ranges for v3, statue-only ranges, the branch-clash refusal, and (after the background-render change)
the generated prompts for 3 full-film parts and 2 statue-only parts. After the block change: `film-plan-4k.json`
(`block: 72`) with `--parts 14 --default-ms 9500` gives 14 ranges of 288 frames at 46.2 minutes (one at 53.1) and
"each 72-frame (3 s) block"; `--block 240` on that plan is refused; `film-plan.json` (no `block`) keeps the 240 grid
and "each 240-frame (10 s) block". Nova's 14 4K helpers ran a prompt generated by the older version of this script
(passing `--block 72` by hand) and pushed their ranges. A helper running the newest prompt was not exercised.
