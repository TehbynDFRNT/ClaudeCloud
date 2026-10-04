# Timeline and music: a plan built from musical positions

The plan (`film-plan.json`) is the contract every other part reads: the engine, the score, the fingerprints, the
distributed render, the review page and the delivery checks. Generate it with a builder script, from a storyboard
written in **musical positions** on a bar grid fitted to the actual recording. The picture then cuts on the music,
and a change of tempo map or edit moves every dependent frame at once. (The director's existing skill covers the
generic contract in `timeline.md` and `timing.md`; this file adds the builder, the grid and versioning.)

## Contents
1. The plan schema in practice
2. The bar grid: fitting the recording
3. The builder: storyboard in bars, frames derived once
4. Inserts, spans and generated sequences
5. Several cuts from one builder
6. Versions: PLAN_VERSION, frozen plans, new ids
7. Cues, effects and text
8. Checks

## 1. The plan schema in practice

Top level: `id, cut, title, version, fps ("24/1"), frames, width, height, backend, timingMode, format { letterbox },
defaultPost, shots, overlays, audio, cues, effects, text, assets, checks`.

| Field | Shape | Notes |
|---|---|---|
| `shots[]` | `{ id, start, end, scene, preset?, params?, span?, sync?, purpose, action, framing }` | half-open `[start, end)`, contiguous, cover the film once. `purpose`, `action`, `framing`, `note` are descriptive: the fingerprint ignores them, so cuts that differ only in descriptions share frames. |
| `overlays[]` | `{ id, type: 'dissolve'|'bleed', from, to, start, end }` | transitions; both shots render during the overlap |
| `audio[]` | `{ id, path, timelineStart, timelineEnd, sourceInSeconds, playbackRate }` or `{ id, generated: true, ... }` | placements of the recording(s) on the film timeline, in frames |
| `cues[]` | `{ id, kind, frame, sourceAudioId?, sourceSeconds?, status, confidence, evidence }` | strikes, edit cuts, re-entries, bar lines, cannon shots... |
| `effects[]` | `fade {start,end,from,to}`, `letterbox {frame,from,to,frames}`, `dip {frame,amount,attack,decay}`, `shake {start,end,amp,env}` | global; the fingerprint includes the ones active on a frame |
| `text[]` | `{ id, start, end, content, style, font?, size?, y?, color?, fadeIn?, fadeOut?, maxCps?, minFrames? }` | drawn by the titles layer after tonemapping |
| `checks` | `{ audioRequired, videoCodec, pixelFormat }` | read by `verify_video.py` |

Never hand-edit a generated plan: change the builder and rebuild, or the next rebuild silently reverts you.

## 2. The bar grid: fitting the recording

A familiar piece of music does not tell you where *this performance* puts its bars. Fit them:
Nova's fitter is `tools/analyze_music.py` (the DTW structure map) and `tools/refine_grid.py` (the onset DP) at the
pinned commit (reference-implementation.md). Copy them; the steps:
1. **Structure map (DTW).** Align a score (MIDI of the edition, used only as an analysis reference and not
   redistributed) to the recording with chroma DTW (librosa). Output: bar and beat times, per-bar loudness and attack
   density (`analysis/music-map.json`).
2. **Grid (dynamic programming).** Refine bar lines with a DP over candidates ±300 ms around a smooth local tempo
   (5.8 ms resolution): score each pair of consecutive bar lines by onset evidence at the eight equally spaced
   eighths between them, minus a penalty for leaving the smooth bar duration; let the final fermata run free; then
   snap single eighths ±30 ms to clear attacks. Output: `analysis/grid.json` = `bars[] { bar, start, end,
   eighths[8], bassMidi[8] }` plus fit statistics per section (median distance to onsets, share within 25 ms).
3. **Label it honestly.** Write into the file that the times are signal-derived and not verified by listening, and
   say so to the director. Then confirm the anchors that matter (the downbeat the climax lands on, the strikes) by
   looking at onset envelopes around them and, when you can, by listening to the encoded file.

Pick the music's events by meaning, not by loudness: on Nova the bars before the closing tutti were a quiet solo at
-41 to -38 dBFS. The right place for the restart on the explosion was therefore the bar-56 tutti downbeat (-28 to
-25 dBFS), not the nearest loud onset.

## 3. The builder: storyboard in bars, frames derived once

