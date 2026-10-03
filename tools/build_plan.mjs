#!/usr/bin/env node
// Builds film-plan.json (the single timeline contract) from the storyboard below and the
// signal-derived bar grid (analysis/grid.json). Shot boundaries are written in musical
// positions; frames are derived here once. Re-run after changing the storyboard or grid:
//   node tools/build_plan.mjs && python3 tools/validate_plan.py film-plan.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const grid = JSON.parse(fs.readFileSync(path.join(ROOT, 'analysis/grid.json'), 'utf8'));
const FPS = 24;
const FRAMES = 4272;

// ---- audio placements (frames) -------------------------------------------------------------
// A: bars 1-38 up to the end of the bar-38 tremolo, cut at the ignition frame.
// B: bars 56-63 (closing tutti + fermata), entering on the bar-56 downbeat.
const IGNITION = 3134;                         // film frame of the cut (source 129.5833 s)
const A = { id: 'winter-a', timelineStart: 24, timelineEnd: IGNITION, sourceInSeconds: 0 };
const B_START = 3398;                          // ignition + 264 frames (11 s) of electronic pressure wave
const B = { id: 'winter-b', timelineStart: B_START, timelineEnd: 4194, sourceInSeconds: 189.35 };

function srcToFrame(s) {
  for (const p of [A, B]) {
    const t = p.timelineStart / FPS + (s - p.sourceInSeconds);
    if (t * FPS >= p.timelineStart - 1e-6 && t * FPS < p.timelineEnd + 1e-6) return Math.round(t * FPS);
  }
  throw new Error(`source ${s}s not placed in film`);
}
// frame of bar (1-based) + eighth (0..7, fractional ok)
function at(bar, eighth = 0) {
  const b = grid.bars[bar - 1];
  const k = Math.floor(eighth), fr = eighth - k;
  const next = k + 1 < 8 ? b.eighths[k + 1] : (grid.bars[bar] ? grid.bars[bar].eighths[0] : b.end);
  return srcToFrame(b.eighths[k] + (next - b.eighths[k]) * fr);
}
// Strike onsets (tutti quarter-note hits on the downbeats of bars 33-37), strongest onset-envelope
// peak within +-80 ms of the DP bar line (see analysis notes in README).
const STRIKE_SRC = { 33: 110.200, 34: 113.764, 35: 117.310, 36: 120.824, 37: 124.382 };
const strike = (bar) => srcToFrame(STRIKE_SRC[bar]);

