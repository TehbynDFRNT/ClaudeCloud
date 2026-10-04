# Code-rendered film pipeline: engineering digest

Source: `/home/user/ClaudeCloud`, branch `claude/cosmic-david-goliath-film-cmezxu`, read at commit `ab11dee` (2026-10-04).
I read every file named below. The session learnings are cross-checked against the code in section 11.
Verdicts:
- **CONFIRMED**: the code does this.
- **PARTLY**: true with a material caveat.
- **CONTRADICTED**: the code does something else.
- **NOT IN CODE**: a process lesson, or a tool that does not exist in the repo.

The same section separates what I checked by running something from what I only read.

**The director's standing rule: no hands.** His words: "The hands look weird just do no hands." Section 0 lists where hands still appear.

---

## 0. Open issues found while checking (act on these first)

1. **There is still a hand in the Prometheus cut.**
   - Commit `853008d` removed the fist from the sling study (F29.1, David cut) and from the stolen-fire study (S10, all cuts; `HAND = false` in `src/scenes/lib/studies-prometheus.js`).
   - The Prometheus F30.3 study (`F30.3-chains` → `chains()` in `src/scenes/lib/studies-cuts.js`, roughly lines 343-404) still draws a forearm and a clenched fist with knuckles, tendons and thumb.
   - Verified by rendering `node tools/render.mjs shot F30.3 --n 1 --w 540 --plan film-plan-prometheus.json`. Frame 2144 clearly shows the fist in the cuff.
   - The David and Sol cuts do not use `F30.3-chains`.
   - I checked the David no-hand frames `tmp/sling-nohand/f02040.jpg` and `tmp/s10-nohand/f01303.jpg`: there is no hand in either.
   - Leftovers:
     - `src/scenes/lib/studies-hand.js` is no longer imported by anything. It is dead, and it is not fingerprinted.
     - The comment on the `S10-prometheus` preset in `src/scenes/studies.js` (around line 146) still says "the fist on the left third".
2. **The no-hands change is not gated by `plan.version`.**
   - The studies code is shared by every version, so the v2 and v3 studies frames would now render without hands.
   - Their delivered pieces read as stale. Running `node tools/chunk.mjs status --plan plans-v3/film-plan.json` shows S29a/S29b `stale`.
   - So the delivered *plans* rebuild byte-identically, but the delivered *pictures* reproduce only from the commit they were rendered at.
3. **David v4 status at the time of reading** (`node tools/chunk.mjs status --plan film-plan.json`):
   - 15/17 blocks are final.
   - These pieces are stale: `3214-3294:nova`, `3294-3360:studies` and `3360-3425:studies`. They are S29a-ring, which is inside the dissolve, and S29b-drawing.
   - The cause is the studies module change: the dissolve partner's scene hash is part of S29a's fingerprint.
   - Renders were still being written to `out/frames-1080x1920/` while I read.
4. **`README.md` is stale.**
   - It describes v2/v3 as the live plans (2:43, `out/audio/mix.wav` = 166.083 s).
   - The live `film-plan*.json` are **v4**: 4025 frames = 167.71 s (2:47.7), 73 shots, ending `M16` → `S32-signoff`.
5. **There is no collector script and no restore script in git.**
   - The `--only-scenes` comment in `tools/chunk.mjs` refers to "the collector merges records", but no such tool is tracked.
   - No script rebuilds `dist/` from the helper branches either. See section 7.5.

---

## 1. Repository map

| Path | Role |
|---|---|
| `src/index.html`, `src/main.js` | Page entry. Loads fonts, the plan (`?plan=`), `analysis/grid.json` and each scene's `preload(plan)`. Then exposes `window.renderFrame(f)`, `renderSandbox(...)`, `grab(type, q)` and `planInfo()`, and sets `window.__ready`. `?warm` compiles every scene up front. |
| `src/engine/` | `film.js` (orchestrator), `gl.js` (WebGL2, fullscreen passes only), `glsl.js` (shared GLSL chunks, palette), `post.js` (post pipeline), `math.js` (vectors, cameras, easing, `setFraming`), `music.js` (score position → film time), `noise.js` (128³ RGBA8 noise volume), `rng.js` (stateless hashes, mulberry32), `titles.js` (plan `text`) |
| `src/scenes/index.js` | Scene registry: `redgiant, whitedwarf, binary, studies, vortex, atoms, plasma, nova, void, earthsky, statue, signoff` |
| `src/scenes/<id>.js` + `src/scenes/lib/*` | Scene modules and their private libraries (GLSL, geometry, drawings, statue GL) |
| `src/audio/index.html`, `src/audio/score.js` | Soundtrack: `window.renderAudio({ outDir, stems, only })` |
| `src/review/editroom.html` | Edit Room page template (`__FILM_DATA__` is replaced by `build-review.mjs`) |
| `tools/build_plan.mjs` | Writes `film-plan.json`, `film-plan-sol.json` and `film-plan-prometheus.json` |
| `tools/validate_plan.py` | Checks plan structure and declared sync |
| `tools/analyze_music.py`, `tools/refine_grid.py` | Chroma DTW against the Mutopia MIDI (→ `analysis/music-map.json`), then a DP bar grid (→ `analysis/grid.json`) |
| `tools/fingerprint.mjs` | Per-frame content fingerprints |
| `tools/render.mjs` | Headless Chromium frame renderer (stills, shot, sandbox, bench, strip, sheet, film) |
| `tools/chunk.mjs` | Distributed render: costs, plan, status, render, assemble |
| `tools/verify_video.py` | Full-decode and container checks against a plan |
| `tools/encode.mjs` | Legacy single-machine mux. Not for delivery (section 10) |
| `tools/render-audio.mjs` | Soundtrack render, measurement and `--verify` of muxed files |
| `tools/build-review.mjs`, `tools/editroom-serve.mjs`, `tools/test-editroom*.mjs` | Edit Room package, its localhost server, and the tests |
| `tools/publish-downloads.sh` | Films on a standalone downloads branch via git plumbing |
| `tools/prepare_statues.py`, `tools/fetch_sources.sh` | SMK scan → `media/scenes/statue/<figure>.{json,bin}`; source checksums and the MIDI fetch |
| `plans-v2/`, `plans-v3/` | Frozen delivered plans |
| `dist/<plan.id>/` | Render pieces (git-ignored here; committed on the helper branches) |
| `out/` | Frames, audio, sheets, Edit Room builds (git-ignored) |

