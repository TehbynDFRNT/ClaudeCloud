// The drawings of the Renaissance studies, one builder per shot. Page units: frame height at zoom 1,
// origin at the page centre, y down. Times are shot-local seconds (negative = drawn before the cut).
// Geometry comes from lib/binary.js so the ink matches the fire.
import { Drawing, PX, TAU, spline, arcPts, linePts, hatch, mapPts, resample, fnoise } from './studies-ink.js';
import { lobeContour, streamPath, XG, XW, L1, R_LOBE_GIANT, R_CIRC, R_DISK } from './binary.js';

// --- shared helpers -------------------------------------------------------------------------------
function circleStroke(D, cx, cy, r, o = {}) {
  const a0 = o.a0 ?? D.r(0, TAU);
  const sweep = o.sweep ?? TAU * (1.0 + D.r(0.02, 0.06));      // compass arcs overshoot a little
  const pts = arcPts(cx, cy, r, a0, a0 + sweep * (o.dir ?? 1), { wob: o.wob ?? 0, seed: D.n + 3, step: o.step ?? 2 * PX });
  return D.stroke(pts, { taper: [5, 9], press: 0.12, nib: 0.3, ...o });
}
function dot(D, x, y, r = 2.2, o = {}) {
  const pts = arcPts(x, y, r * PX * 0.5, 0, TAU * 1.6, { step: 0.6 * PX });
  return D.stroke(pts, { w: r * 1.1, d: 0.95, speed: 0.08, taper: [1, 1], press: 0.05, ...o });
}
function cross(D, x, y, s = 7, o = {}) {
  D.stroke(linePts(x - s * PX, y - s * PX, x + s * PX, y + s * PX, { wob: 0.4 * PX, seed: D.n }), { w: 1.2, d: 0.7, speed: 0.4, ...o });
  D.stroke(linePts(x + s * PX, y - s * PX, x - s * PX, y + s * PX, { wob: 0.4 * PX, seed: D.n }), { w: 1.2, d: 0.7, speed: 0.4, ...o });
}
// a block of mirror-script lines; x is the RIGHT edge (Leonardo writes right to left)
function scriptBlock(D, lines, x, y, o = {}) {
  const lh = (o.lh ?? 30) * PX;
  lines.forEach((ln, i) => {
    const jx = (D.rnd() - 0.5) * 8 * PX * (o.ragged ?? 1);
    D.text(ln, x + jx, y + i * lh, { size: o.size ?? 22, d: (o.d ?? 0.6) * D.r(0.85, 1.08), cps: o.cps ?? 16, angle: (o.angle ?? 0) + (D.rnd() - 0.5) * 0.012, gap: 0.08, kind: o.kind });
  });
}