// ---- storyboard ----------------------------------------------------------------------------
// start: frame (number) or musical position; each shot runs until the next shot's start.
// scene: module in src/scenes; params come from that module's `presets[shotId]`.
const SB = [
  // ACT I — ATTRACTION (bars 1-11: the trembling ritornello builds voice by voice)
  { id: 'S01-abyss', start: 0, scene: 'redgiant', purpose: 'Open in the abyss; something immense is near', action: 'From black, faint stars; a crimson limb rises from the bottom of frame, plumes lifting; slow upward drift as the basses begin', framing: 'Extreme close to the giant\'s horizon, wide lens, horizon low in frame' },
  { id: 'S02-goliath', start: at(3), scene: 'redgiant', purpose: 'Introduce GOLIATH: overwhelming mass and heat', action: 'Pull back to reveal the boiling red giant, convection cells the size of suns, prominences at the limb; slow rotation', framing: 'Three-quarter disk, off-centre left, fills 80% of frame height' },
  { id: 'S03-david', start: at(6), scene: 'whitedwarf', purpose: 'Introduce DAVID: tiny, cold, dense', action: 'A single piercing blue-white point in black; slow push reveals an Earth-sized sphere, smooth and ferocious, faint blue magnetic filaments', framing: 'Starts as a point at frame centre-right; ends medium close' },
  { id: 'S04-scale', start: at(8), scene: 'binary', purpose: 'Scale and attraction: the giant leans toward the dwarf', action: 'Wide system view; the giant swollen into a teardrop toward a tiny bright speck; ice-blue scientific lines draw on: orbit, Roche figure-eight, L1', framing: 'Giant left third (huge), dwarf right, orbital plane slightly below eye line' },
  { id: 'S05-codex', start: at(10), scene: 'studies', purpose: 'Humanity\'s impulse to understand (Leonardo)', action: 'Match cut: the same figure-eight drawn in iron-gall ink on parchment with mirror-script notes, the pen line completing', framing: 'Flat lay of a notebook page, slight drift' },
  { id: 'S06-first-pull', start: at(11), scene: 'binary', purpose: 'Attraction becomes force', action: 'Close on the giant\'s L1 tip: the surface lifts into a tongue of plasma stretching toward the off-screen dwarf whose light rakes it blue-white', framing: 'Low angle along the stretching tongue' },
  // ACT II-A — RESISTANCE (bars 12-19, solo: "Al severo spirar d'orrido vento")
  { id: 'S07-stream', start: at(12), scene: 'binary', purpose: 'Vast sheets of incandescent matter rip from the giant', action: 'A river of fire pours through L1 and arcs across space toward the dwarf; camera tracks alongside the stream', framing: 'Medium-wide, stream crossing frame left to right' },
  { id: 'S08-parabola', start: at(14, 4), scene: 'binary', purpose: 'Orbital parabolas: the stolen matter falls', action: 'Ride with a clump along its ballistic arc as Coriolis bends it around the dwarf; a gold dashed trajectory with tick marks draws ahead of it', framing: 'Chase camera above the orbital plane' },
  { id: 'S09-hotspot', start: at(16), scene: 'vortex', purpose: 'Resistance: impact and sparks', action: 'Where the stream slams the forming disk: shock, sparks, turbulent plasma; blue magnetic filaments channel matter', framing: 'Close, grazing the disk rim' },
  { id: 'S10-prometheus', start: at(18), scene: 'studies', purpose: 'Prometheus\'s stolen fire (restrained glimpse)', action: 'Red-chalk study: a hand carrying a flame in a fennel stalk; a faint arc links a large circle to a small one', framing: 'Close on the drawing, the flame catching warm light' },
  { id: 'S11-giant-bleeds', start: at(19), scene: 'binary', purpose: 'Goliath bleeds', action: 'The giant\'s torn L1 tip pouring matter into space', framing: 'Medium close on the tip, stream leaving frame right' },
  // ACT II-B — COMPRESSION (bars 20-26: tutti repeated F, then "Correre e batter li piedi")
  { id: 'S12-engulf', start: at(20), scene: 'vortex', purpose: 'Gravitational terror: the vortex engulfs the dwarf', action: 'Camera sinks into the disk plane; crimson and gold spirals rush past on both sides; the dwarf blazes at the centre, swallowed', framing: 'Wide-angle inside the vortex, dwarf centre frame' },
  { id: 'S13-atoms', start: at(22), scene: 'atoms', purpose: 'Tactile atomic intensity', action: 'Hydrogen nuclei rain onto a compressed layer, jittering, glowing, pressing together', framing: 'Macro, shallow depth of field' },
  { id: 'S14a-ocean', start: at(23), scene: 'whitedwarf', purpose: 'Compression: the hydrogen layer piles up', action: 'The dwarf surface under a thickening glowing ocean of accreted gas', framing: 'Close, horizon of the dwarf' },
  { id: 'S14b-boil', start: at(23, 4), scene: 'plasma', purpose: 'Boiling plasma', action: 'Gold-crimson plasma convulsing', framing: 'Macro' },
  { id: 'S14c-mass-loss', start: at(24), scene: 'binary', purpose: 'The giant is drained', action: 'Wide: the giant visibly feeding the disk', framing: 'Wide, high angle' },
  { id: 'S14d-deluge', start: at(24, 4), scene: 'studies', purpose: 'Leonardo\'s water vortex rhymes with the disk', action: 'Ink study of a swirling deluge vortex drawing itself', framing: 'Close on the drawing' },
  { id: 'S14e-spiral', start: at(25), scene: 'vortex', purpose: 'The real vortex answers the drawing', action: 'Top-down accretion spiral, same rotation as the ink', framing: 'Top-down, disk fills frame' },
  { id: 'S14f-cno', start: at(25, 4), scene: 'atoms', purpose: 'The fuel cycle', action: 'Glowing nuclei arranged in the CNO cycle, protons striking carbon', framing: 'Medium, symmetric' },
  { id: 'S14g-filaments', start: at(26), scene: 'plasma', purpose: 'Cold blue magnetism tightening', action: 'Blue filaments twisting and tightening around a hot core', framing: 'Macro' },
  { id: 'S14h-flare', start: at(26, 4), scene: 'whitedwarf', purpose: 'First flickers', action: 'The surface brightens; small flares flicker', framing: 'Close' },
  // ACT II-C — FRENZY (bars 27-31: solo 32nd-note runs; cuts on beats, then half-beats)
  ...frenzy(),
  // ACT II-D — THE LADDER (bars 32-38: strikes on each downbeat, tremolo, ignition)
  { id: 'S16-ladder', start: at(32), scene: 'vortex', purpose: 'Held breath before the strikes', action: 'The vortex from above spins faster; the dwarf brightens; silence in the tutti, then tremolo', framing: 'Top-down, slow push' },
  { id: 'S17-strike1', start: strike(33), scene: 'binary', purpose: 'Strike 1: the whole system shudders', action: 'Hard cut on the strike: wide system, disk flares, stream whips', framing: 'Wide', sync: 'strike-33' },
  { id: 'S18-strike2', start: strike(34), scene: 'vortex', purpose: 'Strike 2: closer', action: 'Inner disk white-hot around the engulfed dwarf', framing: 'Medium', sync: 'strike-34' },
  { id: 'S19-strike3', start: strike(35), scene: 'whitedwarf', purpose: 'Strike 3: the surface convulses', action: 'Dwarf surface layer glowing, blue filaments snapping', framing: 'Close', sync: 'strike-35' },
  { id: 'S20-strike4', start: strike(36), scene: 'atoms', purpose: 'Strike 4: the nuclei are crushed', action: 'Nuclei crushed together; fusion sparks multiplying', framing: 'Macro', sync: 'strike-36' },
  { id: 'S21-strike5', start: strike(37), scene: 'whitedwarf', purpose: 'Strike 5 and the final tremolo: inevitability', action: 'Extreme close on the surface; light bends; brightness climbs toward white; the image draws inward to a point', framing: 'Extreme close, converging', sync: 'strike-37' },
  // ACT III — IGNITION (music cut; electronic pressure wave and Doppler roar)
  { id: 'S22-ignition', start: IGNITION, scene: 'nova', purpose: 'Ignition: thermonuclear runaway', action: 'White-out; frame opens to full height; a white-hot spherical eruption fills the frame from the dwarf', framing: 'Close, centred', sync: 'ignition' },
  { id: 'S23-eruption', start: IGNITION + 44, scene: 'nova', purpose: 'The eruption overwhelms the system', action: 'Wide: the white sphere swallows the disk and races toward the giant, whose facing hemisphere flares white-gold', framing: 'Wide system' },
  { id: 'S24-shockfront', start: IGNITION + 136, scene: 'nova', purpose: 'The pressure wave passes us', action: 'The shock front sweeps through camera; refraction, debris streaks; peak of the Doppler roar', framing: 'Inside the wave' },
  { id: 'S25-shell', start: IGNITION + 196, scene: 'nova', purpose: 'Fracture', action: 'The decelerating shell fractures into golden filaments as the roar descends', framing: 'Medium-wide, slowing' },
  // ACT IV — AFTERMATH (bars 56-63)
  { id: 'S26-expansion', start: at(56), scene: 'nova', purpose: 'Expansion', action: 'The fractured golden shell, immense, expanding; Rayleigh-Taylor fingers and knots; the pair small inside', framing: 'Wide, slow pull back' },
  { id: 'S27-devastation', start: at(58), scene: 'redgiant', purpose: 'Devastation', action: 'Goliath scarred: facing hemisphere stripped and burning, embers drifting, envelope torn', framing: 'Medium, slow lateral drift' },
  { id: 'S28-survival', start: at(60), scene: 'whitedwarf', purpose: 'Survival', action: 'The tiny core endures, still blazing; the shell recedes; a thin thread of matter begins to flow again', framing: 'Medium close, steady' },
  { id: 'S29a-ring', start: at(62), scene: 'nova', purpose: 'Cosmic order', action: 'Final wide: the system inside a perfect ring of the shell', framing: 'Wide, centred, still' },
  { id: 'S29b-drawing', start: at(63), scene: 'studies', purpose: 'Understanding endures', action: 'Dissolve to an ink drawing of the same rings with the tiny centre point; mirror script: il sole nõ si move', framing: 'Flat lay, centred' },
  { id: 'S30-credits', start: 4158, scene: 'studies', purpose: 'Credits', action: 'Black; brief credit lines', framing: 'Black' },
];

