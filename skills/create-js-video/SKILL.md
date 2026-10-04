---
name: create-js-video
description: Make films and videos entirely in code, from a director's brief through numbered versions to delivery. Frames are JS/WebGL/canvas rendered deterministically in headless Chromium, sound is synthesised and mixed, and ffmpeg assembles. Use whenever the user wants a code-rendered film, a WebGL or canvas video, a music-synced montage, a vertical 9:16 short, a frame-accurate review page with pinned notes, a render farm of parallel helper sessions, or another round of a director's notes. Also use for "make a short film", "render the next version", "the hands look weird", "make the explosion quieter", "send me the final" or "why did everything re-render". Covers frame-addressable engines, plans built from a bar grid, content fingerprints, distributed renders, loudness-calibrated mixes, the Edit Room, versioned plans and size-capped delivery.
---

# Create JS Video: code-rendered films from brief to delivery

Turn a director's brief into a finished film made entirely in code, then improve it in rounds of his notes without
ever losing a delivered version. Everything here was learned making "Nova, Episode 1: David & Goliath": a 2:48
vertical short in three cuts and four versions, with WebGL2 HDR scenes rendered by SwiftShader in headless Chromium,
a score mixed in an OfflineAudioContext, distributed renders on parallel cloud sessions, and a review page for
notes. The detail is in `references/`, the reusable tools are in `scripts/`, a minimal film that runs the whole
pipeline is in `assets/starter/`, and Nova's own code is at a pinned commit (`references/reference-implementation.md`).

## The director's standing rules

These are his notes, applied to every cut and every later version. Read them before drawing anything.
- **No hands.** His words: "The hands look weird just do no hands." Draw no hands, fists, fingers or forearms: not
  stylised, not partial, not holding the prop. Show the object, its path and a diagram instead: the sling's loop and
  cords, the fennel stalk with its ember. Nova's 3D figures never had the problem: they are head and bust scans cut
  above the shoulders. Audit **every cut's** variant before delivery, because cut-specific presets hide extra
  drawings. **Still OPEN in Nova:** the Prometheus cut's `F30.3-chains` study draws a forearm and a fist at the pinned
  commit. The fix (an open, empty cuff and its links) and what it re-renders are in `references/picture-craft.md` §1.
- **No white flashes.** Strikes dip the exposure. The climax goes dark and loud, and the picture emerges from the
  dark.
- **Hold a recurring motif in one locked frame**, and let only the subject change: same angle, same zoom, only the
  figure turns. It reads better than varied cinematic angles.
- **Don't restyle approved photography** when the format changes. Recompose it through the camera framing hook.
- **Act without asking when he has said to.** Keep him posted in short lines, and separate what you verified from
  what you guessed.

## How a code-rendered film fits together

```
brief ─► bar grid (DTW + onset DP on the recording) ─► plan builder (storyboard in bars, PLAN_VERSION, cuts)
      ─► film-plan*.json ─► page: engine + scene modules ─► render.mjs (headless Chromium) ─► frames + fingerprints
      ─► chunk.mjs pieces ─► helper sessions push branches ─► restore/collect ─► assemble + mix ─► verify
      ─► Edit Room review ─► numbered notes ─► next version (frozen plans-vN, new ids) ─► delivery copies
```
One plan feeds the engine, the score, the fingerprints, the review page and the checks. That is why a retime or a
version bump stays consistent everywhere.

## First hour on a new film: a verified clip

1. [ ] Write a compact brief: audience, story, length, aspect (9:16 for phones), fps (24), the recording and its
       rights, must-show content, text, deliverables, and the director's standing rules above.
2. [ ] Make the repository and commit from the first hour: a container restart from an old snapshot deletes anything
       untracked. Get Nova's engine if you can reach it (`references/reference-implementation.md`).
