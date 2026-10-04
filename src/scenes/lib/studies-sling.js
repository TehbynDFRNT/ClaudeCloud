// The parts of David's sling for F29.1 (scene 'studies'), drawn as a master's pen study rather than a diagram:
// plaited cords with their strands, a leather pouch cupping the stone (cut edge, stitched hem, gathered folds at
// the tips), the knots that tie the cords through the tips, and a river pebble modelled by contour hatching.
// One light for everything: from the upper left, a little in front of the page (as the parchment's key light).
// Page units, y down; widths in px1080. All randomness comes from the Drawing's seeded generator or fnoise.
import { PX, TAU, fnoise, resample } from './studies-ink.js';

export const L2 = [-0.6, -0.8];                                   // toward the light, on the page
const L3 = (() => { const v = [-0.5, -0.66, 0.56], l = Math.hypot(...v); return v.map((c) => c / l); })();
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const len = (pts) => { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; };
const hidden = (hide, x, y) => !!hide && hide(x, y);

// a polyline with arc length: point / tangent / left normal at any length s
function track(pts) {
  const P = resample(pts, 1.2 * PX), S = [0];
  for (let i = 1; i < P.length; i++) S.push(S[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const L = S[S.length - 1];
  const at = (s) => {
    s = Math.min(L, Math.max(0, s));
    let i = Math.min(P.length - 2, Math.max(0, Math.floor((s / L) * (P.length - 1))));
    while (i > 0 && S[i] > s) i--;
    while (i < P.length - 2 && S[i + 1] < s) i++;
    const u = (s - S[i]) / ((S[i + 1] - S[i]) || 1e-9);
    const t = [P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]], l = Math.hypot(t[0], t[1]) || 1;
    return { p: [P[i][0] + t[0] * u, P[i][1] + t[1] * u], t: [t[0] / l, t[1] / l], n: [-t[1] / l, t[0] / l] };
  };
  return { P, S, L, at };
}

// Hatch along given curves: each curve gets its own threshold, and only its runs where tone > threshold are
// inked, so lines run longer (and overlap into cross-hatching) where the form turns from the light.
export function curveHatch(D, curves, tone, o = {}) {
  const thr = o.thr ?? [0.15, 0.85], minLen = (o.minLen ?? 3) * PX;
  const out = [];
  for (const c of curves) {
    const th = thr[0] + (thr[1] - thr[0]) * D.rnd();
    const pts = resample(c, 1.2 * PX);
    let run = [];
    const flush = () => {
      if (run.length > 2) {
        // the hand stops a little short or over-runs, at random
        const a = Math.floor(D.r(0, 0.12) * run.length), b = run.length - Math.floor(D.r(0, 0.18) * run.length);
        const r = run.slice(a, Math.max(a + 2, b)), L = len(r);
        if (L >= minLen) {
          out.push(D.stroke(r, { kind: o.kind, w: (o.w ?? 1.1) * D.r(0.8, 1.15), d: (o.d ?? 0.7) * D.r(0.78, 1.1), speed: o.speed ?? 2,
            taper: [2, Math.min(18, (L / PX) * 0.45)], press: 0.15, load: 0.1, gap: o.gap ?? 0.006, wet: o.wet ?? false, nib: o.nib ?? 0.2 }));
        }
      }
      run = [];
    };
    for (const p of pts) { if (tone(p[0], p[1]) > th) run.push(p); else flush(); }
    flush();
  }
  return out;
}

// a contour inked by the hand: heavy where it turns from the light, thin and broken where the light hits it
export function litContour(D, pts, o = {}) {
  const T = track(pts), seg = (o.seg ?? 14) * PX;
  const w = o.w ?? 1.6, d = o.d ?? 0.9;
  let s = 0;
  while (s < T.L - 2 * PX) {
    const ln = seg * D.r(0.75, 1.3), s1 = Math.min(T.L, s + ln);
    const m = T.at((s + s1) / 2), side = o.outward ? o.outward(m.p) : m.n;
    const f = sm(-0.6, 0.7, -(side[0] * L2[0] + side[1] * L2[1]));       // 0 lit .. 1 in shadow
    const lit = f < 0.3 && D.rnd() < (o.breaks ?? 0.35);
    if (!lit) {
      const run = [];
      for (let q = s; q <= s1; q += 1.2 * PX) { const a = T.at(q); if (!hidden(o.hide, a.p[0], a.p[1])) run.push(a.p); else if (run.length) break; }
      if (run.length > 2) D.stroke(run, { w: w * (0.55 + 0.75 * f), d: d * (0.6 + 0.4 * f), speed: o.speed ?? 0.8, taper: [3, 4], gap: 0.004, wet: o.wet, press: 0.25, nib: 0.3 });
    }
    s = s1 - D.r(0, 1.5) * PX;
  }
}

// ---- the pebble: an irregular river stone, modelled by curved hatching across its form ----------------
export function pebble(D, c, o) {
  const { rx, ry, rot = 0, seed = 1, d = 0.9, detail = 1 } = o;
  const ca = Math.cos(rot), sa = Math.sin(rot);
  const toW = (x, y) => [c[0] + ca * x - sa * y, c[1] + sa * x + ca * y];
  const toL = (X, Y) => { const dx = X - c[0], dy = Y - c[1]; return [ca * dx + sa * dy, -sa * dx + ca * dy]; };
  const rf = (a) => 1 + 0.045 * fnoise(a * 1.3 + 0.4, seed) + 0.018 * fnoise(a * 3.7, seed + 9);
  const rad = (a) => rf(a) / Math.hypot(Math.cos(a) / rx, Math.sin(a) / ry);
  const qOf = (X, Y) => { const [x, y] = toL(X, Y); return Math.hypot(x, y) / rad(Math.atan2(y, x)); };
  const inside = (X, Y) => qOf(X, Y) < 0.97 && !hidden(o.hide, X, Y);
  // light on its (slightly lumpy) surface: 0 = in full light .. 1 = core shadow; reflected light at the rim
  const tone = (X, Y) => {
    const [x, y] = toL(X, Y), q = Math.min(0.995, Math.hypot(x / rx, y / ry) / rf(Math.atan2(y, x)));
    let nx = x / (rx * rx), ny = y / (ry * ry);
    const l = Math.hypot(nx, ny) || 1; nx = (nx / l) * q; ny = (ny / l) * q;
    const bump = 0.09 * fnoise(x * 260 + 3.1, seed + 2) * fnoise(y * 240 - 1.7, seed + 4);
    const wx = ca * nx - sa * ny + bump, wy = sa * nx + ca * ny - bump, nz = Math.sqrt(Math.max(0, 1 - q * q));
    const dif = wx * L3[0] + wy * L3[1] + nz * L3[2];
    let t = 0.86 - 1.25 * Math.max(0, dif);
    t -= 0.32 * sm(0.78, 0.99, q) * sm(0.1, 0.7, -(wx * L2[0] + wy * L2[1]) / Math.max(0.2, q));   // reflected light
    if (o.shade) t += o.shade(X, Y);
    return Math.max(0, t) * (o.dark ?? 1);
  };
  // the outline, firm on the shadow side (o.outlineFirst: drawn before the hatching, as a stone drawn fresh)
  const drawOutline = () => {
    const outline = [];
    const a0 = Math.atan2(L2[1], L2[0]) - rot + 0.4;
    for (let i = 0; i <= 120; i++) { const a = a0 + (i / 120) * TAU * 1.02; outline.push(toW(Math.cos(a) * rad(a), Math.sin(a) * rad(a))); }
    litContour(D, outline, { w: o.ow ?? 2.0, d, hide: o.hide, wet: o.wet, outward: (p) => { const v = [p[0] - c[0], p[1] - c[1]], l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l]; }, breaks: o.breaks ?? (detail ? 0.3 : 0.25) });
  };
  if (o.outlineFirst) drawOutline();
  const r = Math.max(rx, ry), spA = (o.sp ?? 1.9) * PX * (detail ? 1 : 1.5);
  const sh = (k) => (X, Y) => (inside(X, Y) ? tone(X, Y) * k : 0);
  // family A: across the stone's long axis, bowed round its belly
  const fam = (ang, bow, sp, ext = 1.25) => {
    const cs = Math.cos(ang), sn = Math.sin(ang), out = [];
    for (let k = -r * ext; k <= r * ext; k += sp * D.r(0.8, 1.2)) {
      const pts = [];
      for (let u = -r * ext; u <= r * ext; u += 1.2 * PX) {
        const b = bow * r * (1 - (u / (r * ext)) ** 2) * Math.sign(k + 1e-9) * Math.min(1, Math.abs(k) / (r * 0.5));
        const x = u * cs - (k + b) * sn, y = u * sn + (k + b) * cs;
        pts.push(toW(x, y));
      }
      out.push(pts);
    }
    return out;
  };
  curveHatch(D, fam(0.35, 0.22, spA), sh(1), { w: o.hw ?? 1.15, d: d * 0.85, thr: [0.12, 0.6], wet: o.wet });
  curveHatch(D, fam(-0.95, 0.18, spA * 1.15), sh(1), { w: (o.hw ?? 1.15) * 0.95, d: d * 0.85, thr: [0.45, 0.85], wet: o.wet });
  if (detail) {
    curveHatch(D, fam(1.35, 0.1, spA * 0.9), sh(1), { w: 1.0, d: d * 0.85, thr: [0.72, 0.95], wet: o.wet });
    // pits and grains in the half-tone
    for (let i = 0; i < 7; i++) {
      const a = D.r(0, TAU), q = D.r(0.2, 0.75), p = toW(Math.cos(a) * rx * q, Math.sin(a) * ry * q);
      if (!inside(p[0], p[1]) || tone(p[0], p[1]) < 0.25) continue;
      const e = add(p, [Math.cos(a + 1.7), Math.sin(a + 1.7)], D.r(1.5, 3) * PX);
      D.stroke([p, e], { w: 1.3, d: d * 0.9, speed: 0.4, taper: [1, 1], gap: 0.003 });
    }
  }
  if (!o.outlineFirst) drawOutline();
  return { inside, tone, qOf, toW };
}