function frenzy() {
  const out = [];
  const plan = {
    27: ['binary', 'plasma', 'studies', 'vortex'],
    28: ['atoms', 'redgiant', 'plasma', 'whitedwarf'],
    29: ['studies', 'vortex', 'plasma', 'binary'],
    30: ['atoms', 'plasma', 'studies', 'whitedwarf'],
    31: ['vortex', 'plasma', 'atoms', 'studies', 'plasma', 'plasma', 'whitedwarf', 'atoms'],
  };
  for (const [bar, scenes] of Object.entries(plan)) {
    const n = scenes.length;
    scenes.forEach((scene, i) => {
      const e = (8 / n) * i;
      out.push({
        id: `F${bar}.${i + 1}`, start: at(+bar, e), scene,
        purpose: 'Frenzy of perspectives', action: `Beat-cut ${i + 1}/${n} of bar ${bar}; see the scene preset`, framing: 'Varied',
      });
    });
  }
  return out;
}

// ---- resolve starts into half-open intervals ------------------------------------------------
SB.sort((a, b) => a.start - b.start);
const shots = SB.map((s, i) => {
  const end = i + 1 < SB.length ? SB[i + 1].start : FRAMES;
  const { sync, ...rest } = s;
  const shot = { ...rest, start: s.start, end };
  if (sync) shot.sync = { cueId: sync, point: 'start', offsetFrames: 0, toleranceFrames: 0 };
  return shot;
});
for (const s of shots) if (s.end <= s.start) throw new Error(`empty shot ${s.id} ${s.start}-${s.end}`);

