# helper-prompts.py

Writes one self-contained prompt per render helper session, plus the `create_session` arguments: `source_url`,
`source_revision` (the full SHA) and `outcome_branch` (`<base>-<tag>`). Ranges are balanced by what their frames
cost.

```bash
node tools/chunk.mjs status --plan film-plan.json --json > out/status.json
python3 scripts/helper-prompts.py --plan film-plan.json --parts 6 \
    --log 'out/frames-*/render-log.jsonl' --scene-cost statue=1400 --status-json out/status.json
python3 scripts/helper-prompts.py --plan film-plan.json --parts 3 --only-scenes statue --tag-prefix st --json
```

Built-in guards from the Nova lessons:
- **Full SHA only.** The script resolves `--rev` (default `HEAD`) to 40 hex characters and refuses a commit that no
  remote branch contains. Helpers clone from the remote, and short SHAs failed with `ref_not_found`.
- **Fresh outcome branches.** It refuses a branch name that already exists on the remote, because the helper's push
  would be rejected. Pick a new `--tag-prefix`.
- **Cost balance.** It uses an optimal linear partition of the 240-frame block grid. Per-frame cost comes from
  `--costs` (shot ms), then `--scene-cost`, then the render-log medians, then `--default-ms`. Dissolves count ×1.9.
  With `--status-json`, final pieces cost nothing. With `--only-scenes`, other scenes cost nothing.
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

After launching: watch with `watch-render.sh --branches '<base>-<prefix>*'`. A helper only follows its first prompt,
so if its work became moot, interrupt and archive it, then start a new helper for any new work.

Provenance: new for the skill; it encodes the "Nova, Episode 1" helper practice (Oct 2026). Tested on the Nova plans:
pending-only ranges for v3, statue-only ranges, the branch-clash refusal, and (after the background-render change)
the generated prompts for 3 full-film parts and 2 statue-only parts. A helper running the new prompt end to end was
not exercised.