---

## 2. Engine contract and scene API

**Determinism (`src/engine/film.js`).**
- `renderFrame(f)` is a function of (plan, f) only.
- No state survives between frames except caches keyed by their inputs. For example, the statue's shadow map is keyed by figure, light and fit.
- `src/engine`, `src/scenes` and `src/audio/score.js` contain no `Math.random`, `Date` or `new Date` (checked with grep).
- `performance.now()` is used only to time frames.

**Scene module** (`src/scenes/index.js` header; `docs/ART-BIBLE.md` "Engine contract"):
```js
export default {
  id: 'studies',                 // must equal the file name src/scenes/<id>.js (the fingerprint hashes that file)
  scale: 1,                      // HDR scene-target scale (0.5-1); a shot may override it with shot.renderScale
  presets: { 'S10-prometheus': {...}, 'F30.3-chains': {...}, default: {...} },
  async preload(plan) {},        // optional, awaited before frame 0; assets live in media/scenes/<id>/ (fingerprinted)
  init(E) {},                    // compile once
  render(E, S, target) {},       // linear HDR radiance into target; never tonemap or clamp
  overlay(E, S, ctx) {},         // optional Canvas2D at output pixels; return 'add' | 'over' | null (null = the shader samples it)
  post(E, S) {},                 // optional per-frame post overrides
};
```

**Parameter resolution** (`Film.state`):
- The parameters are `{...presets[shot.preset || shot.id] || presets.default, ...(portrait ? {...preset.portrait, ...shot.portrait} : {}), ...shot.params}`.
- So cut-specific variants are just a different `preset` id (for example `F29.1-sling`, `F29.1-eagle`, `F29.1-sol`).

**`S`** (the per-frame state):
- Fields: `{ f, t, local, dur, u, fps, W, H, portrait, shot, params, framing, seed }`.
- With `shot.span = [a, b]`, `local` and `dur` are measured over the span, not over `[start, end)`.
- This is how an insert cuts into a host shot without compressing the host's motion. The host resumes as `<id>·2`.
- `local` can fall outside `[0, dur]` during dissolves.

**`E`** (the engine API):
- Fields: `{ G, W, H, fps, plan, music, math, rng, portrait, k, program, camera, target(name, scale, format), draw, overlayCtx, overlayCanvas, overlayTexture(), shotById, S }`.
- `E.k` = short side / 1080. Use it for stroke widths and type.
- `E.draw` scissors frame-shaped targets to the letterbox.
- `E.music.at(bar, eighth)` gives film seconds. `E.music.pulse(t)` gives the current eighth.
- `E.plan` is visible to scenes. That is a fingerprint hazard (section 5).

**Framing hook** (`src/engine/math.js` `setFraming`, `film.js` `framingAt`):
- A preset's `portrait.framing = { roll, zoom, pan, dolly }`, or a keyed list `[[u, {...}, easing], ...]`, reframes every camera built during the shot, exactly once.
- Landscape renders ignore `portrait`.
- Code that rebuilds a camera (drift, shake) must start from `cam.raw` (`docs/PORTRAIT.md`).

**Per-frame order** (`renderFrame`):
1. Effects from `plan.effects`: letterbox, flash, dip, fade, shake.
2. The scene's `overlay()`, on a canvas reset every frame.
3. The scene render into `sceneA`.
4. A dissolve or bleed partner shot into `sceneB`.
5. Post (`post.js`): composite with shake, blur, overlay and mixB; bloom pyramid; anamorphic streak; Hill ACES fit; grade; grain; letterbox; fade.
6. Titles (`titles.js`), composited after tonemapping.

**Titles** (`src/engine/titles.js`):
- Styles: `name`, `credit`, `title` and `line`. Fonts: Cinzel and Cormorant Garamond italic.
- Sizes follow the short side, ×1.3 in portrait.
- Text is shrunk to fit 86% of the frame width.
- Text is a plan item drawn on its own canvas; it is not the scene's `overlay()`.

---

## 3. Plan schema (`film-plan*.json`, written by `build_plan.mjs`)

Top level: `id, cut, title, version, fps ("24/1"), frames, width (1080), height (1920), backend, timingMode, format {letterbox: 0.128, note}, defaultPost, shots, overlays, audio, cues, effects, text, assets, checks`.

**`shots[]`**:
- Fields: `{ id, start, end, scene, preset?, params?, span?, sync?, purpose, action, framing }`. Intervals are half-open, contiguous, and checked for gaps and overlaps.
- `purpose`, `action` and `framing` are descriptive: the fingerprint ignores them, and so does `note`.
- Statue shots carry `params.turn`, `params.figure`, plus the v4 lock params.

**`overlays[]`**: transitions, `{ id, type: 'dissolve'|'bleed', from, to, start, end }`. There is one: `x-ring-to-drawing`, S29a → S29b.

