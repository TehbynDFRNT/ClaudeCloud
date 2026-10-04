// THE MARBLE FIGURE: a single statue on black, turning its gaze toward us across the whole film.
// Sixteen inserts (M01-M16) cut into the cosmic photography. Each is one cinematic angle on the same head; the head's
// yaw is a function of the FILM frame (params.turn = [fromFrame, toFrame, 90, 0]): pure profile at the first sight,
// looking straight down the lens at the end of M16, so every glimpse shows the gaze a little further round.
//
// Figures (params.figure): 'david' (Michelangelo, cold blue-silver), 'sol' (Alexander-Helios, molten gold, his lost
// bronze sun-rays restored as shafts of light from the drilled diadem holes), 'prometheus' (a Pergamon giant, ember
// firelight from below). Meshes: media/scenes/statue/<figure>.json + .bin (tools/prepare_statues.py), head space
// documented in lib/statue-mesh.js.
//
// Rendering (raw WebGL2 inside the scene; every bit of GL state is restored for the engine afterwards):
//   1. key-light shadow map (depth only, orthographic, fitted to the shot; the key is locked to the head for the
//      length of one insert, < 1 deg of turn, so the map is cached per shot)
//   2. G-buffer: head-space position, normal, baked AO / cavity / thickness / skin (mesh raster, depth tested)
//   3. marble lighting, once per pixel: PCF hard key + translucent-shadow-map light bleed, wrapped diffuse, low-gloss
//      GGX, faint object-space veining, dim fill, lens-axis fill, coloured rims with light through thin edges,
//      ember under-light (Prometheus), the crown's own light on the curls (Sol)
//   4. quarter-res coverage -> blurred glows (the aura)  5. Sol: the radiate crown
//   6. composite into the scene target: FXAA'd marble + aura (silhouette glow + corona with slow streamers) + crown
//
// Preset params (keyframes [[u, value, easing?], ...] with u = 0 first .. 1 last frame of the insert):
//   aim (head-space point: anchor name | [x,y,z] | {name: weight} | {at, off}), height (visible FULL-frame height at the
//   aim point, head units), fov (deg), az / el (camera direction from the aim point; az from the viewer axis toward
//   screen-right), screen [sx, sy] (frameUV of the aim point), roll, drift,
//   key / fill / rim / rim2 / under: [az, el, intensity, 'face'?] in the studio frame (az 90 = screen-right; 'face':
//   az from the figure's face axis), front (lens fill),
//   aura: { glow, wide, corona, streaks, at (head-space centre), r (corona radius, head units) }, gain, grad, shadowR,
//   spot / spotR (where the light falls away below the neck / around the head), dof (lens aperture, head units; focus on
//   the aim point), rays (Sol: intensity multiplier), byFigure { david|sol|prometheus: {...} }, post {...},
//   debug (lighting channel views: 1 key visibility, 2 thickness, 3 ao, 4 normal, 5 cavity/thickness/skin, 6 veins,
//   7 diffused visibility, 10 key terms, 11 irradiance)
import { v3, clamp, ease } from '../engine/math.js';
import { meshProgram, bindUniforms, drawFullscreen, depthTarget, depthSamplers, saveState, restoreState } from './lib/statue-gl.js';
import { loadFigure, getFigure, gpuFigure, resolvePoint, drawClusters } from './lib/statue-mesh.js';
import { turnYaw, rotY, dirAzEl, kv, statueCamera, viewProj, yawMat4, mul4, shadowMatrix, letterboxAt } from './lib/statue-rig.js';
import { GBUF_VS, GBUF_FS, SHADOW_VS, SHADOW_FS, LIGHT_FS, MOMENTS_FS, VBLUR_FS, DOWN4_FS, BLUR_FS, RAYS_FS, COMP_FS } from './lib/statue-glsl.js';

const TURN = [508, 3590, 90, 0];
const SHADOW_SIZE = 1536;

