# HD master: a native 4K render of the same film

How Nova's David v4.2 became a 2160x3840 master: an engine that renders the same picture at any size, a check that
the 4K frame really is the 1080p frame, a whole-film grade kept out of the delivered plans, short blocks that keep
every piece under GitHub's 100 MB, 14 helpers, and HEVC, upload and web deliverables with two audio tracks. Nova's
code for all of it is at the pinned commit (reference-implementation.md): `src/engine/film.js`, `glsl.js`,
`post.js`, `src/scenes/lib/dwarf.glsl.js`, `tools/make-hd-plan.mjs`, `tools/site-wallpapers.sh`.

Do this only after the 1080p deliverables are frozen (director-notes-loop.md §4). The engine edit below changes
every fingerprint, so the delivered cut reads all stale afterwards (§1).

## Contents
1. Resolution independence: what to scale
2. Verifying resolution independence
3. The master grade
4. The 4K plan: id, folder, blocks, level
5. Rendering 4K on helpers
6. Encoding the deliverables
7. Stills and wallpapers at any size
8. The finisher: one detached chain

## 1. Resolution independence: what to scale

A 4K render of a plan authored at 1080p is a different picture unless every feature sized in **output pixels** is
re-authored in 1080p units. Nova's first 4K stills had stars and the white dwarf's glow at half size and whole scenes
about 20% darker. Grep for the culprits first: anything computed from `uRes`, `uFull` or `W/H` that is meant to be "a
pixel" (Nova: `pixAngle` from `uRes.y` at `src/scenes/binary.js:125`, `pixA` at `whitedwarf.js:59`, `pixAngle` from
`uFull.y` at `nova.js:226`). Each one feeds `starField` or `dwarfGlow`, which is where the fix went.

The scale is one global uniform, `uK = min(W, H) / 1080`:
```js
// src/engine/film.js, Film.setClock: global uniforms for every program
uK: Math.min(this.W, this.H) / 1080,   // output pixel scale: 1 at 1080p; pixel-sized features multiply by it
```
```glsl
// src/engine/glsl.js, the shared header
uniform float uK;           // output pixel scale: 1 at 1080p, 2 at 2160p (0 if unset: treated as 1)
```
What scaled in Nova:
1. **Star size.** `starField`'s pixel angle: `float pa = 2.0 * uTanHalfFov / uRes.y * max(uK, 1.0);`. Stars stay one
   1080p pixel wide, so at 4K they get finer, not fainter.
2. **Point glows.** `dwarfGlow` starts with `pixAngle *= max(uK, 1.0);`. Its core (angular radius at least 0.8 px),
   halo (6 px) and wide term (60 px) are multiples of one pixel's angle, so at 4K they had halved.
3. **Bloom pyramid and streak targets**, sized from the 1080p-equivalent frame (below).
4. **Shake and blur offsets**, which `post.js` multiplies by `k`.
5. **Stroke widths and type**, already scaled by `E.k` (architecture.md §4).

