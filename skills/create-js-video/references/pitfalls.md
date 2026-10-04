# Pitfalls: what went wrong, and how to avoid it

Each item is a real event from "Nova, Episode 1" or a defect found in its code, with the fix. Grouped by where it
bites.

## Contents
1. Determinism and fingerprints
2. Rendering and the frame cache
3. Helper sessions and branches
4. Local state and the container
5. Shell, background jobs and monitors
6. Audio
7. Review and delivery
8. Picture and taste
9. Docs and code drift

## 1. Determinism and fingerprints

- **An engine or font change invalidates everything**, as does a `main.js`/`index.html` edit, a grid refit, or a
  plan global-field change. Late in a project, add a scene module or use plan params instead.
- **Editing a shared scene library stales every shot of that scene**, in every cut and version, and also the
  dissolve partner of any of those shots. The no-hands edit to the studies module made the delivered v3 studies
  pieces stale. Isolate late changes in a new module, or route them through presets.
- **Prose in the plan's global fields re-renders everything.** `format` and `defaultPost` are hashed into every
  frame, and Nova's `format.note` holds a sentence ("9:16. A 3:4 window ..."): editing that note would invalidate
  every frame of every cut. Keep prose in shot `purpose/action/framing/note` (not hashed) or in a top-level field
  the fingerprint doesn't read.
- **Scenes reading `E.plan`** (version, id, cut) render different pixels under the same fingerprint. Put those
  differences in the shot's `preset`/`params`, or declare the field in `planFieldsInGlobal`. A latent example in
  Nova: `src/scenes/statue.js` `defaultFigure()` falls back to `plan.cut || plan.id` when a shot has no
  `params.figure`. It is safe only because `build_plan.mjs` writes `params.figure` on every statue shot (checked on
  M01 in all three plans). Throw when a required param is missing instead of guessing from the plan.
- **Assets outside `media/scenes/<id>/`** are not fingerprinted. Assets that fail to load silently produce wrong
  "final" frames. Keep assets in their scene's folder and throw in `preload`.
- **Hidden randomness**: `Math.random`, `Date`, `performance.now()` in pixel paths, accumulated particle state, and
  canvas state leaking between frames (`ctx.reset()` every frame). Grep before each final.
- **Byte-identical pieces under new fingerprints** are normal after a module edit that didn't change a drawing.
  They are not a corruption.

## 2. Rendering and the frame cache

- **The frame cache is keyed by frame index**, not by content. Two cuts rendered into one folder overwrite each
  other's differing frames, and two concurrent renders into one folder race. Give each concurrent render its own
  `--frames` folder.
- **Changing sources mid-render** records pieces as stale, correctly: those frames must render again. Don't edit
  scenes while a final render is running; queue the notes (`docs/NEXT-VERSION.md`).
- **SwiftShader is slow.** Measure costs per shot before promising a time; heavy shots ran 1.4-2 s per frame. Other
  renders on the same machine inflate benchmark numbers.