// --- S05: the Roche figure-eight in iron-gall ink -------------------------------------------------
export function codex() {
  const D = new Drawing(505);
  // scaled and placed so L1 and the dwarf fall where S04's ice-blue diagram left them (match cut)
  const S = 0.8, YC = 0.0, X1 = -0.0889;
  const P = (x, z) => [(x - L1[0]) * S + X1, z * S + YC];
  const gx = P(XG, 0), wx = P(XW, 0), l1 = P(L1[0], 0), com = P(0, 0);
  D.at(-30);
  // stylus-ruled axis (blind incision) then a light ink rule
  D.stroke(linePts(-0.88, YC, 0.88, YC, { step: 3 * PX }), { kind: 'relief', w: 1.6, d: 0.55, speed: 3, wet: false, taper: [2, 2] });
  D.stroke(linePts(-0.78, YC + 0.4 * PX, 0.84, YC - 0.6 * PX, { step: 2 * PX, wob: 0.25 * PX, seed: 3 }), { w: 0.9, d: 0.32, speed: 1.4, taper: [20, 40], press: 0.3 });
  // compass construction: orbits about the centre of mass, giant's volume circle, circularisation circle
  for (const [c, r, d] of [[com, 0.645 * S, 0.22], [com, 0.355 * S, 0.2], [gx, R_LOBE_GIANT * S, 0.28], [wx, R_CIRC * S, 0.3]]) {
    D.stroke(arcPts(c[0], c[1], r, 0, TAU, { step: 3 * PX }), { kind: 'relief', w: 1.2, d: 0.5, speed: 3, wet: false, taper: [2, 2] });
    circleStroke(D, c[0], c[1], r, { w: 0.8, d, speed: 1.2, wet: false, sweep: TAU * D.r(0.55, 0.9) });
  }
  // compass pivot holes
  for (const c of [com, gx, wx]) D.stroke(arcPts(c[0], c[1], 0.8 * PX, 0, TAU, { step: 0.5 * PX }), { kind: 'relief', w: 2.0, d: 0.9, speed: 0.1, wet: false });
  // perpendicular through L1
  D.stroke(linePts(l1[0], -0.36, l1[0] + 0.002, 0.36, { step: 2 * PX, wob: 0.3 * PX, seed: 9 }), { w: 0.8, d: 0.3, speed: 1.5, taper: [30, 30] });
  // centres
  cross(D, com[0], com[1], 5, { d: 0.55 });
  dot(D, gx[0], gx[1], 3.2);
  dot(D, wx[0], wx[1], 2.4);
  circleStroke(D, wx[0], wx[1], 7 * PX, { w: 1.0, d: 0.7, speed: 0.3, wob: 0.6 * PX });
  // hatching inside the giant's lobe, shadow side (lower right, away from the light)
  const gl = lobeContour('giant', 220).map(([x, z]) => P(x, z));
  const inLobe = (x, y) => { // point in polygon
    let c = false;
    for (let i = 0, j = gl.length - 1; i < gl.length; j = i++) {
      const [xi, yi] = gl[i], [xj, yj] = gl[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  const shade = (x, y) => {
    if (!inLobe(x, y)) return false;
    const dx = (x - gx[0]) / (R_LOBE_GIANT * S), dy = (y - gx[1]) / (R_LOBE_GIANT * S);
    return Math.min(1, Math.max(0, (dx * 0.5 + dy * 0.85 + 0.05) / 0.95));
  };
  hatch(D, shade, [gx[0] - 0.32, gx[1] - 0.32, gx[0] + 0.38, gx[1] + 0.38], { angle: Math.PI * 0.3, sp: 6, w: 1.0, d: 0.45, maxLen: 110, speed: 2.5, gap: 0.01, thr: [0.2, 0.95] });
  // mirror-script notes (written earlier)
  scriptBlock(D, ['la luna non à lume da sé', 'ma tanto quanto il sole', 'la vede tanto alumina', 'ogni grave tende al cientro'], -0.56, -0.33, { size: 19, lh: 25, d: 0.55 });
  scriptBlock(D, ['dove l’una sfera tocca', 'l’altra, quivi è il punto', 'che non à parte'], -0.6, 0.26, { size: 19, lh: 25, d: 0.5 });
  scriptBlock(D, ['il sole nõ si move'], 0.86, 0.33, { size: 18, d: 0.5 });
  // letters on the figure
  D.text('a', gx[0] - 0.012, gx[1] - 0.014, { size: 20, d: 0.7 });
  D.text('b', wx[0] + 0.02, wx[1] - 0.016, { size: 20, d: 0.7 });
  D.text('n', l1[0] - 0.006, l1[1] - 0.02, { size: 20, d: 0.7 });
  // ---- the figure-eight: one continuous line, giant lobe then dwarf lobe, completing at t ~ 0.65 s
  const wl = lobeContour('wd', 220).map(([x, z]) => P(x, z));
  const eight = resample([...gl, ...wl.slice(1)], 1.6 * PX);
  D.fitTo(0, -30, -3.3);
  D.at(-3.2);
  const fig = D.stroke(eight, { w: 3.1, d: 0.93, speed: 0.95, taper: [6, 10], press: 0.22, pfreq: 6, nib: 0.45, load: 0.3 });
  D.shift(0.65 - fig.t1, D.items.indexOf(fig));
  // ---- then the pen goes on: the stream leaves L1 and swings past the dwarf (ballistic path)
  const sp = streamPath({ maxT: 1.42, every: 10 }).map((q) => P(q.x, q.z));
  D.at(0.85);
  D.stroke(resample(sp, 1.6 * PX), { w: 1.6, d: 0.82, dur: 1.4, taper: [10, 26], press: 0.25, nib: 0.35, load: 0.2 });
  D.text('il fiume', sp[Math.floor(sp.length * 0.6)][0] + 0.08, sp[Math.floor(sp.length * 0.6)][1] + 0.055, { size: 18, d: 0.6, t0: 2.35, dur: 0.5 });
  return D;
}

// --- placeholders for the remaining shots (filled in below) ---------------------------------------
export function blank() { return new Drawing(1); }

// --- form helpers (closed shapes, occlusion) ------------------------------------------------------
export function inPoly(poly, x, y) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
// split a polyline into the runs that are not hidden by any occluder polygon
export function clipOut(pts, occ, pad = 0) {
  const runs = [];
  let cur = [];
  for (const p of pts) {
    const hid = occ.some((o) => inPoly(o, p[0], p[1]));
    if (hid) { if (cur.length > 1) runs.push(cur); cur = []; } else cur.push(p);
  }
  if (cur.length > 1) runs.push(cur);
  return runs.filter((r) => r.length > 2);
}
// piecewise-linear y(x) through points sorted by x
function lerpY(pts, x) {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) if (x <= pts[i + 1][0]) { const u = (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0]); return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u; }
  return pts[pts.length - 1][1];
}

// --- S10: Prometheus — a hand carrying fire in a fennel stalk, red chalk ---------------------------
// The hand is designed in a canonical frame (cm, y down, stalk vertical through the fist at x = 0,
// right fist seen from the back/thumb side, forearm leaving down-left) and rotated onto the page.
export function prometheus() {
  const D = new Drawing(1010);
  const CM = 0.0215;
  const O = [-0.36, 0.1];
  const TH = 0.58;                          // canonical -> page: clockwise, the stalk leans right
  const c = Math.cos(TH), s = Math.sin(TH);
  const T = (x, y) => [O[0] + (x * c - y * s) * CM, O[1] + (x * s + y * c) * CM];
  const Ti = (X, Y) => { const dx = (X - O[0]) / CM, dy = (Y - O[1]) / CM; return [dx * c + dy * s, -dx * s + dy * c]; };
  const TP = (pts) => resample(pts.map(([x, y]) => T(x, y)), 1.5 * PX);
  const sp = (ctrl, closed = false) => spline(ctrl, 0.1, closed);
  const CH = { kind: 'chalk', nib: 0, wet: false };

  // ---- forms (canonical cm) ----
  const F = [
    { top: [[-2.9, -4.3], [-1.0, -4.5], [0.6, -4.45], [1.45, -4.25]], tip: [[2.05, -3.95], [2.3, -3.3], [2.0, -2.62]], bot: [[1.35, -2.32], [0.0, -2.2], [-1.5, -2.25], [-2.9, -2.35]] },
    { top: [[-2.9, -2.3], [-1.2, -2.2], [0.6, -2.15], [1.75, -2.05]], tip: [[2.35, -1.8], [2.62, -1.15], [2.35, -0.42]], bot: [[1.65, -0.12], [0.2, -0.02], [-1.3, -0.06], [-2.85, -0.12]] },
    { top: [[-2.85, -0.1], [-1.2, -0.02], [0.4, 0.04], [1.5, 0.14]], tip: [[2.05, 0.4], [2.3, 1.0], [2.02, 1.66]], bot: [[1.4, 1.95], [0.1, 2.05], [-1.3, 2.0], [-2.7, 1.92]] },
    { top: [[-2.7, 1.92], [-1.2, 2.02], [0.2, 2.1], [0.95, 2.22]], tip: [[1.42, 2.45], [1.62, 2.95], [1.4, 3.42]], bot: [[0.8, 3.65], [-0.4, 3.75], [-1.6, 3.7], [-2.55, 3.55]] },
  ];
  const thumbTop = [[-8.1, -3.0], [-6.4, -4.6], [-4.6, -5.75], [-3.0, -5.95], [-1.4, -5.9], [-0.35, -5.78], [0.55, -5.35], [1.2, -4.75]];
  const thumbTip = [[1.6, -4.15], [1.62, -3.7]];
  const thumbBot = [[1.3, -3.5], [0.6, -3.85], [-0.2, -4.3], [-1.6, -4.38], [-3.0, -4.32], [-4.6, -4.05], [-6.2, -3.2], [-7.7, -2.1]];
  const nail = [[0.12, -5.3], [0.8, -5.05], [1.3, -4.5], [1.36, -4.05], [0.95, -4.15], [0.35, -4.62], [0.08, -4.95]];
  const backBot = [[-2.55, 3.55], [-4.4, 3.95], [-6.5, 3.95], [-8.1, 3.4]];
  const armTop = [[-8.1, -2.9], [-10.5, -2.0], [-14, -0.4], [-18, 1.9], [-22, 4.3]];
  const armBot = [[-8.1, 3.4], [-8.8, 4.05], [-10, 4.6], [-13, 6.6], [-17, 9.3], [-21, 12.0]];
  const back = [[-2.9, -4.4], [-4.8, -4.1], [-6.6, -3.4], [-8.2, -2.7], [-8.6, 0.5], [-8.1, 3.4], [-6.5, 3.95], [-4.4, 3.95], [-2.55, 3.55], [-2.7, 1.92], [-2.85, -0.1], [-2.9, -2.3]];
  const rStalk = (y) => 1.0 + 0.008 * (y + 17);
  const yTop = -14.0;

  // canonical polygons (shading masks) and page polygons (occlusion)
  const fingerC = F.map((f) => sp([...f.top, ...f.tip, ...f.bot], true));
  const thumbC = sp([...thumbTop, ...thumbTip, ...thumbBot], true);
  const fingerPoly = F.map((f) => sp([...f.top, ...f.tip, ...f.bot], true).map(([x, y]) => T(x, y)));
  const thumbPoly = sp([...thumbTop, ...thumbTip, ...thumbBot], true).map(([x, y]) => T(x, y));
  const backPoly = sp(back, true).map(([x, y]) => T(x, y));
  const armPoly = [...armTop, [-40, 9], [-40, 24], ...armBot.slice().reverse()].map(([x, y]) => T(x, y));
  const stalkPoly = [[-rStalk(yTop), yTop], [rStalk(yTop), yTop], [rStalk(32), 32], [-rStalk(32), 32]].map(([x, y]) => T(x, y));
  const front = [thumbPoly, ...fingerPoly];

  const contour = (ctrl, o = {}, occ = []) => {
    const pts = TP(sp(ctrl));
    let runs = occ.length ? clipOut(pts, occ) : [pts];
    if (o.broken) { // lit-side contours: the chalk lifts here and there
      const out = [];
      for (const r of runs) {
        let a = 0;
        while (a < r.length - 3) {
          const len = Math.floor(D.r(0.35, 1.0) * r.length / o.broken);
          const b = Math.min(r.length, a + Math.max(6, len));
          out.push(r.slice(a, b));
          a = b + Math.floor(D.r(2, 7));
        }
      }
      runs = out.filter((r) => r.length > 3);
    }
    for (const r of runs) {
      D.stroke(r, { ...CH, w: (o.w ?? 2.4) * 1.4, d: Math.min(1, (o.d ?? 0.75) * 1.1), speed: o.speed ?? 0.5, taper: o.taper ?? [12, 18], press: o.press ?? 0.35, pfreq: 14, load: 0.15 });
      if (o.search) { // a lighter searching line beside it
        const off = (D.rnd() - 0.5) * 2.4 * PX;
        const a = Math.floor(r.length * D.r(0, 0.25)), b = Math.floor(r.length * D.r(0.6, 1));
        const sub = r.slice(a, b).map(([x, y], i) => [x + off + 0.6 * PX * Math.sin(i * 0.05), y - off * 0.7]);
        if (sub.length > 3) D.stroke(sub, { ...CH, w: (o.w ?? 2.4) * 0.95, d: (o.d ?? 0.75) * 0.42, speed: 0.9, taper: [20, 20], press: 0.4 });
      }
    }
  };
  const shadeIn = (fn, occ, bbox, o) => {
    const inside = (X, Y) => {
      for (const q of occ) if (inPoly(q, X, Y)) return 0;
      const [x, y] = Ti(X, Y);
      return fn(x, y, X, Y);
    };
    const [x0, y0, x1, y1] = bbox;
    const corners = [T(x0, y0), T(x1, y0), T(x0, y1), T(x1, y1)];
    const bb = [Math.min(...corners.map((p) => p[0])), Math.min(...corners.map((p) => p[1])), Math.max(...corners.map((p) => p[0])), Math.max(...corners.map((p) => p[1]))];
    const oo = { kind: 'chalk', angle: 0.92, sp: 5.2, w: 1.7, d: 0.55, maxLen: 60, speed: 1.4, gap: 0.006, bow: 0.05, wet: false, ...o };
    oo.w *= 1.3; oo.sp *= 1.1; oo.d = Math.min(1, oo.d * 1.12);
    return hatch(D, inside, bb, oo);
  };
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const vIn = (top, bot, x, y) => { const yt = lerpY(top, x), yb = lerpY(bot, x); return (y - yt) / Math.max(0.1, yb - yt); };

  D.at(-60);
  // ---- stalk (behind the fist) ----
  const sL = [], sR = [];
  for (let y = yTop; y <= 34; y += 0.5) { sL.push([-rStalk(y), y]); sR.push([rStalk(y) + 0.04 * Math.sin(y * 0.7), y]); }
  contour(sL, { w: 1.7, d: 0.5, search: true, broken: 3 }, front);
  contour(sR, { w: 2.6, d: 0.8, search: true }, front);
  for (const k of [-0.5, 0.08, 0.56]) { // ribs
    const rib = []; for (let y = yTop + 0.6; y <= 34; y += 0.5) rib.push([k * rStalk(y) + 0.05 * Math.sin(y * 0.9 + k * 5), y]);
    for (const r of clipOut(TP(sp(rib)), front)) D.stroke(r, { ...CH, w: 1.1, d: 0.3, speed: 1.2, taper: [30, 30], press: 0.5 });
  }
  for (const yn of [-9.8, 11.5, 24]) { // nodes: a swelling ring and a leaf-base stub
    const r = rStalk(yn);
    contour([[-r - 0.12, yn - 0.1], [-r * 0.4, yn + 0.32], [r * 0.4, yn + 0.32], [r + 0.12, yn - 0.1]], { w: 1.8, d: 0.6, taper: [6, 6] }, front);
    contour([[-r - 0.1, yn + 0.45], [0, yn + 0.8], [r + 0.1, yn + 0.45]], { w: 1.2, d: 0.35, taper: [6, 6] }, front);
    if (yn > 0) {
      contour([[r + 0.08, yn + 0.1], [r + 0.9, yn - 1.4], [r + 1.25, yn - 3.0]], { w: 1.6, d: 0.55, taper: [4, 14] }, front);
      contour([[r + 0.05, yn + 0.5], [r + 0.75, yn - 0.6], [r + 1.25, yn - 3.0]], { w: 1.1, d: 0.4, taper: [4, 14] }, front);
    }
  }
  // open top of the stalk (the hollow pith keeps the ember)
  const rt = rStalk(yTop);
  contour(arcPts(0, yTop, rt, 0, TAU, { ry: rt * 0.38, step: 0.08 }), { w: 1.9, d: 0.7, taper: [4, 4] });
  contour(arcPts(0, yTop + 0.05, rt * 0.55, 0, TAU, { ry: rt * 0.2, step: 0.06 }), { w: 1.5, d: 0.75, taper: [3, 3] });
  // ---- forearm and back of hand ----
  contour(armTop, { w: 1.8, d: 0.5, search: true, taper: [12, 90], broken: 3 }, [thumbPoly]);
  contour(armBot, { w: 2.8, d: 0.85, search: true, taper: [12, 110] });
  contour(backBot, { w: 2.6, d: 0.8 });
  for (const [a, b] of [[[-8.0, -0.8], [-3.3, -3.1]], [[-8.1, 0.4], [-3.3, -1.0]], [[-8.0, 1.6], [-3.1, 1.0]]]) // extensor tendons
    contour([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 0.15], b], { w: 1.0, d: 0.28, taper: [30, 20], press: 0.5 });
  // knuckle heads along the back of the hand
  F.forEach((f, i) => {
    const y0 = f.top[0][1], y1 = f.bot[f.bot.length - 1][1], ym = (y0 + y1) / 2;
    contour([[-2.3, y0 + 0.25], [-3.1 - (i === 0 ? 0.25 : 0), ym - 0.25], [-2.85, y1 - 0.2]], { w: 1.9, d: 0.62, taper: [8, 10] }, [thumbPoly]);
  });
  // ---- fingers ----
  contour(F[0].top, { w: 1.8, d: 0.55 }, [thumbPoly]);
  F.forEach((f, i) => {
    const last = i === F.length - 1;
    const tipArc = [f.top[f.top.length - 2], f.top[f.top.length - 1], ...f.tip, f.bot[0], f.bot[1]];
    contour(tipArc, { w: 2.6, d: 0.85, taper: [8, 10] }, i === 0 ? [thumbPoly] : []);
    contour(f.bot, { w: last ? 2.6 : 2.0, d: last ? 0.82 : 0.62, taper: [6, last ? 18 : 60], search: last });
    // the middle phalanx folding under, just past the joint
    contour([[f.tip[2][0] - 0.1, f.tip[2][1] + 0.1], [f.tip[2][0] - 0.6, f.bot[0][1] + 0.3], [f.tip[2][0] - 1.2, f.bot[0][1] + 0.4]], { w: 1.4, d: 0.45, taper: [5, 12] }, i < 3 ? [fingerPoly[i + 1]] : []);
  });
  // ---- thumb (front-most) ----
  contour(thumbTop, { w: 2.0, d: 0.6, search: true, broken: 2 });
  contour([thumbTop[thumbTop.length - 2], thumbTop[thumbTop.length - 1], ...thumbTip, thumbBot[0], thumbBot[1]], { w: 2.6, d: 0.85, taper: [8, 8] });
  contour(thumbBot, { w: 2.5, d: 0.82, taper: [8, 30] });
  contour([...nail, nail[0]], { w: 1.4, d: 0.55, taper: [3, 3] });
  contour([[-4.4, -5.75], [-3.95, -5.2], [-3.95, -4.55]], { w: 1.2, d: 0.35, taper: [6, 6] });      // thumb joint creases
  contour([[-0.55, -5.72], [-0.3, -5.15], [-0.45, -4.4]], { w: 1.3, d: 0.45, taper: [6, 6] });

  // ---- shading (light from the upper left; hatching '\' as Leonardo, left-handed) ----
  const fb = [thumbPoly];
  F.forEach((f, i) => {
    const occ = i === 0 ? [thumbPoly] : [thumbPoly, ...fingerPoly.slice(0, i)];
    const fsh = (x, y) => {
      const v = vIn(f.top, [...f.bot].reverse(), x, y);
      if (v < 0 || v > 1.02 || !inPoly(fingerC[i], x, y)) return 0;
      let sh = (sm(0.3, 0.85, v) * 0.95 + sm(0.6, f.tip[1][0], x) * 0.35) * (1 - 0.45 * sm(0.9, 1.0, v));
      if (i > 0) sh += 0.75 * Math.exp(-v / 0.16) * sm(-2.5, 1.5, x);        // cast shadow of the finger above
      if (i === 0) sh += 1.0 * Math.exp(-Math.max(0, y - lerpY([...thumbBot].reverse(), x)) / 0.75);
      return Math.min(1, sh);
    };
    shadeIn(fsh, occ, [-3.2, f.top[0][1] - 0.5, f.tip[1][0] + 0.2, f.bot[0][1] + 0.5], { sp: 3.1, d: 0.58, w: 1.6 });
    shadeIn((x, y, X, Y) => Math.max(0, fsh(x, y) - 0.4) * 1.7, occ, [-3.2, f.top[0][1] - 0.5, f.tip[1][0] + 0.2, f.bot[0][1] + 0.5], { sp: 3.4, d: 0.5, angle: 1.06, w: 1.4 });
  });
  // thumb: underside in shadow, its top catching the light
  shadeIn((x, y) => {
    const v = vIn(thumbTop, [...thumbBot].reverse(), x, y);
    if (v < 0 || v > 1.02 || x < -8 || !inPoly(thumbC, x, y)) return 0;
    return Math.min(1, sm(0.4, 1.0, v) * 0.9 + sm(0.3, 1.7, x) * 0.25);
  }, [], [-8.5, -6.4, 1.9, -3.4], { sp: 3.2, d: 0.58, w: 1.6 });
  // back of the hand: the ulnar side turns away
  shadeIn((x, y) => (inPoly(back, x, y) ? Math.min(1, sm(1.0, 3.9, y) * 0.85 + sm(-4.6, -2.9, x) * 0.35 * (0.6 + 0.4 * Math.sin(y * 1.6 + 0.8))) : 0), fb.concat(fingerPoly), [-8.7, -4.5, -2.9, 4.0], { sp: 3.8, w: 1.5 });
  // forearm: lower side
  shadeIn((x, y) => {
    if (x > -8.2) return 0;
    const yt = lerpY([...armTop].reverse(), x), yb = lerpY([...armBot].reverse(), x);
    const v = (y - yt) / (yb - yt);
    if (v < 0 || v > 1) return 0;
    const refl = 1 - 0.6 * sm(0.88, 0.99, v);
    return (sm(0.35, 0.85, v) * 0.95 + 0.3 * sm(-9.5, -8.4, x) * sm(0.3, 1, v)) * sm(-21, -11, x) * refl;
  }, fb, [-22, -3, -8.2, 13], { sp: 3.6, maxLen: 160, thr: [0.25, 0.75], d: 0.42, shortenA: 0.2, shortenB: 0.25, w: 1.4, angle: 0.1, bow: 0.015 });
  // stalk: right side in shade with reflected light at the very edge
  shadeIn((x, y) => {
    const r = rStalk(y), u = x / r;
    if (Math.abs(u) > 1 || y < yTop + 0.3) return 0;
    return sm(-0.1, 0.55, u) * (1 - 0.5 * sm(0.8, 1.0, u));
  }, front, [-1.5, yTop, 1.6, 34], { sp: 3.4, maxLen: 70, thr: [0.2, 0.9], angle: -1.21 + 0.22, d: 0.5, w: 1.5, bow: 0.008 });

  // ---- a block of mirror script (written before the cut) ----
  scriptBlock(D, ['il foco furato nella ferula', 'portato di cielo in terra', 'alli omini'], 0.50, 0.08, { size: 21, lh: 29, d: 0.55, kind: 'chalk' });

  // the theft, small and faint: the giant's circle and the dwarf (drawn earlier); the stream's arc comes later
  const G0 = [0.31, -0.15], SC = 0.30;
  const Pb = (x, z) => [G0[0] + x * SC, G0[1] + z * SC];
  const gc = Pb(XG, 0), wc = Pb(XW, 0);
  D.stroke(arcPts(gc[0], gc[1], R_LOBE_GIANT * SC, -2.4, -2.4 + TAU * 1.03, { step: 1.5 * PX }), { ...CH, w: 1.6, d: 0.45, speed: 1.6, taper: [8, 8], press: 0.25 });
  D.stroke(arcPts(wc[0], wc[1], 0.011, 1, 1 + TAU * 1.1, { step: 1 * PX }), { ...CH, w: 1.5, d: 0.6, speed: 0.4, taper: [3, 3] });
  D.fitTo(0, -30, -0.05);
  const preT = D.mark();
  // ---- during the shot: last hatching near the top of the stalk, the flame, then the theft diagram ----
  D.at(0.0);
  shadeIn((x, y) => {
    const r = rStalk(y), u = x / r;
    if (Math.abs(u) > 1 || y < yTop + 0.3 || y > -6.6) return 0;
    return 0.4 + 0.6 * sm(-0.3, 0.7, u);
  }, front, [-1.5, yTop, 1.6, -6.5], { sp: 3.2, maxLen: 40, angle: -1.21 + 0.3, d: 0.45, speed: 2.2, gap: 0.004, thr: [0.3, 0.95], w: 1.4, bow: 0.008 });
  D.fitTo(preT, 0.0, 0.75);

  // flame rising from the hollow top: a teardrop body, two side tongues curling out, inner zone lines,
  // detached flicks and smoke curling off the tip
  const base = T(0, yTop);
  const flame = { x: base[0], y: base[1] - 0.004 };
  const bez = (p0, p1, p2, p3, n = 50) => {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, a = (1 - t) ** 3, b = 3 * (1 - t) ** 2 * t, c = 3 * (1 - t) * t * t, d = t ** 3;
      out.push([p0[0] * a + p1[0] * b + p2[0] * c + p3[0] * d, p0[1] * a + p1[1] * b + p2[1] * c + p3[1] * d]);
    }
    return out;
  };
  const FSC = 1.15;
  const FP = ([x, yu]) => [flame.x + x * FSC, flame.y - yu * FSC];   // flame frame: y up
  const fl = (pts, o) => D.stroke(resample(pts.map(FP), 1.4 * PX), { ...CH, press: 0.3, ...o, w: (o.w ?? 2) * 1.35 });
  // a lick of flame: both edges pulled up from the base to a sharp tip (S-curves)
  const tongue = (bl, br, tip, cl1, cl2, cr1, cr2, o = {}) => {
    fl(bez(bl, cl1, cl2, tip), { w: o.w ?? 2.2, d: o.d ?? 0.74, speed: o.speed ?? 0.45, taper: [8, 26], gap: 0.0 });
    fl(bez(br, cr1, cr2, tip), { w: (o.w ?? 2.2) * 1.08, d: (o.d ?? 0.74) * 1.05, speed: o.speed ?? 0.45, taper: [8, 26], gap: 0.03 });
  };
  D.at(0.65);
  const m0 = D.mark();
  tongue([-0.021, 0], [0.021, 0], [-0.034, 0.172], [-0.05, 0.05], [-0.012, 0.105], [0.046, 0.065], [0.0, 0.122]);   // main
  tongue([-0.03, 0.05], [-0.016, 0.075], [-0.07, 0.132], [-0.046, 0.088], [-0.058, 0.112], [-0.03, 0.104], [-0.05, 0.118], { w: 1.9, d: 0.66 });
  tongue([0.01, 0.06], [0.034, 0.04], [0.03, 0.128], [0.006, 0.09], [0.024, 0.108], [0.046, 0.08], [0.04, 0.104], { w: 1.8, d: 0.62 });
  tongue([-0.011, 0.012], [0.012, 0.012], [-0.016, 0.112], [-0.026, 0.05], [-0.006, 0.085], [0.024, 0.055], [-0.002, 0.09], { w: 1.4, d: 0.42 });
  tongue([-0.007, 0.006], [0.007, 0.006], [-0.003, 0.046], [-0.012, 0.022], [-0.004, 0.036], [0.012, 0.022], [0.002, 0.038], { w: 1.2, d: 0.36 });
  // detached flicks above
  tongue([-0.036, 0.15], [-0.03, 0.152], [-0.05, 0.19], [-0.042, 0.165], [-0.048, 0.18], [-0.03, 0.165], [-0.044, 0.18], { w: 1.3, d: 0.5 });
  tongue([0.012, 0.135], [0.018, 0.136], [0.016, 0.166], [0.01, 0.148], [0.014, 0.16], [0.022, 0.148], [0.018, 0.16], { w: 1.2, d: 0.46 });
  // smoke: two Leonardo curls drifting back (left) off the tip
  const tipX = flame.x - 0.036 * FSC, tipY = flame.y - 0.176 * FSC;
  const curl = (x0, y0, r0, turns, dirn, rise) => {
    const pts = [];
    for (let i = 0; i <= 90; i++) {
      const u = i / 90, a = dirn * u * turns * TAU, r = r0 * (1 - 0.75 * u);
      pts.push([x0 - u * 0.05 + Math.cos(a) * r - r0, y0 - u * rise + Math.sin(a) * r]);
    }
    return pts;
  };
  const sm2 = (pts, o) => D.stroke(resample(pts, 1.4 * PX), { ...CH, press: 0.5, ...o });
  sm2(curl(tipX, tipY - 0.01, 0.016, 1.3, -1, 0.04), { w: 1.1, d: 0.32, speed: 0.3, taper: [10, 30] });
  sm2(curl(tipX + 0.02, tipY - 0.035, 0.011, 1.1, -1, 0.03), { w: 1.0, d: 0.26, speed: 0.3, taper: [10, 30] });
  D.fitTo(m0, 0.45, 2.1);

  // the arc that links the large circle to the small one: the real ballistic stream from L1
  const arcS = streamPath({ maxT: 1.36, every: 10 }).map((q) => Pb(q.x, q.z));
  D.at(2.15);
  D.stroke(resample(arcS, 1.5 * PX), { ...CH, w: 1.4, d: 0.42, dur: 0.8, taper: [10, 20], press: 0.3 });
  D.text('dal grande al picholo', gc[0] + 0.19, gc[1] + 0.14, { size: 17, d: 0.42, kind: 'chalk', t0: 2.95, dur: 0.5 });
  D.flame = [flame.x - 0.014, flame.y - 0.08];
  return D;
}

