// Soundtrack renderer for "David & Goliath" / "Prometheus" / "Sol Invictus" (the cuts of a version share one timeline
// and this score): orchestra (USAF Band, Vivaldi "Winter" I), an eighties synth pulse, approaching cannon strikes (US
// Army Band 1812 samples, tightening to half-bar shots from bar 20) with a building undertow; at the ignition cut the
// music stops and THE BUILD carries the dark (it starts as S21 implodes: pressure swelling, a sub rumble crescendo,
// risers on C, a pulse train converging on the explosion, the vacuum); THE EXPLOSION on the frame the eruption appears
// (detonation, sub body, stacked close cannon cluster) restarts the music: the bar-56 tutti, hotter than anything
// before it, with point-blank cannon salvos on its beats (1812 finale) and the Doppler roar folded under it; the night
// of the coda (wind, distant drone, the new star's shimmer); under the final stare at the marble figure a deep
// resonant tone that swells with the NOVA title and fades to silence; and the master.
//
// Everything is derived from the plan (film-plan.json, or the one named by renderSoundtrack({ plan }): fps, audio
// placements, cues, shots, effects, text, assets) and analysis/grid.json (bar/eighth grid in source seconds, bassMidi
// per eighth, tuning). The only authored numbers are sound-design constants (levels, filter shapes, envelopes) and
// the section structure in bars given by the director.
//
// Determinism: no Math.random / Date. All noise and impulse responses come from seeded mulberry32 generators, every
// measured quantity (shaper latency, grid check) is derived robustly, so the output is a function of (plan, grid,
// media). Chrome's native Web Audio kernels still differ between runs at float-rounding level (SIMD paths): two
// renders agree to about -104 dBFS peak / -125 dB RMS in the mix, not bit for bit.
// Each stem is rendered in its own OfflineAudioContext(2, 48000 * plan duration, 48000), all of them side by side
// (independent contexts render concurrently); the mix/master stage runs in plain JS on the rendered buffers: cannon
// approach law (measure each cue against the orchestra, correct, re-render) and cannon-stem limiter, synth + undertow
// auto-level, duck + ladder ride of the music under the strikes, the hotter return, the salvos set against the
// tutti, then the buses: music (glue compression, short-term loudness cap before the ignition), build (set against
// the explosion), climax (own transient-preserving true-peak limiter, set to a short-term loudness target, its
// sustain folded under the returning music), coda and stare (set to loudness targets), summed into a final true-peak
// limiter; the music gain is iterated to the programme loudness target.
import { Music, evalFps } from '../engine/music.js';
import { mulberry32 } from '../engine/rng.js';

export const SR = 48000;
const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const db = (g) => 20 * Math.log10(Math.max(1e-12, g));
const undb = (d) => Math.pow(10, d / 20);
const midiHz = (m, a4) => a4 * Math.pow(2, (m - 69) / 12);

// ----------------------------------------------------------------------------------------------------------
// Sound-design constants (authored). Times are relative to musical/plan events, never absolute timestamps.
// ----------------------------------------------------------------------------------------------------------
export const DESIGN = {
  orchestraMakeupDb: 7.0,          // clean make-up gain on the (quiet, ~-24 LUFS) recording
  // Peak headroom: the ignition stem ends in a 4x soft clipper (ceiling 1.0) and its bus in a look-ahead true-peak
  // limiter (DESIGN.climax), the cannon stem in a look-ahead true-peak limiter; loudness at the strikes and the
  // ignition comes from density and not from peaks the master limiter would have to take back.
  cannonsDb: 0.0,
  // cannon stem limiter (JS): ceiling ceilDb; the five strikes climb a staircase from strikeFromDb to nearDb as
  // d -> 0, so each strike has more headroom than the last (they build; the deeper duck keeps the master limiter
  // mostly out of it). Per-cue levels: approach law.
  cannonLimiter: { ceilDb: -3.5, strikeFromDb: -6.5, nearDb: -0.5, lookMs: 2.0, relMs: 90 },
  impactDriveDb: 6.0,              // ignition impact layers (sub, crack, cluster, saw stack, walls) into the stem saturator
  synthTrimDb: -24.0,            // source trim so the per-bar auto-level works around 0 dB
  targetLufs: -16.0,
  ceilingDbtp: -1.0,
  limiterCeilingDb: -1.35,         // internal ceiling (true-peak estimate, 4x oversampled) leaves margin
  // gentle glue on the music bus: threshold relative to the loudness target (after the music gain), 50 ms RMS detector
  comp: { thresholdRel: 6, ratio: 1.5, kneeDb: 8, attack: 0.030, release: 0.40, rms: 0.050 },
  // THE CLIMAX (picture black from the ignition cue to dark-end): its own bus, set so its short-term loudness (3 s,
  // K-weighted) peaks at targetST inside the director's window (ignition + windowFrames), then a look-ahead true-peak
  // limiter (2 ms, so the detonation keeps its attack shape; slow release so the sustain is not pumped).
  // The limiter may take at most maxGrDb off the detonation's peak (beyond that the transient flattens): if the
  // target needs more, the climax stops at the loudest level its transient allows.
  // The music bus is capped marginLu under the climax's short-term peak (slow ride of the loudest tutti only).
  // Codec: at 320 kb/s ffmpeg's default AAC coder (twoloop) codes this dense, bass-heavy sustain at about 26 dB SNR,
  // and its decoded true peak overshoots the PCM by +1 to +2 dB. Lowering ceilDb does not buy that back: at -2.7 it
  // still decoded at -0.5 dBTP, the music bus had to be ridden, and the margin fell to 6 LU. The encode is fixed at
  // the mux instead. At 512 kb/s with -aac_coder fast the decoded peak equals the PCM's. render-audio.mjs checks both
  // encodes of every mix (report.ffmpeg.delivered).
  // v3: the climax window starts at the explosion (the eruption first seen), not at the ignition cut. marginLu caps
  // the music before the ignition only: the returning tutti rides with the explosion.
  climax: { targetST: -6.0, windowFrames: 75, ceilDb: -1.5, lookMs: 2.0, relMs: 160, maxGrDb: 2.5, marginLu: 6.0 },
  // vacuum: the build is inhaled (a reversed swell over leadS) and stops gapMs before the explosion, so the
  // detonation lands on near-silence; winter-b's pre-roll (its placement starts a frame before the bar-56 attack) is
  // held at preDb until the hit
  vacuum: { leadS: 0.42, gapMs: 40, preDb: -18 },
  // THE BUILD (stem 'build'): from S21's implosion (implosionS before the ignition cut) through the dark hold to the
  // explosion. Its short-term loudness at its end (3 s window ending at the gap) sits belowHitLu under the explosion's
  // short-term peak (measured on the climax bus): the build is the second-loudest thing in the film, the hit the
  // loudest. A pulse train starts on the ignition cut and converges on the explosion: intervals shrink by pulseRatio
  // until shorter than pulseMinS. The pressure throb climbs throbHz[0] -> throbHz[1]. Own look-ahead limiter at ceilDb.
  build: { implosionS: 1.333, belowHitLu: 5.0, pulseRatio: 0.78, pulseMinS: 0.035, throbHz: [2.2, 17], ceilDb: -2.0, handOffS: 0.6 },
  // THE RETURN (winter-b: bar 56 on the explosion): the orchestra rides db over its unridden level (the v2 return
  // kept the ladder's -4.5 dB, so the tutti is about 5.5 dB hotter before the programme gain moves). The climax bus's
  // sustain (roar, walls, saw stack, reverb) is folded under the returning music from fromS after the hit: its
  // momentary loudness (400 ms) stays belowLu under the music's, a slow ride (ramped in over rampS, never more than
  // maxDb), so the detonation itself is untouched and the roar carries the tutti instead of fighting it.
  ret: { db: 1.5 },
  fold: { fromS: 0.45, rampS: 0.5, belowLu: 3.0, maxDb: 14, untilS: 14 },
  // cannon salvos with the returning tutti (stem 'salvos', 1812 finale): guns per salvo and level (dB) by bar; one
  // gain sets the loudest bar-56 salvo relDb over the orchestra (K-weighted, 400 ms from the transient against the
  // 500 ms before it); the salvo on the explosion's downbeat is the explosion's own cluster. Own limiter at ceilDb.
  salvo: { guns: { 56: 3, 57: 3, 58: 2, 59: 1 }, levelDb: { 56: 0, 57: -1.0, 58: -4.5, 59: -8.0 }, spreadS: [0, 0.024, 0.053], relDb: 3.0, ceilDb: -3.0, mergeS: 0.1 },
  // the final stare (stem 'stare'): a deep resonant tone on the fermata's root, set to lufs over the steady part (the
  // picture up, before the title); it swells by swellDb as the title fades in, then fades with the picture to
  // silence on the last frame
  stare: { lufs: -31.0, swellDb: 4.0, leadS: 0.6 },
  // strike undertow (stem 'tension'): K-weighted level relative to the orchestra over the strikes section
  tension: { relLu: -7.0 },
  // coda: night air, set by the loudness of the wind-only stretch (picture faded up, before the star); drone and
  // shimmer levels are relative to the wind inside the stem
  coda: { windLufs: -35.0, droneDb: -16, shimmerDb: -20 },
  // cannon approach law: each cue's loudness (K-weighted, 400 ms from its transient) relative to the orchestra's
  // (K-weighted, the 500 ms before it: the music the hit breaks into) follows rel(d) = far + (near - far) * (1 - d)^shape, so the approach is monotone
  // whatever the music does underneath. Measured on a first render of the stem, corrected and re-rendered. Close
  // cues are capped at nearMaxCorrDb, where the stem limiter still leaves the boom a natural decay.
  cannon: { relFar: -20, relNear: 5, shape: 1.5, maxCorrDb: 14, nearMaxCorrDb: 11, passes: 3, tolDb: 0.75,
    // v3 half-bar cues ('cannon-NNh', bars 20-31: the cannon tempo doubles into the strikes) sit under the law by
    // halfBarDb, and by halfBarSoloDb from bar soloFrom (the solo violin runs of bars 27-31 stay clear)
    halfBarDb: -3.0, halfBarSoloDb: -4.5, soloFrom: 27 },
  // orchestra + synth duck under the five strike cannons (d <= maxD; depth grows toward d = 0): 5 ms attack,
  // 80 ms hold, then a 120 ms exponential release (within 1 dB after ~0.35 s), following the boom that masks it.
  duck: { maxD: 0.12, depthDb: [4, 13], attack: 0.005, hold: 0.08, tau: 0.12 },
  // the ladder (bars 32-38) is the cannons' section: orchestra + synth sit 4.5 dB lower there (ramped over the 2 s
  // before the bar-32 downbeat), so the strikes have headroom under the ceiling; from the first strike the ride
  // eases back toward endDb at the ignition, so the music itself climbs strike by strike into the vacuum.
  ladderRide: { db: -4.5, endDb: 0, fromBar: 32, rampS: 2.0 },
  // synth sections (bars from the director's notes); offsets = K-weighted level relative to the orchestra
  synth: {
    sections: [
      { from: 3, to: 11, mode: 'pulse', sub: 1, offset: [-31, -17] },
      { from: 12, to: 19, mode: 'drone' },
      { from: 20, to: 26, mode: 'pulse', sub: 1, offset: [-16, -15] },
      { from: 27, to: 31, mode: 'pulse', sub: 2, offset: [-16.5, -15.5] },
      { from: 32, to: 38, mode: 'pulse', sub: 2, offset: [-15.5, -14.5], open: true },
    ],
    // drone (rubato solo): follows the orchestra's plain-RMS envelope, 18 dB under it, never closer than 14 dB
    drone: { offsetDb: -18, capDb: -14 },
    plainCapDb: -12,               // pulse bars: never closer than 12 dB to the orchestra's plain RMS (brief: 12-18)
    padOffset: -29,                // aftermath pad (bar 63 fermata, F/C) relative to the orchestra (K-weighted)
    detuneCents: 14,               // between the two saws
  },
};

// Cannon samples, ranked from my inspection (out/audio/analysis/cannons-overview.png + metrics in the report):
//  cleanliness (orchestral/bell bleed of the 1812 recording: Eb-major partials at 158/237/316/475/633/949 Hz,
//  tuned ~+29 cents sharp of A440): 1 > 2 > 3 > 4 > 6 > 5 ; weight (<120 Hz energy, first 300 ms): 1 > 6 > 4 > 3 > 5 > 2.
//  cannon-5 also carries a second hit at 0.97 s; cannon-4 has the sharpest crack.
// bodyHz: low-pass of the body after the broadband attack; tau: body decay; maxLen: hard window (s after onset);
// notches: bleed partials removed (Hz at playbackRate 1). Tail-spectrum prominence check (Welch, 0.12-0.9 s): the
// D5 partial (592 Hz, clashes with F minor) in cannon-2 (+12.5 dB) and cannon-4 (+7.7 dB), Eb3 158 Hz in cannon-5.
export const CANNON_SAMPLES = {
  'cannon-1': { rank: 1, bodyHz: 900, tau: 0.34, maxLen: 1.20, notches: [] },
  'cannon-2': { rank: 2, bodyHz: 520, tau: 0.28, maxLen: 1.00, notches: [475, 592, 949] },
  'cannon-3': { rank: 3, bodyHz: 420, tau: 0.24, maxLen: 0.95, notches: [158.5, 316, 475, 633] },
  'cannon-4': { rank: 4, bodyHz: 420, tau: 0.24, maxLen: 0.95, notches: [237.5, 352, 475, 592] },
  'cannon-6': { rank: 5, bodyHz: 320, tau: 0.20, maxLen: 0.85, notches: [158.5, 237.5, 316, 475, 633] },
  'cannon-5': { rank: 6, bodyHz: 300, tau: 0.18, maxLen: 0.80, notches: [158.5, 237.5, 316, 475, 633] },
};
// Rotation by distance band. The two dirtiest samples (5, 6) only play far away (d > 0.5), where the distance
// low-pass hides their bleed; the far rotation starts with the lightest sample (cannon-2). The heaviest and cleanest
// (cannon-1) is kept for the strikes and the final hit.
const NEAR_SET = ['cannon-1', 'cannon-4', 'cannon-3', 'cannon-2']; // d <= 0.15, counted back from the last strike
const MID_SET = ['cannon-3', 'cannon-2', 'cannon-4', 'cannon-1'];  // 0.15 < d <= 0.5
const FAR_SET = ['cannon-2', 'cannon-6', 'cannon-3', 'cannon-5', 'cannon-4']; // d > 0.5

// ----------------------------------------------------------------------------------------------------------
// helpers
// ----------------------------------------------------------------------------------------------------------
async function loadJSON(url) { const r = await fetch(url, { cache: 'no-store' }); if (!r.ok) throw new Error(`${url}: ${r.status}`); return r.json(); }
async function loadAudio(ctx, url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return ctx.decodeAudioData(await r.arrayBuffer());
}

function noiseBuffer(ctx, seconds, seed, { channels = 2, pink = false } = {}) {
  const n = Math.ceil(seconds * ctx.sampleRate);
  const buf = ctx.createBuffer(channels, n, ctx.sampleRate);
  for (let c = 0; c < channels; c++) {
    const r = mulberry32((seed * 7919 + c * 104729 + 17) >>> 0);
    const d = buf.getChannelData(c);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < n; i++) {
      const w = r() * 2 - 1;
      if (!pink) { d[i] = w; continue; }
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.96900 * b2 + w * 0.1538520;
      b3 = 0.86650 * b3 + w * 0.3104856; b4 = 0.55000 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.0168980;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
    }
  }
  return buf;
}

// Seeded synthetic impulse response: decorrelated stereo noise with exponential decay, frequency-dependent
// damping (time-varying one-pole low-pass), early-reflection taps and an optional slow "swell" onset.
// Normalised to unit energy per channel so wet levels are set by the send gains.
function impulse(ctx, { seconds, rt60, seed, hiHz = 9000, loHz = 400, early = 12, earlyMs = 80, swell = 0, preMs = 0 }) {
  const sr = ctx.sampleRate, n = Math.round(seconds * sr);
  const buf = ctx.createBuffer(2, n, sr);
  const pre = Math.round(preMs * sr / 1000);
  for (let c = 0; c < 2; c++) {
    const r = mulberry32((seed * 31 + c * 977 + 5) >>> 0);
    const d = buf.getChannelData(c);
    let y = 0;
    for (let i = pre; i < n; i++) {
      const t = (i - pre) / sr;
      const fc = hiHz * Math.pow(loHz / hiHz, Math.min(1, t / (rt60 * 0.85)));
      const a = 1 - Math.exp(-TAU * fc / sr);
      y += a * ((r() * 2 - 1) - y);
      const decay = Math.pow(10, -3 * t / rt60);
      const onset = swell > 0 ? 1 - Math.exp(-t / swell) : Math.min(1, t / 0.003);
      d[i] = y * decay * onset;
    }
    let e = 0; const m = Math.min(n, pre + Math.round(0.1 * sr));
    for (let i = pre; i < m; i++) e += d[i] * d[i];
    const rmsE = Math.sqrt(e / Math.max(1, m - pre));
    for (let k = 0; k < early; k++) {
      const t = 0.003 + r() * earlyMs / 1000;
      const i = pre + Math.round(t * sr);
      if (i < n) d[i] += (r() < 0.5 ? -1 : 1) * (0.4 + 0.6 * r()) * 10 * rmsE * Math.pow(10, -3 * t / rt60);
    }
    let s = 0; for (let i = 0; i < n; i++) s += d[i] * d[i];
    const g = 1 / Math.sqrt(s || 1);
    for (let i = 0; i < n; i++) d[i] *= g;
  }
  return buf;
}

// soft clipper: linear below `knee`, tanh-shaped approach to 1.0 above (applied in the stem, before the master)
function softClipCurve(knee, n = 8192, range = 4) {
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = ((i / (n - 1)) * 2 - 1) * range, a = Math.abs(x);
    const y = a < knee ? a : knee + (1 - knee) * Math.tanh((a - knee) / (1 - knee));
    c[i] = Math.sign(x) * y;
  }
  return c;
}
function softClip(ctx, knee, gainIn = 1) {
  const pre = G(ctx, gainIn / 4), ws = ctx.createWaveShaper(), post = G(ctx, 1);
  ws.curve = softClipCurve(knee); ws.oversample = '4x';
  pre.connect(ws).connect(post);
  return { input: pre, output: post };
}

function tanhCurve(drive, n = 4096) {
  const c = new Float32Array(n), k = Math.tanh(drive);
  for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.tanh(drive * x) / k; }
  return c;
}

// Envelope as a value curve (linear interpolation between control points) — unambiguous automation.
function curveEnv(param, t0, dur, fn, rate = 1000) {
  const n = Math.max(2, Math.ceil(dur * rate) + 1);
  const a = new Float32Array(n);
  for (let i = 0; i < n; i++) a[i] = fn((i / (n - 1)) * dur);
  param.value = a[0];
  param.setValueCurveAtTime(a, t0, dur);
  return a;
}

// Audio-rate control signal written directly into an AudioBuffer and connected into an AudioParam.
function ctrlBuffer(ctx, n) { return ctx.createBuffer(1, n, ctx.sampleRate); }
function drive(ctx, buf, params, t0) {
  const s = ctx.createBufferSource(); s.buffer = buf;
  for (const p of params) { p.value = 0; s.connect(p); }
  s.start(t0);
  return s;
}

const G = (ctx, v = 1) => { const g = ctx.createGain(); g.gain.value = v; return g; };
// Determinism guard: Chrome may disable a node once all its sources have finished (cleanup timing depends on the
// main thread) and reset its filter/convolver state when it is re-enabled. A silent ConstantSource that never stops
// keeps every chain it feeds permanently active, so that cannot vary between runs.
function keepAlive(ctx) {
  const z = ctx.createConstantSource(); z.offset.value = 0; z.start(0);
  return (...nodes) => { for (const n of nodes) z.connect(n); return nodes[0]; };
}
const BQ = (ctx, type, f, q = 0.707, gain = 0) => { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; b.gain.value = gain; return b; };
function chain(...nodes) { for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]); return nodes[nodes.length - 1]; }

