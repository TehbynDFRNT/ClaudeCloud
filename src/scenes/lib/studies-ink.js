// Pen, chalk and script primitives for the Renaissance studies (scene 'studies').
// A Drawing is a list of strokes/texts in PAGE units (1 unit = frame height at zoom 1, origin = page
// centre, x right, y DOWN), each with a reveal window [t0, t1] in shot-local seconds. Rendering at time t
// draws every stroke up to the pen position, so a frame is a pure function of t.
//
// Strokes are filled as variable-width polygons into an additive ('lighter') canvas, one material per
// channel, which the parchment shader reads back:
//   R = iron-gall ink density, G = red chalk density, B = relief (stylus incisions / the wet ink bead).
import { mulberry32, hash1 } from '../../engine/rng.js';

export const TAU = Math.PI * 2;
export const PX = 1 / 1080;                 // one 1080p pixel in page units (at zoom 1)
export const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };

// smooth 1D value noise in [-1, 1]
export function vnoise(x, seed = 0) {
  const i = Math.floor(x), f = x - i;
  const a = hash1(i, seed) * 2 - 1, b = hash1(i + 1, seed) * 2 - 1;
  return a + (b - a) * f * f * (3 - 2 * f);
}
export function fnoise(x, seed = 0) { return vnoise(x, seed) * 0.65 + vnoise(x * 2.3 + 7.1, seed + 3) * 0.35; }

export { mulberry32 };

// ---------- geometry ----------
export function arcLengths(pts) {
  const s = new Float32Array(pts.length);
  for (let i = 1; i < pts.length; i++) s[i] = s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return s;
}

// resample a polyline at (roughly) uniform spacing
export function resample(pts, step) {
  if (pts.length < 2) return pts.slice();
  const s = arcLengths(pts), L = s[s.length - 1];
  const n = Math.max(2, Math.ceil(L / step) + 1);
  const out = [];
  let j = 0;
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * L;
    while (j < pts.length - 2 && s[j + 1] < t) j++;
    const seg = s[j + 1] - s[j] || 1e-9;
    const u = Math.min(1, Math.max(0, (t - s[j]) / seg));
    out.push([pts[j][0] + (pts[j + 1][0] - pts[j][0]) * u, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * u]);
  }
  return out;
}

// Catmull-Rom (centripetal-ish uniform) through control points, then resampled
export function spline(ctrl, step = 2 * PX, closed = false) {
  const P = closed ? [ctrl[ctrl.length - 1], ...ctrl, ctrl[0], ctrl[1]] : [ctrl[0], ...ctrl, ctrl[ctrl.length - 1]];
  const raw = [];
  for (let i = 1; i < P.length - 2; i++) {
    const p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
    const seg = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const n = Math.max(2, Math.ceil(seg / (step * 0.5)));
    for (let k = 0; k < n; k++) {
      const u = k / n, u2 = u * u, u3 = u2 * u;
      raw.push([0, 1].map((c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * u + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * u2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * u3)));
    }
  }
  raw.push(closed ? ctrl[0].slice() : ctrl[ctrl.length - 1].slice());
  return resample(raw, step);
}

// circular arc (angles in page space, y down => positive angle turns clockwise on screen)
// wob: hand wobble amplitude (page units); a compass arc has wob ~0
export function arcPts(cx, cy, r, a0, a1, { step = 2 * PX, wob = 0, seed = 1, ry = null, rot = 0 } = {}) {
  const ryy = ry ?? r;
  const n = Math.max(3, Math.ceil((Math.abs(a1 - a0) * Math.max(r, ryy)) / step));
  const out = [];
  const c = Math.cos(rot), s = Math.sin(rot);
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * (i / n);
    const w = wob ? fnoise(a * 2.2, seed) * wob : 0;
    const x = Math.cos(a) * (r + w), y = Math.sin(a) * (ryy + w);
    out.push([cx + c * x - s * y, cy + s * x + c * y]);
  }
  return out;
}

