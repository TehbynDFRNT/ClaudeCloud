# The 9:16 cut: department brief

The film is now delivered **vertical, 1080×1920 (9:16)**, in **two cuts** that share one picture and one score:

| Plan file | Cut | Names (giant / dwarf) | End title |
|---|---|---|---|
| `film-plan.json` | David & Goliath (`david-916`) | GOLIATH / DAVID | DAVID & GOLIATH |
| `film-plan-prometheus.json` | Prometheus (`prometheus-916`) | ZEUS / PROMETHEUS | PROMETHEUS |

The cuts differ only in their name cards, end title, shot descriptions and two frenzy studies. In the David cut, F29.1 uses the preset `F29.1-sling`. In the Prometheus cut, F29.1 uses `F29.1-eagle` and F30.3 uses `F30.3-chains`. Everything else renders identical frames in both cuts.

The director's notes that drive this version:

- **9:16.**
- **No white flash at ignition. The picture goes dark instead, and the sound must be far more intense.** It has to feel like the climax.
- Strike hits also no longer flash white. They punch the exposure down: the `dip` effect, a dark pulse.
- **New ending.** The Milky Way, as seen from a dark-sky Earth with no light pollution. A new star appears: the same nova, seen from here. The closing words are *"The birth of a new star; the Nova."* The film ends there, with no credits.

## Frame geography (portrait)

- **Before ignition (frames 0–2724):** a **3:4 window**. Black bars cover the top and bottom 12.8% of the height (246 px each at 1920). Compose inside y ∈ [0.128H, 0.872H].
- **From ignition (frame 2725):** the frame opens to the full 9:16. This happens in the dark, so the opening is never seen.
- **Text-safe zones** (keep these regions dark and uncluttered while text is up):
  - Name cards on S02 (giant) and S03 (dwarf): bottom-left, x ≥ 0.09W, baseline at 0.78H, subtitle to about 0.82H.
  - End title on S29b: centred band 0.76H–0.84H.
  - Coda lines on S31: centred band 0.79H–0.90H, over the dark ground below the horizon.
- **Ring registration for the S29a → S29b match dissolve:** in portrait the ring is centred on the frame, with radius **0.40 × frame width** (432 px at 1080 wide). The nova scene (S29a) and the studies scene (S29b) must both hit it.

## How to reframe a shot

Scene presets may carry a `portrait` block. It is used only in portrait renders; landscape renders ignore it, so the 16:9 film is untouched.

```js
'S04-scale': {
  ...landscape params...,
  portrait: {
    framing: { roll: 90, zoom: 0.62, pan: [0.1, 0], dolly: 0 },   // or keyed: [[0, {...}], [1, {...}, 'inOutSine']]
    // any other preset params to override in portrait, e.g. cam: [...], screen: [...], view: [...]
  },
},
```

- **`framing`** reframes every camera the shot builds (`engine/math.js` `setFraming`). Each camera is reframed exactly once.
  - `roll`: degrees, counter-clockwise on screen.
  - `zoom`: divides tan(fov/2); 2 is twice as tight.
  - `pan`: the point of the original 16:9 frame (frameUV, y up) that becomes the new centre.
  - `dolly`: world units forward along the view direction.
  - Keyed form: `[[u, {..}], [u, {..}, easing]]`, with u from 0 to 1 over the shot.
- **Exact rotation trick.** `roll: ±90, zoom: 0.5625` reproduces the landscape composition rotated by 90°, which fits 9:16 exactly. In space there is no "up", so this is often the best start: the giant looms above and the stolen matter falls down the frame. Then zoom or pan to taste. Don't use it where the world has a real up (paper, horizons, text).
- **Other overrides.** Anything else in `portrait` overrides preset params in portrait. Use this for scene-specific cameras or 2D layouts: re-authored `cam` keys, the white dwarf's `screen` offset, the studies' `view`, sprite layouts.
- **In code.**
  - `E.portrait` and `S.portrait` are true for portrait renders.
  - `S.framing` is the active framing.
  - `E.k` = short side / 1080. Use it for stroke widths, glow sizes and type, in place of `E.H / 1080`. In landscape the two are identical.
- **Rebuilding a camera from an existing one** (drift, shake): start from `cam.raw`, the unframed camera. Otherwise the framing is applied twice. The existing sites in binary, vortex, atoms and plasma already do this.
- **Hard-coded aspect.** If a scene assumes 16/9 itself (for example `aspect = 16 / 9` in the white dwarf orbit rig), make it portrait-aware. Keep landscape behaviour identical.

## Composing for vertical

- **Phone first.** The subject should read at a glance on a phone. Make subjects bigger in frame than in the 16:9 cut. Never lose the subject in black or cut it off at the side.
- **Use the height.** The giant above, the dwarf below. Matter pouring down. Plumes rising. Spirals seen top-down filling the frame.
- **Keep the motion.** Keep each shot's motion and intent from the 16:9 cut (see `purpose`, `action` and `framing` in the plan). Only the geometry changes.
- **Frenzy shots (F27.1–F31.8).** These are 9–19 frames each. Make every one a bold, instantly legible composition.

## Rendering and checking (CPU is shared by about ten agents: keep renders small)

```bash
node tools/render.mjs shot S04-scale --n 5 --w 540          # 540x960 frames -> out/shots/S04-scale/
node tools/render.mjs sheet --frames 606,640,680 --w 360 --cols 6 --out out/sheets/mine.jpg
node tools/render.mjs sheet --shots --w 270 --cols 16 --out out/sheets/all.jpg   # one frame per shot, whole film
# the other cut: add --plan film-plan-prometheus.json
```

- Look at every image with the Read tool. Check the first, middle and last frames of every shot you own, and check it inside the 3:4 window.
- Never render full-size film frames, and never run `tools/chunk.mjs`.
- Don't edit `src/engine/*`, other departments' scene files, the plans, or `tools/*`. If you need an engine or plan change, say so in your final report.
- Don't commit. The lead integrates and commits.