// ----------------------------------------------------------------------------------------------------------
// timeline context
// ----------------------------------------------------------------------------------------------------------
export async function loadTimeline(base = '/', planPath = 'film-plan.json') {
  const plan = await loadJSON(base + planPath);
  const grid = await loadJSON(base + 'analysis/grid.json');
  const fps = evalFps(plan.fps);
  const duration = plan.frames / fps;
  const length = Math.round(SR * duration);
  const music = new Music(plan, grid);
  const cue = (id) => plan.cues.find((c) => c.id === id);
  const shot = (id) => plan.shots.find((s) => s.id === id);
  const synthPl = plan.audio.find((a) => a.generated);
  const ign = cue('ignition'), ret = cue('return-bar56');
  const S24 = shot('S24-shockfront'), S25 = shot('S25-shell');
  const dark = cue('dark-end'), coda = cue('coda'), star = cue('coda-star');
  const fades = (plan.effects || []).filter((e) => e.type === 'fade');
  // the picture fades up from black at the coda cut, and to black at the very end
  const codaUp = coda && fades.find((e) => e.start === coda.frame && e.to === 0);
  const lastOut = fades.filter((e) => e.to === 1 && e.end >= plan.frames - 1).sort((a, b) => b.start - a.start)[0];
  // the star is fully arrived at the frame the cue's evidence names (else one and a half seconds after it begins)
  const starFull = star && /fully arrived at frame (\d+)/.exec(star.evidence || '');
  const winterEnd = Math.max(...plan.audio.filter((a) => a.path && a.path.includes('winter')).map((a) => a.timelineEnd));
  // v3: the explosion (the eruption first seen; else the end of the black hold); the final stare is the last shot when
  // it follows the coda, with its fade up from black, the coda's fade to black before it and the end title over it
  const xc = cue('explosion');
  const lastShot = plan.shots[plan.shots.length - 1];
  const stareShot = coda && lastShot.start > coda.frame ? lastShot : null;
  const stareUp = stareShot && fades.find((e) => e.start === stareShot.start && e.to === 0);
  const codaOut = stareShot && fades.find((e) => e.to === 1 && e.end === stareShot.start);
  const title = stareShot && (plan.text || []).find((x) => x.id === 'end-title' && x.start >= stareShot.start);
  const T = {
    ignition: ign.frame / fps,
    // end of the black hold: the eruption is first seen
    darkEnd: (dark ? dark.frame : ign.frame + 54) / fps,
    explosion: (xc ? xc.frame : dark ? dark.frame : ign.frame + 54) / fps,
    // the build starts as S21 implodes into its point
    buildStart: ign.frame / fps - DESIGN.build.implosionS,
    // bar-56 downbeat in film time, through the winter-b placement (source onset from the cue)
    return56: music.sourceToFilm(ret.sourceSeconds),
    // closest approach of the Doppler source: one third into S24-shockfront (the shock front passes the camera)
    pass: (S24.start + (S24.end - S24.start) / 3) / fps,
    shock: [S24.start / fps, S24.end / fps],
    fracture: S25 ? S25.start / fps : null,
    synthEnd: synthPl.timelineEnd / fps,
    winterEnd: winterEnd / fps,
    coda: coda ? coda.frame / fps : null,
    codaUp: codaUp ? codaUp.end / fps : (coda ? coda.frame / fps + 2.5 : null),
    star: star ? star.frame / fps : null,
    starFull: star ? (starFull ? +starFull[1] : star.frame + 1.5 * fps) / fps : null,
    pictureOut: lastOut ? lastOut.start / fps : duration - 1.5,
    end: duration,
  };
  // the coda fades with the picture: down into the black before the stare, or with the film's last fade
  T.codaOut = codaOut ? [codaOut.start / fps, codaOut.end / fps] : [T.pictureOut, duration - 1 / fps];
  T.stare = stareShot ? stareShot.start / fps : null;
  T.stareUp = stareShot ? (stareUp ? stareUp.end / fps : T.stare + 1) : null;
  T.title = title ? title.start / fps : null;
  T.titleFull = title ? (title.start + (title.fadeIn || 24)) / fps : null;
  return { plan, grid, fps, duration, length, music, cue, shot, T, a4: grid.tuningA4Hz || 441.53 };
}

// ----------------------------------------------------------------------------------------------------------
// stem 1: orchestra (two placements of the recording)
// ----------------------------------------------------------------------------------------------------------
export function buildOrchestra(ctx, tl, winter) {
  const out = ctx.destination;
  const info = [];
  for (const a of tl.plan.audio) {
    if (!a.path || a.generated || !a.path.includes('winter')) continue;
    const t0 = a.timelineStart / tl.fps, t1 = a.timelineEnd / tl.fps;
    const fin = (a.fadeInMs || 0) / 1000;
    const fout = (a.fadeOutMs ?? 60) / 1000; // brief: 60 ms at the very end when the plan gives none
    const src = ctx.createBufferSource(); src.buffer = winter; src.playbackRate.value = a.playbackRate || 1;
    const g = G(ctx, 0);
    g.gain.setValueAtTime(fin > 0 ? 0 : 1, t0);
    if (fin > 0) g.gain.linearRampToValueAtTime(1, t0 + fin);
    g.gain.setValueAtTime(1, t1 - fout);
    g.gain.linearRampToValueAtTime(0, t1);
    src.connect(g).connect(out);
    src.start(t0, a.sourceInSeconds);
    src.stop(t1 + 0.01);
    info.push({ id: a.id, filmStart: t0, filmEnd: t1, sourceIn: a.sourceInSeconds, fadeInMs: fin * 1000, fadeOutMs: fout * 1000 });
  }
  return info;
}

// ----------------------------------------------------------------------------------------------------------
// grid check against the recording (for the synth only): onset envelope in JS, per-section lead, bar re-fit
// ----------------------------------------------------------------------------------------------------------
function makeFFT(N) {
  const rev = new Uint32Array(N), bits = Math.log2(N);
  for (let i = 0; i < N; i++) { let r = 0; for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b); rev[i] = r; }
  const cs = new Float64Array(N / 2), sn = new Float64Array(N / 2);
  for (let k = 0; k < N / 2; k++) { cs[k] = Math.cos(TAU * k / N); sn[k] = Math.sin(TAU * k / N); }
  return (re, im) => {
    for (let i = 0; i < N; i++) { const j = rev[i]; if (j > i) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (let size = 2; size <= N; size <<= 1) {
      const half = size >> 1, step = N / size;
      for (let i = 0; i < N; i += size) for (let j = i, k = 0; j < i + half; j++, k += step) {
        const tr = re[j + half] * cs[k] + im[j + half] * sn[k], ti = im[j + half] * cs[k] - re[j + half] * sn[k];
        re[j + half] = re[j] - tr; im[j + half] = im[j] - ti; re[j] += tr; im[j] += ti;
      }
    }
  };
}

// log-band spectral flux (64 log bands, 60 Hz - 8 kHz; dB with an 80 dB floor below the frame maximum; median over
// bands, as librosa's onset_strength(aggregate=median)), 1024-point frames, 4 ms hop; times = frame centres (source s)
export function onsetEnvelope(buf, s0, s1) {
  const sr = buf.sampleRate, N = 1024, hop = Math.round(0.004 * sr);
  const L = buf.getChannelData(0), R = buf.numberOfChannels > 1 ? buf.getChannelData(1) : L;
  const i0 = Math.max(0, Math.round(s0 * sr) - N / 2), i1 = Math.min(L.length - N, Math.round(s1 * sr));
  const frames = Math.max(0, Math.floor((i1 - i0) / hop));
  const B = 64, edges = [];
  for (let b = 0; b <= B; b++) edges.push(Math.max(1, Math.round((60 * Math.pow(8000 / 60, b / B)) * N / sr)));
  const win = new Float64Array(N); for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos(TAU * i / N);
  const fft = makeFFT(N), re = new Float64Array(N), im = new Float64Array(N);
  const prev = new Float64Array(B), cur = new Float64Array(B), diff = new Float64Array(B), env = new Float32Array(frames);
  for (let f = 0; f < frames; f++) {
    const o = i0 + f * hop;
    for (let i = 0; i < N; i++) { re[i] = (L[o + i] + R[o + i]) * 0.5 * win[i]; im[i] = 0; }
    fft(re, im);
    let mx = -1e9;
    for (let b = 0; b < B; b++) {
      let e = 0; const k1 = Math.max(edges[b] + 1, edges[b + 1]);
      for (let k = edges[b]; k < k1; k++) e += re[k] * re[k] + im[k] * im[k];
      cur[b] = 10 * Math.log10(Math.max(1e-12, e / (k1 - edges[b])));
      if (cur[b] > mx) mx = cur[b];
    }
    for (let b = 0; b < B; b++) { cur[b] = Math.max(cur[b], mx - 80); diff[b] = f > 0 ? Math.max(0, cur[b] - prev[b]) : 0; prev[b] = cur[b]; }
    env[f] = median(Array.from(diff));
  }
  // frames are stamped at their centre: calibrated on the synth stem (known attack times) this reports sharp
  // attacks within ~1 ms of their true time (librosa's half-window shift would report them ~10 ms late)
  const t0 = (i0 + N / 2) / sr, dt = hop / sr;
  // normalised to the 99th percentile, so thresholds are relative to the recording's clear onsets
  const sorted = Float32Array.from(env).sort(), norm = sorted[Math.floor(sorted.length * 0.99)] || 1;
  return { env, t0, dt, norm, at: (t) => { const f = Math.round((t - t0) / dt); return f >= 0 && f < frames ? env[f] / norm : 0; } };
}

function median(a) { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : 0.5 * (s[m - 1] + s[m]); }

// Returns eighth times (source s) per bar for the synth. The grid's eighths sit on onset-envelope peaks of an
// earlier analysis; here they are checked against the recording itself:
//  * gross bar errors (a bar line misplaced by a third of an eighth or more, e.g. at a rubato hand-off) are re-fitted
//    by template matching: 8 evenly spaced eighths ending on the next bar's downbeat, accepted only when the onset
//    evidence is >= 1.5x that of the (best-lagged) grid eighths;
//  * each metric section gets a constant lead/lag (clamped to +-60 ms): the median offset between its eighths and
//    the strongest onset flux within +-50 ms (clear onsets only), so the synth's sharp attacks sit on the
//    orchestra's. The envelope is calibrated to report sharp attacks at their true time (see onsetEnvelope).
// Rubato bars (the drone section) keep the raw grid.
export function refineGrid(tl, winter) {
  const { grid, T } = tl;
  const bars = new Map(grid.bars.map((b) => [b.bar, b]));
  const metric = DESIGN.synth.sections.filter((s) => s.mode === 'pulse');
  const s0 = bars.get(metric[0].from).start - 1, s1 = T.ignition + 0.5; // winter-a: film time = source time
  const O = onsetEnvelope(winter, s0, s1);
  const pool = (t) => Math.max(O.at(t - O.dt), O.at(t), O.at(t + O.dt));
  const sum = (ts, lag = 0) => ts.reduce((acc, t) => acc + pool(t + lag), 0);
  const lags = []; for (let l = -0.06; l <= 0.0601; l += O.dt) lags.push(l);
  const table = new Map(), report = { sections: [], refits: [] };
  for (const b of grid.bars) table.set(b.bar, [...b.eighths]);
  const refitted = new Set(); // re-fitted bars already sit on the recording's onsets: no lead
  for (const sec of metric) {
    for (let bar = sec.to; bar >= sec.from; bar--) {
      const ev = table.get(bar), nb = table.get(bar + 1);
      if (!ev || !nb) continue;
      const E = nb[0];
      const even = (S) => Array.from({ length: 8 }, (_, k) => S + (k * (E - S)) / 8);
      let base = 0; for (const l of lags) if (Math.abs(l) <= 0.04) base = Math.max(base, sum(ev, l));
      let best = { S: ev[0], sc: -1 };
      for (let S = ev[0] - 0.45; S <= ev[0] + 0.25; S += O.dt) { const sc = sum(even(S)); if (sc > best.sc) best = { S, sc }; }
      const shift = best.S - ev[0], period = (E - ev[0]) / 8;
      if (Math.abs(shift) < period / 3) continue;
      const accepted = best.sc >= 1.5 * base;
      report.refits.push({ bar, gridDownbeat: +ev[0].toFixed(3), refitDownbeat: +best.S.toFixed(3), shiftMs: Math.round(shift * 1000), evidence: +best.sc.toFixed(2), gridEvidence: +base.toFixed(2), accepted });
      if (accepted) { table.set(bar, even(best.S)); refitted.add(bar); }
    }
    // lead: median offset of the strongest flux within +-50 ms of each eighth (only clear onsets count)
    const offs = [];
    for (let bar = sec.from; bar <= sec.to; bar++) for (const e of table.get(bar)) {
      if (e >= T.ignition || refitted.has(bar)) continue;
      let bm = 0, bt = 0; for (let x = -0.05; x <= 0.0501; x += O.dt) { const v = O.at(e + x); if (v > bm) { bm = v; bt = x; } }
      if (bm >= 0.3) offs.push(bt);
    }
    let bl = clamp(median(offs), -0.06, 0.06), basis = 'onset flux';
    // A section with verified downbeat onsets in the plan (the ladder strikes, bars 33-37) takes its lead from them:
    // in its dense tremolo the strongest flux near an eighth is often a tremolo stroke, which biases the flux
    // estimate toward the grid (-18 ms there, against -18..-29 ms at the verified strikes).
    const anchors = [];
    for (const c of tl.plan.cues) {
      const m = /^[a-z-]+-(\d+)$/.exec(c.id);
      if (c.kind !== 'orchestral-strike' || c.status !== 'verified' || !m) continue;
      const bar = +m[1], ev = table.get(bar);
      if (bar >= sec.from && bar <= sec.to && ev && !refitted.has(bar)) anchors.push(c.sourceSeconds - ev[0]);
    }
    if (anchors.length >= 3) { bl = clamp(median(anchors), -0.06, 0.06); basis = `${anchors.length} verified strike onsets`; }
    for (let bar = sec.from; bar <= sec.to; bar++) if (!refitted.has(bar)) table.set(bar, table.get(bar).map((e) => e + bl));
    report.sections.push({ bars: [sec.from, sec.to], leadMs: +(bl * 1000).toFixed(1), basis, fluxLeadMs: +(clamp(median(offs), -0.06, 0.06) * 1000).toFixed(1), eighthsUsed: offs.length });
  }
  return { table, report, onsets: O };
}

// The return (bars 56-59, winter-b): one lead for its eighths, as refineGrid's sections (median offset of the
// strongest onset flux within +-60 ms of each eighth, clear onsets only, clamped to +-60 ms). The salvos sit on it.
export function refineReturn(tl, winter) {
  const bars = tl.grid.bars.filter((b) => b.bar >= 56 && b.bar <= 60);
  if (bars.length < 2 || tl.music.sourceToFilm(bars[0].start + 0.1) == null) return null;   // bar 56 not in the film
  const O = onsetEnvelope(winter, bars[0].start - 0.5, bars[bars.length - 1].end + 0.2);
  const offs = [];
  for (const b of bars) if (b.bar <= 59) for (const e of b.eighths) {
    let bm = 0, bt = 0; for (let x = -0.06; x <= 0.0601; x += O.dt) { const v = O.at(e + x); if (v > bm) { bm = v; bt = x; } }
    if (bm >= 0.3) offs.push(bt);
  }
  const lead = offs.length >= 6 ? clamp(median(offs), -0.06, 0.06) : 0;
  return { table: new Map(bars.map((b) => [b.bar, b.eighths.map((e) => e + lead)])), leadMs: +(lead * 1000).toFixed(1), eighthsUsed: offs.length };
}

// film time of (bar, fractional eighth) on the refined table (mapped through the placements)
function refinedAt(tl, R, bar, x = 0) {
  const ev = R.table.get(bar);
  if (!ev) return null;
  const k = Math.floor(x), fr = x - k;
  if (k >= 8) return refinedAt(tl, R, bar + 1, x - 8);
  const next = k + 1 < 8 ? ev[k + 1] : (R.table.get(bar + 1)?.[0] ?? tl.grid.bars[bar - 1].end);
  return tl.music.sourceToFilm(ev[k] + (next - ev[k]) * fr);
}

// ----------------------------------------------------------------------------------------------------------
// stem 2: synth pulse (monophonic analogue-style voice driven by audio-rate control curves) + aftermath pad
// ----------------------------------------------------------------------------------------------------------
function synthSteps(tl) {
  const { grid, plan, T } = tl;
  // eighth positions: refined table when available (see refineGrid), else the raw grid
  const music = tl.refined ? { at: (bar, x) => refinedAt(tl, tl.refined, bar, x), sourceToFilm: (s) => tl.music.sourceToFilm(s) } : tl.music;
  const strikes = plan.cues.filter((c) => c.kind === 'orchestral-strike').map((c) => music.sourceToFilm(c.sourceSeconds));
  const bars = grid.bars;
  // held bass note at every eighth (null = rest: hold the previous note)
  const held = new Map(); let prev = null;
  for (const b of bars) b.bassMidi.forEach((m, k) => { if (m != null) prev = m; held.set(`${b.bar}:${k}`, prev); });
  const low = (m) => 36 + ((((m - 36) % 12) + 12) % 12); // fold into C2..B2
  const steps = [], drones = [];
  const secs = DESIGN.synth.sections;
  for (const sec of secs) {
    const tStart = music.at(sec.from, 0), tEnd = Math.min(music.at(sec.to + 1, 0) ?? T.ignition, T.ignition);
    if (sec.mode === 'drone') {
      const notes = [];
      for (let bar = sec.from; bar <= sec.to; bar++) for (let k = 0; k < 8; k++) {
        const t = music.at(bar, k), m = held.get(`${bar}:${k}`);
        if (!notes.length || notes[notes.length - 1].low !== low(m)) notes.push({ t, low: low(m) });
      }
      drones.push({ t0: tStart, t1: tEnd, notes, sec });
      continue;
    }
    let idx = 0;
    for (let bar = sec.from; bar <= sec.to; bar++) for (let k = 0; k < 8; k++) for (let j = 0; j < sec.sub; j++) {
      const t = music.at(bar, k + j / sec.sub);
      if (t == null || t >= T.ignition - 0.004) continue;
      const m = held.get(`${bar}:${k}`);
      const u = clamp((t - tStart) / (tEnd - tStart), 0, 1);
      // strike accents sit exactly on the plan's verified strike onsets (with the orchestral hit and the cannon)
      const sHit = sec.open && j === 0 ? strikes.find((s) => Math.abs(s - t) < 0.06) : undefined;
      const strike = sHit !== undefined;
      const vel = strike ? 1.3 : (k === 0 && j === 0 ? 1.0 : (k % 2 === 0 && j === 0 ? 0.9 : (j === 0 ? 0.8 : 0.7)));
      const L = low(m);
      steps.push({ t: strike ? sHit : t, bar, k, j, sec, u, strike, vel, low: L, note: L + (idx % 2 ? 12 : 0) });
      idx++;
    }
  }
  steps.sort((a, b) => a.t - b.t);
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i], n = steps[i + 1];
    const secEnd = Math.min(music.at(s.sec.to + 1, 0) ?? T.ignition, T.ignition);
    s.end = n && n.sec === s.sec ? n.t : secEnd;
  }
  return { steps, drones, strikes };
}