// --- S14d: Leonardo's deluge — a vortex of braided water curls, drawing itself counter-clockwise ----
// Page y is down, so a visually counter-clockwise inward spiral has a DEcreasing page angle.
export function deluge() {
  const D = new Drawing(1414);
  const C = [0.0, 0.0];
  // base spiral: r = R0 exp(-b s), page angle th0 - s (counter-clockwise on screen, inward)
  const base = (th0, R0, b, s) => {
    const r = R0 * Math.exp(-b * s), a = th0 - s;
    return { p: [C[0] + Math.cos(a) * r, C[1] + Math.sin(a) * r], r, a };
  };
  // clothoid curl: leaves along `dir`, curvature grows, winding counter-clockwise (page angle decreasing)
  const curl = (p0, dir, len, k0, k1, n = 90) => {
    const pts = [p0.slice()];
    let x = p0[0], y = p0[1], th = dir;
    const dl = len / n;
    for (let i = 1; i <= n; i++) {
      const u = i / n;
      th -= (k0 + (k1 - k0) * u * u) * dl;
      x += Math.cos(th) * dl; y += Math.sin(th) * dl;
      pts.push([x, y]);
    }
    return pts;
  };
  const NS = 11;
  for (let k = 0; k < NS; k++) {
    const th0 = (k / NS) * TAU + D.r(-0.25, 0.25);
    const R0 = D.r(0.4, 0.56), b = D.r(0.2, 0.26);
    const sMax = Math.log(R0 / D.r(0.014, 0.03)) / b;
    const nl = 3 + Math.floor(D.r(0, 3));
    const t0 = -0.6 + D.r(0, 1.0), dur = D.r(0.9, 1.3);
    const wid = D.r(0.07, 0.11), tw = D.r(0.25, 0.45), om = D.r(1.6, 2.6);
    for (let j = 0; j < nl; j++) {
      const ph = (j / nl) * TAU;
      const pts = [];
      for (let s2 = 0; s2 <= sMax; s2 += 0.008) {
        const q = base(th0, R0, b, s2);
        const off = q.r * wid * ((j / (nl - 1) - 0.5) * 0.9 + tw * Math.sin(om * s2 + ph) * 0.5) * (1 - 0.6 * s2 / sMax);
        pts.push([q.p[0] + Math.cos(q.a) * off, q.p[1] + Math.sin(q.a) * off]);
      }
      D.stroke(resample(pts, 1.6 * PX), {
        w: (j === 0 ? 2.2 : 1.5) * D.r(0.8, 1.15), d: (j === 0 ? 0.88 : 0.62) * D.r(0.85, 1.1), dur, t0: t0 + j * 0.035,
        taper: [16, 50], press: 0.35, pfreq: 5, nib: 0.45, load: 0.35,
      });
    }
    // curls peeling off the outer edge as the pen passes
    const nc = 2 + Math.floor(D.r(0, 3));
    for (let q = 0; q < nc; q++) {
      const s0 = sMax * D.r(0.05, 0.55);
      const B = base(th0, R0, b, s0);
      const outer = B.r * wid * 0.5;
      const p0 = [B.p[0] + Math.cos(B.a) * outer, B.p[1] + Math.sin(B.a) * outer];
      const dir = B.a - Math.PI / 2 + D.r(0.2, 0.55);          // along the flow, angled outward
      const len = B.r * D.r(0.5, 0.95);
      const k0 = 1.0 / len, k1 = D.r(26, 42) / len;
      const tl = t0 + dur * (s0 / sMax) * 0.85;
      D.stroke(resample(curl(p0, dir, len, k0, k1), 1.3 * PX), { w: 1.6 * D.r(0.8, 1.2), d: 0.75 * D.r(0.8, 1.1), t0: tl, dur: D.r(0.22, 0.36), taper: [6, 26], press: 0.35, nib: 0.45 });
      if (D.rnd() < 0.6) { // a second, inner line of the same curl
        const p1 = [p0[0] - Math.cos(B.a) * outer * 0.25, p0[1] - Math.sin(B.a) * outer * 0.25];
        D.stroke(resample(curl(p1, dir - 0.1, len * 0.8, k0 * 1.1, k1 * 1.1), 1.3 * PX), { w: 1.1, d: 0.55, t0: tl + 0.05, dur: 0.3, taper: [6, 26], press: 0.35 });
      }
    }
  }
  // the eye of the vortex: a tight coil
  const coil = [];
  for (let i = 0; i <= 200; i++) { const u = i / 200, a = 1.3 - u * 3.4 * TAU, r = 0.05 * Math.pow(1 - u, 1.25) + 0.002; coil.push([C[0] + Math.cos(a) * r, C[1] + Math.sin(a) * r]); }
  D.stroke(resample(coil, 1.2 * PX), { w: 2.2, d: 0.92, t0: 0.35, dur: 0.95, taper: [10, 10], press: 0.3, nib: 0.4 });
  // outer spray: broken arcs flung outward
  for (let k = 0; k < 14; k++) {
    const a0 = D.r(0, TAU), r = D.r(0.44, 0.62), len = D.r(0.2, 0.5);
    const pts = arcPts(C[0], C[1], r, a0, a0 - len, { wob: 0.012, seed: k + 90 });
    D.stroke(resample(pts, 1.6 * PX), { w: 1.2 * D.r(0.7, 1.2), d: 0.5 * D.r(0.7, 1.2), t0: -0.3 + D.r(0, 0.6), dur: D.r(0.3, 0.6), taper: [10, 30], press: 0.3 });
  }
  // a note in the corner, written long before
  D.at(-20);
  scriptBlock(D, ['moto revertiginoso', 'dell’acqua che si ragira', 'al cientro suo'], 0.72, -0.27, { size: 19, lh: 26, d: 0.5 });
  return D;
}