**`audio[]`**:
- `winter-a`: the recording, frames 0-2725, cut at ignition.
- `winter-b`: from the bar-56 downbeat. In v3+ it enters one frame before the explosion frame 2779.
- `score-synth`: generated.

**`cues[]`**:
- Kinds: `orchestral-strike`, `edit-cut` (`ignition`, `dark-end`, `explosion`, `coda`, `coda-star`), `music-reentry`, `bar-line`, `cannon` (with `distance` 1 → 0), `cannon-salvo`.
- Each cue carries `status`, `confidence` and `evidence`.

**`effects[]`**:
- `fade` `{start, end, from, to}`.
- `letterbox` `{frame, from, to, frames}`: opens at 2725, in the dark.
- `dip` `{frame, amount, attack, decay}`: a dark pulse on the five strikes. Flashes are not used.
- `shake` `{start, end, amp, env}`.

**`text[]`**: `{ id, start, end, content, style, font?, size?, y?, color?, fadeIn?, fadeOut?, maxCps?, minFrames? }`.

**`checks`**: `{ audioRequired: true, videoCodec: 'h264', pixelFormat: 'yuv420p' }`. `verify_video.py` uses it.

Validate with `for p in film-plan*.json; do python3 tools/validate_plan.py $p; done`. All three live plans pass: 0 errors, 0 warnings.

---

## 4. Plan builder and versioning (`tools/build_plan.mjs`)

**Inputs.**
- `analysis/grid.json`: bars → eight eighth-note onsets in source seconds, from `refine_grid.py`.
- Its DP places bar lines within ±300 ms of a smooth local tempo, at 5.8 ms resolution, scoring onset evidence at the eight eighths. Eighths then snap ±30 ms to attacks.
- `analyze_music.py` (chroma DTW against the Mutopia MIDI) supplies the bar map.
- The headers of both scripts say plainly that the times are signal-derived and were not verified by listening.

**Musical positions.**
- `at(bar, eighth)` maps a grid position through the audio placements (`srcToFrame`) to a frame.
- The strike onsets are hard-coded source seconds (`STRIKE_SRC`, onset-envelope peaks).
- Some anchors are authored frame counts, not musical positions:
  - `IGNITION = 2725`
  - `DARK = 54`
  - the coda offsets: star at +132/+168, lines at +192/+228, end at +336
  - `GAZE` (v4: 192)
  - `SIGNOFF` (v4: 72)

**Storyboard `SB`.**
- Shots start at musical positions; each runs to the next shot's start.
- `frenzy()` generates the beat cuts F27.1-F31.8.
- The statue inserts `INSERTS_ALL` (M01-M16) cut into host shots, which get a `span`. v3+ keeps only the inserts before ignition (M01-M12) plus the final `M16` stare.

**Cuts** (`CUTS`):

| Cut | File | `id` | Presets that differ |
|---|---|---|---|
| David | `film-plan.json` | `david-916` | F29.1 sling |
| Sol | `film-plan-sol.json` | `sol-916` | F29.1 sol, F30.3 solstice |
| Prometheus | `film-plan-prometheus.json` | `prometheus-916` | F29.1 eagle, F30.3 chains |

The cuts also differ in names, purposes and the statue figure.

**Versioning.**
- `PLAN_VERSION` defaults to `4`. `V3 = VERSION >= 3` and `V4 = VERSION >= 4` gate every structural difference.
- `PLAN_OUT` writes elsewhere. It is resolved relative to the repo root, so a relative path is needed to dry-run outside the repo.
- Plan id: `V3 ? \`${C.id}-v${VERSION}\` : C.id`. So v3/v4 plans get `david-916-v4` → `dist/david-916-v4/`, and v2 keeps the bare `david-916` → `dist/david-916/`.
- Audio deltas are gated in `score.js` by `plan.version` (the `DESIGN.v4` block).

**Rebuild check (I ran this):**
```bash
for v in 2 3 4; do PLAN_VERSION=$v PLAN_OUT=<relative path to scratch>/pv$v node tools/build_plan.mjs; done
```
- v2 matches `plans-v2/*` byte for byte, v3 matches `plans-v3/*`, and v4 matches the live `film-plan*.json`, for all three cuts.
- v4 is not frozen yet: there is no `plans-v4/`. Freeze it before starting v5.

| Version | Frames | Length | Shots | Last shot |
|---|---|---|---|---|
| v2 | 3986 | 2:46.1 | 76 | S31-newstar |
| v3 | 3917 | 2:43.2 | 72 | M16 |
| v4 | 4025 | 2:47.7 | 73 | S32-signoff |

---

## 5. Content fingerprints (`tools/fingerprint.mjs`)

`fingerprint(f, W, H)` = sha1 of JSON, truncated to 16 hex characters. It covers:
- `engine`: `src/main.js`, `src/index.html`, every file in `src/engine/` and every file in `src/fonts/`.
- `grid`: `analysis/grid.json`.
- `global`: the plan's `{fps, width, height, format, defaultPost}`.
- `W`, `H`.
- `shot`: the shot entry minus `purpose`, `action`, `framing` and `note`.
- `scene`: a hash of `src/scenes/<scene>.js` plus every relative `import`/`export ... from './x'` it pulls in, recursively, plus every file under `media/scenes/<scene>/`.
- `others`: the partner shot of an active dissolve or bleed, with its scene hash.
- `trs`: the active transitions.
- `effects` and `text`: the entries active at `f`, using the same windows as the engine for flash and dip. A letterbox entry persists from its frame on.

