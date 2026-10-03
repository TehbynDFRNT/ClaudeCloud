// Film orchestrator: one frame = f(plan, frame index). No state survives between frames
// except caches, so frames can be rendered in any order.
import { GL } from './gl.js';
import { Post, POST_DEFAULTS } from './post.js';
import { buildNoiseVolume } from './noise.js';
import { Music, evalFps } from './music.js';
import { drawTitles } from './titles.js';
import * as math from './math.js';
import * as rng from './rng.js';

// Portrait (9:16) output: a scene preset may carry `portrait: { framing, ...param overrides }`; in a portrait
// render those overrides are merged over the preset and `framing` reframes every camera the shot builds
// (engine/math.js setFraming). Landscape renders ignore `portrait` entirely, so the 16:9 cut is unchanged.
const FRAMING_KEYS = ['roll', 'zoom', 'pan', 'dolly'];
function framingAt(fr, u) {
  if (!fr) return null;
  if (!Array.isArray(fr)) return fr;
  // keyed: [[u, {roll, zoom, pan, dolly}, easing?], ...] in shot-normalised time
  const ks = fr;
  if (u <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    if (u <= ks[i][0]) {
      const [u0, a] = ks[i - 1], [u1, b, ez] = ks[i];
      const t = (math.ease[ez || 'inOutSine'] || math.ease.inOutSine)((u - u0) / Math.max(1e-9, u1 - u0));
      const out = {};
      for (const k of FRAMING_KEYS) {
        const va = a[k] ?? math.IDENTITY_FRAMING[k], vb = b[k] ?? math.IDENTITY_FRAMING[k];
        out[k] = Array.isArray(va) ? va.map((x, j) => math.lerp(x, vb[j], t)) : math.lerp(va, vb, t);
      }
      return out;
    }
  }
  return ks[ks.length - 1][1];
}

export class Film {
  constructor({ canvas, W, H, plan, grid, scenes }) {
    this.W = W; this.H = H;
    this.portrait = H > W;
    this.plan = plan;
    this.fps = evalFps(plan.fps);
    this.scenes = scenes;
    this.G = new GL(canvas);
    const nv = buildNoiseVolume();
    this.G.texture3D('uNoise', nv.n, nv.data);
    this.post = new Post(this.G, W, H);
    this.music = grid ? new Music(plan, grid) : null;
    this.overlay = document.createElement('canvas');
    this.overlay.width = W; this.overlay.height = H;
    this.octx = this.overlay.getContext('2d');
    this.titles = document.createElement('canvas');
    this.titles.width = W; this.titles.height = H;
    this.tctx = this.titles.getContext('2d');
    this.overlayTex = null; this.titlesTex = null;
    this.inited = new Set();
    this.shots = [...plan.shots].sort((a, b) => a.start - b.start);
    this.transitions = (plan.overlays || []).filter((o) => o.type === 'dissolve' || o.type === 'bleed');
    this.E = this._api();
  }

  _api() {
    const film = this;
    const E = {
      G: this.G, W: this.W, H: this.H, fps: this.fps, plan: this.plan, music: this.music, math, rng,
      // portrait output, and the pixel scale for strokes/type: 1.0 at 1080 px on the frame's SHORT side
      portrait: this.portrait, k: Math.min(this.W, this.H) / 1080,
      program: (src, name) => film.G.program(src, name),
      camera: (pos, target, fov, roll, up) => math.camera(pos, target, fov, roll, up),
      // frame-shaped render target at a fraction of output size
      target: (name, scale = 1, format = 'rgba16f') => {
        const t = film.G.target(name, Math.max(2, Math.round(film.W * scale)), Math.max(2, Math.round(film.H * scale)), format);
        t.frameLike = true;
        return t;
      },
      draw: (prog, uniforms, target, opts = {}) => {
        let scissor = opts.scissor ?? null;
        if (!scissor && target && target.frameLike && film._lb > 0) {
          const m = Math.max(0, Math.floor((film._lb - 0.04) * target.h));
          scissor = [0, m, target.w, target.h - 2 * m];
        }
        film.G.draw(prog, uniforms, target, { ...opts, scissor });
      },
      overlayCtx: this.octx,
      overlayCanvas: this.overlay,
      overlayTexture: () => film.overlayTex,
      shotById: (id) => film.shots.find((s) => s.id === id),
    };
    return E;
  }

