// Renaissance studies: Leonardo's search for cosmic order, in restrained glimpses.
// Iron-gall ink and red chalk drawn on the 2D overlay (pen-stroke reveal), multiplied into a lit
// parchment shader that samples the overlay itself (overlay() returns null).
// params: view keys [[t, cx, cy, zoom, rot, ease?], ...], key light {pos, r, pow, dir, col}, fill, age,
//         flame [x, y, r, strength], level keys, drawing id.
import { frag } from '../engine/glsl.js';
import { keys } from '../engine/math.js';
import { PAPER, PAPER_BAKE, BAKE_RECT, BAKE_DENSITY, makePaperTexture } from './lib/studies-paper.js';
import { renderDrawing } from './lib/studies-ink.js';
import * as DR from './lib/studies-drawings.js';

const FS = frag(PAPER, `
uniform vec4 uShadeY;   // lower page falling into shadow: y0, y1, amount
uniform vec4 uGutter;   // the page curling down into the binding: x of the fold, curl width, depth, side (+1 right, -1 left, 0 none)
void main(){
  vec2 p = pagePos();
  Paper P = paper(p);
  vec3 alb = P.alb;
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 r1 = vec2(1.7 * uFull.y / 1080.0) / uRes;
  vec4 o0 = texture(uOverlay, uv) * uInk;
  vec4 oxp = texture(uOverlay, uv + vec2(r1.x, 0.0)) * uInk;
  vec4 oxm = texture(uOverlay, uv - vec2(r1.x, 0.0)) * uInk;
  vec4 oyp = texture(uOverlay, uv + vec2(0.0, r1.y)) * uInk;
  vec4 oym = texture(uOverlay, uv - vec2(0.0, r1.y)) * uInk;
  vec4 ob = (oxp + oxm + oyp + oym) * 0.25;
  vec2 r2 = r1 * 2.3;
  vec4 oh = (texture(uOverlay, uv + r2) + texture(uOverlay, uv - r2) + texture(uOverlay, uv + vec2(r2.x, -r2.y)) + texture(uOverlay, uv + vec2(-r2.x, r2.y))) * 0.25 * uInk;

  // ---- iron-gall ink: dense brown-black, warm brown where thin, darker rim, feathering into fibres
  float ink = o0.r;
  float ring = max(ink - ob.r, 0.0);
  float valley = 1.0 - P.tooth;
  float dens = ink * (0.72 + 0.5 * valley) + ring * 0.8;
  dens *= 1.75;
  float feather = max((ob.r + oh.r) * 0.5 - ink, 0.0) * (0.3 + 1.2 * P.fib);
  vec3 T = exp(-vec3(1.45, 1.95, 2.8) * (dens + feather * 0.45));
  alb *= T;

  // ---- red chalk: pigment catches the tooth first, pressure fills the valleys; dust haze around strokes
  float chd = o0.g;
  float cover = 0.0;
  if (chd > 0.004){
    // a finer, page-locked tooth sample: chalk catches the peaks first; only pressure fills the valleys
    float tHi = texture(uPaper, p * 2.31 + vec2(0.37, 0.71)).g;
    // raw tooth ~0.25 +- 0.05 -> tN spread roughly evenly over 0..1, so the covered fraction ~ density
    float tN = sat((P.tooth * 0.45 + tHi * 0.55 - 0.16) / 0.19 + 0.1 * (P.fib - 0.25));
    cover = smoothstep(-0.09, 0.09, chd * 1.1 - 0.24 - (1.0 - tN));
  }
  vec3 chalk = mix(vec3(0.52, 0.17, 0.085), vec3(0.30, 0.062, 0.028), sat(chd * 1.25 - 0.25));
  alb = mix(alb, chalk, cover * 0.93);
  alb *= mix(vec3(1.0), vec3(0.95, 0.85, 0.79), sat(ob.g * 0.25 + oh.g * 0.3) * (1.0 - cover));

  // ---- relief: stylus grooves (no ink) and the wet ink bead (on ink)
  vec2 gR = vec2(oxp.b - oxm.b, oym.b - oyp.b) * 0.5 / (1.7 * uFull.y / 1080.0);
  float sgn = mix(-1.0, 1.0, smoothstep(0.05, 0.3, ink));
  vec2 grad = P.grad + gR * sgn * 0.06;
  // gutter: the sheet slopes down into the fold (turned from the light), a dark crease, the facing page rising
  float gAO = 1.0;
  if (uGutter.w != 0.0){
    float d = (uGutter.x - p.x) * uGutter.w;                        // > 0 on this page
    float sg = sat(1.0 - d / uGutter.y);
    float slope = d > 0.0 ? -2.0 * uGutter.z * sg / uGutter.y : 2.6 * uGutter.z * sat(1.0 + d / (0.4 * uGutter.y)) / uGutter.y;
    grad.x += slope * uGutter.w;
    gAO = (1.0 - 0.55 * sg * sg * sg) * (1.0 - 0.6 * exp(-abs(d) / 0.004));
  }

  // ---- light: raking key from the window side, pooled, plus a cold ambient
  vec3 N = normalize(vec3(-grad, 1.0));
  vec3 L = normalize(uKeyDir);
  float diff = max(dot(N, L), 0.0) / max(L.z, 0.05);
  vec2 dk = (p - uKey.xy) / uKey.z;
  float pool = exp(-pow(dot(dk, dk), uKey.w));
  pool *= 1.0 - uShadeY.z * smoothstep(uShadeY.x, uShadeY.y, p.y);
  vec3 col = alb * (uKeyCol * diff * pool + uFillCol) * gAO;
  // wet ink gloss: the bead's flank facing the light
  float wet = o0.b * smoothstep(0.1, 0.4, ink);
  col += uKeyCol * pool * wet * max(0.0, -dot(gR, normalize(L.xy))) * 0.9;

  // ---- the stolen fire: warm light on the paper and the chalk flame faintly emissive
  if (uFlame.w > 0.0){
    float df = length(p - uFlame.xy) / uFlame.z;
    float fl = uFlame.w * (0.85 + 0.15 * uFlameB.x);
    col += alb * vec3(1.0, 0.45, 0.14) * exp(-df * df * 0.8) * fl * 0.36;
    col += cover * vec3(1.0, 0.36, 0.09) * exp(-df * df * 2.4) * fl * 0.8;
  }
  col *= uLevel;
  fragColor = vec4(col, 1.0);
}`);