Consequences:
- **Anything in the engine hash invalidates every frame of every cut and version.** That covers an engine or font change, a `main.js` or `index.html` edit, a `grid.json` refit, or a change to the plan's global fields.
- `src/scenes/index.js` is not hashed, so registering a new scene invalidates nothing. Commit `6fbdf7e` (signoff) relied on this.
- **Scene granularity is the whole module tree.** One edit to any `studies-*.js` drawing stales every studies shot in every cut and version, and also the dissolve partner (S29a, nova).
  - To localise a late change, put it in a new scene id or module that only the affected shots use.
  - Or change it through plan `params` and `preset` (these are per shot).
- **`f` is not in the hash.** All frames of a shot with the same active effects and text share a fingerprint.
  - The frame cache is therefore keyed by **frame index**: `out/frames-WxH/NNNNN.jpg` plus `manifest.json[f] = fp`. It is not a content-addressed cache.
  - Rendering cut B into the same folder overwrites cut A's differing frames, and two renders into one folder at once would race.
- **Hazard: anything a scene reads from `E.plan` outside its own shot is not fingerprinted.**
  - For example, `defaultFigure(plan)` in `statue.js` uses `plan.cut`/`plan.id`, which is safe only because every statue shot carries `params.figure`.
  - Another example is `vortex.js` `filmTime`, which looks up the shot's `span`. That one is safe because `span` is in the shot.
  - Never gate pixels on `plan.version` or `plan.id` inside a scene. Put the difference in the shot's `params` or `preset`.
- **Dynamic loads.** `fetch()`ed or dynamically imported files are covered only if they live in `media/scenes/<id>/`.

---

## 6. `tools/render.mjs` modes

The script serves the repo on 127.0.0.1 and launches Chromium (`CHROME` env, default `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`) with `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`. It opens `src/index.html?w&h&plan` and waits for `__ready`.

Every mode takes `--plan <file>`. `--w` defaults to half the plan width (full width for `film`); `--h` follows the plan's aspect.

```bash
node tools/render.mjs stills  --frames 0,120,500 [--w 960] [--out out/stills] [--fmt png]
node tools/render.mjs shot    S04-scale --n 5 --w 540                 # first..last frame of a plan shot -> out/shots/<id>/
node tools/render.mjs sandbox nova --preset S23-eruption --times 0,2,4 --dur 6 [--params '{}'] [--post '{}'] [--lb 0.128]
node tools/render.mjs bench   statue --preset M05 --w 1920 --t 2
node tools/render.mjs strip   --from 1200 --count 8 [--cols 4]
node tools/render.mjs sheet   --shots --w 270 --cols 16 --out out/sheets/all.jpg   # or --every 48 | --frames a,b,c
node tools/render.mjs film    --ranges 0-240,480-500 --out out/frames-1080x1920 [--q 0.95] [--force] [--adopt]
```

How `film` works:
- A frame is skipped when the file exists and `manifest[f]` equals the current fingerprint.
- `--adopt` takes over existing frames that have no manifest entry.
- New frames go to `*.tmp.jpg` first and are renamed atomically.
- The manifest is rewritten after every frame, and `render-log.jsonl` gets `{f, shot, scene, ms, fp}`.

Measured cost in the local log (`out/frames-1080x1920/render-log.jsonl`, 463 frames):
- studies: median 0.69 s, p90 2.2 s
- nova: median 1.9 s
- signoff: median 0.5 s
- The statue is not in this container's log.

---

## 7. Distributed render (`tools/chunk.mjs`)

### 7.1 Layout
- Blocks are fixed: 240 frames (10 s), aligned to frame 0 (`BLOCK = 240`).
- A block splits at every shot boundary inside it into **pieces**, named `chunk_AAAAA_BBBBB.PPPPP_QQQQQ.mp4`.
- Each block has a record `dist/<plan.id>/chunk_AAAAA_BBBBB.json` = `{from, to, crf, pieces: [{from, to, fp, scene}]}`.
- A piece's `fp` is the sha1 over its frames' fingerprints *as rendered* (read from the render manifest). If a source changed mid-render, the piece is recorded as stale.
- Cut folder: `dist/<plan.id>/`, or `dist/<plan.id>-preview/` with `--preview` (half size, crf 22). A plan without an id uses `dist/chunks/`.
- Encode: `libx264 -preset slow -crf 17 -tune grain -pix_fmt yuv420p -profile:v high -level 4.1 -x264-params keyint=48:min-keyint=24:scenecut=40`.
  - Each piece starts on a keyframe, so pieces concatenate with `-c copy`.
  - The frame count is checked with `ffprobe -count_frames`.

### 7.2 Modes
```bash
node tools/chunk.mjs costs   [--plan P]                     # 1 full-size frame per shot -> out/costs.json (ms per shot)
node tools/chunk.mjs plan    --parts 6 [--costs out/costs.json]   # balanced ranges snapped to the 240 grid (transitions x1.9, +120 ms per frame)
node tools/chunk.mjs status  [--plan P]                     # per block: final | partial | stale | missing, listing each non-final piece from-to:scene:state
node tools/chunk.mjs render  --plan P --from 2640 --to 3360 [--only-scenes statue] [--skip-scenes statue] [--push] [--crf 17] [--frames out/frames-WxH]
node tools/chunk.mjs assemble --plan P [--audio out/audio/mix.wav] [--out ...] [--allow-stale] [--placeholders statue] [--preview]
```

### 7.3 What `render` does
- `--from` must be a multiple of 240. `--to` must be a multiple of 240 or the film's end.
- For each piece that is not final:
  1. Skip it with `--skip-scenes`, or skip pieces outside `--only-scenes`.
  2. Otherwise look for a **twin**: the same piece name with the same `fp` in any other `dist/*/` folder (another cut *or another version*). A twin is copied, not rendered. This is how v3 reused v2's frames before the explosion.
  3. Otherwise render all of the block's remaining pieces in **one** `render.mjs film --ranges ...` session, encode each one, and write the record.