  shotAt(f) {
    for (const s of this.shots) if (f >= s.start && f < s.end) return s;
    return this.shots[this.shots.length - 1];
  }

  state(shot, f) {
    const fps = this.fps;
    const local = (f - shot.start) / fps;
    const dur = (shot.end - shot.start) / fps;
    // params: scene preset for this shot id (lives in the scene module) overridden by plan params
    const sc = this.scenes[shot.scene];
    const preset = (sc && sc.presets && (sc.presets[shot.preset || shot.id] || sc.presets.default)) || {};
    const pp = this.portrait ? { ...(preset.portrait || {}), ...((shot.portrait) || {}) } : null;
    const params = { ...preset, ...(pp || {}), ...(shot.params || {}) };
    const framing = pp ? framingAt(pp.framing, local / dur) : null;
    return {
      f, t: f / fps, local, dur, u: local / dur, fps, W: this.W, H: this.H, portrait: this.portrait,
      shot, params, framing, seed: shot.seed ?? (rng.hash1(shot.start, 7) * 1000),
    };
  }

  scene(id) {
    const sc = this.scenes[id];
    if (!sc) throw new Error(`Unknown scene: ${id}`);
    if (!this.inited.has(id)) { sc.init && sc.init(this.E); this.inited.add(id); }
    return sc;
  }

  setClock(S) {
    this.G.globalUniforms = {
      uFull: [this.W, this.H], uTime: S.t, uLocal: S.local, uDur: S.dur, uU: S.u, uFrame: S.f, uSeed: S.seed,
    };
  }

  // global effects from plan.effects
  effects(f) {
    const out = { letterbox: this.plan.format?.letterbox ?? POST_DEFAULTS.letterbox, flash: 0, dip: 0, fade: 0, shake: [0, 0, 0] };
    for (const e of this.plan.effects || []) {
      if (e.type === 'letterbox' && f >= e.frame) {
        const u = math.clamp((f - e.frame) / Math.max(1, e.frames || 1));
        out.letterbox = math.lerp(e.from ?? out.letterbox, e.to, math.ease.inOutCubic(u));
      } else if (e.type === 'flash' && f >= e.frame) {
        const k = f - e.frame;
        if (k < (e.decay || 6) * 6) out.flash += e.amount * Math.exp(-k / (e.decay || 6));
      } else if (e.type === 'dip' && f >= e.frame) {
        // a dark pulse: exposure punched down on a hit (fast attack, exponential recovery)
        const k = f - e.frame, at = e.attack ?? 1, dc = e.decay || 6;
        if (k < at + dc * 6) out.dip = Math.max(out.dip, e.amount * (k < at ? (k + 1) / (at + 1) : Math.exp(-(k - at) / dc)));
      } else if (e.type === 'fade' && f >= e.start && f < e.end) {
        const u = (f - e.start) / (e.end - e.start);
        out.fade = Math.max(out.fade, math.lerp(e.from, e.to, math.ease.inOutSine(u)));
        if (e.color) out.fadeColor = e.color;
      } else if (e.type === 'shake' && f >= e.start && f < e.end) {
        const u = (f - e.start) / (e.end - e.start);
        const env = (e.env === 'decay' ? Math.exp(-u * 4) : Math.sin(Math.PI * u)) * e.amp;
        const n = (k) => (rng.hash1(f, k) * 2 - 1);
        out.shake = [out.shake[0] + n(1) * env, out.shake[1] + n(2) * env, out.shake[2] + n(3) * env * 0.002];
      }
    }
    return out;
  }