const BAKE = frag(PAPER_BAKE);
const BLACK = frag(`void main(){ fragColor = vec4(0.0, 0.0, 0.0, 1.0); }`);

const BUILD = {
  codex: DR.codex,
  prometheus: DR.prometheus,
  deluge: DR.deluge,
  parabola: DR.parabola,
  eye: DR.eye,
  cno: DR.cno,
  collapse: DR.collapse,
  rings: DR.rings,
  swatch: DR.swatch,
  blank: DR.blank,
};

// default look
const LOOK = {
  key: { pos: [-0.25, -0.12], r: 1.05, pow: 1.6, dir: [-0.8, -0.45, 0.42], col: [1.02, 0.86, 0.66] },
  fill: [0.010, 0.014, 0.024],
  age: [0.75, 0.6, 0.6, 1.0],
};

const presets = {
  'S05-codex': {
    drawing: 'codex', design: 2.917,
    view: [[0, 0.0, 0.0, 1.0, -0.008], [2.917, 0.03, 0.006, 1.035, 0.004]],
    key: { pos: [-0.28, -0.2], r: 0.95, pow: 1.4, dir: [-0.8, -0.45, 0.42], col: [1.14, 0.93, 0.68] },
    gutter: [0.862, 0.12, 0.034, 1], cockle: 2.4,   // a notebook: the sheet curls into the binding at the right
  },
  'S10-prometheus': {
    drawing: 'prometheus', design: 3.5,
    // the fist on the left third, the flame in the upper third (~90 px under the scope line); the push-in is
    // anchored on the flame, so the fist sinks toward the frame edge while the fire holds its place
    view: [[0, 0.016, -0.102, 0.96, 0.006], [3.5, 0.002, -0.123, 1.02, -0.004]],
    paperSeed: 3.7, age: [0.7, 0.3, 0.55, 1.0],
    key: { pos: [-0.22, -0.2], r: 0.95, pow: 1.4, dir: [-0.8, -0.45, 0.42], col: [1.08, 0.89, 0.66] },
    flameKeys: [[0.45, 0], [2.1, 1]], flameGain: 2.0,
  },
  'S14d-deluge': {
    drawing: 'deluge', paperSeed: 7.3, design: 1.5, wetTau: 0.45, wetGain: 0.5,
    view: [[0, 0.0, 0.0, 1.0, 0.07], [1.5, 0.0, 0.0, 1.13, -0.06, 'linear']],
    key: { pos: [-0.1, -0.1], r: 0.9, pow: 1.3, dir: [-0.7, -0.55, 0.45], col: [1.1, 0.9, 0.67] },
  },
  'F27.3': {
    drawing: 'parabola', paperSeed: 11.1, design: 0.75,
    view: [[0, 0.0, 0.0, 1.02, -0.02], [0.75, 0.03, 0.0, 1.16, 0.01, 'outQuad']],
    key: { pos: [0.05, -0.15], r: 0.9, pow: 1.3, dir: [-0.8, -0.4, 0.42], col: [1.1, 0.9, 0.67] },
  },
  'F29.1': {
    drawing: 'eye', paperSeed: 13.9, design: 0.792,
    view: [[0, -0.02, 0.0, 1.0, 0.015], [0.792, 0.06, 0.0, 1.14, -0.01, 'outQuad']],
    key: { pos: [-0.05, -0.15], r: 0.9, pow: 1.3, dir: [-0.8, -0.4, 0.42], col: [1.1, 0.9, 0.67] },
  },
  'F30.3': {
    drawing: 'cno', paperSeed: 17.2, design: 0.792,
    view: [[0, 0.02, 0.0, 1.0, 0.06], [0.792, 0.02, 0.0, 1.12, -0.05, 'linear']],
    key: { pos: [-0.05, -0.12], r: 0.9, pow: 1.3, dir: [-0.8, -0.4, 0.42], col: [1.1, 0.9, 0.67] },
  },
  'F31.4': {
    drawing: 'collapse', paperSeed: 19.5, design: 0.375,
    // hold the scale (a slight pull-out) so the shrinking circles and the blot carry the compression
    view: [[0, 0.0, 0.0, 1.06, 0.035], [0.375, 0.0, 0.0, 0.96, -0.045, 'linear']],
    key: { pos: [0.0, -0.05], r: 0.85, pow: 1.3, dir: [-0.8, -0.4, 0.42], col: [1.1, 0.9, 0.67] },
  },
  'S29b-drawing': {
    drawing: 'rings', paperSeed: 23.4, design: 6.042,
    // ring registration with S29a (r = 0.32H, centred) while the nova is still visible, then a calm ease
    // out so the lowest ink settles near 0.75H, clear of the end title (caps at 0.83-0.86H)
    view: [[-0.75, 0.0, 0.0, 1.0, 0.0], [0.8, 0.0, 0.0, 1.0, 0.0], [2.4, 0.0, 0.05, 0.86, 0.0], [6.042, 0.004, 0.052, 0.856, 0.002, 'linear']],
    key: { pos: [0.0, -0.06], r: 0.66, pow: 1.25, dir: [-0.75, -0.5, 0.42], col: [1.15, 0.93, 0.68] },
    level: [[-0.75, 0.12], [0.6, 0.75], [1.4, 1.0]],
    shadeY: [0.28, 0.52, 0.92, 0],
    gutter: [-1.0, 0.15, 0.04, -1], cockle: 2.4,    // the binding at the left edge of the sheet
    postEase: [0.0, 1.25],
  },
  'S30-credits': { black: true },
  default: { drawing: 'blank', view: [[0, 0, 0, 1, 0]] },
};

