// Soundtrack renderer for "David & Goliath": orchestra (USAF Band, Vivaldi "Winter" I), an eighties synth pulse,
// approaching cannon strikes (US Army Band 1812 samples), the ignition pressure wave + Doppler roar, and the master.
//
// Everything is derived from film-plan.json (fps, audio placements, cues, shots, assets) and analysis/grid.json
// (bar/eighth grid in source seconds, bassMidi per eighth, tuning). The only authored numbers are sound-design
// constants (levels, filter shapes, envelopes) and the section structure in bars given by the director.
//
// Determinism: no Math.random / Date. All noise and impulse responses come from seeded mulberry32 generators, every
// measured quantity (shaper latency, grid check) is derived robustly, so the output is a function of (plan, grid,
// media). Chrome's native Web Audio kernels still differ between runs at float-rounding level (SIMD paths): two
// renders agree to about -104 dBFS peak / -125 dB RMS in the mix, not bit for bit.
// Each stem is rendered in its own OfflineAudioContext(2, 48000 * 156.5, 48000); the mix/master stage
// (auto-levelling, bus compression, true-peak limiting, loudness) runs in plain JS on the rendered buffers.
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
  // Peak headroom: the ignition stem ends in a 4x soft clipper (ceiling 1.0) and the cannon stem in a look-ahead
  // true-peak limiter; their ceilings sit under the master ceiling, so loudness at the strikes and the ignition comes
  // from density and not from peaks the master limiter would have to take back.
  cannonsDb: 0.0,
  // cannon stem limiter (JS): ceiling ceilDb, raised toward nearDb for the strike cues as d -> 0 (the closest hits
  // get the most headroom; the deeper duck keeps the master limiter out of it). Per-cue levels: approach law.
  cannonLimiter: { ceilDb: -3.5, nearDb: -2.0, lookMs: 2.0, relMs: 90 },
  ignitionDb: -0.5,
  impactDriveDb: 6.0,              // ignition impact layers (sub, crack, saw stack, walls) into the stem saturator
  synthTrimDb: -24.0,            // source trim so the per-bar auto-level works around 0 dB
  targetLufs: -15.8,
  ceilingDbtp: -1.0,
  limiterCeilingDb: -1.35,         // internal ceiling (true-peak estimate, 4x oversampled) leaves margin
  // gentle glue: threshold relative to the loudness target (applied after the master gain), 50 ms RMS detector
  comp: { thresholdRel: 6, ratio: 1.5, kneeDb: 8, attack: 0.030, release: 0.40, rms: 0.050 },
  // cannon approach law: each cue's loudness (K-weighted, 400 ms from its transient) relative to the orchestra's
  // (K-weighted, the 500 ms before it: the music the hit breaks into) follows rel(d) = far + (near - far) * (1 - d)^shape, so the approach is monotone
  // whatever the music does underneath. Measured on a first render of the stem, corrected and re-rendered. Close
  // cues are capped at nearMaxCorrDb, where the stem limiter still leaves the boom a natural decay.
  cannon: { relFar: -20, relNear: 5, shape: 1.5, maxCorrDb: 14, nearMaxCorrDb: 10, passes: 3, tolDb: 0.75 },
  // orchestra + synth duck under the five strike cannons (d <= maxD; depth grows toward d = 0): 5 ms attack,
  // 80 ms hold, then a 120 ms exponential release (within 1 dB after ~0.35 s), following the boom that masks it.
  duck: { maxD: 0.12, depthDb: [4, 10], attack: 0.005, hold: 0.08, tau: 0.12 },
  // the ladder (bars 32-38) is the cannons' section: orchestra + synth sit a static 4.5 dB lower there (ramped
  // over the 2 s before the bar-32 downbeat), so the strikes have headroom under the ceiling. The internal dynamics
  // (tremolo swells, strikes) are untouched.
  ladderRide: { db: -4.5, fromBar: 32, rampS: 2.0 },
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
export async function loadTimeline(base = '/') {
  const plan = await loadJSON(base + 'film-plan.json');
  const grid = await loadJSON(base + 'analysis/grid.json');
  const fps = evalFps(plan.fps);
  const duration = plan.frames / fps;
  const length = Math.round(SR * duration);
  const music = new Music(plan, grid);
  const cue = (id) => plan.cues.find((c) => c.id === id);
  const shot = (id) => plan.shots.find((s) => s.id === id);
  const synthPl = plan.audio.find((a) => a.generated);
  const ign = cue('ignition'), ret = cue('return-bar56');
  const S24 = shot('S24-shockfront');
  const T = {
    ignition: ign.frame / fps,
    // bar-56 downbeat in film time, through the winter-b placement (source onset from the cue)
    return56: music.sourceToFilm(ret.sourceSeconds),
    // closest approach of the Doppler source: one third into S24-shockfront (= frame 2881 per the director)
    pass: (S24.start + (S24.end - S24.start) / 3) / fps,
    synthEnd: synthPl.timelineEnd / fps,
  };
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
    const tp = music.at(63, 0), te = T.synthEnd;
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
  const rng = mulberry32(1812);
  const pans = cues.map(() => rng() * 2 - 1);
  const band = (c) => (c.distance <= 0.15 ? 'near' : c.distance <= 0.5 ? 'mid' : 'far');
  const group = { near: cues.filter((c) => band(c) === 'near'), mid: cues.filter((c) => band(c) === 'mid'), far: cues.filter((c) => band(c) === 'far') };
  const table = [];
  cues.forEach((c, ci) => {
    const d = clamp(c.distance, 0, 1);
    const { t: tcue, basis, beat } = cannonTime(c, tl);
    const tc = tcue; // no shaper on this bus: the transient is scheduled on the cue itself
    // deterministic rotation by distance band; close strikes counted back from the last strike (cannon-1 last)
    const b = band(c), gi = group[b].indexOf(c);
    const id = b === 'near' ? NEAR_SET[(group.near.length - 1 - gi) % NEAR_SET.length] : (b === 'mid' ? MID_SET : FAR_SET)[gi % (b === 'mid' ? MID_SET : FAR_SET).length];
    const corr = gains[c.id] || 0;
    const lvl = undb(-23 * Math.pow(d, 0.9) + corr);
    const dry = 1 - 0.78 * Math.pow(d, 0.8), wet = 0.10 + 0.95 * Math.pow(d, 0.8);
    const pre = 0.006 + 0.11 * d;
    const rate = 1 - 0.1 * d;
    const lpHz = 350 * Math.pow(18000 / 350, Math.pow(1 - d, 1.6));
    const pan = pans[ci] * 0.55 * d;
    const layers = [{ id, gain: 1 }];
    if (d <= 0.12) layers.push({ id: NEAR_SET[(NEAR_SET.indexOf(id) + 1) % NEAR_SET.length], gain: undb(-6) });
    const dist = BQ(ctx, 'lowpass', lpHz, 0.6);
    const p = ctx.createStereoPanner(); p.pan.value = pan;
    const gDry = G(ctx, dry * lvl), gWet = G(ctx, wet * lvl), dPre = ctx.createDelay(1); dPre.delayTime.value = pre;
    alive(dist, dPre); dist.connect(p); p.connect(gDry).connect(out); p.connect(dPre).connect(gWet).connect(verb);
    const starts = [];
    for (const L of layers) {
      const S = samples[L.id], meta = CANNON_SAMPLES[L.id];
      const start = tc - S.info.onset / rate;      // transient lands exactly on the cue time
      starts.push(start);
      const src = ctx.createBufferSource(); src.buffer = S.buffer; src.playbackRate.value = rate;
      // broadband attack, then the body closes down to a dark boom (removes the orchestral bleed in the tail);
      // close cannons keep the crack open longer
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
      node.connect(env).connect(G(ctx, L.gain * S.info.norm)).connect(dist);
      // close cannons: parallel crack layer (400 Hz high-pass, +6 dB presence at 2.5 kHz), gated to the first
      // ~35 ms, so the hit cuts through the tutti in the band the ear reads as impact
      if (d <= 0.15) {
        const on = S.info.onset / rate, gate = 0.035;
        const ag = G(ctx, 0);
        curveEnv(ag.gain, start, on + gate + 0.015, (x) => { const tau = x - on; return tau < gate ? 1 : Math.max(0, 1 - (tau - gate) / 0.012); }, 4000);
        alive(ag);
        chain(src, BQ(ctx, 'highpass', 400, 0.7), BQ(ctx, 'peaking', 2500, 0.8, 6), ag, G(ctx, (1 - d) * L.gain * S.info.norm), dist);
        // parallel saturated copy of the (notched, darkened) boom, band-limited to 90-400 Hz: its harmonics make
        // the boom read as loud without adding peak (no oversampling: zero latency against the dry boom; the band
        // feeding the shaper is low, so aliasing stays far below it)
        // input normalised to the sample's peak (WaveShaper clamps beyond +-1): a gentle tanh that only rounds the
        // boom's peaks, so the layer keeps the boom's decay
        const hs = ctx.createWaveShaper(); hs.curve = tanhCurve(2.5);
        alive(hs);
        chain(env, G(ctx, 0.9 / S.info.peak), hs, BQ(ctx, 'highpass', 90, 0.7), BQ(ctx, 'lowpass', 400, 0.7), G(ctx, 0.6 * (1 - d) * L.gain * S.info.norm * S.info.peak), dist);
      }
      src.start(start); src.stop(start + len + 0.01);
    }
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
      preDelayMs: Math.round(pre * 1000), dry: +dry.toFixed(2), wet: +wet.toFixed(2), pan: +pan.toFixed(2), thump: +thump.toFixed(2), sampleStart: +starts[0].toFixed(5) });
  });
  return table;
}