export function linePts(x0, y0, x1, y1, { step = 2 * PX, wob = 0, seed = 1, bow = 0 } = {}) {
  const L = Math.hypot(x1 - x0, y1 - y0);
  const n = Math.max(2, Math.ceil(L / step));
  const nx = -(y1 - y0) / (L || 1), ny = (x1 - x0) / (L || 1);
  const out = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const o = (wob ? fnoise(u * L * 18, seed) * wob : 0) + bow * L * 4 * u * (1 - u);
    out.push([x0 + (x1 - x0) * u + nx * o, y0 + (y1 - y0) * u + ny * o]);
  }
  return out;
}

export const mapPts = (pts, f) => pts.map((p) => f(p[0], p[1]));

// ---------- the drawing ----------
const KIND_CH = { ink: 0, chalk: 1, relief: 2 };

export class Drawing {
  constructor(seed = 1) {
    this.items = [];
    this.t = 0;          // pen time cursor (seconds)
    this.rnd = mulberry32(seed);
    this.seed = seed;
    this.n = 0;
  }
  at(t) { this.t = t; return this; }
  wait(dt) { this.t += dt; return this; }
  r(a = 0, b = 1) { return a + (b - a) * this.rnd(); }

  // pts: page-space polyline. o: { kind, w (px1080), d, speed (units/s) | dur, taper [in,out] (px), press, pfreq,
  //   nib, nibAngle, load, gap, wet, t0 }
  stroke(pts, o = {}) {
    if (!pts || pts.length < 2) return null;
    const kind = o.kind || 'ink';
    const s = arcLengths(pts), L = s[s.length - 1];
    if (L <= 1e-6) return null;
    const speed = o.speed ?? 0.6;
    const dur = o.dur ?? Math.max(0.03, L / speed);
    const t0 = o.t0 ?? this.t;
    const id = this.n++;
    const sd = (this.seed * 7919 + id * 104729) | 0;
    const w0 = (o.w ?? 2.2) * PX, d0 = o.d ?? 0.85;
    const tin = (o.taper?.[0] ?? 7) * PX, tout = (o.taper?.[1] ?? 12) * PX;
    const press = o.press ?? 0.18, pfreq = o.pfreq ?? 9;
    const nib = o.nib ?? (kind === 'ink' ? 0.35 : 0), nibA = o.nibAngle ?? 0.75;
    const load = o.load ?? 0.25;
    const n = pts.length;
    const W = new Float32Array(n), D = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
      const tx = pts[b][0] - pts[a][0], ty = pts[b][1] - pts[a][1];
      const th = Math.atan2(ty, tx);
      const nibF = 1 - nib + nib * Math.abs(Math.sin(th - nibA)) * 1.35;
      const taper = (0.28 + 0.72 * smooth(s[i] / tin)) * (0.22 + 0.78 * smooth((L - s[i]) / tout));
      const pr = 1 + press * fnoise((s[i] / PX) / (1080 / pfreq) * 1.0, sd);
      W[i] = Math.max(0.25 * PX, w0 * nibF * taper * pr);
      const dl = 1 - load * smooth(s[i] / Math.max(L, 0.25)) + 0.12 * fnoise(s[i] * 40, sd + 5);
      D[i] = clamp01(d0 * dl * (0.75 + 0.25 * taper / 1.0));
    }
    const it = { type: 'stroke', kind, ch: KIND_CH[kind], pts, s, L, W, D, t0, t1: t0 + dur, wet: o.wet ?? (kind === 'ink'), id, sd };
    this.items.push(it);
    this.t = t0 + dur + (o.gap ?? 0.04);
    return it;
  }

  // Mirror script line, written right-to-left from (x, y) (the right end). size in px1080.
  text(str, x, y, o = {}) {
    const cps = o.cps ?? 14;
    const t0 = o.t0 ?? this.t;
    const dur = o.dur ?? str.length / cps;
    const it = {
      type: 'text', str, x, y, size: (o.size ?? 22) * PX, angle: o.angle ?? 0, d: o.d ?? 0.62, mirror: o.mirror ?? true,
      kind: o.kind || 'ink', t0, t1: t0 + dur, id: this.n++, font: o.font || 'italic', slant: o.slant ?? 0,
    };
    this.items.push(it);
    this.t = t0 + dur + (o.gap ?? 0.1);
    return it;
  }

  // shift every item so the reveal schedule moves by dt seconds
  shift(dt, from = 0) { for (const it of this.items.slice(from)) { it.t0 += dt; it.t1 += dt; } this.t += dt; return this; }
  // time-scale items [from..] about time origin t
  scale(k, origin = 0, from = 0) { for (const it of this.items.slice(from)) { it.t0 = origin + (it.t0 - origin) * k; it.t1 = origin + (it.t1 - origin) * k; } return this; }
  mark() { return this.items.length; }
  // make items [from..] finish no later than tEnd by compressing their schedule toward their own start
  fitTo(from, tStart, tEnd) {
    const sub = this.items.slice(from);
    if (!sub.length) return this;
    const a = Math.min(...sub.map((i) => i.t0)), b = Math.max(...sub.map((i) => i.t1));
    const k = (tEnd - tStart) / Math.max(1e-6, b - a);
    for (const it of sub) { it.t0 = tStart + (it.t0 - a) * k; it.t1 = tStart + (it.t1 - a) * k; }
    return this;
  }
}