// --- F27.3: parabola construction — the dwarf as focus, the stream's pericentre arc --------------
export function parabola() {
  const D = new Drawing(2273);
  // stream around the dwarf; rotate so the axis (dwarf -> closest approach) is horizontal, vertex right
  const sp = streamPath({ maxT: 1.75, every: 4 });
  let iq = 0, dq = 9;
  sp.forEach((p, i) => { const d = Math.hypot(p.x - XW, p.z); if (d < dq) { dq = d; iq = i; } });
  const ang = Math.atan2(sp[iq].z, sp[iq].x - XW);
  const S = 0.1 / dq;                                   // pericentre distance -> 0.1 page units
  const F0 = [-0.16, 0.0];
  const ca = Math.cos(-ang), sa = Math.sin(-ang);
  const P = (x, z) => { const dx = x - XW, dz = z; return [F0[0] + (dx * ca - dz * sa) * S, F0[1] + (dx * sa + dz * ca) * S]; };
  const q = 0.1;                                        // focus-vertex distance
  // parabola with focus F0, vertex at F0 + (q, 0), opening to the left: x = F0x + q - y^2/(4q)
  const par = [];
  for (let y = -0.42; y <= 0.42; y += 0.004) par.push([F0[0] + q - (y * y) / (4 * q), F0[1] + y]);
  const dirX = F0[0] + 2 * q;
  D.at(-12);
  // ruled directrix and axis (stylus first, then ink)
  D.stroke(linePts(dirX, -0.45, dirX, 0.45, { step: 3 * PX }), { kind: 'relief', w: 1.6, d: 0.6, speed: 3, wet: false, taper: [2, 2] });
  D.stroke(linePts(dirX, -0.42, dirX + 0.001, 0.42, { wob: 0.3 * PX, seed: 4 }), { w: 1.3, d: 0.6, speed: 1.5, taper: [20, 30] });
  D.stroke(linePts(-0.85, F0[1], 0.6, F0[1] + 0.001, { wob: 0.3 * PX, seed: 5 }), { w: 0.9, d: 0.35, speed: 2, taper: [30, 30] });
  // the stream's arc (faint, earlier), sweeping round the dwarf
  D.stroke(resample(sp.slice(Math.max(0, iq - 70), Math.min(sp.length, iq + 40)).map((p) => P(p.x, p.z)), 1.5 * PX), { w: 1.6, d: 0.42, speed: 0.6, taper: [30, 40], press: 0.35 });
  // the focus
  dot(D, F0[0], F0[1], 3.0);
  circleStroke(D, F0[0], F0[1], 9 * PX, { w: 1.0, d: 0.6, speed: 0.3, wob: 0.5 * PX });
  D.text('f', F0[0] - 0.012, F0[1] - 0.02, { size: 20, d: 0.65 });
  scriptBlock(D, ['la linia curva del grave', 'equidistante dal punto', 'e dalla linia'], 0.66, -0.24, { size: 20, lh: 27, d: 0.52 });
  scriptBlock(D, ['il fiume che cade', 'intorno al picholo'], 0.6, 0.2, { size: 18, lh: 25, d: 0.45 });
  D.fitTo(0, -12, -0.1);
  // during the cut: the pen sweeps the parabola, then the equal-distance construction
  D.at(-0.15);
  const pz = D.stroke(resample(par, 1.6 * PX), { w: 2.4, d: 0.9, dur: 0.6, taper: [8, 14], press: 0.25, nib: 0.45 });
  const ys = [-0.24, 0.17, 0.3];
  D.at(0.3);
  for (const y of ys) {
    const px = F0[0] + q - (y * y) / (4 * q), py = F0[1] + y;
    D.stroke(linePts(F0[0], F0[1], px, py, { wob: 0.25 * PX, seed: 11 + y * 9 }), { w: 1.0, d: 0.5, dur: 0.12, taper: [6, 10], gap: 0.0 });
    D.stroke(linePts(px, py, dirX, py, { wob: 0.25 * PX, seed: 13 + y * 9 }), { w: 1.0, d: 0.5, dur: 0.1, taper: [6, 10], gap: 0.02 });
    dot(D, px, py, 2.2, { speed: 0.4 });
  }
  D.fitTo(D.items.indexOf(pz) + 1, 0.25, 0.72);
  return D;
}

