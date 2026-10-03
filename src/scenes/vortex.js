// VORTEX: the close-in accretion vortex around the white dwarf.
// Two passes: (1) volume at a per-shot scale (soft turbulent gas, curtains, dwarf), alpha = transmittance;
// (2) composite at the scene scale: upsampled volume + crisp star field behind the gas.
// params (per preset):
//   cam: camera keys (lib/util.js), drift: [amp, speed], vol: volume render scale
//   tau: [tau0, rate, accel]  disk time = tau0 + rate*local + accel*local^2
//   disk: overrides of the disk uniforms (omega, rin, rout, h0, flare, dens, ...)
//   heat: [base, flareAmp, flareDecay, pulseAmp]  temperature multiplier envelope
//   lum: dwarf luminosity envelope [base, end] (lerp over the shot), post: post overrides
import { frag, STARS } from '../engine/glsl.js';
import { DWARF } from './lib/dwarf.glsl.js';
import { VORTEX } from './lib/vortex-disk.glsl.js';
import { camFromKeys, drift, camera, v3 } from './lib/util.js';
import { clamp, lerp, smoothstep } from '../engine/math.js';
import { sparks, debris } from './lib/vortex-fx.js';

const VOL = frag(DWARF, VORTEX, `
uniform float uDebug;
uniform float uJitFix;
void main(){
  vec2 uv = frameUV();
  vec3 rd = cameraRay(uv);
  vec3 ro = uCamPos;
  if (uDebug > 0.5){
    vec3 p = vec3(uv.x * frameAspect(), uDebug - 1.0, -uv.y) * 1.1;
    vec4 xs = vec4(0.0); vec2 xf = vec2(0.0);
    vec3 f = vxField(p, vec3(0.0, -1.0, 0.0), uTau, 0.0, xs, xf, false);
    float r = length(p.xz);
    float base = uDens * pow(r, -uDensExp);
    fragColor = vec4(f.x / max(base, 1e-3) * 0.5, vxEmit(f.y).g * 0.5, 0.0, 1.0);
    return;
  }
  float pixAngle = 2.0 * uTanHalfFov / uRes.y;
  float jit = uJitFix >= 0.0 ? uJitFix : hash12(gl_FragCoord.xy + fract(uFrame * 0.6180339) * 917.0);
  vec2 hd = sphereHit(ro, rd, uDwarfPos, uDwarfR);
  bool hitD = hd.x < hd.y && hd.y > 0.0;
  float tMax = hitD ? max(hd.x, 0.0) : 60.0;
  float tD = length(uDwarfPos - ro);
  float trans, transD;
  float jitT = hash12(gl_FragCoord.yx * 1.37 + fract(uFrame * 0.7548776) * 613.0);
  vec3 col = vxMarch(ro, rd, tMax, jit, jitT, pixAngle, tD, trans, transD);
  if (uCurtain > 0.0) col += vxCurtain(ro, rd, tMax, fract(jit + 0.37)) * transD;
  if (hitD) col += vxDwarfSurface(ro, rd, hd) * trans;
  col += vxDwarfGlow(ro, rd, pixAngle) * transD;
  fragColor = vec4(col, hitD ? 0.0 : trans);
}`);

const COMP = frag(STARS, `
uniform sampler2D uVol;
uniform float uStarGain;
void main(){
  vec2 uv = frameUV();
  vec2 st = gl_FragCoord.xy / uRes;
  vec4 v = texture(uVol, st);
  vec3 rd = cameraRay(uv);
  float pixAngle = 2.0 * uTanHalfFov / uRes.y;
  vec3 bg = starField(rd, pixAngle) * uStarGain;
  fragColor = vec4(v.rgb + bg * v.a * v.a * v.a, 1.0);
}`);