// ---------- hatching ----------
// region: inside(x, y) -> bool, bbox [x0, y0, x1, y1]. Lines at `angle` (page radians, y down: +45deg = '\'),
// spaced `sp` (px1080). Each inside-interval becomes a stroke, shortened and bowed by hand.
export function hatch(D, inside, bbox, o = {}) {
  const ang = o.angle ?? Math.PI / 4;
  const ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux;
  const sp = (o.sp ?? 7) * PX;
  const cx = (bbox[0] + bbox[2]) / 2, cy = (bbox[1] + bbox[3]) / 2;
  const R = Math.hypot(bbox[2] - bbox[0], bbox[3] - bbox[1]) / 2 + sp;
  const step = 1.5 * PX;
  const maxLen = (o.maxLen ?? 9999) * PX, minLen = (o.minLen ?? 6) * PX;
  const strokes = [];
  for (let k = -R; k <= R; k += sp) {
    const kk = k + (D.rnd() - 0.5) * sp * (o.jit ?? 0.35);
    let run = null;
    const flush = (end) => {
      if (!run) return;
      const L = Math.hypot(end[0] - run[0], end[1] - run[1]);
      if (L >= minLen) {
        // split long runs into hand-length dashes
        let pieces = Math.max(1, Math.ceil(L / maxLen));
        for (let q = 0; q < pieces; q++) {
          let a = q / pieces, b = (q + 1) / pieces;
          a += D.r(0, o.shortenA ?? 0.08); b -= D.r(0, o.shortenB ?? 0.18);
          if (b - a <= 0.05) continue;
          const p0 = [run[0] + (end[0] - run[0]) * a, run[1] + (end[1] - run[1]) * a];
          const p1 = [run[0] + (end[0] - run[0]) * b, run[1] + (end[1] - run[1]) * b];
          strokes.push({ p0, p1, k: kk });
        }
      }
      run = null;
    };
    let last = null;
    for (let t = -R; t <= R; t += step) {
      const x = cx + nx * kk + ux * t, y = cy + ny * kk + uy * t;
      const ins = inside(x, y);
      if (ins && !run) run = [x, y];
      if (!ins && run) flush(last);
      last = [x, y];
    }
    flush(last);
  }
  if (o.reverse) strokes.reverse();
  const items = [];
  for (const h of strokes) {
    const L = Math.hypot(h.p1[0] - h.p0[0], h.p1[1] - h.p0[1]);
    const bow = (o.bow ?? 0.04) * (0.5 + D.rnd());
    const pts = o.flip ? linePts(h.p1[0], h.p1[1], h.p0[0], h.p0[1], { step: 1.5 * PX, bow }) : linePts(h.p0[0], h.p0[1], h.p1[0], h.p1[1], { step: 1.5 * PX, bow });
    const it = D.stroke(pts, {
      kind: o.kind || 'ink', w: (o.w ?? 1.3) * D.r(0.8, 1.15), d: (o.d ?? 0.6) * D.r(0.75, 1.1),
      speed: o.speed ?? 1.6, taper: o.taper ?? [3, Math.min(30, L / PX * 0.6)], press: 0.15, load: 0.1,
      gap: o.gap ?? 0.012, wet: o.wet ?? false, nib: o.nib,
    });
    if (it) items.push(it);
  }
  return items;
}