// --- F29.1: the eye — concentric humours, rays converging through the pupil --------------------
export function eye() {
  const D = new Drawing(2291);
  const E0 = [0.3, 0.0], R = 0.2;
  D.at(-15);
  circleStroke(D, E0[0], E0[1], R, { w: 2.2, d: 0.85, speed: 0.6, wob: 0.8 * PX });                 // the eyeball
  circleStroke(D, E0[0], E0[1], R * 0.93, { w: 1.0, d: 0.45, speed: 0.8, wob: 0.6 * PX });
  // cornea bulging toward the light
  D.stroke(arcPts(E0[0] - R * 0.55, E0[1], R * 0.62, Math.PI - 0.95, Math.PI + 0.95, { wob: 0.4 * PX, seed: 3 }), { w: 1.8, d: 0.8, speed: 0.5, taper: [10, 10] });
  circleStroke(D, E0[0], E0[1], R * 0.36, { w: 1.6, d: 0.75, speed: 0.5, wob: 0.5 * PX });           // Leonardo's crystalline sphere, central
  circleStroke(D, E0[0], E0[1], R * 0.12, { w: 1.2, d: 0.6, speed: 0.4, wob: 0.3 * PX });
  // the optic nerve leaving behind
  D.stroke(linePts(E0[0] + R * 0.97, E0[1] - 0.025, E0[0] + R * 1.6, E0[1] - 0.04, { wob: 0.5 * PX, seed: 5, bow: 0.02 }), { w: 1.8, d: 0.75, speed: 0.5 });
  D.stroke(linePts(E0[0] + R * 0.97, E0[1] + 0.025, E0[0] + R * 1.6, E0[1] + 0.035, { wob: 0.5 * PX, seed: 6, bow: -0.02 }), { w: 1.8, d: 0.75, speed: 0.5 });
  // pupil gap in the iris
  D.stroke(linePts(E0[0] - R * 0.86, E0[1] - 0.055, E0[0] - R * 0.86, E0[1] - 0.02), { w: 2.4, d: 0.85, speed: 0.4 });
  D.stroke(linePts(E0[0] - R * 0.86, E0[1] + 0.02, E0[0] - R * 0.86, E0[1] + 0.055), { w: 2.4, d: 0.85, speed: 0.4 });
  // shade the lower back of the globe
  hatch(D, (x, y) => {
    const dx = x - E0[0], dy = y - E0[1], r = Math.hypot(dx, dy);
    if (r > R * 0.93 || r < R * 0.38) return 0;
    return Math.max(0, (dx * 0.5 + dy * 0.86) / R + 0.1) * 1.2;
  }, [E0[0] - R, E0[1] - R, E0[0] + R, E0[1] + R], { angle: 0.95, sp: 6, w: 1.0, d: 0.45, maxLen: 50, speed: 3, thr: [0.25, 0.9] });
  // the object: an upright arrow at the left
  const OB = [-0.62, 0.0];
  D.stroke(linePts(OB[0], OB[1] + 0.2, OB[0] + 0.002, OB[1] - 0.2, { wob: 0.5 * PX, seed: 8 }), { w: 2.2, d: 0.85, speed: 0.5 });
  D.stroke(linePts(OB[0], OB[1] - 0.2, OB[0] - 0.02, OB[1] - 0.165), { w: 1.8, d: 0.8, speed: 0.4 });
  D.stroke(linePts(OB[0], OB[1] - 0.2, OB[0] + 0.02, OB[1] - 0.165), { w: 1.8, d: 0.8, speed: 0.4 });
  scriptBlock(D, ['le spetie delle cose', 'per linie piramidali', 'concorrono alla pupilla'], -0.3, -0.3, { size: 19, lh: 26, d: 0.5 });
  D.text('a', OB[0] - 0.03, OB[1] - 0.2, { size: 20, d: 0.65 });
  D.text('b', OB[0] - 0.03, OB[1] + 0.2, { size: 20, d: 0.65 });
  D.fitTo(0, -15, -0.1);
  // during the cut: the rays, ruled fast, converge through the pupil and cross inside
  const pup = [E0[0] - R * 0.86, E0[1]];
  const back = (y0) => [E0[0] + R * 0.85, E0[1] - y0 * 0.4];
  D.at(-0.1);
  const r0i = D.mark();
  const rays = [[OB[0], OB[1] - 0.2], [OB[0], OB[1] + 0.2], [OB[0], OB[1] - 0.1], [OB[0], OB[1] + 0.1], [OB[0], OB[1]]];
  rays.forEach((p, i) => {
    const b = back(p[1] - OB[1]);
    D.stroke(linePts(p[0], p[1], pup[0], pup[1], { wob: 0.2 * PX, seed: 20 + i }), { w: i < 2 ? 1.4 : 1.0, d: i < 2 ? 0.75 : 0.5, dur: 0.16, taper: [6, 3], gap: 0.0, wet: true });
    D.stroke(linePts(pup[0], pup[1], b[0], b[1], { wob: 0.2 * PX, seed: 30 + i }), { w: i < 2 ? 1.3 : 0.9, d: i < 2 ? 0.7 : 0.45, dur: 0.08, taper: [3, 8], gap: 0.02 });
  });
  D.fitTo(r0i, -0.1, 0.72);
  return D;
}