Use `max(uK, 1.0)`, not `uK`: some code paths (the sandbox, `render.mjs bench`) never set the global uniform, which
then reads 0, and previews under 1080 keep their old one-render-pixel stars. Scenes already authored in 1080p units
needed nothing (Nova's white-dwarf haze `hazePx` and filament widths used `refH`).

The post chain, in `src/engine/post.js`:
```js
// constructor: bloom and streak live at the 1080p-equivalent scale, so a larger render glows exactly like 1080p
this.k = Math.min(W, H) / 1080;
const bw = Math.round(W / this.k), bh = Math.round(H / this.k);
let w = bw >> 1, h = bh >> 1;                       // was W >> 1, H >> 1: 7 halvings from the OUTPUT size
for (let i = 0; i < 7; i++) { this.levels.push(G.target('bloomD' + i, Math.max(2, w), Math.max(2, h))); w >>= 1; h >>= 1; }
this.streakA = G.target('streakA', bw >> 2, bh >> 3);
// run(): shake and blur are authored in 1080p pixels
uShake: this.k === 1 ? p.shake : [p.shake[0] * this.k, p.shake[1] * this.k, p.shake[2]],
uBlur:  this.k === 1 ? p.blur  : [p.blur[0] * this.k, p.blur[1] * this.k],
```
A pyramid with a fixed number of halvings from the output size has a bloom radius in output pixels: at 4K the glow
would be half as wide relative to the frame. Sized from the 1080p-equivalent frame, the glow is identical and costs
no more than at 1080. Side effect: a half-size preview now uses the 1080 pyramid (the same look, slightly more work).

**Keep the delivered 1080 output byte-identical where you can.** `max(uK, 1.0)` is 1.0 at 1080, and `post.js`
skips the multiply when `k === 1`, so 1080 computes what it did before. Check with `cmp` on a re-rendered still:
```bash
node tools/render.mjs stills --frames 3375 --w 1080 --h 1920 --out tmp/res/same
cmp tmp/res/same/f03375.jpg tmp/crown/f03375.jpg && echo identical
```
The limit: changing a shader expression lets the GLSL compiler (SwiftShader) reorder or fuse arithmetic. After the
`dwarfGlow` edit, f1000 (the binary scene) differed in 6,342 of 2,073,600 pixels (0.31%), at most 10 levels, 569
pixels over 2 levels, while f412 and f3375 stayed identical. Claim "byte-identical where the shaders compile
alike", not more.

**What it costs the delivered cut.** Any edit under `src/engine/` changes every fingerprint. After this work,
`node tools/chunk.mjs status --plan film-plan.json` reads `0/17 blocks final` for the delivered 1080 David v4:
expected, not a fault. Keep the delivered master file and its tag. Don't re-render the delivered cut unless the
director asks: its pixels would be the same, or nearly so. Make the engine change on its own commit after the 1080
deliverables are frozen.

## 2. Verifying resolution independence

Render the same frames at both sizes, box-downscale the 4K to 1080, and compare. Pick about 22 frames across every
scene, including every point-glow and star-field scene:
```bash
F=150,360,412,600,720,1000,1180,1550,1640,1820,2265,2400,2700,2850,2950,3030,3180,3250,3380,3600,3790,4000
node tools/render.mjs stills --frames $F --w 1080 --h 1920 --out tmp/res/k1     # 1m05s, ~3 s/frame
node tools/render.mjs stills --frames $F --w 2160 --h 3840 --out tmp/res/k2     # 3m24s, ~9.3 s/frame
```
```python
import numpy as np
from PIL import Image, ImageStat
for f in [int(x) for x in "150,360,412,600,1000,3030,3250".split(',')]:   # all of $F in practice
    a = Image.open(f'tmp/res/k1/f{f:05d}.jpg').convert('L')
    b = Image.open(f'tmp/res/k2/f{f:05d}.jpg').resize((1080, 1920), Image.BOX).convert('L')
    ratio = ImageStat.Stat(b).mean[0] / max(ImageStat.Stat(a).mean[0], 1e-6)          # size-dependent light
    lo = lambda im: np.asarray(im.resize((135, 240), Image.BOX), dtype=float)
    print(f, round(ratio, 3), round(float(np.abs(lo(a) - lo(b)).mean()), 2))        # low-frequency MAD
```
- **Mean luma ratio** catches size-dependent light: glows, stars, bloom.
- **Low-frequency MAD** (both at 135x240) catches look changes without drowning in grain. Full-resolution MAD is
  mostly grain and detail and says little.
- Then look at 1:1 crops of the outliers side by side.

Nova's numbers: most frames had a ratio of 0.976-1.030 and a low-frequency MAD of 0.46-1.29. The outliers were all
point-glow scenes: f412 0.793, f600 0.832, f1000 0.783, f3250 0.875, f3030 0.944. They pointed straight at the
pixel-sized terms of `dwarfGlow`. After that fix they read 1.053, 1.029, 1.034, 1.006 and 1.016, with a
low-frequency MAD of 0.31-0.65.

## 3. The master grade

A whole-film grade that exists only in master plans (`plan.masterGrade`). The delivered look lifted blacks to navy
and maroon. A master for big screens and for phones in the dark wants true black, while keeping faint stars and the
statue's shadow detail. Grain in black also costs encoder bits.

`film.js` sets `p.mg = this.plan.masterGrade || null`. `post.js` FINAL takes `uMGOn`,
`uMG = [liftScale, blackPoint, toeGamma, toePivot]` and `uMG2 = [saturation, grainFloor[0], grainFloor[1], contrast]`,
and runs after ACES and the shot's own saturation and contrast:
```glsl
if (uMGOn > 0.5){
  g = g + uLift * uMG.x * vec3(0.02, 0.035, 0.07) * (1.0 - g);   // 1. the old blue shadow lift, scaled down
  g = max(g - uMG.y, 0.0) / (1.0 - uMG.y);                        // 2. black point
  vec3 toe = uMG.w * pow(max(g / uMG.w, 0.0), vec3(uMG.z));       // 3. smooth toe below the pivot
  g = mix(toe, g, smoothstep(0.0, uMG.w, g));
  g = (g - 0.5) * uMG2.w + 0.5;                                   // 4. contrast around 0.5
  float lg = luma(g); g = max(mix(vec3(lg), g, uMG2.x), 0.0);     // 5. saturation
  gf = smoothstep(uMG2.y, uMG2.z, lg);                            // 6. grain factor: no grain in true black
} else {
  g = g + uLift * vec3(0.02, 0.035, 0.07) * (1.0 - g);            // the delivered look, unchanged
}
...
g += grain * uGrain * mix(1.0, 0.45, l) * gf;
```
Titles composite after the grade.

**Fingerprint.** `tools/fingerprint.mjs` adds `masterGrade: plan.masterGrade` straight into the hashed global
object. `JSON.stringify` drops undefined keys, so delivered plans keep their fingerprints and master plans get their
own. This is the pattern for any optional plan-global field (fingerprints-and-distributed-render.md §1). The skill's
`scripts/pipeline/fingerprint.mjs` has the key.

**Choosing the values: measure, then look.** "Deeper blacks" judged by eye alone tends to overshoot.
1. Render the candidates on about 12 representative 1080 frames. Each candidate plan is the live plan plus a
   `masterGrade`, written with `node -e`:
   ```bash
   node -e 'const p=require("./film-plan.json");p.masterGrade={liftScale:.25,blackPoint:.012,toeGamma:1.15,toePivot:.2,saturation:1.03,grainFloor:[0,.06],contrast:1};require("fs").writeFileSync("tmp/grade/plan-B.json",JSON.stringify(p))'
   node tools/render.mjs stills --plan tmp/grade/plan-B.json --frames 150,412,1000,1180,1820,2400,2850,3030,3250,3600,3790,3380 --w 1080 --h 1920 --out tmp/grade/B
   ```
2. Black statistics of the **active** picture only. Crop out the letterbox bars (rows 250-1670 of 1080x1920 for
   Nova's 12.8% bars), then take the luma p1, p5, median and the share of pixels at or below 2:
   ```python
   g = np.asarray(Image.open(p).convert('L'))[250:1670]
   p1, p5, med = np.percentile(g, [1, 5, 50]); black = (g <= 2).mean() * 100
   ```
3. Faint-star survival: count local maxima of at least 14 that stand at least 6 levels above their 3x3 minimum, in
   sky crops (a flat two-pixel star counts twice: compare variants, don't read it as a census):
   ```python
   def stars(g, floor=14, rise=6):
       g = g.astype(np.int16); h, w = g.shape; c = g[1:-1, 1:-1]
       nb = [g[1 + dy:h - 1 + dy, 1 + dx:w - 1 + dx] for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dy or dx]
       peak = np.all([c >= n for n in nb], axis=0) & (c >= floor)
       return int((peak & (c - np.min(nb, axis=0) >= rise)).sum())
   ```
4. Look at 1:1 420x420 crops side by side: the Milky Way (f3600), the opening sky (f150), the statue's shadows
   (f3790).

| Variant | liftScale | blackPoint | toeGamma | toePivot | saturation | grainFloor | contrast |
|---|---|---|---|---|---|---|---|
| A, delivered | (lift 1, no grade) | | | | | | |
| B, gentle | 0.25 | 0.012 | 1.15 | 0.20 | 1.03 | [0, 0.06] | 1.00 |
| C, deep | 0 | 0.022 | 1.30 | 0.25 | 1.05 | [0, 0.08] | 1.03 |
| **D, chosen** | **0.12** | **0.016** | **1.22** | **0.22** | **1.04** | **[0, 0.07]** | **1.02** |

The evidence for D: f412's share of black pixels went 10.5% (A) to 69.5% (B) to 92.8% (C). Star counts on f3600
were A 61,437, B 31,176, C 19,056, D 23,947; on f150 A 1,999, B 858, C 86, D 214. The statue frame f3790 went from
25,332 star peaks to 13,519 under D, its median luma from 25 to 17. C crushed the faint stars. D kept the Milky Way,
David's shadow detail and his blue rim. The values live in `tools/make-hd-plan.mjs`.

## 4. The 4K plan: id, folder, blocks, level

```bash
node tools/make-hd-plan.mjs [--in film-plan.json] [--out film-plan-4k.json] [--w 2160] [--h 3840] [--block 72]
```
It writes `{ ...src, id: `${src.id}-${W}x${H}`, width, height, block, masterGrade }`: Nova's
`david-916-v4-2160x3840`, 4,025 frames. Only size, block and grade change, because the engine is
resolution-independent.
- **The size suffix gives the master its own `dist/<id>/` folder**, so its pieces never mix or twin with the
  delivered 1080 cut (W and H are in the fingerprint anyway).
- **Extend `.gitignore` for the new id before rendering.** Nova's `dist/*-916-v4/` did not match
  `dist/david-916-v4-2160x3840/`, and the stop hook flagged the untracked pieces. The fix added
  `dist/*-916-v4-*/`, `dist/*-916-v4-*.mp4` and `dist/*-916-v4-*.verify.json`.
- **Check the disk before a 4K finisher** (`df -h`): Nova had 20 GB free against about 7 GB needed (mezzanine,
  encodes and parts).
- **Size the block from a measured bitrate.** Render the heaviest passage and encode it with the piece settings.
  Nova's 48 frames of vortex and plasma (1622-1670) took 8m15s (about 10.3 s a frame):
  ```bash
  node tools/render.mjs film --plan film-plan-4k.json --from 1622 --to 1670 --out tmp/hdtest/frames
  ```
  At crf 17 the 49 frames came to 34.0 MB, 133.3 Mbps: a 240-frame piece would be about 167 MB (crf 14: 174.8 Mbps,
  about 218 MB). GitHub refuses files over 100 MB, so the 4K plan has `block: 72` (3 s): about 50 MB typical,
  about 72 MB at worst. Pushed pieces: the dark opening `chunk_00000_00072` was 7.6 MB; the vortex piece
  `01729_01765` (36 frames) 36.1 MB, about 1 MB a frame.
- **`chunk.mjs` reads the block from the plan** (`const BLOCK = plan.block || 240`; the skill's copy:
  `plan.block || film.config.json block`) and **picks the H.264 level from the size**:
  `plan.width * plan.height > 2048 * 1088 ? '5.1' : '4.1'`. 2160x3840 is 32,400 macroblocks, over level 4.1's frame
  limit; 5.1 allows 36,864 at 24 fps. All pieces of one plan share the setting, so they still stream-copy.

## 5. Rendering 4K on helpers

- **Cost.** 4K in SwiftShader costs about 9-10 s a frame on a 4-core container, against about 3 s at 1080: 22
  stills took 9.3 s a frame, the heavy vortex 10.3 s. `chunk.mjs plan --parts 12` without a costs file assumes
  1,500 ms a frame (it printed `totalMinutes 109.8`): useless for 4K. Generate the prompts with a measured default:
  ```bash
  python3 $SKILL/scripts/helper-prompts.py --plan film-plan-4k.json --parts 14 --default-ms 9500 --tag-prefix hd --json > hd-helpers.json
  ```
  That gave 14 ranges of 288 frames (4 blocks), estimated at 46.2 minutes each (hd12: 53.1).
- **Range edges must be multiples of the plan's block**, or `chunk.mjs render` refuses them (`--from/--to must be
  multiples of 72`); 240 is not a multiple of 72. `helper-prompts.py` now reads `plan.block` and words the prompt
  from it ("each 72-frame (3 s) block"); the version Nova ran needed `--block 72` by hand and still said "10 s".
- **Commit and push the engine, tool and plan changes before generating prompts.** Helpers check out the exact
  full SHA (Nova: `ae04f4d...`).
- **Launch helpers one at a time** and record each session id; check what exists before relaunching after a restart
  (fingerprints-and-distributed-render.md §8).
- **Check piece sizes on helper branches without restoring**:
  `git fetch -q origin <b> && git ls-tree -r -l origin/<b> -- dist/<id> | awk '{printf "%s %.1fMB\n", $5, $4/1e6}'`.
- **Collect with exact names or a plain glob.** `'<base>-hd[0-9]*'` (chosen to skip `-hd-downloads`) is not a valid
  git refspec; the old restore only warned, and Nova's finisher sat at "HD 2/56" for 20 minutes with all 14 branches
  on origin. The skill's restore now resolves such globs with `ls-remote` and fails on a failed fetch, and it reads
  each plan's `block` (fingerprints-and-distributed-render.md §9).

## 6. Encoding the deliverables

x265 10-bit at 2160x3840 on 4 cores, on the same 49 heavy frames: `-preset fast` 1.73 fps (55.6 Mbps at crf 17),
`-preset medium` 0.93 fps (71.9 Mbps). For 4,025 frames that is about 39 against about 72 minutes: use `fast`. The
container's ffmpeg also has `libsvtav1`; it lists `hevc_nvenc`, `qsv` and `vaapi`, with no GPU to use.

The source of every deliverable is the assembled 4K mezzanine (`chunk.mjs assemble --plan film-plan-4k.json`: the
stream-copied H.264 pieces). The audio is the approved stereo mix WAV and the binaural variant (audio.md §5):
```bash
A="-c:a aac -b:a 512k -aac_coder fast -ar 48000 -ac 2 -map 0:v:0 -map 1:a -map 2:a \
   -metadata:s:a:0 title=Stereo -metadata:s:a:1 title=Binaural_headphones -disposition:a:0 default -disposition:a:1 0 \
   -t 167.708 -movflags +faststart"                    # -t = frames / fps (4025 / 24), never -shortest
IN="-i dist/david-916-v4-2160x3840.mp4 -i out/audio-v4/mix.wav -i out/audio-v4-binaural/mix.wav"
# (a) the 4K master: HEVC 10-bit (no banding in the deep-black gradients), hvc1 for Apple players
ffmpeg $IN -c:v libx265 -preset fast -crf 18 -pix_fmt yuv420p10le -profile:v main10 \
  -x265-params keyint=48:min-keyint=24:aq-mode=3:psy-rd=1.5:vbv-maxrate=50000:vbv-bufsize=100000 -tag:v hvc1 \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 $A out/hd/nova-david-v4.2-2160x3840-hevc.mp4
# (b) the 1080 upload file for Reels and TikTok, supersampled from 4K: sharper than the native 1080 render
ffmpeg $IN -vf scale=1080:1920:flags=lanczos -c:v libx264 -preset slow -crf 16 -tune grain -maxrate 16M -bufsize 32M \
  -level 4.2 -pix_fmt yuv420p $A out/hd/nova-david-v4.2-1080x1920-upload.mp4
# (c) the 1080 web copy under 95 MB for the site: crf 19, maxrate 4000k (encode-copy.py --target github)
```
- **Track 0 is the stereo mix, the default.** Uploads use the first track. Track 1 is the binaural mix, titled for
  headphones.
- **Apply the mux lessons to every re-encode**: AAC 512k with `-aac_coder fast` (the 320k default coder overshot the
  true peak) and `-t frames/fps` instead of `-shortest`. Nova's first finisher draft broke both on the HD encodes.
- **Verify every muxed audio track, alternates included.** Run `render-audio.mjs --verify` on each deliverable
  against the stereo mix, and on the binaural track, extracted with its picture so the length and sync checks work,
  against the binaural mix:
  ```bash
  node tools/render-audio.mjs --plan film-plan.json --ref out/audio-v4/mix.wav --verify out/hd/a.mp4,out/hd/b.mp4,out/hd/c.mp4
  ffmpeg -i out/hd/a.mp4 -map 0:v:0 -map 0:a:1 -c copy out/hd/a-binaural.mp4
  node tools/render-audio.mjs --plan film-plan.json --ref out/audio-v4-binaural/mix.wav --verify out/hd/a-binaural.mp4
  ```
  A WAV that measured -16.0 LUFS and -1.3 dBTP says nothing about its AAC-encoded copy, and a decode-and-duration
  check is not a sound verify.
- **Publish** the files over 100 MB as parts (`publish-downloads.sh --split`, delivery.md §4), keep the web copy
  unsplit, and update the delivery tables (delivery.md §3).

## 7. Stills and wallpapers at any size

The engine renders any frame at any size, so wallpapers and posters come from the film, not from screenshots.
Nova's `tools/site-wallpapers.sh` derives a plan from the HD plan (so it carries the master grade):
```js
{ ...hdPlan, id: 'david-wallpapers', width: 2160, height: 4680, format: { ...hdPlan.format, letterbox: 0 },
  effects: hdPlan.effects.filter((e) => e.type !== 'letterbox'), text: [] }
```
- **19.5:9 at 2160x4680**, larger than any phone screen.
- **No letterbox: remove both** `format.letterbox` and the `letterbox` effect (Nova's opened at frame 2725). **No
  titles** (`text: []`). Its own id, so it never shares a frame cache.
- **Check the effects active on the chosen frames**: post effects are part of the picture (Nova: shake 2779-2939,
  amplitude 9, around the eruption).
- **Pick frames from a low-resolution sheet first** (`--w 540 --h 1170` on about 7 candidates), then render
  losslessly:
  ```bash
  node tools/render.mjs stills --plan tmp/plan-wallpaper.json --frames 1820,2400,2850,3600,3790 --w 2160 --h 4680 --fmt png --out tmp/wallpapers
  ```
  About 1 minute for 5 (7.2-10.5 s each); PNGs of 8-19 MB.
- Save downloads with PIL as `JPEG, quality=95, subsampling=0 (4:4:4), optimize=True, progressive=True` (1.2-3.1
  MB), and page thumbnails at 540x1170, LANCZOS, quality 82 (38-125 KB).
- `render.mjs --out` resolves under the repository root: use repo-relative `tmp/` paths.
- Send the files as download cards (`SendUserFile`, `display: 'attach'`).

## 8. The finisher: one detached chain

The 4K finish waits for helpers, then assembles, encodes, verifies, splits and publishes: longer than the 2-hour cap
on `run_in_background` commands. Run it fully detached and watch it separately (pitfalls.md §5):
```bash
setsid nohup bash tools/finish-hd.sh > tmp/finish-hd.log 2>&1 < /dev/null & disown
# a separate watcher (run_in_background) that only ends on a terminal line; re-arm it if it hits its own cap
until grep -qE 'FINISH-DONE|FAIL' tmp/finish-hd.log; do sleep 30; done; grep -E '^HD |ASSEMBLED|^ENC|^OK |PUBLISHED|SITE|FINISH|FAIL' tmp/finish-hd.log | tail -20
```
The shape of the script:
1. Collect loop: restore, then status every 120 s, a line only when the count changes, `FAIL` after 3 hours.
2. Assemble, then check that `<file>.verify.json` says ok.
3. Each encode, one milestone line each (`ENC master`, `ENC upload`, ...).
4. A full decode of each deliverable, then the sound verify of every track.
5. Split and publish in batches, refresh the site, then `FINISH-DONE`.

Stop at the first failure with `FAIL <step>` and the log tail. Keep the script in the repository: a scratchpad copy
survives a worker restart but not a container reset. Never edit it while it runs: kill it by PID and relaunch.