// ---- cues -----------------------------------------------------------------------------------
const cues = [];
for (const bar of [33, 34, 35, 36, 37]) cues.push({
  id: `strike-${bar}`, kind: 'orchestral-strike', frame: strike(bar), sourceAudioId: 'winter-a', sourceSeconds: STRIKE_SRC[bar],
  status: 'verified', confidence: 'signal', evidence: 'Onset-envelope peak within 80 ms of DP bar line; score: tutti quarter-note on the downbeat',
});
cues.push({ id: 'ignition', kind: 'edit-cut', frame: IGNITION, sourceAudioId: 'winter-a', sourceSeconds: 129.5833, status: 'verified', confidence: 'authored',
  evidence: 'Music cut at the end of the bar-38 tremolo (RMS falls from 129.6 s into the caesura); pressure wave starts here' });
cues.push({ id: 'return-bar56', kind: 'music-reentry', frame: at(56), sourceAudioId: 'winter-b', sourceSeconds: grid.bars[55].start, status: 'candidate', confidence: 'signal',
  evidence: 'DP bar line for bar 56 (dominant C chord downbeat); not verified by listening' });
for (const bar of [1, 3, 6, 8, 10, 11, 12, 16, 20, 23, 27, 32, 58, 60, 62, 63]) cues.push({
  id: `bar-${bar}`, kind: 'bar-line', frame: at(bar), sourceAudioId: bar < 56 ? 'winter-a' : 'winter-b', sourceSeconds: grid.bars[bar - 1].eighths[0],
  status: 'candidate', confidence: 'signal', evidence: 'DP bar-line fit on onset evidence (analysis/grid.json)',
});
// Cannon strikes: approaching from far (1) to point blank (0). Picture reacts with micro-shake.
const cannonBars = [[5, 1.0], [7, 0.95], [9, 0.9], [11, 0.85], [12, 0.8], [16, 0.72], [18, 0.66], [20, 0.58], [21, 0.54], [22, 0.5], [23, 0.46], [24, 0.42], [25, 0.38], [26, 0.34], [27, 0.3], [28, 0.27], [29, 0.24], [30, 0.21], [31, 0.18], [32, 0.15]];
const cannons = cannonBars.map(([bar, d]) => ({ id: `cannon-${bar}`, kind: 'cannon', frame: at(bar), distance: d, status: 'verified', confidence: 'authored', evidence: 'Synthetic SFX scheduled on this bar line' }));
[[33, 0.12], [34, 0.09], [35, 0.06], [36, 0.03], [37, 0.0]].forEach(([bar, d]) => cannons.push({ id: `cannon-${bar}`, kind: 'cannon', frame: strike(bar), distance: d, status: 'verified', confidence: 'authored', evidence: 'Synthetic SFX on the orchestral strike' }));
cues.push(...cannons);

