// PLASMA: macro inserts of matter under extreme conditions (Oppenheimer-style tactile fire).
// Three families, all with real depth (raymarched volume + depth-of-field gather + canvas strokes in 3D):
//   boil       convecting emissive plasma slab, cellular, crimson -> gold, cores clipping white
//   filaments  cold-blue magnetic field lines twisting/tightening around a hot core, snapping & reconnecting
//   sparks     incandescent particle showers (motion-blurred 3D streaks) over glowing plasma
// Passes: volume (alpha = depth, reduced scale) -> DOF gather -> composite with the canvas overlay (HDR decode).
import { frag } from '../engine/glsl.js';
import { PLASMA_COMMON, BOIL, VOLBOIL, CORE, DOF, COMP } from './lib/plasma-glsl.js';
import { camFromKeys, camera, keys, v3 as E3 } from './lib/util.js';
import { drawFilaments, drawSparks } from './lib/plasma-strokes.js';
import { SoftLines } from './lib/plasma-lines.js';
import { PRESETS } from './lib/plasma-presets.js';

const FS_BOIL = frag(PLASMA_COMMON, BOIL, `
void main(){
  vec3 rd = cameraRay(frameUV());
  float depth;
  vec3 c = boilMarch(uCamPos, rd, depth);
  fragColor = vec4(c, depth);
}`);

const FS_VOL = frag(PLASMA_COMMON, VOLBOIL, `
void main(){
  vec3 rd = cameraRay(frameUV());
  float depth;
  vec3 c = volMarch(uCamPos, rd, depth);
  fragColor = vec4(c, depth);
}`);

const FS_CORE = frag(PLASMA_COMMON, CORE, `
void main(){
  vec3 rd = cameraRay(frameUV());
  float depth;
  vec3 c = coreShade(uCamPos, rd, depth);
  fragColor = vec4(c, depth);
}`);

const FS_DOF = frag(DOF);
const FS_COMP = frag(COMP);

// local time, tolerant of dissolves
const lt = (S) => Math.max(-0.25, Math.min(S.dur + 0.25, S.local));

// authored key time: with P.timeU, camera keys / events / flashes are fractions of the shot duration
// (presets survive re-timing of the plan); evolution rates stay in seconds
const kt = (P, S) => (P.timeU ? lt(S) / Math.max(S.dur, 1e-3) : lt(S));
const at = (P, S, x) => (P.timeU ? x * S.dur : x);

// camera from keys + deterministic macro vibration (Oppenheimer jitter)
function camAt(P, S) {
  const t = lt(S);
  const c = camFromKeys(P.cam, kt(P, S));
  const v = P.vibrate || 0;
  if (!v) return c;
  const f = (a, b) => Math.sin(t * a + b) * 0.6 + Math.sin(t * a * 2.37 + b * 1.9) * 0.4;
  const off = [f(23.0, 0.3) * v, f(19.0, 1.7) * v, f(17.0, 2.9) * v * 0.5];
  const pos = [c.pos[0] + off[0], c.pos[1] + off[1], c.pos[2] + off[2]];
  const rj = P.vibrateRot ?? 0.25; // rotational part of the jitter (radians per unit offset)
  const tgt = [pos[0] + c.fwd[0] + off[1] * rj, pos[1] + c.fwd[1] + off[0] * rj, pos[2] + c.fwd[2]];
  const fov = 2 * Math.atan(c.tanH) * 180 / Math.PI;
  return camera(pos, tgt, fov, 0, c.up);
}

function ventArray(v) {
  const out = new Float32Array(16);
  (v || []).slice(0, 4).forEach((e, i) => out.set([e[0], e[1], e[2], e[3] ?? 0.6], i * 4));
  return out;
}

function boilUniforms(P, t) {
  const B = P.boil || {};
  const evo = B.evo || [0, 0.5];
  const dr = B.drift || [0, 0, 0, 0];
  return {
    uEvo: evo[0] + evo[1] * t,
    uCell: B.cell ?? 1,
    uDrift: [dr[0] + dr[2] * t, dr[1] + dr[3] * t],
    uWarp: B.warp ?? 1,
    uRelief: B.relief ?? 0.2,
    uHeat: B.heat ?? 0,
    uHeatGain: B.heatGain ?? 1,
    uGain: B.gain ?? 1,
    uPlume: B.plume ?? 0,
    uPlumeH: B.plumeH ?? 0.08,
    uRise: (B.rise || 0) * t,
    uAbsorb: B.absorb ?? 3,
    uTMax: B.tmax ?? 12,
    uFog: B.fog ?? 0.05,
    uHaze: B.haze || [0.05, 0.004, 0.002],
    uDetail: B.detail ?? 1,
    uFlowSpin: B.flowSpin ?? 0,
    uSoft: B.soft ?? 0.05,
    uSigma: B.sigma ?? 18,
    uSkin: B.skin ?? 0.25,
    uFlowRate: B.flowRate ?? 1.5,
    uVents: ventArray(B.vents),
  };
}

function volUniforms(P, t) {
  const V = P.volume;
  const evo = V.evo || [0, 0.5];
  return {
    uEvo: evo[0] + evo[1] * t,
    uCell: V.cell ?? 1,
    uWarp: V.warp ?? 1,
    uHeat: V.heat ?? 0,
    uHeatGain: V.heatGain ?? 1,
    uGain: V.gain ?? 1,
    uRise: (V.rise || 0) * t,
    uRiseDir: V.riseDir || [0, 1, 0],
    uTMax: V.tmax ?? 6,
    uNear: V.near ?? 0.2,
    uFog: V.fog ?? 0.05,
    uHaze: V.haze || [0.01, 0.001, 0.0005],
    uDetail: V.detail ?? 1,
    uSigma: V.sigma ?? 2,
    uEmis: V.emis ?? 1,
    uFlowSpin: V.flowSpin ?? 0,
  };
}

