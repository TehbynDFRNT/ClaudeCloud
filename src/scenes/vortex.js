// VORTEX: the close-in accretion vortex around the white dwarf.
// Two passes: (1) volume at a per-shot scale (soft turbulent gas, S09 stream/shock/plume); its alpha packs the hit
// class (sign), the final transmittance (16 levels, for stars) and the transmittance up to the dwarf (for the dwarf,
// its glow and the curtains); (2) full-resolution composite: hit-aware upsample of the volume, crisp star field,
// magnetic accretion curtains and the dwarf.
// params (per preset):
//   cam: camera keys (lib/util.js) with key times in NORMALISED shot time 0..1, drift: [amp, speed], vol: volume scale
//   tau: [tau0, rate, accel]  disk time = tau0 + rate*local + accel*local^2 (flow motion blur follows the rate)
//   disk: overrides of the disk uniforms (omega, rin, rout, h0, flare, dens, ...)
//   heat: [base, flareAmp, flareDecay, pulseAmp]  temperature multiplier envelope; heatRamp: [from, to] over the shot
//   flare: [amp, decay, pulseAmp] inner-disk heating (strike flash + decay + music-eighth pulses)
//   lum: dwarf luminosity envelope [base, end] (lerp over the shot), post: post overrides
import { frag, STARS } from '../engine/glsl.js';
import { DWARF } from './lib/dwarf.glsl.js';
import { VORTEX, VXMAG } from './lib/vortex-disk.glsl.js';
import { camFromKeys, drift, camera, v3 } from './lib/util.js';
import { clamp, lerp, smoothstep } from '../engine/math.js';
import { sparks, debris } from './lib/vortex-fx.js';

const VOL = frag(DWARF, VORTEX, `
uniform float uJitAmp;
void main(){
  vec2 uv = frameUV();
  vec3 rd = cameraRay(uv);
  vec3 ro = uCamPos;
  float pixAngle = 2.0 * uTanHalfFov / uRes.y;
  float jit = mix(0.5, vxJit(gl_FragCoord.xy), uJitAmp);
  vec2 hd = sphereHit(ro, rd, uDwarfPos, uDwarfR);
  bool hitD = hd.x < hd.y && hd.y > 0.0;
  float tMax = hitD ? max(hd.x, 0.0) : 60.0;
  float tD = hitD ? tMax : length(uDwarfPos - ro);
  float trans, transD;
  vec3 col = vxMarch(ro, rd, tMax, jit, pixAngle, tD, trans, transD);
  transD = clamp(transD, 0.0, 1.0);
  float a = hitD ? -(1.0 + transD * 0.96) : 1.0 + floor(trans * 15.0 + 0.5) + transD * 0.96;
  fragColor = vec4(col, a);
}`);

const COMP = frag(STARS, DWARF, VXMAG, `
uniform sampler2D uVol;
uniform float uStarGain;
void main(){
  vec2 uv = frameUV();
  vec3 rd = cameraRay(uv);
  vec3 ro = uCamPos;
  vec2 hd = sphereHit(ro, rd, uDwarfPos, uDwarfR);
  bool hit = hd.x < hd.y && hd.y > 0.0;
  // hit-aware bilinear upsample of the packed reduced-resolution volume
  vec2 vr = vec2(textureSize(uVol, 0));
  vec2 pv = gl_FragCoord.xy / uRes * vr - 0.5;
  vec2 fl = floor(pv); vec2 f = pv - fl;
  ivec2 i0 = ivec2(fl);
  vec3 rgb = vec3(0.0); float tr = 0.0, trD = 0.0, ws = 0.0;
  for (int j = 0; j < 2; j++) for (int i = 0; i < 2; i++){
    ivec2 q = clamp(i0 + ivec2(i, j), ivec2(0), ivec2(vr) - 1);
    vec4 s = texelFetch(uVol, q, 0);
    bool sh = s.a < 0.0;
    float A = abs(s.a) - 1.0;
    float qa = floor(A + 0.002);
    float w = (i == 0 ? 1.0 - f.x : f.x) * (j == 0 ? 1.0 - f.y : f.y) + 1e-4;
    w *= (sh == hit) ? 1.0 : 0.003;
    rgb += s.rgb * w; tr += (sh ? 0.0 : qa / 15.0) * w; trD += clamp((A - qa) / 0.96, 0.0, 1.0) * w; ws += w;
  }
  rgb /= ws; tr /= ws; trD /= ws;
  float pixAngle = 2.0 * uTanHalfFov / uRes.y;
  // stars only through genuinely clear gas (no stars glinting through optically thick glowing matter)
  vec3 col = rgb + starField(rd, pixAngle) * uStarGain * smoothstep(0.62, 0.98, tr);
  if (uCurtain > 0.0) col += vxCurtain(ro, rd, hit ? hd.x : 1e9, vmJit(gl_FragCoord.xy)) * trD;
  if (hit) col += vxDwarfSurface(ro, rd, hd) * trD;
  col += vxDwarfGlow(ro, rd, 2.0 * uTanHalfFov / uFull.y) * trD;
  fragColor = vec4(col, 1.0);
}`);

