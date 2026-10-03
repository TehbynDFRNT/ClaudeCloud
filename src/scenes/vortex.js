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
void main(){
  vec2 uv = frameUV();
  vec3 rd = cameraRay(uv);
  vec3 ro = uCamPos;
  float pixAngle = 2.0 * uTanHalfFov / uRes.y;
  float jit = ign(gl_FragCoord.xy);
  vec2 hd = sphereHit(ro, rd, uDwarfPos, uDwarfR);
  bool hitD = hd.x < hd.y && hd.y > 0.0;
  float tMax = hitD ? max(hd.x, 0.0) : 60.0;
  float tD = length(uDwarfPos - ro);
  float trans, transD;
  vec3 col = vxMarch(ro, rd, tMax, jit, pixAngle, tD, trans, transD);
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
  vec3 bg = (starField(rd, pixAngle) + deepSky(rd)) * uStarGain;
  fragColor = vec4(v.rgb + bg * v.a, 1.0);
}`);

// ---------------------------------------------------------------- defaults
const DISK = {
  omega: 0.22, cycle: 2.4, rin: 0.075, rout: 1.0, h0: 0.075, flare: 1.18, rimPuff: 1.2,
  dens: 9.0, densExp: 1.1, tin: 11500, turb: 0.55, arms: 0.55, armM: 2, armPitch: 0.36, armSpeed: 0.05,
  curtain: 1.0, curtainSpin: 2.0, dwarfR: 0.014, dwarfSurf: 1.0, hot: 0, hotPhi: 2.2, streamDir: [0.6, 0, 0.8],
  streamW: 0.02, shutter: 0.0, rb: 1.25, lod: 0.004, stepK: 0.55, edgeFade: 0.3, grain3: 1.0, starGain: 0.7,
};

const P0 = {
  vol: 0.6, tau: [0, 1, 0], heat: [1, 0, 0.5, 0], lum: [1, 1], drift: [0, 0],
  post: { bloomStrength: 0.1, streakStrength: 0.06 },
};

const D = (o) => ({ ...P0, ...o, disk: { ...DISK, ...(o.disk || {}) }, post: { ...P0.post, ...(o.post || {}) } });

// ---------------------------------------------------------------- presets
const presets = {
  // a neutral oblique look-dev view
  default: D({ cam: [[0, [0, 0.85, 1.75], [0, -0.05, 0], 38]] }),
  'S12-engulf': D({
    vol: 0.6,
    cam: [
      [0, [0.0, 0.34, 1.05], [0, 0.0, 0], 62],
      [6.3, [0.18, 0.03, 0.70], [0, 0.0, 0], 74, -0.06],
    ],
    tau: [10, 1.0, 0],
    post: { blur: [10, 0] },
  }),
};

function tauAt(P, local) { const [a, b, c] = P.tau; return a + b * local + c * local * local; }

function heatAt(P, local, pulse) {
  const [base, amp, decay, pAmp] = P.heat;
  let h = base + (amp ? amp * Math.exp(-Math.max(0, local) / decay) : 0);
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
    const heat = heatAt(P, local, pulse);
    const u = clamp(local / S.dur);
    const lum = lerp(P.lum[0], P.lum[1], smoothstep(0, 1, u)) * (0.6 + 0.4 * heat);
    return { P, local, cam, tau, heat, lum, u };
  },
  render(E, S, target) {
    const F = this.frameState(E, S);
    const { P, cam } = F;
    const d = P.disk;
    const vt = E.target('vortexVol', P.vol);
    E.draw(this.vol, {
      ...cam.uniforms,
      uTau: F.tau, uOmega: d.omega, uCycle: d.cycle, uRin: d.rin, uRout: d.rout, uH0: d.h0, uFlare: d.flare,
      uRimPuff: d.rimPuff, uDens: d.dens, uDensExp: d.densExp, uTin: d.tin, uHeat: F.heat, uTurb: d.turb,
      uArms: d.arms, uArmM: d.armM, uArmPitch: d.armPitch, uArmSpeed: d.armSpeed,
      uCurtain: d.curtain, uCurtainSpin: d.curtainSpin, uDwarfSurf: d.dwarfSurf,
      uHot: d.hot, uHotPhi: d.hotPhi, uStreamDir: v3.norm(d.streamDir), uStreamW: d.streamW,
      uShutter: d.shutter, uRb: d.rb, uLod: d.lod, uStepK: d.stepK, uSeedV: P.seed ?? 1, uEdgeFade: d.edgeFade,
      uGrain3: d.grain3, uDwarfPos: [0, 0, 0], uDwarfR: d.dwarfR, uDwarfLum: F.lum,
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