function coreUniforms(P, t) {
  const C = P.core || {};
  return {
    uCoreC: C.pos || [0, 0, 0],
    uCoreR: C.r ?? 0.5,
    uCoreHeat: C.heat ?? 0.95,
    uCoreGlow: C.glow ?? 1,
    uEvo: (C.evo || [0, 0.6])[0] + (C.evo || [0, 0.6])[1] * t,
    uSpin: (C.spin || [0, 0.4])[0] + (C.spin || [0, 0.4])[1] * t,
    uAxis: E3.norm(C.axis || [1, 0, 0]),
    uHazeCol: C.haze || [0.004, 0.012, 0.04],
    uHazeR: C.hazeR ?? 1.2,
    uRopeR: C.ropeR ?? 1,
    uGain: C.gain ?? 1,
  };
}

// depth of field; dof.track pulls focus to the camera target point (times dof.track as a factor)
function dofAt(P, S) {
  const D = P.dof || {};
  if (!D.track) return D;
  const t = kt(P, S);
  const pos = keys(P.cam.map((e) => [e[0], e[1], e[5]]), t);
  const tgt = keys(P.cam.map((e) => [e[0], e[2], e[5]]), t);
  return { ...D, focus: Math.hypot(tgt[0] - pos[0], tgt[1] - pos[1], tgt[2] - pos[2]) * D.track };
}

function flashAt(P, S) {
  // in-scene flashes (reconnection events): [time, amount, decay seconds]
  const t = lt(S);
  let a = 0;
  for (const [t0, amt, dec] of P.flashes || []) { const ts = at(P, S, t0); if (t >= ts) a += amt * Math.exp(-(t - ts) / (dec || 0.05)); }
  return a;
}

export default {
  id: 'plasma',
  scale: 1,
  presets: PRESETS,
  init(E) {
    this.pBoil = E.program(FS_BOIL, 'plasma.boil');
    this.pCore = E.program(FS_CORE, 'plasma.core');
    this.pVol = E.program(FS_VOL, 'plasma.vol');
    this.lines = new SoftLines(E.G.gl);
    this.pDof = E.program(FS_DOF, 'plasma.dof');
    this.pComp = E.program(FS_COMP, 'plasma.comp');
  },
  render(E, S, target) {
    const P = S.params;
    const t = lt(S);
    const cam = camAt(P, S);
    const rs = P.rmScale ?? 0.6;
    const A = E.target('plasmaRM', rs), B = E.target('plasmaDOF', rs);
    if (P.kind === 'filaments') E.draw(this.pCore, { ...cam.uniforms, ...coreUniforms(P, t) }, A);
    else if (P.volume) E.draw(this.pVol, { ...cam.uniforms, ...volUniforms(P, t) }, A);
    else E.draw(this.pBoil, { ...cam.uniforms, ...boilUniforms(P, t) }, A);
    const D = dofAt(P, S);
    const k = A.w / 1920;
    const maxCoc = (D.max ?? 0) * k;
    E.draw(this.pDof, { uSrc: A, uFocus: D.focus ?? 3, uAperture: (D.aperture ?? 0) * k, uMaxCoc: maxCoc, uTaps: maxCoc < 10 ? 24 : maxCoc < 16 ? 32 : 40 }, B);
    // filaments / sparks as soft HDR geometry at full output resolution
    const strokes = P.kind === 'filaments' || P.kind === 'sparks';
    const Lt = strokes ? E.target('plasmaLines', 1) : null;
    if (strokes) {
      this.lines.begin(Lt.w, Lt.h);
      const Pd = { ...P, dof: { ...D, focus: D.focus ?? 3 } };
      if (P.fil && P.fil.events) Pd.fil = { ...P.fil, events: P.fil.events.map((e) => ({ ...e, t: at(P, S, e.t) })) };
      if (P.sparks) Pd.sparks = { ...P.sparks, window: [P.sparks.window?.[0] ?? -1.5, Math.max(P.sparks.window?.[1] ?? 0, S.dur + 0.05)] };
      if (P.kind === 'filaments') drawFilaments(this.lines, cam, t, Pd, Lt.w, Lt.h, S);
      else drawSparks(this.lines, cam, t, Pd, Lt.w, Lt.h, S);
      this.lines.flush(Lt);
    }
    const ov = P.overlay || {};
    E.draw(this.pComp, {
      uSrc: B, uLines: Lt || B, uHasLines: strokes ? 1 : 0,
      uLineGain: ov.gain ?? 1, uLineAbsorb: ov.absorb ?? 0,
      uFlash: flashAt(P, S), uFlashCol: P.flashCol || [0.5, 0.75, 1.0],
    }, target);
  },
  post(E, S) {
    const P = S.params;
    const t = lt(S);
    const out = { ...(P.post || {}) };
    if (P.postKeys) for (const [k, list] of Object.entries(P.postKeys)) out[k] = E.math.keys(list, kt(P, S));
    // plan / sandbox post overrides win over the preset
    for (const k of Object.keys(S.shot.post || {})) delete out[k];
    return out;
  },
};