// ---------------------------------------------------------------- defaults
const DISK = {
  omega: 0.22, cycle: 2.4, rin: 0.075, rout: 1.0, h0: 0.075, flare: 1.18, rimPuff: 1.2,
  dens: 7.0, densExp: 1.8, tout: 1300, tinK: 0.6, turb: 0.55, arms: 0.55, armM: 2, armPitch: 0.36, armSpeed: 0.05, armSharp: 3.0,
  curtain: 1.0, curtainSpin: 2.0, curtainPhi: 0.6, dwarfR: 0.014, dwarfSurf: 1.0, glowK: 1.0,
  hot: 0, hotPhi: 2.2, streamDir: [0.6, 0, 0.8], streamW: 0.02, shockK: 1.0, streamK: 1.0,
  rb: 1.25, lod: 0.004, stepK: 0.55, edgeFade: 0.3, grain3: 1.0, starGain: 0.3, irr: 4, armFloor: 0.12, armHeat: 0.35,
  void: -0.37, voidW: 0.25, puff: 1.0, cloud: 0, floor: 0.22, sheet: 1.0, sheetHeat: 0.45, coldGas: 0.42, sheetW: 0.04, maxSteps: 44, sheetMask: -1,
  floorMid: 0.6, kr: 6.0, ky: 10.0,
};

const P0 = {
  disk: {},
  vol: 0.6, tau: [0, 1, 0], heat: [1, 0, 0.5, 0], flare: [0, 0.5, 0], lum: [1, 1], drift: [0, 0], smearK: 1, clear: 0,
  post: { bloomStrength: 0.07, streakStrength: 0.004 },
};

// A `portrait` block (9:16 renders only; engine/film.js merges it SHALLOWLY over the preset) may override nested
// objects partially: its disk / post / sparks are completed here from the preset's own, so a portrait override
// like { disk: { h0: 0.06 } } keeps the rest of the preset's disk.
const D = (o) => {
  const out = { ...P0, ...o, disk: { ...DISK, ...(o.disk || {}) }, post: { ...P0.post, ...(o.post || {}) } };
  if (o.portrait) {
    const p = { ...o.portrait };
    for (const k of ['disk', 'post', 'sparks']) if (p[k]) p[k] = { ...(out[k] || {}), ...p[k] };
    out.portrait = p;
  }
  return out;
};

// low skim along the CCW orbit at azimuth phi, radius r, height y; the view turns `inward` (rad) from the orbital
// tangent toward the dwarf and pitches `down` (rad). Returns [pos, target].
function skim(phi, r, y, inward, down) {
  const pos = [r * Math.cos(phi), y, -r * Math.sin(phi)];
  const tan = [-Math.sin(phi), 0, -Math.cos(phi)], inw = [-Math.cos(phi), 0, Math.sin(phi)];
  const c = Math.cos(inward), s = Math.sin(inward);
  const d = [tan[0] * c + inw[0] * s, -Math.tan(down), tan[2] * c + inw[2] * s];
  return [pos, v3.add(pos, d)];
}

