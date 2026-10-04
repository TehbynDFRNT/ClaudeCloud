#!/usr/bin/env node
// Builds the timeline contracts from the storyboard below and the signal-derived bar grid
// (analysis/grid.json). Shot boundaries are written in musical positions; frames are derived here once.
// Three cuts share one cosmic picture and one score; they differ in what the story calls things, two
// frenzy studies and the marble figure of the statue inserts:
//   film-plan.json             DAVID & GOLIATH  (id david-916)       Michelangelo's David
//   film-plan-sol.json         SOL INVICTUS     (id sol-916)         the unconquered sun
//   film-plan-prometheus.json  PROMETHEUS       (id prometheus-916)  the fire-bringer
// All are 9:16 (1080x1920). Re-run after changing the storyboard or grid:
//   node tools/build_plan.mjs && for p in film-plan*.json; do python3 tools/validate_plan.py $p; done
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const grid = JSON.parse(fs.readFileSync(path.join(ROOT, 'analysis/grid.json'), 'utf8'));
const FPS = 24;
const OUT_DIR = process.env.PLAN_OUT || '.';     // PLAN_OUT=out/plan-test to dry-run without touching the live plans
// PLAN_VERSION=3: the director's next notes (docs/NEXT-VERSION.md): an audible build into the black with the
// explosion on the frame the eruption appears; Winter's bar-56 tutti restarts ON the explosion (louder, with
// cannon salvos); no statue after the explosion until after the Milky Way; the film ends on the statue's
// gaze and NOVA: <figure>.
// PLAN_VERSION=4: the director's notes on v3:
// - the statue: ONE shot, the whole statue piece small in the black with dead space round it (the M05 composition,
//   light from above), camera locked: no movement, no zoom. The figure only turns while it is on screen, at one slow
//   steady speed across all its inserts (its 90 degrees spread over the insert time), so every glimpse shows it
//   creeping round. M06 stays the one rare cinematic angle.
// - the ending keeps v3's order (the ink rings, the Milky Way and the new star, then the figure's stare and
//   NOVA: <figure>); the stare is longer, so the figure settles into the lens before the title.
// - David is framed closer (head and neck with room round them: up close he is more interesting), still zoomed out
//   from the old close-ups; Sol and Prometheus show the whole statue piece.
// - the explosion 15% lower, the returning music and cannons 20% higher (src/audio/score.js, DESIGN.v4).
const VERSION = +(process.env.PLAN_VERSION || '4');   // 4 is the version in progress; 3 and 2 rebuild the delivered cuts
const V3 = VERSION >= 3;
const V4 = VERSION >= 4;
const STATUE_LOCK = V4 ? { preset: 'M05', params: { drift: 0, height: 3.6 }, except: ['M06'], height: { david: 2.5, sol: 3.6, prometheus: 3.6 } } : null;
const STARE4 = { rot: 72 };   // v4 final stare: the turn settles into the lens over its first 3 s, then the title

