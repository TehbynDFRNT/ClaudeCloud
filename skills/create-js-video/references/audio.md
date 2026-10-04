# Audio: score, stems, master and delivery checks

The soundtrack is rendered offline in the same headless Chromium as the picture, from the same plan: placements of
the supplied recording(s), synthesised design, sampled hits, buses, a master to a loudness target, and checks on the
muxed file. The director's existing skill has the generic sound guidance (`sound.md`). This file is about the
mix architecture that worked, measuring notes on the final mix, and the delivery checks.

## Contents
1. Render model, and the approved mix as the master
2. Stems and buses
3. Master targets and the loudness loop
4. Versioned sound design
5. A binaural variant for headphones
6. Measuring and the report
7. "Make X% louder/quieter": calibrate on the normalised mix
8. Mux and delivery checks
9. Sound design lessons from Nova

## 1. Render model, and the approved mix as the master

- Nova's score and renderer are `src/audio/index.html`, `src/audio/score.js` (2,377 lines: stems, buses, the
  loudness loop, `DESIGN.vN`, the binaural mode) and `tools/render-audio.mjs` (render and `--verify`) at the pinned commit
  (reference-implementation.md). Until the score exists, `assets/starter/tools/tone-mix.mjs` writes a placeholder
  soundtrack of the right length, so `assemble` can run.
- `src/audio/index.html` loads `score.js`. `tools/render-audio.mjs` serves the repo, opens the page in Chromium with
  `--autoplay-policy=no-user-gesture-required`, and calls `window.renderAudio({ outDir, stems, only })`. The page
  POSTs WAVs back to a local endpoint that may only write under `out/`: `--out tmp/...` fails only at the end, after
  a full 4-minute render, with `write tmp/.../mix.wav: 403 only under out/`.
- Each stem renders in its own `OfflineAudioContext(2, 48000 * duration, 48000)`. Independent contexts render
  concurrently. The mix and master run in plain JS on the rendered buffers, which makes iterating gains cheap.
- Everything derives from the plan and the grid: placements, cues, shots, effects, text, bars, `bassMidi`, tuning.
  The only authored numbers are design constants (levels, envelopes, filter shapes), written relative to plan events.
  Never use absolute timestamps.
- Determinism: seeded `mulberry32` noise and impulse responses, no `Math.random`/`Date`. Renders are still not
  reproducible. Two renders of identical code differed by up to -74.4 dBFS peak (-104.1 dBFS RMS). A re-render of
  Nova's approved stereo mix with unchanged score code (commit 7717051) differed from the approved
  `out/audio-v4/mix.wav` by up to -44.6 dBFS peak, -69.4 dBFS RMS, with 3.24 M samples over -80 dB, the first at
  8.401 s. The cause was not isolated; the likely amplifiers are the iterative loops (the cannon approach law
  re-renders its stem over passes, max error 13.97 → 6.04 → 5.40 dB with the limiter at up to 14.9 dB; the master
  loudness loop runs 4 passes), which can settle on slightly different gains from float-level differences.
- **The approved mix WAV is the master.** Mux every later deliverable (copies, the 4K master, upload files) from that
  file, never from a fresh render, and keep a copy of it on a branch the day it is approved: `out/` is git-ignored
  and a container reset loses it. Treat re-renders, and the binaural mix, as variants, and never promise a
  bit-identical stereo mix. To show that a code change left the stereo mix alone, render twice and compare the
  change against the run-to-run spread, not against zero. Don't fingerprint audio by its bytes; a version's mix is
  rendered per version (about 3 minutes for 2:48).
- Outputs: `out/audio[-vN]/mix.wav` (24-bit, 48 kHz, exactly `frames / fps` long), `stems/*.wav` (32-bit float, as
  they enter their buses), `report.json`, and spectrograms of the climax, the ending and the coda.
- The mix used by default at assembly must follow the root plan. Render other versions with `--plan
  plans-vN/film-plan.json --out out/audio-vN --no-publish`, and mux them with `--audio out/audio-vN/mix.wav`.

## 2. Stems and buses

Nova's stems are a template for a music-led code film:

| Stem | Content |
|---|---|
| `orchestra` | the supplied recording, placed per `plan.audio` (clean make-up gain on a quiet source) |
| `synth` | a pulse from the grid's bass line (`bassMidi` per eighth), auto-levelled per bar |
| `tension` | the undertow under the strikes |
| `cannons` | sampled hits on an approach law: each cue measured against the orchestra, corrected, re-rendered |
| `build` | the rise into the black before the explosion (pressure, sub crescendo, risers, a converging pulse train) |
| `ignition` | the explosion: the climax bus |
| `salvos` | fast hits on the beats of the returning tutti |
| `coda` | night air, drone, shimmer under the last shot |
| `stare` | a resonant tone under the final stare that swells with the title and fades to silence |

Buses, in mix order:
- **Music bus**: glue compression; a short-term loudness cap before the climax; from the climax on, its own
  look-ahead true-peak limiter (`musicCeilDb`, -1.6 dBTP in v4).
- **Climax bus**: its own transient-preserving true-peak limiter, set to a short-term loudness target inside a
  window after the explosion, with at most about 2.5 dB of gain reduction. Its sustain is folded under the
  returning music.
- **Build, coda and stare buses**: each set to its own loudness target relative to its neighbours.
- **Master**: a final true-peak limiter (internal ceiling -1.35 dB, 4× oversampled estimate).

## 3. Master targets and the loudness loop

- Integrated loudness: -16 LUFS. True peak: -1 dBTP or lower. Plus a short-term target for the climax.
- The music gain is iterated by secant steps until the programme hits -16.0 ±0.05 LUFS. The climax, build, coda
  and stare buses don't follow the music gain, so the programme moves less than the music does. Iterate; don't
  compute it once.
- Get loudness at the climax from density and duration, not from peaks the master limiter has to take back.
- Delivery check margin: the climax should be the loudest moment (Nova's report: the climax window about 1 LU above
  anything outside it in v4, and the build about 5 LU under the explosion).

## 4. Versioned sound design

Keep each version's changes in one block, applied by version:
```js
export const DESIGN = { ..., v4: { explosionGain: 0.62, returnGain: 1.19, musicCeilDb: -1.6 } };
const V4 = (plan.version || 0) >= 4;
if (V4) gX *= DESIGN.v4.explosionGain;
```
Delivered versions then still render their own mix: `render-audio.mjs --plan plans-v3/film-plan.json --out
out/audio-v3`. Put the director's note and the measured outcome in a comment next to the numbers.

## 5. A binaural variant for headphones

An alternate track that places the sound design around the listener, rendered from the same plan.
- **The switch.** `src/audio/score.js` has a module-level spatial mode, set in `renderSoundtrack` by
  `setSpatial(plan.spatial)`, with `plan.spatial = { mode: 'binaural' }`. `panNode(ctx, pan, az, el)` returns the old
  `StereoPannerNode` in stereo mode (the same nodes as before, so the approved mix stays reproducible as far as audio
  ever is) or `hrtf(ctx, az, el)` in binaural mode.