// ---------------------------------------------------------------- presets
const presets = {
  // a neutral oblique look-dev view
  default: D({ cam: [[0, [0, 0.85, 1.75], [0, -0.05, 0], 38]] }),
  // Engulf: the camera sinks from above the disk down through its billowing upper layers toward the plane; clumps
  // pass close to the lens, and at the end the disk's own upper layers rise across the frame and swallow the dwarf.
  'S12-engulf': D({
    vol: 0.6,
    cam: [
      [0, [0.40, 0.26, 0.98], [0, 0.0, 0], 58],
      [0.55, [0.31, 0.16, 0.81], [0, 0.0, 0], 64, 0.03],
      [0.8, [0.27, 0.10, 0.71], [0, 0.002, 0], 68, 0.0],
      [1, [0.22, 0.042, 0.58], [0, 0.004, 0], 74, -0.04, 'inQuad'],
    ],
    tau: [10, 1.0, 0],
    clear: 0.06,
    disk: { omega: 0.3, maxSteps: 52, sheet: 0.8, sheetHeat: 0.6, sheetMask: -0.05, arms: 1.0, armFloor: 0.05, cloud: 1.0,
      void: 0.0, voidW: 0.1, turb: 0.9, floor: 0.12, coldGas: 0.33, irr: 1.2 },
    post: { zoomBlur: 0.012, exposure: 0.8 },
    // 9:16: the disk plane starts tilted across the tall frame and keeps rolling as the camera sinks (the vortex
    // taking hold) until it stands almost upright, widening a touch: by the end the disk runs up the frame through
    // the centred dwarf and its rising upper layers close in as walls on both sides
    portrait: { framing: [[0, { roll: 15, zoom: 0.66 }], [1, { roll: 70, zoom: 0.58 }, 'inOutSine']] },
  }),
  // Resistance: the stream slams the young disk's rim. Impact point from lib/binary.js streamPath()
  // (first rim crossing at local (-0.96, 0.27), azimuth -2.87, velocity (0.965, 0.261)).
  'S09-hotspot': D({
    vol: 0.5,
    cam: [
      [0, [-1.22, 0.17, 1.06], [-0.62, -0.03, 0.10], 44],
      [1, [-1.08, 0.12, 0.92], [-0.55, -0.04, 0.04], 41, 0.03],
    ],
    tau: [3, 1.0, 0],
    lum: [0.5, 0.5],
    flare: [-0.4, 1e9, 0],          // the young disk's inner region is not yet heated: the impact owns the frame
    disk: {
      omega: 0.26, hot: 1.0, hotPhi: -2.873, streamDir: [0.965, 0, 0.261], streamW: 0.024, rb: 1.35,
      arms: 0.35, rin: 0.12, sheet: 0.6, sheetMask: -0.1, curtain: 1.5, maxSteps: 52, irr: 3, tout: 1250, sheetHeat: 0.6, tinK: 0.1, edgeFade: 0.12,
    },
    sparks: {
      origin: [-0.93, 0.02, 0.26], axis: [-0.25, 0.75, 0.62], spread: 0.85, speed: 0.42, life: 1.1, count: 190,
      gravity: [0.30, -0.30, -0.08], drift: [0.07, 0, 0.25], shutter: 0.035, gain: 1.3, width: 0.0018, jitter: 0.05,
    },
    post: { overlayGain: 5.0 },
    // 9:16: the picture turned a quarter so the stream pours straight down the tall frame and slams the rim in the
    // upper third; the sparks fan out, the shocked gas streams on down toward the young disk, which stays whole in
    // the lower third of the 3:4 window (the zoom eases out against the camera's push so it never meets the bar)
    portrait: { framing: [[0, { roll: 90, zoom: 0.6, pan: [0.04, 0.02] }], [1, { roll: 90, zoom: 0.54, pan: [0.06, 0.02] }, 'inOutSine']] },
  }),
  // The real vortex answers Leonardo's ink drawing: top-down, centred, counter-clockwise, spiral strands filling frame.
  // (camera slightly +Z of the axis so screen-up = -Z, screen-right = +X: CCW on screen = CCW from +Y)
  'S14e-spiral': D({
    vol: 0.6,
    cam: [
      [0, [0, 1.42, 0.004], [0, 0, 0], 40, 0.0],
      [1, [0, 1.22, 0.004], [0, 0, 0], 40, -0.10, 'outSine'],
    ],
    tau: [24, 1.2, 0],
    heat: [0.94, 0, 0.5, 0],
    disk: { omega: 0.3, arms: 1.0, armM: 2, armPitch: 0.30, armFloor: 0.05, armHeat: 0.35, sheet: 0.9, sheetHeat: 0.5,
      kr: 7.0, ky: 9.0, sheetMask: -0.35, floorMid: 0.25, maxSteps: 40, edgeFade: 0.35, tinK: 0.1, rimPuff: 0.5, curtain: 0.02 },
    post: { bloomStrength: 0.05 },
    // 9:16: same pole-on centred spiral, opened up so its strands fill the tall frame edge to edge (a roll never
    // mirrors, so the counter-clockwise sense that rhymes with the S14d ink is kept)
    portrait: { framing: { zoom: 0.78 } },
  }),
  // Ladder: held breath. A slow oblique push (~55 degrees elevation, long lens: the flare and the thickness of the disk
  // read, unlike the flat pole-on S14e answer); the vortex visibly accelerates, the dwarf brightens.
  'S16-ladder': D({
    vol: 0.6,
    cam: [
      [0, [0.0, 2.13, 1.49], [0, 0, 0.0], 28, 0.0],
      [1, [0.0, 1.31, 0.92], [0, 0, 0.0], 28, -0.12, 'inOutSine'],
    ],
    tau: [40, 0.5, 0.42],
    heatRamp: [0.92, 1.12], lum: [0.6, 2.4],
    disk: { omega: 0.3, arms: 0.9, armM: 2, armPitch: 0.33, armFloor: 0.06, sheet: 0.9, sheetHeat: 0.6, sheetMask: -0.25,
      maxSteps: 46, armSpeed: 0.08, tinK: 0.35, curtain: 0.06, h0: 0.085 },
    post: { bloomStrength: 0.05 },
    // 9:16: the oblique disk turned a quarter so its long axis runs up the tall frame and the ellipse fills it
    portrait: { framing: { roll: 90, zoom: 0.62 } },
  }),
  // Strike 2: medium, closer and more compressed; the inner disk flares white-hot on the strike, then pulses/decays
  // (16:9; the 9:16 cut inverts the strike into a dark punch, see portrait).
  'S18-strike2': D({
    vol: 0.5,
    cam: [
      [0, [0.15, 0.34, 0.57], [0, -0.01, 0], 44, 0.0],
      [1, [0.09, 0.28, 0.46], [0, -0.01, 0], 44, 0.04, 'outSine'],
    ],
    tau: [60, 1.4, 0],
    heat: [1.0, 0, 0.5, 0], flare: [0.9, 0.5, 0.12], lum: [1.4, 1.1],
    disk: { omega: 0.34, h0: 0.05, dens: 9, tout: 1000, tinK: 0.6, arms: 0.6, sheet: 0.9, sheetHeat: 0.5, coldGas: 0.5, sheetMask: -0.2,
      rimPuff: 0.6, curtain: 1.2, maxSteps: 46, irr: 1.5 },
    post: {},
    // 9:16: level, the inner ring big across the frame, the disk above and below it. Strikes no longer flash white
    // (director's note; the plan's `dip` punches the exposure down), and the 16:9 in-world strike flare would land
    // the cut on a blazing disk that hides the dip (even with the flare merely removed, the cut would land brighter
    // than the dark S17 frame before it, the only strike to do so). So the strike flare is inverted into a brief quench: the cut
    // lands dark (dwarf and blue curtains burning), the disk re-ignites from the inside out and is back on the
    // approved white-hot hold within ~0.5 s; the eighth-note pulses are unchanged.
    portrait: { framing: { zoom: 0.9 }, heat: [1.0, -0.45, 0.2, 0], flare: [-0.7, 0.22, 0.12] },
  }),
  // Frenzy 27.4: a spiral arm rushes toward the lens (camera low, looking upstream into the flow).
  'F27.4': D({
    vol: 0.6,
    cam: [
      [0, [0.57, 0.09, -0.14], [0.42, 0.0, 0.55], 70, 0.08],
      [1, [0.55, 0.075, 0.06], [0.38, 0.0, 0.70], 72, 0.13, 'inQuad'],
    ],
    tau: [78.0, 3.5, 0],
    heat: [1.05, 0, 0.5, 0],
    clear: 0.04,
    disk: { omega: 0.32, arms: 1.0, armFloor: 0.04, armHeat: 0.2, armSpeed: 0.6, sheet: 0.9, sheetHeat: 0.55, sheetMask: -0.15,
      maxSteps: 46, cloud: 1.0, void: 0.0, voidW: 0.1, turb: 0.9, floor: 0.32, coldGas: 0.28, irr: 1.0, sheetW: 0.03 },
    post: { blur: [4, 0] },
    // 9:16: tight on the arm crest silhouetted against the stars, the near flow below
    portrait: { framing: { zoom: 0.9, pan: [0.3, -0.2] } },
  }),
  // Frenzy 29.2: the white-hot inner edge, close: dwarf large, curtains arcing to its poles, rim wall blazing.
  'F29.2': D({
    vol: 0.75,
    cam: [
      [0, [0.180, 0.118, 0.180], [0, -0.006, 0], 40, -0.04],
      [1, [0.160, 0.104, 0.164], [0, -0.006, 0], 40, -0.09],
    ],
    tau: [90, 1.0, 0],
    heat: [0.85, 0, 0.5, 0], lum: [1.0, 1.0],
    disk: { omega: 0.32, curtain: 0.5, maxSteps: 56, stepK: 0.4, sheet: 0.9, sheetHeat: 0.5, rimPuff: 0.8, tinK: 0.4, rb: 0.8, dwarfSurf: 0.2, irr: 1.5, tout: 1000 },
    post: { exposure: 0.5, bloomStrength: 0.04 },
    // 9:16: the dwarf big at the centre, the hole filling the width, the curtains running up and down the frame
    portrait: { framing: { zoom: 0.68 } },
  }),
  // Frenzy 31.1: extreme speed - a banking skim just above the arm crests, racing along the CCW orbit (not another
  // radial approach like S12): the crests tear past below, the dwarf blazes off-centre on the left horizon.
  'F31.1': D({
    vol: 0.55,
    cam: [
      [0, ...skim(2.15, 0.39, 0.052, 0.95, 0.10), 66, -0.10],
      [1, ...skim(2.70, 0.34, 0.036, 1.00, 0.09), 70, -0.22, 'linear'],
    ],
    tau: [100, 4.0, 0],
    heat: [1.1, 0, 0.5, 0],
    clear: 0.025,
    disk: { omega: 0.32, sheet: 0.9, sheetHeat: 0.6, sheetMask: -0.15, maxSteps: 48, arms: 1.0, armFloor: 0.05, cloud: 1.2,
      floor: 0.2, coldGas: 0.32, irr: 1.5, void: -0.1, voidW: 0.12 },
    post: { blur: [34, 0], zoomBlur: 0.012, exposure: 0.85 },
    // 9:16: the bank steepened into a diagonal that climbs the tall frame (same sense as the landscape bank), the
    // blazing crests on the right, the streaking stars on the left, the contrast edge near the centre (pan.y toward
    // the stars moves it across the bank); the motion blur turns with it (post below)
    portrait: { framing: { roll: -60, zoom: 0.66, pan: [-0.42, 0.16] } },
  }),
};