export default {
  id: 'studies',
  scale: 1,
  presets,
  init(E) {
    this.prog = E.program(FS, 'studies');
    this.black = E.program(BLACK, 'studies-black');
    this.bakeProg = E.program(BAKE, 'studies-bake');
    this.bakes = [];
    this.paperTex = makePaperTexture(E.G);
    this.cache = new Map();
    this.priv = null;
  },
  drawing(id) {
    if (!this.cache.has(id)) this.cache.set(id, (BUILD[id] || DR.blank)());
    return this.cache.get(id);
  },
  view(P, local) {
    const v = P.view || [[0, 0, 0, 1, 0]];
    const k = (i) => v.map((e) => [e[0], e[i], e[5]]);
    return { cx: keys(k(1), local), cy: keys(k(2), local), zoom: keys(k(3), local), rot: keys(k(4), local) };
  },
  // shot-local drawing time; presets are authored for `design` seconds and stretch if the plan retimes
  vTime(S) { const P = S.params; return S.local * (P.design ? P.design / S.dur : 1); },
  tLocal(S) { return S.params.debugT ?? this.vTime(S); },
  paint(E, S, ctx) {
    const P = S.params;
    if (P.black) return;
    const D = this.drawing(P.drawing || 'blank');
    renderDrawing(ctx, D, this.tLocal(S), this.view(P, this.vTime(S)), E.W, E.H, { gain: P.inkGain ?? 1, wetTau: P.wetTau, wetGain: P.wetGain });
  },
  overlay(E, S, ctx) {
    this.paint(E, S, ctx);
    this._ovKey = S.shot.id + '@' + S.f;
    return null;
  },
  inkTexture(E, S) {
    if (this._ovKey === S.shot.id + '@' + S.f && E.overlayTexture()) return E.overlayTexture();
    // rendered as the second shot of a dissolve: the shared overlay holds the other shot -> draw our own
    if (!this.priv) {
      const c = document.createElement('canvas');
      c.width = E.W; c.height = E.H;
      this.priv = { c, ctx: c.getContext('2d'), tex: null };
    }
    const { c, ctx } = this.priv;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    this.paint(E, S, ctx);
    this.priv.tex = E.G.canvasTexture(this.priv.tex, c);
    return this.priv.tex;
  },
  // the static low-frequency page, baked once per (seed, ageing) — a cache, not state
  bake(E, seed, age) {
    const key = `${seed}|${age.join(',')}|${E.H}`;
    this._tick = (this._tick || 0) + 1;
    const hit = this.bakes.find((b) => b.key === key);
    if (hit) { hit.used = this._tick; return hit.t; }
    const slot = this.bakes.length < 3 ? this.bakes.length : this.bakes.reduce((m, b, i, a) => (b.used < a[m].used ? i : m), 0);
    const w = Math.round((BAKE_RECT[2] - BAKE_RECT[0]) * BAKE_DENSITY * E.H), h = Math.round((BAKE_RECT[3] - BAKE_RECT[1]) * BAKE_DENSITY * E.H);
    const t = E.G.target('studiesBake' + slot, w, h, 'rgba16f');
    E.G.draw(this.bakeProg, { uBakeRect: BAKE_RECT, uPaperSeed: seed, uAge: age, uFull: [E.W, E.H] }, t);
    this.bakes[slot] = { key, t, used: this._tick };
    return t;
  },
  render(E, S, target) {
    const P = S.params;
    if (P.black) { E.draw(this.black, {}, target, { scissor: [0, 0, target.w, target.h] }); return; }
    const key = { ...LOOK.key, ...(P.key || {}) };
    const age = P.age || LOOK.age;
    let fl = P.flame || [0, 0, 1, 0];
    if (P.flameKeys) { const D = this.drawing(P.drawing); fl = [D.flame[0], D.flame[1], P.flameR ?? 0.11, keys(P.flameKeys, this.tLocal(S)) * (P.flameGain ?? 1)]; }
    const t = this.tLocal(S);
    const flick = 0.5 + 0.3 * Math.sin(t * 9.1) + 0.2 * Math.sin(t * 23.7 + 1.3);
    const level = P.level ? keys(P.level, t) : 1;
    const v = this.view(P, this.vTime(S));
    const ink = this.inkTexture(E, S);
    const bk = this.bake(E, P.paperSeed ?? 0.0, age);
    // E.draw scissors frame targets to the letterbox band, leaving stale pixels from earlier shots outside
    // it, which the bloom pyramid then reads: clear the whole target first so a frame never depends on history
    E.draw(this.black, {}, target, { scissor: [0, 0, target.w, target.h] });
    E.draw(this.prog, {
      uOverlay: ink, uPaper: this.paperTex.tex, uPaperN: this.paperTex.nrm, uPaperSize: this.paperTex.size, uInk: ink ? 1 : 0, uBake: bk, uBakeRect: BAKE_RECT,
      uView: [v.cx, v.cy, v.zoom, v.rot],
      uKey: [key.pos[0], key.pos[1], key.r, key.pow], uKeyDir: key.dir, uKeyCol: key.col,
      uFillCol: P.fill || LOOK.fill, uAge: age,
      uFlame: fl, uFlameB: [flick, 0, 0, 0], uPaperSeed: P.paperSeed ?? 0.0, uLevel: level,
      uShadeY: P.shadeY || [1, 2, 0, 0], uGutter: P.gutter || [0, 1, 0, 0], uCockle: P.cockle ?? 1,
    }, target);
  },
  post(E, S) {
    const P = S.params;
    if (P.black) return { bloomStrength: 0, halation: 0, grain: 0.0, lift: 0 };
    const mine = { bloomStrength: 0.035, bloomThreshold: 1.2, halation: 0.01, aberration: 0.0012, vignette: 0.3, grain: 0.028, lift: 0.12, contrast: 1.03, ...(P.post || {}) };
    // while a dissolve from another scene is still running, ease from the engine defaults into this look
    if (P.postEase) {
      const u = Math.min(1, Math.max(0, (S.local - P.postEase[0]) / (P.postEase[1] - P.postEase[0])));
      const k = u * u * (3 - 2 * u);
      const dflt = { bloomStrength: 0.08, bloomThreshold: 1.0, halation: 0.025, aberration: 0.0035, vignette: 0.55, grain: 0.035, lift: 0.4, contrast: 1.04 };
      for (const n of Object.keys(dflt)) mine[n] = dflt[n] + (mine[n] - dflt[n]) * k;
    }
    return mine;
  },
};
