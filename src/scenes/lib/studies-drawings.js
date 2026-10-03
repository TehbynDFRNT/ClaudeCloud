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

// --- S10: Prometheus lives in studies-prometheus.js -------------------------------------------------
export { prometheus } from './studies-prometheus.js';

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
  // registration with S29a's last frame: the shell is centred on the centre of mass (r = 0.321H), the
  // giant sits 0.0204H left of it (a red dot of radius ~0.011H), the dwarf 0.0112H right
  const kS = R / 0.321;
  const G = [C[0] - 0.0204 * kS, C[1]], WDp = [C[0] + 0.0112 * kS, C[1]], GR = 0.0118;
  D.at(-40);
  // compass construction: centre hole and a stylus circle
  D.stroke(arcPts(C[0], C[1], 0.9 * PX, 0, TAU, { step: 0.5 * PX }), { kind: 'relief', w: 2.2, d: 0.9, speed: 0.1, wet: false });
  D.stroke(arcPts(C[0], C[1], R * 1.12, 0, TAU, { step: 3 * PX }), { kind: 'relief', w: 1.3, d: 0.5, speed: 3, wet: false });
  // the line of centres, ruled blind and then lightly inked (it runs through giant, centre and dwarf)
  D.stroke(linePts(-R * 1.16, C[1], R * 1.16, C[1], { step: 3 * PX }), { kind: 'relief', w: 1.2, d: 0.45, speed: 3, wet: false, taper: [2, 2] });
  D.stroke(linePts(-0.11, C[1] + 0.3 * PX, 0.1, C[1] - 0.2 * PX, { step: 2 * PX, wob: 0.2 * PX, seed: 31 }), { w: 0.75, d: 0.26, speed: 1.2, taper: [40, 40], press: 0.3, wet: false });
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
  // the giant where S29a leaves it: the big circle beside the tiny point, shaded away from the dwarf
  circleStroke(D, G[0], G[1], GR, { w: 1.7, d: 0.85, speed: 0.3, wob: 0.25 * PX });
  hatch(D, (x, y) => {
    const dx = (x - G[0]) / GR, dy = (y - G[1]) / GR;
    if (dx * dx + dy * dy > 0.8) return 0;
    return Math.max(0, -dx * 0.85 + dy * 0.4 + 0.35);
  }, [G[0] - GR, G[1] - GR, G[0] + GR, G[1] + GR], { angle: 0.95, sp: 2.4, w: 0.9, d: 0.6, speed: 3, minLen: 2, thr: [0.15, 0.9] });
  // the dwarf: the tiny point (it survives)
  dot(D, WDp[0], WDp[1], 2.6);
  D.text('a', G[0] + 0.004, G[1] - GR - 0.012, { size: 17, d: 0.6 });
  D.text('b', WDp[0] + 0.013, WDp[1] - 0.012, { size: 17, d: 0.6 });
  // an older note at the left, faint: the great feeds the small
  scriptBlock(D, ['il grande nutre', 'il picholo'], -0.43, 0.13, { size: 19, lh: 26, d: 0.4 });
  D.fitTo(0, -40, -1.0);
  // during the shot: the motto (above right of the rings), and the pen finishes the last circle
  D.text('il sole nõ si move', 0.63, -0.265, { size: 28, d: 0.62, t0: -0.55, dur: 1.5 });
  const last = arcPts(C[0], C[1], R * 1.07, -1.9, -1.9 + TAU * 1.01, { step: 1.6 * PX, wob: 0.3 * PX, seed: 77 });
  // already under way through the dissolve, the pen closes the outer circle as the title settles
  D.stroke(last, { w: 1.7, d: 0.75, t0: -1.2, dur: 4.0, taper: [10, 14], press: 0.2 });
  return D;
}
