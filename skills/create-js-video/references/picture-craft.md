# Picture craft: what worked on screen, and what the director rejected

Techniques and taste from "Nova, Episode 1" (a cosmic short with marble-statue inserts and Renaissance ink studies,
in 9:16). This file is about choices that read well, or badly, to this director. The generic drawing and motion
guidance is in the existing skill's `drawing.md`, `motion.md` and `art-direction.md`.

## Contents
1. No hands
2. Recomposing approved 16:9 photography for 9:16
3. Inserts that keep the host's clock
4. 3D scans rasterised inside a scene
5. A turn on the film's clock
6. Locked framing beats cinematic variety
7. Procedural ink studies
8. Text and titles
9. The sign-off card
10. Climaxes without white flashes
11. Checking pictures

## 1. No hands

The director's words: **"The hands look weird just do no hands."** Treat it as a standing rule for this director,
in every cut he revisits and every later version. It covers hands, fists, fingers, thumbs, wrists and forearms, drawn or modelled,
partial or stylised.
- **Show the object, its path and a diagram instead.** Nova's fixes so far:
  - The sling lost its fist. The sling's finger loop sits at the centre of a compass circle, the plaited cords and
    pouch swing round it, and the flight path is drawn.
  - The stolen fire lost its hand. The fennel stalk alone carries the ember in its pith and the flame rising from it.
  - The 3D figures never needed a fix: they are head and bust scans (Head of David, Alexander as Helios, the
    Pergamon giant), cut 0.35-0.45 head heights below the chin in `tools/prepare_statues.py`, above the shoulders,
    so no arm or hand can enter the frame. Crop any figure scan the same way.
- **Nova's status, stated plainly.** The director had chosen David as the only cut to revisit: "Apply those notes
  transpose only to David only re render David I have chosen it to be the only one we will revisit the others later"
  (03:34). "The hands look weird just do no hands" (04:14) came during that David-only round. So:
  - **David is clean from v4 on**, v4.2 and the 4K master included, checked on rendered frames.
  - **Prometheus and Sol are deferred, not missed.** No later version of them was asked for or delivered.
  - **Delivered films older than commit 853008d still show hands**: the fire study's fist in `S10-prometheus` in v2
    and v3 of all three cuts, David's sling fist in his v2 and v3, and in Prometheus also the chains fist. Only David
    has a v4 delivery.
  - **Prometheus's `F30.3-chains` still draws a forearm and a clenched fist** at the pinned commit
    (reference-implementation.md), unchanged since commit 853008d. A grep of the Sol cut's own study code
    (`src/scenes/lib/studies-sol.js`) finds no hand.
  Don't re-render a deferred cut unasked: record its violations as open items. When a deferred cut comes back, run
  `notes-to-version.py` across all plans and apply the standing rules first.