// ---- audio placements (frames) -------------------------------------------------------------
// Recording: The United States Air Force Band, Vivaldi 'Winter' I (supplied by the director; public domain).
// The recording's own 1.70 s lead-in is the film's pre-roll (bar 1 lands at 1.70 s).
// A: bars 1-38 up to the end of the bar-38 tremolo, cut at the ignition frame.
// B: bars 56-63 (closing tutti + fermata), entering on the bar-56 downbeat.
const IGNITION = 2725;                         // film frame of the cut (source 113.5417 s, end of the tremolo)
const A = { id: 'winter-a', timelineStart: 0, timelineEnd: IGNITION, sourceInSeconds: 0 };
// The dark: at ignition the picture is swallowed whole; the pressure wave hits in blackness.
const DARK = 54;                               // 2.25 s of black before the eruption is seen
const EXPLOSION = IGNITION + DARK;             // the eruption is first seen (v3: the explosion hit and the music's return)
// v2: 11 s of electronic pressure wave and Doppler roar, Winter returns on bar 56 at 2990.
// v3: bar 56's tutti lands ON the explosion frame.
const B_START = V3 ? EXPLOSION - 1 : IGNITION + 264;
const BAR56_SRC = 166.65;                      // bar-56 downbeat onset (dominant C-major chord)
const B_SRC_IN = +(BAR56_SRC - 1 / FPS).toFixed(4);
const DECAY_END = V3 ? B_START + Math.round((193.4 - B_SRC_IN) * FPS) : 3646;   // fermata decayed below -65 dB (source ~193.4 s)
const B = { id: 'winter-b', timelineStart: B_START, timelineEnd: DECAY_END, sourceInSeconds: B_SRC_IN };
// Coda: the same event seen from Earth. The Milky Way over a dark-sky horizon; a new star appears.
const CODA = DECAY_END + 4;
const CODA_STAR = CODA + 132;                  // the new star begins to appear (5.5 s in) ...
const CODA_STAR_FULL = CODA + 168;             // ... and has fully arrived (7 s in)
const CODA_LINE1 = CODA + 192, CODA_LINE2 = CODA + 228;
const CODA_END = CODA + 336;                   // 14 s coda
const GAZE = V4 ? 192 : 156;                   // the final stare after the Milky Way, under NOVA: <figure> (v3 6.5 s; v4 8 s)
const FRAMES = V3 ? CODA_END + GAZE : CODA_END;

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
const STRIKE_SRC = { 33: 96.536, 34: 99.614, 35: 102.692, 36: 105.705, 37: 108.758 };
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
  { id: 'S21-strike5', start: strike(37), scene: 'whitedwarf', purpose: 'Strike 5 and the final tremolo: inevitability', action: 'Extreme close on the surface; light bends; the glow climbs, then the whole image is drawn inward to a single point and swallowed; nothing is left but black at the cut', framing: 'Extreme close, converging', sync: 'strike-37' },
  // ACT III — IGNITION (music cut; the screen goes dark and the pressure wave hits in blackness)
  { id: 'S22-dark', start: IGNITION, scene: 'void', purpose: 'Ignition: thermonuclear runaway, felt not seen', action: 'Black. No flash: the picture is gone and the pressure wave and the roar carry the climax. At most a dying afterimage of the point', framing: 'Black (frame opens to full 9:16 unseen)', sync: 'ignition' },
  { id: 'S22-ignition', start: EXPLOSION, scene: 'nova', purpose: 'The eruption emerges from the dark', action: 'Out of black a white-gold point swells into a seething spherical eruption, the surrounding space still black; never a full-frame white-out', framing: 'Close, centred' },
  { id: 'S23-eruption', start: V3 ? at(56, 5) : EXPLOSION + 50, scene: 'nova', purpose: 'The eruption overwhelms the system', action: 'Wide: the incandescent sphere swallows the disk and races toward the giant, whose facing hemisphere flares gold', framing: 'Wide system' },
  { id: 'S24-shockfront', start: V3 ? at(57, 3) : EXPLOSION + 106, scene: 'nova', purpose: 'The pressure wave passes us', action: 'The shock front sweeps through camera; refraction, debris streaks; peak of the Doppler roar', framing: 'Inside the wave' },
  { id: 'S25-shell', start: V3 ? at(58) : EXPLOSION + 160, scene: 'nova', purpose: 'Fracture', action: 'The decelerating shell fractures into golden filaments as the roar descends', framing: 'Medium-wide, slowing' },
  // ACT IV — AFTERMATH (bars 56-63)
  { id: 'S26-expansion', start: V3 ? at(59) : srcToFrame(BAR56_SRC), scene: 'nova', purpose: 'Expansion', action: 'The fractured golden shell, immense, expanding; Rayleigh-Taylor fingers and knots; the pair small inside', framing: 'Wide, slow pull back' },
  { id: 'S27-devastation', start: V3 ? at(60) : at(58), scene: 'redgiant', purpose: 'Devastation', action: 'Goliath scarred: facing hemisphere stripped and burning, embers drifting, envelope torn', framing: 'Medium, slow lateral drift' },
  { id: 'S28-survival', start: V3 ? at(61) : at(60), scene: 'whitedwarf', purpose: 'Survival', action: 'The tiny core endures, still blazing; the shell recedes; a thin thread of matter begins to flow again', framing: 'Medium close, steady' },
  { id: 'S29a-ring', start: at(62), scene: 'nova', purpose: 'Cosmic order', action: 'Final wide: the system inside a perfect ring of the shell', framing: 'Wide, centred, still' },
  { id: 'S29b-drawing', start: at(63), scene: 'studies', purpose: 'Understanding endures', action: 'Dissolve to an ink drawing of the same rings with the tiny centre point; mirror script: il sole nõ si move', framing: 'Flat lay, centred' },
  // CODA — the same event, seen from Earth
  ...(V3 ? [{ id: 'M16', start: CODA_END, scene: 'statue', purpose: 'The gaze: after the night sky, the figure looks straight into the lens, staring into you', action: 'Marble figure on black, the 90-degree turn complete; NOVA: <figure> beneath', framing: 'See the statue preset', params: { turn: [508, CODA - 60, 90, 0] } }] : []),
  { id: 'S31-newstar', start: CODA, scene: 'earthsky', purpose: 'Seen from Earth: a new star', action: 'The Milky Way arches up from a dark, unlit horizon (no light pollution: the galactic core, dust lanes, airglow); stillness; then, silently, a new star appears where there was none. The film ends on it', framing: 'Locked-off night sky, 9:16, horizon low, galactic core rising vertically' },
];