- Piece files whose shot boundaries moved are deleted.
- With `--push` it runs `git add -A -f dist/<id>`, commits `Render dist/<id>/chunk_... (n piece(s))` and runs `git push -u origin HEAD` (5 tries, backoff 2-16 s).
  - It pushes to whatever branch the session is on, so each helper's pieces land on its own outcome branch.
  - `-f` is needed because `dist/*-916*/` is git-ignored on the main branch.
- Without `--push`, nothing is committed.

### 7.4 What `assemble` does
1. It refuses missing pieces, and stale pieces unless `--allow-stale` is given.
   - `--placeholders <scenes>` replaces those scenes' unfinished pieces with labelled grey cards (cached in `out/placeholders/`) and names the output `*-interim.mp4`.
2. It concatenates with `-c:v copy` and muxes `-c:a aac -b:a 512k -aac_coder fast -ar 48000 -ac 2`, with `-t` set to frames/fps, `+faststart` and title/comment metadata.
3. It **fails if the soundtrack is missing or silent**: `volumedetect` mean below -40 dB.
4. Unless `--preview` is given, it runs `python3 tools/verify_video.py <out> --plan <P> --out <out>.verify.json`. That check covers:
   - plan structure
   - width, height, fps and frame count (`-count_frames`)
   - that the audio stream is present
   - codec and pixel format
   - a start time near 0
   - a full decode with `-xerror`

   It does **not** measure loudness or true peak. Run `render-audio.mjs --verify` for that (section 8).
- Output: `dist/<plan.id>.mp4`. The default audio is `out/audio/mix.wav`, which always follows the **root** `film-plan.json`. For any other version, pass `--audio out/audio-vN/mix.wav`.

### 7.5 Helper sessions and the missing collector
- Origin has the outcome branches the helpers pushed to: `-r1..r8`, `-fn1..4`, `-pv1..4`, `-s4a..f`, `-s5a..f`, `-s6a..f`, `-st1..6`, `-v3a..c`, `-sd1..4`, `-dr-cno`, `-dr-sling`, `-editroom` and `-downloads`.
- The typical helper prompt: check out the **full** SHA, then run `node tools/chunk.mjs render --plan P --from A --to B [--only-scenes ...] --push`.
- **Collector or restore logic to write and commit** (it is not in the repo). For each helper branch:
  1. `git fetch`.
  2. For each `dist/<id>/chunk_*.json` on the branch, take the union of its `pieces` with the local record, keyed by `(from, to)`.
  3. When two records differ, keep the one whose `fp` equals what `status` wants.
  4. `git checkout origin/<branch> -- dist/<id>/<piece>.mp4` for those pieces.
  5. Finally run `status` and require final on every block, which also means no stale pieces.

---

## 8. Audio

### 8.1 `src/audio/score.js`
- Each stem renders in its own `OfflineAudioContext(2, 48000 * duration, 48000)`, all side by side.
- The stems:
  - `orchestra`: the USAF Band recording, placed per `plan.audio`
  - `synth`: an 80s pulse from `grid.json` `bassMidi`
  - `tension`: the strike undertow
  - `build`: the S21 implosion → the dark → the explosion
  - `ignition`: the explosion; this is the climax bus
  - `salvos`: 1812 salvos on the bar 56-59 beats
  - `coda`: night air, drone, shimmer
  - `stare`: a resonant tone under the final stare
  - `cannons`: the approach law, re-rendered until the measured levels fit
- The mix and master run in plain JS:
  - the cannon limiter
  - the synth auto-level
  - the duck and ladder ride
  - the music bus (glue compressor, a short-term cap before ignition, its own true-peak limiter from ignition at `ret.musicCeilDb`, which is `v4.musicCeilDb` = -1.6 in v4)
  - the climax bus (`climax.targetST` -6.0 LUFS short-term inside explosion + 75 frames, at most 2.5 dB gain reduction, folded under the returning music)
  - the build, coda and stare buses, each set to its loudness target
  - a final true-peak limiter (internal ceiling -1.35 dB)
  - the music gain is iterated by secant steps to `targetLufs` -16.0, with `ceilingDbtp` -1.0
- **Version deltas** sit in `DESIGN.v4 = { explosionGain: 0.62, returnGain: 1.19, musicCeilDb: -1.6 }` and apply only when `plan.version >= 4`.
- Determinism: seeded mulberry32 and no `Date`. Chrome's Web Audio kernels still differ at float-rounding level, about -104 dBFS peak between renders, so renders are not bit-identical.

### 8.2 `tools/render-audio.mjs`
```bash
node tools/render-audio.mjs                                      # root film-plan.json -> out/audio/ (mix.wav 24-bit 48 kHz, stems/, report.json, spectrum-*.png)
node tools/render-audio.mjs --plan plans-v3/film-plan.json --out out/audio-v3 --no-publish
node tools/render-audio.mjs --only build,ignition                 # dev: raw stems; the mix is their plain sum
node tools/render-audio.mjs --verify dist/david-916-v4.mp4 [--ref out/audio/mix.wav] [--plan film-plan.json]
```
**Publishing.**
- Only a full render of the root plan into another `--out` is copied to `out/audio/`.
- `--plan <other>` refuses to write into `out/audio/`.

**Measurement.** An ffmpeg `ebur128=peak=true` scan of the mix gives:
- integrated loudness, LRA and true peak
- a short-term profile: strikes, build, explosion, bars 56-59, aftermath, stare
- spectrograms
- AAC round trips of two encodes, each checked like a delivered file:
  - `mastered-for`: 512k with the fast coder
  - `mux-today`: 320k with the default coder