- **A page written from scratch misses three contract details.** `?plan=` is relative to the repository root (a page
  in `src/` fetches `'../' + plan`, or gets a 404). `render.mjs sheet`/`strip` copy `document.querySelector('canvas')`,
  so the output canvas must come first. `renderFrame` must return an integer `ms`: the original `chunk.mjs costs`
  parsed nothing from `12.5ms` and wrote an empty `costs.json` without an error (the skill's version fails loudly).
  `assets/starter/src/` gets all three right. Time `ms` after a 1-pixel `readPixels`: Chromium's `finish()` doesn't
  wait, and lazy WebGL then times at 0 ms.
- **The open-source Chromium has no H.264.** Test review pages with VP9 (`--codec vp9`) locally, but publish H.264.
- **`tools/encode.mjs`** (the legacy single-machine mux) hard-codes paths and muxes AAC at 320k with the default
  coder, which overshoots true peak by 1-2 dB. Don't deliver with it.

## 3. Helper sessions and branches

- **Short SHAs fail** (`ref_not_found`). Pass the full 40-character SHA, and make sure it is pushed.
- **A helper only follows its initial prompt.** You cannot redirect it. Interrupt and archive moot helpers, then
  start new ones.
- **A helper range runs 25-30 minutes; a foreground command is cut off at 10.** A prompt that runs the render in the
  foreground and says "if a command fails, run it once more, then stop" gets two timeouts and a helper that stops
  with its range unfinished. `helper-prompts.py` starts the render with `nohup` in the background, polls the log,
  counts tool timeouts as normal, and re-runs the same command until `status` is final.
- **Unattended helpers need a permission mode that runs Bash.** `create_session` inherits your mode when
  `permission_mode` is left out, and can't be more permissive than yours. `plan` blocks on an approval nobody gives.
- **Reused outcome branch names** reject the helper's push (the branch has other history). Use fresh tags.
- **Git-ignored `dist/`** needs `git add -f` (`chunk.mjs --push` does it).
- **Ranges balanced by frame count** leave one helper with most of the statue frames. Balance by measured cost.
  The original `chunk.mjs plan` could still give one helper nearly twice another's work; the skill's version uses an optimal
  partition.
- **"Done" must count stale pieces too.** A helper that started from an older commit produces stale pieces.
- **No collector or restore script was ever committed on Nova**: it lived in a scratchpad. Copy
  `restore-from-branches.py` and `watch-render.sh` into `tools/` together (the watcher calls the restore from its own
  folder) and commit them.
- **A restore without the current block grid brings back old layouts.** Helper branches keep pieces of earlier
  versions' blocks (a v3 `chunk_03840_03917` beside a 4025-frame v4 film whose last block is `03840_04025`).
  `chunk.mjs render` cleans only files under current block names, so they stay and get committed by the next
  `git add -A -f`. The restore now requires `--want` (from `status --json`) or `--plan`.
- **A local `render --push` commits about 1 GB per cut and version** to whatever branch is checked out, the PR branch
  included. Render locally from a worktree on a dedicated `<base>-local` branch.
- **The old ad-hoc restore** kept the local `.mp4` while merging a branch's record entry, which can pair a picture with
  the wrong fingerprint. Pair them (`restore-from-branches.py` does).

## 4. Local state and the container

- **The container can restart from an old snapshot.** Untracked files vanish: frame caches, dist pieces, masters,
  mixes, review builds, scratchpad scripts.
  - Push every piece to a branch as it finishes.
  - Keep tools and scripts in git.
  - Keep a restore script, and publish finished films on the downloads branch at once.
- **A master is about 1 GB** (944 MB for 2:48 at crf 17 grain). Never commit it to a normal branch. Copies go to the
  downloads branch (under 100 MB) or to chat (under 30 MiB).

## 5. Shell, background jobs and monitors

- **`pkill -f <pattern>` killed its own shell** (exit 144): the pattern matched the command line of the shell that
  ran it. Kill by PID (`kill <pid>`, from `$!` or `pgrep -f` checked first).
- **Editing a bash script while it runs corrupts the run.** Bash reads scripts incrementally. Write a new file, or
  wait for the run to finish.
- **Monitors die after 30 minutes.** Re-arm them. The skill's watchers exit with `REARM` at 28 minutes.
- **A watcher whose filter matches only success** sits silent on a crashed job. Match `DONE|FAIL|REARM`, error words,
  and the disappearance of the PID.
- **Background jobs need an explicit last line** (`echo "STEP exit=$?"`), or a watcher can't tell finished from
  crashed.
- **A done pattern that matches a step's line fires early.** With `exit=0|wrote ` as the done pattern, a chain of
  assemble then verify was reported DONE on assemble's `wrote ...` line while verify had not run. End chains with
  `echo "ALL DONE"` and wait for that (`watch-log.sh`'s default). Its default fail pattern skips the `[page] ...`
  console warnings `render.mjs` copies into logs, which are not fatal.

## 6. Audio

- **Raw gain changes are swallowed** by limiters and loudness normalisation. "X% louder" must be measured on the
  normalised final mix, relative to the rest of the film. The first try moved the balance about 1 dB instead of
  about 3, and Nova needed four renders, without a calibration tool. With `loudness-rebalance.py` expect 2-3.
- **Short-term maxima barely move** in a limiter-bound section. Say which statistic you measured.
- **AAC at 320k with the default coder** overshot the true peak above 0 dBTP. Mux at 512k with `-aac_coder fast`, and
  re-check the true peak of every re-encoded copy.
- **Web Audio renders are not bit-identical** (float-rounding differences at about -104 dBFS). Don't hash audio for
  caching.
- **The default mix follows the root plan.** Assembling another version needs `--audio out/audio-vN/mix.wav`, and the
  verifier refuses a reference mix of the wrong length.
- **`assemble` does not check loudness.** Always run `render-audio.mjs --verify` on muxed files.
- **A missing structural verifier looked like success.** The original `assemble` printed "no verify_video.py found"
  and exited 0. `verify_video.py` and `validate_plan.py` now ship in `scripts/pipeline/`, and `assemble` fails
  without them.

## 7. Review and delivery

- **Videos "sometimes don't load".** The committed loader had no timeouts, retries or watchdog. Use
  `robust-media-loader.js`.
- **Edit Room version ids collide** (`david`, `david-4`). Notes re-home if `--cuts` is reordered. Key cuts by
  `plan.id`.
- **Hosting limits**: 15 MB per file, 64 MB per publish, 256 MB per version. The builder doesn't check the 256 MB
  total.
- **Chat attachments over 30 MiB fail; GitHub refuses files over 100 MB.** Use `encode-copy.py`.
- **The container's network may block a site** the WebFetch tool can still reach. WebFetch saves binaries to a file.
- **Interim cuts must say they are interim**, in the file name and on the Edit Room label.

## 8. Picture and taste

- **"The hands look weird just do no hands."** Hands were removed from the David cut's studies, but the Prometheus
  cut's `F30.3-chains` study still draws a forearm and a fist (frames 2144 and 2150), and it is **still open** at the
  pinned commit, with `studies-hand.js` orphaned, a `HAND = false` branch kept and a preset comment that still says
  "the fist on the left third". The fix and its re-render cost are in picture-craft.md §1. Audit every cut's variant
  of a study (`notes-to-version.py` lists them), delete dead hand-drawing code, and fix descriptive text that still
  mentions a hand.
- **White flashes were rejected.** Use dark dips and a dark climax.
- **Varied cinematic angles on a recurring motif read worse** than one locked angle where only the subject changes.
- **Restyling approved photography during a format change.** Recompose through framing only.
- **A top light can drown a face** (David's curls). Light each figure for its face.

## 9. Docs and code drift

- Nova's `README.md` still described v2/v3 after v4 was live, and several tool headers described older layouts (two
  cuts, single-file blocks, a 320k mux). Update the README and the headers in the same commit as the behaviour.
- A comment that still mentions a removed element ("the fist on the left third") invites someone to restore it.
- Freeze each delivered version's plans before starting the next. Nova's delivered v4 had no `plans-v4/` while v5
  work could have begun.