// ---- the three cuts -------------------------------------------------------------------------
// Same cosmic picture and score; the story names change, two frenzy studies are drawn for each myth,
// and each cut has its own marble figure for the statue inserts (M01-M16).
const CUTS = {
  david: {
    file: 'film-plan.json', id: 'david-916', title: 'David & Goliath — a nova in two voices', figure: 'david',
    names: [['GOLIATH', 'a red giant'], ['DAVID', 'a white dwarf']], endTitle: 'DAVID & GOLIATH', novaName: 'David',
    presets: { 'F29.1': 'F29.1-sling' },
    purposes: {},
  },
  sol: {
    file: 'film-plan-sol.json', id: 'sol-916', title: 'Sol Invictus — the unconquered sun', figure: 'sol',
    names: [['HIEMS', 'a red giant'], ['SOL INVICTUS', 'a white dwarf']], endTitle: 'SOL INVICTUS', novaName: 'Sol Invictus',
    presets: { 'F29.1': 'F29.1-sol', 'F30.3': 'F30.3-solstice' },
    purposes: {
      'S02-goliath': 'Introduce HIEMS: Winter, the old light swollen and dying',
      'S03-david': 'Introduce SOL INVICTUS: the unconquered sun, tiny, cold, dense',
      'S07-stream': "Winter's fire torn away",
      'S12-engulf': 'The longest night closes over the sun',
      'F29.1': 'Sol Invictus (a radiate head on a Roman coin)',
      'F30.3': 'Bruma (the winter solstice: the sun at its lowest)',
      'S21-strike5': 'The light drawn into a single point',
      'S22-dark': 'The solstice: the darkest moment, felt not seen',
      'S22-ignition': 'The unconquered sun is reborn',
      'S27-devastation': 'Winter broken',
      'S28-survival': 'The sun endures',
      'S31-newstar': 'Dies Natalis Solis Invicti: the birth of a new star',
    },
  },
  prometheus: {
    file: 'film-plan-prometheus.json', id: 'prometheus-916', title: 'Prometheus — the stolen fire', figure: 'prometheus',
    names: [['ZEUS', 'a red giant'], ['PROMETHEUS', 'a white dwarf']], endTitle: 'PROMETHEUS', novaName: 'Prometheus',
    presets: { 'F29.1': 'F29.1-eagle', 'F30.3': 'F30.3-chains' },
    purposes: {
      'S02-goliath': 'Introduce ZEUS: the fire of the gods, overwhelming mass and heat',
      'S03-david': 'Introduce PROMETHEUS: tiny, cold, dense; the thief',
      'S06-first-pull': 'Prometheus reaches for the fire',
      'S07-stream': 'The theft: fire torn from the god',
      'S10-prometheus': 'The stolen fire, carried away in a fennel stalk',
      'S11-giant-bleeds': 'The god is robbed',
      'S12-engulf': 'The stolen fire overwhelms the thief',
      'S14g-filaments': 'Prometheus bound: the blue chains tighten',
      'F29.1': 'The eagle (red-chalk wing study)',
      'F30.3': 'The chains (shackle study)',
      'S17-strike1': 'Thunderbolt 1: Zeus strikes',
      'S21-strike5': 'The last thunderbolt; the fire is drawn into a single point',
      'S22-dark': 'The fire released, felt not seen',
      'S27-devastation': 'The god scarred',
      'S28-survival': 'The Titan endures; the theft begins again',
      'S31-newstar': 'The gift reaches humankind: a new star in their sky',
    },
  },
};

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