**Shared timeline.** Every `film-plan*.json` in the plan's directory must share fps, frames, audio, cues, effects and shot timing, so one mix serves all cuts.

**`--verify` checks**, failing with exit 1. It first refuses a reference mix whose length is not the film's length. Then, on each muxed file:

| Check | Pass condition |
|---|---|
| Audio stream | AAC, 48 kHz, 2 channels |
| Audio and video length | within 1 frame + 1 AAC frame of the film |
| Integrated loudness | within ±0.5 LU of the mix |
| True peak | at most -1 dBTP |
| Climax (short-term max) | within ±0.5 LU and ±0.3 s of the mix |
| Coda (star to the end) | within ±1.5 LU of the mix |
| Sync at the explosion (or the ignition) | lag within ±1 ms, r ≥ 0.95 |

**Stale comment.** The header and `AAC_MUX` say chunk.mjs muxes at 320k; it now muxes at 512k with the fast coder. Only `encode.mjs` still muxes at 320k.

**Calibration history for the v4 note** ("explosion 15% lower, return 20% higher") took **four** renders, each measured on the normalised final mix:

| Commit | Explosion | Return | Note |
|---|---|---|---|
| `ccfa92f` | ×0.85 | ×1.2 | |
| `44b559d` | ×0.75 | ×1.4 | plus music ceiling -1.6 dBTP |
| `5253663` | ×0.6 | ×1.3 | |
| `d5a75a5` | ×0.62 | ×1.19 | final |

---

## 9. Edit Room

**Package** (`tools/build-review.mjs`):
```bash
node tools/build-review.mjs --cuts film-plan.json,film-plan-sol.json,film-plan-prometheus.json \
  --videos dist/david-916-v4.mp4,dist/sol-916-v4.mp4,dist/prometheus-916-v4.mp4 \
  [--out out/editroom] [--label "Render 2"] [--render 2] [--note ".."] [--names "A,B,C"] [--codec h264|vp9] [--size 720x1280] [--crf 23] [--maxrate 3000k] [--abr 192k] [--allow-trim]
```
- Each video must have exactly its plan's frame count.
- What it produces:
  - 10 s picture clips (`CLIP = 240`, aligned to the render blocks), H.264 `-preset medium -crf 23 -maxrate 3000k`, 720×1280 for portrait sources.
  - One continuous soundtrack per distinct *decoded* audio track. This is the master clock.
  - A clip whose decoded frames (md5 of every frame) are identical in several cuts is stored once.
  - A thumbnail sprite at 1 frame per second, waveform peaks, and per-cut timeline data:
    - shots, with a `diff` flag against the cuts of the same `plan.version`
    - acts, anchored on shot numbers
    - cues, bar lines from `grid.json`, and text
- Files written: `editroom.html` (the template with `__FILM_DATA__`), `media/`, `thumbs*.jpg`, `files.json`, `serve.mjs` (copied from `tools/editroom-serve.mjs`), `Start Edit Room.command` and `README.md`.
- An existing `notes.json` is never overwritten.
- It throws if any file is over 15 MB, and prints publish batches of at most 64 MB. The 256 MB-per-version limit is not checked.
- The cache in `out/.editroom-cache/<out name>/` makes a page-only rebuild take seconds.

**Localhost server** (`tools/editroom-serve.mjs` → `serve.mjs`):
- Run `node serve.mjs [--port 4321] [--no-open]`. It needs no dependencies and binds 127.0.0.1 only.
- It serves byte ranges.
- API: `GET`, `POST`, `PATCH <id>` and `DELETE <id>` on `/api/notes`.
- `notes.json` is written atomically, with `notes.md` beside it, grouped by cut and ordered by frame.

**Page** (`src/review/editroom.html`):
- **Note stores, in priority order:**
  1. The claude.ai artifact db (`window.claude.use('db')`, live `onSnapshot`).
  2. The local server, when `/api/notes` answers. It then polls every 4 s, and notes kept only in the browser migrate to it.
  3. `localStorage`, with a banner saying so.
- Notes carry: `cut`, `cutName`, `frame`, `x`, `y` (a pin as a fraction of the picture), `shot`, `timecode`, `status`, `author`, `render` and `tags`.
- "Copy notes" emits the format the director sends back:
  `N. <timecode> (frame F, <shot>) [open|resolved] {tags} @ x%,y%` followed by the note text, indented.
- **Hazard: two versions of the same cut collide on the cut id.** Both are `david`, and the second gets a *positional* suffix (`david-4`). Notes are keyed by that id, so reordering `--cuts` re-homes notes.
- **Loader.**
  - It switches to fetch-to-blob only when the host serves no byte ranges (a `seekable` check after `loadedmetadata`).
  - A failed blob fetch is dropped from the map and retried on the next load.
  - The soundtrack has a "tap to retry" gate, and picture never plays without sound.
  - A video `error` shows "The picture could not be loaded in this browser."
  - **There are no timeouts, no retry loop and no watchdog in the committed loader.**

**Tests** (local Chromium):
- `node tools/test-editroom.mjs [--dir out/editroom-test] [--norange] [--skip-single]` uses frame-coded portrait test cards. It checks:
  - layout and pins
  - frame-exact seeks and sync across clip boundaries
  - the cut switcher and shared clips
  - per-cut notes
  - the sound UI
- `node tools/test-editroom-local.mjs` tests `serve.mjs`: notes persist and sync, byte ranges work, and nothing outside the folder is served.

---

## 10. Delivery steps (commands)

