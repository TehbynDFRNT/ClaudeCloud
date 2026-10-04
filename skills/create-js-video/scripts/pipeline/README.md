# pipeline/: fingerprints, frame renderer, distributed render, verify

The tools every frame-addressable film needs, with the layout in one place (`config.mjs`).

**Install into a project:** copy the `.mjs` and `.py` files into the project's `tools/`, `npm i -D playwright-core`,
and commit them. They belong in the project's git, not in a scratchpad: a container restart from an old snapshot
loses anything untracked. With the default layout (below) no config is needed; otherwise add `film.config.json` at
the repository root (keys in `config.mjs`). For a first run, use the skill's `assets/starter/`: a page, engine,
scene, builder and placeholder soundtrack that this pipeline renders, assembles and verifies in about two minutes.

Default layout (the "Nova" project's): `src/index.html` + `src/main.js` (page), `src/engine/` (engine),
`src/fonts/`, `src/scenes/<id>.js` (+ relative imports), `media/scenes/<id>/` (scene assets),
`analysis/grid.json` (bar grid), `film-plan*.json` (plans), `out/` (frames, audio), `dist/<plan.id>/` (pieces).

| File | Use |
|---|---|
| `config.mjs` | Root (`$FILM_ROOT`, else git top level, else cwd), layout defaults, Chromium discovery (`$CHROME`, Playwright installs, system paths). |
| `fingerprint.mjs` | `makeFingerprinter(plan)(f, W, H)`; CLI: `node fingerprint.mjs film-plan.json [frames...]`. What is and is not covered is in its header. |
| `render.mjs` | `stills`, `shot`, `sandbox`, `bench`, `strip`, `sheet`, `film`. `film` keeps frames whose fingerprint matches `manifest.json`. The page contract is in its header. |
| `chunk.mjs` | `costs`, `plan [--pending]`, `status [--json]`, `render [--only-scenes] [--skip-scenes] [--push]`, `assemble`. |
| `verify_video.py` | Structural verify of a muxed file against its plan: size, fps, frame count, codecs, audio present, a full decode with `-xerror`. Run by `assemble`. |
| `validate_plan.py` | Plan structure: coverage, ids, bounds, paths, declared syncs. Imported by `verify_video.py` from the same folder; run it on every plan after each build. |

Typical run:
```bash
node tools/chunk.mjs costs --plan film-plan.json                      # ms per shot -> out/costs.json
node tools/chunk.mjs plan --plan film-plan.json --parts 6 --pending   # cost-balanced ranges on the 240-frame grid
node tools/chunk.mjs render --plan film-plan.json --from 0 --to 960 --push   # on each helper (in the background)
node tools/chunk.mjs status --plan film-plan.json                     # until N/N blocks final (no stale)
node tools/chunk.mjs assemble --plan film-plan.json --audio out/audio/mix.wav   # + verify_video.py
```
`node tools/chunk.mjs --help` and `node tools/render.mjs --help` print the usage without reading a plan.

**Provenance:** `tools/fingerprint.mjs`, `tools/render.mjs`, `tools/chunk.mjs` of the "Nova, Episode 1" project
(ClaudeCloud, Oct 2026). Changes: paths from `config.mjs`; `status --json` (wanted fingerprints for
`restore-from-branches.py --want`); `plan` uses an optimal linear partition of the blocks (the original could give one
helper nearly twice another's work) and `--pending` counts only non-final pieces; the concat list is written to `out/`, not
into the cut folder; credits come from `film.config.json` `comment` or `plan.credits`; `--out` may be absolute;
usage is printed before any plan is read; `costs` accepts fractional `ms` and fails when it parses no timings (the
original wrote an empty `costs.json`); `assemble` runs `verify_video.py` from its own folder or `tools/` and fails
when neither has it (the original printed a warning and exited 0). `verify_video.py` and `validate_plan.py` are the
director's existing skill's scripts, unchanged. Fingerprints and status output are identical to the original's with
the default layout (checked on 19,978 frames and three plans).

**Caveats:** the frame cache is keyed by frame index (the fingerprint has no `f`), so never run two renders of
different plans into one frames folder at once. `assemble` checks structure, not loudness: run the audio delivery
check (`render-audio.mjs --verify` in Nova) on the muxed file. `assemble` needs every piece of the plan: test with a
short plan, not a `--from/--to` range.
