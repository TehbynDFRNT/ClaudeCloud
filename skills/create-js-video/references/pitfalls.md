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
- **An engine edit stales the delivered cut even when its pixels don't change.** Nova's HD-master engine (`uK`
  scaling, hd-master.md §1) kept the 1080 output byte-identical where the shaders compile alike, but at HEAD
  `chunk.mjs status --plan film-plan.json` reads `0/17 blocks final` for the delivered David v4: the fingerprint
  hashes file contents. Make engine changes for a new master on a separate commit (or worktree) after the 1080p
  deliverables are frozen, keep the delivered file and its tag, and don't re-render the delivered cut unasked.
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
- **Font-load timing changes text measured at render time.** A scene that centres a line with `ctx.measureText`
  measures the fallback face in a worker whose webfont loaded late, and the line jumps between pieces: the
  fingerprint can't see it. Measure once in Chromium and hard-code the width (picture-craft.md §8; Nova's "A king is
  crowned" is 407 px at the 64 px base).
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
- **A branch glob git can't use as a refspec fetched nothing, and nobody noticed.** `--branches '<base>-hd[0-9]*'`
  became `+refs/heads/<base>-hd[0-9]*:...`. Git rejects `[...]`, `?` and a second `*` in refspecs. The old restore
  only warned, then restored from the 2 branches already fetched by hand. Nova's 4K finisher showed "2/56 blocks
  final" while all 14 helper branches were on origin. The restore now resolves such globs with
  `git ls-remote --heads` plus fnmatch, and treats a failed fetch as an error. Check a stuck collector with
  `git ls-remote` against `git branch -r`.
- **A restore on the wrong block grid restores nothing.** With `--plan`, the old restore took the block length from
  `--block` or `film.config.json`, never from the plan's own `block`, so every piece of Nova's 72-frame 4K plan was
  "obsolete" unless `--block 72` was passed, and `watch-render.sh` could not pass it. Both now follow the plan
  (fingerprints-and-distributed-render.md §9).
- **Range edges must be multiples of the plan's block.** `helper-prompts.py --block 240` against a 72-frame plan
  gives ranges `chunk.mjs render` refuses (`--from/--to must be multiples of 72`). The script now reads the plan's
  block and refuses a contradicting `--block`.
- **Parallel `create_session` calls can hang.** A batch of 7 issued together never returned until a worker restart
  46 minutes later, and only one helper existed afterwards. Launch helpers one at a time and record each session id.
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
- **A worker restart is not a snapshot reset.** At 07:29 Nova's session worker restarted and `uptime` said "up 1
  min": the VM rebooted. Files survived (the repository, `tmp/`, the scratchpad), but every background process died
  (the local `http.server` for site captures, renders, watchers) and in-flight tool calls never returned. After
  one: list helpers and branches before relaunching (`list_sessions`, `git ls-remote origin 'refs/heads/<base>-*'`),
  restart local servers, re-arm watchers, and re-check background jobs by PID.
- **A master is about 1 GB** (944 MB for 2:48 at crf 17 grain). Never commit it to a normal branch. Copies go to the
  downloads branch (under 100 MB) or to chat (under 30 MiB).

## 5. Shell, background jobs and monitors

- **`pkill -f <pattern>` killed its own shell** (exit 144): the pattern matched the command line of the shell that
  ran it. Kill by PID (`kill <pid>`, from `$!` or a bracketed `pgrep -f`).
- **`pgrep -f` matches its own shell too, so liveness checks lie.** `pgrep -f "http.server 8799" >/dev/null ||
  start_server` matched the shell running that very line, decided the server was up, and the next step got
  `ERR_CONNECTION_REFUSED`. Use the bracket trick (`pgrep -f '[h]ttp.server 8799'`, `ps -eo pid,args | grep
  "[f]inish-hd.sh"`), or better, probe the port itself
  (`curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:8799/`), and kill by the PIDs you found.
- **`run_in_background` commands are capped at 2 hours** (timeout at most 7,200,000 ms). A finisher that waits up to
  3 hours for helpers and then encodes would be killed. Run it fully detached,
  `setsid nohup <script> > tmp/<name>.log 2>&1 < /dev/null & disown` (a plain `nohup ... &` from the tool shell is
  less robust), and arm a separate watcher that ends only on a terminal line:
  `until grep -qE 'FINISH-DONE|FAIL' tmp/<name>.log; do sleep 30; done; tail -20 tmp/<name>.log`. Re-arm the watcher
  if it hits its own cap. The finisher's shape is in hd-master.md §8. A scratchpad copy of the script survives a
  worker restart, not a container reset: keep it in the repository.
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
- **Audio renders are not reproducible, so the approved mix WAV is the master.** Two renders of identical code
  differed by up to -74.4 dBFS peak (-104.1 dBFS RMS; the skill used to quote -104 as the peak). A re-render of
  Nova's approved stereo mix with unchanged score code (commit 7717051) differed from the approved
  `out/audio-v4/mix.wav` by up to -44.6 dBFS peak (-69.4 dBFS RMS, 3.24 M samples over -80 dB, the first at
  8.401 s). The likely amplifiers are the iterative calibration loops (the cannon approach law re-renders its stem
  over passes; the master loudness loop runs 4), which can settle on slightly different gains; the cause was not
  isolated. Mux every later deliverable from the approved WAV, never from a fresh render; treat re-renders (and a
  binaural mix) as variants; don't promise a bit-identical stereo mix; and don't hash audio for caching. To show a
  code change left stereo alone, render twice and compare the change against the run-to-run spread, not against
  zero.