```bash
node tools/build_plan.mjs && for p in film-plan*.json; do python3 tools/validate_plan.py $p; done
node tools/render-audio.mjs                                   # -> out/audio/mix.wav (+ report.json; check ffmpeg.delivered)
node tools/chunk.mjs costs --plan film-plan.json && node tools/chunk.mjs plan --parts 6   # ranges for helpers
node tools/chunk.mjs render --plan film-plan.json --from A --to B --push                   # per helper / range
node tools/chunk.mjs status --plan film-plan.json                                         # until every block is final (no stale)
node tools/chunk.mjs assemble --plan film-plan.json            # -> dist/david-916-v4.mp4 + .verify.json
node tools/render-audio.mjs --verify dist/david-916-v4.mp4     # loudness / true peak / climax / coda / sync on the muxed file
node tools/build-review.mjs --video dist/david-916-v4.mp4 --plan film-plan.json --out out/editroom   # review package
tools/publish-downloads.sh <repo-branch>-downloads dist/<file>.mp4 [--readme README.md]          # 1080p for download
```

**`publish-downloads.sh`.**
- It refuses any file of 99,000,000 bytes or more. GitHub's limit is 100 MB, and the comment says 1080×1920 at about 4 Mbps for 2:45 comes to about 88 MB.
- It builds the tree with `hash-object -w`, `mktree` and `commit-tree`.
- The first commit has no parent, so the branch is standalone. Later commits stack on the remote tip and keep its files.
- It never touches the index or the working tree.
- It pushes `<commit>:refs/heads/<branch>`, with 5 tries.

**Chat-size encode** (720×1280, crf 23, maxrate 1700k, AAC 192k → about 27 MiB): **not in any tool**. It was an ad-hoc ffmpeg command.

**Do not deliver with `tools/encode.mjs`.**
- It hard-codes `film-plan.json`, `out/frames` and `dist/david-and-goliath.mp4`.
- It muxes AAC at 320k with the default coder. `render-audio.mjs` documents that this overshoots the true peak by +1 to +2 dB, above 0 dBTP.

---

## 11. Cross-check of the session learnings against the code

Legend: **C** = CONFIRMED, **P** = PARTLY, **X** = CONTRADICTED, **N** = NOT IN CODE.