// per-step voice parameters by section
function voiceParams(s) {
  const id = s.sec.from;
  if (id === 3) return { cutBase: 70 * Math.pow(7, s.u), cutEnv: 1 + 2.5 * s.u, tauC: 0.16, sus: 0.6, tauA: 0.16, gate: 0.72 };
  if (id === 20) return { cutBase: 240 + 80 * s.u, cutEnv: 5.0, tauC: 0.11, sus: 0.55, tauA: 0.12, gate: 0.7 };
  if (id === 27) return { cutBase: 360 + 120 * s.u, cutEnv: 6.0, tauC: 0.07, sus: 0.5, tauA: 0.08, gate: 0.62 };
  // bars 32-38: filter wide open, accents on the strikes
  return s.strike
    ? { cutBase: 1400, cutEnv: 9.0, tauC: 0.30, sus: 0.75, tauA: 0.35, gate: 0.95 }
    : { cutBase: 900 + 300 * s.u, cutEnv: 5.5, tauC: 0.085, sus: 0.5, tauA: 0.08, gate: 0.62 };
}

export function buildSynth(ctx, tl) {
  const out = G(ctx, undb(DESIGN.synthTrimDb)); out.connect(ctx.destination);
  const { a4, T, music, grid } = tl;
  const { steps, drones } = synthSteps(tl);
  const t0 = Math.max(0, steps[0].t - 0.05), t1 = T.ignition + 0.02;
  const n = Math.ceil((t1 - t0) * SR);
  const bF1 = ctrlBuffer(ctx, n), bF2 = ctrlBuffer(ctx, n), bFs = ctrlBuffer(ctx, n), bAmp = ctrlBuffer(ctx, n), bCut = ctrlBuffer(ctx, n);
  const f1 = bF1.getChannelData(0), f2 = bF2.getChannelData(0), fs = bFs.getChannelData(0), amp = bAmp.getChannelData(0), cut = bCut.getChannelData(0);
  const det = Math.pow(2, DESIGN.synth.detuneCents / 1200);
  const hz = (m) => midiHz(m, a4);
  f1.fill(hz(steps[0].note)); f2.fill(hz(steps[0].note) * det); fs.fill(hz(steps[0].low)); cut.fill(80);
  const idx = (t) => clamp(Math.round((t - t0) * SR), 0, n);
  let lastA = 0, lastC = 80;
  // events in time order: pulse steps and drone segments
  const events = [...steps.map((s) => ({ t: s.t, s })), ...drones.map((d) => ({ t: d.t0, d }))].sort((a, b) => a.t - b.t);
  for (const ev of events) {
    if (ev.s) {
      const s = ev.s, p = voiceParams(s);
      const i0 = idx(s.t), i1 = idx(s.end), dur = s.end - s.t;
      const fA = hz(s.note), key = Math.sqrt(fA / 65.4);
      const a0 = lastA, lc0 = Math.log(Math.max(20, lastC));
      const gate = p.gate * dur;
      for (let i = i0; i < i1; i++) {
        const tau = (i - i0) / SR;
        let body = p.sus + (1 - p.sus) * Math.exp(-tau / p.tauA);
        if (tau > gate) body *= Math.exp(-(tau - gate) / 0.016);
        const atk = Math.min(1, tau / 0.003);
        const a = a0 + (s.vel * body - a0) * atk;
        const ct = Math.min(16000, p.cutBase * key * (1 + p.cutEnv * Math.exp(-tau / p.tauC)));
        const c = Math.exp(lc0 + (Math.log(ct) - lc0) * Math.min(1, tau / 0.002));
        amp[i] = a; cut[i] = c; f1[i] = fA; f2[i] = fA * det; fs[i] = hz(s.low);
      }
      if (i1 > i0) { lastA = amp[i1 - 1]; lastC = cut[i1 - 1]; }
    } else {
      // rubato solo: sustained drone on the (held) bass note, C2 + C3, with slow filter motion
      const d = ev.d, i0 = idx(d.t0), i1 = idx(d.t1);
      const a0 = lastA, lc0 = Math.log(Math.max(20, lastC));
      let ni = 0, fPrev = hz(d.notes[0].low);
      for (let i = i0; i < i1; i++) {
        const t = t0 + i / SR, tau = t - d.t0;
        while (ni + 1 < d.notes.length && d.notes[ni + 1].t <= t) ni++;
        const fT = hz(d.notes[ni].low);
        fPrev += (fT - fPrev) * (1 - Math.exp(-1 / (0.15 * SR))); // 150 ms glide on note changes
        const x = smooth(0, 0.6, tau), y = 1 - smooth(d.t1 - d.t0 - 0.25, d.t1 - d.t0, tau);
        const target = 0.85 * (0.93 + 0.07 * Math.sin(TAU * t / 3.7));
        amp[i] = (a0 + (target - a0) * x) * (0.15 + 0.85 * y);
        const ct = 150 * (1 + 2.4 * (0.5 - 0.5 * Math.cos(TAU * tau / 7.4))) * (1 + 0.12 * Math.sin(TAU * t / 2.3 + 1));
        cut[i] = Math.exp(lc0 + (Math.log(ct) - lc0) * x);
        f1[i] = fPrev; f2[i] = fPrev * 2 * Math.pow(2, 5 / 1200); fs[i] = fPrev;
      }
      if (i1 > i0) { lastA = amp[i1 - 1]; lastC = cut[i1 - 1]; }
    }
  }
  // hard stop at the ignition cut (4 ms anti-click ramp ending exactly at the cut)
  const iCut = idx(T.ignition);
  for (let i = Math.max(0, iCut - Math.round(0.004 * SR)); i < n; i++) amp[i] *= clamp((T.ignition - (t0 + i / SR)) / 0.004, 0, 1);

  // --- voice ---
  const o1 = ctx.createOscillator(); o1.type = 'sawtooth';
  const o2 = ctx.createOscillator(); o2.type = 'sawtooth';
  const sub = ctx.createOscillator(); sub.type = 'sine';
  const lw = tl.lat ? tl.lat['2x'] : 0;  // saws run through the 2x 'warm' shaper: start them early by its latency
  drive(ctx, bF1, [o1.frequency], t0 - lw); drive(ctx, bF2, [o2.frequency], t0 - lw); drive(ctx, bFs, [sub.frequency], t0);
  const alive = keepAlive(ctx);
  const mixO = G(ctx, 1); o1.connect(G(ctx, 0.5)).connect(mixO); o2.connect(G(ctx, 0.5)).connect(mixO);
  alive(mixO);
  const warm = ctx.createWaveShaper(); warm.curve = tanhCurve(1.4); warm.oversample = '2x';
  const lp1 = BQ(ctx, 'lowpass', 100, 7), lp2 = BQ(ctx, 'lowpass', 100, 0.5);
  drive(ctx, bCut, [lp1.frequency, lp2.frequency], t0);
  const vca = G(ctx, 0); drive(ctx, bAmp, [vca.gain], t0); alive(vca);
  chain(mixO, warm, lp1, lp2, vca);
  sub.connect(G(ctx, 0.5)).connect(vca);
  // bus EQ: keep the violins clear (gentle presence dip + high shelf), remove sub-rumble
  const bus = chain(vca, BQ(ctx, 'highpass', 30, 0.7), BQ(ctx, 'peaking', 2500, 0.8, -3), BQ(ctx, 'highshelf', 4000, 0.7, -5));
  bus.connect(out);
  // chorus: two LFO-modulated short delays, panned
  const chorus = (base, depth, rate, pan, phase) => {
    const d = ctx.createDelay(0.1); d.delayTime.value = base;
    const lfo = ctx.createOscillator(); lfo.frequency.value = rate;
    lfo.connect(G(ctx, depth)).connect(d.delayTime);
    const p = ctx.createStereoPanner(); p.pan.value = pan;
    bus.connect(d); d.connect(p).connect(G(ctx, 0.32)).connect(out);
    lfo.start(phase / rate);
  };
  chorus(0.011, 0.0022, 0.31, -0.75, 0); chorus(0.014, 0.0025, 0.23, 0.75, 0.37);
  // stereo ping-pong delay at dotted-sixteenth / dotted-eighth of the median eighth period (from the grid)
  const per = [];
  for (const b of grid.bars) if (b.bar >= 20 && b.bar <= 38) for (let k = 1; k < 8; k++) per.push(b.eighths[k] - b.eighths[k - 1]);
  per.sort((x, y) => x - y);
  const eighth = per[per.length >> 1];
  const dL = ctx.createDelay(2), dR = ctx.createDelay(2); dL.delayTime.value = 0.75 * eighth; dR.delayTime.value = 1.5 * eighth;
  const pL = ctx.createStereoPanner(), pR = ctx.createStereoPanner(); pL.pan.value = -0.85; pR.pan.value = 0.85;
  const dIn = chain(bus, G(ctx, 0.14), BQ(ctx, 'lowpass', 2200, 0.7), BQ(ctx, 'highpass', 150, 0.7));
  dIn.connect(dL); dL.connect(pL).connect(out); dL.connect(G(ctx, 0.3)).connect(dR); dR.connect(pR).connect(out); dR.connect(G(ctx, 0.3)).connect(dL);
  // small room
  const verb = ctx.createConvolver(); verb.normalize = false;
  verb.buffer = impulse(ctx, { seconds: 2.8, rt60: 2.2, seed: 301, hiHz: 6000, loHz: 500, early: 10, earlyMs: 50 });
  bus.connect(G(ctx, 0.16)).connect(verb).connect(out);
  [o1, o2].forEach((o) => { o.start(t0 - lw); o.stop(t1 + 0.05); }); sub.start(t0); sub.stop(t1 + 0.05);

  // --- aftermath pad: very soft F/C on the final fermata (root from the grid's bar-63 bass) ---
  const bar63 = grid.bars.find((b) => b.bar === 63);
  const padInfo = { active: false };
  if (bar63) {
    const tp = music.at(63, 0), te = T.winterEnd; // the pad lives on the fermata only (it decays with it)
    const root = bar63.bassMidi.find((m) => m != null);
    if (tp != null && root != null && te > tp + 1) {
      const pad = G(ctx, 0);
      curveEnv(pad.gain, tp, te - tp, (x) => smooth(0, 1.4, x) * (1 - smooth(te - tp - 0.5, te - tp, x)), 200);
      const lp = BQ(ctx, 'lowpass', 520, 0.6);
      const r = 41 + ((((root - 41) % 12) + 12) % 12); // fold the root into F2..E3 (bar 63's bass is F2 = 41)
      const notes = [r, r + 7, r + 12];                 // root, fifth, octave: F2 C3 F3
      notes.forEach((m, i) => [-6, 6].forEach((c) => {
        const o = ctx.createOscillator(); o.type = i === 2 ? 'triangle' : 'sawtooth'; o.frequency.value = hz(m); o.detune.value = c;
        o.connect(G(ctx, i === 0 ? 0.35 : 0.22)).connect(lp); o.start(tp); o.stop(te + 0.05);
      }));
      alive(lp); lp.connect(pad).connect(out);
      pad.connect(G(ctx, 0.3)).connect(verb);
      Object.assign(padInfo, { active: true, start: tp, end: te, notes: notes.map((m) => m) });
    }
  }
  return {
    steps: steps.map((s) => ({ t: s.t, bar: s.bar, k: s.k, j: s.j, note: s.note, strike: s.strike })),
    drones: drones.map((d) => ({ t0: d.t0, t1: d.t1, notes: d.notes })),
    eighthPeriod: eighth, pad: padInfo, span: [t0, t1],
  };
}

// ----------------------------------------------------------------------------------------------------------
// stem 3: cannons (director's 1812 samples, processed for distance)
// ----------------------------------------------------------------------------------------------------------
export function analyseSample(buf) {
  const L = buf.getChannelData(0), R = buf.numberOfChannels > 1 ? buf.getChannelData(1) : L;
  let pk = 0, pi = 0;
  for (let i = 0; i < L.length; i++) { const v = Math.max(Math.abs(L[i]), Math.abs(R[i])); if (v > pk) { pk = v; pi = i; } }
  let on = 0;
  for (let i = 0; i < L.length; i++) if (Math.max(Math.abs(L[i]), Math.abs(R[i])) > 0.1 * pk) { on = i; break; }
  // boom weight: RMS below 250 Hz (RBJ low-pass, Q 0.707) over the 300 ms after the onset — used to loudness-match
  const w0 = TAU * 250 / buf.sampleRate, al = Math.sin(w0) / (2 * 0.7071), c0 = Math.cos(w0), a0 = 1 + al;
  const m = new Float32Array(L.length); for (let i = 0; i < L.length; i++) m[i] = 0.5 * (L[i] + R[i]);
  const y = biquadRun(m, (1 - c0) / 2 / a0, (1 - c0) / a0, (1 - c0) / 2 / a0, -2 * c0 / a0, (1 - al) / a0);
  let e = 0; const n1 = Math.min(y.length, on + Math.round(0.3 * buf.sampleRate));
  for (let i = on; i < n1; i++) e += y[i] * y[i];
  return { peak: pk, peakAt: pi / buf.sampleRate, onset: on / buf.sampleRate, duration: buf.duration, boomRms: Math.sqrt(e / Math.max(1, n1 - on)) };
}

// A cue whose frame is a shot cut or carries a picture hit (shake/flash) may lead its picture by at most 20 ms: a
// bar-line cue whose recording-checked downbeat is earlier splits the difference between the beat and the frame.
export const MAX_PICTURE_LEAD = 0.020;
export function cannonTime(c, tl) {
  const r = cannonBeat(c, tl), ft = c.frame / tl.fps;
  const onPicture = tl.plan.shots.some((s) => s.start === c.frame) ||
    tl.plan.effects.some((e) => (e.type === 'shake' || e.type === 'flash') && (e.frame ?? e.start) === c.frame);
  if (onPicture && r.t < ft - MAX_PICTURE_LEAD) return { t: ft - MAX_PICTURE_LEAD, basis: `${r.basis}; lead capped at ${MAX_PICTURE_LEAD * 1000} ms (picture hit)`, beat: r.t };
  return { ...r, beat: r.t };
}
function cannonBeat(c, tl) {
  const { plan, music, fps } = tl;
  const ft = c.frame / fps;
  const strike = plan.cues.find((s) => s.kind === 'orchestral-strike' && s.frame === c.frame);
  if (strike) {
    const t = music.sourceToFilm(strike.sourceSeconds);
    if (t != null && Math.abs(t - ft) <= 1 / fps) return { t, basis: `${strike.id} onset` };
  }
  // v3 half-bar cue: eighth 5 of its bar (recording-checked), within a frame of the cue
  const h = /^cannon-(\d+)h$/.exec(c.id);
  if (h) {
    const bar = +h[1], t = tl.refined ? refinedAt(tl, tl.refined, bar, 4) : music.at(bar, 4);
    if (t != null && Math.abs(t - ft) <= 1 / fps) return { t, basis: `bar ${bar} half-bar (${tl.refined ? 'recording-checked' : 'grid'})` };
    return { t: ft, basis: 'frame' };
  }
  // salvo on bar.eighth of the return (bars 56-59, recording-checked lead), within a frame of the cue
  const sv = /^salvo-(\d+)\.(\d+)$/.exec(c.id);
  if (sv) {
    const bar = +sv[1], k = +sv[2], R = tl.refinedReturn, ev = R && R.table.get(bar);
    const t = ev ? music.sourceToFilm(ev[k]) : music.at(bar, k);
    if (t != null && Math.abs(t - ft) <= 1 / fps) return { t, basis: `bar ${bar} eighth ${k + 1} (${ev ? `recording-checked, lead ${R.leadMs} ms` : 'grid'})` };
    return { t: ft, basis: 'frame' };
  }
  const m = /^cannon-(\d+)$/.exec(c.id);
  if (m && tl.refined) {
    // downbeat as checked against the recording (grid + measured lead), if it stays within a frame of the cue;
    // otherwise the nearest recording-checked eighth of that bar within a frame (e.g. a cue on a misplaced grid bar)
    const bar = +m[1], t = refinedAt(tl, tl.refined, bar, 0);
    if (t != null && Math.abs(t - ft) <= 1 / fps) return { t, basis: `bar ${bar} downbeat (recording-checked)` };
    let best = null;
    for (const b of [bar - 1, bar]) for (let k = 0; k < 8; k++) {
      const te = refinedAt(tl, tl.refined, b, k);
      if (te != null && Math.abs(te - ft) <= 1 / fps && (!best || Math.abs(te - ft) < Math.abs(best.t - ft))) best = { t: te, basis: `bar ${b} eighth ${k + 1} (recording-checked; grid bar ${bar} misplaced)` };
    }
    if (best) return best;
  }
  if (m) {
    const t = music.at(+m[1], 0);
    if (t != null && Math.abs(t - ft) <= 1 / fps) return { t, basis: `grid bar ${m[1]} downbeat` };
  }
  return { t: ft, basis: 'frame' };
}

// One cannon sample as heard at distance d (0 = point-blank), its transient on tc: broadband attack, then the body
// closes down to a dark boom (removes the orchestral bleed in the tail; close cannons keep the crack open longer),
// bleed partials notched; close cannons (d <= 0.15) add a gated crack layer and a saturated boom layer. Into dest.
// Returns the sample's start time.
function cannonLayer(ctx, alive, S, meta, { tc, d, rate, gain, dest }) {
  const start = tc - S.info.onset / rate;      // transient lands exactly on the cue time
  const src = ctx.createBufferSource(); src.buffer = S.buffer; src.playbackRate.value = rate;
  const tone = BQ(ctx, 'lowpass', 18000, 0.5);
  const open = d <= 0.15 ? 0.06 + 0.04 * (1 - d) : 0.025 + 0.035 * (1 - d);
  tone.frequency.setValueAtTime(18000, start);
  tone.frequency.setValueAtTime(18000, tc + open);
  tone.frequency.exponentialRampToValueAtTime(meta.bodyHz * (0.8 + 0.4 * (1 - d)), tc + open + 0.07);
  alive(tone);
  let node = src.connect(tone);
  for (const f of meta.notches) node = node.connect(BQ(ctx, 'peaking', f * rate, 14, -20));
  const env = G(ctx, 0);
  const len = meta.maxLen / rate + S.info.onset / rate;
  curveEnv(env.gain, start, len, (x) => {
    const tau = x - S.info.onset / rate;
    if (tau < 0.03) return 1;
    const e = Math.exp(-(tau - 0.03) / (meta.tau * (0.85 + 0.3 * (1 - d))));
    return e * (1 - smooth(len - 0.12, len, x));
  }, 2000);
  node.connect(env).connect(G(ctx, gain * S.info.norm)).connect(dest);
  // close cannons: parallel crack layer (400 Hz high-pass, +6 dB presence at 2.5 kHz), gated to the first
  // ~35 ms, so the hit cuts through the tutti in the band the ear reads as impact
  if (d <= 0.15) {
    const on = S.info.onset / rate, gate = 0.035;
    const ag = G(ctx, 0);
    curveEnv(ag.gain, start, on + gate + 0.015, (x) => { const tau = x - on; return tau < gate ? 1 : Math.max(0, 1 - (tau - gate) / 0.012); }, 4000);
    alive(ag);
    chain(src, BQ(ctx, 'highpass', 400, 0.7), BQ(ctx, 'peaking', 2500, 0.8, 6), ag, G(ctx, (1 - d) * gain * S.info.norm), dest);
    // parallel saturated copy of the (notched, darkened) boom, band-limited to 90-400 Hz: its harmonics make
    // the boom read as loud without adding peak (no oversampling: zero latency against the dry boom; the band
    // feeding the shaper is low, so aliasing stays far below it)
    // input normalised to the sample's peak (WaveShaper clamps beyond +-1): a gentle tanh that only rounds the
    // boom's peaks, so the layer keeps the boom's decay
    const hs = ctx.createWaveShaper(); hs.curve = tanhCurve(2.5);
    alive(hs);
    chain(env, G(ctx, 0.9 / S.info.peak), hs, BQ(ctx, 'highpass', 90, 0.7), BQ(ctx, 'lowpass', 400, 0.7), G(ctx, 0.6 * (1 - d) * gain * S.info.norm * S.info.peak), dest);
  }
  src.start(start); src.stop(start + len + 0.01);
  return start;
}

