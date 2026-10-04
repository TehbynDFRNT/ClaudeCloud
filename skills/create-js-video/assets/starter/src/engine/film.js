// Minimal engine: enough to run the whole pipeline (render -> pieces -> assemble -> verify) on day one. Grow it into
// the real one (references/architecture.md §4-6: linear HDR targets, bloom, ACES, grade, grain, letterbox, effects).
//
// A frame is a pure function of (plan, f, source files): no Math.random, Date or performance.now() in the pixels, no
// state carried from one frame to the next, canvas state reset every frame.
// Per frame: the scene renders with WebGL2 into an offscreen canvas -> copied onto the output canvas -> plan text on
// top (titles come after the scene, so type stays crisp and exactly the colour asked for).
export class Film {
  constructor({ canvas, W, H, plan, scenes }) {
    this.W = W; this.H = H; this.plan = plan; this.scenes = scenes;
    const [n, d] = String(plan.fps).split('/').map(Number);
    this.fps = n / (d || 1);
    this.ctx = canvas.getContext('2d');
    // the GL canvas is never added to the document, so the output canvas stays the first one
    this.glCanvas = document.createElement('canvas');
    this.glCanvas.width = W; this.glCanvas.height = H;
    this.gl = this.glCanvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false });
    if (!this.gl) throw new Error('WebGL2 unavailable (render.mjs launches Chromium with SwiftShader)');
    this.k = Math.min(W, H) / 1080;          // short side / 1080: multiply stroke widths, glows and type by it
    this.portrait = H > W;
    this.shots = [...plan.shots].sort((a, b) => a.start - b.start);
    this.ready = new Set();
  }

  scene(id) {
    const sc = this.scenes[id];
    if (!sc) throw new Error('unknown scene ' + id);
    if (!this.ready.has(id)) { if (sc.init) sc.init(this); this.ready.add(id); }
    return sc;
  }

  // preset (per shot or per cut) < portrait overrides < the shot's own params
  params(sc, shot) {
    const presets = sc.presets || {};
    const p = presets[shot.preset || shot.id] || presets.default || {};
    return { ...p, ...(this.portrait ? { ...(p.portrait || {}), ...(shot.portrait || {}) } : {}), ...(shot.params || {}) };
  }

  // local time runs over the shot, or over its span when an insert split it (the host keeps its own clock)
  state(shot, f, sc) {
    const [a, b] = shot.span || [shot.start, shot.end];
    const local = (f - a) / this.fps, dur = (b - a) / this.fps;
    return { f, t: f / this.fps, local, dur, u: local / dur, fps: this.fps, W: this.W, H: this.H, portrait: this.portrait,
      shot, params: this.params(sc, shot), seed: shot.start };
  }

  composite(sc, S) {
    const c = this.ctx;
    if (c.reset) c.reset(); else { c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; }
    c.fillStyle = '#000'; c.fillRect(0, 0, this.W, this.H);
    sc.render(this, S);
    // WebGL is lazy and Chromium's finish() does not wait: reading one pixel does, so ms covers the shading work
    this.gl.readPixels(0, 0, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.px || (this.px = new Uint8Array(4)));
    c.drawImage(this.glCanvas, 0, 0);
  }

  renderFrame(f) {
    const t0 = performance.now();            // timing only
    const shot = this.shots.find((s) => f >= s.start && f < s.end) || this.shots[this.shots.length - 1];
    const sc = this.scene(shot.scene);
    this.composite(sc, this.state(shot, f, sc));
    this.titles(f);
    // ms must be an integer: `chunk.mjs costs` parses "<n>ms" from render.mjs output
    return { f, shot: shot.id, scene: shot.scene, ms: Math.round(performance.now() - t0) };
  }

  // plan text: { id, start, end, content, size?, y?, color?, fadeIn?, fadeOut? }, sized from the short side
  titles(f) {
    const c = this.ctx;
    for (const it of this.plan.text || []) {
      if (f < it.start || f >= it.end) continue;
      const fi = it.fadeIn ?? 12, fo = it.fadeOut ?? 12;
      const a = Math.min(1, fi ? (f - it.start + 1) / fi : 1, fo ? (it.end - f) / fo : 1);
      let size = (it.size || 96) * this.k * (this.portrait ? 1.3 : 1);
      c.font = `400 ${size}px Georgia, serif`;
      const w = c.measureText(it.content).width;
      if (w > this.W * 0.86) { size *= (this.W * 0.86) / w; c.font = `400 ${size}px Georgia, serif`; }   // fit 86% of the width
      c.globalAlpha = Math.max(0, a);
      c.fillStyle = it.color || '#f2e8d8';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(it.content, this.W / 2, this.H * (it.y ?? 0.5));
      c.globalAlpha = 1;
    }
  }

  // one scene with ad-hoc params, outside the plan: render.mjs sandbox / bench
  renderSandbox(id, params = {}, local = 0, dur = 6, presetId = null) {
    const t0 = performance.now();
    const sc = this.scene(id);
    const shot = { id: presetId || 'sandbox', scene: id, start: 0, end: Math.round(dur * this.fps), preset: presetId || undefined, params };
    const S = { ...this.state(shot, Math.round(local * this.fps), sc), local, u: local / dur };
    this.composite(sc, S);
    return { ms: Math.round(performance.now() - t0) };
  }
}