3. [ ] Smoke-test the whole pipeline on the starter's 10 s plan, before any real scene (`assets/starter/README.md`;
       `SKILL` is this skill's folder):
       ```bash
       git init && cp -r $SKILL/assets/starter/. . && mkdir -p tools
       cp $SKILL/scripts/pipeline/*.mjs $SKILL/scripts/pipeline/*.py tools/ && npm i -D playwright-core
       node tools/build_plan.mjs && python3 tools/validate_plan.py film-plan.json
       node tools/chunk.mjs render --plan film-plan.json --from 0 --to 240
       node tools/tone-mix.mjs        # placeholder soundtrack: assemble refuses a silent one
       node tools/chunk.mjs assemble --plan film-plan.json --audio out/audio/mix.wav    # runs verify_video.py
       python3 $SKILL/scripts/contact-sheet.py dist/hello-916-v1.mp4 --count 8 --cols 8 --out out/sheets/smoke.jpg
       ```
       Look at the sheet, then commit. This took about two minutes in the Nova container.
4. [ ] Prove the hardest shot next: build its scene, render it small at the delivery aspect, look at the frames, and
       benchmark it on SwiftShader (`render.mjs bench`; target about 1.5 s per full frame, 3 s at most).

## First day

1. [ ] Fit the bar grid to the actual recording (DTW to a score, then onset DP: `tools/analyze_music.py`,
       `refine_grid.py` at the pinned commit). Label it "signal-derived" until someone has listened.
2. [ ] Grow the builder: storyboard in `at(bar, eighth)`, cuts as presets, versioned ids (`<cut>-v1`), and both
       `PLAN_VERSION` and `PLAN_OUT` honoured (`freeze-version.sh` needs both). Validate every plan.
3. [ ] Grow the engine: readiness barrier, `renderFrame(f)` as a pure function, linear HDR → bloom → ACES → grade →
       grain → letterbox → titles (architecture.md).
4. [ ] Rough the score: placements, cues, one bus per dramatic section, the -16 LUFS / -1 dBTP master (audio.md).
5. [ ] Make a first animatic: a contact sheet of one frame per shot plus a rough mix. Send it early.
6. [ ] Measure costs per shot (`chunk.mjs costs`), so render planning starts from data.

## Build the engine: one frame, one pure function

A frame must depend only on the plan, its index and the sources. That buys out-of-order rendering, parallel helpers,
seamless re-renders of single shots, and fingerprints that know which frames are still valid. Use seeded noise and
stateless hashes, no `Math.random`/`Date`, no state carried between frames, and reset canvas state every frame.
Scenes are modules with per-shot presets. A cut is a different preset id. Portrait reframing is a `portrait` block.
An insert keeps its host's clock with `span`. Light is linear HDR, and titles are composited after tonemapping. The
page contract also fixes three details a page written from scratch gets wrong: `?plan=` is relative to the
repository root, the output canvas is the first `<canvas>`, and `renderFrame` returns an integer `ms`. Details:
`references/architecture.md`.

## Cut on the music

Write the storyboard in musical positions on a bar grid fitted to the performance, and derive frames once in the
builder. Then picture, cues, effects, text and the score all move together when the edit changes. Use measured
onsets for frame-exact hits, and named authored frame counts for beats that are not musical (a dark hold, a stare).
Choose events by musical meaning, not loudness. Generate repeated structures (beat cuts, inserts) from tables. Gate
every structural change by `PLAN_VERSION`. Details: `references/timeline-and-music.md`.

## Render only what changed

Each frame's fingerprint hashes the engine, its scene module tree and assets, the shot's pixel fields, the plan's
global fields, and the active effects and text. A piece whose fingerprint still matches is final. Plan around the
consequences:
- **An engine, font, grid or plan-global change re-renders everything.** That includes prose: Nova's `format.note`
  is hashed into every frame. Keep notes out of `format` and `defaultPost`. Late in a project, add a scene module or
  change presets/params instead. New scenes in the registry invalidate nothing.