// gains: optional per-cue correction in dB (from the approach-law measurement in renderSoundtrack)
export function buildCannons(ctx, tl, samples, gains = {}) {
  // 2nd-order 28 Hz high-pass on the bus: the sub thump and boom below it only drive the limiters. Peak control is
  // the look-ahead limiter applied to the rendered stem (renderSoundtrack), which keeps the boom's waveform intact.
  const out = G(ctx, 1); out.connect(BQ(ctx, 'highpass', 28, 0.707)).connect(ctx.destination);
  const cues = tl.plan.cues.filter((c) => c.kind === 'cannon').sort((a, b) => a.frame - b.frame);
  const verb = ctx.createConvolver(); verb.normalize = false;
  verb.buffer = impulse(ctx, { seconds: 5.5, rt60: 4.2, seed: 1812, hiHz: 5000, loHz: 260, early: 18, earlyMs: 110 });
  const verbOut = G(ctx, 1); verb.connect(verbOut).connect(out);
  const alive = keepAlive(ctx);
  alive(verb, out);
  // pans: drawn for the bar-line cues in order (as before the half-bar cues existed), then for the half-bar cues
  const half = (c) => /h$/.test(c.id);
  const rng = mulberry32(1812), pan = new Map();
  for (const c of cues.filter((x) => !half(x))) pan.set(c.id, rng() * 2 - 1);
  for (const c of cues.filter(half)) pan.set(c.id, rng() * 2 - 1);
  const band = (c) => (c.distance <= 0.15 ? 'near' : c.distance <= 0.5 ? 'mid' : 'far');
  // sample rotation by distance band, bar-line cues and half-bar cues each in their own rotation (the half-bar shots
  // start two samples further on, so neighbouring shots differ)
  const groupOf = (c) => cues.filter((x) => band(x) === band(c) && half(x) === half(c));
  const table = [];
  cues.forEach((c) => {
    const d = clamp(c.distance, 0, 1);
    const { t: tcue, basis, beat } = cannonTime(c, tl);
    const tc = tcue; // no shaper on this bus: the transient is scheduled on the cue itself
    // deterministic rotation by distance band; close strikes counted back from the last strike (cannon-1 last)
    const b = band(c), grp = groupOf(c), gi = grp.indexOf(c) + (half(c) ? 2 : 0);
    const id = b === 'near' ? NEAR_SET[(grp.length - 1 - gi + NEAR_SET.length * 4) % NEAR_SET.length] : (b === 'mid' ? MID_SET : FAR_SET)[gi % (b === 'mid' ? MID_SET : FAR_SET).length];
    const corr = gains[c.id] || 0;
    const lvl = undb(-23 * Math.pow(d, 0.9) + corr);
    const dry = 1 - 0.78 * Math.pow(d, 0.8), wet = 0.10 + 0.95 * Math.pow(d, 0.8);
    const pre = 0.006 + 0.11 * d;
    const rate = 1 - 0.1 * d;
    const lpHz = 350 * Math.pow(18000 / 350, Math.pow(1 - d, 1.6));
    const pn = pan.get(c.id) * 0.55 * d;
    const layers = [{ id, gain: 1 }];
    // strikes: a second sample layered under the first, thicker as d -> 0 (-6 dB at d = 0.12 to -2 dB at d = 0)
    if (d <= 0.12) layers.push({ id: NEAR_SET[(NEAR_SET.indexOf(id) + 1) % NEAR_SET.length], gain: undb(-2 - 4 * d / 0.12) });
    const dist = BQ(ctx, 'lowpass', lpHz, 0.6);
    const p = ctx.createStereoPanner(); p.pan.value = pn;
    const gDry = G(ctx, dry * lvl), gWet = G(ctx, wet * lvl), dPre = ctx.createDelay(1); dPre.delayTime.value = pre;
    alive(dist, dPre); dist.connect(p); p.connect(gDry).connect(out); p.connect(dPre).connect(gWet).connect(verb);
    const starts = layers.map((L) => cannonLayer(ctx, alive, samples[L.id], CANNON_SAMPLES[L.id], { tc, d, rate, gain: L.gain, dest: dist }));
    // synthesized sub thump for weight on the close strikes (sine 45 -> 28 Hz)
    let thump = 0;
    if (d < 0.3) {
      thump = (0.3 - d) / 0.3;
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(45, tc); o.frequency.exponentialRampToValueAtTime(28, tc + 0.45);
      const g = G(ctx, 0);
      curveEnv(g.gain, tc, 1.0, (x) => Math.min(1, x / 0.003) * Math.exp(-x / 0.18) * (1 - smooth(0.8, 1.0, x)), 2000);
      // at the cue's base distance level: the approach-law correction drives the samples, not the synthetic sub
      alive(g); o.connect(g).connect(G(ctx, 0.45 * thump * undb(-23 * Math.pow(d, 0.9)))).connect(out);
      o.start(tc); o.stop(tc + 1.05);
    }
    table.push({ id: c.id, frame: c.frame, frameTime: +(c.frame / tl.fps).toFixed(4), t: +tcue.toFixed(4), beat: +beat.toFixed(4), basis, offsetMs: +((tcue - c.frame / tl.fps) * 1000).toFixed(1),
      distance: d, band: b, sample: layers.map((l) => l.id).join('+'), rate: +rate.toFixed(3), levelDb: +db(lvl).toFixed(1), corrDb: +corr.toFixed(2), lowpassHz: Math.round(lpHz),
      preDelayMs: Math.round(pre * 1000), dry: +dry.toFixed(2), wet: +wet.toFixed(2), pan: +pn.toFixed(2), thump: +thump.toFixed(2), sampleStart: +starts[0].toFixed(5) });
  });
  return table;
}

// ----------------------------------------------------------------------------------------------------------
// stem 4: the strike undertow (the five strikes build relentlessly into the ignition)
// ----------------------------------------------------------------------------------------------------------
// Per strike: a sub shock and a saturated low burst (each stronger than the last), a reversed swell drawn into the
// hit, and a low rumble that never settles before the next strike (each one adds to it); across the final tremolo an
// air riser climbs into the vacuum. Level: set against the orchestra in the master (DESIGN.tension).
export function strikeTimes(tl) {
  return tl.plan.cues.filter((c) => c.kind === 'cannon' && c.distance <= DESIGN.duck.maxD)
    .sort((a, b) => a.frame - b.frame).map((c) => ({ id: c.id, t: cannonTime(c, tl).t }));
}

export function buildTension(ctx, tl) {
  const out = G(ctx, 1); out.connect(BQ(ctx, 'highpass', 25, 0.707)).connect(ctx.destination);
  const { T } = tl;
  const alive = keepAlive(ctx); alive(out);
  const strikes = strikeTimes(tl).map((s) => s.t), n = strikes.length;
  if (!n) return { strikes: [] };
  const grow = (k) => (n > 1 ? k / (n - 1) : 1);   // 0 on the first strike, 1 on the last
  // v3: the undertow no longer stops dead at the ignition cut; it hands over to the build over handOffS
  const hand = DESIGN.build.handOffS;
  const tA = strikes[0] - 0.6, tB = T.ignition, span = tB + hand - tA;
  const nz = noiseBuffer(ctx, span + 3, 3301, { channels: 2, pink: true });
  const src = () => { const s = ctx.createBufferSource(); s.buffer = nz; return s; };
  // (a) undertow: each strike adds to a low rumble that decays slower than the strikes come; plus a slow swell
  const undertow = (tt) => {
    let a = 0.10 * Math.pow(smooth(tA, tB, tt), 2);
    strikes.forEach((s, k) => {
      if (tt < s) return;
      const x = tt - s;
      a += (0.3 + 0.7 * grow(k)) * Math.min(1, x / 0.03) * (0.4 + 0.6 * Math.exp(-x / 0.5)) * Math.exp(-x / 3.2);
    });
    return a * (1 - smooth(tB - 0.05, tB + hand, tt));
  };
  const rum = src(), rG = G(ctx, 0);
  curveEnv(rG.gain, tA, span, (x) => undertow(tA + x), 500);
  const rSat = ctx.createWaveShaper(); rSat.curve = tanhCurve(2.0); // low band only: no oversampling, no latency
  chain(rum, BQ(ctx, 'highpass', 28, 0.707), BQ(ctx, 'lowpass', 170, 0.7), BQ(ctx, 'lowpass', 170, 0.7), G(ctx, 3.0), rSat,
    BQ(ctx, 'lowpass', 900, 0.7), rG, out);
  rum.start(tA); rum.stop(tB + hand + 0.05);
  // (b) per strike: sub shock + saturated low burst, swelling in just after the cannon's transient (they fill the
  // hit out instead of stacking on its peak); (c) a reversed swell drawn into the hit (longer each time)
  const table = [];
  strikes.forEach((s, k) => {
    const g = undb(-13 + 16 * grow(k));
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(76, s); o.frequency.exponentialRampToValueAtTime(29, s + 0.7);
    const oG = G(ctx, 0);
    curveEnv(oG.gain, s, 1.6, (x) => smooth(0, 0.012, x) * Math.exp(-x / (0.35 + 0.2 * grow(k))) * (1 - smooth(1.35, 1.6, x)), 2000);
    o.connect(oG).connect(G(ctx, 0.7 * g)).connect(out); o.start(s); o.stop(s + 1.65);
    const b = src(), bG = G(ctx, 0);
    curveEnv(bG.gain, s, 0.9, (x) => smooth(0, 0.03, x) * Math.exp(-Math.max(0, x - 0.03) / (0.13 + 0.07 * grow(k))) * (1 - smooth(0.7, 0.9, x)), 2000);
    const bSat = ctx.createWaveShaper(); bSat.curve = tanhCurve(2.5);
    chain(b, BQ(ctx, 'lowpass', 700, 0.7), G(ctx, 2.5), bSat, bG, G(ctx, 1.0 * g), out);
    b.start(s, 1 + k * 0.37); b.stop(s + 0.95);
    const len = 0.22 + 0.12 * grow(k), e = s - 0.012, s0 = e - len;
    const r = src(), rbp = BQ(ctx, 'bandpass', 450, 1.0);
    rbp.frequency.setValueAtTime(450, s0); rbp.frequency.exponentialRampToValueAtTime(3000 + 2500 * grow(k), e);
    const rvG = G(ctx, 0);
    curveEnv(rvG.gain, s0, len, (x) => Math.exp((x - len) / (0.055 + 0.04 * grow(k))) * (1 - smooth(len - 0.006, len, x)), 4000);
    chain(r, BQ(ctx, 'highpass', 200, 0.7), rbp, rvG, G(ctx, 2.0 * undb(-13 + 16 * grow(k))), out);
    r.start(s0, 3 + k * 0.53); r.stop(e + 0.01);
    table.push({ t: +s.toFixed(4), shockDb: +db(g).toFixed(1), swellS: +len.toFixed(2) });
  });
  // (d) air riser across the final tremolo, crossfading into the build's from the implosion to the cut
  const a0 = strikes[n - 1] + 0.6, a1 = T.ignition, al = a1 - a0;
  if (al > 1) {
    const air = src(), abp = BQ(ctx, 'bandpass', 900, 1.1);
    abp.frequency.setValueAtTime(900, a0); abp.frequency.exponentialRampToValueAtTime(5500, a1);
    const aG = G(ctx, 0);
    curveEnv(aG.gain, a0, al, (x) => Math.pow(x / al, 2.4) * (1 - smooth(T.buildStart, a1, a0 + x)), 500);
    chain(air, abp, aG, G(ctx, 2.0), out); air.start(a0, 7); air.stop(a1 + 0.02);
  }
  return { strikes: table, riser: [+a0.toFixed(3), +a1.toFixed(3)] };
}

// ----------------------------------------------------------------------------------------------------------
// stem: THE BUILD. As S21 implodes into its point the pressure starts to swell under the last tremolo; at the
// ignition cut the music stops and the build carries the dark alone, tightening into the explosion on the frame the
// eruption appears:
//  * a sub rumble crescendo whose pressure throb climbs from about 2 to 17 Hz and deepens;
//  * a sub tone rising 31 -> 62 Hz, saturated so that its harmonics carry it on small speakers;
//  * a saw cluster on C (C2 G2 C3 G3 C4) rising an octave into the explosion's C (the bar-56 chord), its filter
//    opening, its tremolo accelerating;
//  * a pulse train from the ignition cut whose intervals shrink geometrically (DESIGN.build.pulseRatio), converging
//    on the gap: the audience counts the explosion in;
//  * an air riser; then the vacuum: everything is inhaled (a reversed swell) and stops gapMs before the hit.
// Level: set in the master against the explosion (DESIGN.build.belowHitLu).
// ----------------------------------------------------------------------------------------------------------
export function buildPulseTimes(T) {
  const B = DESIGN.build, gs = T.explosion - DESIGN.vacuum.gapMs / 1000, A = gs - T.ignition, r = B.pulseRatio, times = [];
  if (!(A > 0.2)) return times;
  for (let k = 0; k < 64; k++) {
    times.push(gs - A * Math.pow(r, k));
    if (A * Math.pow(r, k) * (1 - r) < B.pulseMinS) break;   // the next interval would be shorter than pulseMinS
  }
  return times;
}

export function buildBuild(ctx, tl) {
  const { T, a4 } = tl, B = DESIGN.build, V = DESIGN.vacuum, hz = (m) => midiHz(m, a4);
  const b0 = T.buildStart, gs = T.explosion - V.gapMs / 1000, span = gs - b0;
  if (!(span > 0.5)) return { active: false };
  const out = G(ctx, 1); out.connect(BQ(ctx, 'highpass', 22, 0.707)).connect(ctx.destination);
  const alive = keepAlive(ctx); alive(out);
  const U = (t) => clamp((t - b0) / span, 0, 1);
  const shut = (t) => 1 - smooth(gs - 0.006, gs, t);           // every layer is shut exactly at the gap
  const grow = (u, k) => (Math.exp(k * u) - 1) / (Math.exp(k) - 1);
  const pink = noiseBuffer(ctx, span + 2, 5501, { channels: 2, pink: true });
  const white = noiseBuffer(ctx, span + 2, 5502, { channels: 2 });
  const src = (buf, off) => { const s = ctx.createBufferSource(); s.buffer = buf; s.start(b0, off); s.stop(gs + 0.02); return s; };
  // the pressure throb: an amplitude pulsation whose rate climbs throbHz[0] -> throbHz[1] (exponential in u^2) and
  // whose depth grows 0.12 -> 0.6 (phase integrated in time order: curveEnv samples its function in order)
  const throb = () => {
    let ph = 0, last = b0;
    return (t) => {
      const u = U(t);
      ph += TAU * B.throbHz[0] * Math.pow(B.throbHz[1] / B.throbHz[0], u * u) * Math.max(0, t - last); last = t;
      return 1 - (0.12 + 0.48 * u) * (0.5 - 0.5 * Math.cos(ph));
    };
  };

  // 1) sub rumble: pink noise 25-120 Hz, an exponential crescendo, throbbing, driven harder into its saturator as it
  //    grows (low band: no oversampling, no latency)
  const rumG = G(ctx, 0), th1 = throb();
  curveEnv(rumG.gain, b0, span, (x) => { const t = b0 + x; return (0.08 + 0.92 * grow(U(t), 3.0)) * th1(t) * shut(t); }, 2000);
  const rSat = ctx.createWaveShaper(); rSat.curve = tanhCurve(2.2);
  chain(src(pink, 1.0), BQ(ctx, 'highpass', 25, 0.707), BQ(ctx, 'lowpass', 120, 0.7), BQ(ctx, 'lowpass', 120, 0.7), rumG, G(ctx, 3.2), rSat,
    BQ(ctx, 'lowpass', 700, 0.7), G(ctx, 0.9), out);

  // 2) sub tone rising 31 -> 62 Hz, throbbing with the rumble, saturated: its 2nd and 3rd harmonics carry it on a phone
  const st = ctx.createOscillator(); st.type = 'sine';
  curveEnv(st.frequency, b0, span, (x) => 31 * Math.pow(2, Math.pow(U(b0 + x), 1.4)), 500);
  const stG = G(ctx, 0), th2 = throb();
  curveEnv(stG.gain, b0, span, (x) => { const t = b0 + x; return Math.pow(U(t), 1.5) * (0.6 + 0.4 * th2(t)) * shut(t); }, 2000);
  const stSat = ctx.createWaveShaper(); stSat.curve = tanhCurve(2.6);
  chain(st, stG, G(ctx, 1.4), stSat, G(ctx, 0.5), out); st.start(b0); st.stop(gs + 0.02);

  // 3) the riser: detuned saws on C2 G2 C3 G3 C4, an octave below at the implosion, rising (accelerating) to pitch at
  //    the gap, the explosion's C; warm saturation (2x: its latency is below a millisecond and the riser carries no
  //    transient), a resonant low-pass opening 110 Hz -> 5.5 kHz, a tremolo accelerating 5 -> 26 Hz
  const rng = mulberry32(5503);
  const cents = ctx.createConstantSource();
  curveEnv(cents.offset, b0, span, (x) => -1200 * (1 - Math.pow(U(b0 + x), 1.5)), 500);
  const stack = G(ctx, 1);
  for (const m of [36, 43, 48, 55, 60]) for (const s of [-1, 1]) {
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = s * (6 + 12 * rng());
    cents.connect(o.detune); o.connect(G(ctx, m <= 43 ? 0.22 : 0.14)).connect(stack); o.start(b0); o.stop(gs + 0.02);
  }
  cents.start(b0); cents.stop(gs + 0.02);
  const warm = ctx.createWaveShaper(); warm.curve = tanhCurve(1.8); warm.oversample = '2x';
  const rlp = BQ(ctx, 'lowpass', 110, 5);
  curveEnv(rlp.frequency, b0, span, (x) => 110 * Math.pow(5500 / 110, Math.pow(U(b0 + x), 1.7)), 500);
  const trG = G(ctx, 0);
  {
    let ph = 0, last = b0;
    curveEnv(trG.gain, b0, span, (x) => {
      const t = b0 + x, u = U(t);
      ph += TAU * 5 * Math.pow(26 / 5, u) * Math.max(0, t - last); last = t;
      return smooth(0, 0.12, u) * (0.12 + 0.88 * u * u) * (1 - (0.25 + 0.4 * u) * (0.5 - 0.5 * Math.cos(ph))) * shut(t);
    }, 2000);
  }
  chain(stack, warm, rlp, BQ(ctx, 'highpass', 70, 0.7), trG, G(ctx, 0.55), out);

  // 4) the pulse train: from the ignition cut, converging on the gap. Each pulse a pitched-down kick (sine 120 -> 44
  //    Hz) and a low thud, saturated together, and a tick that defines it on small speakers; each stronger than the last
  const times = buildPulseTimes(T), K = Math.max(1, times.length - 1);
  const kBus = G(ctx, 1), kSat = ctx.createWaveShaper(); kSat.curve = tanhCurve(2.0);
  alive(kBus); chain(kBus, kSat, G(ctx, 0.9), out);
  times.forEach((tp, k) => {
    const iv = (times[k + 1] ?? gs) - tp, len = Math.min(0.6, Math.max(0.03, iv * 0.98));
    const g = Math.pow(0.4 + 0.6 * (k / K), 1.2);
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(120, tp); o.frequency.exponentialRampToValueAtTime(44, tp + Math.min(0.06, len * 0.5));
    const oG = G(ctx, 0), tau = Math.min(0.2, 0.05 + 0.35 * iv);
    curveEnv(oG.gain, tp, len, (x) => Math.min(1, x / 0.0015) * Math.exp(-x / tau) * (1 - smooth(len - 0.006, len, x)), 4000);
    o.connect(oG).connect(G(ctx, 0.9 * g)).connect(kBus); o.start(tp); o.stop(tp + len + 0.01);
    const tl0 = Math.min(len, 0.12);
    const th = ctx.createBufferSource(); th.buffer = pink;
    const thG = G(ctx, 0);
    curveEnv(thG.gain, tp, tl0, (x) => Math.min(1, x / 0.001) * Math.exp(-x / 0.025) * (1 - smooth(tl0 - 0.004, tl0, x)), 4000);
    chain(th, BQ(ctx, 'lowpass', 380, 0.7), thG, G(ctx, 1.6 * g), kBus); th.start(tp, (0.37 * k) % 3); th.stop(tp + tl0 + 0.01);
    const tk = ctx.createBufferSource(); tk.buffer = white;
    const tkG = G(ctx, 0);
    curveEnv(tkG.gain, tp, 0.02, (x) => Math.min(1, x / 0.0004) * Math.exp(-x / 0.004), 8000);
    chain(tk, BQ(ctx, 'highpass', 2500, 0.7), tkG, G(ctx, 0.25 * g * g), out); tk.start(tp, (0.53 * k) % 3); tk.stop(tp + 0.025);
  });

  // 5) air riser: a noise band climbing 500 Hz -> 9 kHz, narrowing, swelling (u^3)
  const air = ctx.createBufferSource(); air.buffer = white;
  const abp = BQ(ctx, 'bandpass', 500, 1.2);
  curveEnv(abp.frequency, b0, span, (x) => 500 * Math.pow(18, Math.pow(U(b0 + x), 1.3)), 500);
  curveEnv(abp.Q, b0, span, (x) => 1.2 + 2.8 * U(b0 + x), 100);
  const aG = G(ctx, 0);
  curveEnv(aG.gain, b0, span, (x) => { const t = b0 + x; return Math.pow(U(t), 3) * shut(t); }, 1000);
  chain(air, abp, aG, G(ctx, 1.8), out); air.start(b0, 2.2); air.stop(gs + 0.02);

  // 6) the vacuum: a time-reversed decay of pink noise (its band climbing 300 Hz -> 6 kHz), its hiss, and an inhaled
  //    sine (28 -> 95 Hz), growing into the gap; nothing sounds in the gap itself
  const sLen = V.leadS, s0 = gs - sLen;
  const suck = ctx.createBufferSource(); suck.buffer = pink;
  const sbp = BQ(ctx, 'bandpass', 300, 1.3);
  sbp.frequency.setValueAtTime(300, s0); sbp.frequency.exponentialRampToValueAtTime(6000, gs);
  const sG = G(ctx, 0);
  curveEnv(sG.gain, s0, sLen, (x) => Math.exp((x - sLen) / 0.12) * (1 - smooth(sLen - 0.006, sLen, x)), 4000);
  chain(suck, BQ(ctx, 'highpass', 150, 0.7), sbp, sG, G(ctx, 2.2), out);
  const hissG = G(ctx, 0);
  curveEnv(hissG.gain, s0, sLen, (x) => Math.exp((x - sLen) / 0.07) * (1 - smooth(sLen - 0.006, sLen, x)), 4000);
  chain(suck, BQ(ctx, 'highpass', 3000, 0.7), hissG, G(ctx, 0.5), out);
  suck.start(s0, 3.0); suck.stop(gs + 0.02);
  const inh = ctx.createOscillator(); inh.type = 'sine';
  inh.frequency.setValueAtTime(28, s0); inh.frequency.exponentialRampToValueAtTime(95, gs);
  const iG = G(ctx, 0);
  curveEnv(iG.gain, s0, sLen, (x) => Math.exp((x - sLen) / 0.15) * (1 - smooth(sLen - 0.006, sLen, x)), 4000);
  inh.connect(iG).connect(G(ctx, 0.45)).connect(out); inh.start(s0); inh.stop(gs + 0.02);

  return {
    active: true, start: +b0.toFixed(4), cut: +T.ignition.toFixed(4), gapStart: +gs.toFixed(4), explosion: +T.explosion.toFixed(4),
    pulses: times.map((x) => +x.toFixed(4)), pulseIntervalsMs: times.slice(1).map((x, k) => Math.round((x - times[k]) * 1000)),
    vacuum: [+s0.toFixed(4), +gs.toFixed(4)],
  };
}