// ---- effects --------------------------------------------------------------------------------
const effects = [
  { type: 'fade', start: 0, end: 72, from: 1, to: 0 },
  { type: 'letterbox', frame: IGNITION, from: 0.128, to: 0.0, frames: 8 },
  { type: 'flash', frame: IGNITION, amount: 30, decay: 9 },
  { type: 'shake', start: IGNITION, end: IGNITION + 200, amp: 9, env: 'decay' },
  { type: 'fade', start: 4128, end: 4158, from: 0, to: 1 },
  { type: 'fade', start: 4158, end: FRAMES, from: 1, to: 1 },
];
[[33, 0.5], [34, 0.8], [35, 1.1], [36, 1.5], [37, 2.2]].forEach(([bar, a], i) => {
  effects.push({ type: 'flash', frame: strike(bar), amount: a, decay: 4 + i });
  effects.push({ type: 'shake', start: strike(bar), end: strike(bar) + 18, amp: 3 + 2 * i, env: 'decay' });
});
for (const c of cannons) if (c.distance < 0.75 && c.distance > 0.12) effects.push({ type: 'shake', start: c.frame, end: c.frame + 10, amp: 2.4 * (1 - c.distance), env: 'decay' });

// ---- text -----------------------------------------------------------------------------------
const text = [
  { id: 'name-goliath', start: at(3) + 40, end: at(5) + 20, content: 'GOLIATH\na red giant', style: 'name', maxCps: 12, minFrames: 60 },
  { id: 'name-david', start: at(6) + 30, end: at(8) - 6, content: 'DAVID\na white dwarf', style: 'name', x: 0.075, maxCps: 12, minFrames: 60 },
  { id: 'end-title', start: at(63) + 24, end: 4128, content: 'DAVID & GOLIATH', style: 'title', y: 0.86, fadeIn: 24, fadeOut: 20, minFrames: 48 },
  { id: 'credit', start: 4170, end: FRAMES - 8, content: 'MUSIC\nAntonio Vivaldi, L’inverno, I. Allegro non molto\nconducted by Philip Milman · Lud and Schlatt’s Musical Emporium · CC BY 3.0', style: 'credit', fadeIn: 16, fadeOut: 16, minFrames: 72 },
];

