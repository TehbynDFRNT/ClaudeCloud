# Merging `create-js-video` (Nova) into the director's existing `create-js-video`

**For the skill's maintainer only. Not part of the runtime skill:** nothing in `skills/create-js-video/` links here.

The Nova skill (`skills/create-js-video/`) was written to be folded into the director's existing skill of the same
name. Every part is self-contained: SKILL.md sections stand alone, each reference covers one topic, and each script
has its own `.md`.

## Install order (until the merge is done)

Both skills are called `create-js-video`. Installed side by side, either can trigger and they disagree on defaults.
Install exactly one:
1. Before the merge: install the Nova skill alone for Nova-style work (WebGL engine, helpers, notes rounds), or the
   existing skill alone for Canvas, Remotion or HyperFrames work. Never both.
2. After the merge: install only the merged skill, and remove both originals.

## What this map is based on

A verbatim copy of the existing skill is kept beside this file in `base-skill/create-js-video/` (6.6 MB, including
`assets/recipes.zip`). It was copied from a session scratchpad (dated 2026-10-03), which does not survive a container
reset: commit `base-skill/` so it isn't lost. The director's current version may differ, so re-check the names
before merging. Don't install `base-skill/` from here; it is a reference copy.

## No filename collisions

| Existing | This skill | Relationship |
|---|---|---|
| `references/timeline.md` (generic contract, sync fields) | `references/timeline-and-music.md` | Adds the plan builder, the bar grid, cuts and `PLAN_VERSION`. Cross-link both ways. |
| `references/timing.md` (cue maps, `audio_map.py`) | `references/timeline-and-music.md` §2 | Adds the DTW + onset-DP bar grid. `audio_map.py` stays the first diagnostic. |
| `references/sound.md` (generic) | `references/audio.md` | Adds buses, the loudness loop, `DESIGN.vN`, measuring notes on the normalised mix, and the AAC 512k fast mux. |
| `references/review.md` (QA passes, handoff) | `references/review-edit-room.md`, `references/delivery.md` | Adds the Edit Room, notes, the loader, size-capped copies and the downloads branch. |
| `references/drawing.md`, `motion.md`, `art-direction.md` | `references/picture-craft.md` | Adds this director's taste and the techniques that worked. **Conflict:** `drawing.md` teaches hand construction. Add one line there: "This director rejects hands: see picture-craft.md §1." |
| `references/runtime-canvas.md`, `runtime-remotion.md`, `runtime-hyperframes.md` | `references/architecture.md`, `assets/starter/` | A fourth runtime: a WebGL2 HDR engine in headless Chromium with a page contract, and a runnable starter. |
| (none) | `fingerprints-and-distributed-render.md`, `director-notes-loop.md`, `pitfalls.md`, `reference-implementation.md` | New topics. |
| `scripts/validate_plan.py`, `verify_video.py` | `scripts/pipeline/validate_plan.py`, `verify_video.py` | Identical copies, shipped in `pipeline/` so they are copied into `tools/` with the pipeline and the Nova skill runs alone. In the merge, keep the `pipeline/` copies and either delete the top-level ones or keep them identical. `chunk.mjs assemble` looks beside itself, then in the project's `tools/`. |
| `scripts/audio_map.py`, `recipes.py` | (none) | Unchanged. |
| `assets/film-plan.example.json` | `assets/starter/tools/build_plan.mjs` (generates `film-plan.json`) | Compatible. Optionally add `id` (with a version suffix), `version`, `effects` and `format` to the example. |

## SKILL.md: section by section

| Existing section | What to add from the Nova SKILL.md |
|---|---|
| (top, after the intro) | **The director's standing rules**, as its own section near the top, because it overrides defaults. |
| Establish the job | **First hour on a new film** (the smoke test) and **First day**. |
| Choose the backend once | A table row: "Cinematic HDR WebGL, 3D scans, frame-addressable engine, distributed renders → WebGL2 engine in headless Chromium → `references/architecture.md`, `assets/starter/`". |
| Run the production loop, step 1 (one timeline) | "Generate the plan with a builder from musical positions; `PLAN_VERSION` and `PLAN_OUT`; versioned ids" → timeline-and-music.md. |
| step 2 (timing spine) | The bar-grid fit and "choose events by meaning, not loudness". |
| step 4 (prove the difficult shot) | The SwiftShader budget (about 1.5 s typical, 3 s at most per frame) and `render.mjs bench`. |
| step 5 (build and retime) | **Render only what changed**, **Render in parallel with helper sessions**, **Keep work safe from a container reset**. |
| step 6 (review as a film) | **Review in the Edit Room**, plus contact sheets of the encoded file. |
| step 7 (deliver) | **Deliver** (copies, downloads branch, download cards, early cuts). |
| (new step 8) | **Run a director's notes round**, the checklist. |
| Load specialist guidance only when needed | The rows of the Nova skill's **Reference map**. |
| Maintain a single set of rules | Fingerprint hazards (no `plan.version` in scenes; engine changes and prose in `format` re-render everything); gate every version difference; measure "X% louder" on the normalised mix; shell and monitor hygiene. |
| (end) | The **Scripts and templates** table, merged with the existing scripts. |

The merged SKILL.md comes to about 330 lines, under the 400-line target.

## Proposed merged description (under 1024 characters)

```
Create, edit, retime, render and deliver finished videos with JavaScript: Canvas 2D, React/Remotion,
HTML/HyperFrames, or a WebGL2 engine rendered frame by frame in headless Chromium with synthesised sound and
ffmpeg assembly. Use it for code-made films, music-synced cuts, vertical 9:16 shorts, motion graphics, kinetic
type, product demos, captions and explainers. Use it for frame-accurate review pages with pinned notes, render
farms of parallel helper sessions, and rounds of a director's notes ("render the next version", "the hands look
weird", "make the explosion quieter", "why did everything re-render"). Covers timeline contracts from a bar grid,
content fingerprints, distributed renders, loudness-calibrated mixes, versioned plans, size-capped delivery and
an indexed recipe library.
```

## After merging

- Keep `scripts/pipeline/` together: `config.mjs` is imported by the other three `.mjs` files, and
  `verify_video.py` imports `validate_plan.py` from its own folder.
- Keep `references/licenses/` from the existing skill. All of the Nova skill's scripts are original, adapted from the
  director's own project, or (the two validators) copied from the existing skill, as noted in each provenance.
- Run the starter's smoke test (`assets/starter/README.md`) once in a scratch repository, to confirm that the merged
  paths resolve. Then run `scripts/freeze-version.sh --check` and `node tools/chunk.mjs status` in a film repository.