- **Editing a shared scene library stales every shot of that scene** in every cut and version. Isolate late changes.
- **A scene must never branch on `plan.version`, `plan.id` or `plan.cut`.** The fingerprint can't see it.
- **The frame cache is keyed by frame index.** Never run two plans into one frames folder at once.

Details: `references/fingerprints-and-distributed-render.md`.

## Render in parallel with helper sessions

Split the film into 240-frame blocks of per-shot pieces. Render ranges on parallel cloud sessions that push to their
own branches, collect them, and assemble by stream copy. Warm helpers are fast: 6 of them turned about 25 minutes of
statue frames into about 4.
1. Push the commit, then generate prompts: `scripts/helper-prompts.py` resolves the **full SHA** (short SHAs fail),
   balances ranges by **measured cost** (statue about 1.4 s/frame, studies 0.7-1 s), and refuses outcome branches
   that already exist. Each prompt starts the 25-30 minute render with `nohup` in the background (a foreground
   command is cut off at 10 minutes), polls the log, treats its own tool timeouts as normal, and re-runs the same
   command until `status` shows its range final.
2. Start each helper with `create_session` (`source_revision` = full SHA, `outcome_branch`, the prompt). Leave
   `permission_mode` out so the helper inherits yours. Never pass `plan`: the helper would wait for an approval
   nobody gives. A helper only follows its first prompt. To change course, interrupt and archive it and start a new
   one.
3. Watch with `watch-render.sh` under the Monitor tool. It restores pieces, counts **missing and stale**, and exits
   DONE, FAIL or REARM. Monitors die at 30 minutes; re-arm them.
4. Assemble only when `status` says every block is final.

## Keep work safe from a container reset

The session container can restart from an old snapshot. When it does, frame caches, pieces, masters, mixes and
scratchpad scripts are gone.
- Copy `scripts/pipeline/*`, `restore-from-branches.py` and `watch-render.sh` into the film repository's `tools/`
  together (the watcher runs the restore from its own folder), and commit them.
- Push every piece to a branch as it renders (`chunk.mjs render --push`). A local `--push` commits about 1 GB of
  pieces per cut and version to the current branch, so render locally from a worktree on a dedicated
  `<base>-local` branch (`git worktree add ../render-local -b <base>-local`, `npm ci` there), never on the PR branch.
- After a reset, rebuild `dist/` with the current fingerprints, so only pieces of the current block layout come back:
  ```bash
  node tools/chunk.mjs status --plan film-plan.json --json > out/want.json
  python3 tools/restore-from-branches.py --branches '<base>-*' --fetch --want out/want.json --plan film-plan.json
  node tools/chunk.mjs status --plan film-plan.json        # then re-render only what is missing or stale
  ```
- Publish finished films on the downloads branch as soon as they pass their checks.

## Sound: mix, measure, verify

Render each stem in its own OfflineAudioContext from the plan's placements and cues. Mix through buses with their own
limiters, and iterate the music gain until the master hits -16 LUFS with true peak ≤ -1 dBTP. Gate each version's
design deltas as `DESIGN.vN`.
- When the director asks for "X% louder/quieter", measure the change on the **normalised final mix, relative to the
  rest of the film**. Limiters and normalisation swallow raw gain: Nova's first try moved the balance about 1 dB
  instead of about 3. Expect 2-3 renders with `scripts/loudness-rebalance.py`; Nova needed four without it. Read
  percentages as amplitude (-15% = -1.41 dB) and tell him the dB figure you used.
- Mux AAC at 512k with `-aac_coder fast`. At 320k the default coder overshot the true peak.
- Run the delivery checks on the muxed file: loudness, true peak, climax, coda, sync.

Details: `references/audio.md`.

## Picture craft

The full list is in `references/picture-craft.md`; these are the headlines:
- Recompose approved 16:9 for 9:16 with `framing { roll, zoom, pan, dolly }`. `roll ±90, zoom 0.5625` is the exact
  rotation.
- Rasterise public-domain 3D scans inside a scene: shadow maps, marble shading, an aura. Crop them above the
  shoulders.
