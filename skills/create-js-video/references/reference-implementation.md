# The reference implementation: where Nova's code is, and what to copy

The references describe Nova's engine, builder, grid fitter, score and Edit Room in prose. The code itself is in the
director's repository, pinned below. Copy from it rather than writing the engine, the builder, the grid DP, the
mixer or the review page from the prose. If you can't reach the repository, start from `assets/starter/` (a minimal
page, engine, scene, builder and placeholder soundtrack that run the whole pipeline) and grow it from the references.

## Contents
1. The pinned commit
2. Getting the files
3. What to copy, by job
4. What not to copy
5. Known defects at this commit

## 1. The pinned commit

| | |
|---|---|
| Repository | `https://github.com/TehbynDFRNT/ClaudeCloud` (owner `TehbynDFRNT`, repo `ClaudeCloud`) |
| Branch at the time | `claude/cosmic-david-goliath-film-cmezxu` |
| Commit | `c5c7046ad6336fe4bf80a9745cc3d3548c1266ed` (v4.2, 2026-10-04) |

The commit is the authority; the branch moves on. Every line number in this skill refers to this commit.

## 2. Getting the files

In a Claude Code cloud session, attach the repository with the `add_repo` tool (owner `TehbynDFRNT`, repo
`ClaudeCloud`). Call it without checking the URL first: a private repository answers 404 to unauthenticated checks.
Then clone, or fetch only the paths you need:
```bash
git clone --filter=blob:none --no-checkout --single-branch \
    --branch claude/cosmic-david-goliath-film-cmezxu https://github.com/TehbynDFRNT/ClaudeCloud /tmp/nova-ref
mkdir -p ref/nova && git -C /tmp/nova-ref archive c5c7046ad6336fe4bf80a9745cc3d3548c1266ed \
    src/main.js src/index.html src/engine src/fonts tools/build_plan.mjs | tar -x -C ref/nova
```
Tested from the Nova container: about 200 MB of history, then `archive` writes only the named paths. If `add_repo`
or the clone is refused, the repository isn't shared with this account: say so, and use `assets/starter/`.

## 3. What to copy, by job

| Job | Paths at the pinned commit | Lines | Reference |
|---|---|---|---|
| Page and engine | `src/index.html`, `src/main.js`, `src/engine/` (film, gl, glsl, post, math, music, noise, rng, titles) | about 1,150 | architecture.md |
| Fonts (OFL, licences beside them) | `src/fonts/` | | picture-craft.md §8 |
| Scene examples | `src/scenes/<id>.js` + `src/scenes/lib/` (studies, statue, nova, signoff ...) | | architecture.md §4, picture-craft.md |
| Plan builder | `tools/build_plan.mjs` (cuts, `PLAN_VERSION`, `PLAN_OUT`, inserts, `STATUE_LOCK`) | 426 | timeline-and-music.md §3-6 |
| Bar grid | `tools/analyze_music.py` (chroma DTW), `tools/refine_grid.py` (onset DP) | 133 + 159 | timeline-and-music.md §2 |
| Score and audio render | `src/audio/index.html`, `src/audio/score.js`, `tools/render-audio.mjs` (render, `--verify`) | about 2,770 | audio.md |
| Edit Room | `src/review/editroom.html`, `tools/build-review.mjs`, `tools/editroom-serve.mjs`, `tools/test-editroom.mjs`, `tools/test-editroom-local.mjs` | about 2,100 | review-edit-room.md |
| 3D scan preparation | `tools/prepare_statues.py` (trimesh, pymeshlab) | | picture-craft.md §4 |

The pipeline tools (`fingerprint.mjs`, `render.mjs`, `chunk.mjs`, `verify_video.py`, `validate_plan.py`) and
`publish-downloads.sh` are already in this skill's `scripts/`, generalised and fixed. Copy those from the skill, not
from the repository.

## 4. What not to copy

- The repository's `tools/chunk.mjs`, `render.mjs` and `fingerprint.mjs`: use `scripts/pipeline/`.
- `tools/encode.mjs`: the legacy single-machine mux, with hard-coded paths and AAC at 320k (pitfalls.md §2).
- The scenes as finished pictures for another director: they are this director's film. Copy their techniques.
- `media/`, `dist/` and `analysis/`: assets, renders and the grid belong to Nova's recording.

## 5. Known defects at this commit

- `F30.3-chains` (Prometheus cut) still draws a forearm and a fist: picture-craft.md §1 has the fix.
- `src/scenes/lib/studies-hand.js` is an orphan, and a `HAND = false` branch is kept in
  `src/scenes/lib/studies-prometheus.js`.
- `src/scenes/statue.js` `defaultFigure()` falls back to `plan.cut`/`plan.id` (pitfalls.md §1).
- `src/review/editroom.html` has no load timeouts, retries or watchdog: use `scripts/robust-media-loader.js`.
- Edit Room cut ids collide across versions (review-edit-room.md §8).
- The sign-off scene only warns when its SVG fails to load (architecture.md §8).
