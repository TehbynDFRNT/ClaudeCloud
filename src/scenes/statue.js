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
//   4. FXAA (tonemapped space)  5. quarter-res coverage -> blurred glows (the aura)  6. Sol: the radiate crown
//   7. composite into the scene target: marble + aura (silhouette glow + corona with slow streamers) + crown
//
// Preset params (keyframes [[u, value, easing?], ...] with u = 0 first .. 1 last frame of the insert):
//   aim (head-space point: anchor name | [x,y,z] | {name: weight} | {at, off}), height (visible FULL-frame height at the
//   aim point, head units), fov (deg), az / el (camera direction from the aim point; az from the viewer axis toward
//   screen-right), screen [sx, sy] (frameUV of the aim point), roll, drift,
//   key / fill / rim / rim2 / under: [az, el, intensity] in the studio frame (az 90 = screen-right), front (lens fill),
//   aura: { glow, wide, corona, streaks, at (head-space centre), r (corona radius, head units) }, gain, grad, shadowR,
//   rays (Sol: intensity multiplier), post {...}
import { v3, clamp, ease } from '../engine/math.js';
import { meshProgram, bindUniforms, drawFullscreen, depthTarget, depthSamplers, saveState, restoreState } from './lib/statue-gl.js';
import { loadFigure, getFigure, gpuFigure, resolvePoint } from './lib/statue-mesh.js';
import { turnYaw, rotY, dirAzEl, kv, statueCamera, viewProj, yawMat4, mul4, shadowMatrix, letterboxAt } from './lib/statue-rig.js';
import { GBUF_VS, GBUF_FS, SHADOW_VS, SHADOW_FS, LIGHT_FS, FXAA_FS, DOWN4_FS, BLUR_FS, RAYS_FS, COMP_FS } from './lib/statue-glsl.js';

const TURN = [508, 3590, 90, 0];
const SHADOW_SIZE = 2048;

// Per-figure light and stone. Colours linear; intensities scale the preset light intensities.
const FIGURES = {
  // cold blue-silver: the white dwarf's cold blue
  david: {
    key: [1.0, 0.99, 1.02], fill: [0.05, 0.075, 0.13], rim: [0.42, 0.66, 1.0], rim2: [0.62, 0.74, 0.95], front: [0.85, 0.9, 1.0],
    under: [0, 0, 0], amb: [0.0012, 0.0018, 0.0032],
    aura: [0.24, 0.46, 1.0], aura2: [0.62, 0.78, 1.0], tint: [1.0, 1.0, 1.0], mfp: [0.018, 0.0165, 0.015],
  },
  // molten gold radiance; the crown of rays
  sol: {
    key: [1.04, 0.95, 0.82], fill: [0.07, 0.05, 0.035], rim: [1.0, 0.6, 0.2], rim2: [1.0, 0.76, 0.42], front: [1.0, 0.92, 0.8],
    under: [0, 0, 0], amb: [0.0024, 0.0015, 0.0006],
    aura: [1.0, 0.5, 0.12], aura2: [1.0, 0.78, 0.42], tint: [1.0, 0.985, 0.96], mfp: [0.019, 0.0165, 0.0145],
    rays: { col: [1.0, 0.62, 0.22], core: [1.0, 0.9, 0.7], I: 2.4, len: 0.62, w0: 0.012, w1: 0.05, fall: 1.8, lift: 38 },
    holes: { col: [1.0, 0.6, 0.22], I: 0.55, r: 0.075 },
  },
  // ember gold-crimson firelight from below (the stolen fire), a faint flicker
  prometheus: {
    key: [1.0, 0.95, 0.88], fill: [0.06, 0.035, 0.03], rim: [1.0, 0.36, 0.09], rim2: [1.0, 0.55, 0.2], front: [1.0, 0.9, 0.82],
    under: [1.0, 0.3, 0.07], amb: [0.0024, 0.0009, 0.0006],
    aura: [0.95, 0.26, 0.05], aura2: [1.0, 0.6, 0.2], tint: [1.0, 0.98, 0.95], mfp: [0.019, 0.016, 0.014],
  },
};