// ---- transitions ----------------------------------------------------------------------------
const overlays = [
  { id: 'x-ring-to-drawing', type: 'dissolve', from: 'S29a-ring', to: 'S29b-drawing', start: at(63) - 18, end: at(63) + 30, purpose: 'Match dissolve: real rings become ink rings' },
];

const plan = {
  title: 'David & Goliath — a nova in two voices',
  fps: `${FPS}/1`, frames: FRAMES, width: 1920, height: 1080, backend: 'webgl2-canvas (headless Chromium, SwiftShader)',
  timingMode: 'original-score',
  format: { letterbox: 0.128, note: '2.39:1 scope until ignition, then full 16:9 (IMAX-style expansion)' },
  defaultPost: {},
  shots, overlays,
  audio: [
    { id: 'winter-a', path: 'media/source/winter-mvt1-milman.flac', timelineStart: A.timelineStart, timelineEnd: A.timelineEnd, sourceInSeconds: A.sourceInSeconds, playbackRate: 1, fadeOutMs: 8, note: 'bars 1-38, cut at ignition' },
    { id: 'winter-b', path: 'media/source/winter-mvt1-milman.flac', timelineStart: B.timelineStart, timelineEnd: B.timelineEnd, sourceInSeconds: B.sourceInSeconds, playbackRate: 1, fadeInMs: 12, note: 'bars 56-63 aftermath (eight bars incl. fermata)' },
    { id: 'score-synth', generated: true, timelineStart: 0, timelineEnd: B.timelineEnd, sourceInSeconds: 0, playbackRate: 1, note: '80s synth pulse, cannons, pressure wave, Doppler roar (src/audio/score.js)' },
  ],
  cues, effects, text,
  assets: [
    { id: 'winter', path: 'media/source/winter-mvt1-milman.flac', role: 'music', origin: 'https://archive.org/details/lud-and-schlatts-musical-emporium (PMM-Vivaldi-Winter-MASTER_V1.flac); also Wikimedia Commons', rights: 'CC BY 3.0 — Vivaldi (public domain composition), conducted by Philip Milman, Lud and Schlatt’s Musical Emporium', sha256: '23ac2a6e955dad40c36d3ed0e911f9ac05ae037d7086db2de276507573209a03' },
    { id: 'font-cinzel', path: 'src/fonts/Cinzel-normal.woff2', role: 'font', origin: 'Google Fonts', rights: 'SIL OFL 1.1 (src/fonts/OFL-Cinzel.txt)' },
    { id: 'font-cormorant', path: 'src/fonts/CormorantGaramond-italic.woff2', role: 'font', origin: 'Google Fonts', rights: 'SIL OFL 1.1 (src/fonts/OFL-CormorantGaramond.txt)' },
    { id: 'font-imfell', path: 'src/fonts/IMFellEnglish-italic.woff2', role: 'font', origin: 'Google Fonts', rights: 'SIL OFL 1.1 (src/fonts/OFL-IMFellEnglish.txt)' },
  ],
  checks: { audioRequired: true, videoCodec: 'h264', pixelFormat: 'yuv420p' },
};

fs.writeFileSync(path.join(ROOT, 'film-plan.json'), JSON.stringify(plan, null, 1) + '\n');
console.log(`wrote film-plan.json: ${shots.length} shots, ${cues.length} cues, ${FRAMES} frames (${(FRAMES / FPS).toFixed(2)} s)`);
for (const s of shots) console.log(`${s.id.padEnd(18)} ${String(s.start).padStart(5)}-${String(s.end).padEnd(5)} ${((s.end - s.start) / FPS).toFixed(2).padStart(6)}s  ${s.scene}`);