- **The panner.** `new PannerNode(ctx, { panningModel: 'HRTF', distanceModel: 'linear', refDistance: 1, maxDistance:
  1e4, rolloffFactor: 0, ... })`: no distance attenuation, so levels don't move. Cones 360, `channelCount: 1,
  channelCountMode: 'explicit'`. Positioned on the unit sphere by
  `headPos(az, el) = [sin(az)cos(el), sin(el), -cos(az)cos(el)]` (az 0 = front, + = right, ±180 = behind; the
  listener faces -Z).
- **Angles per element** (Nova):

  | Element | Azimuth, elevation |
  |---|---|
  | approaching guns | `az = pan * (35 + 95 * d)`, `el = 4 + 6 * d`: far guns wider and further round, up to ±130° |
  | salvo battery | `side * [-65, 125, -150][j % 3]`, el 6: left front, right rear, left rear |
  | ignition cluster | `pan * 100` |
  | fly-by tone | `positionX`/`positionZ` automated along `panCurve(x) * 115°`, round the front to just behind |
  | coda wind | `pan * 140` |
  | new star shimmer | `pan * 70`, el 38 (above) |
  | the music (chorus, ping-pong delays) | stays stereo, in front |
- **Render it** without touching the picture (`spatial` is not in the picture fingerprint):
  ```bash
  node tools/make-spatial-plan.mjs              # {...plan, spatial: {mode: 'binaural'}} -> tmp/film-plan-binaural.json
  node tools/render-audio.mjs --plan tmp/film-plan-binaural.json --out out/audio-v4-binaural --no-publish   # 234.5 s
  ```
- **Verify by measurement.**
  1. Per-stem integrated loudness, stereo against binaural (`ffmpeg -nostats -i stems/X.wav -af ebur128 -f null -`):
     cannons -22.5 / -21.7 (HRTF adds about 0.8 LU), salvos -15.7 / -15.6, ignition -13.8 / -13.9, coda -33.9 /
     -33.9, synth -33.6 / -33.4. The mix lands at -16.0 LUFS either way (the loudness loop renormalises); the
     binaural true peak was -1.3 dBTP (`ebur128=peak=true`).
  2. Interaural time difference: normalised cross-correlation of L and R over a short window at each spatialised
     event, lag searched over ±48 samples (±1 ms at 48 kHz). Stereo panners give lag 0. Nova's binaural salvos at
     56, 58 and 61 s gave -27, -24 and -23 samples (-0.56, -0.50, -0.48 ms), the coda shimmer -38 (-0.79 ms):
     realistic ITDs for sources well off-centre. A window with correlation near 0 is inconclusive (the approaching
     gun at 60 s: r 0.01, lag pinned at the search edge): don't count it. The level difference shrank (0.0-0.3 dB
     against 0.4-1.4 dB in stereo), because HRTF places sources with time and spectral cues rather than level.
     ```python
     import subprocess, numpy as np
     def itd(wav, t0, dur=0.25, sr=48000, maxlag=48):
         raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(t0), '-t', str(dur), '-i', wav,
                               '-f', 'f32le', '-ac', '2', '-ar', str(sr), '-'], capture_output=True).stdout
         x = np.frombuffer(raw, np.float32).reshape(-1, 2); L, R = x[:, 0] - x[:, 0].mean(), x[:, 1] - x[:, 1].mean()
         def r(k): a, b = (L[k:], R[:len(R) - k]) if k >= 0 else (L[:k], R[-k:]); return (a @ b) / np.sqrt((a @ a) * (b @ b) + 1e-20)
         best = max(range(-maxlag, maxlag + 1), key=r)
         return best, best / sr * 1000, r(best)   # samples, ms, r; negative: R lags L (source left); r near 0: inconclusive
     ```
- **Deliver it as track 1**, titled for headphones, with the stereo mix as track 0, the default (hd-master.md §6),
  and verify that track on its own (§8). Tell the director it was measured, not listened to.

## 6. Measuring and the report

ffmpeg `ebur128=peak=true:framelog=verbose` gives integrated loudness, LRA, true peak, and the momentary (400 ms) and
short-term (3 s) series every 100 ms. Report against the plan:
- the integrated loudness, LRA and true peak;
- the short-term profile: each strike, the build (max and mean), the explosion window, the return bars, the
  aftermath, the final stare (with and without the title), and the coda;
- spectrograms of the climax and the ending (`showspectrumpic`). In ffmpeg 6.1 its frequency legend is mislabelled
  when `start`/`stop` are set with `fscale=log`, so leave them unset;
- AAC round trips of the mix, each checked like a delivered file (§8).

## 7. "Make X% louder/quieter": calibrate on the normalised mix

Limiters and loudness normalisation swallow raw gain changes. On Nova, the note "the explosion 15% lower, the
return 20% higher" was first applied as ×0.85 and ×1.2. That moved the hit/return balance about 1 dB on the final
mix instead of about 3 dB. Nova's final values took four renders, set by hand without a calibration tool:

| Render | Explosion | Return | Change |
|---|---|---|---|
| 1 | ×0.85 | ×1.2 | balance moved ~1 dB |
| 2 | ×0.75 | ×1.4 | + music limiter ceiling -1.6 dBTP for headroom |
| 3 | ×0.6 | ×1.3 | |
| 4 | ×0.62 | ×1.19 | measured: hit about -1.4 dB, return about +1.6 dB against the rest of the film |

Procedure:
1. Read the percentage as amplitude unless the director says otherwise: -15% is -1.41 dB, +20% is +1.58 dB. Say
   the dB figure you used in your reply.
2. Define the sections in seconds from the plan's cues (for example the explosion + 75 frames, and the return bars).
3. Render, then measure **relative to the rest of the film on the normalised mix**, before and after:
   `$SKILL/scripts/loudness-rebalance.py --before ... --after ... --section ... --target hit=-15% --raw hit=0.85`.
4. Step the raw gain by the measured efficiency, as the script suggests. If the efficiency is below about 0.3, the
   section is limiter-bound: raise that bus's ceiling or lower the competing bus.
5. With this procedure expect 2-3 renders (Nova, without it, needed four). Stop when the residual is under about
   0.2 dB, and keep the gains in `DESIGN.vN`.

Measure on the muxed AAC as well. The mix the director hears has been through the codec.

## 8. Mux and delivery checks

- Mux at **AAC 512k with `-aac_coder fast`**, 48 kHz stereo. At 320k the default (twoloop) coder coded Nova's dense
  climax at about 26 dB SNR, and the decoded true peak overshot the mix by 1-2 dB, above 0 dBTP. At 512k fast the
  decoded peak equals the mix's, and the coding SNR is 8-13 dB better in every section.
- Pass `-t frames/fps` and `+faststart`. Don't use `-shortest`.
- `render-audio.mjs --verify dist/film.mp4[,more.mp4] [--ref out/audio-vN/mix.wav] [--plan ...]` first refuses a
  reference mix whose length differs from the film. Then it checks each file and exits 1 on any failure:

| Check | Pass condition |
|---|---|
| audio stream | AAC, 48 kHz, 2 channels |
| audio and video length | within 1 frame + 1 AAC frame of the film |
| integrated loudness | within ±0.5 LU of the mix |
| true peak | ≤ -1 dBTP |
| climax (short-term max) | within ±0.5 LU and ±0.3 s of the mix |
| coda (star to the end) | within ±1.5 LU of the mix (silent means the mix was too short) |
| sync at the explosion (or ignition) | cross-correlation lag within ±1 ms, r ≥ 0.95 |

- `chunk.mjs assemble` only refuses a silent soundtrack and checks structure. Always run `--verify` on every muxed
  deliverable, including review copies whose audio was re-encoded (`encode-copy.py` reports their true peak).
- **Verify every muxed audio track, alternate tracks included.** A deliverable with a binaural track 1 gets two
  verifies: the file against the stereo mix, and track 1 against the binaural mix. Extract it with its picture, so
  the length and sync checks still work: `ffmpeg -i film.mp4 -map 0:v:0 -map 0:a:1 -c copy film-binaural.mp4`. A WAV
  that measured -16.0 LUFS and -1.3 dBTP says nothing about its AAC-encoded copy, and a decode-and-duration check
  is not a sound verify.
- Re-apply the mux settings on every re-encode (512k `-aac_coder fast`, `-t frames/fps`): Nova's first 4K finisher
  draft dropped both.

## 9. Sound design lessons from Nova

- **The climax was heard, not seen.** The director asked for no white flash at ignition: the picture goes dark, and
  "the sound must be far more intense". The dark hold (54 frames) carries the build, and the explosion lands on the
  frame the eruption first appears.
- **Build into the black so the hit lands on time**: the director asked for "some auditory build as it goes to
  black to set up the explosion". It starts as the last strike implodes and tightens through the dark.
- **Restart the music on the hit.** The director asked to restart the music at the explosion, louder, with faster
  cannons. Choose the restart by the music's own structure (the tutti downbeat). Then re-time the picture after it to
  the bars, rather than stretching the music to the picture.
- **A new ending needs new sound**: the final stare got its own resonant tone, which swells with the title and then
  fades to silence.
- **Gate every change by version.** v3 and v4 mixes stay reproducible, and the director can compare them.