// ---- the marble figure ----------------------------------------------------------------------
// Inserts of a single marble statue on black, cut into the film (mostly ~1 s). Across the WHOLE film the
// figure turns exactly 90 degrees: in profile at its first appearance, looking straight into the lens at
// the end (M16, under the end title). Each insert is a different cinematic angle on the same statue;
// the turn is a function of film frame, so every glimpse shows the gaze a little further round.
// An insert cuts into the shot it lands on; that shot keeps its own clock (`span`), so its motion is
// never compressed, and resumes (`·2`) if the insert falls mid-shot.
// v2: the turn completes inside the final stare under the end title (M16, before the coda).
// v3: no statue after the explosion; the turn completes in the final shot, after the Milky Way.
const GAZE_FRAME = V3 ? CODA_END + 40 : CODA - 60;
const INSERTS_ALL = [
  ['M01', at(8) - 27, at(8), 'First sight: the figure in profile, looking away; perpendicular to us'],
  ['M02', at(12) - 18, at(12), 'The profile again, closer: lips and jaw in hard light'],
  ['M03', at(16) - 18, at(16), 'Head and neck against the void, the aura behind'],
  ['M04', at(19) - 18, at(19), 'The carved eye, beginning to come round'],
  ['M05', at(22) - 27, at(22), 'Small in the black: head and shoulders, light from above'],
  ['M06', at(27) - 18, at(27), 'Brow and eye from below'],
  ['M07', at(28, 6), at(29), 'Frenzy beat: the eye'],
  ['M08', at(30, 6), at(31), 'Frenzy beat: the lips'],
  ['M09', at(31, 6), at(31, 7), 'Frenzy flash: the gaze'],
  ['M10', strike(33) - 36, strike(33), 'The held breath: a slow push on the three-quarter face'],
  ['M11', strike(35) - 18, strike(35), 'Between strikes: the face, hard light'],
  ['M12', strike(37) - 18, strike(37), 'Both eyes now, almost upon us'],
  ['M13', IGNITION + DARK + 160 - 24, IGNITION + DARK + 160, 'After the shock front: the face, still, in its aura'],   // tail of S24, clear of S23's giant contact
  ['M14', srcToFrame(BAR56_SRC) + 72, srcToFrame(BAR56_SRC) + 96, 'Expansion: the face nearly turned to us'],
  ['M15', at(60) - 24, at(60), 'Devastation gives way: the gaze a breath from direct'],
  ['M16', at(63) + 55, CODA, 'The gaze: directly into the lens, staring into you'],
];
const INSERTS = V3 ? INSERTS_ALL.filter(([, a]) => a < IGNITION) : INSERTS_ALL;
const TURN = [INSERTS[0][1], GAZE_FRAME, 90, 0];   // [from frame, to frame, from deg, to deg]
const locked = (id) => STATUE_LOCK && !STATUE_LOCK.except.includes(id);
for (const s of shots) if (s.scene === 'statue') {
  s.params = { ...s.params, turn: TURN, ...(locked(s.id) ? STATUE_LOCK.params : {}) };
  if (locked(s.id)) s.preset = STATUE_LOCK.preset;
}
{
  const out = [];
  for (const s of shots) {
    const cuts = INSERTS.filter(([, a, b]) => a < s.end && b > s.start);
    if (!cuts.length) { out.push(s); continue; }
    let cursor = s.start, part = 0;
    for (const [id, a, b, purpose] of cuts) {
      if (a > cursor) out.push({ ...s, id: part ? `${s.id}·${part + 1}` : s.id, preset: s.preset || s.id, start: cursor, end: a, span: [s.start, s.end] });
      if (a > cursor) part++;
      if (!out.some((o) => o.id === id)) out.push({ id, start: a, end: b, scene: 'statue', purpose, action: 'Marble figure on black, slowly turning its gaze toward us (see INSERTS)', framing: 'See the statue preset',
        ...(locked(id) ? { preset: STATUE_LOCK.preset, framing: 'Locked: the whole statue piece small in the black (M05 composition); only the figure turns' } : {}),
        params: { turn: TURN, ...(locked(id) ? STATUE_LOCK.params : {}) } });
      cursor = Math.max(cursor, b);
    }
    if (cursor < s.end) out.push({ ...s, id: part ? `${s.id}·${part + 1}` : s.id, preset: s.preset || s.id, start: cursor, end: s.end, span: [s.start, s.end] });
  }
  for (const o of out) if (o.span && o.span[0] === o.start && o.span[1] === o.end) delete o.span;
  shots.splice(0, shots.length, ...out.sort((x, y) => x.start - y.start));
  for (let i = 1; i < shots.length; i++) if (shots[i].start !== shots[i - 1].end) throw new Error(`gap/overlap at ${shots[i].id}`);
}
// v4: the figure turns only while it is seen, at one steady speed: 90 degrees over the inserts' frames plus the final
// stare's settle (STARE4.rot); each insert gets its own linear segment of the turn, the stare settles into 0
if (V4) {
  const st = shots.filter((s) => s.scene === 'statue').sort((a, b) => a.start - b.start);
  const last = st[st.length - 1];
  const total = st.reduce((n, s) => n + (s === last ? STARE4.rot : s.end - s.start), 0);
  const yawAt = (n) => 90 * (1 - n / total);
  let n = 0;
  for (const s of st) {
    const len = s === last ? STARE4.rot : s.end - s.start;
    s.params = { ...s.params, turn: s === last ? [s.start, s.start + len, +yawAt(n).toFixed(4), 0, 0.55] : [s.start, s.end, +yawAt(n).toFixed(4), +yawAt(n + len).toFixed(4), 1] };
    n += len;
  }
}

