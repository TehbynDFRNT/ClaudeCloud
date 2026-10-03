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
  vec3 col = rgb + starField(rd, pixAngle) * uStarGain * smoothstep(0.45, 0.97, tr);
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
  rb: 1.25, lod: 0.004, stepK: 0.55, edgeFade: 0.3, grain3: 1.0, starGain: 0.3, irr: 6, armFloor: 0.12, armHeat: 0.35,
  void: -0.37, puff: 1.0, floor: 0.08, sheet: 1.0, sheetHeat: 0.45, coldGas: 0.5, sheetW: 0.04, maxSteps: 44, sheetMask: -1,
  floorMid: 0.6, kr: 6.0, ky: 10.0,
};

const P0 = {
  disk: {},
  vol: 0.6, tau: [0, 1, 0], heat: [1, 0, 0.5, 0], lum: [1, 1], drift: [0, 0], smearK: 1, clear: 0,
  post: { bloomStrength: 0.07, streakStrength: 0.004 },
};

const D = (o) => ({ ...P0, ...o, disk: { ...DISK, ...(o.disk || {}) }, post: { ...P0.post, ...(o.post || {}) } });

// ---------------------------------------------------------------- presets
const presets = {
  // a neutral oblique look-dev view
  default: D({ cam: [[0, [0, 0.85, 1.75], [0, -0.05, 0], 38]] }),
  'S12-engulf': D({
    vol: 0.6,
    cam: [
      [0, [0.42, 0.30, 1.02], [0, 0.0, 0], 58],
      [0.476, [0.30, 0.14, 0.84], [0, 0.0, 0], 66, 0.02],
      [1, [0.21, 0.07, 0.63], [0, 0.0, 0], 78, -0.05],
    ],
    tau: [10, 1.0, 0],
    disk: { omega: 0.3, maxSteps: 48, sheet: 0.7, sheetHeat: 0.7, sheetMask: -0.05 },
    post: { zoomBlur: 0.012 },
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
    disk: {
      omega: 0.26, hot: 1.0, hotPhi: -2.873, streamDir: [0.965, 0, 0.261], streamW: 0.024, rb: 1.35,
      arms: 0.35, rin: 0.12, sheet: 0.6, sheetMask: -0.1, curtain: 1.5, maxSteps: 52, irr: 4, tout: 1450, sheetHeat: 0.6, tinK: 0.35, edgeFade: 0.12,
    },
    sparks: {
      origin: [-0.93, 0.02, 0.26], axis: [-0.25, 0.75, 0.62], spread: 0.85, speed: 0.42, life: 1.1, count: 190,
      gravity: [0.30, -0.30, -0.08], drift: [0.07, 0, 0.25], shutter: 0.035, gain: 1.3, width: 0.0018, jitter: 0.05,
    },
    post: { overlayGain: 5.0 },
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
    disk: { omega: 0.3, arms: 1.0, armM: 2, armPitch: 0.30, armFloor: 0.05, armHeat: 0.35, sheet: 0.9, sheetHeat: 0.5,
      kr: 7.0, ky: 9.0, sheetMask: -0.35, floorMid: 0.25, maxSteps: 40, edgeFade: 0.35, tinK: 0.5 },
    post: {},
  }),
  // Ladder: held breath. Top-down slow push; the vortex visibly accelerates, the dwarf brightens.
  'S16-ladder': D({
    vol: 0.6,
    cam: [
      [0, [0.0, 1.90, 0.30], [0, 0, 0.02], 38, 0.0],
      [1, [0.0, 1.50, 0.18], [0, 0, 0.01], 38, -0.22, 'inOutSine'],
    ],
    tau: [40, 0.5, 0.42],
    heatRamp: [0.95, 1.12], lum: [0.8, 2.6],
    disk: { omega: 0.3, arms: 0.85, armM: 2, armPitch: 0.33, armFloor: 0.1, sheet: 0.9, sheetHeat: 0.6, sheetMask: -0.25,
      maxSteps: 40, armSpeed: 0.08 },
    post: {},
  }),
  // Strike 2: medium, closer and more compressed; the inner disk flares white-hot on the strike, then pulses/decays.
  'S18-strike2': D({
    vol: 0.5,
    cam: [
      [0, [0.15, 0.34, 0.57], [0, -0.01, 0], 44, 0.0],
      [1, [0.09, 0.28, 0.46], [0, -0.01, 0], 44, 0.04, 'outSine'],
    ],
    tau: [60, 1.4, 0],
    heat: [1.0, 0.45, 0.45, 0.08], lum: [1.5, 1.2],
    disk: { omega: 0.34, h0: 0.05, dens: 9, tout: 1000, tinK: 0.6, arms: 0.6, sheet: 0.9, sheetHeat: 0.5, coldGas: 0.5, sheetMask: -0.2,
      rimPuff: 0.6, curtain: 1.2, maxSteps: 46, irr: 1.5 },
    post: {},
  }),
  // Frenzy 27.4: a spiral arm rushes toward the lens (camera low, looking upstream into the flow).
  'F27.4': D({
    vol: 0.6,
    cam: [
      [0, [0.57, 0.09, -0.14], [0.42, 0.0, 0.55], 70, 0.08],
      [1, [0.55, 0.075, 0.06], [0.38, 0.0, 0.70], 72, 0.13, 'inQuad'],
    ],
    tau: [78.0, 3.5, 0],
    heat: [1.12, 0, 0.5, 0],
    disk: { omega: 0.32, arms: 1.0, armFloor: 0.04, armHeat: 0.5, armSpeed: 0.6, sheet: 0.9, sheetHeat: 0.75, sheetMask: -0.15,
      maxSteps: 46 },
    post: { blur: [6, 0] },
  }),
  // Frenzy 29.2: the white-hot inner edge, close: dwarf large, curtains arcing to its poles, rim wall blazing.
  'F29.2': D({
    vol: 0.75,
    cam: [
      [0, [0.115, 0.085, 0.115], [0, 0.0, 0], 50, -0.04],
      [1, [0.098, 0.075, 0.104], [0, 0.0, 0], 50, -0.10],
    ],
    tau: [90, 1.0, 0],
    heat: [0.92, 0, 0.5, 0], lum: [1.0, 1.0],
    disk: { omega: 0.32, curtain: 1.0, maxSteps: 50, stepK: 0.4, sheet: 0.9, sheetHeat: 0.5, rimPuff: 0.8, tinK: 0.4 },
    post: { exposure: 0.2 },
  }),
  // Frenzy 31.1: extreme speed - a plunge across the disk surface toward the dwarf.
  'F31.1': D({
    vol: 0.55,
    cam: [
      [0, [-0.62, 0.075, 0.30], [0, 0.0, 0], 64, 0.10],
      [1, [-0.36, 0.05, 0.16], [0, 0.0, 0], 70, 0.16, 'linear'],
    ],
    tau: [100, 4.0, 0],
    heat: [1.18, 0, 0.5, 0],
    disk: { omega: 0.32, sheet: 0.9, sheetHeat: 0.75, sheetMask: -0.15, maxSteps: 44 },
    post: { zoomBlur: 0.035 },
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
    const tgt = v3.add(v3.add(cam.pos, v3.mul(cam.fwd, 1)), v3.mul(d, 0.5));
    const fov = 2 * Math.atan(cam.tanH) * 180 / Math.PI;
    cam = camera(v3.add(cam.pos, d), tgt, fov, 0);
  }
  return cam;
}

function filmTime(E, S) {
  const real = E.plan && E.plan.shots && E.plan.shots.find((s) => s.id === S.shot.id);
  return real ? real.start / E.fps + S.local : S.t;
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
    const pulse = E.music && P.heat[3] ? E.music.pulse(filmTime(E, S)) : null;
    const u = clamp(local / S.dur);
    const heat = heatAt(P, local, pulse, u);
    const lum = lerp(P.lum[0], P.lum[1], smoothstep(0, 1, u)) * (0.6 + 0.4 * heat);
    // deterministic flow motion blur: disk-time elapsed during a 180-degree shutter
    const smear = tauRate(P, local) * (0.5 / (E.fps || 24)) * P.smearK;
    return { P, local, cam, tau, heat, lum, u, smear };
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
      uRimPuff: d.rimPuff, uDens: d.dens, uDensExp: d.densExp, uTout: d.tout, uTinK: d.tinK, uHeat: F.heat, uTurb: d.turb,
      uArms: d.arms, uArmM: d.armM, uArmPitch: d.armPitch, uArmSpeed: d.armSpeed, uArmSharp: d.armSharp,
      uHot: d.hot, uHotPhi: d.hotPhi, uStreamDir: v3.norm(d.streamDir), uStreamW: d.streamW, uShockK: d.shockK, uStreamK: d.streamK,
      uSmear: F.smear, uRb: d.rb, uLod: d.lod, uStepK: d.stepK, uSeedV: P.seed ?? 1, uEdgeFade: d.edgeFade,
      uGrain3: d.grain3, uIrr: d.irr, uArmFloor: d.armFloor, uArmHeat: d.armHeat, uVoid: d.void, uPuff: d.puff, uFloor: d.floor,
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
    return out;
  },
};