`tools/build_plan.mjs` (Nova's, 426 lines, at the pinned commit: reference-implementation.md) in outline. The
skill's `assets/starter/tools/build_plan.mjs` is a 75-line version with `at()`, cuts, `PLAN_VERSION`, `PLAN_OUT`
and versioned ids:
```js
const grid = JSON.parse(read('analysis/grid.json'));
const A = { id: 'music-a', timelineStart: 0, timelineEnd: IGNITION, sourceInSeconds: 0 };            // placements
const B = { id: 'music-b', timelineStart: EXPLOSION - 1, timelineEnd: DECAY_END, sourceInSeconds: BAR56_SRC - 1/FPS };
function srcToFrame(s) { for (const p of [A, B]) { const t = p.timelineStart / FPS + (s - p.sourceInSeconds);
  if (t * FPS >= p.timelineStart && t * FPS < p.timelineEnd) return Math.round(t * FPS); } throw new Error(...); }
const at = (bar, eighth = 0) => srcToFrame(interpolate(grid.bars[bar - 1].eighths, eighth));   // bar 1-based
const SB = [
  { id: 'S01-abyss',  start: 0,         scene: 'redgiant', purpose: '...', action: '...', framing: '...' },
  { id: 'S02-giant',  start: at(3),     scene: 'redgiant', ... },
  { id: 'S08-arc',    start: at(14, 4), scene: 'binary', ... },           // the half bar
  { id: 'S17-strike', start: strike(33), scene: 'binary', sync: 'strike-33' },
  ...frenzy(),                                                             // generated beat cuts
];
// each shot runs to the next shot's start; then inserts, cuts, cues, effects, text; then write every cut's plan
```
- **Musical positions** (`at(bar, eighth)`) for anything that should land on the music.
- **Measured onsets** (`STRIKE_SRC = { 33: 96.536, ... }`, the strongest onset peak within ±80 ms of the bar line)
  for hits that must be frame-exact.
- **Authored frame counts** for picture beats that are not musical: Nova's ignition cut (2725), 54 frames of dark
  before the eruption, the coda's offsets, the 8 s stare, the 3 s sign-off. Name them as constants, and say in the
  plan which anchors are musical and which are authored.
- Derive frames **once**, in the builder. The engine converts music positions to film time with the same placements
  (`E.music`), and the score reads the plan's cues and placements. No other list of magic timestamps should exist.

## 4. Inserts, spans and generated sequences

- **Inserts.** A list of `[id, startFrame, endFrame, purpose]` cut into whatever shot is under them. The builder
  splits the host into `S12` and `S12·2`, both with `span: [hostStart, hostEnd]`, so the host keeps its own clock
  (architecture.md §7). It throws on any gap or overlap afterwards.
- **Generated runs.** Beat cuts are generated, not typed: `frenzy()` turned bars 27-31 into 4, 4, 4, 4 and then 8
  cuts per bar from a table of scenes, each `start: at(bar, 8 / n * i)`.
- **Film-clock parameters.** A motion that runs across the whole film (the statue's 90° turn) is one shared param
  (`turn: [fromFrame, toFrame, 90, 0]`) written onto every shot that shows it.
- **Locked variants.** A note like "the same angle every time, only the figure turns" became one `STATUE_LOCK`
  block: one preset for every insert, `drift: 0`, and a per-figure height. It was gated by version.

## 5. Several cuts from one builder

One storyboard, several cuts (`CUTS = { david: {...}, sol: {...}, prometheus: {...} }`), each with:
`file, id, title, figure, names (on-screen), endTitle, presets (shot → cut-specific preset), purposes`.
- The cuts share fps, frames, audio, cues, effects and shot timing, so **one mix serves every cut**: the audio
  renderer checks that every `film-plan*.json` in the directory has the same timeline.
- Pixel differences live only in `presets`/`params` (and text), so every shared shot renders once and is copied
  between cut folders as a twin piece.
- Check the cut-specific drawings separately: a rule like "no hands" has to be applied to every cut's variant. On
  Nova the David cut was cleaned and the Prometheus `F30.3-chains` study still draws a fist (open: picture-craft.md
  §1). `notes-to-version.py` lists each cut's variants of a touched scene.

## 6. Versions: PLAN_VERSION, frozen plans, new ids

- The builder takes `PLAN_VERSION` (default: the version in progress) and `PLAN_OUT` (where to write, relative to
  the repository root). Gate **every** structural difference: `const V4 = VERSION >= 4;` then `V4 ? at(59) : ...`.
- **New version, new id, new folder.** From v3 on, Nova's ids carry the version (`david-916-v4` →
  `dist/david-916-v4/`), so a version's pieces never overwrite the delivered version's. Use versioned ids from v1.
- **Freeze on delivery.** Copy the delivered plans to `plans-vN/` and prove they rebuild byte for byte
  (`scripts/freeze-version.sh N`). Re-run `freeze-version.sh --check` after every builder change.
- **Plans reproduce; pictures need more.** A shared scene module edited for v5 changes v4's pictures too. Gate
  picture changes through presets/params in the v5 plan, or accept that v4's pictures reproduce only from the commit
  they were rendered at, and tag that commit.
- **Sound deltas.** Keep them in the score as `DESIGN.vN = {...}`, applied when `plan.version >= N`. The score sees
  the whole plan, and the audio is rendered per version anyway.

## 7. Cues, effects and text

- Every cue carries `status` (`candidate`/`verified`), `confidence` and `evidence` (what measurement or decision
  put it there). The score schedules from cues (strikes, cannon approach with `distance` 1 → 0, salvos on beats), and
  the audio report measures at them.
- Effects worth having: `dip` (exposure punched down on a hit: Nova's director rejected white flashes), `letterbox`
  (a 3:4 or scope window that opens to full frame, ideally in the dark so the change is never seen), `fade`,
  `shake`. They are global, plan-level and fingerprinted where active; do not duplicate them inside scenes.
- Text is a plan item (`style: name | credit | title | line`), sized from the short side, shrunk to fit 86% of the
  width, with fade in and out. Give it `minFrames` and `maxCps`, and check it on a phone-sized contact sheet.

## 8. Checks

```bash
node tools/build_plan.mjs && for p in film-plan*.json; do python3 tools/validate_plan.py $p || break; done
scripts/freeze-version.sh --check
node -e "const p=require('./film-plan.json'); console.log(p.id, p.version, p.frames, p.frames/24)"
```
`validate_plan.py` (shipped in `scripts/pipeline/`, copied into `tools/` with the pipeline; `verify_video.py`
imports it) checks coverage, ids, bounds, paths and declared syncs. It does not judge whether the right musical event was chosen; that takes listening, or at
least an honest "signal-derived" label.