// Per-figure light and stone. Colours linear; intensities scale the preset light intensities.
const FIGURES = {
  // cold blue-silver: the white dwarf's cold blue
  david: {
    key: [1.0, 0.99, 1.02], fill: [0.05, 0.075, 0.13], rim: [0.42, 0.66, 1.0], rim2: [0.62, 0.74, 0.95], front: [0.85, 0.9, 1.0],
    under: [0, 0, 0], amb: [0.0012, 0.0018, 0.0032],
    aura: [0.24, 0.46, 1.0], aura2: [0.62, 0.78, 1.0], tint: [1.0, 0.975, 0.94], sss: [0.95, 0.94, 0.94], mfp: [0.0195, 0.018, 0.0168],
  },
  // molten gold radiance; the crown of rays (the stone stays white: the gold lives in the rims, aura and rays)
  sol: {
    key: [1.0, 0.99, 0.97], fill: [0.06, 0.047, 0.036], rim: [1.0, 0.6, 0.2], rim2: [1.0, 0.76, 0.42], front: [1.0, 0.94, 0.86],
    under: [0, 0, 0], amb: [0.0024, 0.0015, 0.0006],
    aura: [1.0, 0.5, 0.12], aura2: [1.0, 0.78, 0.42], tint: [1.0, 0.984, 0.965], sss: [1.0, 0.95, 0.88], mfp: [0.02, 0.018, 0.0165],
    rays: { col: [1.0, 0.6, 0.2], core: [1.0, 0.88, 0.66], I: 1.5, len: 0.72, w0: 0.016, w1: 0.085, fall: 1.6, lift: 38 },
    holes: { col: [1.0, 0.6, 0.22], I: 0.3, r: 0.07 },
  },
  // ember gold-crimson firelight from below (the stolen fire), a faint flicker. The ember is a hot, low glow on the
  // beard, nostrils and under-planes that is gone by the brow (underH); the shadow side stays as deep as David's and
  // the fire lives mainly in the rims and the aura, which flicker with it.
  prometheus: {
    key: [0.92, 0.92, 0.94], fill: [0.03, 0.022, 0.02], rim: [0.85, 0.3, 0.09], rim2: [0.9, 0.42, 0.13], front: [1.0, 0.94, 0.9],
    under: [1.0, 0.3, 0.055], underI: 0.32, underH: [-0.46, -0.16, 3], amb: [0.0016, 0.0007, 0.0005], marble: { gloss: 0.42, veins: 0.6 },
    aura: [0.9, 0.22, 0.04], aura2: [1.0, 0.55, 0.16], tint: [1.0, 0.985, 0.965], sss: [1.0, 0.96, 0.92], mfp: [0.02, 0.018, 0.0165],
  },
};

// shot-start defaults shared by all inserts
const BASE = {
  turn: TURN, aim: 'eyes', height: 1.0, fov: 20, az: 0, el: 0, screen: [0, 0], roll: 0, drift: 0.6,
  key: [40, 38, 1.4], fill: [-70, -5, 0.1], rim: [-165, 14, 0.9], rim2: [165, 8, 0.7], under: [10, -52, 0], front: 0.006,
  aura: { glow: 0.25, wide: 0.12, corona: 0.06, streaks: 0.6, at: { at: 'head', off: [0, 0.04, -0.05] }, r: 0.75 },
  gain: 1.0, grad: null, rays: 1.0, shadowR: null, spot: [-0.8, -0.38], dof: 0,
  marble: { veins: 0.8, veinScale: 2.0, gloss: 0.7, sss: 1.0 },
};

