# Architecture: a frame-addressable film engine in headless Chromium

How to structure a film that is rendered entirely in code (WebGL2 + Canvas 2D in a page, captured frame by frame
by a headless Chromium, sound rendered offline in the same browser, ffmpeg assembly). It is distilled from
"Nova, Episode 1" (2:48, 9:16, three cuts, four versions). Nova's engine is the reference implementation: its files
are at a pinned commit (reference-implementation.md). The skill's `assets/starter/` is a minimal page and engine
that honours the same contract and runs the whole pipeline.

## Contents
1. The one rule: a frame is a pure function of its index
2. Repository layout
3. The page contract (what the renderer calls)
4. Engine and scene module API
5. Parameters: presets, cuts and portrait overrides
6. The per-frame order and the HDR pipeline
7. Time inside a shot: `local`, `dur`, `span`
8. Assets and preloading
9. Performance on SwiftShader
10. The development loop
11. What to keep out of the engine late in a project

## 1. The one rule: a frame is a pure function of its index

`renderFrame(f)` must depend only on the plan, `f`, and the source files. This is what makes everything else
possible:
- frames render in any order, on any machine, in any number of parallel helpers;
- a shot can be re-rendered alone and cut back in without a seam;
- a content fingerprint can decide which frames are still valid (fingerprints-and-distributed-render.md).

What that means in code:
- No `Math.random()`, `Date`, `new Date()` or `performance.now()` that affects pixels; `performance.now()` is fine to
  *time* a frame. Grep the engine, scenes and score for them before each final render.
- Seeded randomness only: stateless hashes of stable ids (`hash1(shotStart, k)`), `mulberry32(seed)` created inside
  the frame, GLSL hashes of stable coordinates, a fixed 3D noise texture built once from a seed.