function tauAt(P, local) { const [a, b, c] = P.tau; return a + b * local + c * local * local; }
function tauRate(P, local) { const [, b, c] = P.tau; return b + 2 * c * Math.max(0, local); }

function heatAt(P, local, pulse, u) {
  const [base, amp, decay, pAmp] = P.heat;
  const ramp = P.heatRamp ? lerp(P.heatRamp[0], P.heatRamp[1], smoothstep(0, 1, u)) : 1;
  let h = base * ramp + (amp ? amp * Math.exp(-Math.max(0, local) / decay) : 0);
  if (pAmp && pulse) h += pAmp * Math.exp(-pulse.since / 0.12);
  return h;
}

// camera keys are in normalised shot time (0 = first frame, 1 = shot end), so presets survive re-timing
function camAt(P, local, dur) {
  let cam = camFromKeys(P.cam, local / dur);
  const [amp, speed] = P.drift;
  if (amp) {
    const d = drift(local, amp, speed, 3);
    const R = cam.raw;   // rebuild from the unframed camera (see engine/math.js framing)
    const tgt = v3.add(v3.add(R.pos, v3.mul(R.fwd, 1)), v3.mul(d, 0.5));
    const fov = 2 * Math.atan(R.tanH) * 180 / Math.PI;
    cam = camera(v3.add(R.pos, d), tgt, fov, 0);
  }
  return cam;
}