- **`render-audio.mjs` writes only under `out/`.** `--out tmp/audio-check` failed after a full 4-minute render with
  `403 only under out/`.
- **The default mix follows the root plan.** Assembling another version needs `--audio out/audio-vN/mix.wav`, and the
  verifier refuses a reference mix of the wrong length.
- **`assemble` does not check loudness.** Always run `render-audio.mjs --verify` on muxed files, on **every**
  audio track: an alternate binaural track needs its own verify against the binaural mix (audio.md §8). A WAV
  measured at -16.0 LUFS says nothing about its AAC copy, and a decode-and-duration check is not a sound verify.
- **Every re-encode needs the mux lessons again.** Nova's first 4K finisher draft muxed the HD deliverables with the
  default AAC settings and `-shortest`; the coordinator restored AAC 512k `-aac_coder fast` and `-t 167.708`.
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
- **Chat attachments over 30 MiB fail; GitHub refuses files over 100 MB.** Use `encode-copy.py`, or split bigger
  files into parts (`publish-downloads.sh --split`).
- **`split -b 95m` makes MiB parts.** `m` is 1,048,576 bytes, so each part is 99,614,720 bytes, over the
  99,000,000-byte publish guard: every publish would have failed. Use decimal, `split -b 95000000 -d -a 2`.
- **GitHub releases are refused in a Claude Code session.** `gh api -X POST repos/<o>/<r>/releases` returns HTTP
  403 ("Creating, editing, or deleting releases is not permitted for this session type"), and `gh release list`
  fails because gh uses GraphQL ("not available from Claude Code sessions; use the REST API"). Files over 100 MB go
  on the downloads branch as parts, with `SHA256SUMS` and join instructions (delivery.md §4).
- **A push is not a deploy.** Nova's site was a direct Vercel upload: fixes pushed to both branches were not live,
  although the user was "Pretty sure if you push it goes live". Verify the live build by its bytes (`cmp` the live
  `index.html` with `git show <c>:...`, compare the video's `Content-Range` total) and say exactly which build is
  live (website.md §6).
- **The container's network may block a site** the WebFetch tool can still reach. WebFetch saves binaries to a file.
- **Interim cuts must say they are interim**, in the file name and on the Edit Room label.

## 8. Picture and taste

- **"The hands look weird just do no hands" applies to every cut the director revisits; know which cuts those
  are.** He had chosen David as the only cut to revisit ("Apply those notes transpose only to David only re render David
  I have chosen it to be the only one we will revisit the others later", 03:34), and the hands note (04:14) came in
  that David-only round. So the David cut has no hands from v4 on (v4.2 and the 4K master included), checked on
  rendered frames, while the Prometheus and Sol cuts are deferred, not missed. Their open items: Prometheus's
  `F30.3-chains` still draws a forearm and a clenched fist (`studies-cuts.js` line 264 and lines 343-414 at the
  pinned commit), and every delivered film older than commit 853008d still shows hands (the fire study's fist in
  `S10-prometheus` in v2 and v3 of all three cuts, David's sling fist in his v2/v3, the chains fist in
  Prometheus). A grep of the Sol cut's own study code finds no hand. Don't re-render a deferred cut unasked; record
  its violations as open items, and when it comes back, run `notes-to-version.py` across all plans and apply the
  standing rules first (picture-craft.md §1).
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
- **A point release under the same id replaces the delivered version's pieces.** Nova's v4.2 (commit c5c7046) changed
  David's S29b through a param but kept the id `david-916-v4`, so its pieces replaced the delivered v4's in
  `dist/david-916-v4/`, and with no `plans-v4/` the pre-4.2 v4 can now be rebuilt only from a commit before
  c5c7046. Freeze vN first, then give the point release its own id (`PLAN_VERSION` 4.2 → `<cut>-v4.2`, or bump to
  v5): director-notes-loop.md §4.
- Comments that still name a removed element: David's `sling()` in `src/scenes/lib/studies-cuts.js` still says the
  cords "leave the fist" and the path lifts "over the forearm" (lines 145, 156, 194) although no hand is drawn. Fold
  the comment fix into the next studies edit: it changes the module's hash like any other edit.