- Run a figure's turn on the **film's** clock: nearly still inside each glimpse, eye contact in the last shot.
  Rotation inside a shot needs per-frame shadow maps.
- Draw procedural ink studies with reveal windows, hatching and a parchment shader, as objects and diagrams.
- Set titles in Cinzel and Cormorant through the titles layer.
- End on a sign-off card: the director's real signature vector revealed by a soft front.

## Review in the Edit Room

Give the director a frame-accurate page: 10 s clips with one soundtrack as the master clock, a timeline of acts,
shots, bars and cues, cuts and versions side by side, and notes pinned to a point on the picture. Nova's page and
builder are at the pinned commit (`src/review/editroom.html`, `tools/build-review.mjs`). Store notes in the artifact
database, a local server or the browser. Load media with timeouts, retries, a blob fallback and a watchdog
(`scripts/robust-media-loader.js`); videos "sometimes don't load" otherwise. Respect hosting limits: 15 MB per file,
64 MB per publish, 256 MB per version. Key cuts by `plan.id`, so two versions of one cut don't collide. Details:
`references/review-edit-room.md`.

## Run a director's notes round

His notes come back as a numbered list with timecode, frame, shot and pin. That list is the main input of the next
version. Full procedure and rationale: `references/director-notes-loop.md`.
1. [ ] Freeze the delivered version: `scripts/freeze-version.sh N`. Commit it and tag the render commit.
2. [ ] Turn the notes into a work list: `scripts/notes-to-version.py notes.txt --next N+1` at the repository root.
       It reads every `film-plan*.json`, so each note lists every cut's variant of the scene it touches. Keep his
       exact words.
3. [ ] Mark standing rules ("no hands") and record them where the next session reads them.
4. [ ] Bump `PLAN_VERSION` to N+1, so the ids become `<cut>-vN+1` and new pieces land in a new `dist/` folder, not
       in the delivered `dist/<cut>-vN/`.
5. [ ] Put each change in the cheapest place: params/preset < new scene module < storyboard < engine. Gate it by
       version (`PLAN_VERSION`, `DESIGN.vN`, new preset ids).
6. [ ] Rebuild, validate, run `freeze-version.sh --check`, then render small stills of every changed shot in
       every cut, and look at them.
7. [ ] Check `chunk.mjs status`: only the expected pieces should be stale. A surprise means something global
       changed.
8. [ ] Sound notes: measure on the normalised mix, recalibrate, then `--verify` the muxed file.
9. [ ] Render the changed pieces (with helpers if large). Send an early cut, labelled interim.
10. [ ] Assemble, verify, make before/after sheets for each note (`contact-sheet.py --before`), and audit the
        standing rules on every cut.
11. [ ] Deliver the copies and the Edit Room build, with a short message saying which notes were verified and how.

## Deliver

Sequence: a structural verify, the sound verify, a contact sheet you have looked at, then copies. The master (about
1 GB) is never what you send.
- `chunk.mjs assemble` runs `verify_video.py` (shipped beside it in `scripts/pipeline/`, with `validate_plan.py`)
  and fails if it is missing. The sound verify is Nova's `render-audio.mjs --verify`.
- `scripts/encode-copy.py --target chat` makes a review copy under 30 MiB (720×1280, crf 23, maxrate 1700k, AAC
  192k, about 27 MiB for 2:45).
- `--target github` makes a download under 100 MB (1080×1920 at about 4 Mbps, about 88-90 MB). Publish it with
  `scripts/publish-downloads.sh` on an orphan branch built with git plumbing.
- Send files as download cards (`SendUserFile`, `display: 'attach'`).
- Send early cuts while finals render, and re-render only the version he chose.
- If the container's network blocks a site, the WebFetch tool can still fetch from it and saves binaries to a file.

Details: `references/delivery.md`.

## Work the way this director works

