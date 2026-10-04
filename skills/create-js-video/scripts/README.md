# scripts/

Generic helpers that every code-rendered film rebuilds. Each has a header comment with its full usage and a short
`<name>.md` beside it. None of them writes inside the skill folder. Provenance: generalised from the "Nova, Episode 1"
project (repo `ClaudeCloud`, branch `claude/cosmic-david-goliath-film-cmezxu`, October 2026) unless marked new.

| Script | What it is for | Needs |
|---|---|---|
| `pipeline/` (`config.mjs`, `fingerprint.mjs`, `render.mjs`, `chunk.mjs`) | The frame pipeline: content fingerprints, the headless-Chromium frame renderer, the distributed piece render and assembly. Copy into the project's `tools/` and commit. | Node 18+, `playwright-core`, Chromium, ffmpeg |
| `restore-from-branches.py` | Rebuild `dist/` render pieces from helper branches; merge block records; prefer the wanted fingerprint. | git, Python 3 |
| `watch-render.sh` | Collector loop for a distributed render (Monitor-friendly): restore, status, count missing + stale, DONE / FAIL / REARM. | bash, the two above |
| `watch-log.sh` | Wait on any log for success or failure (filters match failures too), with REARM before the 30-minute Monitor limit. | bash |
| `helper-prompts.py` | Prompts and `create_session` arguments for parallel render helpers: full SHA, cost-balanced ranges, own outcome branches. | git, Python 3 |
| `contact-sheet.py` | Frame-accurate labelled contact sheets or motion strips of an encoded video (ffmpeg tile). | ffmpeg |
| `loudness-rebalance.py` | Measure "X% louder/quieter" on the normalised mix relative to the rest of the film; suggest the next raw gain. | ffmpeg, Python 3 |
| `encode-copy.py` | Delivery copies under a size cap: `chat` (30 MiB, 720p) and `github` (under 100 MB, 1080p), with checks. | ffmpeg, Python 3 |
| `publish-downloads.sh` | Publish films on an orphan downloads branch via git plumbing (no checkout), files under 100 MB. | git, bash 4 |
| `freeze-version.sh` | Freeze `plans-vN/` and prove every frozen version rebuilds byte for byte. | git, bash, the project's plan builder |
| `notes-to-version.py` | Turn the director's numbered notes (timecode, frame, shot, pin) into the next version's work list. | Python 3 |
| `robust-media-loader.js` | Browser module: load review clips with timeouts, retries, blob fallback and a stall watchdog. | a browser |

Scripts the director's existing skill already ships (`validate_plan.py`, `verify_video.py`, `audio_map.py`) are not
duplicated here; `pipeline/chunk.mjs assemble` looks for `verify_video.py` in the project's `tools/` and then in this
folder's parent `scripts/`.

Tested on the Nova repository (Oct 2026): the fingerprints match the original on all 19,978 frames of five plans;
`chunk.mjs status` output is identical to the original's for three plans; restore, watch, freeze, helper prompts,
contact sheets, both encode targets, the loudness measurement and the loader (healthy, range-less, flaky, hanging and
dead hosts) were run against real files. `watchdog()` in the loader and `publish-downloads.sh` beyond `--dry-run`
were not exercised.
