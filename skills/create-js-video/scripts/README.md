# scripts/

Generic helpers that every code-rendered film rebuilds. Each has a header comment with its full usage and a short
`<name>.md` beside it. None of them writes inside the skill folder. Provenance: generalised from the "Nova, Episode 1"
project (the director's `ClaudeCloud` repository, October 2026; pinned commit in
`references/reference-implementation.md`) unless marked new.

Copy what the film runs repeatedly into its `tools/` and commit it there: `pipeline/*` (always), and
`restore-from-branches.py` with `watch-render.sh` (together: the watcher calls the restore from its own folder).
A tool that lives only in the skill folder or a scratchpad is missing on a helper and lost on a container reset.

| Script | What it is for | Needs |
|---|---|---|
| `pipeline/` (`config.mjs`, `fingerprint.mjs`, `render.mjs`, `chunk.mjs`, `verify_video.py`, `validate_plan.py`) | The frame pipeline: content fingerprints, the headless-Chromium frame renderer, the distributed piece render and assembly, the structural verifier and the plan validator it imports. Copy into the project's `tools/` and commit. | Node 18+, `playwright-core`, Chromium, ffmpeg, Python 3 |
| `restore-from-branches.py` | Rebuild `dist/` render pieces from helper branches for the current block grid (`--want` or `--plan`); merge block records; prefer the wanted fingerprint. | git, Python 3 |
| `watch-render.sh` | Collector loop for a distributed render (Monitor-friendly): restore, status, count missing + stale, DONE / FAIL / REARM. | bash, the two above |
| `watch-log.sh` | Wait on any log for success (`ALL DONE` by default) or failure, with REARM before the 30-minute Monitor limit. | bash |
| `helper-prompts.py` | Prompts and `create_session` arguments for parallel render helpers: full SHA, cost-balanced ranges, own outcome branches, the render in the background. | git, Python 3 |
| `contact-sheet.py` | Frame-accurate labelled contact sheets, motion strips and before/after pairs of an encoded video (ffmpeg tile). | ffmpeg |
| `loudness-rebalance.py` | Measure "X% louder/quieter" on the normalised mix relative to the rest of the film; suggest the next raw gain. | ffmpeg, Python 3 |
| `encode-copy.py` | Delivery copies under a size cap: `chat` (30 MiB, 720p) and `github` (under 100 MB, 1080p), with checks. | ffmpeg, Python 3 |
| `publish-downloads.sh` | Publish films on an orphan downloads branch via git plumbing (no checkout), files under 100 MB. | git, bash 4 |
| `freeze-version.sh` | Freeze `plans-vN/` and prove every frozen version rebuilds byte for byte. | git, bash, a builder honouring `PLAN_VERSION` and `PLAN_OUT` |
| `notes-to-version.py` | Turn the director's numbered notes (timecode, frame, shot, pin) into the next version's work list, scoped over every cut's plan. | Python 3 |
| `robust-media-loader.js` | Browser module: load review clips with timeouts, retries, blob fallback and a stall watchdog. | a browser |

`pipeline/verify_video.py` and `pipeline/validate_plan.py` are copies of the director's existing skill's
`scripts/verify_video.py` and `scripts/validate_plan.py` (identical to the Nova project's `tools/`). They ship here so
this skill runs on its own: `chunk.mjs assemble` runs the verifier beside it (or in the project's `tools/`) and fails
when it is missing. `audio_map.py` stays in the existing skill.

Tested on the Nova repository (Oct 2026): the fingerprints match the original on all 19,978 frames of five plans;
`chunk.mjs status` output is identical to the original's for three plans; restore, watch, freeze, helper prompts,
notes, contact sheets, both encode targets, the loudness measurement and the loader (healthy, range-less, flaky,
hanging and dead hosts) were run against real files. The starter (`assets/starter/`) was rendered, assembled and
verified end to end with the pipeline. `watchdog()` in the loader, `publish-downloads.sh` beyond `--dry-run`, and a
helper session running the generated prompt were not exercised.