// ---------- rendering ----------
const CH_STYLE = ['rgba(255,0,0,', 'rgba(0,255,0,', 'rgba(0,0,255,'];
const easePen = (f) => 0.2 * f + 0.8 * smooth(f);

function fillChunk(ctx, Lx, Ly, Rx, Ry, i0, i1) {
  ctx.beginPath();
  ctx.moveTo(Lx[i0], Ly[i0]);
  for (let i = i0 + 1; i <= i1; i++) ctx.lineTo(Lx[i], Ly[i]);
  for (let i = i1; i >= i0; i--) ctx.lineTo(Rx[i], Ry[i]);
  ctx.closePath();
  ctx.fill();
}

// scratch buffers
let BUF = { n: 0 };
function buf(n) {
  if (BUF.n < n) BUF = { n: n * 2, Lx: new Float32Array(n * 2), Ly: new Float32Array(n * 2), Rx: new Float32Array(n * 2), Ry: new Float32Array(n * 2), Wd: new Float32Array(n * 2), Dd: new Float32Array(n * 2), Ss: new Float32Array(n * 2) };
  return BUF;
}

function drawStroke(ctx, it, t, o) {
  const f = it.t1 > it.t0 ? clamp01((t - it.t0) / (it.t1 - it.t0)) : 1;
  if (f <= 0) return;
  const Lr = it.L * easePen(f);
  const { pts, s, W, D } = it;
  let k = 0;
  while (k < pts.length - 1 && s[k + 1] <= Lr) k++;
  const B = buf(pts.length + 2);
  // vertices 0..k plus the interpolated pen point
  let n = 0;
  const push = (x, y, w, d, ss) => { B.Lx[n] = x; B.Ly[n] = y; B.Wd[n] = w; B.Dd[n] = d; B.Ss[n] = ss; n++; };
  for (let i = 0; i <= k; i++) push(pts[i][0], pts[i][1], W[i], D[i], s[i]);
  if (k < pts.length - 1 && Lr > s[k]) {
    const u = (Lr - s[k]) / (s[k + 1] - s[k]);
    push(pts[k][0] + (pts[k + 1][0] - pts[k][0]) * u, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * u, W[k] + (W[k + 1] - W[k]) * u, D[k], Lr);
  }
  if (n < 2) return;
  const drawing = f < 1;
  // offsets with averaged normals
  const Px = new Float32Array(n), Py = new Float32Array(n);
  for (let i = 0; i < n; i++) { Px[i] = B.Lx[i]; Py[i] = B.Ly[i]; }
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
    let tx = Px[b] - Px[a], ty = Py[b] - Py[a];
    const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    let w = B.Wd[i] * 0.5;
    if (drawing && i === n - 1) w *= 1.15;   // the wet head of the nib
    B.Lx[i] = Px[i] - ty * w; B.Ly[i] = Py[i] + tx * w;
    B.Rx[i] = Px[i] + ty * w; B.Ry[i] = Py[i] - tx * w;
  }
  const style = CH_STYLE[it.ch];
  const C = o.chunk || 6;
  const gain = o.gain ?? 1;
  for (let i0 = 0; i0 < n - 1; i0 += C) {
    const i1 = Math.min(n - 1, i0 + C);
    let d = 0; for (let i = i0; i <= i1; i++) d += B.Dd[i]; d /= (i1 - i0 + 1);
    ctx.fillStyle = style + clamp01(d * gain).toFixed(3) + ')';
    fillChunk(ctx, B.Lx, B.Ly, B.Rx, B.Ry, i0, i1);
  }
  // wet bead: relief on the freshly laid part (dries over ~tau seconds)
  if (it.wet && o.wet !== false) {
    const tau = o.wetTau ?? 1.1;
    const dt = it.t1 - it.t0;
    ctx.fillStyle = 'rgba(0,0,255,1)';
    for (let i0 = 0; i0 < n - 1; i0 += C) {
      const i1 = Math.min(n - 1, i0 + C);
      const sm = B.Ss[Math.floor((i0 + i1) / 2)] / it.L;
      const tl = it.t0 + dt * sm;                     // when the pen laid this part
      const wv = Math.exp(-Math.max(0, t - tl) / tau);
      if (wv < 0.04) continue;
      ctx.fillStyle = 'rgba(0,0,255,' + (wv * 0.9).toFixed(3) + ')';
      fillChunk(ctx, B.Lx, B.Ly, B.Rx, B.Ry, i0, i1);
    }
  }
}