- No accumulated state between frames. Particles, trails and simulations are evaluated analytically at time `t`, or
  replayed from a fixed-step checkpoint that is itself a function of `t`. Caches are fine only when keyed by every
  input (Nova cached the statue's shadow map by figure, light and fit).
- Reset Canvas 2D state every frame (`ctx.reset()`), so a line width or font cannot leak from one frame to the next.
- Test it: render a middle frame, render other frames, render the middle frame again; compare bytes.

## 2. Repository layout

```
src/index.html, src/main.js     page entry: readiness barrier, then the frame API
src/engine/                     film.js (orchestrator), gl.js (WebGL2 passes), glsl.js (shared chunks, palette),
                                post.js, math.js (cameras, easing, framing hook), music.js (score -> film time),
                                noise.js, rng.js, titles.js (plan text)
src/fonts/                      woff2 + OFL licences (fonts are part of the engine hash)
src/scenes/index.js             scene registry (NOT fingerprinted: adding a scene invalidates nothing)
src/scenes/<id>.js + lib/       one module per "department": its presets, shaders, drawings
src/audio/index.html, score.js  the soundtrack, rendered in an OfflineAudioContext
src/review/editroom.html        the review page template
media/scenes/<id>/              assets of scene <id> (fingerprinted with it): meshes, SVGs, textures
media/source/                   the supplied recording(s), with their rights noted
analysis/grid.json              the bar grid fitted to the recording
tools/                          the skill's pipeline (config, fingerprint, render, chunk .mjs; verify_video.py,
                                validate_plan.py), restore-from-branches.py, watch-render.sh, and the project's
                                build_plan.mjs, render-audio.mjs, build-review.mjs, publish-downloads.sh
film-plan*.json                 the live plans (one per cut); plans-vN/ the frozen delivered versions
out/                            frames, audio, sheets, review builds (git-ignored)
dist/<plan.id>/                 render pieces (git-ignored on main; committed on helper branches)
docs/                           art bible, department briefs, the next version's notes
```
Keep every tool in git. A container can restart from an old snapshot. When it does, untracked files vanish, and so
does anything in a scratchpad.

## 3. The page contract (what the renderer calls)

The renderer (`scripts/pipeline/render.mjs`) serves the repository root on 127.0.0.1, opens
`src/index.html?w=&h=&plan=film-plan.json` in Chromium with `--use-angle=swiftshader --enable-unsafe-swiftshader
--ignore-gpu-blocklist`, waits for `window.__ready`, then drives:

| Global | Contract |
|---|---|
| `window.__ready` / `window.__error` | set after fonts (`document.fonts.load` for each face, then `document.fonts.ready`), the plan, the grid and every scene's `preload(plan)`; `__error` holds the stack if boot failed |
| `window.renderFrame(f)` | draws frame `f`, returns `{ f, shot, scene, ms }` |
| `window.grab(type, quality)` | base64 of the canvas (`image/jpeg` 0.95 for finals; `image/png` for stills that need it) |
| `window.planInfo()` | `{ fps, frames, shots: [{ id, scene, start, end }] }` |
| `window.renderSandbox(scene, params, local, dur, post, letterbox, preset)` | one scene with ad-hoc params, for development |
| `?warm` | compile every scene used by the plan up front |

Three details a page written from scratch gets wrong:
- **`?plan=` is a path relative to the repository root**, because the renderer serves the root. A page in `src/`
  must fetch `'../' + plan` (Nova's `src/main.js` does). A bare `fetch(plan)` asks for `src/film-plan.json` and
  gets a 404.
- **The output canvas must be the first `<canvas>` in the document.** `render.mjs sheet` and `strip` copy
  `document.querySelector('canvas')`. Keep helper canvases (an offscreen WebGL canvas, a titles canvas) out of the
  document or after the output canvas.
- **`renderFrame` returns `ms` as an integer** (`Math.round`). `chunk.mjs costs` parses `<n>ms` from the renderer's
  output. Time it after the GPU work is done: WebGL is lazy, Chromium's `finish()` doesn't wait, and reading one
  pixel (`gl.readPixels(0, 0, 1, 1, ...)`) does.

Frames are written as JPEG (q 0.95) to `out/frames-WxH/NNNNN.jpg` with a `manifest.json` of the fingerprint each
frame was rendered under. Encode pieces from those (x264 crf 17, `-tune grain`, keyframe every 48).

## 4. Engine and scene module API

A scene module is one file in `src/scenes/<id>.js` (the `id` must equal the file name: the fingerprint hashes that
file and its relative imports):

```js
export default {
  id: 'studies',
  scale: 1,                               // HDR scene-target scale 0.5-1 (soft volumetrics can use 0.5-0.75)
  presets: { 'S10-fire': {...}, 'F30.3-chains': {...}, default: {...} },
  async preload(plan) {},                 // optional; assets from media/scenes/<id>/; awaited before frame 0
  init(E) {},                             // compile programs once
  render(E, S, target) {},                // write LINEAR HDR radiance into target; never tonemap or clamp
  overlay(E, S, ctx) {},                  // optional Canvas 2D at output pixels; return 'add' | 'over' | null
  post(E, S) {},                          // optional per-frame post overrides ({ exposure, bloomStrength, ... })
};
```
- `S` (per-frame state): `{ f, t, local, dur, u, fps, W, H, portrait, shot, params, framing, seed }`.
- `E` (engine): `{ G, W, H, fps, plan, music, math, rng, portrait, k, program, camera, target(name, scale, format),
  draw, overlayCtx, overlayCanvas, overlayTexture(), shotById, S }`.
  - `E.k` = short side / 1080: multiply stroke widths, glow sizes and type by it, so 9:16 and 16:9 match.
  - `E.draw` scissors frame-shaped targets to the letterbox, so pixels the bars cover are never shaded.
  - `E.music.at(bar, eighth)` → film seconds; `E.music.pulse(t)` → the current eighth `{ bar, k, since, period }`
    for accents on the beat.
  - `overlay()` returning `null` means the scene's shader samples the overlay itself (ink multiplied into paper),
    so it is not composited a second time.
- Standard uniforms: `uRes, uFull, uTime, uLocal, uDur, uU, uFrame, uSeed, uNoise` (3D noise volume).
- Raw WebGL inside a scene (a mesh rasteriser for 3D scans, depth targets for shadow maps) is fine if the scene saves
  and restores every bit of GL state it touches.

## 5. Parameters: presets, cuts and portrait overrides

The engine resolves a shot's parameters as:
```js
params = { ...(presets[shot.preset || shot.id] || presets.default),
           ...(portrait ? { ...preset.portrait, ...shot.portrait } : {}),
           ...shot.params };
```
- **Cuts are presets.** A shot that differs between cuts names another preset (`F29.1-sling`, `F29.1-eagle`,
  `F29.1-sol`). Everything else is shared, so the cuts share rendered frames.
- **Version and cut differences that change pixels go in `preset`/`params`**, never in a scene reading
  `E.plan.version` or `E.plan.id`. The fingerprint sees the shot entry but not the rest of the plan, so a scene that
  branches on `plan.version` would render different pictures under the same fingerprint.
- **Portrait** (`portrait: { framing, ...overrides }`) applies only to portrait renders; landscape renders ignore it,
  so an approved 16:9 film stays untouched (picture-craft.md, "Recomposing 16:9 for 9:16").

## 6. The per-frame order and the HDR pipeline

1. Global effects from `plan.effects` (letterbox, dip, fade, shake; flash if used).
2. The scene's `overlay()` on a canvas reset every frame (drawn first so shaders may sample it).
3. The scene `render()` into `sceneA` (linear HDR, `rgba16f`).
4. During a dissolve or bleed, the partner shot into `sceneB`.
5. Post: composite (shake, blur, overlay, mixB) → bloom pyramid → anamorphic streak → ACES (Hill fit) → grade →
   grain → letterbox → fade.
6. Titles (plan `text`), drawn on their own canvas and composited **after** tonemapping, so type stays crisp and
   exactly the colour asked for.

Light is physical: hot things are *bright* (values of 5-500 for plasma cores are normal); post handles bloom and the
roll-off. Never pre-tonemap or clamp in a scene; let bright cores clip to white with coloured falloff.

## 7. Time inside a shot: `local`, `dur`, `span`

`local = (f - a) / fps`, `dur = (b - a) / fps`, `u = local / dur`, where `[a, b)` is the shot's `[start, end)`, or its
`span` when it has one. An insert cut into a host shot splits the host into `S12` and `S12·2`, both with
`span = [hostStart, hostEnd]`. The host keeps its own clock, so its motion is never compressed or restarted by the
insert. `local` can fall outside `[0, dur]` during dissolves: clamp where it matters.

A motion that runs on the **film's** clock (Nova's statue turning 90° over the whole film) is a function of `S.f`,
not of `local`: every glimpse shows the angle the film's time gives it.

## 8. Assets and preloading

- Put a scene's external files in `media/scenes/<id>/`: they are then part of its fingerprint. Anything fetched
  from elsewhere is invisible to the fingerprint.
- Load them in `preload(plan)` and **fail loudly**: a scene that swallows a failed fetch and renders without the asset
  writes a wrong frame under a valid fingerprint, and that frame is then "final". (Nova's sign-off scene only warns
  and carries on if its signature SVG does not load, so a blank card could pass as final: look at those frames, or
  throw in `preload`.)
- Fonts: load each face explicitly before `__ready`; text measured before the font arrives is measured in the
  fallback font.
- Record the source and licence of every asset next to it (Nova: SMK scans under Public Domain Mark 1.0, the USAF
  Band recording as a US government work, OFL fonts).

## 9. Performance on SwiftShader

Headless Chromium renders WebGL2 on the CPU (SwiftShader). Budget for it from the first shader:
- Target about 1.5 s per full-size frame typical and 3 s at most for heavy shots. Nova measured studies at a median
  of 0.7 s (p90 2.2 s), nova at 1.9 s and the statue at about 1.4 s per 1080x1920 frame.
- Prefer texture noise (one fetch) to ALU hash noise; 3-5 fbm octaves; raymarch ≤ 48 steps with jittered starts and
  early exits; soft volumetrics at `scale` 0.5-0.75.
- Measure with `render.mjs bench <scene> --preset <shot> --w 1920 --t 2`, and remember that other renders on the
  same machine inflate the numbers.
- Total render time scales with frames × cost: measure costs per shot (`chunk.mjs costs`) before planning helpers.

## 10. The development loop

```bash
node tools/render.mjs sandbox nova --preset S23-eruption --times 0,2,4 --dur 6 --w 540   # scene alone
node tools/render.mjs shot S04-scale --n 5 --w 540         # real plan timing and effects, first..last frame
node tools/render.mjs sheet --shots --w 270 --cols 16       # one frame per shot, the whole film
node tools/render.mjs strip --from 2140 --count 8           # consecutive frames: flicker, swimming, pops
```
Look at every image (the Read tool shows JPEGs). Check the first, middle and last frame of each shot you touch, and
a few consecutive frames around fast motion. Render small (540 wide) while developing; never full size unless it is
the final render.

## 11. What to keep out of the engine late in a project

Every file in the engine hash (engine dir, `main.js`, `index.html`, fonts, the bar grid, the plan's global fields)
invalidates every frame of every cut and version when it changes. Late in a project:
- put a new look in a **new scene module** (register it in `src/scenes/index.js`: the registry is not hashed);
- change one shot through its **preset or params**;
- never "just fix" a shared helper in `src/engine/` or swap a font a day before delivery. If an engine change is
  unavoidable, plan a full re-render with helpers and say so to the director before making it.