// ---------------------------------------------------------------- defaults
const DISK = {
  omega: 0.22, cycle: 2.4, rin: 0.075, rout: 1.0, h0: 0.075, flare: 1.18, rimPuff: 1.2,
  dens: 7.0, densExp: 1.8, tout: 1300, tinK: 0.6, turb: 0.55, arms: 0.55, armM: 2, armPitch: 0.36, armSpeed: 0.05,
  curtain: 1.0, curtainSpin: 2.0, dwarfR: 0.014, dwarfSurf: 1.0, hot: 0, hotPhi: 2.2, streamDir: [0.6, 0, 0.8],
  streamW: 0.02, shutter: 0.0, rb: 1.25, lod: 0.004, stepK: 0.55, edgeFade: 0.3, grain3: 1.0, starGain: 0.3, irr: 18, armFloor: 0.12, armHeat: 0.35, void: -0.37, puff: 1.0, floor: 0.08, sheet: 1.0, sheetHeat: 0.45, coldGas: 0.55, sheetW: 0.04, maxSteps: 44, sheetMask: -1, floorMid: 0.6, kr: 6.0, ky: 10.0,
};

const P0 = {
  disk: {},
  vol: 0.6, tau: [0, 1, 0], heat: [1, 0, 0.5, 0], lum: [1, 1], drift: [0, 0],
  post: { bloomStrength: 0.09, streakStrength: 0.025 },
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
      [3.0, [0.30, 0.14, 0.84], [0, 0.0, 0], 66, 0.02],
      [6.3, [0.21, 0.07, 0.63], [0, 0.0, 0], 78, -0.05],
    ],
    tau: [10, 1.0, 0],
    disk: { omega: 0.3, shutter: 0.015, maxSteps: 48, sheet: 0.7, sheetHeat: 0.7, sheetMask: -0.05 },
    post: { blur: [7, 0], bloomStrength: 0.1, streakStrength: 0.03 },
  }),
  // Resistance: the stream slams the young disk's rim. Impact point from lib/binary.js streamPath()
  // (first rim crossing at local (-0.96, 0.27), azimuth -2.87, velocity (0.965, 0.261)).
  'S09-hotspot': D({
    vol: 0.6,
    cam: [
      [0, [-1.22, 0.17, 1.06], [-0.62, -0.03, 0.10], 44],
      [7.1, [-1.08, 0.12, 0.92], [-0.55, -0.04, 0.04], 41, 0.03],
    ],
    tau: [3, 1.0, 0],
    disk: {
      omega: 0.26, hot: 1.0, hotPhi: -2.873, streamDir: [0.965, 0, 0.261], streamW: 0.026, rb: 2.6,
      arms: 0.35, rin: 0.12, sheet: 0.6, sheetMask: -0.1, curtain: 3.0, maxSteps: 48, irr: 6, tout: 1450, sheetHeat: 0.8, edgeFade: 0.12,
    },
    sparks: {
      origin: [-0.93, 0.02, 0.26], axis: [-0.25, 0.75, 0.62], spread: 0.85, speed: 0.42, life: 1.1, count: 190,
      gravity: [0.30, -0.30, -0.08], drift: [0.07, 0, 0.25], shutter: 0.035, gain: 1.3, width: 0.0018, jitter: 0.05,
    },
    post: { bloomStrength: 0.11, streakStrength: 0.03, overlayGain: 5.0 },
  }),
  // The real vortex answers Leonardo's ink drawing: top-down, centred, counter-clockwise, spiral strands filling frame.
  // (camera slightly +Z of the axis so screen-up = -Z, screen-right = +X: CCW on screen = CCW from +Y)
  'S14e-spiral': D({
    vol: 0.6,
    cam: [
      [0, [0, 1.42, 0.004], [0, 0, 0], 40, 0.0],
      [1.7, [0, 1.22, 0.004], [0, 0, 0], 40, -0.10, 'outSine'],
    ],
    tau: [24, 1.2, 0],
    disk: { omega: 0.3, arms: 1.0, armM: 2, armPitch: 0.30, armFloor: 0.05, armHeat: 0.35, sheet: 0.9, sheetHeat: 0.5,
      kr: 7.0, ky: 9.0, sheetMask: -0.35, floorMid: 0.25, maxSteps: 40, edgeFade: 0.35, tinK: 0.5 },
    post: { exposure: 0.8, bloomStrength: 0.08, streakStrength: 0.015 },
  }),
  // Ladder: held breath. Top-down slow push; the vortex visibly accelerates, the dwarf brightens.
  'S16-ladder': D({
    vol: 0.6,
    cam: [
      [0, [0.0, 1.90, 0.30], [0, 0, 0.02], 38, 0.0],
      [3.6, [0.0, 1.50, 0.18], [0, 0, 0.01], 38, -0.22, 'inOutSine'],
    ],
    tau: [40, 0.5, 0.42],
    heatRamp: [0.95, 1.12], lum: [0.8, 2.6],
    disk: { omega: 0.3, arms: 0.85, armM: 2, armPitch: 0.33, armFloor: 0.1, sheet: 0.9, sheetHeat: 0.6, sheetMask: -0.25,
      maxSteps: 40, armSpeed: 0.08 },
    post: { bloomStrength: 0.09, streakStrength: 0.012 },
  }),
  // Strike 2: medium, closer and more compressed; the inner disk flares white-hot on the strike, then pulses/decays.
  'S18-strike2': D({
    vol: 0.6,
    cam: [
      [0, [0.12, 0.30, 0.47], [0, -0.01, 0], 44, 0.0],
      [3.55, [0.07, 0.25, 0.38], [0, -0.01, 0], 44, 0.04, 'outSine'],
    ],
    tau: [60, 1.4, 0],
    heat: [1.12, 0.75, 0.45, 0.12], lum: [2.5, 1.8],
    disk: { omega: 0.34, h0: 0.05, dens: 9, tout: 1150, tinK: 0.75, arms: 0.6, sheet: 0.9, sheetHeat: 0.45, coldGas: 0.65, sheetMask: -0.2,
      rimPuff: 0.6, curtain: 1.6, maxSteps: 46, shutter: 0.01 },
    post: { exposure: 0.24, saturation: 1.12, bloomStrength: 0.1, streakStrength: 0.012 },
  }),
  // Frenzy 27.4: a spiral arm rushes toward the lens (camera low, looking upstream into the flow).
  'F27.4': D({
    vol: 0.6,
    cam: [
      [0, [0.56, 0.085, -0.10], [0.42, 0.0, 0.55], 70, 0.08],
      [0.9, [0.55, 0.075, 0.02], [0.40, 0.0, 0.62], 72, 0.12],
    ],
    tau: [80, 3.5, 0],
    heat: [1.12, 0, 0.5, 0],
    disk: { omega: 0.32, arms: 0.9, armFloor: 0.1, sheet: 0.9, sheetHeat: 0.75, sheetMask: -0.15, shutter: 0.05, maxSteps: 46 },
    post: { bloomStrength: 0.1, streakStrength: 0.03, blur: [6, 0] },
  }),
  // Frenzy 29.2: the white-hot inner edge, close: dwarf large, curtains arcing to its poles, rim wall blazing.
  'F29.2': D({
    vol: 0.6,
    cam: [
      [0, [0.115, 0.085, 0.115], [0, 0.0, 0], 50, -0.04],
      [0.96, [0.098, 0.075, 0.104], [0, 0.0, 0], 50, -0.10],
    ],
    tau: [90, 1.0, 0],
    heat: [1.15, 0, 0.5, 0], lum: [1.4, 1.4],
    disk: { omega: 0.32, curtain: 0.6, shutter: 0.012, maxSteps: 46, sheet: 0.9, sheetHeat: 0.5, rimPuff: 0.8, tinK: 1.1 },
    post: { exposure: 0.035, bloomStrength: 0.1, streakStrength: 0.04 },
  }),
  // Frenzy 31.1: extreme speed - a plunge across the disk surface toward the dwarf.
  'F31.1': D({
    vol: 0.55,
    cam: [
      [0, [-0.62, 0.075, 0.30], [0, 0.0, 0], 64, 0.10],
      [0.42, [-0.36, 0.05, 0.16], [0, 0.0, 0], 70, 0.16, 'linear'],
    ],
    tau: [100, 4.0, 0],
    heat: [1.18, 0, 0.5, 0],
    disk: { omega: 0.32, shutter: 0.06, sheet: 0.9, sheetHeat: 0.75, sheetMask: -0.15, maxSteps: 44 },
    post: { bloomStrength: 0.1, streakStrength: 0.03, zoomBlur: 0.035 },
  }),
};