// ---- cues -----------------------------------------------------------------------------------
const cues = [];
for (const bar of [33, 34, 35, 36, 37]) cues.push({
  id: `strike-${bar}`, kind: 'orchestral-strike', frame: strike(bar), sourceAudioId: 'winter-a', sourceSeconds: STRIKE_SRC[bar],
  status: 'verified', confidence: 'signal', evidence: 'Onset-envelope peak within 80 ms of DP bar line; score: tutti quarter-note on the downbeat',
});
cues.push({ id: 'ignition', kind: 'edit-cut', frame: IGNITION, sourceAudioId: 'winter-a', sourceSeconds: Math.floor((IGNITION / FPS) * 1e4) / 1e4, status: 'verified', confidence: 'authored',
  evidence: 'Music cut at the end of the bar-37/38 tremolo (tremolo 110.2-113.6 s, RMS falls from 113.6 s); pressure wave starts here' });
cues.push({ id: 'return-bar56', kind: 'music-reentry', frame: srcToFrame(BAR56_SRC), sourceAudioId: 'winter-b', sourceSeconds: BAR56_SRC, status: 'candidate', confidence: 'signal',
  evidence: 'Onset peak 48 ms before the DP bar line for bar 56 (dominant C chord downbeat); not verified by listening' });
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
// No white flashes anywhere: hits punch the exposure DOWN (dips), and ignition is darkness.
const effects = [
  { type: 'fade', start: 0, end: 72, from: 1, to: 0 },
  { type: 'letterbox', frame: IGNITION, from: 0.128, to: 0.0, frames: 1 },             // opens unseen, in the dark
  { type: 'shake', start: IGNITION + DARK, end: IGNITION + DARK + 160, amp: 9, env: 'decay' },
  { type: 'fade', start: CODA - 24, end: CODA, from: 0, to: 1 },                         // the stare goes to black
  { type: 'fade', start: CODA, end: CODA + 60, from: 1, to: 0 },                         // the night fades up
  ...(V3 ? [
    { type: 'fade', start: CODA_END - 36, end: CODA_END, from: 0, to: 1 },               // the night goes to black ...
    { type: 'fade', start: CODA_END, end: CODA_END + 24, from: 1, to: 0 },               // ... the figure rises out of it
    { type: 'fade', start: FRAMES - 30, end: FRAMES, from: 0, to: 1 },                   // and the film goes out on the stare
  ] : [
    { type: 'fade', start: FRAMES - 36, end: FRAMES, from: 0, to: 1 },                   // and the film goes out
  ]),
];
[[33, 0.35], [34, 0.45], [35, 0.55], [36, 0.65], [37, 0.75]].forEach(([bar, a], i) => {
  effects.push({ type: 'dip', frame: strike(bar), amount: a, attack: 1, decay: 4 + i });
  effects.push({ type: 'shake', start: strike(bar), end: strike(bar) + 18, amp: 3 + 2 * i, env: 'decay' });
});
for (const c of cannons) if (c.distance < 0.75 && c.distance > 0.12) effects.push({ type: 'shake', start: c.frame, end: c.frame + 10, amp: 2.4 * (1 - c.distance), env: 'decay' });