| # | Learning | Verdict | Evidence or correction |
|---|---|---|---|
| 1 | Frame-addressable WebGL2 HDR engine in headless Chromium (SwiftShader) | C | `film.js`; `render.mjs` launch flags |
| 1 | A frame is a pure function of its index; seeded noise; no Math.random or time | C | `film.js` header; `rng.js`; grep is clean. Scope: of (plan, index, sources). |
| 1 | Scene modules with per-shot presets | C | `presets[shot.preset ‖ shot.id]`, plus `portrait` and `params` |
| 1 | Plan holds shots, cues, effects, text, audio; built by `build_plan.mjs` from musical positions on a DTW + onset-DP grid | P | It also holds `overlays`, `assets`, `checks`, `format`. Ignition (2725), the dark hold, coda, stare and sign-off are authored frame counts, not musical positions. |
| 2 | `PLAN_VERSION`; delivered versions frozen as `plans-vN/` and rebuilt byte-identically | P | I ran it: v2, v3 and v4 rebuild identically. But v4 (the delivered David cut) has no `plans-v4/` yet. Pixels are not reproducible from HEAD when shared scene code changes without version gating (section 0.2). |
| 2 | New versions get new plan ids and `dist/<cut>-vN/` | P | Only v3+ (`david-916-v4`); v2 is `david-916`. The folder is `dist/<plan.id>/`. |
| 2 | Director's notes become the next version; the delivered one stays reproducible | P | True for the plans and the audio (`DESIGN.v4` is gated). The picture needs version gating in params or presets, or the delivered commit. |
| 3 | Fingerprint covers engine dir, scene module and transitive imports, `media/scenes/<id>/`, pixel fields (descriptive excluded), active effects and text | C | Also `main.js`, `index.html`, fonts, `grid.json`, the plan's global fields, W/H, and dissolve partners. |
| 3 | Only changed frames re-render; shared frame cache keyed by fingerprint | P | The cache is keyed by **frame index**, with a fingerprint check (`manifest.json`). The fingerprint has no `f` in it, so it is not content-addressed. Re-render granularity is the whole scene module tree. |
| 3 | An engine or font change invalidates everything; add scenes or use params late | C | Add to the list: a grid refit, `main.js`/`index.html`, and the plan's global fields. Also, any `studies-*.js` edit stales every studies shot. |
| 3 | New scenes in `scenes/index.js` do not invalidate others | C | `index.js` is not hashed (commit `6fbdf7e`). |
| 4 | 240-frame blocks of per-shot pieces; each from a keyframe; records its rendered fingerprint | C | `BLOCK = 240`; `piecesOf`; manifest-derived `fp` |
| 4 | `status` lists final, stale and missing | C | Plus a per-block `partial` |
| 4 | `render --from --to [--only-scenes] [--skip-scenes] [--push]` commits each block to the current branch | P | Only with `--push`, and it pushes `HEAD` to the same-named branch on origin. |
| 4 | Identical pieces twin-copied between cut folders | C | Any `dist/*/` folder, so other versions count too. |
| 4 | `assemble` stream-copies, AAC 512k with fast coder (true peak under -1 dBTP), refuses silence, full-decode verify | P | All present, but the true peak is **not measured** at assembly (`verify_video.py` is structural). Run `render-audio.mjs --verify` afterwards. |
| 4 | Helpers push to their own branches; a collector merges records | P / N | The branches exist on origin. **No collector is in the repo.** |
| 5 | Full SHA; helpers cannot be redirected; balance by cost; warm helpers; Monitor; interrupt or archive | N | Process lessons. `git add -f` is confirmed in `chunk.mjs`. `chunk.mjs costs`/`plan` exist for balancing. Local log: studies median 0.69 s/frame (not "about 1 s"), nova 1.9 s; statue not measured here. |
| 6 | Container can restart from an old snapshot; push every piece; keep a restore script; keep tools in git | P / N | Pieces are pushed (`--push`), and the tools are in git. **No restore script is in git.** |
| 7 | `pkill -f` kills its own shell; editing a running script; 30-min monitors | N | Shell lessons; nothing in code to check. |
| 8 | Mix in an OfflineAudioContext in Chromium | C | One context per stem, rendered concurrently |
| 8 | Stems: orchestra, synth, cannons, build, explosion bus, salvos, coda | P | Also `tension` (strike undertow) and `stare`. The explosion stem is named `ignition`. |
| 8 | Targets: -16 LUFS, a short-term climax target, -1 dBTP, limiter chains | C | `targetLufs -16`, `climax.targetST -6.0`, `ceilingDbtp -1`, internal ceiling -1.35 |
| 8 | Delivery checks on muxed files (`--verify`) | C | Seven checks (section 8.2) |
| 8 | "X% louder" must be measured on the normalised final mix; limiters swallow raw gain; first try moved about 1 dB not 3; calibrate in 2-3 renders | P | Mechanism confirmed (comments in `score.js` and `44b559d`). It took **4** renders (section 8.2). |
| 8 | Gate design deltas by `plan.version` | C | `DESIGN.v4`, `V4 = plan.version >= 4` |
| 9 | 9:16 recomposition through the framing hook without touching the shots | C | `setFraming`, `portrait` blocks |
| 9 | Inserts keep the host's clock (`span`) | C | `Film.state` |
| 9 | SMK scans rasterised in raw WebGL with marble shading, shadow maps and an aura | C | `statue.js` and `lib/statue-*` |
| 9 | Turn on the film's clock, 90° over the whole film, nearly still per glimpse, dead eye contact at the end; rotation inside a shot needs per-frame shadow maps | C | `turn: [508, 3801, 90, 0]` with a C1 settle over the last 8%; contact lands 40 frames into M16. Shadow map is per frame when the turn inside a shot exceeds 0.5°. |
| 9 | Locked framing reads better | C | `STATUE_LOCK` (v4): preset M05, `drift 0`; David height 2.5 with the M03 key; M06 kept as the one cinematic angle. |
| 9 | Procedural ink studies (reveal windows, hatching, parchment shader) | C | `studies-ink.js`, `studies-paper.js` |
| 9 | Director rejected hands; prefer objects and diagrams | P | David cut is clean (verified frames). **Prometheus `F30.3-chains` still draws a fist** (rendered f2144). |
| 9 | Text through the overlay (Cinzel / Cormorant) | P | Plan `text` goes through `titles.js` on its own canvas, composited after tonemapping, not through the scene `overlay()`. IM Fell English is loaded for the studies script. |
| 9 | Sign-off card: real signature vector revealed by a soft front, plus name and URL | C | `signoff.js` (`media/scenes/signoff/tehbyn-signature.svg`); the three words are plan text; 72 frames |
| 10 | 30 MiB chat cap; 720p encode about 27 MiB | N | No tool encodes this |
| 10 | 100 MB GitHub cap; 1080p at about 4 Mbps is about 88 MB on an orphan branch via plumbing | C | `tools/publish-downloads.sh` (guard at 99,000,000 B) |
| 10 | Download cards, early cuts, re-render only the chosen version; WebFetch for blocked sites | N | Session practice |
| 11 | Frame-accurate review; pins; per cut and version; acts, shots, bars, cues on the timeline | C | `editroom.html`, `build-review.mjs`. Version ids collide (`david-4`). |
| 11 | Three note stores: artifact db, local server, browser | C | Priority db → server → localStorage, with migration to the server |
| 11 | 10 s clips plus one soundtrack as master clock | C | `CLIP = 240`; one soundtrack per distinct decoded audio |
| 11 | Hosting limits force clips | P | 15 MB per file (throws) and 64 MB batches (printed) are enforced; 256 MB per version is not. |
| 11 | The loader needs fetch-to-blob with timeouts, retries and a watchdog | X | **Not implemented.** Blob fallback only when byte ranges are missing; no timeouts, retry loop or watchdog. |
| 11 | Notes come back as a numbered list with timecode, frame, shot, pin | C | "Copy notes" format (section 9) |
| 12 | Working with the director | N | Process. `render.mjs sheet` makes contact sheets in the page; there is no ffmpeg-tile script. |

---

## 12. Smaller defects and stale text found

**`tools/chunk.mjs`**
- The header still describes single-file blocks (`dist/chunks/chunk_A_B.mp4`, `dist/david-and-goliath.mp4`).
- The `push` helper defined in `render` mode is never called.
- The error text omits `status` and `costs`.
- `assemble` writes `concat.txt` into the cut folder, which a later `render --push` would commit.

**Other tools**
- The `tools/render.mjs` header says there are two cuts; there are three.
- The `tools/render-audio.mjs` header and `AAC_MUX` say chunk.mjs muxes at 320k; it muxes at 512k with the fast coder.

**Docs and code comments**
- `README.md`: v2/v3 text, the 166.083 s mix and "sixteen inserts". v4 has M01-M12 plus M16, which is 13 statue shots.
- `docs/PORTRAIT.md` still lists two cuts.
- The `S10-prometheus` preset comment in `src/scenes/studies.js` mentions a fist.
- `src/scenes/lib/studies-hand.js` is an orphan.