- **The chains fix, for when Prometheus is revisited.** `F30.3-chains` (frames 2135-2153 of
  `film-plan-prometheus.json`; the fist is plain at 2144 and 2150) calls `chains()` in
  `src/scenes/lib/studies-cuts.js`. That function draws the arm frame (line 264), the forearm and a clenched fist with
  knuckles, tendons and thumb (lines 343-414), and a cuff round the wrist (from line 415). The fix:
  1. In `chains()`, delete the arm frame, the forearm and fist strokes and their hatching (`fistTone`). Draw the
     cuff hinged open and empty on the rock, with the links running to the ring bolt. Fix the comments at lines 4
     and 234 ("a wrist bound to the rock", "the hand strains open above it").
  2. In `src/scenes/studies.js`, fix the comment on the `F30.3-chains` preset (line 199) and on `S10-prometheus`
     ("the fist on the left third", lines 148-149).
  3. Delete `src/scenes/lib/studies-hand.js`. Nothing imports it, so it is in no module tree: deleting it changes no
     fingerprint, and it can go now.
  4. In `src/scenes/lib/studies-prometheus.js`, which `studies-drawings.js` imports, delete the `HAND = false`
     switch (line 107), the `if (HAND)` block (lines 191-216), the `HAND` term at line 276, the finger, thumb, thenar
     and arm outlines it alone uses (from line 74), and the header that describes the fist (lines 2-9).
  5. Fix the stale comments in David's `sling()` in the same file (the cords "leave the fist", the path lifts "over
     the forearm": lines 145, 156, 194). No hand is drawn there; the words invite one back.

  **What it re-renders, and the safe order.** Steps 1, 2, 4 and 5 edit the `studies` module tree, so every studies
  shot in all three cuts goes stale: 8 shots and 368 frames per cut, plus their dissolve partners. That includes
  David's delivered studies pieces and the David HD-master pieces in `dist/david-916-v4-2160x3840/` (hd-master.md).
  Until the David HD master is final, use a separate scene id instead: a new `studies-chains` module (registered in
  `src/scenes/index.js`, which is not hashed) with a fist-free chains drawing, and point the Prometheus F30.3 entry at
  it in the builder. That re-renders only F30.3 in Prometheus. Leave the shared files untouched until the next full
  studies re-render, then delete the dead code. Afterwards, render F30.3 in the Prometheus plan
  (`render.mjs shot F30.3 --plan film-plan-prometheus.json --n 3`) and look.
- **Audit every cut the rule covers.** Cut-specific presets hide extra drawings, so list each cut's variant of a
  touched scene with `notes-to-version.py` and look at every one.
  ```bash
  grep -rnwiE 'hand|hands|fist|finger|fingers|knuckle|thumb|palm|wrist|forearm' src/scenes   # comments count too
  python3 $SKILL/scripts/contact-sheet.py dist/<cut>.mp4 --plan film-plan-<cut>.json --shots <every study shot> --width 360
  ```
  Then look at every study frame of every cut in scope. The grep also finds the artist's hand in comments
  ("hand-length strokes", "the hand stops a little short") and the eagle's feather "fingers"; read each hit. Delete
  dead code that draws hands, such as an orphaned `studies-hand.js` or a `HAND = false` branch. Otherwise a later
  edit can bring the hands back. Fix descriptive text too: a shot whose `action` still says "a hand carrying a
  flame" will mislead the next person.
- Prefer objects, instruments, diagrams, orbits and geometry to bodies in general. Where a human presence matters,
  imply it: a tool, a trace, a mark, a notebook, the impulse to measure.

## 2. Recomposing approved 16:9 photography for 9:16

When the director has approved the look ("absolutely fantastic and beautiful"), a format change must not restyle
it. Recompose through a camera framing hook and leave the shots themselves alone.
- A preset's `portrait: { framing: { roll, zoom, pan, dolly }, ...overrides }` applies only to portrait renders.
  `framing` can also be keyed: `[[u, {...}], [u, {...}, 'inOutSine']]`.
  - `roll` is in degrees: positive turns the picture clockwise on screen.
  - `zoom` divides tan(fov/2).
  - `pan` names the point of the old frame that becomes the new centre.
  - `dolly` is in world units along the view.
- Every camera built while framing is set is reframed exactly once. Code that rebuilds a camera (drift, shake)
  must start from `cam.raw`, or the framing is applied twice.
- **The exact rotation trick:** `roll: ±90, zoom: 0.5625` reproduces the landscape composition rotated by 90°, which
  fits 9:16 exactly. In space there is no "up", so this is often the best starting point. Don't use it where the
  world has an up: paper, horizons, text.
- Compose for the phone. Subjects bigger than in 16:9. Use the height: the giant above, the small star below, matter
  pouring down. Keep each shot's motion and intent. Beat cuts of 9-19 frames need one bold, instantly legible
  composition each.
- Use `E.k` (short side / 1080) for stroke widths, glows and type.
- Keep text-safe zones dark while text is up. Register match dissolves exactly (Nova: the ring centred, radius
  0.40 × width, in both scenes).