// --- F30.3: the CNO cycle as an ink wheel of hatched spheres -----------------------------------
export function cno() {
  const D = new Drawing(3033);
  const C = [0.02, 0.0], R = 0.2;
  const names = [['C', '12'], ['N', '13'], ['C', '13'], ['N', '14'], ['O', '15'], ['N', '15']];
  const st = names.map((nm, i) => {
    const a = -Math.PI / 2 - (i / 6) * TAU;                      // counter-clockwise on screen
    return { a, p: [C[0] + Math.cos(a) * R, C[1] + Math.sin(a) * R], r: 0.034 + 0.0012 * (+nm[1] - 12), nm };
  });
  D.at(-15);
  D.stroke(arcPts(C[0], C[1], R, 0, TAU, { step: 3 * PX }), { kind: 'relief', w: 1.4, d: 0.5, speed: 3, wet: false });
  circleStroke(D, C[0], C[1], R, { w: 0.8, d: 0.25, speed: 1.2, wet: false });
  st.forEach((s, i) => {
    circleStroke(D, s.p[0], s.p[1], s.r, { w: 1.9, d: 0.85, speed: 0.35, wob: 0.6 * PX });
    hatch(D, (x, y) => {
      const dx = (x - s.p[0]) / s.r, dy = (y - s.p[1]) / s.r;
      if (dx * dx + dy * dy > 0.86) return 0;
      return Math.max(0, dx * 0.55 + dy * 0.8 + 0.35);
    }, [s.p[0] - s.r, s.p[1] - s.r, s.p[0] + s.r, s.p[1] + s.r], { angle: 0.95, sp: 4.2, w: 1.0, d: 0.55, speed: 3, thr: [0.2, 0.95] });
    const lp = [C[0] + Math.cos(s.a) * (R + s.r + 0.03), C[1] + Math.sin(s.a) * (R + s.r + 0.03)];
    D.text(s.nm[0], lp[0] + 0.012, lp[1] + 0.012, { size: 24, d: 0.7 });
    D.text(s.nm[1], lp[0] + 0.032, lp[1] - 0.006, { size: 14, d: 0.6 });
  });
  // protons arriving at C12, C13, N14, N15; positrons leaving N13, O15
  const protonAt = [0, 2, 3, 5], betaAt = [1, 4];
  for (const i of protonAt) {
    const s = st[i], am = s.a - Math.PI / 6;
    const p0 = [C[0] + Math.cos(am) * (R + 0.13), C[1] + Math.sin(am) * (R + 0.13)];
    const p1 = [C[0] + Math.cos(am) * (R + 0.055), C[1] + Math.sin(am) * (R + 0.055)];
    circleStroke(D, p0[0], p0[1], 0.011, { w: 1.4, d: 0.75, speed: 0.3 });
    D.stroke(linePts(p0[0] + (p1[0] - p0[0]) * 0.2, p0[1] + (p1[1] - p0[1]) * 0.2, p1[0], p1[1], { wob: 0.3 * PX, seed: i + 40 }), { w: 1.1, d: 0.6, speed: 0.6 });
  }
  for (const i of betaAt) {
    const s = st[i], am = s.a - Math.PI / 6;
    const pts = [];
    for (let k = 0; k <= 60; k++) { const u = k / 60, r = R + 0.05 + u * 0.1; pts.push([C[0] + Math.cos(am + 0.05 * Math.sin(u * 18)) * r, C[1] + Math.sin(am + 0.05 * Math.sin(u * 18)) * r]); }
    D.stroke(resample(pts, 1.4 * PX), { w: 1.1, d: 0.55, speed: 0.5, taper: [6, 6] });
  }
  // helium leaving from N15 -> C12 (inward)
  const hp = [C[0] + 0.02, C[1] + 0.02];
  circleStroke(D, hp[0], hp[1], 0.026, { w: 1.6, d: 0.8, speed: 0.35 });
  hatch(D, (x, y) => (Math.hypot(x - hp[0], y - hp[1]) < 0.024 ? Math.max(0, (x - hp[0]) * 20 + (y - hp[1]) * 30 + 0.4) : 0), [hp[0] - 0.03, hp[1] - 0.03, hp[0] + 0.03, hp[1] + 0.03], { angle: 0.95, sp: 4, w: 0.9, d: 0.55, speed: 3 });
  D.text('He', hp[0] + 0.016, hp[1] + 0.06, { size: 20, d: 0.6 });
  scriptBlock(D, ['la ruota del foco', 'che mai si ferma'], -0.36, 0.22, { size: 19, lh: 26, d: 0.5 });
  scriptBlock(D, ['il carbone si fa azoto', 'e l’azoto si fa carbone'], 0.74, -0.24, { size: 18, lh: 25, d: 0.45 });
  D.fitTo(0, -15, -0.1);
  // during the cut: the arrows race round the wheel (counter-clockwise)
  D.at(-0.12);
  const a0i = D.mark();
  st.forEach((s, i) => {
    const n = st[(i + 1) % 6];
    const a0 = s.a - (s.r + 0.012) / R, a1 = n.a + (n.r + 0.016) / R;
    const pts = arcPts(C[0], C[1], R, a0, a1, { step: 1.5 * PX });
    D.stroke(pts, { w: 1.6, d: 0.85, dur: 0.12, taper: [4, 2], gap: 0.0 });
    const e = pts[pts.length - 1], tdir = [Math.sin(a1), -Math.cos(a1)];      // ccw tangent
    const nrm = [Math.cos(a1), Math.sin(a1)];
    const hl = 0.016;
    D.stroke(linePts(e[0] - tdir[0] * hl + nrm[0] * hl * 0.6, e[1] - tdir[1] * hl + nrm[1] * hl * 0.6, e[0], e[1]), { w: 1.4, d: 0.85, dur: 0.03, gap: 0.0, taper: [3, 2] });
    D.stroke(linePts(e[0] - tdir[0] * hl - nrm[0] * hl * 0.6, e[1] - tdir[1] * hl - nrm[1] * hl * 0.6, e[0], e[1]), { w: 1.4, d: 0.85, dur: 0.03, gap: 0.0, taper: [3, 2] });
  });
  D.fitTo(a0i, -0.12, 0.72);
  return D;
}