// The inserts. Yaw (deg, 90 = profile facing screen-right, 0 = into the lens) at each shot is noted; the camera stays
// within a few degrees of the viewer axis so the turn of the gaze reads continuously from cut to cut.
const PRESETS = {
  // yaw 90. First sight: pure profile, ECU of the eye and brow. The eye sits on the left third, the profile line
  // (brow, nose bridge, nose) at 0.55-0.8 with looking room ahead of it, drawn by a grazing rim and the aura; the eye
  // modelled by a low top light.
  M01: {
    dof: 0.016,
    aim: { at: 'eyeR', off: [0, 0.03, 0.03] }, height: [[0, 0.72], [1, 0.65]], fov: 14, el: 2, screen: [-0.12, 0.03],
    key: [62, 50, 0.75], rim: [165, 12, 2.2], rim2: [-160, 20, 0.5], fill: [-70, -5, 0.05], front: 0.003,
    aura: { glow: 0.6, wide: 0.3, corona: 0.0 },
    // Prometheus: the key from where the face looks, so the profile's front planes catch it and the near cheek falls
    // into shadow (from the camera side his weathered relief goes flat)
    byFigure: { prometheus: { rim: [165, 12, 1.5], key: [108, 36, 1.0] }, sol: { key: [58, 40, 0.95] } },
  },
  // yaw 81. The profile again, closer: lips and jaw raked by hard light.
  M02: {
    dof: 0.018,
    aim: { mouth: 0.55, chin: 0.45 }, height: [[0, 0.72], [1, 0.66]], fov: 16, el: -5, screen: [-0.2, 0.0],
    key: [62, 30, 1.6], rim: [-165, 12, 0.8], rim2: [165, 7, 0.9],
    byFigure: { prometheus: { key: [78, 58, 1.7] } },   // steep top light: lips and beard modelled, not washed flat
  },
  // yaw 72. Head and neck against the void, the aura behind.
  M03: {
    aim: { at: 'head', off: [0, -0.18, 0] }, height: [[0, 2.15], [1, 2.05]], fov: 22, el: 3, screen: [0.04, 0.0],
    key: [25, 50, 1.2], rim: [-165, 15, 1.2], rim2: [165, 9, 0.9],
    aura: { glow: 0.42, wide: 0.12, corona: 0.16, r: 0.8 },
  },
  // yaw 66. The carved eye, beginning to come round.
  M04: {
    dof: 0.022,
    aim: 'eyeR', height: [[0, 0.54], [1, 0.49]], fov: 14, el: 1, screen: [-0.1, 0.0],
    key: [22, 38, 1.35, 'face'], rim: [-165, 12, 0.6], rim2: [165, 7, 0.7],
    byFigure: { prometheus: { key: [0, 42, 1.4, 'face'] } },   // top light: the brow hoods the deep-set eye
  },
  // yaw 60. Small in the black: head and shoulders, light from above.
  M05: {
    aim: { at: 'head', off: [0, -0.32, 0] }, height: [[0, 3.7], [1, 3.55]], fov: 26, el: 8, screen: [0, -0.02],
    key: [10, 66, 1.6], rim: [-165, 17, 0.8], rim2: [165, 15, 0.6], fill: [-70, -5, 0.09], spot: [-0.8, -0.35],
    aura: { glow: 0.45, wide: 0.15, corona: 0.2, r: 0.85 },
  },
  // yaw 49. Brow and eye from below.
  M06: {
    dof: 0.02,
    aim: { at: { eyeR: 0.7, eyeL: 0.3 }, off: [0, 0.06, 0] }, height: [[0, 0.82], [1, 0.76]], fov: 17, el: -24, az: 0, screen: [-0.05, 0.08],
    key: [35, 58, 1.6, 'face'], rim: [-165, 10, 0.7], rim2: [165, 6, 0.7],
  },
  // yaw 44. Frenzy beat: the eye. Not M04 again: an extreme close-up of the iris and lids alone, tilted (dutch), from a
  // little above, the eye just right of centre, punching in.
  M07: {
    dof: 0.01,
    aim: 'eyeR', height: [[0, 0.32], [1, 0.26, 'outQuad']], fov: 12, el: 4, roll: [[0, -5], [1, -7.5]], screen: [0.1, -0.03],
    key: [24, 27, 1.5, 'face'], rim: [-165, 12, 0.75], rim2: [165, 7, 0.8], drift: 1.0,
    // Prometheus' weathered eye needs its brow and socket around it to read
    byFigure: { david: { aim: 'pupilR' }, prometheus: { height: [[0, 0.46], [1, 0.39, 'outQuad']], key: [20, 20, 1.4, 'face'] } },
  },
  // yaw 40. Frenzy beat: the lips.
  M08: {
    dof: 0.022,
    aim: 'lips', height: [[0, 0.5], [1, 0.44, 'outQuad']], fov: 13, el: -3, screen: [-0.04, 0.0],
    key: [38, 26, 1.6, 'face'], rim: [-165, 10, 0.7], rim2: [165, 6, 0.9], drift: 1.0,
  },
  // yaw 38. Frenzy flash: the gaze. A surge of the rim and aura that dies over the nine frames (no white flash).
  M09: {
    dof: 0.016,
    aim: 'eyes', height: [[0, 0.68], [1, 0.63]], fov: 15, el: 1, screen: [0, 0.03],
    key: [35, 40, 1.6, 'face'], rim: [-165, 12, [[0, 2.4], [1, 0.8, 'outQuad']]], rim2: [165, 7, [[0, 2.1], [1, 0.7, 'outQuad']]],
    aura: { glow: [[0, 1.2], [1, 0.4, 'outQuad']], wide: [[0, 0.6], [1, 0.2, 'outQuad']], corona: 0.0 },
  },
  // yaw 36 -> 35. The held breath: a slow push on the three-quarter face.
  M10: {
    dof: 0.01,
    aim: 'face', height: [[0, 1.3], [1, 1.06, 'inOutSine']], fov: 19, el: 2, az: 0, screen: [0, 0.04],
    key: [30, 36, 1.45, 'face'], rim: [-165, 14, 0.9], rim2: [165, 7, 0.65], fill: [-60, 0, 0.12],
  },
  // yaw 31. Between strikes: the face, hard light.
  M11: {
    aim: 'face', height: [[0, 1.02], [1, 0.97]], fov: 17, el: 0, screen: [0, 0.02],
    key: [55, 18, 1.8, 'face'], rim: [-165, 10, 0.8], rim2: [165, 6, 0.3], fill: [-70, 0, 0.06],
  },
  // yaw 27. Both eyes now, almost upon us.
  M12: {
    dof: 0.014,
    aim: 'eyes', height: [[0, 0.98], [1, 0.92]], fov: 17, el: 1, screen: [0, 0.05],
    key: [-55, 40, 1.5, 'face'], rim: [-165, 14, 0.7], rim2: [165, 9, 0.7],
  },
  // yaw 18. Amid the eruption: the face, still, in its aura (full 9:16 from here).
  M13: {
    aim: { at: 'head', off: [0, 0.0, 0] }, height: [[0, 2.1], [1, 2.0]], fov: 22, el: 2, screen: [0, 0.05],
    key: [-46, 45, 1.3, 'face'], rim: [-165, 15, 1.3], rim2: [165, 12, 1.1],
    aura: { glow: 0.5, wide: 0.18, corona: 0.3, r: 0.85 },
  },
  // yaw 12. Expansion: the face nearly turned to us, seen from below (the figure looks down on us), a steep key from
  // above so the brow hoods the eyes: a different shot from M16's level, open stare.
  M14: {
    aim: { at: 'eyes', off: [0, -0.1, 0] }, height: [[0, 1.02], [1, 0.95]], fov: 18, el: -13, screen: [0, 0.1],
    key: [-36, 54, 1.55, 'face'], rim: [-165, 14, 0.85], rim2: [165, 7, 0.75], front: 0.004,
  },
  // yaw 6.5. A breath from direct.
  M15: {
    dof: 0.012,
    aim: 'eyes', height: [[0, 0.9], [1, 0.84]], fov: 17, el: 0, screen: [0, 0.04],
    key: [-38, 36, 1.5, 'face'], rim: [-165, 12, 0.7], rim2: [165, 7, 0.7],
  },
  // yaw 0. THE GAZE: straight down the lens, a slow push from the close-up toward the eyes, staring into you. The end
  // title sits at ~0.84H: the neck falls away into black under it.
  M16: {
    dof: [[0, 0.008], [1, 0.016]],
    aim: 'eyes', height: [[0, 1.45], [1, 0.86, 'inOutSine']], fov: [[0, 17], [1, 15]], el: 0, screen: [[0, [0, 0.3]], [1, [0, 0.17]]], drift: 0.35,
    // a lower key and a lens-axis eye-light rising over the push, so both eyes register in the stare
    key: [-28, 27, 1.5, 'face'], rim: [-165, 14, 0.8], rim2: [165, 9, 0.75], spot: [-0.85, -0.45], front: [[0, 0.004], [0.5, 0.014]],
    aura: { glow: 0.38, wide: 0.12, corona: 0.16, r: 0.8 },
    grad: [-0.26, -0.6, 0.95],
    // Sol: open on the whole radiate crown, then push into the eyes
    byFigure: { sol: { height: [[0, 2.3], [1, 0.86, 'inOutSine']], screen: [[0, [0, 0.12]], [1, [0, 0.17]]], aura: { glow: 0.45, wide: 0.15, corona: 0.28, r: 0.8 } } },
  },
  default: {},
};