// ---- a plaited cord: two edges, the strands as chevrons, shading on its shadow side ---------------------
export function braid(D, pts, o) {
  const T = track(pts), hw = o.w / 2, pitch = o.pitch ?? o.w * 1.45, d = o.d ?? 0.9;
  const lit = (n) => n[0] * L2[0] + n[1] * L2[1];
  const vis = (p) => !hidden(o.hide, p[0], p[1]);
  const runs = (f, s0, s1, step = 1.2 * PX) => {
    const out = []; let cur = [];
    for (let s = s0; s <= s1; s += step) { const p = f(s); if (p && vis(p)) cur.push(p); else { if (cur.length > 2) out.push(cur); cur = []; } }
    if (cur.length > 2) out.push(cur);
    return out;
  };
  const edge = (sg) => (s) => { const a = T.at(s), wv = 1 + 0.07 * fnoise(s * 900, o.seed ?? 3 + sg); return add(a.p, a.n, sg * hw * wv); };
  // edges: the one away from the light firm, the lit one fine and broken
  for (const sg of [1, -1]) {
    const shadow = lit([T.at(T.L / 2).n[0] * sg, T.at(T.L / 2).n[1] * sg]) < 0;
    let s = 0;
    while (s < T.L) {
      const ln = (shadow ? 40 : 16) * PX * D.r(0.6, 1.4), s1 = Math.min(T.L, s + ln);
      if (shadow || D.rnd() > 0.08) for (const r of runs(edge(sg), s, s1)) D.stroke(r, { w: (shadow ? 1.25 : 0.7) * (o.ew ?? 1), d: d * (shadow ? 1 : 0.7), speed: 1.2, taper: [3, 4], gap: 0.002, wet: o.wet });
      s = s1 + (shadow ? 0 : D.r(0.5, 2) * PX);
    }
  }
  if (o.detail === 0) return T;
  const shSide0 = lit(T.at(T.L / 2).n) < 0 ? 1 : -1;
  // the cord's roundness: a broken line of shade inside its shadow edge
  for (const r of runs((s) => { const a = T.at(s); return add(a.p, a.n, shSide0 * hw * 0.5); }, 0, T.L)) {
    for (let i = 0; i < r.length; i += 30) { const seg = r.slice(i, i + 22); if (seg.length > 4 && D.rnd() < 0.8) D.stroke(seg, { w: 0.7, d: d * 0.6, speed: 1.5, taper: [3, 3], gap: 0.002, wet: o.wet }); }
  }
  // strands: the plait seen as lozenges laid on the diagonal, each a swelling curved stroke from edge to edge;
  // on the shadow half each gets a second, shorter stroke and a tick tucked under it
  const shSide = lit(T.at(T.L / 2).n) < 0 ? 1 : -1;
  const pt = (s, f) => { const a = T.at(s); return add(a.p, a.n, f * hw); };
  for (let s = D.r(0, pitch); s < T.L - pitch * 1.2; s += pitch * D.r(0.88, 1.12)) {
    const r = [];
    for (let i = 0; i <= 10; i++) {
      const u = i / 10, f = (-0.72 + 1.68 * u) * -shSide;
      r.push(pt(s + pitch * (0.95 * u + 0.18 * Math.sin(Math.PI * u)), f));
    }
    if (r.every(vis)) {
      D.stroke(r.slice(0, 6), { w: 0.7 * (o.sw ?? 1), d: d * 0.62, speed: 1.5, taper: [1, 1], gap: 0.002, wet: o.wet });
      D.stroke(r.slice(5), { w: 1.0 * (o.sw ?? 1), d: d * 0.85, speed: 1.5, taper: [1, 2], gap: 0.002, wet: o.wet });
    }
    // the shadowed part of the strand
    const q = [pt(s + pitch * 0.55, -shSide * 0.15), pt(s + pitch * 0.72, -shSide * -0.45), pt(s + pitch * 0.84, -shSide * -0.85)];
    if (q.every(vis)) D.stroke(q, { w: 0.85 * (o.sw ?? 1), d: d * 0.8, speed: 1.5, taper: [1, 2], gap: 0.002, wet: o.wet });
  }
  return T;
}