- A 3:4 window (bars of 12.8% top and bottom) before the climax that opens to full 9:16 in the dark: the change is
  never seen, but the frame feels bigger afterwards.

## 3. Inserts that keep the host's clock

An insert (a 1 s statue glimpse) cut into a host shot splits it into `S12` and `S12·2` with
`span: [hostStart, hostEnd]`. The host's motion continues as if the insert were not there; it is never compressed or
restarted. See architecture.md §7 and timeline-and-music.md §4.

## 4. 3D scans rasterised inside a scene

Public-domain 3D scans (SMK, the Statens Museum for Kunst Royal Cast Collection, Public Domain Mark 1.0) became
marble figures on black, rendered with raw WebGL2 inside one scene module.
- **Preparation** (Python: trimesh, pymeshlab):
  - remove the pedestal with capped plane cuts;
  - move the mesh into a documented head space (origin at the head centre, +Y the turn axis, +Z the gaze);
  - decimate with a triangle budget weighted toward the face;
  - bake per-vertex AO, cavity, thickness and a skin mask;
  - measure anchors (eyes, chin, crown);
  - write `media/scenes/statue/<figure>.json + .bin` with the source and licence.
- **Rendering**, inside `render()`:
  1. a key-light shadow map (depth only, orthographic, fitted to the shot);
  2. a G-buffer (position, normal, bakes);
  3. marble lighting once per pixel: PCF key, translucent light bleed, wrapped diffuse, low-gloss GGX, faint
     veining, coloured rims through thin edges;
  4. a quarter-resolution coverage pass blurred into an aura;
  5. FXAA'd composite into the scene target.

  Save and restore every bit of GL state for the engine.
- Light each figure for its face. David's curls drown his face under a top light, so he kept a lower key from the
  right, and was framed closer (head and neck) because up close he is more interesting.
- Crop every figure above the shoulders (`crop_y` -0.85 to -0.95 head units, the chin at -0.5). Busts avoid hands
  entirely, which this director rejects (§1).
- Pass the figure explicitly in each shot's `params` and throw when it is missing. Nova's `statue.js` falls back to
  guessing it from `plan.cut`/`plan.id`, which the fingerprint can't see (pitfalls.md §1).

## 5. A turn on the film's clock

The figure turns 90° over the **whole film**: pure profile at the first glimpse, dead eye contact in the last shot.
- The yaw is a function of the film frame, `turnYaw([f0, f1, 90, 0, k], S.f)`, with a C1 settle over the last 8%
  (`k = 0.92`). Inside each short glimpse the figure is nearly still. Each glimpse shows the angle the film's time
  gives it, so the turn reads across cuts. Nova's eye contact lands 40 frames into the final shot.
- The director chose this over turning only while seen (one linear segment per insert). That idea was abandoned,
  but the code is kept, switched off.
- Rotation inside a shot needs **per-frame shadow maps**. Cache the map per shot only when the turn inside the shot
  stays under about 0.5°.

## 6. Locked framing beats cinematic variety

v3 gave each insert a different cinematic angle. For v4 the director asked for "the repeated return to the same
angle, same zoom, only the model rotates": the whole statue piece small in the black, light from above, camera locked
(`drift: 0`), with one rare cinematic angle kept. It read better. When a motif recurs, hold the frame and let the
subject change; the repetition becomes the rhythm.

## 7. Procedural ink studies

Renaissance-style studies (iron-gall ink and red chalk on parchment, mirror script) that are the same geometry as
the real imagery they cut against: the Roche figure-eight, the parabolic stream, the vortex turning the same way as
the real disk, the rings.
- A drawing is a list of strokes and texts in page units (1 = frame height, y down), each with a **reveal window**
  `[t0, t1]` in shot-local seconds. A frame draws every stroke up to the pen's position at `t`: a pure function of t.
- Strokes are variable-width polygons filled into an additive canvas, one material per channel: R iron-gall ink,
  G red chalk, B relief (stylus incisions, the wet bead). A parchment shader reads them back, so the ink sits in the
  paper's grain.