- **Parallelise aggressively.** Use helper sessions for renders and multi-agent workflows for departments (one
  agent per scene). For creative choices, use judge panels with before/after art-director verification. The recipe,
  with prompt templates and a scoring rubric, is in `references/director-notes-loop.md` §6.
- **Verify everything by looking at rendered frames.** Use contact sheets of the encoded file
  (`scripts/contact-sheet.py`, ffmpeg tile), cut boundaries and motion strips. A passing checker is not a reviewed
  film.
- **Keep him posted in short lines**, such as "13/17 blocks final, 4 helpers, ETA 6 min", and give him files he can
  keep.
- **Say what is confirmed and what is a guess.** Never claim to have watched or heard what you only measured.

## Shell and monitor hygiene

- Kill processes by PID. `pkill -f <pattern>` matched its own shell and killed it (exit 144).
- Never edit a bash script while it runs: the run reads the file as it goes.
- End every background step with a status line (`echo "STEP exit=$?"`), and a chain of steps with `echo "ALL DONE"`.
- Give each watcher a filter that matches failures as well as success. `scripts/watch-log.sh` waits for
  `ALL DONE` by default; a pattern like `exit=0` would fire on the first step of a chain.
- Re-arm Monitors before their 30 minutes run out.

More traps, grouped by area: `references/pitfalls.md`.

## Scripts and templates

| Path | Use |
|---|---|
| `assets/starter/` | a 10 s film that runs the whole pipeline: page contract, engine, one scene, builder, tone mix |
| `scripts/pipeline/` | fingerprint, frame renderer, distributed piece render and assembly, `verify_video.py`, `validate_plan.py`: copy into `tools/` |
| `scripts/helper-prompts.py` | helper prompts and `create_session` arguments: full SHA, cost-balanced ranges, background render |
| `scripts/watch-render.sh` | collector loop: restore, status, missing + stale, DONE / FAIL / REARM |
| `scripts/restore-from-branches.py` | rebuild `dist/` from helper branches for the current block grid (`--want`/`--plan`) |
| `scripts/watch-log.sh` | wait on any log for success or failure, Monitor-friendly |
| `scripts/contact-sheet.py` | labelled, frame-accurate contact sheets, strips and before/after pairs of an encoded video |
| `scripts/loudness-rebalance.py` | "X% louder" measured on the normalised mix, with the next raw gain |
| `scripts/encode-copy.py` | chat (≤30 MiB) and GitHub (<100 MB) copies, with checks |
| `scripts/publish-downloads.sh` | orphan downloads branch via git plumbing |
| `scripts/freeze-version.sh` | freeze `plans-vN/`; prove that frozen versions rebuild byte for byte |
| `scripts/notes-to-version.py` | the director's numbered notes as the next version's work list, scoped over every cut |
| `scripts/robust-media-loader.js` | review-page media loading with timeouts, retries, blob fallback and a watchdog |

Each script has a `<name>.md` beside it with usage, provenance and what was tested. Run them from inside the film's
repository. They never write into the skill folder.

## Reference map

| Read | When |
|---|---|
| `references/reference-implementation.md` | getting Nova's engine, builder, grid fitter, score or Edit Room code |
| `references/architecture.md` | starting a project, writing the engine or a scene, the page contract, performance |
| `references/timeline-and-music.md` | the bar grid, the plan builder, cuts, versions, cues |
| `references/fingerprints-and-distributed-render.md` | why something re-rendered, helpers, collecting, resets |
| `references/audio.md` | the score, the master, loudness notes, mux and audio checks |
| `references/picture-craft.md` | no hands (and the open chains fix), 9:16 recomposition, scans, film-clock turns, ink studies, titles |
| `references/review-edit-room.md` | building and publishing the review page, notes, loaders |
| `references/director-notes-loop.md` | running a notes round, versioning rules, judge panels, how he likes to work |
| `references/delivery.md` | masters, copies, downloads branch, sending files |
| `references/pitfalls.md` | before a final render, before delivery, when something odd happens |