// merge BASE <- preset <- plan params (aura and marble merge one level deep)
// a preset may carry byFigure: { david|sol|prometheus: {...} } overrides for one figure
function params(S, plan) {
  const fig = S.params.figure || defaultFigure(plan);
  const F = (S.params.byFigure && S.params.byFigure[fig]) || {};
  const P = { ...BASE, ...S.params, ...F };
  P.aura = { ...BASE.aura, ...(S.params.aura || {}), ...(F.aura || {}) };
  P.marble = { ...BASE.marble, ...(FIGURES[fig] && FIGURES[fig].marble || {}), ...(S.params.marble || {}), ...(F.marble || {}) };
  P.figure = fig;
  return P;
}

function defaultFigure(plan) {
  const c = (plan && (plan.cut || plan.id || '')) + '';
  if (c.includes('sol')) return 'sol';
  if (c.includes('prometheus')) return 'prometheus';
  return 'david';
}

// light spec [az, el, I, 'face'?] (I may be keyframed) -> { dir (world), I }. With 'face' the azimuth is measured from
// the figure's own face axis (meta.frame.facialForward at the given yaw) instead of the viewer axis, so one preset
// models every face alike (David's face is turned ~15 deg from his gaze; Sol and Prometheus look along theirs).
function light(spec, u, faceAz = 0) {
  if (!spec) return { dir: [0, 1, 0], I: 0 };
  const az = kv(spec[0], u, 0) + (spec[3] === 'face' ? faceAz : 0);
  return { dir: dirAzEl(az, kv(spec[1], u, 0)), I: kv(spec[2], u, 1) };
}
// azimuth (deg, studio frame) the face points along at head yaw `yaw`
function faceAzimuth(meta, yaw) {
  const f = (meta.frame && meta.frame.facialForward) || [0, 0, 1];
  return yaw + (Math.atan2(f[0], f[2]) * 180) / Math.PI;
}
const scl = (c, k) => [c[0] * k, c[1] * k, c[2] * k];