function drawText(ctx, it, t, o) {
  const f = it.t1 > it.t0 ? clamp01((t - it.t0) / (it.t1 - it.t0)) : 1;
  if (f <= 0) return;
  ctx.save();
  ctx.translate(it.x, it.y);
  ctx.rotate(it.angle);
  if (it.mirror) ctx.scale(-1, 1);
  if (it.slant) ctx.transform(1, 0, it.slant, 1, 0, 0);
  // fonts don't scale below ~1px nicely: render at a nominal pixel size and scale down
  const base = 64;
  const sc = it.size / base;
  ctx.scale(sc, sc);
  ctx.font = `${it.font === 'italic' ? 'italic ' : ''}${base}px "IM Fell English"`;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  const words = it.str.split(' ');
  const total = ctx.measureText(it.str).width;
  if (f < 1) { ctx.beginPath(); ctx.rect(-base, -base * 1.4, total * f + base, base * 2.2); ctx.clip(); }
  const space = ctx.measureText(' ').width;
  let x = 0;
  const style = CH_STYLE[KIND_CH[it.kind] ?? 0];
  words.forEach((w, i) => {
    const d = clamp01(it.d * (0.82 + 0.28 * hash1(it.id * 31 + i, 9)) * (o.gain ?? 1));
    ctx.fillStyle = style + d.toFixed(3) + ')';
    ctx.fillText(w, x, 0);
    x += ctx.measureText(w).width + space;
  });
  ctx.restore();
}

// view: { cx, cy, zoom, rot } ; W, H output pixels
export function viewMatrix(view, W, H) {
  const s = view.zoom * H, c = Math.cos(view.rot), n = Math.sin(view.rot);
  const a = s * c, b = s * n, cc = -s * n, d = s * c;
  return [a, b, cc, d, W / 2 - (a * view.cx + cc * view.cy), H / 2 - (b * view.cx + d * view.cy)];
}

export function renderDrawing(ctx, drawing, t, view, W, H, o = {}) {
  ctx.save();
  ctx.setTransform(...viewMatrix(view, W, H));
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineJoin = 'round';
  for (const it of drawing.items) {
    if (t < it.t0) continue;
    if (it.type === 'stroke') drawStroke(ctx, it, t, o);
    else if (it.type === 'text') drawText(ctx, it, t, o);
  }
  ctx.restore();
}