// ---- the knot where a cord is tied back on itself below its hole -------------------------------------
// p: the knot's centre on the cord, dir: unit direction along the cord toward the pouch, s: size (page units),
// o.side: +1/-1, which side the tied-back tail lies on; o.cw: the cord's width
export function knot(D, p, dir, s, o = {}) {
  const d = o.d ?? 0.92, n = [-dir[1], dir[0]], sd = o.side ?? 1, cw = o.cw ?? s * 0.6;
  const P = (u, v) => add(add(p, dir, u * s), n, v * s * sd);
  const out = (cu, cv) => (q) => { const c = P(cu, cv), v = [q[0] - c[0], q[1] - c[1]], l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l]; };
  // the tail, tied back: it leaves the knot toward the hand and lies along the cord, whipped, then frays
  const tl = o.tail ?? 1.8, tw = cw / s / 2;
  for (const e of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= 14; i++) { const u = i / 14; pts.push(P(-0.5 - u * tl, 0.42 + tw * 1.15 + e * tw * (1 - 0.35 * u) + 0.05 * Math.sin(u * 4))); }
    D.stroke(pts, { w: e > 0 ? 1.15 : 0.8, d: d * (e > 0 ? 0.95 : 0.75), speed: 0.5, taper: [2, 6], gap: 0.003 });
  }
  for (let i = 0; i < 3; i++) {
    const u = 0.25 + i * 0.16, a = P(-0.5 - u * tl, 0.42 + tw * 2.3), b = P(-0.5 - (u + 0.06) * tl, 0.3);
    D.stroke([a, b], { w: 0.95, d: d * 0.9, speed: 0.4, taper: [1, 1], gap: 0.002 });
  }
  for (const [v2, a] of [[-0.12, -0.25], [0.12, 0.2]]) {
    const b = P(-0.5 - tl, 0.42 + tw * 1.15 + v2 * 0.5), e = P(-0.5 - tl - 0.45, 0.42 + tw * 1.15 + v2 * 0.5 + a);
    D.stroke([b, e], { w: 0.65, d: d * 0.75, speed: 0.4, taper: [1, 4], gap: 0.002 });
  }
  // the knot: a firm lump twice the cord's width, a turn crossing it, shaded on its side away from the light
  const lump = [];
  for (let i = 0; i <= 50; i++) { const a = (i / 50) * TAU * 1.03; lump.push(P(Math.cos(a) * 0.62, 0.12 + Math.sin(a) * 0.52 * (1 + 0.12 * Math.cos(a * 2)))); }
  litContour(D, lump, { w: o.w ?? 1.7, d, seg: 7, breaks: 0.2, outward: out(0, 0.12) });
  for (const k of [-0.18, 0.16]) {
    const pts = [];
    for (let i = 0; i <= 10; i++) { const u = -1 + (2 * i) / 10; pts.push(P(k + u * 0.3 + 0.08 * (1 - u * u), 0.12 + u * 0.5)); }
    D.stroke(pts, { w: 1.05, d: d * 0.9, speed: 0.4, taper: [2, 2], gap: 0.002 });
  }
  const cc = P(0, 0.12);
  const curves = [];
  for (let k = -0.65; k <= 0.65; k += 0.17) { const c2 = []; for (let u = -0.75; u <= 0.75; u += 0.05) c2.push(P(u * 0.62 + k * 0.25, 0.12 + k * 0.52 + 0.1 * (1 - u * u))); curves.push(c2); }
  curveHatch(D, curves, (x, y) => {
    const v = [(x - cc[0]) / (s * 0.55), (y - cc[1]) / (s * 0.55)], q = Math.hypot(...v);
    if (q > 0.95) return 0;
    return 0.3 + 0.7 * sm(-0.6, 0.6, -(v[0] * L2[0] + v[1] * L2[1]));
  }, { w: 0.85, d: d * 0.85, thr: [0.3, 0.8], minLen: 1.5 });
}