// shot-start defaults shared by all inserts
const BASE = {
  turn: TURN, aim: 'eyes', height: 1.0, fov: 20, az: 0, el: 0, screen: [0, 0], roll: 0, drift: 0.6,
  key: [40, 38, 1.39], fill: [-70, -5, 0.1], rim: [-165, 14, 0.9], rim2: [165, 8, 0.7], under: [0, -60, 0], front: 0.006,
  aura: { glow: 0.25, wide: 0.12, corona: 0.06, streaks: 0.6, at: { at: 'head', off: [0, 0.04, -0.05] }, r: 0.75 },
  gain: 1.0, grad: null, rays: 1.0, shadowR: null,
  marble: { veins: 0.32, veinScale: 2.2, gloss: 0.55, sss: 1.0 },
};

const PRESETS = {
  // First sight: pure profile, ECU of the eye and brow; the profile line is a silhouette drawn by the rim and the aura.
  M01: {
    aim: { at: 'eyeR', off: [0, 0.02, 0.02] }, height: [[0, 0.46], [1, 0.42]], fov: 13, el: 2, screen: [-0.28, 0.02],
    key: [70, 48, 0.3], rim: [160, 10, 1.8], rim2: [-165, 15, 0.4], fill: [-70, -5, 0.07], front: 0.0036,
    aura: { glow: 0.55, wide: 0.25, corona: 0.0 },
  },
  // The profile again, closer: lips and jaw raked by hard light.
  M02: {
    aim: { mouth: 0.6, chin: 0.4 }, height: [[0, 0.62], [1, 0.58]], fov: 16, el: -4, screen: [-0.16, 0.0],
    key: [60, 28, 1.6], rim: [-165, 12, 0.8], rim2: [165, 7, 0.6],
  },
  // Head and neck against the void, the aura behind.
  M03: {
    aim: { at: 'head', off: [0, -0.18, 0] }, height: [[0, 2.15], [1, 2.05]], fov: 22, el: 3, screen: [0.04, 0.0],
    key: [25, 50, 1.17], rim: [-165, 15, 1.2], rim2: [165, 9, 0.9],
    aura: { glow: 0.55, wide: 0.3, corona: 0.32, r: 0.8 },
  },
  // The carved eye, beginning to come round.
  M04: {
    aim: 'eyeR', height: [[0, 0.38], [1, 0.345]], fov: 13, el: 1, screen: [-0.12, 0.0],
    key: [22, 34, 1.5], rim: [-165, 12, 0.6], rim2: [165, 7, 0.7],
  },
  // Small in the black: head and shoulders, light from above.
  M05: {
    aim: { at: 'head', off: [0, -0.32, 0] }, height: [[0, 3.7], [1, 3.55]], fov: 26, el: 8, screen: [0, -0.02],
    key: [10, 76, 1.6], rim: [-165, 17, 0.8], rim2: [165, 15, 0.6], fill: [-70, -5, 0.09],
    aura: { glow: 0.6, wide: 0.35, corona: 0.4, r: 0.85 },
  },
  // Brow and eye from below.
  M06: {
    aim: { at: { eyeR: 0.7, eyeL: 0.3 }, off: [0, 0.05, 0] }, height: [[0, 0.66], [1, 0.62]], fov: 17, el: -24, az: 6, screen: [-0.05, 0.08],
    key: [20, 62, 1.6], rim: [-165, 10, 0.7], rim2: [165, 6, 0.7],
  },
  // Frenzy beat: the eye.
  M07: {
    aim: 'eyeR', height: [[0, 0.30], [1, 0.255, 'outQuad']], fov: 12, el: 2, screen: [-0.06, 0.02],
    key: [8, 32, 1.71], rim: [-165, 12, 0.75], rim2: [165, 7, 0.8], drift: 1.0,
  },
  // Frenzy beat: the lips.
  M08: {
    aim: 'lips', height: [[0, 0.36], [1, 0.31, 'outQuad']], fov: 13, el: -3, screen: [-0.04, 0.0],
    key: [-5, 30, 1.6], rim: [-165, 10, 0.7], rim2: [165, 6, 0.9], drift: 1.0,
  },
  // Frenzy flash: the gaze. A surge of the rim and aura that dies over the nine frames (no white flash).
  M09: {
    aim: 'eyes', height: [[0, 0.58], [1, 0.54]], fov: 15, el: 1, screen: [0, 0.03],
    key: [0, 36, 1.6], rim: [-165, 12, [[0, 2.4], [1, 0.8, 'outQuad']]], rim2: [165, 7, [[0, 2.1], [1, 0.7, 'outQuad']]],
    aura: { glow: [[0, 1.2], [1, 0.4, 'outQuad']], wide: [[0, 0.6], [1, 0.2, 'outQuad']], corona: 0.0 },
  },
  // The held breath: a slow push on the three-quarter face.
  M10: {
    aim: 'face', height: [[0, 1.3], [1, 1.06, 'inOutSine']], fov: 19, el: 2, az: -4, screen: [0, 0.04],
    key: [55, 36, 1.45], rim: [-165, 14, 0.9], rim2: [165, 7, 0.65], fill: [-60, 0, 0.12],
  },
  // Between strikes: the face, hard light.
  M11: {
    aim: 'face', height: [[0, 1.02], [1, 0.97]], fov: 17, el: 0, screen: [0, 0.02],
    key: [78, 18, 1.82], rim: [-165, 10, 0.8], rim2: [165, 6, 0.3], fill: [-70, 0, 0.06], front: 0.006,
  },
  // Both eyes now, almost upon us.
  M12: {
    aim: 'eyes', height: [[0, 0.98], [1, 0.92]], fov: 17, el: 1, screen: [0, 0.05],
    key: [-35, 40, 1.5], rim: [-165, 14, 0.7], rim2: [165, 9, 0.7],
  },
  // Amid the eruption: the face, still, in its aura (full 9:16 from here).
  M13: {
    aim: { at: 'head', off: [0, 0.0, 0] }, height: [[0, 2.1], [1, 2.0]], fov: 22, el: 2, screen: [0, 0.05],
    key: [-30, 45, 1.28], rim: [-165, 15, 1.3], rim2: [165, 12, 1.1],
    aura: { glow: 0.7, wide: 0.42, corona: 0.55, r: 0.85 },
  },
  // Expansion: the face nearly turned to us.
  M14: {
    aim: 'face', height: [[0, 1.35], [1, 1.27]], fov: 19, el: 1, screen: [0, 0.08],
    key: [-32, 38, 1.45], rim: [-165, 14, 0.8], rim2: [165, 7, 0.7],
  },
  // A breath from direct.
  M15: {
    aim: 'eyes', height: [[0, 0.9], [1, 0.84]], fov: 17, el: 0, screen: [0, 0.04],
    key: [-28, 36, 1.5], rim: [-165, 12, 0.7], rim2: [165, 7, 0.7],
  },
  // THE GAZE: straight down the lens, a slow push from the close-up toward the eyes, staring into you. The end title
  // sits at ~0.84H: the chest falls away into black under it.
  M16: {
    aim: 'eyes', height: [[0, 1.55], [1, 0.82, 'inOutSine']], fov: [[0, 17], [1, 15]], el: 0, screen: [[0, [0, 0.26]], [1, [0, 0.14]]], drift: 0.35,
    key: [-30, 36, 1.5], rim: [-165, 14, 0.8], rim2: [165, 9, 0.75],
    aura: { glow: 0.45, wide: 0.25, corona: 0.3, r: 0.8 },
    grad: [-0.3, -0.62, 0.92],
  },
  default: {},
};