cues.push({ id: 'dark-end', kind: 'edit-cut', frame: IGNITION + DARK, status: 'verified', confidence: 'authored', evidence: 'End of the dark hold: the eruption is first seen' });
if (V3) {
  cues.push({ id: 'explosion', kind: 'edit-cut', frame: EXPLOSION, status: 'verified', confidence: 'authored', evidence: 'v3: the explosion hit lands with the first frame of the eruption; Winter bar 56 tutti restarts here, louder; a build runs from the S21 implosion through the dark into this frame' });
  cues.push({ id: 'return-bar56-v3', kind: 'music-reentry', frame: srcToFrame(BAR56_SRC), sourceAudioId: 'winter-b', sourceSeconds: BAR56_SRC, status: 'candidate', confidence: 'signal', evidence: 'bar-56 downbeat placed on the explosion frame' });
  // the approaching cannons tighten their tempo: half-bar shots from bar 20, closing in
  for (let bar = 20; bar <= 31; bar++) cues.push({ id: `cannon-${bar}h`, kind: 'cannon', frame: at(bar, 4), distance: +(0.6 - (bar - 20) * 0.04).toFixed(2), status: 'verified', confidence: 'authored', evidence: 'v3: faster cannon tempo into the strikes (half-bar shots)' });
  // salvos with the returning tutti (1812-finale style): every beat of bars 56-57, every half bar of 58-59
  for (const [bar, eighths] of [[56, [0, 2, 4, 6]], [57, [0, 2, 4, 6]], [58, [0, 4]], [59, [0, 4]]]) for (const e of eighths)
    cues.push({ id: `salvo-${bar}.${e}`, kind: 'cannon-salvo', frame: at(bar, e), distance: bar < 58 ? 0.05 : 0.2, status: 'verified', confidence: 'authored', evidence: 'v3: cannon salvo with the restarted music' });
}
cues.push({ id: 'coda', kind: 'edit-cut', frame: CODA, status: 'verified', confidence: 'authored', evidence: 'Coda: the night sky seen from Earth fades up from black' });
cues.push({ id: 'coda-star', kind: 'edit-cut', frame: CODA_STAR, status: 'verified', confidence: 'authored', evidence: `The new star begins to appear; fully arrived at frame ${CODA_STAR_FULL}` });