// ---- the leather pouch cradling the stone -------------------------------------------------------------
// Local frame: x along the swing (v), y outward from the hand (r), origin at the stone's centre.
// Under the pull of the turn the stone presses outward into the leather: the pouch folds round it into a
// cradle whose two tips are drawn together toward the hand (tx apart, ty in), the leather cups the stone's
// outer side and flanks, and the stone shows through the opening on the hand's side, framed by the pouch's
// cut and stitched edge. Returns geometry for occlusion, the cords' holes and the parabola's start.
export function pouch(D, o) {
  const { St, v, r, sx, sy, tx = 0.0105, ty = 0.056, th = 0.0042, d = 0.92, detail = 1, seed = 1 } = o;
  const Lp = (x, y) => add(add(St, v, x), r, y);
  const toL = (X, Y) => { const dx = X - St[0], dy = Y - St[1]; return [dx * v[0] + dy * v[1], dx * r[0] + dy * r[1]]; };
  const ex = sx + th, ey = sy + th * 2;
  // each flank: taut from its tip to its tangent on the wrapped stone (sagging in a little), then round it
  const flank = (sg) => {
    let best = -1e9, E = [ex, 0];
    for (let i = 0; i <= 720; i++) {
      const a = -Math.PI / 2 + (i / 720) * Math.PI, P = [Math.cos(a) * ex, Math.sin(a) * ey];
      const ang = Math.atan2(P[0] - tx, P[1] + ty);
      if (ang > best) { best = ang; E = P; }
    }
    const k = 1 + 0.035 * sg * (o.asym ?? 1);
    return (y) => {
      if (y <= -ty) return tx * k;
      if (y < E[1]) { const u = (y + ty) / (E[1] + ty); return (tx + (E[0] - tx) * u - 0.0022 * Math.sin(Math.PI * u)) * k; }
      return ex * Math.sqrt(Math.max(0, 1 - (y / ey) ** 2)) * k;
    };
  };
  const xR = flank(1), xL = flank(-1);
  const half = (x, y) => (x >= 0 ? xR(y) : xL(y));
  // the rim of the cup: across the stone a little outward of its middle, wrapping lower down the flanks
  const yLip = (x) => { const u = Math.min(1, Math.abs(x) / ex); return (o.lip ?? 0.42) * sy - ((o.lip ?? 0.42) + 0.15) * sy * u ** 2.2 + 0.0008 * fnoise(x * 150, seed); };
  const inHull = (X, Y) => { const [x, y] = toL(X, Y); return y > -ty && y < ey && Math.abs(x) < half(x, y); };
  const inOpen = (X, Y) => { const [x, y] = toL(X, Y); return y < yLip(x); };
  const inStoneE = (X, Y) => { const [x, y] = toL(X, Y); return (x / sx) ** 2 + (y / sy) ** 2 < 1; };
  const leather = (X, Y) => inHull(X, Y) && !(inOpen(X, Y) && inStoneE(X, Y));
  // pleats gathered at the tips, fanning up the flanks
  const folds = [];
  const fl = detail ? [[0.95, -0.15, 0.8], [0.7, -0.55, 0.7], [0.35, -0.85, 0.55], [0.0, -0.62, 0.45]] : [[0.85, -0.3, 0.7], [0.3, -0.75, 0.5]];
  for (const sg of [1, -1]) for (const [fx, fy, f] of fl) {
    const a = [sg * tx * 0.8, -ty + 0.002], yy = fy * sy, e = [sg * half(sg, yy) * fx, yy];
    if (fx === 0 && sg < 0) continue;
    folds.push({ a, b: [a[0] + (e[0] - a[0]) * f, a[1] + (e[1] - a[1]) * f], sg });
  }
  const foldD = (x, y) => {
    let m = 1e9;
    for (const f of folds) {
      const bx = f.b[0] - f.a[0], by = f.b[1] - f.a[1], l2 = bx * bx + by * by;
      const u = Math.min(1, Math.max(0, ((x - f.a[0]) * bx + (y - f.a[1]) * by) / l2));
      m = Math.min(m, Math.hypot(x - f.a[0] - bx * u, y - f.a[1] - by * u) / (0.003 * (1 - 0.6 * u) + 0.0007));
    }
    return m;
  };
  // the leather's light: a rounded cup, darkest where it turns away; inside the cup in shadow; pleats dark
  const cy = (ey - ty) / 2, ry = (ey + ty) / 2;
  const ltone = (X, Y) => {
    if (!leather(X, Y) || hidden(o.hide, X, Y)) return 0;
    const [x, y] = toL(X, Y);
    if (inOpen(X, Y)) return 0.5 + 0.45 * Math.exp(-(foldD(x, y) ** 2)) + 0.25 * sm(0.0, -sy, y);   // the gathered leather below the stone
    const qx = x / (Math.max(half(x, y), 0.004) * 1.08), qy = (y - cy) / (ry * 1.1), q = Math.min(0.97, Math.hypot(qx, qy));
    const l = Math.hypot(qx, qy) || 1, lx = (qx / l) * q, ly = (qy / l) * q;
    const n = [v[0] * lx + r[0] * ly, v[1] * lx + r[1] * ly, Math.sqrt(1 - q * q)];
    let t = 0.98 - 0.78 * Math.max(0, n[0] * L3[0] + n[1] * L3[1] + n[2] * L3[2]);
    t += 0.42 * Math.exp(-(foldD(x, y) ** 2));
    t += 0.22 * sm(0.0045, 0.0005, y - yLip(x));                            // the cut edge rolls over
    t -= 0.25 * sm(-ty * 0.6, -ty, y);                                       // the gathered neck: lit, its pleats tell
    return Math.max(0, t);
  };
  // hatching: meridians running from the tips round the cup (the grain of the gathered leather), and across
  const mer = [], lat = [];
  const nb = detail ? 22 : 10;
  for (let i = 0; i <= nb; i++) {
    const k = -1 + (2 * (i + D.r(-0.3, 0.3))) / nb, pts = [];
    for (let y = -ty + 0.009 * D.r(0.6, 1.4); y <= ey; y += 1.2 * PX) pts.push(Lp(k * half(k, y), y));
    mer.push(pts);
  }
  for (let y = -ty; y <= ey; y += (detail ? 2.1 : 3.4) * PX * D.r(0.85, 1.15)) {
    const pts = [];
    for (let i = 0; i <= 30; i++) { const k = -1 + (2 * i) / 30, x = k * half(k, y); pts.push(Lp(x, y + 0.0035 * (1 - k * k))); }
    lat.push(pts);
  }
  curveHatch(D, mer, ltone, { w: detail ? 0.95 : 0.8, d: d * 0.8, thr: [0.12, 0.55], wet: o.wet, minLen: 2 });
  curveHatch(D, lat, ltone, { w: detail ? 0.9 : 0.75, d: d * 0.8, thr: detail ? [0.42, 0.85] : [0.62, 0.95], wet: o.wet, minLen: 2 });
  if (detail) {
    const dk = [];
    for (let k = -ty; k <= ey; k += 1.6 * PX * D.r(0.85, 1.15)) dk.push([Lp(-ex, k - 0.01), Lp(ex, k + 0.01)]);
    curveHatch(D, dk, (X, Y) => (leather(X, Y) && inOpen(X, Y) && !hidden(o.hide, X, Y) ? ltone(X, Y) : 0), { w: 0.9, d: d * 0.8, thr: [0.6, 0.95], wet: o.wet, minLen: 1.5 });
  }
  // outline of the cup, tip round the outer side to tip
  const outline = [];
  for (let i = 0; i <= 90; i++) { const y = -ty + (ey + ty) * (i / 90); outline.push(Lp(xR(y), y)); }
  for (let i = 90; i >= 0; i--) { const y = -ty + (ey + ty) * (i / 90); outline.push(Lp(-xL(y), y)); }
  const oc = (p) => { const [x, y] = toL(p[0], p[1]), q = [x, y - cy * 0.5], l = Math.hypot(...q) || 1; return [(v[0] * q[0] + r[0] * q[1]) / l, (v[1] * q[0] + r[1] * q[1]) / l]; };
  litContour(D, outline, { w: o.ow ?? 2.1, d, outward: oc, breaks: 0.08, hide: o.hide, wet: o.wet, seg: 16 });
  // the rim's cut edge, its thickness, and the hem stitched in from it
  const rim = (off, a = -1, b = 1) => {
    const pts = [];
    for (let i = 0; i <= 80; i++) {
      const x = ex * (a + (b - a) * (i / 80)), y = yLip(x) + off;
      if (Math.abs(x) < half(x, y) - 0.0004) pts.push(Lp(x, y));
    }
    return pts;
  };
  D.stroke(rim(0), { w: (o.ow ?? 2.1) * 0.85, d: d * 0.95, speed: 0.6, taper: [4, 4], gap: 0.004, wet: o.wet });
  if (detail) {
    D.stroke(rim(0.0019, -0.92, 0.92), { w: 0.75, d: d * 0.7, speed: 0.8, taper: [6, 6], gap: 0.003, wet: o.wet });
    for (let x = -ex * 0.86; x <= ex * 0.86; x += 0.0052) {
      const y = yLip(x) + 0.0042;
      if (Math.abs(x) > half(x, y) - 0.002) continue;
      D.stroke([Lp(x - 0.0016, y - 0.0003), Lp(x + 0.0016, y + 0.0003)], { w: 1.25, d: d * 0.92, speed: 0.3, taper: [1, 1], gap: 0.002, wet: o.wet });
    }
  }
  // the pleats: a firm crease, a lighter one beside it
  for (const f of folds) {
    const A = Lp(...f.a), B = Lp(...f.b), n2 = [-(B[1] - A[1]), B[0] - A[0]], l = Math.hypot(...n2);
    const pts = [], pts2 = [];
    for (let i = 0; i <= 16; i++) {
      const u = i / 16, b = 0.001 * Math.sin(Math.PI * u) * f.sg;
      const p = add([A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u], n2, b / l);
      if (!leather(p[0], p[1]) && u > 0.15) break;
      pts.push(p); pts2.push(add(p, n2, (0.0014 / l) * (1 - u) * f.sg));
    }
    if (pts.length > 3) {
      D.stroke(pts, { w: detail ? 1.1 : 0.8, d: d * 0.9, speed: 0.6, taper: [2, 8], gap: 0.003, wet: o.wet });
      if (detail) D.stroke(pts2.slice(0, Math.ceil(pts2.length * 0.7)), { w: 0.6, d: d * 0.6, speed: 0.6, taper: [2, 6], gap: 0.003 });
    }
  }
  // holes punched through the tips, for the cords
  const H1 = Lp(tx * 0.95, -ty + 0.0055), H2 = Lp(-tx * 0.95, -ty + 0.0055);
  if (detail) for (const hc of [H1, H2]) {
    const pts = [];
    for (let i = 0; i <= 20; i++) { const a = (i / 20) * TAU * 1.05; pts.push(add(add(hc, v, Math.cos(a) * 0.0019), r, Math.sin(a) * 0.0024)); }
    D.stroke(pts, { w: 1.0, d, speed: 0.3, taper: [1, 1], gap: 0.002 });
  }
  const cover = (X, Y) => inHull(X, Y) && !inOpen(X, Y);
  return { Lp, toL, yLip, inHull, inOpen, leather, cover, outline, H1, H2 };
}