- Hatching follows form: cross-contour arcs over cylinders, with shadow sides firmer and lit sides broken.
- Seeded value noise drives the line wobble. Marks are tied to stroke ids so they don't swim.
- Script in IM Fell English, mirror-written for Leonardo's notes.

## 8. Text and titles

- Plan `text` items are drawn by the titles layer on their own canvas after tonemapping, not in a scene's
  `overlay()`.
- Faces: Cinzel for Roman-capital titles (the director asked for "excellent font": **NOVA: DAVID** in Cinzel with a
  molten-gold tint), Cormorant Garamond (italic) for lines and credits, IM Fell English for study script. All OFL,
  with the licences in `src/fonts/`.
- Sizes follow the short side (×1.3 in portrait). Lines are shrunk to fit 86% of the width. Give each line a fade in
  and out, and enough frames to read on a phone.
- **Hard-code measured text widths inside scenes.** Text a scene centres with `ctx.measureText` at render time
  depends on whether the webfont has loaded in that worker: a helper whose font loads late measures the fallback
  face and centres the line differently, a jump between pieces the fingerprint cannot see. Measure once in Chromium
  and write the number, with how it was measured, next to the constant. Nova: "A king is crowned" sets 407 px wide in
  IM Fell English italic at the renderer's 64 px base, so `w = 407 / 64 * size * PX` (`PX = 1/1080`), drawn at
  `x = -w / 2` (`src/scenes/lib/studies-drawings.js:457-460`). The measuring script: Playwright from
  `playwright-core` (Nova's repository has no `playwright` package: `ERR_MODULE_NOT_FOUND`), the woff2 inlined as a
  data-URL `@font-face`, `await document.fonts.load('italic 64px "IM Fell English"')`, then
  `canvas.getContext('2d').measureText(str).width`.

## 9. The sign-off card

The director's real signature, written on black in his last 3 s, after the final stare goes to black.
- Fetch the vector from his site. If the container's network blocks the site, the WebFetch tool can still fetch it
  and saves binaries to a file. Store it as `media/scenes/signoff/<name>-signature.svg`: one filled path.
- Fill it once into a canvas at target size. Reveal it with a **soft front** sweeping left to right as the pen
  travels; the wet ink at the front glows faint gold and cools to warm white behind it.
- The words under it (name, "SEE MORE", the URL) are plan text.
- Make it a new scene module: no engine change, so every other piece keeps its fingerprint.

## 10. Climaxes without white flashes

The director rejected white flashes: "No white flash at ignition. The picture goes dark instead, and the sound
must be far more intense."
- Strikes punch the exposure **down**, with the `dip` effect (fast attack, exponential recovery).
- The ignition cuts to black. The climax is heard, and the eruption emerges from the dark 54 frames later, never as
  a full-frame white-out.
- HDR light does the rest. Hot cores clip to white with coloured falloff inside a dark frame.

## 11. Checking pictures

- Look at rendered frames, never at code alone. Use contact sheets per shot (`contact-sheet.py --plan`), the cut
  boundaries (`--at cuts`), and motion strips around fast action.
- For a grade or a new render size, measure before looking: black percentiles of the active picture, faint-star
  counts, luma ratios against the 1080 frame, then 1:1 crops (hd-master.md §2-3). "Deeper blacks" judged by eye
  alone overshoots.
- For a note, make before/after sheets of the same frames, side by side:
  `python3 $SKILL/scripts/contact-sheet.py new.mp4 --before old.mp4 --frames 2030,2040,2144 --cols 6`.
- For creative work, run a judge panel. Several independent reviewers score the sheets against the brief. An art
  director then verifies the change on before/after frames before the work counts as done. Prompt templates and
  the rubric: director-notes-loop.md §6.
- Recheck every cut's variant of a changed shot. Check standing rules (no hands, no flashes) on every delivery of
  every cut in scope.