// ---- transitions ----------------------------------------------------------------------------
const overlays = [
  { id: 'x-ring-to-drawing', type: 'dissolve', from: 'S29a-ring', to: 'S29b-drawing', start: at(63) - 18, end: at(63) + 30, purpose: 'Match dissolve: real rings become ink rings' },
];

// ---- write one plan per cut -----------------------------------------------------------------
for (const [cut, C] of Object.entries(CUTS)) {
  const text = [
    { id: 'name-giant', start: at(3) + 40, end: at(5) + 20, content: C.names[0].join('\n'), style: 'name', maxCps: 12, minFrames: 60 },
    { id: 'name-dwarf', start: at(6) + 30, end: at(8) - 33, content: C.names[1].join('\n'), style: 'name', maxCps: 12, minFrames: 60 },
    // v2: the end title sits under the figure's direct stare, before the coda
    ...(V3 ? [] : [{ id: 'end-title', start: at(63) + 70, end: CODA - 26, content: C.endTitle, style: 'title', y: 0.84, fadeIn: 24, fadeOut: 20, minFrames: 48 }]),
    // the closing line, in two breaths, over the dark ground below the horizon
    { id: 'coda-line-1', start: CODA_LINE1, end: CODA_END - 2, content: 'The birth of a new star;', style: 'line', font: 'cormorant', size: 44, y: 0.815, fadeIn: 30, fadeOut: 34, minFrames: 60 },
    { id: 'coda-line-2', start: CODA_LINE2, end: CODA_END - 2, content: 'the Nova.', style: 'line', font: 'cinzel', size: 50, y: 0.875, fadeIn: 30, fadeOut: 34, minFrames: 60 },
    // v3: the film ends on the figure's stare and its name
    // Cinzel Roman capitals (lowercase sets as small caps: NOVA: SOL INVICTUS), molten gold
    // (v4: once the stare has settled into the lens)
    ...(V3 ? [{ id: 'end-title', start: CODA_END + (V4 ? STARE4.rot + 6 : 48), end: FRAMES - 2, content: `Nova: ${C.novaName}`, style: 'title', color: 'rgba(236,204,148,1)', y: 0.865, fadeIn: 30, fadeOut: 28, minFrames: 60 }] : []),
  ];
  const cutShots = shots.map((s) => {
    const o = { ...s };
    if (C.presets[s.id]) o.preset = C.presets[s.id];
    if (C.purposes[s.id]) o.purpose = C.purposes[s.id];
    if (o.scene === 'statue') o.params = { ...o.params, figure: C.figure, ...(locked(o.id) ? { height: STATUE_LOCK.height[C.figure] } : {}) };
    return o;
  });
  const plan = {
    id: V3 ? `${C.id}-v${VERSION}` : C.id, cut, title: C.title, version: VERSION,
    fps: `${FPS}/1`, frames: FRAMES, width: 1080, height: 1920, backend: 'webgl2-canvas (headless Chromium, SwiftShader)',
    timingMode: 'original-score',
    format: { letterbox: 0.128, note: '9:16. A 3:4 window (bars top and bottom) until ignition; the frame opens to the full 9:16 in the dark' },
    defaultPost: {},
    shots: cutShots, overlays,
    audio: [
      { id: 'winter-a', path: 'media/source/winter-usaf-band.ogg', timelineStart: A.timelineStart, timelineEnd: A.timelineEnd, sourceInSeconds: A.sourceInSeconds, playbackRate: 1, fadeOutMs: 8, note: 'bars 1-38 (recording lead-in 1.70 s), cut at ignition' },
      { id: 'winter-b', path: 'media/source/winter-usaf-band.ogg', timelineStart: B.timelineStart, timelineEnd: B.timelineEnd, sourceInSeconds: B.sourceInSeconds, playbackRate: 1, fadeInMs: 12, note: 'bars 56-63 aftermath (eight bars incl. fermata)' },
      { id: 'score-synth', generated: true, timelineStart: 0, timelineEnd: FRAMES, sourceInSeconds: 0, playbackRate: 1, note: '80s synth pulse, the climax in the dark (pressure wave, Doppler roar), the night of the coda (src/audio/score.js); cannon samples processed for distance' },
    ],
    cues, effects, text,
    assets: [
      { id: 'winter', path: 'media/source/winter-usaf-band.ogg', role: 'music', origin: 'Supplied by the director (NOVA-02-Music.zip, winter-original.ogg); same performance as archive.org item TheFourSeasonsWinter (USAFB_Winter.ogg, decoded correlation 0.986) and Wikimedia Commons "Vivaldi Winter mvt 1 Allegro non molto - The USAF Concert.ogg"', rights: 'Public domain: performance by The United States Air Force Band (work of the U.S. federal government); composition public domain', sha256: 'fd3e3200c1342e4da55222d6004ffb74ae3ac851c516acf3160d7c79041c206e' },
      ...[1, 2, 3, 4, 5, 6].map((k) => ({ id: `cannon-${k}`, path: `media/sfx/cannon-${k}.wav`, role: 'sfx', origin: 'Supplied by the director (NOVA-02-Music.zip); 1.65 s excerpts of media/source/1812-us-army-band-2005.ogg, source times in media/sfx/cannon-provenance.json', rights: 'Public domain: Tchaikovsky 1812 Overture performed by The United States Army Band (2005), work of the U.S. federal government' })),
      { id: 'cannon-source', path: 'media/source/1812-us-army-band-2005.ogg', role: 'sfx-source', origin: 'Supplied by the director (NOVA-02-Music.zip)', rights: 'Public domain (U.S. Army Band performance; composition public domain)', sha256: 'abdc5a4b0054fd3d535503d738757fd72d88fc5af9c5807a42b64c6aa75f02c5' },
      { id: 'font-cinzel', path: 'src/fonts/Cinzel-normal.woff2', role: 'font', origin: 'Google Fonts', rights: 'SIL OFL 1.1 (src/fonts/OFL-Cinzel.txt)' },
      { id: 'font-cormorant', path: 'src/fonts/CormorantGaramond-italic.woff2', role: 'font', origin: 'Google Fonts', rights: 'SIL OFL 1.1 (src/fonts/OFL-CormorantGaramond.txt)' },
      { id: 'font-imfell', path: 'src/fonts/IMFellEnglish-italic.woff2', role: 'font', origin: 'Google Fonts', rights: 'SIL OFL 1.1 (src/fonts/OFL-IMFellEnglish.txt)' },
    ],
    checks: { audioRequired: true, videoCodec: 'h264', pixelFormat: 'yuv420p' },
  };
  fs.mkdirSync(path.join(ROOT, OUT_DIR), { recursive: true });
  fs.writeFileSync(path.join(ROOT, OUT_DIR, C.file), JSON.stringify(plan, null, 1) + '\n');
  console.log(`wrote ${C.file} (${cut}): ${cutShots.length} shots, ${cues.length} cues, ${FRAMES} frames (${(FRAMES / FPS).toFixed(2)} s)`);
}
for (const s of shots) console.log(`${s.id.padEnd(18)} ${String(s.start).padStart(5)}-${String(s.end).padEnd(5)} ${((s.end - s.start) / FPS).toFixed(2).padStart(6)}s  ${s.scene}`);