// --- F31.4: compression — circles collapsing to a point -----------------------------------------
export function collapse() {
  const D = new Drawing(3141);
  const C = [0, 0];
  D.at(-10);
  // faint earlier circles (pentimenti) and converging radii
  for (let i = 0; i < 5; i++) circleStroke(D, C[0], C[1], 0.42 * Math.pow(0.8, i), { w: 0.9, d: 0.28, speed: 1.5, wet: false });
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * TAU + D.r(-0.05, 0.05);
    D.stroke(linePts(C[0] + Math.cos(a) * 0.5, C[1] + Math.sin(a) * 0.5, C[0] + Math.cos(a) * 0.05, C[1] + Math.sin(a) * 0.05, { wob: 0.3 * PX, seed: k }), { w: 1.0, d: 0.42, speed: 2.5, taper: [30, 6] });
  }
  D.fitTo(0, -10, -0.08);
  // during the cut: ever smaller circles, faster and darker, ending in a blot
  D.at(-0.04);
  const c0i = D.mark();
  for (let i = 0; i < 9; i++) {
    const r = 0.3 * Math.pow(0.66, i);
    circleStroke(D, C[0], C[1], r, { w: 1.6 + i * 0.15, d: 0.7 + i * 0.03, dur: 0.045, gap: 0.0, wet: true, sweep: TAU * 1.04 });
  }
  dot(D, C[0], C[1], 6, { dur: 0.06 });
  D.fitTo(c0i, -0.04, 0.35);
  return D;
}