// ----------------------------------------------------------------------------------------------------------
// stem: THE EXPLOSION (stem 'ignition'). On the frame the eruption first appears (the explosion cue; the dark before
// it belongs to the build): the detonation: sub (25-50 Hz body), crack, the cannon samples stacked and pitched down
// (the close cluster, two ranks), a saturated saw-stack pressure wave on C bursting open, noise walls, crackle, the
// eruption's bloom; then the descending Doppler roar of the shock front (closest as it passes the camera in S24) and
// the shell fracture (S25). The music restarts with the hit, so the sustain is shorter than in v2, leaves the mids
// to the orchestra, and is folded under the music in the master.
// ----------------------------------------------------------------------------------------------------------
export function dopplerModel(T, { M = 0.5, tau = 1.25 } = {}) {
  // straight-line pass at speed v = M c, miss distance D (units: c = 1, distances in sound-seconds).
  // Closest-approach sound reaches the listener at T.pass. Emission time te solves t = te + r(te).
  const D = M * tau, tce = T.pass - D;
  return (t) => {
    let te = t - D;
    for (let i = 0; i < 30; i++) {
      const x = M * (te - tce), r = Math.hypot(x, D);
      const f = te + r - t, fp = 1 + (M * x) / r;
      const step = f / fp; te -= step;
      if (Math.abs(step) < 1e-9) break;
    }
    const x = M * (te - tce), r = Math.hypot(x, D), cos = x / r;
    return { k: 1 / (1 + M * cos), amp: D / r, pan: cos, x, r, M, D };
  };
}

// seeded crackle: Poisson impulses at rate(x) per second (x = seconds into the buffer), each a short decaying burst
function crackleBuffer(ctx, seconds, seed, rate, { channels = 2, burstMs = [0.6, 4] } = {}) {
  const sr = ctx.sampleRate, n = Math.ceil(seconds * sr), buf = ctx.createBuffer(channels, n, sr);
  for (let c = 0; c < channels; c++) {
    const r = mulberry32((seed * 131 + c * 7907 + 3) >>> 0), d = buf.getChannelData(c);
    for (let x = 0; ;) {
      x += -Math.log(1 - r()) / Math.max(1e-3, rate(x));
      if (x >= seconds) break;
      const i0 = Math.round(x * sr), m = Math.max(2, Math.round((burstMs[0] + r() * (burstMs[1] - burstMs[0])) * sr / 1000));
      const a = (0.3 + 0.7 * r()) * (r() < 0.5 ? -1 : 1);
      for (let k = 0; k < m && i0 + k < n; k++) d[i0 + k] += a * (r() * 2 - 1) * Math.exp(-k / (m * 0.3));
    }
  }
  return buf;
}

// the cannon cluster: samples stacked and pitched down (bigger, slower), bleed partials notched at their new pitch;
// the second rank lands just behind the first (density in one hit, not a second hit)
const CLUSTER = [
  { id: 'cannon-1', rate: 0.62, dt: 0.000, pan: 0.0, gain: 1.0 },
  { id: 'cannon-4', rate: 0.71, dt: 0.006, pan: -0.45, gain: 0.85 },
  { id: 'cannon-3', rate: 0.55, dt: 0.011, pan: 0.5, gain: 0.8 },
  { id: 'cannon-2', rate: 0.80, dt: 0.017, pan: -0.25, gain: 0.7 },
  { id: 'cannon-6', rate: 0.50, dt: 0.024, pan: 0.3, gain: 0.75 },
  { id: 'cannon-5', rate: 0.66, dt: 0.033, pan: -0.6, gain: 0.7 },
  { id: 'cannon-1', rate: 0.68, dt: 0.046, pan: 0.15, gain: 0.58 },
  { id: 'cannon-4', rate: 0.76, dt: 0.058, pan: -0.35, gain: 0.46 },
  { id: 'cannon-6', rate: 0.56, dt: 0.071, pan: 0.45, gain: 0.4 },
];

export function buildIgnition(ctx, tl, samples) {
  const out = ctx.destination;
  const { T, a4 } = tl;
  const l4 = tl.lat ? tl.lat['4x'] : 0;
  const hz = (m) => midiHz(m, a4);
  // every path ends in the bus clipper (4x): scheduled early by its latency; paths through their own 4x shaper too
  const tx = T.explosion, t = tx - l4, tsh = t - l4;
  const clip = softClip(ctx, 0.6); clip.output.connect(out);
  // 2nd-order 20 Hz high-pass keeps DC and infrasound out of the clipper. Two feeds: `imp` (the impact layers) is
  // driven into the saturator for density; `bus` (Doppler roar, fracture, reverb return) stays mostly below its knee.
  const clipIn = G(ctx, 1); clipIn.connect(BQ(ctx, 'highpass', 20, 0.707)).connect(clip.input);
  const bus = G(ctx, undb(-9 + 3.5)); bus.connect(clipIn);
  const imp = G(ctx, undb(-9 + DESIGN.impactDriveDb)); imp.connect(clipIn);
  const alive = keepAlive(ctx);
  alive(clipIn, bus, imp);
  // enormous reverb tail (seeded IR with a slow swell)
  const verb = ctx.createConvolver(); verb.normalize = false;
  verb.buffer = impulse(ctx, { seconds: 11, rt60: 8.0, seed: 2725, hiHz: 7000, loHz: 220, early: 20, earlyMs: 140, swell: 0.22 });
  const vIn = G(ctx, 1), vPre = ctx.createDelay(1); vPre.delayTime.value = 0.03;
  chain(vIn, vPre, verb, G(ctx, 0.9), bus); alive(vIn, vPre, verb);
  const send = (node, g) => node.connect(G(ctx, g)).connect(vIn);
  const nz = noiseBuffer(ctx, 14, 2725, { channels: 2 });
  const wallBuf = noiseBuffer(ctx, 14, 9001, { channels: 2, pink: true });

  // 1) sub detonation: a kick sweep 130 -> 50 Hz in 70 ms, then the body sinks 50 -> 26 Hz; octave partner; saturated;
  //    a hard-saturated 80-250 Hz copy carries it on small speakers
  const sub = ctx.createOscillator(); sub.type = 'sine';
  sub.frequency.setValueAtTime(130, tsh); sub.frequency.exponentialRampToValueAtTime(50, tsh + 0.07);
  sub.frequency.exponentialRampToValueAtTime(36, tsh + 1.2); sub.frequency.exponentialRampToValueAtTime(26, tsh + 4.5);
  const sub2 = ctx.createOscillator(); sub2.type = 'sine';
  sub2.frequency.setValueAtTime(260, tsh); sub2.frequency.exponentialRampToValueAtTime(100, tsh + 0.07);
  sub2.frequency.exponentialRampToValueAtTime(50, tsh + 4.5);
  const subEnv = G(ctx, 0), sub2Env = G(ctx, 0);
  curveEnv(subEnv.gain, tsh, 7, (x) => Math.min(1, x / 0.003) * (0.5 + 0.5 * Math.exp(-x / 0.35)) * Math.exp(-x / 2.4) * (1 - smooth(5.5, 7, x)), 1000);
  curveEnv(sub2Env.gain, tsh, 4, (x) => Math.min(1, x / 0.003) * Math.exp(-x / 0.45) * (1 - smooth(3.5, 4, x)), 1000);
  const subSat = ctx.createWaveShaper(); subSat.curve = tanhCurve(2.0); subSat.oversample = '4x';
  alive(subEnv, sub2Env, subSat); sub.connect(subEnv).connect(subSat); sub2.connect(sub2Env).connect(G(ctx, 0.35)).connect(subSat);
  const subOut = subSat.connect(G(ctx, 0.75)); subOut.connect(imp); send(subOut, 0.05);
  const subHard = ctx.createWaveShaper(); subHard.curve = tanhCurve(7.0); subHard.oversample = '4x';
  const hardIn = G(ctx, 1.6); alive(subHard, hardIn); subEnv.connect(hardIn);
  const hardOut = chain(hardIn, subHard, BQ(ctx, 'highpass', 80, 0.7), BQ(ctx, 'lowpass', 250, 0.7), G(ctx, 0.9));
  hardOut.connect(imp); send(hardOut, 0.08);
  [sub, sub2].forEach((o) => { o.start(tsh); o.stop(tsh + 7.1); });

  // 2) crack: a broadband click, then a noise burst whose band sweeps 3 kHz -> 240 Hz
  const crack = ctx.createBufferSource(); crack.buffer = nz;
  const cbp = BQ(ctx, 'bandpass', 3000, 0.7);
  cbp.frequency.setValueAtTime(3000, t); cbp.frequency.exponentialRampToValueAtTime(240, t + 0.3);
  const cEnv = G(ctx, 0);
  curveEnv(cEnv.gain, t, 1.0, (x) => Math.min(1, x / 0.0008) * (0.25 * Math.exp(-x / 0.012) + Math.exp(-x / 0.11)) * (1 - smooth(0.85, 1.0, x)), 4000);
  alive(cbp); const crackOut = chain(crack, cbp, cEnv, G(ctx, 1.5)); crackOut.connect(imp); send(crackOut, 0.7);
  crack.start(t); crack.stop(t + 1.05);
  const click = ctx.createBufferSource(); click.buffer = nz;
  const kEnv = G(ctx, 0);
  curveEnv(kEnv.gain, t, 0.03, (x) => Math.min(1, x / 0.0004) * Math.exp(-x / 0.004), 8000);
  chain(click, BQ(ctx, 'highpass', 1200, 0.7), kEnv, G(ctx, 1.2), imp); click.start(t, 5); click.stop(t + 0.035);

  // 3) the cannon cluster (all six samples in two ranks within 71 ms, pitched down), saturated together (4x shaper:
  //    scheduled on the shaper clock)
  const clIn = G(ctx, 0.32), clSat = ctx.createWaveShaper(); clSat.curve = tanhCurve(2.4); clSat.oversample = '4x';
  alive(clIn, clSat);
  const clOut = chain(clIn, clSat, BQ(ctx, 'highpass', 32, 0.7), G(ctx, 1.0)); clOut.connect(imp); send(clOut, 0.35);
  const clusterLog = [];
  const cannonAt = (tc, audible, sp) => {
    const S = samples && samples[sp.id], meta = CANNON_SAMPLES[sp.id];
    if (!S) return;
    const rate = sp.rate, on = S.info.onset / rate, hit = tc + sp.dt, start = hit - on;
    const src = ctx.createBufferSource(); src.buffer = S.buffer; src.playbackRate.value = rate;
    const tone = BQ(ctx, 'lowpass', 16000, 0.5);
    tone.frequency.setValueAtTime(16000, start); tone.frequency.setValueAtTime(16000, hit + 0.06);
    tone.frequency.exponentialRampToValueAtTime(Math.max(160, meta.bodyHz * rate * 1.4), hit + 0.22);
    alive(tone);
    let node = src.connect(tone);
    for (const f of meta.notches) node = node.connect(BQ(ctx, 'peaking', f * rate, 14, -20));
    const len = meta.maxLen / rate + on, env = G(ctx, 0);
    curveEnv(env.gain, start, len, (x) => {
      const tau = x - on;
      if (tau < 0.05) return 1;
      return Math.exp(-(tau - 0.05) / (meta.tau * 1.3 / rate)) * (1 - smooth(len - 0.15, len, x));
    }, 2000);
    const p = ctx.createStereoPanner(); p.pan.value = sp.pan;
    node.connect(env).connect(G(ctx, sp.gain * S.info.norm)).connect(p).connect(clIn);
    src.start(start); src.stop(start + len + 0.01);
    clusterLog.push({ id: sp.id, t: +(audible + sp.dt).toFixed(4), rate: sp.rate, gainDb: +db(sp.gain).toFixed(1) });
  };
  for (const sp of CLUSTER) cannonAt(tsh, tx, sp);

  // 4) electronic pressure wave: detuned saw stack on C (C1-C4 with fifths: the build's riser lands on it and the
  //    bar-56 chord is C), saturated, through a resonant low-pass that bursts open and closes within ~4 s; the chord
  //    sinks (-150 cents) as it fades, under the tutti
  const rng = mulberry32(2725);
  const stack = G(ctx, 1);
  const stackNotes = [24, 31, 36, 43, 48, 55, 60];
  const dive = ctx.createConstantSource(); dive.offset.value = 0;   // common pitch motion in cents
  curveEnv(dive.offset, tsh, 7, (x) => -150 * smooth(0.6, 5.5, x), 200);
  for (const m of stackNotes) for (let v = 0; v < 2; v++) {
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m);
    o.detune.value = (v ? 1 : -1) * (5 + 17 * rng());
    dive.connect(o.detune);
    o.connect(G(ctx, m <= 36 ? 0.2 : 0.13)).connect(stack);
    o.start(tsh); o.stop(tsh + 7.2);
  }
  dive.start(tsh); dive.stop(tsh + 7.2);
  alive(stack);
  const sat = ctx.createWaveShaper(); sat.curve = tanhCurve(3.5); sat.oversample = '4x';
  const sweep = BQ(ctx, 'lowpass', 60, 9);
  sweep.frequency.setValueAtTime(60, t);
  sweep.frequency.exponentialRampToValueAtTime(7500, t + 0.3);
  sweep.frequency.exponentialRampToValueAtTime(2200, t + 2.0);
  sweep.frequency.exponentialRampToValueAtTime(500, t + 4.0);
  sweep.frequency.exponentialRampToValueAtTime(140, t + 6.5);
  const sweep2 = BQ(ctx, 'lowpass', 9000, 0.6);
  const stackEnv = G(ctx, 0);
  curveEnv(stackEnv.gain, t, 7, (x) => Math.min(1, x / 0.012) * (0.4 + 0.6 * Math.exp(-x / 0.6)) * (1 - 0.8 * smooth(0.5, 3.0, x)) * (1 - smooth(4.0, 6.8, x)), 500);
  const stackOut = chain(stack, sat, sweep, sweep2, stackEnv, G(ctx, 0.9)); stackOut.connect(imp); send(stackOut, 0.55);

  // 5) walls: stereo pink noise (the broadband blast, closing), a low pressure rumble, a 300 Hz-3 kHz mid wall (what a
  //    phone speaker plays) and crackle (the blast shredding); all shorter than in v2, the tutti takes over
  const wall = ctx.createBufferSource(); wall.buffer = wallBuf;
  const wlp = BQ(ctx, 'lowpass', 14000, 0.5);
  wlp.frequency.setValueAtTime(14000, t); wlp.frequency.exponentialRampToValueAtTime(3500, t + 2.2);
  wlp.frequency.exponentialRampToValueAtTime(800, t + 5.5);
  const wEnv = G(ctx, 0);
  curveEnv(wEnv.gain, t, 7.5, (x) => smooth(0, 0.02, x) * (0.3 + 0.7 * Math.exp(-x / 0.45)) * (1 - 0.6 * smooth(0.4, 3.0, x)) * (1 - smooth(4.0, 7.0, x)), 500);
  const wHp = alive(BQ(ctx, 'highpass', 45, 0.7));
  const wallOut = chain(wall, wHp, wlp, wEnv, G(ctx, 0.9)); wallOut.connect(imp); send(wallOut, 0.5);
  const rum = ctx.createBufferSource(); rum.buffer = wallBuf; // offset start for decorrelation
  const rEnv = G(ctx, 0);
  curveEnv(rEnv.gain, t, 8.5, (x) => smooth(0, 0.06, x) * (0.6 + 0.4 * Math.exp(-x / 0.8)) * Math.exp(-x / 3.0) * (1 - smooth(5.5, 8.0, x)), 500);
  // 25 Hz high-pass: pink noise below it is only DC drift and infrasound
  chain(rum, alive(BQ(ctx, 'highpass', 25, 0.707)), BQ(ctx, 'lowpass', 90, 0.7), BQ(ctx, 'lowpass', 90, 0.7), rEnv, G(ctx, 1.4), imp);
  const mid = ctx.createBufferSource(); mid.buffer = wallBuf;
  const mLp = BQ(ctx, 'lowpass', 3200, 0.7);
  mLp.frequency.setValueAtTime(3200, t); mLp.frequency.exponentialRampToValueAtTime(1600, t + 2.0);
  mLp.frequency.exponentialRampToValueAtTime(800, t + 4.5);
  const mEnv = G(ctx, 0);
  curveEnv(mEnv.gain, t, 6, (x) => smooth(0, 0.012, x) * (0.55 * Math.exp(-x / 0.9) + 0.45 * Math.exp(-x / 0.25)) * (1 - smooth(4, 5.5, x)), 500);
  alive(mLp);
  const midOut = chain(mid, BQ(ctx, 'highpass', 300, 0.7), mLp, mEnv, G(ctx, 2.4)); midOut.connect(imp); send(midOut, 0.45);
  wall.start(t); wall.stop(t + 7.6); rum.start(t, 3.3); rum.stop(t + 8.6); mid.start(t, 6.7); mid.stop(t + 6.05);
  const crk = ctx.createBufferSource();
  crk.buffer = crackleBuffer(ctx, 7, 2726, (x) => 260 * Math.exp(-x / 0.9) + 40 * Math.exp(-x / 3.5));
  const crG = G(ctx, 0);
  curveEnv(crG.gain, t, 7, (x) => smooth(0, 0.005, x) * (1 - smooth(5.5, 7, x)), 200);
  const crOut = chain(crk, BQ(ctx, 'highpass', 900, 0.7), BQ(ctx, 'peaking', 3200, 0.9, 4), crG, G(ctx, 0.5));
  crOut.connect(imp); send(crOut, 0.25);
  crk.start(t); crk.stop(t + 7.05);

  // 6) the eruption's bloom (a white-gold point swells out of black): a bright noise burst opening 2.5 -> 11 kHz and
  //    closing
  const bl = ctx.createBufferSource(); bl.buffer = wallBuf;
  const blp = BQ(ctx, 'lowpass', 2500, 0.7);
  blp.frequency.setValueAtTime(2500, t); blp.frequency.exponentialRampToValueAtTime(11000, t + 0.12);
  blp.frequency.exponentialRampToValueAtTime(1600, t + 1.8);
  const blG = G(ctx, 0);
  curveEnv(blG.gain, t, 2.5, (x) => smooth(0, 0.015, x) * Math.exp(-x / 0.5) * (1 - smooth(2.1, 2.5, x)), 1000);
  const blOut = chain(bl, BQ(ctx, 'highpass', 200, 0.7), blp, blG, G(ctx, 0.8)); blOut.connect(imp); send(blOut, 0.6);
  bl.start(t, 11.0); bl.stop(t + 2.55);

  // 7) the descending Doppler roar of the shock front: under the returning tutti (a mid dip leaves the orchestra its
  //    band), loudest as the front passes the camera, receding to the C2 asymptote and gone ~4.5 s after the pass
  const dop = dopplerModel(T);
  const C2 = hz(36);
  const f0 = C2 * (1 + 0.5);                         // receding asymptote f0/(1+M) is exactly C2
  const r0 = t + 0.4, r1 = T.pass + 5.0, rd = r1 - r0, rate = 200;
  const rr = r0 + l4; // curves are evaluated on the audible clock (scheduled time + bus-clipper latency)
  const fCurve = (x) => f0 * dop(rr + x).k;
  const fade = (tt) => smooth(rr, rr + 1.5, tt) * (1 - smooth(T.pass + 1.5, T.pass + 4.5, tt));
  // spreading (softened: the front is a vast surface, not a point) x convective amplification on approach
  const toneLevel = (x) => { const tt = rr + x, s = dop(tt); return fade(tt) * Math.pow(s.amp, 0.75) * Math.pow(s.k, 0.6); };
  const noiseLevel = (x) => { const tt = rr + x, s = dop(tt); return fade(tt) * Math.pow(s.amp, 0.85) * Math.pow(s.k, 0.5); };
  const cutCurve = (x) => { const s = dop(rr + x); return 260 + 9000 * Math.pow(s.amp, 1.3) * Math.pow(s.k, 0.5); };
  const panCurve = (x) => { const tt = rr + x, s = dop(tt); return 0.9 * s.pan * (1 - smooth(T.pass + 2.0, T.pass + 4.5, tt)); };

  const fBase = ctx.createConstantSource(); curveEnv(fBase.offset, r0, rd, fCurve, rate);
  const tone = alive(G(ctx, 1));
  const cluster = [[1, -8, 'sawtooth', 0.28], [1, 8, 'sawtooth', 0.28], [2, 3, 'sawtooth', 0.16], [1.5, -4, 'sawtooth', 0.09], [0.5, 0, 'sine', 0.35]];
  for (const [mul, cents, type, g] of cluster) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = 0; o.detune.value = cents;
    fBase.connect(G(ctx, mul)).connect(o.frequency);
    o.connect(G(ctx, g)).connect(tone); o.start(r0); o.stop(r1 + 0.05);
  }
  const tSat = ctx.createWaveShaper(); tSat.curve = tanhCurve(2.6); tSat.oversample = '2x';
  const tLp = BQ(ctx, 'lowpass', 1000, 6); curveEnv(tLp.frequency, r0, rd, cutCurve, rate);
  const tG = G(ctx, 0); curveEnv(tG.gain, r0, rd, toneLevel, rate);
  const pan = ctx.createStereoPanner(); curveEnv(pan.pan, r0, rd, panCurve, rate);
  chain(tone, tSat, tLp, tG, G(ctx, 0.6), pan);
  // noise roar: band-passes that ride the Doppler factor, plus low rumble
  const roarBuf = noiseBuffer(ctx, rd + 0.2, 2881, { channels: 2, pink: true });
  const rn = ctx.createBufferSource(); rn.buffer = roarBuf;
  const nSum = G(ctx, 1);
  for (const [fc, q, g] of [[230, 0.9, 1.0], [880, 0.7, 0.55], [2600, 0.8, 0.25]]) {
    const bp = BQ(ctx, 'bandpass', 0, q); bp.frequency.value = 0;
    fBase.connect(G(ctx, fc / f0)).connect(bp.frequency);
    alive(bp); rn.connect(bp).connect(G(ctx, g)).connect(nSum);
  }
  rn.connect(alive(BQ(ctx, 'highpass', 25, 0.707))).connect(BQ(ctx, 'lowpass', 110, 0.7)).connect(G(ctx, 1.4)).connect(nSum);
  alive(nSum);
  const nLp = BQ(ctx, 'lowpass', 1000, 0.7); curveEnv(nLp.frequency, r0, rd, (x) => 1.6 * cutCurve(x), rate);
  const nG = G(ctx, 0); curveEnv(nG.gain, r0, rd, noiseLevel, rate);
  chain(nSum, nLp, nG, pan);
  const roarOut = chain(pan, BQ(ctx, 'peaking', 1100, 0.6, -5), G(ctx, 0.8)); roarOut.connect(bus); send(roarOut, 0.32);
  rn.start(r0); rn.stop(r1 + 0.05); fBase.start(r0); fBase.stop(r1 + 0.05);

  // 8) the shell fracture (S25): a crackling tear, a noise band sweeping 6 kHz -> 900 Hz
  if (T.fracture != null) {
    const tf = T.fracture - l4;
    const fr = ctx.createBufferSource();
    fr.buffer = crackleBuffer(ctx, 1.6, 2939, (x) => 500 * Math.exp(-x / 0.25) + 30, { burstMs: [0.4, 2.5] });
    const fG = G(ctx, 0);
    curveEnv(fG.gain, tf, 1.6, (x) => smooth(0, 0.004, x) * (1 - smooth(1.2, 1.6, x)), 500);
    const frOut = chain(fr, BQ(ctx, 'highpass', 700, 0.7), fG, G(ctx, 0.45)); frOut.connect(bus); send(frOut, 0.3);
    fr.start(tf); fr.stop(tf + 1.65);
    const tr = ctx.createBufferSource(); tr.buffer = nz;
    const tbp = BQ(ctx, 'bandpass', 6000, 2.0);
    tbp.frequency.setValueAtTime(6000, tf); tbp.frequency.exponentialRampToValueAtTime(900, tf + 0.7);
    const ftG = G(ctx, 0);
    curveEnv(ftG.gain, tf, 0.9, (x) => smooth(0, 0.01, x) * Math.exp(-x / 0.3) * (1 - smooth(0.75, 0.9, x)), 1000);
    const trOut = chain(tr, tbp, ftG, G(ctx, 1.6)); trOut.connect(bus); send(trOut, 0.4);
    tr.start(tf, 8.0); tr.stop(tf + 0.95);
  }

  return {
    explosion: tx, ignition: T.ignition, pass: T.pass, fracture: T.fracture, return56: T.return56,
    cluster: clusterLog, f0, C2, mach: 0.5, passWidthSeconds: 1.25, roar: [+(r0 + l4).toFixed(3), +(r1 + l4).toFixed(3)],
    doppler: [-3, -2, -1, -0.5, 0, 0.5, 1, 2, 3, 4].map((dt) => {
      const tt = T.pass + dt, s = dop(tt);
      return { t: +tt.toFixed(3), hz: +(f0 * s.k).toFixed(2), level: +db(toneLevel(tt - rr)).toFixed(1), pan: +panCurve(tt - rr).toFixed(2) };
    }),
  };
}