// ----------------------------------------------------------------------------------------------------------
// stem 4: ignition pressure wave + descending Doppler roar + C drone into bar 56
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

export function buildIgnition(ctx, tl) {
  const out = ctx.destination;
  const { T, a4 } = tl;
  const l4 = tl.lat ? tl.lat['4x'] : 0;
  const t = T.ignition - l4, hz = (m) => midiHz(m, a4); // scheduled early by the bus clipper's latency
  const tsh = t - l4;                                    // sub + saw stack also pass their own 4x saturator
  const clip = softClip(ctx, 0.6); clip.output.connect(out);
  // 2nd-order 20 Hz high-pass keeps DC and infrasound out of the clipper. Two feeds: `imp` (the impact layers:
  // sub, crack, saw stack, walls) is driven into the saturator for density; `bus` (Doppler roar, C drone, reverb
  // return) stays mostly below its knee.
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

  // 1) sub-bass impact (sine dive 74 -> 27 Hz) + octave harmonic, gently saturated
  const sub = ctx.createOscillator(); sub.type = 'sine';
  sub.frequency.setValueAtTime(74, tsh); sub.frequency.exponentialRampToValueAtTime(27, tsh + 2.4);
  const sub2 = ctx.createOscillator(); sub2.type = 'sine';
  sub2.frequency.setValueAtTime(148, tsh); sub2.frequency.exponentialRampToValueAtTime(54, tsh + 2.4);
  const subEnv = G(ctx, 0), sub2Env = G(ctx, 0);
  curveEnv(subEnv.gain, tsh, 8, (x) => Math.min(1, x / 0.005) * Math.exp(-x / 1.6) * (1 - smooth(7, 8, x)), 1000);
  curveEnv(sub2Env.gain, tsh, 4, (x) => Math.min(1, x / 0.004) * Math.exp(-x / 0.5) * (1 - smooth(3.5, 4, x)), 1000);
  const subSat = ctx.createWaveShaper(); subSat.curve = tanhCurve(1.8); subSat.oversample = '4x';
  alive(subEnv, sub2Env, subSat); sub.connect(subEnv).connect(subSat); sub2.connect(sub2Env).connect(G(ctx, 0.35)).connect(subSat);
  const subOut = subSat.connect(G(ctx, 0.6)); subOut.connect(imp); send(subOut, 0.06);
  // parallel, hard-saturated copy band-limited to 80-250 Hz: its odd harmonics carry the impact on small speakers
  // (same 4x shaper latency as subSat, so it is aligned by the same early start)
  const subHard = ctx.createWaveShaper(); subHard.curve = tanhCurve(7.0); subHard.oversample = '4x';
  alive(subHard);
  const hardOut = chain(subEnv, G(ctx, 1.6), subHard, BQ(ctx, 'highpass', 80, 0.7), BQ(ctx, 'lowpass', 250, 0.7), G(ctx, 0.9));
  hardOut.connect(imp); send(hardOut, 0.08);
  [sub, sub2].forEach((o) => { o.start(tsh); o.stop(tsh + 8.1); });

  // 2) crack: seeded noise burst, band-pass sweeping down
  const nz = noiseBuffer(ctx, 12, 2725, { channels: 2 });
  const crack = ctx.createBufferSource(); crack.buffer = nz;
  const cbp = BQ(ctx, 'bandpass', 2600, 0.7);
  cbp.frequency.setValueAtTime(2600, t); cbp.frequency.exponentialRampToValueAtTime(240, t + 0.3);
  const cEnv = G(ctx, 0);
  curveEnv(cEnv.gain, t, 1.0, (x) => Math.min(1, x / 0.0008) * (0.25 * Math.exp(-x / 0.012) + Math.exp(-x / 0.11)) * (1 - smooth(0.85, 1.0, x)), 4000);
  alive(cbp); const crackOut = chain(crack, cbp, cEnv, G(ctx, 1.4)); crackOut.connect(imp); send(crackOut, 0.7);
  crack.start(t); crack.stop(t + 1.05);

  // 3) detuned saw stack (C power chord tuned to A4 = a4) -> waveshaper -> sweeping resonant low-pass
  const rng = mulberry32(2725);
  const stack = G(ctx, 1);
  const stackNotes = [24, 36, 43, 48, 55, 60];
  const dive = ctx.createConstantSource(); dive.offset.value = 0;   // common pitch dive in cents
  curveEnv(dive.offset, tsh, 9, (x) => -110 * smooth(0, 6, x), 200);
  for (const m of stackNotes) for (let v = 0; v < 2; v++) {
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m);
    o.detune.value = (v ? 1 : -1) * (5 + 17 * rng());
    dive.connect(o.detune);
    o.connect(G(ctx, (m <= 36 ? 0.22 : 0.15))).connect(stack);
    o.start(tsh); o.stop(tsh + 9.2);
  }
  dive.start(tsh); dive.stop(tsh + 9.2);
  alive(stack);
  const sat = ctx.createWaveShaper(); sat.curve = tanhCurve(3.0); sat.oversample = '4x';
  const sweep = BQ(ctx, 'lowpass', 55, 12);
  sweep.frequency.setValueAtTime(55, t);   // post-saturator: bus compensation only
  sweep.frequency.exponentialRampToValueAtTime(7500, t + 0.33);   // the front opens...
  sweep.frequency.exponentialRampToValueAtTime(1200, t + 2.5);    // ...and holds bright through the blast
  sweep.frequency.exponentialRampToValueAtTime(240, t + 6);
  sweep.frequency.exponentialRampToValueAtTime(110, t + 9);
  const sweep2 = BQ(ctx, 'lowpass', 9000, 0.6);
  const stackEnv = G(ctx, 0);
  // sustain floor 0.3 for the first 2 s (the blast keeps pushing), easing to 0.12 by 3.5 s
  curveEnv(stackEnv.gain, t, 9.1, (x) => {
    const floor = 0.12 + 0.18 * (1 - smooth(2.0, 3.5, x));
    return Math.min(1, x / 0.015) * (floor + (1 - floor) * Math.exp(-x / 0.8)) * (1 - smooth(3.0, 7.0, x));
  }, 500);
  const stackOut = chain(stack, sat, sweep, sweep2, stackEnv, G(ctx, 0.9)); stackOut.connect(imp); send(stackOut, 0.55);

  // 4) noise wall: stereo pink noise, closing low-pass, plus a low pressure rumble
  const wallBuf = noiseBuffer(ctx, 12, 9001, { channels: 2, pink: true });
  const wall = ctx.createBufferSource(); wall.buffer = wallBuf;
  const wlp = BQ(ctx, 'lowpass', 12000, 0.5);
  wlp.frequency.setValueAtTime(12000, t); wlp.frequency.exponentialRampToValueAtTime(700, t + 7);
  const wEnv = G(ctx, 0);
  curveEnv(wEnv.gain, t, 9, (x) => smooth(0, 0.035, x) * (0.08 + 0.92 * Math.exp(-x / 0.7)) * (1 - smooth(3, 6, x)), 500);
  const wHp = alive(BQ(ctx, 'highpass', 45, 0.7));
  const wallOut = chain(wall, wHp, wlp, wEnv, G(ctx, 0.9)); wallOut.connect(imp); send(wallOut, 0.5);
  const rum = ctx.createBufferSource(); rum.buffer = wallBuf; // offset start for decorrelation
  const rEnv = G(ctx, 0);
  curveEnv(rEnv.gain, t, 10, (x) => smooth(0, 0.08, x) * Math.exp(-x / 2.0) * (1 - smooth(6, 9, x)), 500);
  // 25 Hz high-pass: pink noise below it is only DC drift and infrasound
  chain(rum, alive(BQ(ctx, 'highpass', 25, 0.707)), BQ(ctx, 'lowpass', 90, 0.7), BQ(ctx, 'lowpass', 90, 0.7), rEnv, G(ctx, 1.3), imp);
  // mid wall: 300 Hz-3 kHz band of the blast, sustained ~1.5 s and darkening, the part a TV speaker can play
  const mid = ctx.createBufferSource(); mid.buffer = wallBuf;
  const mLp = BQ(ctx, 'lowpass', 3000, 0.7);
  mLp.frequency.setValueAtTime(3200, t); mLp.frequency.exponentialRampToValueAtTime(1900, t + 1.5); mLp.frequency.exponentialRampToValueAtTime(800, t + 3.5);
  const mEnv = G(ctx, 0);
  curveEnv(mEnv.gain, t, 4, (x) => smooth(0, 0.012, x) * (x < 1.5 ? 0.6 + 0.4 * Math.exp(-x / 0.25) : 0.6 * Math.exp(-(x - 1.5) / 0.55)) * (1 - smooth(3.2, 4, x)), 500);
  alive(mLp);
  const midOut = chain(mid, BQ(ctx, 'highpass', 300, 0.7), mLp, mEnv, G(ctx, 2.4)); midOut.connect(imp); send(midOut, 0.45);
  wall.start(t); wall.stop(t + 9.1); rum.start(t, 3.3); rum.stop(t + 10.1); mid.start(t, 6.7); mid.stop(t + 4.05);

  // 5) descending Doppler roar -> C drone resolving into bar 56
  const dop = dopplerModel(T);
  const C2 = hz(36), C1 = hz(24);
  const f0 = C2 * (1 + 0.5);                         // receding asymptote f0/(1+M) is exactly C2
  const r0 = t + 0.5, r1 = T.return56 + 2.5, rd = r1 - r0, rate = 200;
  const rr = r0 + l4; // curves are evaluated on the audible clock (scheduled time + bus-clipper latency)
  const mPass0 = T.pass + 1.0, mPass1 = T.pass + 3.0; // settle the pitch onto C2
  const fCurve = (x) => {
    const tt = rr + x, s = dop(tt);
    const w = smooth(mPass0, mPass1, tt);
    return Math.exp(Math.log(f0 * s.k) * (1 - w) + Math.log(C2) * w);
  };
  const ret = T.return56;
  const duck = (tt) => (tt < ret ? 1 : Math.exp(-(tt - ret) / 0.4)) * (1 - smooth(ret + 1.6, ret + 2.4, tt));
  const droneShape = (tt) => (0.34 + 0.13 * smooth(ret - 2.2, ret - 0.03, tt)) * duck(tt);
  const toneLevel = (x) => {
    const tt = rr + x, s = dop(tt), w = smooth(T.pass + 0.8, T.pass + 2.6, tt);
    const roar = s.amp * Math.pow(s.k, 0.6);   // 1/r spreading x convective amplification on approach
    return smooth(rr, rr + 2.0, tt) * (roar * (1 - w) + droneShape(tt) * w);
  };
  const noiseLevel = (x) => {
    const tt = rr + x, s = dop(tt);
    return smooth(rr, rr + 2.0, tt) * Math.pow(s.amp, 1.1) * Math.pow(s.k, 0.5) * (1 - smooth(T.pass + 1.2, T.pass + 4.2, tt));
  };
  const cutCurve = (x) => {
    const tt = rr + x, s = dop(tt), w = smooth(T.pass + 0.8, T.pass + 2.6, tt);
    const roarCut = 260 + 9000 * Math.pow(s.amp, 1.3) * Math.pow(s.k, 0.5);
    const droneCut = 420 + 520 * smooth(ret - 2.2, ret - 0.03, tt);
    return roarCut * (1 - w) + droneCut * w;
  };
  const panCurve = (x) => { const tt = rr + x, s = dop(tt); return 0.9 * s.pan * (1 - smooth(T.pass + 2.0, T.pass + 4.0, tt)); };

  const fBase = ctx.createConstantSource(); curveEnv(fBase.offset, r0, rd, fCurve, rate);
  const tone = alive(G(ctx, 1));
  const cluster = [[1, -8, 'sawtooth', 0.28], [1, 8, 'sawtooth', 0.28], [2, 3, 'sawtooth', 0.16], [1.5, -4, 'sawtooth', 0.09], [0.5, 0, 'sine', 0.35]];
  for (const [mul, cents, type, g] of cluster) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = 0; o.detune.value = cents;
    fBase.connect(G(ctx, mul)).connect(o.frequency);
    o.connect(G(ctx, g)).connect(tone); o.start(r0); o.stop(r1 + 0.05);
  }
  const tSat = ctx.createWaveShaper(); tSat.curve = tanhCurve(2.0); tSat.oversample = '2x';
  const tLp = BQ(ctx, 'lowpass', 1000, 6); curveEnv(tLp.frequency, r0, rd, cutCurve, rate);
  const tG = G(ctx, 0); curveEnv(tG.gain, r0, rd, toneLevel, rate);
  const pan = ctx.createStereoPanner(); curveEnv(pan.pan, r0, rd, panCurve, rate);
  chain(tone, tSat, tLp, tG, pan);
  // noise roar: band-passes that ride the Doppler factor, plus low rumble
  const roarBuf = noiseBuffer(ctx, rd + 0.2, 2881, { channels: 2, pink: true });
  const rn = ctx.createBufferSource(); rn.buffer = roarBuf;
  const nSum = G(ctx, 1);
  for (const [fc, q, g] of [[230, 0.9, 1.0], [880, 0.7, 0.7], [2600, 0.8, 0.25]]) {
    const bp = BQ(ctx, 'bandpass', 0, q); bp.frequency.value = 0;
    fBase.connect(G(ctx, fc / f0)).connect(bp.frequency);
    alive(bp); rn.connect(bp).connect(G(ctx, g)).connect(nSum);
  }
  rn.connect(alive(BQ(ctx, 'highpass', 25, 0.707))).connect(BQ(ctx, 'lowpass', 110, 0.7)).connect(G(ctx, 1.4)).connect(nSum);
  alive(nSum);
  const nLp = BQ(ctx, 'lowpass', 1000, 0.7); curveEnv(nLp.frequency, r0, rd, (x) => 1.6 * cutCurve(x), rate);
  const nG = G(ctx, 0); curveEnv(nG.gain, r0, rd, noiseLevel, rate);
  chain(nSum, nLp, nG, pan);
  const roarOut = pan.connect(G(ctx, 0.8)); roarOut.connect(bus); send(roarOut, 0.32);
  rn.start(r0); rn.stop(r1 + 0.05); fBase.start(r0); fBase.stop(r1 + 0.05);
  // C1 sine under the drone
  const c1 = ctx.createOscillator(); c1.type = 'sine'; c1.frequency.value = C1;
  const c1G = G(ctx, 0); curveEnv(c1G.gain, r0, rd, (x) => { const tt = rr + x; return smooth(T.pass + 1.0, T.pass + 3.0, tt) * droneShape(tt) * 1.1; }, rate);
  alive(c1G); const c1Out = c1.connect(c1G); c1Out.connect(bus); send(c1Out, 0.1);
  c1.start(r0); c1.stop(r1 + 0.05);

  return {
    ignition: T.ignition, pass: T.pass, return56: ret, f0, C2, C1, mach: 0.5, passWidthSeconds: 1.25,
    doppler: [-3, -2, -1, -0.5, 0, 0.5, 1, 2, 3, 4].map((dt) => {
      const tt = T.pass + dt, s = dop(tt);
      return { t: +tt.toFixed(3), hzRaw: +(f0 * s.k).toFixed(2), hz: +fCurve(tt - rr).toFixed(2), level: +db(toneLevel(tt - rr)).toFixed(1), pan: +panCurve(tt - rr).toFixed(2) };
    }),
  };
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
function cannonCeiling(n, cannons) {
  const CL = DESIGN.cannonLimiter, maxD = DESIGN.duck.maxD, c = new Float32Array(n).fill(undb(CL.ceilDb));
  for (const k of cannons) {
    if (k.distance > maxD) continue;
    const up = (CL.nearDb - CL.ceilDb) * (1 - k.distance / maxD);
    for (let i = Math.max(0, Math.round((k.t - 0.02) * SR)); i < Math.min(n, Math.round((k.t + 1.2) * SR)); i++) {
      const x = i / SR - k.t, w = smooth(-0.02, -0.005, x) * (1 - smooth(0.8, 1.2, x));
      c[i] = Math.max(c[i], undb(CL.ceilDb + up * w));
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
export async function renderSoundtrack({ base = '/', log = console.log } = {}) {
  const t00 = performance.now();
  const tl = await loadTimeline(base);
  const { plan, length } = tl;
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
  await render('orchestra', (ctx) => buildOrchestra(ctx, tl, winter));
  await render('synth', (ctx) => buildSynth(ctx, tl));
  await render('ignition', (ctx) => buildIgnition(ctx, tl));
  const gO = undb(DESIGN.orchestraMakeupDb), gC = undb(DESIGN.cannonsDb), gI = undb(DESIGN.ignitionDb);
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

  // --- balance ---
  const duck = duckGain(length, info.cannons);
  // ladder ride (multiplied into the duck curve; both act on orchestra + synth only)
  const LR = DESIGN.ladderRide, tRide = refinedAt(tl, tl.refined, LR.fromBar, 0);
  for (let i = Math.max(0, Math.round((tRide - LR.rampS) * SR)); i < length; i++) duck[i] *= undb(LR.db * smooth(tRide - LR.rampS, tRide, i / SR));
  const orch = stems.orchestra.map((x) => { const y = new Float32Array(x.length); for (let i = 0; i < x.length; i++) y[i] = x[i] * gO * duck[i]; return y; });
  const lev = autoLevelSynth(tl, stems.orchestra.map((x) => x.map((v) => v * gO)), stems.synth, info.synth);
  const syn = stems.synth.map((x) => { const y = new Float32Array(x.length); for (let i = 0; i < x.length; i++) y[i] = x[i] * lev.gain[i] * duck[i]; return y; });
  const can = stems.cannons.map((x) => (gC === 1 ? x : x.map((v) => v * gC)));
  const ign = stems.ignition.map((x) => (gI === 1 ? x : x.map((v) => v * gI)));
  const pre = [0, 1].map((c) => { const y = new Float32Array(length); const a = orch[c], b = syn[c], d = can[c], e = ign[c]; for (let i = 0; i < length; i++) y[i] = a[i] + b[i] + d[i] + e[i]; return y; });

  // --- master: gain -> gentle bus compression -> true-peak limiter; iterate gain to the loudness target ---
  let gM = 1, comp, lim, L = 0;
  const preL = loudness(pre[0], pre[1]);
  gM = undb(DESIGN.targetLufs - preL);
  for (let it = 0; it < 4; it++) {
    const a = pre[0].map((v) => v * gM), b = pre[1].map((v) => v * gM);
    comp = compress(a, b, { ...DESIGN.comp, thresholdDb: DESIGN.targetLufs + DESIGN.comp.thresholdRel });
    lim = limit(comp.L, comp.R, DESIGN.limiterCeilingDb);
    L = loudness(lim.L, lim.R);
    log(`master pass ${it}: gain ${db(gM).toFixed(2)} dB -> ${L.toFixed(2)} LUFS (comp max ${comp.maxGrDb.toFixed(1)} dB, limiter max ${lim.maxGrDb.toFixed(1)} dB, active ${lim.activePct.toFixed(2)}%)`);
    if (Math.abs(L - DESIGN.targetLufs) < 0.1) break;
    gM *= undb(DESIGN.targetLufs - L);
  }
  // stems scaled exactly as they enter the bus (incl. master gain), so sum(stems) = mix before dynamics
  const scaled = {
    orchestra: orch.map((x) => x.map((v) => v * gM)),
    synth: syn.map((x) => x.map((v) => v * gM)),
    cannons: can.map((x) => x.map((v) => v * gM)),
    ignition: ign.map((x) => x.map((v) => v * gM)),
  };
  const stemLufs = {};
  for (const [k, v] of Object.entries(scaled)) { try { stemLufs[k] = +loudness(v[0], v[1]).toFixed(2); } catch { stemLufs[k] = null; } }
  const report = {
    durationSeconds: tl.duration, sampleRate: SR, length,
    times: tl.T, tuningA4: tl.a4, gridCheck: tl.refined.report, shaperLatencySamples: { x2: Math.round(tl.lat['2x'] * SR), x4: Math.round(tl.lat['4x'] * SR) },
    orchestra: info.orchestra, synth: { ...info.synth, steps: info.synth.steps.length, autoLevel: lev.rows.map((r) => ({ bar: r.bar, target: +r.target.toFixed(1), raw: +(r.synthK - r.orchK).toFixed(1), appliedDb: +r.appliedDb.toFixed(1) })), drone: lev.drone, pad: lev.pad },
    synthSteps: info.synth.steps,
    cannonApproach: { law: DESIGN.cannon, passMaxErrDb: cannonPasses, cues: cl.rows, limiter: { ...DESIGN.cannonLimiter, maxGrDb: +cLim.maxGrDb.toFixed(1) } }, duck: { ...DESIGN.duck, cues: info.cannons.filter((c) => c.distance <= DESIGN.duck.maxD).map((c) => c.id) },
    cannons: info.cannons, cannonSamples: Object.fromEntries(Object.entries(samples).map(([k, s]) => [k, { ...CANNON_SAMPLES[k], onsetMs: +(s.info.onset * 1000).toFixed(2), peakAtMs: +(s.info.peakAt * 1000).toFixed(1), peakDb: +db(s.info.peak).toFixed(1), boomDb: +db(s.info.boomRms).toFixed(1), matchGainDb: +db(s.info.norm).toFixed(1) }])),
    ignition: info.ignition,
    master: { targetLufs: DESIGN.targetLufs, ceilingDbtp: DESIGN.ceilingDbtp, preLufs: +preL.toFixed(2), masterGainDb: +db(gM).toFixed(2), lufs: +L.toFixed(2), compMaxGrDb: +comp.maxGrDb.toFixed(2), compMeanGrDb: +comp.meanGrDb.toFixed(2), limiterMaxGrDb: +lim.maxGrDb.toFixed(2), limiterActivePct: +lim.activePct.toFixed(3), stemLufs, orchestraMakeupDb: DESIGN.orchestraMakeupDb },
    renderSeconds: (performance.now() - t00) / 1000,
  };
  return { mix: [lim.L, lim.R], stems: scaled, report };
}