export default {
  id: 'statue',
  scale: 1,
  presets: PRESETS,

  // load the meshes the plan's statue shots use (before the first frame)
  async preload(plan) {
    const figs = new Set();
    for (const s of plan.shots || []) if (s.scene === 'statue') figs.add((s.params && s.params.figure) || defaultFigure(plan));
    await Promise.all([...figs].map((f) => loadFigure(f)));
  },

  init(E) {
    const G = E.G, gl = G.gl;
    this.gbufProg = meshProgram(gl, GBUF_VS, GBUF_FS, 'statue.gbuf');
    this.shadowProg = meshProgram(gl, SHADOW_VS, SHADOW_FS, 'statue.shadow');
    this.lightProg = G.program(LIGHT_FS, 'statue.light');
    this.momentsProg = G.program(MOMENTS_FS, 'statue.moments');
    this.vblurProg = G.program(VBLUR_FS, 'statue.vblur');
    this.down4Prog = G.program(DOWN4_FS, 'statue.down4');
    this.blurProg = G.program(BLUR_FS, 'statue.blur');
    this.raysProg = G.program(RAYS_FS, 'statue.rays');
    this.compProg = G.program(COMP_FS, 'statue.comp');
    this.samplers = depthSamplers(gl);
    this.fbos = new Map();
    this.shadowKey = null;
    this.vsm = null;
  },

  _u(S) { return clamp(S.local / Math.max(S.dur - 1 / S.fps, 1e-3)); },

  render(E, S, target) {
    const G = E.G;
    const st = saveState(G);
    try { this._render(E, S, target); } finally { restoreState(G, st); }
  },

  _render(E, S, target) {
    const G = E.G, gl = G.gl;
    const P = params(S, E.plan);
    const figId = P.figure;
    const FIG = FIGURES[figId];
    const fig = getFigure(figId);
    const meta = fig.meta;
    const mesh = gpuFigure(G, fig);
    const u = this._u(S);
    const w = target.w, h = target.h;
    const turn = P.turn || TURN;
    const yaw = turnYaw(turn, S.f);
    // the key is locked to the head at the shot's first frame while the head barely moves within the shot (one cached
    // shadow map per shot); when the figure visibly turns inside the shot the head turns under the studio's lights, so
    // the shadows follow it frame by frame
    const turning = Math.abs(turnYaw(turn, S.shot.end - 1) - turnYaw(turn, S.shot.start)) > 0.5;
    const yawRef = turning ? yaw : turnYaw(turn, S.shot.start);
    const t = S.t;

    // ---- camera
    const C = statueCamera(E, meta, P, yaw, u, t);
    const cam = C.cam;
    const aspect = E.W / E.H;
    const near = Math.max(0.02, C.dist - 1.6), far = C.dist + 1.8;
    const mvp = mul4(viewProj(cam, aspect, near, far), yawMat4(yaw));
    const camH = rotY(cam.pos, -yaw), fwdH = rotY(cam.fwd, -yaw);

    // ---- lights (studio frame -> head space)
    const key = light(P.key, u, faceAzimuth(meta, yawRef)), fill = light(P.fill, u), rim = light(P.rim, u), rim2 = light(P.rim2, u), under = light(P.under, u);
    // under light: the preset's intensity, or the figure's own default (Prometheus' ember)
    let underI = (P.under && P.under[2] ? under.I : FIG.underI || 0), auraFl = 1, rim2Fl = 1;
    if (figId === 'prometheus') {
      // the stolen fire below: a faint, deterministic flicker (film time), breathing in the ember rim and aura too
      const fl = 1 + 0.10 * Math.sin(t * 7.3) + 0.07 * Math.sin(t * 12.9 + 1.3) + 0.05 * Math.sin(t * 23.1 + 2.1) + 0.03 * Math.sin(t * 37.7 + 0.4);
      underI *= fl;
      auraFl = 0.55 + 0.45 * fl;
      rim2Fl = 0.7 + 0.3 * fl;
    }
    const keyH = rotY(key.dir, -yawRef);
    const toH = (d) => rotY(d, -yaw);

    // ---- shadow map (cached per shot: the key is fixed in head space for the insert)
    const lb = letterboxAt(E.plan, S.f, ease.inOutCubic);
    const shC = resolvePoint(meta, P.shadowAt || P.aim || 'eyes');
    const shR = P.shadowR || clamp(kv(P.height, 0, 1) * 0.62 + 0.12, 0.28, 1.15);
    const bc = [0, -0.2, -0.05], br = 1.25;
    const SM = shadowMatrix(keyH, shC, shR, bc, br);
    const skey = `${figId}|${keyH.map((x) => x.toFixed(6))}|${shC}|${shR}|${P.diffusion ?? 0.008}`;
    const sh = depthTarget(gl, this.fbos, 'shadow', SHADOW_SIZE, SHADOW_SIZE, [], { depthTexture: true });
    if (this.shadowKey !== skey) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, sh.fbo);
      gl.viewport(0, 0, SHADOW_SIZE, SHADOW_SIZE);
      gl.disable(gl.SCISSOR_TEST); gl.disable(gl.BLEND);
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS); gl.depthMask(true);
      gl.clearDepth(1); gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1.5, 3.0);
      bindUniforms(G, this.shadowProg, { uLMat: SM.m });
      gl.bindVertexArray(mesh.vao);
      // only casters inside the light's footprint can shadow what the map covers (orthographic along the light)
      const Lm = SM.m;
      drawClusters(gl, mesh, (cl) => {
        const x = Lm[0] * cl.c[0] + Lm[4] * cl.c[1] + Lm[8] * cl.c[2] + Lm[12];
        const y = Lm[1] * cl.c[0] + Lm[5] * cl.c[1] + Lm[9] * cl.c[2] + Lm[13];
        const rr = cl.r / shR;
        return Math.abs(x) <= 1 + rr && Math.abs(y) <= 1 + rr;
      });
      gl.disable(gl.POLYGON_OFFSET_FILL);
      gl.disable(gl.DEPTH_TEST); gl.depthMask(false); gl.disable(gl.CULL_FACE);
      // variance map: moments at half resolution, blurred to the diffusion length (separable)
      const vs = SHADOW_SIZE / 2;
      const va = depthTarget(gl, this.fbos, 'vsmA', vs, vs, ['rgba32f']), vb = depthTarget(gl, this.fbos, 'vsmB', vs, vs, ['rgba32f']);
      for (const rt of [va, vb]) for (const tex of rt.colors) { gl.bindTexture(gl.TEXTURE_2D, tex.tex); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); }
      drawFullscreen(G, this.momentsProg, { uDepth: { tex: sh.depth.tex, sampler: this.samplers.raw } }, va);
      // gaussian sigma ~ the diffusion length, in moment-map texels; every texel is sampled (no stride)
      const sig = clamp(1.06 * ((P.diffusion ?? 0.008) / (2 * shR)) * vs, 0.6, 15);
      const nT = Math.min(24, Math.ceil((3 * sig) / 2));
      drawFullscreen(G, this.vblurProg, { uSrc: { tex: va.colors[0].tex }, uDir: [1, 0], uSigma: sig, uN: nT }, vb);
      drawFullscreen(G, this.vblurProg, { uSrc: { tex: vb.colors[0].tex }, uDir: [0, 1], uSigma: sig, uN: nT }, va);
      this.vsm = va;
      this.shadowKey = skey;
    }

    // ---- G-buffer
    const gb = depthTarget(gl, this.fbos, 'gbuf', w, h, ['rgba32f', 'rgba16f', 'rgba8']);
    const m = Math.max(0, Math.floor((lb - 0.04) * h));
    const scissor = m > 0 ? [0, m, w, h - 2 * m] : null;
    gl.bindFramebuffer(gl.FRAMEBUFFER, gb.fbo);
    gl.viewport(0, 0, w, h);
    gl.disable(gl.SCISSOR_TEST); gl.disable(gl.BLEND);
    gl.depthMask(true); gl.clearDepth(1);
    gl.clearBufferfv(gl.COLOR, 0, [0, 0, 0, 0]);
    gl.clearBufferfv(gl.COLOR, 1, [0, 0, 0, 0]);
    gl.clearBufferfv(gl.COLOR, 2, [0, 0, 0, 0]);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    if (scissor) { gl.enable(gl.SCISSOR_TEST); gl.scissor(...scissor); }
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS);
    gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
    bindUniforms(G, this.gbufProg, { uMVP: mvp });
    gl.bindVertexArray(mesh.vao);
    {
      // frustum (the visible window only) and back-facing cluster culling, in head space
      const tx = cam.tanH * aspect, ty = cam.tanH * (scissor ? (h - 2 * m) / h : 1);
      const kx = Math.sqrt(1 + tx * tx), ky = Math.sqrt(1 + ty * ty);
      const R = rotY(cam.right, -yaw), U = rotY(cam.up, -yaw);
      drawClusters(gl, mesh, (cl) => {
        const d = [cl.c[0] - camH[0], cl.c[1] - camH[1], cl.c[2] - camH[2]];
        const z = v3.dot(d, fwdH), x = v3.dot(d, R), y = v3.dot(d, U);
        if (z < near - cl.r) return false;
        if (Math.abs(x) - z * tx > cl.r * kx || Math.abs(y) - z * ty > cl.r * ky) return false;
        // all normals within 54.7 deg of the bin axis: hidden if the axis points away from the camera by more than
        // 35.3 deg plus the cluster's angular radius
        const dl = Math.hypot(d[0], d[1], d[2]);
        if (dl > cl.r * 1.05) {
          const ang = Math.acos(Math.min(1, v3.dot(d, cl.axis) / dl)) + Math.asin(Math.min(1, cl.r / dl));
          if (ang < (35.26 * Math.PI) / 180) return false;
        }
        return true;
      });
    }
    gl.disable(gl.DEPTH_TEST); gl.depthMask(false);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.SCISSOR_TEST);

    // ---- marble lighting
    const litT = depthTarget(gl, this.fbos, 'lit', w, h, ['rgba16f', 'rgba8']);
    const lit = { fbo: litT.fbo, w, h, tex: litT.colors[0].tex };
    const aux = { tex: litT.colors[1].tex };
    gl.bindFramebuffer(gl.FRAMEBUFFER, litT.fbo);
    gl.clearBufferfv(gl.COLOR, 0, [0, 0, 0, 0]);
    gl.clearBufferfv(gl.COLOR, 1, [0, 0, 0, 0]);
    const holes = new Float32Array(21);
    let holeR = 0;
    let rayData = null;
    if (FIG.rays && meta.anchors.rayHoles) {
      rayData = this._rays(meta, FIG.rays);
      rayData.base.forEach((p, i) => { const q = v3.add(p, v3.mul(rayData.dirs[i], 0.035)); holes.set(q, i * 3); });
      holeR = FIG.holes.r;
    }
    const mb = P.marble;
    const front = kv(P.front, u, 0.006);
    drawFullscreen(G, this.lightProg, {
      uGP: { tex: gb.colors[0].tex }, uGN: { tex: gb.colors[1].tex }, uGB: { tex: gb.colors[2].tex },
      uSh: { tex: sh.depth.tex, sampler: this.samplers.cmp }, uVsm: { tex: this.vsm.colors[0].tex },
      uLMat: SM.m, uShDepth: SM.depthRange, uShTexel: (2 * shR) / SHADOW_SIZE, uShTexUV: 1 / SHADOW_SIZE, uPenUV: (P.penumbra ?? 0.0035) / (2 * shR),
      uCamH: camH, uFwdH: fwdH,
      uKeyDir: keyH, uKeyCol: scl(FIG.key, key.I),
      uFillDir: toH(fill.dir), uFillCol: scl(FIG.fill, fill.I),
      uRimDir: toH(rim.dir), uRimCol: scl(FIG.rim, rim.I),
      uRim2Dir: toH(rim2.dir), uRim2Col: scl(FIG.rim2, rim2.I * rim2Fl),
      uUnderDir: toH(under.dir), uUnderCol: scl(FIG.under, underI), uUnderH: P.underH || FIG.underH || [-0.4, 0.2, 1],
      uFrontCol: scl(FIG.front, front), uAmb: FIG.amb,
      uHoles: holes, uHoleCol: scl(FIG.holes ? FIG.holes.col : [0, 0, 0], FIG.holes ? FIG.holes.I * kv(P.rays, u, 1) * this._breath(t, 0) : 0), uHoleR: holeR,
      uMarble: [mb.veins, mb.veinScale, mb.gloss, mb.sss], uMfp: FIG.mfp, uTint: FIG.tint, uSssTint: FIG.sss, uDebug: P.debug | 0, uSpot: kv(P.spot, u, [-0.8, -0.38]), uSpotR: kv(P.spotR, u, [0.66, 0.92]), uCut: this._cuts(meta),
    }, lit, scissor);


    // ---- aura: quarter-res coverage, two blurred glows
    const w4 = Math.max(2, Math.round(w / 4)), h4 = Math.max(2, Math.round(h / 4));
    const w8 = Math.max(2, Math.round(w / 8)), h8 = Math.max(2, Math.round(h / 8));
    const m4 = G.target('statue.m4', w4, h4, 'rgba16f');
    const b4 = G.target('statue.b4', w4, h4, 'rgba16f');
    const g1 = G.target('statue.g1', w4, h4, 'rgba16f');
    const b8 = G.target('statue.b8', w8, h8, 'rgba16f');
    const g2 = G.target('statue.g2', w8, h8, 'rgba16f');
    drawFullscreen(G, this.down4Prog, { uSrc: lit, uAux: aux, uSrcRes: [w, h] }, m4);
    // radii in quarter / eighth-res texels, so they scale with the render size
    drawFullscreen(G, this.blurProg, { uSrc: m4, uSrcRes: [w4, h4], uDir: [1.6, 0] }, b4);
    drawFullscreen(G, this.blurProg, { uSrc: b4, uSrcRes: [w4, h4], uDir: [0, 1.6] }, g1);
    drawFullscreen(G, this.blurProg, { uSrc: g1, uSrcRes: [w4, h4], uDir: [4.0, 0] }, b8);
    drawFullscreen(G, this.blurProg, { uSrc: b8, uSrcRes: [w8, h8], uDir: [0, 2.2] }, g2);
    drawFullscreen(G, this.blurProg, { uSrc: g2, uSrcRes: [w8, h8], uDir: [2.6, 0] }, b8);
    drawFullscreen(G, this.blurProg, { uSrc: b8, uSrcRes: [w8, h8], uDir: [0, 2.6] }, g2);

    // ---- Sol: the radiate crown
    let rays = null;
    if (rayData) {
      const w2 = Math.max(2, Math.round(w / 2)), h2 = Math.max(2, Math.round(h / 2));
      rays = G.target('statue.rays', w2, h2, 'rgba16f');
      const R = FIG.rays;
      const pos = new Float32Array(21), dirs = new Float32Array(21), I = new Float32Array(7);
      const rk = kv(P.rays, u, 1);
      rayData.base.forEach((p, i) => {
        pos.set(rotY(v3.add(p, v3.mul(rayData.dirs[i], 0.006)), yaw), i * 3);
        dirs.set(rotY(rayData.dirs[i], yaw), i * 3);
        I[i] = R.I * rk * rayData.weight[i] * this._breath(t, i);
      });
      drawFullscreen(G, this.raysProg, {
        ...cam.uniforms, uLit: lit, uRayP: pos, uRayD: dirs, uRayI: I, uRayShape: [R.len, R.w0, R.w1, R.fall],
        uRayCol: R.col, uRayCore: R.core, uRayT: t,
      }, rays);
    }

    // ---- depth of field (close-ups): the lit marble blurred at half and quarter resolution
    const dofA = kv(P.dof, u, 0);
    let dofT = null;
    if (dofA > 0) {
      const k = E.k;
      const w2 = Math.max(2, Math.round(w / 2)), h2 = Math.max(2, Math.round(h / 2));
      const ha = G.target('statue.dofHa', w2, h2, 'rgba16f'), hb = G.target('statue.dofHb', w2, h2, 'rgba16f');
      const qa = G.target('statue.dofQa', w4, h4, 'rgba16f'), qb = G.target('statue.dofQb', w4, h4, 'rgba16f');
      drawFullscreen(G, this.blurProg, { uSrc: lit, uSrcRes: [w, h], uDir: [1.6 * k, 0] }, ha);
      drawFullscreen(G, this.blurProg, { uSrc: ha, uSrcRes: [w2, h2], uDir: [0, 0.8 * k] }, hb);
      drawFullscreen(G, this.blurProg, { uSrc: hb, uSrcRes: [w2, h2], uDir: [2.2 * k, 0] }, qa);
      drawFullscreen(G, this.blurProg, { uSrc: qa, uSrcRes: [w4, h4], uDir: [0, 1.1 * k] }, qb);
      dofT = { a: hb, b: qb };
    }

    // ---- composite into the scene target
    const A = P.aura;
    const ac = rotY(resolvePoint(meta, A.at || 'head'), yaw);
    const pr = cam.project(ac, E.W, E.H);
    const corona = pr ? [(pr.x / E.W) * 2 - 1, 1 - (pr.y / E.H) * 2] : [0, 0];
    const coronaR = pr ? cam.pixelRadius(ac, A.r ?? 0.75, E.H) / (E.H / 2) : 1;
    const grad = P.grad;
    // the engine's draw skips the letterbox rows; clear them so nothing from a previous frame reaches post's bloom
    // (frames must not depend on render order)
    G.clear(target);
    E.draw(this.compProg, {
      uLit: lit, uM4: m4, uG1: g1, uG2: g2, uRays: rays || m4, uHasRays: rays ? 1 : 0,
      uAuraCol: scl(FIG.aura, auraFl), uAuraCol2: scl(FIG.aura2, auraFl),
      uAura: [kv(A.glow, u, 0), kv(A.wide, u, 0), kv(A.corona, u, 0), kv(A.streaks, u, 0.6)],
      uCorona: corona, uCoronaR: coronaR, uGain: kv(P.gain, u, 1), uGrad: grad ? [grad[0], grad[1], grad[2], 0] : [0, -1, 0, 0],
      uAuraT: t,
      // CoC in 1080-px units: aperture (head units) x |d - s| / (d s) x (frame height in 1080-px units) / (2 tan(fov/2))
      uDof: dofT ? [dofA * (h / E.k) / (2 * cam.tanH), C.dist] : [0, 1], uDofA: dofT ? dofT.a : m4, uDofB: dofT ? dofT.b : m4,
    }, target);
  },

  // cut planes (other than the horizontal base) as vec4(normal, offset); unused slots get offset 99
  _cuts(meta) {
    if (meta._cutU) return meta._cutU;
    const out = new Float32Array(12).fill(0);
    for (let i = 0; i < 3; i++) out[i * 4 + 3] = 99;
    let k = 0;
    for (const c of (meta.frame && meta.frame.cuts) || []) {
      if (c.normal[1] < -0.99 || k >= 3) continue;
      const n = v3.norm(c.normal);
      out.set([n[0], n[1], n[2], v3.dot(n, c.point)], k * 4);
      k++;
    }
    meta._cutU = out;
    return out;
  },

  // slow breathing of the crown, per ray (film time, so it is continuous across inserts)
  _breath(t, i) { return 0.86 + 0.1 * Math.sin(t * 0.85 + i * 2.13) + 0.04 * Math.sin(t * 2.1 + i * 4.7); },

  // Sol's rays: spring from the drilled holes, radial off the diadem and lifted toward the sky (head space)
  _rays(meta, R) {
    if (this._rayCache && this._rayCache.meta === meta) return this._rayCache;
    const a = meta.anchors;
    const [rc] = a.diademRing;
    const lift = (R.lift ?? 38) * Math.PI / 180;
    const base = [], dirs = [], weight = [];
    a.rayHoles.forEach((p, i) => {
      const rad = v3.sub(p, rc); rad[1] = 0;
      const rh = v3.norm(rad);
      const n = v3.norm(a.rayHoleNormals[i]);
      let d = v3.add(v3.mul(rh, Math.cos(lift)), [0, Math.sin(lift), 0]);
      d = v3.norm(v3.add(v3.mul(d, 0.75), v3.mul(n, 0.25)));
      base.push(p); dirs.push(d);
      weight.push(1.0);
    });
    this._rayCache = { meta, base, dirs, weight };
    return this._rayCache;
  },

  post(E, S) {
    const P = S.params;
    const u = this._u(S);
    const out = { vignette: 0.42, bloomStrength: 0.1, bloomThreshold: 0.95, halation: 0.006, lift: 0.0 };
    for (const [k, v] of Object.entries(P.post || {})) out[k] = kv(v, u);
    return out;
  },
};

// expose for the review/edit tools
export { FIGURES, PRESETS, turnYaw };