function filmTime(E, S) {
  const real = E.plan && E.plan.shots && E.plan.shots.find((s) => s.id === S.shot.id);
  return real ? (real.span ? real.span[0] : real.start) / E.fps + S.local : S.t;   // span: an insert cut into the shot
}

export default {
  id: 'vortex',
  scale: 1,
  presets,
  init(E) {
    this.vol = E.program(VOL, 'vortex.vol');
    this.comp = E.program(COMP, 'vortex.comp');
  },
  frameState(E, S) {
    const P = S.params;
    const local = clamp(S.local, -0.5, S.dur + 0.5);
    const cam = camAt(P, local, S.dur);
    const tau = tauAt(P, local);
    const pulse = E.music && (P.heat[3] || P.flare[2]) ? E.music.pulse(filmTime(E, S)) : null;
    const u = clamp(local / S.dur);
    const heat = heatAt(P, local, pulse, u);
    const [fa, fd, fp] = P.flare;
    const flare = fa * Math.exp(-Math.max(0, local) / fd) + (fp && pulse ? fp * Math.exp(-pulse.since / 0.12) : 0);
    const lum = lerp(P.lum[0], P.lum[1], smoothstep(0, 1, u)) * (0.6 + 0.4 * heat) * (1 + 0.6 * flare);
    // deterministic flow motion blur: disk-time elapsed during a 180-degree shutter
    const smear = tauRate(P, local) * (0.5 / (E.fps || 24)) * P.smearK;
    return { P, local, cam, tau, heat, flare, lum, u, smear };
  },
  render(E, S, target) {
    const F = this.frameState(E, S);
    const { P, cam } = F;
    const d = { ...DISK, ...P.disk };
    const dwarf = { uDwarfPos: [0, 0, 0], uDwarfR: d.dwarfR, uDwarfLum: F.lum };
    const vt = E.target('vortexVol', P.vol);
    E.draw(this.vol, {
      ...cam.uniforms, ...dwarf,
      uTau: F.tau, uOmega: d.omega, uCycle: d.cycle, uRin: d.rin, uRout: d.rout, uH0: d.h0, uFlare: d.flare,
      uRimPuff: d.rimPuff, uDens: d.dens, uDensExp: d.densExp, uTout: d.tout, uTinK: d.tinK, uHeat: F.heat, uInnerFlare: F.flare, uTurb: d.turb,
      uArms: d.arms, uArmM: d.armM, uArmPitch: d.armPitch, uArmSpeed: d.armSpeed, uArmSharp: d.armSharp,
      uHot: d.hot, uHotPhi: d.hotPhi, uStreamDir: v3.norm(d.streamDir), uStreamW: d.streamW, uShockK: d.shockK, uStreamK: d.streamK,
      uSmear: F.smear, uRb: d.rb, uLod: d.lod, uStepK: d.stepK, uSeedV: P.seed ?? 1, uEdgeFade: d.edgeFade,
      uGrain3: d.grain3, uIrr: d.irr, uArmFloor: d.armFloor, uArmHeat: d.armHeat, uVoid: d.void, uVoidW: d.voidW, uPuff: d.puff, uCloud: d.cloud, uFloor: d.floor,
      uSheet: d.sheet, uSheetHeat: d.sheetHeat, uColdGas: d.coldGas, uSheetW: d.sheetW, uMaxSteps: d.maxSteps,
      uSheetMask: d.sheetMask, uFloorMid: d.floorMid, uKr: d.kr, uKy: d.ky,
      uClear: [...cam.pos, P.clear || 0], uJitAmp: P.jitAmp ?? 1,
    }, vt);
    E.draw(this.comp, {
      ...cam.uniforms, ...dwarf, uVol: vt, uStarGain: d.starGain,
      uTau: F.tau, uRin: d.rin, uCurtain: d.curtain, uCurtainSpin: d.curtainSpin, uCurtainPhi: d.curtainPhi,
      uDwarfSurf: d.dwarfSurf, uGlowK: d.glowK,
    }, target);
  },
  overlay(E, S, ctx) {
    const P = S.params;
    if (!P.sparks && !P.debris) return null;
    const F = this.frameState(E, S);
    if (P.sparks) sparks(ctx, E, F, P.sparks);
    if (P.debris) debris(ctx, E, F, P.debris);
    return 'add';
  },
  post(E, S) {
    const P = S.params;
    const F = this.frameState(E, S);
    const out = { ...P.post };
    if (P.postFn) Object.assign(out, P.postFn(F, S));
    // directional motion blur is authored in 1080p pixels along the landscape screen axes: scale it with the
    // frame and, in portrait, turn it with the framing roll so it keeps following the on-screen motion
    // (a camera roll of r degrees CCW turns the picture r degrees CW). Identical in a 1080p landscape render.
    if (out.blur && (out.blur[0] || out.blur[1])) {
      const a = -((S.framing && S.framing.roll) || 0) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
      const [bx, by] = out.blur, k = E.k || 1;
      out.blur = [(bx * c - by * s) * k, (bx * s + by * c) * k];
    }
    return out;
  },
};