// ----------------------------------------------------------------------------------------------------------
// stem 6: the coda. The same event seen from Earth: night air (soft wind, a distant very low drone on the fermata's
// root) and, as the new star appears, a delicate high shimmer (F major partials, each twinkling): from here the
// cataclysm arrives as silent light. Fades up and down with the picture; silent on the last frame.
// ----------------------------------------------------------------------------------------------------------
// smooth seeded random drift in [0, 1]: knots every 1/rate s, smoothstep between them (knots drawn in index order,
// so the curve does not depend on how it is sampled)
function driftCurve(seed, rate) {
  const r = mulberry32(seed), knots = [];
  return (x) => {
    const k = Math.max(0, Math.floor(x * rate)), f = clamp(x * rate - k, 0, 1);
    while (knots.length <= k + 1) knots.push(r());
    return knots[k] + (knots[k + 1] - knots[k]) * f * f * (3 - 2 * f);
  };
}

export function buildCoda(ctx, tl) {
  const { T, a4, grid } = tl;
  if (T.coda == null) return { active: false };
  const C = DESIGN.coda, hz = (m) => midiHz(m, a4);
  const c0 = T.coda, len = T.end - c0, lastFrame = 1 / tl.fps;
  const alive = keepAlive(ctx);
  const master = G(ctx, 0); master.connect(ctx.destination);
  // up with the picture's fade from black; down with its fade to black, silent through the last frame
  curveEnv(master.gain, c0, len, (x) => { const tt = c0 + x; return smooth(c0, T.codaUp, tt) * (1 - smooth(T.pictureOut, T.end - lastFrame, tt)); }, 400);
  const verb = ctx.createConvolver(); verb.normalize = false;
  verb.buffer = impulse(ctx, { seconds: 8, rt60: 6.0, seed: 3650, hiHz: 9000, loHz: 1200, early: 6, earlyMs: 120, swell: 0.12 });
  verb.connect(G(ctx, 1)).connect(master); alive(verb);
  // 1) wind: two decorrelated pink-noise bands (left / right) with seeded gusts moving level and band
  const windBuf = noiseBuffer(ctx, len + 4, 3651, { channels: 2, pink: true });
  [[-0.55, 11, 0.0], [0.55, 23, 3.1]].forEach(([pan, seed, off]) => {
    const g1 = driftCurve(seed, 0.3), g2 = driftCurve(seed + 1, 0.9);
    const gust = (x) => Math.pow(0.7 * g1(x) + 0.3 * g2(x), 1.4);
    const src = ctx.createBufferSource(); src.buffer = windBuf;
    const bp = BQ(ctx, 'bandpass', 400, 0.6); curveEnv(bp.frequency, c0, len, (x) => 220 + 600 * gust(x), 50);
    const wg = G(ctx, 0); curveEnv(wg.gain, c0, len, (x) => 0.3 + 0.7 * gust(x), 50);
    const p = ctx.createStereoPanner(); p.pan.value = pan;
    chain(src, BQ(ctx, 'highpass', 110, 0.7), bp, wg, p, master); p.connect(G(ctx, 0.2)).connect(verb);
    const hi = G(ctx, 0); curveEnv(hi.gain, c0, len, (x) => 0.1 * Math.pow(gust(x), 2), 50);
    chain(src, BQ(ctx, 'highpass', 2500, 0.7), BQ(ctx, 'lowpass', 7000, 0.7), hi, p);
    src.start(c0, off); src.stop(T.end + 0.01);
  });
  // 2) distant drone: the fermata's root (bar 63's bass folded to the octave below F2) + octave + twelfth, dark and
  //    mostly hall, breathing slowly
  const bar63 = grid.bars.find((b) => b.bar === 63);
  const root = (bar63 && bar63.bassMidi.find((m) => m != null)) ?? 41;
  const r1 = 29 + ((((root - 29) % 12) + 12) % 12);
  const dG = G(ctx, 0);
  curveEnv(dG.gain, c0, len, (x) => smooth(0, 5, x) * (0.8 + 0.2 * Math.sin(TAU * x / 9.7)), 50);
  const dLp = BQ(ctx, 'lowpass', 260, 0.6);
  for (const [m, type, cents, g] of [[r1, 'sine', 0, 0.55], [r1, 'sine', 5, 0.3], [r1 + 12, 'triangle', -4, 0.22], [r1 + 19, 'triangle', 3, 0.07]]) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = hz(m); o.detune.value = cents;
    o.connect(G(ctx, g)).connect(dLp); o.start(c0); o.stop(T.end + 0.01);
  }
  const dAmt = undb(C.droneDb);
  dLp.connect(dG); dG.connect(G(ctx, 0.5 * dAmt)).connect(master); dG.connect(G(ctx, 0.35 * dAmt)).connect(verb);
  // 3) the new star: high partials of F major (F6 C7 F7 A7 C8), each a slowly beating pair with its own seeded twinkle,
  //    mostly heard through the hall; it rises from nothing as the star appears and is fully there with it
  const s0 = T.star, sLen = T.end - s0;
  const shim = G(ctx, 0);
  curveEnv(shim.gain, s0, sLen, (x) => Math.pow(smooth(s0, T.starFull + 0.4, s0 + x), 1.5), 200);
  const PART = [[89, 0.5, -0.45], [96, 0.42, 0.3], [101, 0.32, -0.15], [105, 0.16, 0.55], [108, 0.12, -0.6]];
  PART.forEach(([m, g, pn], i) => {
    const tw = driftCurve(3782 + i * 17, 1.3 + 0.35 * i);
    const a = G(ctx, 0); curveEnv(a.gain, s0, sLen, (x) => 0.3 + 0.7 * Math.pow(tw(x), 1.6), 100);
    for (const df of [0, 0.21 + 0.07 * i]) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = hz(m) + df;
      o.connect(G(ctx, g * 0.5)).connect(a); o.start(s0); o.stop(T.end + 0.01);
    }
    const p = ctx.createStereoPanner(); p.pan.value = pn;
    a.connect(p).connect(shim);
  });
  const air = ctx.createBufferSource(); air.buffer = windBuf;
  const tw0 = driftCurve(3818, 2.1), airG = G(ctx, 0);
  curveEnv(airG.gain, s0, sLen, (x) => 0.04 * Math.pow(tw0(x), 2), 100);
  chain(air, BQ(ctx, 'highpass', 6000, 0.7), BQ(ctx, 'lowpass', 10000, 0.7), airG, shim);
  air.start(s0, 7.0); air.stop(T.end + 0.01);
  const sAmt = undb(C.shimmerDb);
  shim.connect(G(ctx, 0.3 * sAmt)).connect(master); shim.connect(G(ctx, 0.9 * sAmt)).connect(verb);
  return { active: true, start: c0, fadeUpEnd: T.codaUp, star: [T.star, T.starFull], fadeOut: [T.pictureOut, T.end - lastFrame], droneMidi: [r1, r1 + 12, r1 + 19], shimmerMidi: PART.map((p) => p[0]) };
}

// ----------------------------------------------------------------------------------------------------------
// mix / master (plain JS DSP on rendered buffers)
// ----------------------------------------------------------------------------------------------------------
function biquadRun(x, b0, b1, b2, a1, a2, y = new Float32Array(x.length)) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = x[i], o = b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = v; y2 = y1; y1 = o; y[i] = o;
  }
  return y;
}
// ITU-R BS.1770 K-weighting at 48 kHz
function kWeight(x) {
  const y = biquadRun(x, 1.53512485958697, -2.69169618940638, 1.19839281085285, -1.69065929318241, 0.73248077421585);
  return biquadRun(y, 1.0, -2.0, 1.0, -1.99004745483398, 0.99007225036621, y);
}
export function loudness(L, R) {
  const kl = kWeight(L), kr = kWeight(R);
  const blk = Math.round(0.4 * SR), hop = Math.round(0.1 * SR);
  const z = [];
  // prefix sums for speed
  const n = kl.length, cs = new Float64Array(Math.floor(n / hop) + 2);
  for (let j = 0, i = 0; j * hop < n; j++) {
    let s = 0; const e = Math.min(n, (j + 1) * hop);
    for (; i < e; i++) s += kl[i] * kl[i] + kr[i] * kr[i];
    cs[j + 1] = cs[j] + s;
  }
  const hops = blk / hop;
  for (let j = 0; (j + hops) * hop <= n; j++) z.push((cs[j + hops] - cs[j]) / blk);
  const lk = (v) => -0.691 + 10 * Math.log10(v);
  const g1 = z.filter((v) => lk(v) > -70);
  const rel = lk(g1.reduce((a, b) => a + b, 0) / g1.length) - 10;
  const g2 = g1.filter((v) => lk(v) > rel);
  return lk(g2.reduce((a, b) => a + b, 0) / g2.length);
}

// stereo-linked feed-forward compressor, soft knee, RMS detector
function compress(L, R, p) {
  const n = L.length, oL = new Float32Array(n), oR = new Float32Array(n);
  const aD = 1 - Math.exp(-1 / (p.rms * SR)), aA = 1 - Math.exp(-1 / (p.attack * SR)), aR = 1 - Math.exp(-1 / (p.release * SR));
  let pw = 0, gr = 0, maxGr = 0, sumGr = 0;
  for (let i = 0; i < n; i++) {
    const v = Math.max(L[i] * L[i], R[i] * R[i]);
    pw += aD * (v - pw);
    const lvl = 10 * Math.log10(pw + 1e-20), over = lvl - p.thresholdDb, k = p.kneeDb;
    let target = 0;
    if (over > k / 2) target = (1 / p.ratio - 1) * over;
    else if (over > -k / 2) target = (1 / p.ratio - 1) * (over + k / 2) * (over + k / 2) / (2 * k);
    gr += (target < gr ? aA : aR) * (target - gr);
    const g = Math.pow(10, gr / 20);
    oL[i] = L[i] * g; oR[i] = R[i] * g;
    if (-gr > maxGr) maxGr = -gr; sumGr += -gr;
  }
  return { L: oL, R: oR, maxGrDb: maxGr, meanGrDb: sumGr / n };
}