// merge BASE <- preset <- plan params (aura and marble merge one level deep)
function params(S) {
  const P = { ...BASE, ...S.params };
  P.aura = { ...BASE.aura, ...(S.params.aura || {}) };
  P.marble = { ...BASE.marble, ...(S.params.marble || {}) };
  return P;
}

function defaultFigure(plan) {
  const c = (plan && (plan.cut || plan.id || '')) + '';
  if (c.includes('sol')) return 'sol';
  if (c.includes('prometheus')) return 'prometheus';
  return 'david';
}

// light spec [az, el, I] (I may be keyframed) -> { dir (world), I }
function light(spec, u) {
  if (!spec) return { dir: [0, 1, 0], I: 0 };
  return { dir: dirAzEl(kv(spec[0], u, 0), kv(spec[1], u, 0)), I: kv(spec[2], u, 1) };
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
    this.fxaaProg = G.program(FXAA_FS, 'statue.fxaa');
    this.down4Prog = G.program(DOWN4_FS, 'statue.down4');
    this.blurProg = G.program(BLUR_FS, 'statue.blur');
    this.raysProg = G.program(RAYS_FS, 'statue.rays');
    this.compProg = G.program(COMP_FS, 'statue.comp');
    this.samplers = depthSamplers(gl);
    this.fbos = new Map();
    this.shadowKey = null;
    this.shadow = null;
  },

  _u(S) { return clamp(S.local / Math.max(S.dur - 1 / S.fps, 1e-3)); },

  render(E, S, target) {
    const G = E.G;
    const st = saveState(G);
    try { this._render(E, S, target); } finally { restoreState(G, st); }
  },

  _render(E, S, target) {
    const G = E.G, gl = G.gl;
    const P = params(S);
    const figId = P.figure || defaultFigure(E.plan);
    const FIG = FIGURES[figId];
    const fig = getFigure(figId);
    const meta = fig.meta;
    const mesh = gpuFigure(G, fig);
    const u = this._u(S);
    const w = target.w, h = target.h;
    const turn = P.turn || TURN;
    const yaw = turnYaw(turn, S.f);
    const yawRef = turnYaw(turn, S.shot.start);       // the key is locked to the head at the shot's first frame
    const t = S.t;
    const prof = (typeof window !== 'undefined' && window.__statueProf) ? [] : null;
    const px = new Uint8Array(4);
    const mark = (name) => { if (!prof) return; gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); prof.push([name, performance.now()]); };
    mark('start');

    // ---- camera
    const C = statueCamera(E, meta, P, yaw, u, t);
    const cam = C.cam;
    const aspect = E.W / E.H;
    const near = Math.max(0.02, C.dist - 1.6), far = C.dist + 1.8;
    const mvp = mul4(viewProj(cam, aspect, near, far), yawMat4(yaw));
    const camH = rotY(cam.pos, -yaw), fwdH = rotY(cam.fwd, -yaw);

    // ---- lights (studio frame -> head space)
    const key = light(P.key, u), fill = light(P.fill, u), rim = light(P.rim, u), rim2 = light(P.rim2, u), under = light(P.under, u);
    let underI = under.I;
    if (figId === 'prometheus') {
      // the stolen fire below: a faint, deterministic flicker
      const fl = 1 + 0.10 * Math.sin(t * 7.3) + 0.07 * Math.sin(t * 12.9 + 1.3) + 0.05 * Math.sin(t * 23.1 + 2.1) + 0.03 * Math.sin(t * 37.7 + 0.4);
      underI = (P.under && P.under[2] ? underI : 1.3) * fl;
    }
    const keyH = rotY(key.dir, -yawRef);
    const toH = (d) => rotY(d, -yaw);

    // ---- shadow map (cached per shot: the key is fixed in head space for the insert)
    const lb = letterboxAt(E.plan, S.f, ease.inOutCubic);
    const shC = resolvePoint(meta, P.shadowAt || P.aim || 'eyes');
    const shR = P.shadowR || clamp(kv(P.height, 0, 1) * 0.62 + 0.12, 0.28, 1.15);
    const bc = [0, -0.2, -0.05], br = 1.25;
    const SM = shadowMatrix(keyH, shC, shR, bc, br);
    const skey = `${figId}|${keyH.map((x) => x.toFixed(6))}|${shC}|${shR}`;
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
      gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_INT, 0);
      gl.disable(gl.POLYGON_OFFSET_FILL);
      this.shadowKey = skey;
    }
    mark('shadow');

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
    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_INT, 0);
    gl.disable(gl.DEPTH_TEST); gl.depthMask(false);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.SCISSOR_TEST);
    mark('gbuf');

    // ---- marble lighting
    const lit = G.target('statue.lit', w, h, 'rgba16f');
    const aa = G.target('statue.aa', w, h, 'rgba16f');
    G.clear(lit); G.clear(aa);
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
      uSh: { tex: sh.depth.tex, sampler: this.samplers.cmp }, uShRaw: { tex: sh.depth.tex, sampler: this.samplers.raw },
      uLMat: SM.m, uShDepth: SM.depthRange, uShTexel: (2 * shR) / SHADOW_SIZE, uPenUV: (P.penumbra ?? 0.0035) / (2 * shR),
      uCamH: camH, uFwdH: fwdH,
      uKeyDir: keyH, uKeyCol: scl(FIG.key, key.I),
      uFillDir: toH(fill.dir), uFillCol: scl(FIG.fill, fill.I),
      uRimDir: toH(rim.dir), uRimCol: scl(FIG.rim, rim.I),
      uRim2Dir: toH(rim2.dir), uRim2Col: scl(FIG.rim2, rim2.I),
      uUnderDir: toH(under.dir), uUnderCol: scl(FIG.under, underI),
      uFrontCol: scl(FIG.front, front), uAmb: FIG.amb,
      uHoles: holes, uHoleCol: scl(FIG.holes ? FIG.holes.col : [0, 0, 0], FIG.holes ? FIG.holes.I * kv(P.rays, u, 1) * this._breath(t, 0) : 0), uHoleR: holeR,
      uMarble: [mb.veins, mb.veinScale, mb.gloss, mb.sss], uMfp: FIG.mfp, uTint: FIG.tint, uDebug: P.debug | 0,
    }, lit, scissor);
    mark('light');

    // ---- antialiasing
    drawFullscreen(G, this.fxaaProg, { uSrc: lit }, aa, scissor);
    mark('fxaa');

    // ---- aura: quarter-res coverage, two blurred glows
    const w4 = Math.max(2, Math.round(w / 4)), h4 = Math.max(2, Math.round(h / 4));
    const w8 = Math.max(2, Math.round(w / 8)), h8 = Math.max(2, Math.round(h / 8));
    const m4 = G.target('statue.m4', w4, h4, 'rgba16f');
    const b4 = G.target('statue.b4', w4, h4, 'rgba16f');
    const g1 = G.target('statue.g1', w4, h4, 'rgba16f');
    const b8 = G.target('statue.b8', w8, h8, 'rgba16f');
    const g2 = G.target('statue.g2', w8, h8, 'rgba16f');
    drawFullscreen(G, this.down4Prog, { uSrc: aa, uSrcRes: [w, h] }, m4);
    // radii in quarter / eighth-res texels, so they scale with the render size
    drawFullscreen(G, this.blurProg, { uSrc: m4, uSrcRes: [w4, h4], uDir: [1.6, 0] }, b4);
    drawFullscreen(G, this.blurProg, { uSrc: b4, uSrcRes: [w4, h4], uDir: [0, 1.6] }, g1);
    drawFullscreen(G, this.blurProg, { uSrc: g1, uSrcRes: [w4, h4], uDir: [4.0, 0] }, b8);
    drawFullscreen(G, this.blurProg, { uSrc: b8, uSrcRes: [w8, h8], uDir: [0, 2.2] }, g2);
    drawFullscreen(G, this.blurProg, { uSrc: g2, uSrcRes: [w8, h8], uDir: [2.6, 0] }, b8);
    drawFullscreen(G, this.blurProg, { uSrc: b8, uSrcRes: [w8, h8], uDir: [0, 2.6] }, g2);

    mark('aura');
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
        ...cam.uniforms, uLit: aa, uRayP: pos, uRayD: dirs, uRayI: I, uRayShape: [R.len, R.w0, R.w1, R.fall],
        uRayCol: R.col, uRayCore: R.core, uRayT: t,
      }, rays);
    }

    // ---- composite into the scene target
    const A = P.aura;
    const ac = rotY(resolvePoint(meta, A.at || 'head'), yaw);
    const pr = cam.project(ac, E.W, E.H);
    const corona = pr ? [(pr.x / E.W) * 2 - 1, 1 - (pr.y / E.H) * 2] : [0, 0];
    const coronaR = pr ? cam.pixelRadius(ac, A.r ?? 0.75, E.H) / (E.H / 2) : 1;
    const grad = P.grad;
    E.draw(this.compProg, {
      uLit: aa, uM4: m4, uG1: g1, uG2: g2, uRays: rays || aa, uHasRays: rays ? 1 : 0,
      uAuraCol: FIG.aura, uAuraCol2: FIG.aura2,
      uAura: [kv(A.glow, u, 0), kv(A.wide, u, 0), kv(A.corona, u, 0), kv(A.streaks, u, 0.6)],
      uCorona: corona, uCoronaR: coronaR, uGain: kv(P.gain, u, 1), uGrad: grad ? [grad[0], grad[1], grad[2], 0] : [0, -1, 0, 0],
      uAuraT: t,
    }, target);
    mark('comp');
    if (prof) window.__statueProf.push(prof.slice(1).map((p, i) => p[0] + ' ' + Math.round(p[1] - prof[i][1])).join(', '));
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
    const out = { vignette: 0.42, bloomStrength: 0.1, bloomThreshold: 0.95, halation: 0.02, lift: 0.0 };
    for (const [k, v] of Object.entries(P.post || {})) out[k] = kv(v, u);
    return out;
  },
};

// expose for the review/edit tools
export { FIGURES, PRESETS, turnYaw };