  renderShot(shot, f, targetName) {
    const S = this.state(shot, f);
    this.setClock(S);
    const sc = this.scene(shot.scene);
    const scale = shot.renderScale ?? sc.scale ?? 1;
    const target = this.E.target(targetName, scale);
    this.E.S = S;
    math.setFraming(S.framing);
    try { sc.render(this.E, S, target); } finally { math.setFraming(null); }
    return { S, sc, target };
  }

  renderFrame(f) {
    const t0 = performance.now();
    const shot = this.shotAt(f);
    const fx = this.effects(f);
    this._lb = fx.letterbox;
    // overlay first so scene shaders may sample it
    const S0 = this.state(shot, f);
    const sc0 = this.scene(shot.scene);
    let overlayMode = null;
    if (sc0.overlay) {
      this.octx.setTransform(1, 0, 0, 1, 0, 0);
      this.octx.clearRect(0, 0, this.W, this.H);
      this.setClock(S0);
      math.setFraming(S0.framing);
      try { overlayMode = sc0.overlay(this.E, S0, this.octx) || null; } finally { math.setFraming(null); }
      this.overlayTex = this.G.canvasTexture(this.overlayTex, this.overlay);
    }
    const A = this.renderShot(shot, f, 'sceneA');
    let B = null, mixB = 0, mixMode = 0;
    const tr = this.transitions.find((o) => f >= o.start && f < o.end);
    if (tr) {
      const other = this.shots.find((s) => s.id === (shot.id === tr.from ? tr.to : tr.from));
      if (other) {
        B = this.renderShot(other, f, 'sceneB');
        const u = (f - tr.start + 0.5) / (tr.end - tr.start);
        const toward = shot.id === tr.from ? u : 1 - u; // weight of "to"
        mixB = shot.id === tr.from ? toward : 1 - toward;
        mixMode = tr.type === 'bleed' ? 1 : 0;
      }
    }
    this.setClock(A.S);
    const p = { ...POST_DEFAULTS, ...(this.plan.defaultPost || {}), ...(shot.post || {}) };
    if (A.sc.post) Object.assign(p, A.sc.post(this.E, A.S) || {});
    p.letterbox = fx.letterbox;
    p.flash += fx.flash;
    if (fx.dip) p.exposure *= 1 - Math.min(1, fx.dip);
    p.fade = Math.max(p.fade, fx.fade);
    if (fx.fadeColor) p.fadeColor = fx.fadeColor;
    p.shake = [p.shake[0] + fx.shake[0], p.shake[1] + fx.shake[1], p.shake[2] + fx.shake[2]];
    p.mixB = mixB; p.mixMode = mixMode;
    if (overlayMode) { p.overlayMode = overlayMode === 'add' ? 1 : 2; }
    const hasTitles = drawTitles(this.tctx, this.plan.text || [], f, this.fps, this.W, this.H);
    if (hasTitles) this.titlesTex = this.G.canvasTexture(this.titlesTex, this.titles);
    this.post.run(A.target, B ? B.target : null, overlayMode ? this.overlayTex : null, p, hasTitles ? this.titlesTex : null);
    this.G.finish();
    return { f, shot: shot.id, scene: shot.scene, ms: Math.round(performance.now() - t0) };
  }

  // Sandbox: render a scene with ad-hoc params at local time (for development)
  renderSandbox(sceneId, params = {}, local = 0, dur = 6, post = {}, letterbox = 0.128, presetId = null) {
    const fps = this.fps;
    const shot = { id: presetId || '__sandbox', preset: presetId || undefined, scene: sceneId, start: 0, end: Math.round(dur * fps), params, post };
    const f = Math.round(local * fps);
    const savedShots = this.shots, savedTr = this.transitions, savedText = this.plan.text, savedFx = this.plan.effects, savedFmt = this.plan.format;
    this.shots = [shot]; this.transitions = []; this.plan.text = []; this.plan.effects = [];
    this.plan.format = { ...(savedFmt || {}), letterbox };
    try { return this.renderFrame(f); } finally {
      this.shots = savedShots; this.transitions = savedTr; this.plan.text = savedText; this.plan.effects = savedFx; this.plan.format = savedFmt;
    }
  }
}
