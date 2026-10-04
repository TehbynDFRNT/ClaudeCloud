# starter/: the smallest film that runs the whole pipeline

A page that honours the renderer's page contract, a minimal engine, one WebGL2 scene with two presets, a plan builder
that honours `PLAN_VERSION` and `PLAN_OUT`, and a placeholder soundtrack. It is a 10 s, 9:16, 24 fps film of two
shots, small enough to render, assemble and verify in about two minutes. Use it to prove the toolchain in the first
hour, then grow it into the real engine (`references/architecture.md`), or replace it with Nova's engine
(`references/reference-implementation.md`).

```
src/index.html          the output canvas, first in the document
src/main.js             boot (fonts, plan from '../' + ?plan=, scene preloads) -> __ready, renderFrame, grab, planInfo
src/engine/film.js      shot lookup, presets < portrait < params, local/dur/span, titles after the scene, integer ms
src/scenes/index.js     the scene registry (not fingerprinted)
src/scenes/hello.js     one WebGL2 scene: a ring on the shot's clock, a moon on the film's clock
tools/build_plan.mjs    storyboard in at(bar, eighth) -> film-plan.json; versioned ids; PLAN_VERSION / PLAN_OUT
tools/tone-mix.mjs      placeholder soundtrack from the plan, exactly frames / fps long
package.json, .gitignore
```

## The smoke test (run from the new film repository's root)

The copy brings this README along as the film's `README.md`: replace it with the film's own once the test passes.

```bash
SKILL=<path to this skill>
git init                                            # the pipeline finds the root by git; commit from the first hour
cp -r $SKILL/assets/starter/. .
mkdir -p tools && cp $SKILL/scripts/pipeline/*.mjs $SKILL/scripts/pipeline/*.py tools/
npm i -D playwright-core                            # Chromium: Playwright's, $CHROME, or film.config.json "chrome"
node tools/build_plan.mjs && python3 tools/validate_plan.py film-plan.json
node tools/render.mjs stills --frames 0,119,120,239 --w 540     # then look at out/stills/*.jpg
node tools/chunk.mjs render --plan film-plan.json --from 0 --to 240
node tools/tone-mix.mjs                             # or any recording trimmed to 10 s, or an ffmpeg sine (below)
node tools/chunk.mjs assemble --plan film-plan.json --audio out/audio/mix.wav   # muxes, then runs verify_video.py
python3 $SKILL/scripts/contact-sheet.py dist/hello-916-v1.mp4 --count 8 --cols 8 --out out/sheets/smoke.jpg
```
Look at `out/sheets/smoke.jpg`: a warm ring, the title HELLO fading in and out, a cut to a cold ring at frame 120, and
a moon that keeps going round across the cut. Then `git add -A && git commit`.

An ffmpeg sine works as the placeholder too (assemble refuses a silent track, so don't use `anullsrc`):
`mkdir -p out/audio && ffmpeg -f lavfi -i "sine=frequency=220:duration=10" -ac 2 -ar 48000 out/audio/mix.wav`.

Measured in the Nova container (Oct 2026): stills about 1.5 s for four frames, the 240-frame render about 1 minute,
assembly and verify a few seconds, `chunk.mjs costs` 50-120 ms a frame. `freeze-version.sh 1` and `--check` pass with
this builder, and `PLAN_VERSION=2` retimes the cut and moves the pieces to `dist/hello-916-v2/`.

## What to keep as it grows

- `?plan=` is relative to the repository root, and the page fetches `'../' + plan` (it lives in `src/`).
- The output canvas stays the first `<canvas>` in the document.
- `renderFrame` returns an integer `ms`. WebGL is lazy, so time it after a 1-pixel `readPixels`: Chromium's
  `finish()` doesn't wait.
- No `Math.random`, `Date` or carried state in the pixels; `ctx.reset()` every frame.
- Prose goes in shot `purpose/action/framing/note`, never in `format` or `defaultPost`: those are hashed into every
  frame.