function tauAt(P, local) { const [a, b, c] = P.tau; return a + b * local + c * local * local; }

function heatAt(P, local, pulse, u) {
  const [base, amp, decay, pAmp] = P.heat;
  const ramp = P.heatRamp ? lerp(P.heatRamp[0], P.heatRamp[1], smoothstep(0, 1, u)) : 1;
  let h = base * ramp + (amp ? amp * Math.exp(-Math.max(0, local) / decay) : 0);
  if (pAmp && pulse) h += pAmp * Math.exp(-pulse.since / 0.12);
  return h;
}

function camAt(P, local) {
  let cam = camFromKeys(P.cam, local);
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
    const cam = camAt(P, local);
    const tau = tauAt(P, local);
    const pulse = E.music && P.heat[3] ? E.music.pulse(filmTime(E, S)) : null;
    const u = clamp(local / S.dur);
    const heat = heatAt(P, local, pulse, u);
    const lum = lerp(P.lum[0], P.lum[1], smoothstep(0, 1, u)) * (0.6 + 0.4 * heat);
    return { P, local, cam, tau, heat, lum, u };
  },
  render(E, S, target) {
    const F = this.frameState(E, S);
    const { P, cam } = F;
    const d = { ...DISK, ...P.disk };
    const vt = E.target('vortexVol', P.vol);
    E.draw(this.vol, {
      ...cam.uniforms,
      uTau: F.tau, uOmega: d.omega, uCycle: d.cycle, uRin: d.rin, uRout: d.rout, uH0: d.h0, uFlare: d.flare,
      uRimPuff: d.rimPuff, uDens: d.dens, uDensExp: d.densExp, uTout: d.tout, uTinK: d.tinK, uHeat: F.heat, uTurb: d.turb,
      uArms: d.arms, uArmM: d.armM, uArmPitch: d.armPitch, uArmSpeed: d.armSpeed,
      uCurtain: d.curtain, uCurtainSpin: d.curtainSpin, uDwarfSurf: d.dwarfSurf,
      uHot: d.hot, uHotPhi: d.hotPhi, uStreamDir: v3.norm(d.streamDir), uStreamW: d.streamW,
      uShutter: d.shutter, uRb: d.rb, uLod: d.lod, uStepK: d.stepK, uSeedV: P.seed ?? 1, uEdgeFade: d.edgeFade,
      uGrain3: d.grain3, uIrr: d.irr, uArmFloor: d.armFloor, uArmHeat: d.armHeat, uVoid: d.void, uPuff: d.puff, uFloor: d.floor, uSheet: d.sheet, uSheetHeat: d.sheetHeat, uColdGas: d.coldGas, uSheetW: d.sheetW, uMaxSteps: d.maxSteps, uSheetMask: d.sheetMask, uFloorMid: d.floorMid, uDebug: P.debug || 0, uJitFix: P.jitFix ?? -1, uKr: d.kr, uKy: d.ky, uDwarfPos: [0, 0, 0], uDwarfR: d.dwarfR, uDwarfLum: F.lum,
    }, vt);
    E.draw(this.comp, { ...cam.uniforms, uVol: vt, uStarGain: d.starGain }, target);
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