// 4x oversampled true-peak estimate per sample (polyphase windowed sinc, 12 taps/phase)
const TP_TAPS = (() => {
  const ph = [];
  for (let p = 1; p < 4; p++) {
    const h = []; let s = 0;
    for (let k = -5; k <= 6; k++) {
      const x = k - p / 4, w = 0.5 + 0.5 * Math.cos(Math.PI * x / 6.5);
      const v = (x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x)) * w; h.push(v); s += v;
    }
    ph.push(h.map((v) => v / s));
  }
  return ph;
})();
function truePeakSeries(L, R) {
  const n = L.length, pk = new Float32Array(n);
  for (const X of [L, R]) for (let i = 0; i < n; i++) {
    let m = Math.abs(X[i]);
    if (i >= 5 && i + 6 < n) for (let p = 0; p < 3; p++) {
      const h = TP_TAPS[p]; let s = 0;
      for (let k = 0; k < 12; k++) s += h[k] * X[i - 5 + k];
      const a = Math.abs(s); if (a > m) m = a;
    }
    if (m > pk[i]) pk[i] = m;
  }
  return pk;
}
// look-ahead true-peak limiter (offline): centred min + centred average guarantees g <= required gain
// ceilDb: a number, or a Float32Array of per-sample linear ceilings
function limit(L, R, ceilDb, lookMs = 1.5, relMs = 80) {
  const n = L.length, r = Math.round(lookMs * SR / 1000);
  const C = typeof ceilDb === 'number' ? null : ceilDb, c0 = C ? 1 : undb(ceilDb);
  const pk = truePeakSeries(L, R);
  const req = new Float32Array(n);
  for (let i = 0; i < n; i++) { const ceil = C ? C[i] : c0; req[i] = pk[i] > ceil ? ceil / pk[i] : 1; }
  // sliding minimum over [i-r, i+r] (monotonic deque)
  const h = new Float32Array(n), dq = new Int32Array(n); let head = 0, tail = 0;
  for (let i = 0; i < n + r; i++) {
    if (i < n) { while (tail > head && req[dq[tail - 1]] >= req[i]) tail--; dq[tail++] = i; }
    const c = i - r;
    if (c >= 0) { while (dq[head] < c - r) head++; h[c] = req[dq[head]]; }
  }
  // centred moving average over [i-r, i+r]
  const cs = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) cs[i + 1] = cs[i] + h[i];
  const aR = 1 - Math.exp(-1 / (relMs * SR / 1000));
  const oL = new Float32Array(n), oR = new Float32Array(n);
  let g = 1, minG = 1, active = 0;
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - r), b = Math.min(n, i + r + 1);
    const avg = (cs[b] - cs[a]) / (b - a);
    const rel = g + (1 - g) * aR;
    g = Math.min(avg, rel);
    oL[i] = L[i] * g; oR[i] = R[i] * g;
    if (g < minG) minG = g; if (g < 0.999) active++;
  }
  return { L: oL, R: oR, maxGrDb: -db(minG), activePct: (100 * active) / n };
}

function bandRMS(K, i0, i1) { let s = 0; for (let i = i0; i < i1; i++) s += K[i] * K[i]; return s / Math.max(1, i1 - i0); }

// moving-average power envelope (both channels) in dB, sampled every `step` samples, window `win` s centred
function powerEnvDb(X, win, step) {
  const n = X[0].length, w = Math.max(1, Math.round(win * SR)), m = Math.ceil(n / step), out = new Float32Array(m);
  const cs = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) { let v = 0; for (const c of X) v += c[i] * c[i]; cs[i + 1] = cs[i] + v / X.length; }
  for (let j = 0; j < m; j++) {
    const c = j * step, a = Math.max(0, c - (w >> 1)), b = Math.min(n, c + (w >> 1) + 1);
    out[j] = 10 * Math.log10((cs[b] - cs[a]) / Math.max(1, b - a) + 1e-20);
  }
  return out;
}
// zero-phase one-pole smoothing (forward + backward) of a control series sampled every `dt` s
function smoothSeries(x, dt, tau) {
  const a = 1 - Math.exp(-dt / tau), y = Float32Array.from(x);
  for (let i = 1; i < y.length; i++) y[i] = y[i - 1] + a * (y[i] - y[i - 1]);
  for (let i = y.length - 2; i >= 0; i--) y[i] = y[i + 1] + a * (y[i] - y[i + 1]);
  return y;
}

// K-weighted energy (both channels summed) per 100 ms hop: the building block of BS.1770 momentary/short-term
const HOP = Math.round(0.1 * SR);
function hopEnergy(L, R) {
  const kl = kWeight(L), kr = kWeight(R), nh = Math.ceil(kl.length / HOP), e = new Float64Array(nh);
  for (let h = 0; h < nh; h++) { let s = 0; const b = Math.min(kl.length, (h + 1) * HOP); for (let i = h * HOP; i < b; i++) s += kl[i] * kl[i] + kr[i] * kr[i]; e[h] = s; }
  return e;
}
// short-term loudness (3 s window ending at the end of hop j, as ffmpeg's ebur128 'S' at t = (j + 1) * 0.1 s)
function stFromHops(e, W = 30) {
  const S = new Float32Array(e.length); let acc = 0;
  for (let j = 0; j < e.length; j++) { acc += e[j]; if (j >= W) acc -= e[j - W]; S[j] = -0.691 + 10 * Math.log10(Math.max(1e-20, acc / (W * HOP))); }
  return S;
}
export function shortTerm(L, R) { return stFromHops(hopEnergy(L, R)); }
// summary of a short-term series: max over windows ending in [t0, t1] (s) and when
function stMax(S, t0 = 0, t1 = Infinity) {
  let m = -Infinity, at = null;
  for (let j = 0; j < S.length; j++) { const t = (j + 1) * 0.1; if (t >= t0 - 1e-9 && t <= t1 + 1e-9 && S[j] > m) { m = S[j]; at = t; } }
  return { lufs: +m.toFixed(2), t: at == null ? null : +at.toFixed(1) };
}
// ungated K-weighted loudness of [t0, t1] (filters settled on 0.5 s before it)
function segLufs(X, t0, t1) {
  const a = Math.max(0, Math.round((t0 - 0.5) * SR)), b = Math.min(X[0].length, Math.round(t1 * SR)), c = Math.round(t0 * SR);
  const kl = kWeight(X[0].subarray(a, b)), kr = kWeight(X[1].subarray(a, b));
  let s = 0; for (let i = c - a; i < kl.length; i++) s += kl[i] * kl[i] + kr[i] * kr[i];
  return -0.691 + 10 * Math.log10(Math.max(1e-20, s / Math.max(1, b - c)));
}

// Short-term loudness cap: a slow programme ride (per-sample linear gain) that keeps every 3 s window of (L, R) at
// or below capLufs. Solved on the 100 ms hop energies: each window's excess is taken off every hop it contains; the
// ride is then smoothed as a centred moving average of its centred sliding minimum (radius `rad` hops, so it never
// rides less than required and ramps over ~1 s); repeated on the residual. Only the loudest passages move, by a
// slowly varying gain: transients and internal dynamics are untouched.
function loudnessCap(L, R, capLufs, { W = 30, rad = 5, iters = 6 } = {}) {
  const e = hopEnergy(L, R), nh = e.length, g = new Float32Array(nh);
  const ridden = new Float64Array(nh);
  let excess = 0;
  for (let it = 0; it < iters; it++) {
    for (let h = 0; h < nh; h++) ridden[h] = e[h] * Math.pow(10, g[h] / 10);
    const S = stFromHops(ridden, W);
    const need = new Float32Array(nh); excess = 0;
    for (let j = 0; j < nh; j++) {
      const r = S[j] - capLufs; if (r <= 0) continue;
      if (r > excess) excess = r;
      for (let h = Math.max(0, j - W + 1); h <= j; h++) if (r > need[h]) need[h] = r;
    }
    if (excess < 0.02) break;
    const mn = new Float32Array(nh);
    for (let h = 0; h < nh; h++) { let m = 0; for (let k = Math.max(0, h - rad); k <= Math.min(nh - 1, h + rad); k++) if (need[k] > m) m = need[k]; mn[h] = m; }
    for (let h = 0; h < nh; h++) {
      let s = 0, c = 0; for (let k = h - rad; k <= h + rad; k++) { s += k >= 0 && k < nh ? mn[k] : 0; c++; }
      g[h] -= s / c + (need[h] > 0 ? 0.01 : 0);
    }
  }
  const out = new Float32Array(L.length); let maxRide = 0, ridePct = 0;
  for (let h = 0; h < nh; h++) { if (-g[h] > maxRide) maxRide = -g[h]; if (g[h] < -0.1) ridePct++; }
  for (let i = 0; i < L.length; i++) {
    const x = i / HOP - 0.5, h = Math.max(0, Math.min(nh - 2, Math.floor(x))), f = clamp(x - h, 0, 1);
    out[i] = undb(g[h] + (g[h + 1] - g[h]) * f);
  }
  return { gain: out, maxRideDb: maxRide, ridePct: (100 * ridePct) / nh, residualLu: excess };
}

// Auto-level of the synth against the orchestra.
//  * pulse sections: per bar, K-weighted, toward the authored offsets; smoothed only within a section (no kernel
//    taps across a section boundary), piecewise linear between bar centres, 30 ms ramps at section boundaries;
//  * drone (rubato solo): follows the orchestra's plain-RMS envelope (0.5 s, smoothed 0.3 s) offsetDb under it,
//    and never closer than capDb to its faster (0.15 s) envelope.
function autoLevelSynth(tl, orch, syn, synthInfo) {
  const { music } = tl;
  const kO = [kWeight(orch[0]), kWeight(orch[1])], kS = [kWeight(syn[0]), kWeight(syn[1])];
  const ms = (K, a, b) => (bandRMS(K[0], a, b) + bandRMS(K[1], a, b)) / 2;
  const at = (bb) => (tl.refined ? refinedAt(tl, tl.refined, bb, 0) : music.at(bb, 0));
  const tStop = tl.T.ignition, iStop = Math.round(tStop * SR);
  const rows = [], spans = [];
  for (const sec of DESIGN.synth.sections) {
    const t0 = at(sec.from), t1 = Math.min(at(sec.to + 1) ?? tStop, tStop);
    spans.push({ sec, t0, t1 });
    if (sec.mode !== 'pulse') continue;
    const sr = [];
    for (let bar = sec.from; bar <= sec.to; bar++) {
      const ta = at(bar), tb = Math.min(at(bar + 1) ?? tStop, tStop);
      if (!(tb > ta)) continue;
      const a = Math.round(ta * SR), b = Math.round(tb * SR);
      const u = sec.to > sec.from ? (bar - sec.from) / (sec.to - sec.from) : 0;
      const target = sec.offset[0] + (sec.offset[1] - sec.offset[0]) * u;
      const lo = 10 * Math.log10(ms(kO, a, b) + 1e-20), ls = 10 * Math.log10(ms(kS, a, b) + 1e-20);
      const po = 10 * Math.log10(ms(orch, a, b) + 1e-20), ps = 10 * Math.log10(ms(syn, a, b) + 1e-20);
      sr.push({ bar, ta, tb, target, orchK: lo, synthK: ls, gainDb: clamp(target - (ls - lo), -30, 30), capDb: DESIGN.synth.plainCapDb - (ps - po), sec });
    }
    // smoothed within the section; a bar never goes more than 1 dB above its own target gain (a soft entry, e.g.
    // the orchestra's bar 20, is not pulled up by louder neighbours) nor closer than plainCapDb to the orchestra
    const W = [1, 2, 3, 2, 1];
    sr.forEach((r, i) => {
      let s = 0, w = 0;
      for (let k = -2; k <= 2; k++) { const x = sr[i + k]; if (x) { s += W[k + 2] * x.gainDb; w += W[k + 2]; } }
      r.appliedDb = Math.min(s / w, r.gainDb + 1, r.capDb);
    });
    rows.push(...sr);
  }
  const n = syn[0].length, gDb = new Float32Array(n);
  // pulse sections
  for (const sp of spans) {
    if (sp.sec.mode !== 'pulse') continue;
    const sr = rows.filter((r) => r.sec === sp.sec), cen = sr.map((r) => (r.ta + r.tb) / 2), gs = sr.map((r) => r.appliedDb);
    const i0 = Math.max(0, Math.round(sp.t0 * SR)), i1 = Math.min(iStop, Math.round(sp.t1 * SR));
    for (let i = i0, j = 0; i < i1; i++) {
      const t = i / SR;
      if (t <= cen[0]) gDb[i] = gs[0];
      else if (t >= cen[cen.length - 1]) gDb[i] = gs[gs.length - 1];
      else { while (cen[j + 1] < t) j++; gDb[i] = gs[j] + (gs[j + 1] - gs[j]) * ((t - cen[j]) / (cen[j + 1] - cen[j])); }
    }
    if (i0 > 0 && sp === spans[0]) for (let i = 0; i < i0; i++) gDb[i] = gs[0]; // pre-roll (silent anyway)
  }
  // drone section: envelope following (plain RMS)
  const droneInfo = [];
  const dc = DESIGN.synth.drone, STEP = 480, dt = STEP / SR;
  for (const sp of spans) {
    if (sp.sec.mode !== 'drone') continue;
    const j0 = Math.floor(sp.t0 / dt), j1 = Math.ceil(sp.t1 / dt);
    const sl = (X) => X.map((c) => c.subarray(j0 * STEP, Math.min(c.length, (j1 + 1) * STEP)));
    const oS = smoothSeries(powerEnvDb(sl(orch), 0.5, STEP), dt, 0.3), oF = powerEnvDb(sl(orch), 0.15, STEP), sE = powerEnvDb(sl(syn), 0.5, STEP);
    // the drone's own nominal level: its steady part (after the 0.6 s fade-in, before the 0.25 s fade-out)
    const k0 = Math.round(0.8 / dt), k1 = sE.length - Math.round(0.5 / dt);
    let acc = 0, cnt = 0; for (let k = k0; k < k1; k++) { acc += Math.pow(10, sE[k] / 10); cnt++; }
    const sRef = 10 * Math.log10(acc / Math.max(1, cnt) + 1e-20);
    const gser = new Float32Array(sE.length);
    for (let k = 0; k < sE.length; k++) gser[k] = clamp(Math.min(oS[k] + dc.offsetDb - sRef, oF[k] + dc.capDb - sE[k]), -60, 40);
    const gsm = smoothSeries(gser, dt, 0.12);
    const i0 = Math.round(sp.t0 * SR), i1 = Math.min(iStop, Math.round(sp.t1 * SR));
    for (let i = i0; i < i1; i++) {
      const x = i / STEP - j0, k = Math.min(gsm.length - 2, Math.max(0, Math.floor(x))), f = clamp(x - k, 0, 1);
      gDb[i] = gsm[k] + (gsm[k + 1] - gsm[k]) * f;
    }
    droneInfo.push({ t0: sp.t0, t1: sp.t1, synthRefDb: +sRef.toFixed(1), gainRangeDb: [+Math.min(...gsm).toFixed(1), +Math.max(...gsm).toFixed(1)] });
  }
  // 30 ms ramps (in dB) across each internal section boundary, so delay/room tails are never stepped
  const R = Math.round(0.015 * SR);
  for (let s = 1; s < spans.length; s++) {
    const ib = Math.round(spans[s].t0 * SR); if (ib - R < 0 || ib + R >= iStop) continue;
    const a = gDb[ib - R], b = gDb[ib + R];
    for (let i = ib - R; i <= ib + R; i++) gDb[i] = a + (b - a) * smooth(ib - R, ib + R, i);
  }
  const g = new Float32Array(n);
  for (let i = 0; i < iStop; i++) g[i] = undb(gDb[i]);
  // hard stop at the ignition cut also silences the synth's chorus/delay/room tails (4 ms ramp)
  const ramp = Math.round(0.004 * SR);
  for (let i = iStop - ramp; i < iStop; i++) g[i] *= (iStop - i) / ramp;
  // aftermath pad: one gain for the bar-63 region against the orchestra, then follow the orchestra's fermata decay
  let pad = null;
  if (synthInfo.pad.active) {
    const a = Math.round(synthInfo.pad.start * SR), b = Math.round(Math.min(synthInfo.pad.start + 2.5, synthInfo.pad.end) * SR);
    const lo = 10 * Math.log10(ms(kO, a, b) + 1e-20), ls = 10 * Math.log10(ms(kS, a, b) + 1e-20);
    const pg = clamp(DESIGN.synth.padOffset - (ls - lo), -40, 40);
    // orchestra envelope (200 ms RMS), normalised at the pad's reference window
    const win = Math.round(0.2 * SR), env = new Float32Array(n);
    let s = 0;
    for (let i = 0; i < n; i++) { const v = orch[0][i] * orch[0][i] + orch[1][i] * orch[1][i]; s += v; if (i >= win) { const w = orch[0][i - win] ** 2 + orch[1][i - win] ** 2; s -= w; } env[i] = Math.sqrt(Math.max(0, s) / win); }
    let ref = 0; for (let i = a; i < b; i++) ref += env[i]; ref /= Math.max(1, b - a);
    for (let i = Math.max(iStop, a - SR); i < n; i++) g[i] = undb(pg) * Math.min(1, env[i] / (ref || 1));
    pad = { gainDb: pg, orchK: lo, synthKraw: ls };
  }
  return { rows, gain: g, pad, drone: droneInfo };
}

// Cannon approach law: measure each cue (K-weighted, 400 ms from its transient) against the orchestra (K-weighted,
// the 500 ms before it) on the bus, return the correction toward rel(d) and the per-cue table.
function cannonLevels(tl, kO, gO, canStem, gC, table, prev = {}) {
  const P = DESIGN.cannon;
  const kC = [kWeight(canStem[0]), kWeight(canStem[1])];
  const ms = (K, a, b) => bandRMS(K[0], a, b) + bandRMS(K[1], a, b);
  const out = {}, rows = [];
  for (const r of table) {
    const a = Math.round(r.t * SR), b = Math.round((r.t + 0.4) * SR);
    const lc = 10 * Math.log10(ms(kC, a, b) * gC * gC + 1e-20);
    const lo = 10 * Math.log10(ms(kO, Math.round((r.t - 0.5) * SR), a) * gO * gO + 1e-20);
    const target = P.relFar + (P.relNear - P.relFar) * Math.pow(1 - r.distance, P.shape);
    const err = target - (lc - lo);
    // close cues stop at nearMaxCorrDb: beyond it the stem limiter would flatten the boom's decay into a roar
    const cap = r.distance <= DESIGN.duck.maxD ? P.nearMaxCorrDb : P.maxCorrDb;
    out[r.id] = clamp((prev[r.id] || 0) + err, -P.maxCorrDb, cap);
    rows.push({ id: r.id, distance: r.distance, target: +target.toFixed(2), rel: +(lc - lo).toFixed(2), errDb: +err.toFixed(2) });
  }
  return { gains: out, rows, maxErr: Math.max(...rows.map((x) => Math.abs(x.errDb))) };
}

// Per-sample linear ceiling of the cannon-stem limiter: ceilDb, raised toward nearDb around the strike cues.
// The strike cues (d <= maxD) get their own ceiling, a staircase from strikeFromDb (farthest strike) to nearDb (the
// last), so each strike lands a clear step above the one before (they are all limiter-bound).
function cannonCeiling(n, cannons) {
  const CL = DESIGN.cannonLimiter, maxD = DESIGN.duck.maxD, c = new Float32Array(n).fill(undb(CL.ceilDb));
  for (const k of cannons) {
    if (k.distance > maxD) continue;
    const step = CL.strikeFromDb + (CL.nearDb - CL.strikeFromDb) * (1 - k.distance / maxD) - CL.ceilDb;
    for (let i = Math.max(0, Math.round((k.t - 0.02) * SR)); i < Math.min(n, Math.round((k.t + 1.2) * SR)); i++) {
      const x = i / SR - k.t, w = smooth(-0.02, -0.005, x) * (1 - smooth(0.8, 1.2, x));
      c[i] = undb(CL.ceilDb + step * w);
    }
  }
  return c;
}

// Duck envelope (linear gain) for the orchestra/synth under the strike cannons.
function duckGain(n, cannons) {
  const P = DESIGN.duck, gdb = new Float32Array(n);
  for (const c of cannons) {
    if (c.distance > P.maxD) continue;
    const depth = P.depthDb[0] + (P.depthDb[1] - P.depthDb[0]) * (1 - c.distance / P.maxD);
    const i0 = Math.round((c.t - P.attack) * SR), i1 = Math.round((c.t + P.hold + 8 * P.tau) * SR);
    for (let i = Math.max(0, i0); i < Math.min(n, i1); i++) {
      const x = i / SR - c.t;
      const s = x < 0 ? smooth(-P.attack, 0, x) : (x < P.hold ? 1 : Math.exp(-(x - P.hold) / P.tau));
      gdb[i] = Math.min(gdb[i], -depth * s);
    }
  }
  const g = new Float32Array(n);
  for (let i = 0; i < n; i++) g[i] = gdb[i] === 0 ? 1 : undb(gdb[i]);
  return g;
}