// --- S29b: understanding endures — the shell's rings, the tiny centre, the giant, the motto ------
export function rings() {
  const D = new Drawing(2929);
  const C = [0, 0], R = 0.32;
  D.at(-40);
  // compass construction: centre hole and a stylus circle
  D.stroke(arcPts(C[0], C[1], 0.9 * PX, 0, TAU, { step: 0.5 * PX }), { kind: 'relief', w: 2.2, d: 0.9, speed: 0.1, wet: false });
  D.stroke(arcPts(C[0], C[1], R * 1.12, 0, TAU, { step: 3 * PX }), { kind: 'relief', w: 1.3, d: 0.5, speed: 3, wet: false });
  // the shell: two firm compass rings with a hatched band between (tone), fainter echoes outside
  const r0 = R * 0.955, r1 = R * 1.03;
  circleStroke(D, C[0], C[1], R, { w: 2.8, d: 0.92, speed: 0.7, sweep: TAU * 1.02, wob: 0.2 * PX });
  circleStroke(D, C[0], C[1], r0, { w: 1.5, d: 0.65, speed: 0.7, sweep: TAU * 1.02, wob: 0.2 * PX });
  circleStroke(D, C[0], C[1], r1, { w: 1.3, d: 0.55, speed: 0.7, sweep: TAU * 1.01, wob: 0.2 * PX });
  circleStroke(D, C[0], C[1], R * 0.905, { w: 0.8, d: 0.3, speed: 0.9, sweep: TAU * 0.7, wob: 0.3 * PX });
  // band tone: fine hatching, heavier on the lower right (away from the light), with clumped knots
  const knots = [];
  for (let k = 0; k < 30; k++) knots.push([(k / 30) * TAU + D.r(-0.07, 0.07), D.r(0.97, 1.01), D.r(0.006, 0.012)]);
  hatch(D, (x, y) => {
    const dx = x - C[0], dy = y - C[1], r = Math.hypot(dx, dy);
    if (r < r0 + 1.2 * PX || r > r1 - 1.0 * PX) return 0;
    const a = Math.atan2(dy, dx);
    let v = 0.55 + 0.35 * Math.max(0, (dx * 0.6 + dy * 0.8) / r);
    for (const [ka, kr, ks] of knots) { const kx = C[0] + Math.cos(ka) * R * kr, ky = C[1] + Math.sin(ka) * R * kr; v += 0.6 * Math.exp(-((x - kx) ** 2 + (y - ky) ** 2) / (ks * ks)); }
    return Math.min(1, v + 0.05 * Math.sin(a * 23));
  }, [C[0] - r1, C[1] - r1, C[0] + r1, C[1] + r1], { angle: 0.95, sp: 3.2, w: 0.9, d: 0.5, speed: 3, maxLen: 14, minLen: 3, gap: 0.002, thr: [0.25, 0.85] });
  // the giant: a big circle, shaded on the side away from the dwarf
  const G = [C[0] - 0.15, C[1] + 0.005], GR = 0.058;
  circleStroke(D, G[0], G[1], GR, { w: 1.9, d: 0.8, speed: 0.5, wob: 0.5 * PX });
  hatch(D, (x, y) => {
    const dx = (x - G[0]) / GR, dy = (y - G[1]) / GR;
    if (dx * dx + dy * dy > 0.88) return 0;
    return Math.max(0, -dx * 0.85 + dy * 0.35 + 0.45);
  }, [G[0] - GR, G[1] - GR, G[0] + GR, G[1] + GR], { angle: 0.95, sp: 3.6, w: 1.1, d: 0.55, speed: 3, thr: [0.15, 0.95] });
  // the dwarf: the tiny centre point (it survives)
  dot(D, C[0], C[1], 2.6);
  D.text('a', G[0] - 0.01, G[1] - GR - 0.016, { size: 20, d: 0.62 });
  D.fitTo(0, -40, -1.0);
  // during the shot: the pen finishes the last circle (outermost, slow and calm), then the motto
  D.text('il sole nõ si move', 0.66, -0.38, { size: 30, d: 0.62, t0: -0.55, dur: 1.5 });
  const last = arcPts(C[0], C[1], R * 1.07, -1.9, -1.9 + TAU * 1.01, { step: 1.6 * PX, wob: 0.3 * PX, seed: 77 });
  // already under way through the dissolve, the pen closes the outer circle as the title settles
  D.stroke(last, { w: 1.7, d: 0.75, t0: -1.2, dur: 4.0, taper: [10, 14], press: 0.2 });
  return D;
}