// ----------------------------------------------------------------------------------------------------------
// WAV encoding
// ----------------------------------------------------------------------------------------------------------
export function wav(L, R, { bits = 24, float = false, seed = 1 } = {}) {
  const n = L.length, ch = 2, bps = float ? 4 : bits / 8;
  const dataBytes = n * ch * bps;
  const fmtLen = float ? 18 : 16, factLen = float ? 12 : 0;
  const buf = new ArrayBuffer(12 + 8 + fmtLen + factLen + 8 + dataBytes);
  const v = new DataView(buf); let o = 0;
  const str = (s) => { for (let i = 0; i < s.length; i++) v.setUint8(o++, s.charCodeAt(i)); };
  str('RIFF'); v.setUint32(o, buf.byteLength - 8, true); o += 4; str('WAVE');
  str('fmt '); v.setUint32(o, fmtLen, true); o += 4;
  v.setUint16(o, float ? 3 : 1, true); o += 2; v.setUint16(o, ch, true); o += 2;
  v.setUint32(o, SR, true); o += 4; v.setUint32(o, SR * ch * bps, true); o += 4;
  v.setUint16(o, ch * bps, true); o += 2; v.setUint16(o, bps * 8, true); o += 2;
  if (float) { v.setUint16(o, 0, true); o += 2; str('fact'); v.setUint32(o, 4, true); o += 4; v.setUint32(o, n, true); o += 4; }
  str('data'); v.setUint32(o, dataBytes, true); o += 4;
  if (float) {
    for (let i = 0; i < n; i++) { v.setFloat32(o, L[i], true); o += 4; v.setFloat32(o, R[i], true); o += 4; }
  } else {
    const r = mulberry32(seed), u8 = new Uint8Array(buf);
    const full = 8388607;
    for (let i = 0; i < n; i++) for (const X of [L, R]) {
      const d = (r() - r()); // TPDF dither, +-1 LSB
      let s = Math.round(X[i] * full + d);
      s = Math.max(-8388608, Math.min(8388607, s));
      u8[o++] = s & 255; u8[o++] = (s >> 8) & 255; u8[o++] = (s >> 16) & 255;
    }
  }
  return buf;
}

// Chrome's oversampled WaveShaper delays its output (up/down-sampling filters). Measured here, in the same browser,
// so every path through a shaper can be scheduled early by exactly its latency (transients stay on their cues).
export async function measureShaperLatency() {
  const lat = { none: 0 };
  for (const os of ['2x', '4x']) {
    const ctx = new OfflineAudioContext(1, 4800, SR);
    const b = ctx.createBuffer(1, 4800, SR); b.getChannelData(0)[1000] = 0.5;
    const s = ctx.createBufferSource(); s.buffer = b;
    const ws = ctx.createWaveShaper(); ws.curve = new Float32Array([-1, 1]); ws.oversample = os;
    s.connect(ws).connect(ctx.destination); s.start(0);
    const o = (await ctx.startRendering()).getChannelData(0);
    // the up/down-sampling filters are linear-phase: the energy centroid of the impulse response is the delay
    // (robust against float noise, unlike an argmax that can flip between two near-equal taps); whole samples
    let e = 0, m = 0; for (let i = 0; i < o.length; i++) { const v = o[i] * o[i]; e += v; m += v * i; }
    lat[os] = Math.round(m / e - 1000) / SR;
  }
  return lat;
}

// ----------------------------------------------------------------------------------------------------------
// main entry
// ----------------------------------------------------------------------------------------------------------
export async function renderSoundtrack({ base = '/', log = console.log, only = null } = {}) {
  const t00 = performance.now();
  const tl = await loadTimeline(base);
  const { plan, length, T } = tl;
  const newCtx = () => new OfflineAudioContext(2, length, SR);
  const dec = newCtx();
  const winterAsset = plan.audio.find((a) => a.path && a.path.includes('winter'));
  const winter = await loadAudio(dec, base + winterAsset.path);
  const samples = {};
  for (const a of plan.assets.filter((x) => x.role === 'sfx' && /^cannon-\d+$/.test(x.id))) {
    const b = await loadAudio(dec, base + a.path);
    samples[a.id] = { buffer: b, info: analyseSample(b) };
  }
  // loudness-match the samples on their boom weight (gain relative to the median), so distance drives the level
  const booms = Object.values(samples).map((x) => x.info.boomRms).sort((x, y) => x - y);
  const refBoom = booms[booms.length >> 1];
  for (const x of Object.values(samples)) x.info.norm = refBoom / x.info.boomRms;
  log(`loaded: winter ${winter.duration.toFixed(2)} s @ ${winter.sampleRate} Hz; ${Object.keys(samples).length} cannon samples; length ${length} samples (${tl.duration} s)`);

  const stems = {}, info = {};
  const render = async (name, build) => {
    const t0 = performance.now(), ctx = newCtx();
    info[name] = build(ctx);
    const buf = await ctx.startRendering();
    stems[name] = [buf.getChannelData(0), buf.getChannelData(1)];
    log(`stem ${name}: rendered in ${((performance.now() - t0) / 1000).toFixed(1)} s`);
  };
  tl.lat = await measureShaperLatency();
  log(`waveshaper latency: 2x ${(tl.lat['2x'] * 1000).toFixed(2)} ms, 4x ${(tl.lat['4x'] * 1000).toFixed(2)} ms (compensated)`);
  const t1r = performance.now();
  tl.refined = refineGrid(tl, winter);
  log(`grid check: leads ${tl.refined.report.sections.map((x) => `${x.bars.join('-')}: ${x.leadMs} ms`).join(', ')}; re-fits ${JSON.stringify(tl.refined.report.refits.map((r) => [r.bar, r.shiftMs, r.accepted]))} (${((performance.now() - t1r) / 1000).toFixed(1)} s)`);
  const builders = {
    orchestra: (ctx) => buildOrchestra(ctx, tl, winter),
    synth: (ctx) => buildSynth(ctx, tl),
    tension: (ctx) => buildTension(ctx, tl),
    ignition: (ctx) => buildIgnition(ctx, tl, samples),
    coda: (ctx) => buildCoda(ctx, tl),
  };
  // development: render only the named stems, raw (no balance, no master); the "mix" is their plain sum
  if (only) {
    for (const name of only) if (builders[name]) await render(name, builders[name]);
    const sum = [0, 1].map((c) => { const y = new Float32Array(length); for (const k of Object.keys(stems)) { const x = stems[k][c]; for (let i = 0; i < length; i++) y[i] += x[i]; } return y; });
    return { mix: sum, stems, report: { only, times: T, info, renderSeconds: (performance.now() - t00) / 1000 } };
  }
  for (const name of Object.keys(builders)) await render(name, builders[name]);
  const gO = undb(DESIGN.orchestraMakeupDb), gC = undb(DESIGN.cannonsDb);
  // cannons: render, measure every cue against the orchestra, correct toward the approach law, re-render
  const kO = [kWeight(stems.orchestra[0]), kWeight(stems.orchestra[1])];
  let cg = {}, cl = null;
  const cannonPasses = [];
  let cLim = null;
  for (let pass = 0; pass < DESIGN.cannon.passes; pass++) {
    await render('cannons', (ctx) => buildCannons(ctx, tl, samples, cg));
    const CL = DESIGN.cannonLimiter;
    cLim = limit(stems.cannons[0], stems.cannons[1], cannonCeiling(length, info.cannons), CL.lookMs, CL.relMs);
    stems.cannons = [cLim.L, cLim.R];
    cl = cannonLevels(tl, kO, gO, stems.cannons, gC, info.cannons, cg);
    cannonPasses.push(+cl.maxErr.toFixed(2));
    log(`cannon approach law, pass ${pass}: max error ${cl.maxErr.toFixed(2)} dB (cannon limiter max ${cLim.maxGrDb.toFixed(1)} dB)`);
    if (cl.maxErr <= DESIGN.cannon.tolDb || pass === DESIGN.cannon.passes - 1) break;
    cg = cl.gains;
  }

  // --- music bus balance: strike duck, ladder ride (easing up across the strikes), vacuum before the cut ---
  const duck = duckGain(length, info.cannons);
  const LR = DESIGN.ladderRide, tRide = refinedAt(tl, tl.refined, LR.fromBar, 0);
  const strikes = strikeTimes(tl), tS1 = strikes.length ? strikes[0].t : T.ignition;
  for (let i = Math.max(0, Math.round((tRide - LR.rampS) * SR)); i < length; i++) {
    const tt = i / SR;
    // the aftermath (after the cut) keeps the ladder's level
    const rideDb = tt < T.ignition ? LR.db * smooth(tRide - LR.rampS, tRide, tt) + (LR.endDb - LR.db) * clamp((tt - tS1) / (T.ignition - tS1), 0, 1) : LR.db;
    duck[i] *= undb(rideDb);
  }
  const V = DESIGN.vacuum, tv0 = T.ignition - V.leadS, tg = T.ignition - V.gapMs / 1000;
  const vac = new Float32Array(length).fill(1);
  for (let i = Math.round(tv0 * SR); i < Math.round(T.ignition * SR); i++) {
    const tt = i / SR;
    vac[i] = undb(tt < tg ? V.depthDb * Math.pow(smooth(tv0, tg, tt), 1.3) : V.depthDb + (V.gapDb - V.depthDb) * smooth(tg, tg + 0.008, tt));
  }
  const scale = (X, f) => X.map((x) => { const y = new Float32Array(length); for (let i = 0; i < length; i++) y[i] = x[i] * f(i); return y; });
  const orch = scale(stems.orchestra, (i) => gO * duck[i] * vac[i]);
  const lev = autoLevelSynth(tl, scale(stems.orchestra, () => gO), stems.synth, info.synth);
  const syn = scale(stems.synth, (i) => lev.gain[i] * duck[i] * vac[i]);
  const can = scale(stems.cannons, (i) => gC * vac[i]);
  // undertow: one gain against the orchestra as heard (ducked, ridden) over the strikes, before the vacuum
  const tw0 = tS1 - 0.6, tw1 = tv0;
  const tenRaw = segLufs(stems.tension, tw0, tw1), orchRef = segLufs(orch, tw0, tw1);
  const gT = undb(DESIGN.tension.relLu - (tenRaw - orchRef));
  const ten = scale(stems.tension, (i) => gT * vac[i]);
  const music = [0, 1].map((c) => { const y = new Float32Array(length); const a = orch[c], b = syn[c], d = can[c], e = ten[c]; for (let i = 0; i < length; i++) y[i] = a[i] + b[i] + d[i] + e[i]; return y; });

  // --- climax bus: set to its short-term loudness target in the director's window, own true-peak limiter ---
  const CX = DESIGN.climax, cw0 = T.ignition, cw1 = T.ignition + CX.windowFrames / tl.fps;
  let gX = undb(CX.targetST - segLufs(stems.ignition, cw0, cw0 + 3)), cx = null, cxMax = null;
  let headroomBound = false;
  for (let it = 0; it < 8; it++) {
    cx = limit(...scale(stems.ignition, () => gX), CX.ceilDb, CX.lookMs, CX.relMs);
    cxMax = stMax(shortTerm(cx.L, cx.R), cw0, cw1);
    log(`climax pass ${it}: gain ${db(gX).toFixed(2)} dB -> short-term max ${cxMax.lufs} LUFS at ${cxMax.t} s (limiter max ${cx.maxGrDb.toFixed(1)} dB)`);
    const over = cx.maxGrDb - CX.maxGrDb;
    if (over > 0.05) { gX *= undb(-over); continue; }            // the peak reduction tracks the gain about 1:1
    headroomBound = cxMax.lufs < CX.targetST - 0.1 && over > -0.3;
    if (Math.abs(cxMax.lufs - CX.targetST) < 0.1 || headroomBound) break;
    gX *= undb(Math.min(CX.targetST - cxMax.lufs, -over));      // never step past the transient's headroom
  }
  const cxSustainGrDb = segLufs(scale(stems.ignition, () => gX), cw0 + 0.25, cw1) - segLufs([cx.L, cx.R], cw0 + 0.25, cw1);

  // --- coda bus: set by the loudness of the wind before the star ---
  let coda = null, codaReport = null;
  if (info.coda && info.coda.active) {
    const raw = segLufs(stems.coda, T.codaUp, T.star);
    const gK = undb(DESIGN.coda.windLufs - raw);
    coda = scale(stems.coda, () => gK);
    codaReport = { ...info.coda, gainDb: +db(gK).toFixed(2), windLufs: +segLufs(coda, T.codaUp, T.star).toFixed(2), starLufs: +segLufs(coda, T.starFull + 0.5, T.pictureOut).toFixed(2) };
  }

  // --- master: music gain -> glue compression -> short-term cap under the climax; + climax + coda -> true-peak
  //     limiter; the music gain is iterated to the programme loudness target ---
  const cap = cxMax.lufs - CX.marginLu;
  const preL = loudness(music[0], music[1]);
  let gM = undb(DESIGN.targetLufs - 1.0 - preL), comp, ride, lim, L = 0, prev = null;
  for (let it = 0; it < 8; it++) {
    comp = compress(...scale(music, () => gM), { ...DESIGN.comp, thresholdDb: DESIGN.targetLufs + DESIGN.comp.thresholdRel });
    ride = loudnessCap(comp.L, comp.R, cap);
    const sum = [0, 1].map((c) => { const m = c ? comp.R : comp.L, x = c ? cx.R : cx.L, k = coda && coda[c], y = new Float32Array(length); for (let i = 0; i < length; i++) y[i] = m[i] * ride.gain[i] + x[i] + (k ? k[i] : 0); return y; });
    lim = limit(sum[0], sum[1], DESIGN.limiterCeilingDb);
    L = loudness(lim.L, lim.R);
    log(`master pass ${it}: music gain ${db(gM).toFixed(2)} dB -> ${L.toFixed(2)} LUFS (comp max ${comp.maxGrDb.toFixed(1)} dB, cap ${cap.toFixed(1)} LUFS ride max ${ride.maxRideDb.toFixed(1)} dB on ${ride.ridePct.toFixed(1)}%, limiter max ${lim.maxGrDb.toFixed(1)} dB, active ${lim.activePct.toFixed(2)}%)`);
    if (Math.abs(L - DESIGN.targetLufs) < 0.05) break;
    // secant step: the climax and coda buses do not follow the music gain, so the programme moves less than 1:1
    let step = DESIGN.targetLufs - L;
    if (prev && Math.abs(db(gM) - prev.g) > 1e-3) step /= clamp((L - prev.L) / (db(gM) - prev.g), 0.25, 1.5);
    prev = { g: db(gM), L };
    gM *= undb(step);
  }
  // the final mix's short-term profile (3 s windows ending in each range)
  const S = shortTerm(lim.L, lim.R);
  const pre = stMax(S, 0, T.ignition), after = stMax(S, T.return56 + 3, T.end), win = stMax(S, cw0, cw1);
  const outside = pre.lufs >= after.lufs ? pre : after;
  const shortTermReport = {
    overall: stMax(S), climaxWindow: { ...win, frames: [plan.cues.find((c) => c.id === 'ignition').frame, Math.round(cw1 * tl.fps)] },
    climax: stMax(S, T.ignition, T.return56), darkHold: stMax(S, T.ignition, T.darkEnd), shockPass: stMax(S, T.shock[0], T.shock[1]),
    strikes: stMax(S, tS1, T.ignition),
    perStrike: strikes.map((s, k) => ({ id: s.id, t: +s.t.toFixed(3), ...stMax(S, s.t, k + 1 < strikes.length ? strikes[k + 1].t : T.ignition) })),
    preIgnition: pre, aftermath: after, outsideClimax: outside, marginLu: +(win.lufs - outside.lufs).toFixed(2),
    coda: stMax(S, T.coda, T.end),
  };
  log(`short-term: climax window ${win.lufs} LUFS at ${win.t} s; strikes ${shortTermReport.strikes.lufs}; outside the climax ${outside.lufs} at ${outside.t} s; margin ${shortTermReport.marginLu} LU`);

  // stems as they enter their buses: music stems x music gain (before glue + cap), climax after its limiter, coda
  const scaled = {
    orchestra: scale(orch, () => gM), synth: scale(syn, () => gM), cannons: scale(can, () => gM), tension: scale(ten, () => gM),
    ignition: [cx.L, cx.R], ...(coda ? { coda } : {}),
  };
  const stemLufs = {};
  for (const [k, v] of Object.entries(scaled)) { try { stemLufs[k] = +loudness(v[0], v[1]).toFixed(2); } catch { stemLufs[k] = null; } }
  const report = {
    durationSeconds: tl.duration, sampleRate: SR, length,
    times: T, tuningA4: tl.a4, gridCheck: tl.refined.report, shaperLatencySamples: { x2: Math.round(tl.lat['2x'] * SR), x4: Math.round(tl.lat['4x'] * SR) },
    orchestra: info.orchestra, synth: { ...info.synth, steps: info.synth.steps.length, autoLevel: lev.rows.map((r) => ({ bar: r.bar, target: +r.target.toFixed(1), raw: +(r.synthK - r.orchK).toFixed(1), appliedDb: +r.appliedDb.toFixed(1) })), drone: lev.drone, pad: lev.pad },
    synthSteps: info.synth.steps,
    ladderRide: { ...DESIGN.ladderRide, rideStart: +tRide.toFixed(3), easeFrom: +tS1.toFixed(3) },
    vacuum: { ...DESIGN.vacuum, start: +tv0.toFixed(4), gapStart: +tg.toFixed(4) },
    tension: { ...info.tension, relLu: DESIGN.tension.relLu, gainDb: +db(gT).toFixed(2) },
    cannonApproach: { law: DESIGN.cannon, passMaxErrDb: cannonPasses, cues: cl.rows, limiter: { ...DESIGN.cannonLimiter, maxGrDb: +cLim.maxGrDb.toFixed(1) } }, duck: { ...DESIGN.duck, cues: info.cannons.filter((c) => c.distance <= DESIGN.duck.maxD).map((c) => c.id) },
    cannons: info.cannons, cannonSamples: Object.fromEntries(Object.entries(samples).map(([k, s]) => [k, { ...CANNON_SAMPLES[k], onsetMs: +(s.info.onset * 1000).toFixed(2), peakAtMs: +(s.info.peakAt * 1000).toFixed(1), peakDb: +db(s.info.peak).toFixed(1), boomDb: +db(s.info.boomRms).toFixed(1), matchGainDb: +db(s.info.norm).toFixed(1) }])),
    ignition: { ...info.ignition, bus: { ...CX, gainDb: +db(gX).toFixed(2), shortTermMax: cxMax, headroomBound, limiterMaxGrDb: +cx.maxGrDb.toFixed(2), sustainGrDb: +cxSustainGrDb.toFixed(2) } },
    coda: codaReport,
    master: { targetLufs: DESIGN.targetLufs, ceilingDbtp: DESIGN.ceilingDbtp, preLufs: +preL.toFixed(2), musicGainDb: +db(gM).toFixed(2), lufs: +L.toFixed(2), compMaxGrDb: +comp.maxGrDb.toFixed(2), compMeanGrDb: +comp.meanGrDb.toFixed(2), capLufs: +cap.toFixed(2), capRideMaxDb: +ride.maxRideDb.toFixed(2), capRidePct: +ride.ridePct.toFixed(2), limiterMaxGrDb: +lim.maxGrDb.toFixed(2), limiterActivePct: +lim.activePct.toFixed(3), stemLufs, orchestraMakeupDb: DESIGN.orchestraMakeupDb },
    shortTerm: shortTermReport,
    renderSeconds: (performance.now() - t00) / 1000,
  };
  return { mix: [lim.L, lim.R], stems: scaled, report };
}
