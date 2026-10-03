// The frenzy studies that differ between the two 9:16 cuts (scene 'studies'), composed for a vertical page:
//   sling  (David cut, F29.1):      iron-gall engineering study of a sling: whirl, tangent of release, parabola
//   eagle  (Prometheus cut, F29.1): red-chalk study of the eagle: the fierce head and an outstretched wing
//   chains (Prometheus cut, F30.3): iron-gall study of a shackle and chain, a wrist bound to the rock
// Page units: frame height at zoom 1, origin at the page centre, y down. Times are shot-local seconds; each
// shot runs ~0.79 s, so the first frame must already read and the bold strokes draw themselves inside it.
import { Drawing, PX, TAU, arcPts, linePts, hatch, resample, spline } from './studies-ink.js';
import { circleStroke, dot, scriptBlock } from './studies-drawings.js';
import { inkFist } from './studies-hand.js';

// ---- shared geometry ------------------------------------------------------------------------------
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
const nrm = (v) => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
const lerp2 = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function inPoly(poly, x, y) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
// bounding-box accelerated polygon
function poly(pts) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const P = pts.slice();
  P.bb = [x0, y0, x1, y1];
  return P;
}
const inP = (P, x, y) => x >= P.bb[0] && x <= P.bb[2] && y >= P.bb[1] && y <= P.bb[3] && inPoly(P, x, y);
// the runs of a polyline not hidden by any occluder (polygons or predicates)
function clipOut(pts, occ) {
  const hid = (p) => occ.some((o) => (typeof o === 'function' ? o(p[0], p[1]) : inP(o, p[0], p[1])));
  const runs = [];
  let cur = [];
  for (const p of pts) {
    if (hid(p)) { if (cur.length > 1) runs.push(cur); cur = []; } else cur.push(p);
  }
  if (cur.length > 1) runs.push(cur);
  return runs.filter((r) => r.length > 2);
}
// a raster of stacking order over bb: each cell holds the index of the topmost polygon covering it (polygons
// listed top first; 65535 = bare paper). Occlusion and shading tests become one lookup.
function stackGrid(polys, bb, res) {
  const W = Math.ceil((bb[2] - bb[0]) / res), H = Math.ceil((bb[3] - bb[1]) / res);
  const g = new Uint16Array(W * H).fill(65535);
  polys.forEach((P, k) => {
    const j0 = Math.max(0, Math.floor((P.bb[1] - bb[1]) / res)), j1 = Math.min(H - 1, Math.ceil((P.bb[3] - bb[1]) / res));
    for (let j = j0; j <= j1; j++) {
      const y = bb[1] + (j + 0.5) * res, xs = [];
      for (let i = 0, m = P.length - 1; i < P.length; m = i++) {
        const yi = P[i][1], ym = P[m][1];
        if ((yi > y) !== (ym > y)) xs.push(P[i][0] + ((y - yi) * (P[m][0] - P[i][0])) / (ym - yi));
      }
      xs.sort((a, b) => a - b);
      for (let q = 0; q + 1 < xs.length; q += 2) {
        const i0 = Math.max(0, Math.ceil((xs[q] - bb[0]) / res - 0.5)), i1 = Math.min(W - 1, Math.floor((xs[q + 1] - bb[0]) / res - 0.5));
        for (let i = i0; i <= i1; i++) { const c = j * W + i; if (g[c] > k) g[c] = k; }
      }
    }
  });
  return (x, y) => {
    const i = Math.floor((x - bb[0]) / res), j = Math.floor((y - bb[1]) / res);
    return i < 0 || j < 0 || i >= W || j >= H ? 65535 : g[j * W + i];
  };
}
// time at which the pen of stroke `it` reaches the fraction `q` of its length (inverts the pen easing)
function penTime(it, q) {
  const ease = (f) => { const s = f * f * (3 - 2 * f); return 0.2 * f + 0.8 * s; };
  let a = 0, b = 1;
  for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (ease(m) < q) a = m; else b = m; }
  return it.t0 + (it.t1 - it.t0) * (a + b) / 2;
}
function arrowHead(D, tip, dir, len, o = {}) {
  const d = nrm(dir), n = [-d[1], d[0]];
  const sp = o.spread ?? 0.55;
  const a = add(add(tip, d, -len), n, len * sp), b = add(add(tip, d, -len), n, -len * sp);
  const so = { w: o.w ?? 1.8, d: o.d ?? 0.85, dur: o.dur ?? 0.03, taper: [3, 2], gap: 0, kind: o.kind, nib: o.nib, wet: o.wet, t0: o.t0 };
  D.stroke(linePts(a[0], a[1], tip[0], tip[1]), so);
  D.stroke(linePts(b[0], b[1], tip[0], tip[1]), { ...so, t0: o.t0 != null ? o.t0 + (o.dur ?? 0.03) * 0.6 : undefined });
}

// one pen stroke that lifts where `occ` hides it: the visible runs keep the timing of the whole stroke.
// Returns a stand-in item (t0, t1, pts, s, L) for penTime.
function timedStroke(D, pts, occ, o) {
  const r = resample(pts, 1.6 * PX), s = [0];
  for (let i = 1; i < r.length; i++) s.push(s[i - 1] + Math.hypot(r[i][0] - r[i - 1][0], r[i][1] - r[i - 1][1]));
  const L = s[s.length - 1], it = { t0: o.t0, t1: o.t0 + o.dur, pts: r, s, L };
  const hid = r.map(([x, y]) => occ.some((q) => (typeof q === 'function' ? q(x, y) : inP(q, x, y))));
  let a = -1;
  for (let i = 0; i <= r.length; i++) {
    if (i < r.length && !hid[i]) { if (a < 0) a = i; continue; }
    if (a >= 0 && i - a > 2) {
      const ta = penTime(it, s[a] / L), tb = penTime(it, s[i - 1] / L);
      D.stroke(r.slice(a, i), { ...o, t0: ta, dur: Math.max(0.005, tb - ta) });
    }
    a = -1;
  }
  return it;
}

// ==== F29.1 (David cut): the sling ===================================================================
// The slinger's fist at the centre of a compass circle, the forearm leaving down to the right; the two cords
// run side by side from the fist and fork to the leather pouch cradling the stone. Faint ghosts of the sling earlier in its turn
// fade back round the circle; during the cut the whirl is swept clockwise (arrows), and at the release point
// the stone leaves along the tangent (ruled) while its real path bends into a parabola.
export function sling() {
  const D = new Drawing(2911);
  const C = [0.02, 0.105], R = 0.272;
  const thR = -2.72;                                                 // release: left of the hand, a little above
  const at = (th, r = R) => [C[0] + Math.cos(th) * r, C[1] + Math.sin(th) * r];
  const tan = (th) => [-Math.sin(th), Math.cos(th)];                 // clockwise on screen = page angle increasing
  const Pr = at(thR), vel = tan(thR), rad = [Math.cos(thR), Math.sin(thR)];
  const s = vel[1] / vel[0], k = 3.3;
  const parY = (x) => Pr[1] + s * (x - Pr[0]) + k * (x - Pr[0]) ** 2;
  const apex = [Pr[0] - s / (2 * k), parY(Pr[0] - s / (2 * k))];
  const pw = 0.052, stR = 0.025, forkL = 0.048, bow = 0.008;          // pouch half-length, the stone, fork, cord bow

  // ---- the fist (as S10's, in ink), the cords leaving its top toward the pouch; the forearm runs down-right
  D.at(-14);
  const CMf = 0.0225, THf = Math.atan2(rad[1], rad[0]) + Math.PI / 2;  // canonical 'up' points along the cords
  const cf = Math.cos(THf), sf = Math.sin(THf);
  const Of = [C[0] - 2.5 * sf * CMf, C[1] + 2.5 * cf * CMf];        // so canonical (0, -2.5) lands on C
  const F = inkFist(D, { O: Of, CM: CMf, TH: THf, armTo: 17, wk: 1.15 });
  D.fitTo(0, -14, -0.6);

  // ---- written and constructed before the cut: stylus circle, ghosts of the sling, notes
  D.at(-13);
  const g0 = D.mark();
  D.stroke(arcPts(C[0], C[1], R, 0, TAU, { step: 3 * PX }), { kind: 'relief', w: 1.4, d: 0.5, speed: 3, wet: false, taper: [2, 2] });
  circleStroke(D, C[0], C[1], R * 1.06, { w: 0.8, d: 0.26, speed: 1.2, wet: false, sweep: TAU * 0.45, a0: 3.4 });
  // a sling at angle th: ONE cord from the fist, bowed a little back against the turn, forking only at the
  // end into two thin strings to the tips of a leaf-shaped leather pouch; the pouch wraps the stone (its far
  // flap round the outside, its near flap folded over the stone's inner edge), so the stone sits IN it
  const slingAt = (th, o) => {
    const P0 = at(th), v = tan(th), r = [Math.cos(th), Math.sin(th)];
    const St = add(P0, r, 0.012);                                    // the stone's centre
    const Pc = add(St, r, -0.009);                                   // the pouch's centre line: the stone rides outward in it
    const E1 = add(Pc, v, pw), E2 = add(Pc, v, -pw);                 // the pouch tips, beside the stone
    const fk = R + 0.012 - forkL, Fk = add(add(C, r, fk), v, -0.002); // the fork, a short way short of the pouch
    const cord = [];
    for (let i = 0; i <= 80; i++) { const f = i / 80; cord.push(add(add(C, r, f * fk), v, -bow * Math.sin(Math.PI * f) - 0.002 * f)); }
    for (const run of clipOut(resample(cord, 1.5 * PX), [F.sil])) D.stroke(run, { w: o.cw, d: o.d, speed: o.speed, taper: [6, 2], wet: o.wet });
    // the two strings leave the fork together and splay out to the tips (concave, as taut strings round a load)
    for (const E of [E1, E2]) {
      const pts = [];
      for (let i = 0; i <= 24; i++) {
        const u = i / 24, a = add(lerp2(Fk, E, u), r, 0), d = [E[0] - Fk[0], E[1] - Fk[1]];
        const n = nrm([-d[1], d[0]]), sgn = Math.sign(n[0] * r[0] + n[1] * r[1]);   // bend toward the pouch
        pts.push(add(a, n, sgn * 0.007 * Math.sin(Math.PI * u)));
      }
      D.stroke(pts, { w: o.sw, d: o.d * 0.95, speed: o.speed * 0.6, taper: [2, 3], gap: 0, wet: o.wet });
    }
    // the leaf: tip to tip, the far flap round the outside of the stone, the near flap across its inner side
    const flap = (b, e, n = 56) => { const pts = []; for (let i = 0; i <= n; i++) { const u = i / n; pts.push(add(lerp2(E1, E2, u), r, b * Math.sin(Math.PI * u) ** e)); } return pts; };
    const outer = flap(stR + 0.017, 0.7), inner = flap(-(stR - 0.007), 0.9);
    D.stroke(outer, { w: o.pw, d: o.d * 1.02, speed: o.speed * 0.5, taper: [3, 3], gap: 0, wet: o.wet });
    D.stroke(inner, { w: o.pw * 0.9, d: o.d, speed: o.speed * 0.5, taper: [3, 3], gap: 0, wet: o.wet });
    const front = poly([...inner, ...flap(-(stR + 0.03), 1).reverse()]);   // the near side of that flap
    const ring = arcPts(St[0], St[1], stR, th - Math.PI * 0.4, th - Math.PI * 0.4 + TAU * 1.02, { step: 1.5 * PX, wob: 0.4 * PX, seed: 5 + o.seed });
    for (const run of clipOut(ring, [front])) D.stroke(run, { w: o.pw * 0.85, d: o.d, speed: o.speed * 0.4, taper: [3, 3], gap: 0, wet: o.wet });
    if (o.fill) {   // a faded sling: the stone shaded in a few strokes, so it reads as the same object
      hatch(D, (x, y) => { const dx = (x - St[0]) / stR, dy = (y - St[1]) / stR; return dx * dx + dy * dy <= 0.8 ? 0.55 + 0.4 * (dx * 0.6 + dy * 0.8) : 0; },
        [St[0] - stR, St[1] - stR, St[0] + stR, St[1] + stR], { angle: 0.95, sp: 3.2, w: 1.0, d: o.d * 0.9, speed: 3, minLen: 2, thr: [0.2, 0.9], wet: false });
    }
    return { P0, v, r, E1, E2, St, Pc, outer, inner, front, Fk };
  };
  // ghosts: the sling a tenth and a fifth of a turn earlier, fading back
  for (let g = 1; g <= 2; g++) slingAt(thR - g * 0.63, { cw: 1.5, sw: 1.0, pw: 1.4, d: 0.42 - g * 0.07, speed: 1.4, wet: false, fill: true, seed: 40 + 3 * g });
  // the construction under the cut's pen: the tangent ruled blind with the stylus, the stone's curve sketched faint
  const tEnd0 = add(Pr, vel, 0.5);
  D.stroke(linePts(Pr[0], Pr[1], tEnd0[0], tEnd0[1], { step: 3 * PX }), { kind: 'relief', w: 1.4, d: 0.5, speed: 3, wet: false, taper: [2, 2] });
  const guide = [];
  for (let x = Pr[0] + 0.01; x <= 0.47; x += 0.003) guide.push([x, parY(x) + 0.004 * Math.sin(x * 40)]);
  D.stroke(resample(guide, 1.6 * PX), { w: 1.0, d: 0.3, speed: 1.0, taper: [30, 30], press: 0.4, wet: false });
  scriptBlock(D, ['la fromba gira', 'e lascia il sasso', 'per la linia', 'contingente'], -0.12, -0.405, { size: 19, lh: 26, d: 0.55 });
  scriptBlock(D, ['il moto circulare', 'si fa retto'], 0.3, -0.215, { size: 18, lh: 25, d: 0.5 });
  D.text('a', C[0] - 0.03, C[1] - 0.016, { size: 22, d: 0.7 });
  D.text('b', Pr[0] - 0.062, Pr[1] - 0.042, { size: 22, d: 0.7 });
  D.fitTo(g0, -13, -0.45);

  // ---- the sling itself, laid in just before the cut: the cord, the strings, the pouch, the stone hatched dark
  D.at(-0.42);
  const s0 = D.mark();
  const L = slingAt(thR, { cw: 2.8, sw: 1.7, pw: 2.8, d: 0.93, speed: 1.3, wet: true, seed: 60 });
  const inStone = (x, y) => { const dx = (x - L.St[0]) / stR, dy = (y - L.St[1]) / stR; return dx * dx + dy * dy; };
  const sbb = [L.St[0] - stR, L.St[1] - stR, L.St[0] + stR, L.St[1] + stR];
  const pouchPoly = poly([...L.outer, ...L.inner.slice().reverse()]);
  const rr = (x, y) => (x - L.Pc[0]) * L.r[0] + (y - L.Pc[1]) * L.r[1];   // across the pouch (outward +)
  const vv = (x, y) => (x - L.Pc[0]) * L.v[0] + (y - L.Pc[1]) * L.v[1];   // along the pouch
  // the stone: dark, a small light on its upper left
  const lit = (x, y) => ((x - L.St[0]) * 0.6 + (y - L.St[1]) * 0.8) / stR;
  hatch(D, (x, y) => (inStone(x, y) <= 0.84 ? 0.85 + 0.45 * lit(x, y) : 0), sbb, { angle: 0.95, sp: 2.2, w: 1.25, d: 0.88, speed: 3, minLen: 2, thr: [0.2, 0.9], wet: true });
  hatch(D, (x, y) => (inStone(x, y) <= 0.84 ? 0.62 + 0.55 * lit(x, y) : 0), sbb, { angle: -0.6, sp: 2.5, w: 1.15, d: 0.82, speed: 3, minLen: 2, thr: [0.2, 0.9], wet: true });
  // the leather, lighter than the stone: the far flap's inside shadowed round the stone, the near flap pale
  hatch(D, (x, y) => {
    if (!inP(pouchPoly, x, y) || inStone(x, y) < 1.15) return 0;
    const q = rr(x, y);
    return q > 0 ? 0.42 + 0.3 * sm(0.004, stR + 0.01, q) : 0.3 + 0.25 * sm(0, pw, Math.abs(vv(x, y)));
  }, pouchPoly.bb, { angle: -0.35, sp: 3.0, w: 1.0, d: 0.68, speed: 3, minLen: 2, thr: [0.22, 0.9], wet: true });
  // the leather gathered toward the tips: creases from each tip curving round the stone
  for (const sg of [1, -1]) for (const b of [0.6, -0.55]) {
    const pts = [];
    for (let i = 0; i <= 16; i++) { const u = i / 16; pts.push(add(add(L.Pc, L.v, sg * pw * (0.92 - 0.5 * u)), L.r, b * (stR + 0.006) * Math.sin(Math.PI * (0.04 + 0.25 * u)) ** 0.7 * 1.1)); }
    D.stroke(pts, { w: 1.05, d: 0.7, speed: 0.6, taper: [2, 5] });
  }
  D.fitTo(s0, -0.42, -0.04);

  // ---- during the cut: the whirl swept by the pen (clockwise) from the pouch's leading edge round to its
  // trailing edge, lifting over the forearm; arrowheads as it passes
  const dA = (pw + 0.012) / R;
  const a0 = thR + dA - TAU, a1 = thR - dA;
  const ring = timedStroke(D, arcPts(C[0], C[1], R, a0, a1, { step: 1.6 * PX, wob: 0.35 * PX, seed: 71 }), [F.sil], { w: 4.4, d: 0.95, t0: -0.3, dur: 0.52, taper: [6, 12], press: 0.2, nib: 0.45, load: 0.2 });
  for (const off of [1.99, 3.56, 5.13]) {
    const aa = a0 + (((thR - off - a0) % TAU) + TAU) % TAU;          // the arc parameter of that angle
    const q = (aa - a0) / (a1 - a0);
    arrowHead(D, at(aa, R), tan(aa), 0.032, { w: 3.0, d: 0.92, t0: Math.max(-0.3, penTime(ring, Math.min(1, q + 0.02))), dur: 0.03 });
  }
  // the release: the tangent ruled fast from the pouch
  const T0 = add(L.St, vel, pw + 0.006), tEnd = add(L.St, vel, 0.5);
  D.stroke(linePts(T0[0], T0[1], tEnd[0], tEnd[1], { wob: 0.15 * PX, seed: 83 }), { w: 2.0, d: 0.78, t0: 0.18, dur: 0.12, taper: [3, 30], gap: 0 });
  D.text('d', tEnd[0] + 0.04, tEnd[1] + 0.05, { size: 22, d: 0.7, t0: 0.31, dur: 0.05 });
  // the stone's path: one bold sweep from b over the apex c, the stone drawn at equal times along it
  const par = [];
  let xs = Pr[0];
  while (inStone(xs, parY(xs)) < 1.25 || inP(pouchPoly, xs, parY(xs))) xs += 0.001;   // from where it leaves the pouch
  for (let x = xs; x <= 0.47; x += 0.003) par.push([x, parY(x)]);
  const pz = D.stroke(resample(par, 1.6 * PX), { w: 4.4, d: 0.94, t0: 0.24, dur: 0.46, taper: [4, 16], press: 0.2, nib: 0.45, load: 0.15 });
  for (let i = 1; i <= 6; i++) {
    const x = Pr[0] + i * 0.09, p = [x, parY(x)];
    let si = 0; for (let j = 1; j < pz.pts.length; j++) { if (pz.pts[j][0] >= x) { si = pz.s[j]; break; } }
    const tq = penTime(pz, si / pz.L), r = 0.016;
    const m = D.mark();
    D.at(tq);
    circleStroke(D, p[0], p[1], r, { w: 2.4, d: 0.9, sweep: TAU * 1.05, wob: 0.3 * PX });
    hatch(D, (x2, y2) => { const dx = (x2 - p[0]) / r, dy = (y2 - p[1]) / r; return dx * dx + dy * dy > 0.8 ? 0 : 0.45 + 0.6 * (dx * 0.6 + dy * 0.8); }, [p[0] - r, p[1] - r, p[0] + r, p[1] + r], { angle: 0.95, sp: 2.6, w: 1.1, d: 0.8, minLen: 2, thr: [0.2, 0.9], wet: true });
    D.fitTo(m, tq, tq + 0.04);
  }
  const pa = [apex[0] + 0.07, parY(apex[0] + 0.07)];
  arrowHead(D, pa, [1, 2 * k * (pa[0] - apex[0])], 0.036, { w: 3.0, d: 0.92, t0: penTime(pz, 0.7), dur: 0.03 });
  D.text('c', apex[0] + 0.012, apex[1] - 0.03, { size: 22, d: 0.7, t0: penTime(pz, 0.62), dur: 0.05 });
  return D;
}

// ==== F30.3 (Prometheus cut): the shackle and the chain ==============================================
// An eye-bolt driven into an overhang of rock; the chain hangs from it in alternating links (face-on,
// edge-on), taut to the lug of an iron cuff round a raised wrist; the hand strains open above it.
// Links interlock by occlusion: an edge-on link passes in front of the bar above it and behind the bar below.
function stadium(c, ax, hl, r, n = 18) {
  // closed outline of a rounded bar centred on c along unit axis ax: half-length hl (to the tip), radius r
  const nx = [-ax[1], ax[0]], sL = Math.max(0, hl - r), pts = [];
  for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + (i / n) * Math.PI; pts.push(add(add(c, ax, sL + Math.cos(a) * r), nx, Math.sin(a) * r)); }
  for (let i = 0; i <= n; i++) { const a = Math.PI / 2 + (i / n) * Math.PI; pts.push(add(add(c, ax, -sL + Math.cos(a) * r), nx, Math.sin(a) * r)); }
  pts.push(pts[0].slice());
  return pts;
}
export function chains() {
  const D = new Drawing(3031);
  const ink = (pts, o = {}) => D.stroke(pts, { w: 1.8, d: 0.85, speed: 0.9, taper: [5, 8], press: 0.2, ...o });
  // a sketched contour: the pen lifts here and there and a lighter searching line runs beside it
  const sketch = (pts, o = {}) => {
    const r = resample(pts, 1.5 * PX);
    let a = 0;
    while (a < r.length - 4) {
      const b = Math.min(r.length, a + Math.max(8, Math.floor(r.length * D.r(0.3, 0.6))));
      ink(r.slice(a, b), { w: o.w ?? 1.7, d: o.d ?? 0.62, speed: o.speed ?? 1.0, taper: [8, 14], press: 0.4 });
      a = b + Math.floor(D.r(1, 5));
    }
    const off = (D.rnd() - 0.5) * 3.2 * PX, a0 = Math.floor(r.length * D.r(0.05, 0.3)), b0 = Math.floor(r.length * D.r(0.6, 0.95));
    const sub = r.slice(a0, b0).map(([x, y]) => [x + off, y - off]);
    if (sub.length > 4) ink(sub, { w: (o.w ?? 1.7) * 0.7, d: (o.d ?? 0.62) * 0.45, speed: 1.4, taper: [16, 16], press: 0.4 });
  };
  // ---- the rock: an overhang across the top, its underside in shadow; a cliff face down the left
  const rockC = [[-0.47, -0.16], [-0.38, -0.215], [-0.31, -0.195], [-0.25, -0.25], [-0.19, -0.268], [-0.12, -0.255], [-0.05, -0.31],
    [0.05, -0.33], [0.12, -0.372], [0.2, -0.36], [0.27, -0.41], [0.35, -0.428], [0.47, -0.465]];
  const rockY = (x) => { for (let i = 0; i < rockC.length - 1; i++) if (x <= rockC[i + 1][0]) { const u = (x - rockC[i][0]) / (rockC[i + 1][0] - rockC[i][0]); return rockC[i][1] + (rockC[i + 1][1] - rockC[i][1]) * u; } return rockC[rockC.length - 1][1]; };
  // ---- the arm frame: the wrist cuff at Cf, the forearm rising from the bottom of the page
  const Cf = [0.11, 0.215], ar = nrm([-0.1, -0.36]), pr = [-ar[1], ar[0]];   // pr: across the arm, to the right
  const AP = (a, b) => add(add(Cf, ar, a), pr, b);
  const CW = 0.1, CH = 0.05;                                         // cuff half-width, half-height
  // ---- the chain: from the eye of the bolt to the lug on the cuff's left side
  const eye = [-0.19, -0.262], A = [-0.19, -0.252];
  const lugC = AP(0.055, -CW - 0.03), B = add(lugC, ar, 0.0);
  const Lo = 0.13, Wo = 0.08, dW = 0.021, Li = Lo - 2 * dW;
  const ctrl = add(lerp2(A, B, 0.5), [-1, 0.2], 0.02);
  const bez = (u) => [(1 - u) * (1 - u) * A[0] + 2 * u * (1 - u) * ctrl[0] + u * u * B[0], (1 - u) * (1 - u) * A[1] + 2 * u * (1 - u) * ctrl[1] + u * u * B[1]];
  const path = []; for (let i = 0; i <= 200; i++) path.push(bez(i / 200));
  const sArr = [0]; for (let i = 1; i < path.length; i++) sArr.push(sArr[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  const PL = sArr[sArr.length - 1];
  const atS = (s) => { let j = 1; while (j < path.length - 1 && sArr[j] < s) j++; const u = (s - sArr[j - 1]) / (sArr[j] - sArr[j - 1]); return { p: lerp2(path[j - 1], path[j], u), t: nrm([path[j][0] - path[j - 1][0], path[j][1] - path[j - 1][1]]) }; };
  const NL = 5, pitch = (PL - Li) / (NL - 1);
  const EW = 0.016;                                                  // an edge-on link's half-thickness
  const links = [];
  for (let i = 0; i < NL; i++) {
    const { p, t } = atS(Li / 2 + i * pitch);
    const face = i % 2 === 0;
    const outer = poly(stadium(p, t, Lo / 2, face ? Wo / 2 : EW));
    const inner = poly(stadium(p, t, face ? Li / 2 : Lo / 2 - 0.024, face ? Wo / 2 - dW : 0.0035));
    links.push({ c: p, ax: t, face, outer, inner });
  }
  const ringOf = (L) => (x, y) => inP(L.outer, x, y) && !inP(L.inner, x, y);
  const lugO = poly(arcPts(lugC[0], lugC[1], 0.026, 0, TAU, { step: 1 * PX })), lugI = poly(arcPts(lugC[0], lugC[1], 0.012, 0, TAU, { step: 1 * PX }));
  const lugRing = (x, y) => inP(lugO, x, y) && !inP(lugI, x, y);
  const occOf = (i) => {
    const L = links[i], occ = [];
    if (links[i + 1]) occ.push(L.face ? links[i + 1].outer : ringOf(links[i + 1]));  // the next link passes in front
    if (i === NL - 1) occ.push(L.face ? lugO : lugRing);
    return occ;
  };
  const drawLink = (i, o = {}) => {
    const L = links[i], occ = occOf(i), w = o.w ?? 3.0;
    for (const r of clipOut(resample(L.outer, 1.2 * PX), occ)) ink(r, { w, d: 0.94, speed: o.speed ?? 2.2, taper: [4, 4], wet: o.wet });
    for (const r of clipOut(resample(L.inner, 1.2 * PX), occ)) ink(r, { w: w * 0.72, d: 0.88, speed: o.speed ?? 2.2, taper: [3, 3], wet: o.wet });
  };
  const shadeLink = (i, o = {}) => {
    const L = links[i], nx = [-L.ax[1], L.ax[0]], occ = occOf(i);
    const fn = (x, y) => {
      if (!inP(L.outer, x, y) || inP(L.inner, x, y)) return 0;
      for (const q of occ) if (typeof q === 'function' ? q(x, y) : inP(q, x, y)) return 0;
      const dx = x - L.c[0], dy = y - L.c[1];
      const across = (dx * nx[0] + dy * nx[1]) / (L.face ? Wo / 2 : EW);
      const along = (dx * L.ax[0] + dy * L.ax[1]) / (Lo / 2);
      // light from the upper left: the right flank and the lower end dark, a bright edge on the left
      return Math.min(1, 0.3 + 0.6 * sm(-0.35, 0.9, across) + 0.25 * sm(0.2, 0.9, along) - 0.4 * sm(-0.5, -0.95, across));
    };
    hatch(D, fn, L.outer.bb, { angle: 0.95, sp: 2.9, w: 1.25, d: 0.78, speed: o.speed ?? 3, minLen: 2, thr: [0.25, 0.9], gap: 0.003, wet: o.wet });
    if (o.cross) hatch(D, (x, y) => fn(x, y) - 0.3, L.outer.bb, { angle: -0.55, sp: 3.2, w: 1.05, d: 0.68, speed: o.speed ?? 3, minLen: 2, thr: [0.25, 0.9], gap: 0.003 });
  };

  D.at(-14);
  // rock: the overhang's edge, cracks and facets; the shadowed underside hatched
  ink(spline(rockC, 1.6 * PX), { w: 2.5, d: 0.9, speed: 1.4, taper: [10, 20], press: 0.4 });
  for (const cr of [[[-0.31, -0.196], [-0.29, -0.3], [-0.32, -0.42], [-0.28, -0.52]], [[0.05, -0.33], [0.08, -0.43], [0.05, -0.53]],
    [[-0.12, -0.256], [-0.095, -0.34], [-0.14, -0.41], [-0.11, -0.5]], [[0.27, -0.41], [0.24, -0.48], [0.29, -0.55]]]) ink(spline(cr, 1.6 * PX), { w: 1.4, d: 0.6, speed: 1.4, taper: [10, 26], press: 0.45 });
  for (const f of [[[-0.47, -0.3], [-0.37, -0.33], [-0.32, -0.3]], [[-0.24, -0.38], [-0.16, -0.37], [-0.14, -0.345]], [[0.12, -0.45], [0.2, -0.47], [0.28, -0.46]]]) ink(spline(f, 1.6 * PX), { w: 1.2, d: 0.5, speed: 1.4, taper: [12, 12], press: 0.45 });
  hatch(D, (x, y) => {
    const ry = rockY(x);
    if (y > ry - 0.003) return 0;
    const dd = ry - y;
    return Math.min(1, Math.exp(-dd / 0.05) * 1.05 + 0.25 * sm(0.0, 0.4, x) * Math.exp(-dd / 0.12));
  }, [-0.47, -0.56, 0.47, -0.15], { angle: 0.95, sp: 4.2, w: 1.2, d: 0.62, maxLen: 40, speed: 2.5, thr: [0.2, 0.9], gap: 0.004 });
  // the cliff face falling away down the left side: a hatched wall standing a little in from the page edge,
  // fading out downward
  const cliffX = (y) => -0.315 + 0.012 * Math.sin(y * 11 + 0.6) + 0.006 * Math.sin(y * 27);
  const cliff = []; for (let y = -0.2; y <= 0.42; y += 0.01) cliff.push([cliffX(y), y]);
  ink(spline(cliff, 1.6 * PX), { w: 2.0, d: 0.78, speed: 1.4, taper: [8, 90], press: 0.45 });
  ink(spline([[-0.35, -0.175], [-0.343, -0.09], [-0.36, 0.0]], 1.6 * PX), { w: 1.2, d: 0.48, speed: 1.4, taper: [8, 30], press: 0.45 });
  ink(spline([[-0.335, 0.08], [-0.352, 0.15], [-0.344, 0.22]], 1.6 * PX), { w: 1.1, d: 0.4, speed: 1.4, taper: [8, 30], press: 0.45 });
  hatch(D, (x, y) => {
    if (y < -0.2 || y > 0.45) return 0;
    const xe = cliffX(y);
    if (x > xe - 0.002) return 0;
    return (0.4 + 0.45 * sm(-0.01, -0.06, x - xe)) * sm(0.45, 0.15, y);
  }, [-0.5, -0.2, -0.29, 0.45], { angle: 1.25, sp: 4.4, w: 1.15, d: 0.55, maxLen: 50, speed: 2.5, thr: [0.25, 0.85], gap: 0.004 });
  scriptBlock(D, ['le catene di Vulcano', 'al sasso di Caucaso'], -0.1, 0.33, { size: 19, lh: 26, d: 0.55 });
  // ---- the forearm rising from below and a clenched fist above the cuff, sketched in a few loose lines
  const armSide = (side) => {
    const pts = [];
    for (let a = -CH - 0.004; a >= -0.42; a -= 0.01) {
      const u = (-a - CH) / 0.37;
      const b = side * (CW - 0.016 + (side > 0 ? 0.05 : 0.03) * u + (side > 0 ? 0.012 * Math.sin(Math.PI * Math.min(1, u * 1.4)) : 0));
      pts.push(AP(a, b));
    }
    return pts;
  };
  sketch(armSide(-1), { w: 1.8, d: 0.6 });
  sketch(armSide(1), { w: 2.1, d: 0.68 });
  hatch(D, (x, y) => {
    const dx = x - Cf[0], dy = y - Cf[1];
    const a = dx * ar[0] + dy * ar[1], b = dx * pr[0] + dy * pr[1];
    if (a > -CH - 0.008 || a < -0.42) return 0;
    const u = (-a - CH) / 0.37, bw = CW - 0.016 + 0.05 * u;
    if (b > bw - 0.006 || b < 0.01) return 0;
    return (0.2 + 0.65 * sm(0.0, bw, b) + 0.6 * Math.exp((a + CH + 0.008) / 0.025)) * sm(-0.42, -0.22, a);
  }, [-0.08, 0.2, 0.4, 0.58], { angle: 0.95, sp: 4.8, w: 1.1, d: 0.48, maxLen: 34, speed: 2.5, thr: [0.25, 0.85], gap: 0.004 });
  // the fist (a left hand seen from the back): the back of the hand widening from the wrist, the tendons fanning
  // to the row of knuckle heads, the folded fingers' backs rising to the row of middle joints on top, the thumb's
  // side bulging on the right. Light from the upper left: the left contour broken and light, the thumb side heavy
  // and cross-hatched, the valleys between the knuckles and beside each tendon in shadow.
  const F = (a, b) => AP(a, b);
  sketch(spline([F(CH + 0.004, -0.083), F(0.12, -0.092), F(0.19, -0.098), F(0.235, -0.088), F(0.258, -0.068)], 1.5 * PX), { w: 1.8, d: 0.6 });
  const pip = [[-0.068, 0.262], [-0.03, 0.276], [0.01, 0.279], [0.05, 0.27]];      // [b, a] of the middle joints
  const top = [];
  for (let i = 0; i < pip.length; i++) {
    const b0 = pip[i][0] - 0.019, b1 = pip[i][0] + 0.019, a = pip[i][1];
    for (let k = 0; k <= 12; k++) { const u = k / 12; top.push(F(a - 0.014 + 0.014 * Math.sin(Math.PI * u), b0 + (b1 - b0) * u)); }
  }
  sketch(top, { w: 2.1, d: 0.78 });
  // skin folds over each middle joint; creases between the folded fingers
  for (const [b, a] of pip) ink(spline([F(a - 0.026, b - 0.009), F(a - 0.017, b + 0.001), F(a - 0.025, b + 0.01)], 1.5 * PX), { w: 1.0, d: 0.45, speed: 0.6, taper: [4, 4] });
  for (let i = 0; i < pip.length - 1; i++) { const b = (pip[i][0] + pip[i + 1][0]) / 2; ink(spline([F(0.198, b + 0.005), F(0.232, b), F(0.262, b - 0.002)], 1.5 * PX), { w: 1.6, d: 0.7, speed: 0.6, taper: [6, 4] }); }
  // the knuckle heads: a rounded row, the middle one standing highest
  const mcp = pip.map(([b], i) => [b * 0.96 + 0.002, 0.2 - 0.005 * Math.abs(i - 1.4)]);   // [b, a]
  for (const [b, a] of mcp) ink(spline([F(a - 0.014, b - 0.017), F(a - 0.002, b - 0.009), F(a + 0.002, b + 0.002), F(a - 0.009, b + 0.016)], 1.5 * PX), { w: 1.9, d: 0.8, speed: 0.6, taper: [4, 6] });
  // the extensor tendons, fanning from the wrist to each knuckle
  const tendB = (b, a) => b * (0.34 + 0.63 * sm(CH + 0.02, 0.185, a));
  for (const [b, a] of mcp) {
    const pts = []; for (let q = CH + 0.02; q <= a - 0.016; q += 0.006) pts.push(F(q, tendB(b, q)));
    ink(spline(pts, 1.5 * PX), { w: 1.3, d: 0.5, speed: 0.8, taper: [24, 8] });
  }
  sketch(spline([F(0.268, 0.068), F(0.25, 0.098), F(0.21, 0.118), F(0.15, 0.118), F(0.1, 0.104), F(CH + 0.006, 0.088)], 1.5 * PX), { w: 2.4, d: 0.84 });
  ink(spline([F(0.205, 0.116), F(0.214, 0.09), F(0.236, 0.074)], 1.5 * PX), { w: 1.3, d: 0.6, speed: 0.6, taper: [4, 8] });   // thumb tip turning in
  ink(spline([F(0.075, 0.07), F(0.13, 0.078), F(0.18, 0.074), F(0.215, 0.064)], 1.5 * PX), { w: 1.5, d: 0.62, speed: 0.6, taper: [10, 8] });  // the thumb's crease
  const fistTone = (x, y) => {
    const dx = x - Cf[0], dy = y - Cf[1];
    const a = dx * ar[0] + dy * ar[1], b = dx * pr[0] + dy * pr[1];
    if (a < CH + 0.006 || a > 0.268 || b < -0.092 || b > 0.114) return 0;
    let v = 0.9 * sm(0.02, 0.095, b) * (a < 0.21 ? 1 : 0.5) + 0.12;               // the thumb side turns from the light
    v += 0.75 * sm(0.228, 0.262, a) * sm(-0.11, 0.06, b);                         // the folded fingers' upper faces
    for (let i = 0; i < pip.length - 1; i++) { const bc = (pip[i][0] + pip[i + 1][0]) / 2; v += 0.75 * Math.exp(-(((b - bc) / 0.008) ** 2)) * sm(0.196, 0.226, a); }
    for (let i = 0; i < mcp.length - 1; i++) { const bc = (mcp[i][0] + mcp[i + 1][0]) / 2; v += 0.7 * Math.exp(-(((b - bc) / 0.009) ** 2) - (((a - 0.19) / 0.02) ** 2)); }
    for (const [bt] of mcp) v += 0.5 * Math.exp(-(((b - tendB(bt, a) - 0.008) / 0.005) ** 2)) * sm(0.07, 0.13, a) * sm(0.2, 0.17, a);  // beside each tendon
    v += 0.7 * Math.exp(-(a - CH) / 0.014);                                       // the cuff's shadow on the wrist
    return Math.min(1, v);
  };
  hatch(D, fistTone, [-0.08, -0.12, 0.3, 0.2], { angle: 0.95, sp: 3.2, w: 1.15, d: 0.64, maxLen: 26, speed: 2.5, thr: [0.22, 0.8], gap: 0.004 });
  hatch(D, (x, y) => fistTone(x, y) - 0.32, [-0.08, -0.12, 0.3, 0.2], { angle: -0.55, sp: 3.5, w: 1.05, d: 0.58, maxLen: 22, speed: 2.5, thr: [0.15, 0.7], gap: 0.004 });
  // ---- the eye-bolt: a wedge plate in the rock, its ring seen edge-on, the first link hung through it
  ink(resample([[-0.225, -0.305], [-0.155, -0.31], [-0.168, -0.284], [-0.212, -0.28], [-0.225, -0.305]], 1.2 * PX), { w: 2.4, d: 0.9, speed: 0.6, taper: [3, 3] });
  hatch(D, (x, y) => (inPoly([[-0.225, -0.305], [-0.155, -0.31], [-0.168, -0.284], [-0.212, -0.28]], x, y) ? 0.4 + 6 * (x + 0.2) : 0), [-0.23, -0.315, -0.15, -0.278], { angle: 0.95, sp: 2.6, w: 1.0, d: 0.8, speed: 3, minLen: 2, thr: [0.2, 0.9] });
  ink(linePts(-0.19, -0.282, -0.19, -0.272), { w: 3.2, d: 0.92, speed: 0.3 });
  const eyeO = poly(arcPts(eye[0], eye[1], 0.036, 0, TAU, { ry: 0.0145, step: 1 * PX })), eyeI = poly(arcPts(eye[0], eye[1], 0.022, 0, TAU, { ry: 0.005, step: 1 * PX }));
  for (const r of clipOut(eyeO, [ringOf(links[0])])) ink(r, { w: 2.8, d: 0.94, speed: 0.5, taper: [3, 3] });
  for (const r of clipOut(eyeI, [ringOf(links[0])])) ink(r, { w: 1.6, d: 0.85, speed: 0.5, taper: [3, 3] });
  hatch(D, (x, y) => (inP(eyeO, x, y) && !inP(eyeI, x, y) && !ringOf(links[0])(x, y) ? 0.4 + 0.6 * sm(-0.01, 0.025, x - eye[0]) : 0), eyeO.bb, { angle: 0.95, sp: 2.8, w: 1.0, d: 0.75, speed: 3, minLen: 2, thr: [0.25, 0.9] });
  D.fitTo(0, -14, -2.2);

  // ---- the cuff: a heavy iron band round the wrist, rims seen almost edge-on, hinge and lug on the left
  D.at(-2.1);
  const c0 = D.mark();
  const rim = (a, t0, t1, rx = CW, ry = 0.024) => { const pts = []; for (let i = 0; i <= 48; i++) { const t = t0 + (t1 - t0) * i / 48; pts.push(AP(a + Math.sin(t) * ry, Math.cos(t) * rx)); } return pts; };
  // lower rim: only its near (lower) arc shows; upper rim: the near arc, and the far arc beside the wrist
  ink(rim(-CH, -Math.PI, 0, CW + 0.002), { w: 3.0, d: 0.94, speed: 1.2, taper: [4, 4] });
  ink(rim(CH, -Math.PI, 0, CW), { w: 2.6, d: 0.9, speed: 1.2, taper: [4, 4] });
  ink(rim(CH, 0, 0.5), { w: 2.0, d: 0.8, speed: 1.2, taper: [3, 6] });
  ink(rim(CH, Math.PI, Math.PI - 0.5), { w: 2.0, d: 0.8, speed: 1.2, taper: [3, 6] });
  ink(rim(CH - 0.013, -Math.PI + 0.12, -0.12, CW - 0.004, 0.022), { w: 1.1, d: 0.5, speed: 1.2, taper: [6, 6] });   // a bevel
  ink(linePts(...AP(-CH, -CW - 0.002), ...AP(CH, -CW)), { w: 2.8, d: 0.92, speed: 0.6 });
  ink(linePts(...AP(-CH, CW + 0.002), ...AP(CH, CW)), { w: 3.0, d: 0.94, speed: 0.6 });
  // the hinge: a pinned bar down the left side in three knuckles; a row of rivet heads above the lower rim;
  // the lug forged on the hinge, its ring taking the last link
  const hb = (a, b) => AP(a, -CW + b);
  ink(resample([hb(-CH - 0.006, -0.002), hb(-CH - 0.006, -0.02), hb(CH + 0.004, -0.02), hb(CH + 0.004, -0.002)], 1.2 * PX), { w: 2.4, d: 0.9, speed: 0.6, taper: [3, 3] });
  for (const a of [-0.017, 0.017]) ink(linePts(...hb(a, -0.002), ...hb(a, -0.02)), { w: 1.6, d: 0.85, speed: 0.3 });
  for (const b of [-0.066, -0.033, 0.0, 0.033, 0.066]) dot(D, ...AP(-CH + 0.012 - 0.024 * Math.sqrt(Math.max(0, 1 - (b / CW) ** 2)), b), 2.6);
  ink(linePts(...add(lugC, pr, 0.024), ...hb(0.03, -0.02)), { w: 2.8, d: 0.9, speed: 0.4 });
  ink(linePts(...add(add(lugC, pr, 0.022), ar, -0.012), ...hb(0.008, -0.02)), { w: 2.0, d: 0.85, speed: 0.4 });
  const lastLink = links[NL - 1];
  for (const r of clipOut(lugO, [lastLink.outer])) ink(r, { w: 2.6, d: 0.92, speed: 0.4, taper: [3, 3] });
  for (const r of clipOut(lugI, [lastLink.outer])) ink(r, { w: 1.6, d: 0.85, speed: 0.4, taper: [3, 3] });
  // the first two links already drawn before the cut
  for (let i = 0; i < 2; i++) drawLink(i);
  for (let i = 0; i < 2; i++) shadeLink(i, { cross: i % 2 === 1 });
  D.fitTo(c0, -2.1, -0.35);
  // the third laid in just before the cut, so the first frame shows whole links
  D.at(-0.3);
  const l2 = D.mark();
  drawLink(2, { w: 3.2, wet: true });
  D.fitTo(l2, -0.3, -0.04);

  // ---- during the cut: the pen runs on down the chain to the cuff, then the iron is hatched dark
  D.at(0.0);
  const l0 = D.mark();
  for (let i = 3; i < NL; i++) drawLink(i, { w: 3.2, wet: true });
  D.fitTo(l0, 0.0, 0.28);
  D.at(0.22);
  const h0 = D.mark();
  for (let i = 2; i < NL; i++) shadeLink(i, { cross: i % 2 === 1, wet: true });
  const cuffShade = (x, y) => {
    const dx = x - Cf[0], dy = y - Cf[1];
    const a = dx * ar[0] + dy * ar[1], b = dx * pr[0] + dy * pr[1];
    const yb = Math.sqrt(Math.max(0, 1 - (b / (CW + 0.002)) ** 2)) * 0.024;
    if (Math.abs(b) > CW - 0.003 || a < -CH - yb + 0.003 || a > CH - yb - 0.003) return 0;
    return Math.min(1, 0.32 + 0.75 * sm(-0.03, CW * 0.9, b) + 0.4 * sm(-0.06, -CW, b) - 0.3 * Math.exp(-(((b + 0.035) / 0.014) ** 2)));
  };
  const cbb = [Cf[0] - 0.16, Cf[1] - 0.16, Cf[0] + 0.16, Cf[1] + 0.16];
  hatch(D, cuffShade, cbb, { angle: 0.95, sp: 3.0, w: 1.3, d: 0.8, speed: 3, minLen: 2, thr: [0.22, 0.9], gap: 0.002, wet: true });
  hatch(D, (x, y) => cuffShade(x, y) - 0.38, cbb, { angle: -0.6, sp: 3.4, w: 1.15, d: 0.72, speed: 3, minLen: 2, thr: [0.2, 0.9], gap: 0.002 });
  D.fitTo(h0, 0.24, 0.74);
  return D;
}

// ==== F29.1 (Prometheus cut): the eagle ==============================================================
// Red chalk. The fierce head in profile at the top, looking down-left under a heavy brow, the hooked beak;
// from the shoulder below it an outstretched wing sweeps down to the left: lesser and median coverts like
// scales, a row of greater coverts, the secondaries trailing to the right, the primaries fanning into the
// separated 'fingers' of an eagle. The head and inner wing are drawn before the cut; during it the primaries
// fan out fast, then the shadows go in.
export function eagle() {
  const D = new Drawing(2917);
  const CHK = { kind: 'chalk', nib: 0, wet: false };
  const ch = (pts, o = {}) => D.stroke(pts, { ...CHK, w: (o.w ?? 2.0) * 1.45, d: o.d ?? 0.66, speed: o.speed ?? 0.6, taper: o.taper ?? [8, 14], press: o.press ?? 0.35, pfreq: 14, load: 0.18, t0: o.t0, dur: o.dur, gap: o.gap });
  const shade = (fn, bb, o = {}) => hatch(D, fn, bb, { kind: 'chalk', angle: 0.92, sp: 4.6, w: 2.0, d: 0.5, maxLen: 50, speed: 1.6, gap: 0.005, bow: 0.05, wet: false, nib: 0, thr: [0.2, 0.85], ...o });

  // ---------------- the head (h units, origin at the eye, x right, y down; facing left) ----------------
  const E = [0.07, -0.268], h = 0.088, rot = 0.12, cr = Math.cos(rot), sr = Math.sin(rot);
  const Hd = ([x, y]) => [E[0] + (x * cr - y * sr) * h, E[1] + (x * sr + y * cr) * h];
  const Hi = (X, Y) => { const dx = (X - E[0]) / h, dy = (Y - E[1]) / h; return [dx * cr + dy * sr, -dx * sr + dy * cr]; };
  const hs = (ctrl, closed = false) => spline(ctrl.map(Hd), 1.5 * PX, closed);
  const culmen = [[-0.55, -0.42], [-0.9, -0.47], [-1.25, -0.4], [-1.55, -0.2], [-1.72, 0.08], [-1.72, 0.4], [-1.6, 0.68]];
  const hook = [[-1.6, 0.68], [-1.52, 0.5], [-1.42, 0.4]];
  const tomium = [[-1.42, 0.4], [-1.15, 0.36], [-0.8, 0.3], [-0.45, 0.27], [-0.15, 0.3], [0.08, 0.37]];
  const lowerM = [[-1.36, 0.44], [-1.0, 0.5], [-0.6, 0.52], [-0.2, 0.5]];
  const chin = [[-1.3, 0.47], [-0.9, 0.6], [-0.45, 0.66], [-0.05, 0.63], [0.2, 0.95], [0.42, 1.4], [0.62, 1.85]];
  const cere = [[-0.55, -0.42], [-0.62, -0.1], [-0.55, 0.27]];
  const brow = [[-0.52, -0.43], [-0.25, -0.37], [0.05, -0.31], [0.35, -0.33], [0.58, -0.44]];
  const crown = [[-0.55, -0.42], [-0.35, -0.62], [0.1, -0.8], [0.7, -0.83], [1.25, -0.63], [1.6, -0.25], [1.8, 0.3], [1.95, 0.85], [2.15, 1.35], [2.45, 1.8]];
  const beakPoly = poly([...culmen, ...hook.slice(1), ...tomium.slice(1, 4), ...cere.slice().reverse()].map(Hd));
  const headPoly = poly([...crown, [0.62, 1.85], ...chin.slice().reverse(), ...lowerM.slice().reverse(), ...culmen.slice(0, 1)].map(Hd));

  D.at(-16);
  ch(hs(culmen), { w: 3.0, d: 0.88, speed: 0.4, taper: [6, 4] });
  ch(hs(hook), { w: 2.8, d: 0.9, speed: 0.3, taper: [3, 6] });
  ch(hs(tomium), { w: 2.8, d: 0.86, speed: 0.4, taper: [4, 12] });
  ch(hs(lowerM), { w: 2.1, d: 0.72, speed: 0.4, taper: [4, 10] });
  ch(hs(chin.slice(0, 4)), { w: 2.3, d: 0.76, speed: 0.4, taper: [4, 8] });
  ch(hs(chin.slice(3)), { w: 1.3, d: 0.32, speed: 0.5, taper: [10, 30] });            // the throat feathers' edge; the breast below
  ch(hs(cere), { w: 1.6, d: 0.6, speed: 0.4, taper: [4, 4] });
  ch(arcPts(...Hd([-0.74, -0.12]), 0.1 * h, 0, TAU * 1.05, { ry: 0.055 * h, rot: rot - 0.35, step: 1 * PX }), { w: 1.5, d: 0.7, speed: 0.2, taper: [3, 3] });   // nostril
  ch(hs(crown.slice(0, 7)), { w: 2.2, d: 0.7, speed: 0.5, taper: [6, 10] });
  ch(hs(crown.slice(6)), { w: 2.1, d: 0.64, speed: 0.5, taper: [6, 30] });
  // the eye under its shelf of brow: iris ring, pupil, the lower lid; the fierce brow drawn heavy
  const eyeC = Hd([0.0, -0.1]);
  ch(hs([[-0.19, -0.09], [-0.06, -0.2], [0.08, -0.21], [0.18, -0.12]]), { w: 2.0, d: 0.86, speed: 0.25, taper: [3, 5] });   // upper lid
  ch(hs([[-0.19, -0.09], [-0.08, 0.02], [0.08, 0.02], [0.18, -0.12]]), { w: 1.6, d: 0.74, speed: 0.25, taper: [3, 5] });    // lower lid
  ch(arcPts(eyeC[0], eyeC[1], 0.105 * h, 0.15, Math.PI - 0.15, { step: 1 * PX }), { w: 1.0, d: 0.55, speed: 0.25, taper: [3, 3] });
  const pup = Hd([-0.03, -0.11]);
  for (let k = 0; k < 4; k++) D.stroke(arcPts(pup[0], pup[1], (0.012 + k * 0.011) * h, 0, TAU * 1.1, { step: 0.6 * PX }), { ...CHK, w: 2.6, d: 0.95, speed: 0.08, taper: [1, 1], press: 0.05 });
  ch(hs(brow), { w: 3.6, d: 0.92, speed: 0.4, taper: [6, 10], press: 0.25 });
  ch(hs([[-0.4, -0.5], [-0.05, -0.43], [0.4, -0.46]]), { w: 1.4, d: 0.46, speed: 0.4, taper: [10, 10] });
  // cheek feathers sweeping back from the gape, hackles down the nape and neck
  for (const [p0, p1, p2] of [[[0.25, 0.2], [0.65, 0.32], [1.0, 0.36]], [[0.3, 0.5], [0.7, 0.62], [1.1, 0.7]], [[0.45, -0.1], [0.85, -0.05], [1.2, 0.05]], [[0.2, 0.8], [0.55, 1.0], [0.85, 1.15]]]) {
    ch(hs([p0, p1, p2]), { w: 1.4, d: 0.52, speed: 0.6, taper: [10, 16] });
  }
  const hackle = (x, y, len, ang) => {
    const d = [Math.cos(ang), Math.sin(ang)], n = [-d[1], d[0]], wd = 0.11;
    const pts = [[x + n[0] * wd, y + n[1] * wd], [x + d[0] * len * 0.6 + n[0] * wd * 0.7, y + d[1] * len * 0.6 + n[1] * wd * 0.7], [x + d[0] * len, y + d[1] * len], [x + d[0] * len * 0.6 - n[0] * wd * 0.7, y + d[1] * len * 0.6 - n[1] * wd * 0.7], [x - n[0] * wd, y - n[1] * wd]];
    ch(hs(pts), { w: 1.5, d: 0.6, speed: 0.5, taper: [4, 4] });
  };
  for (const [x, y, l, a] of [[1.15, -0.35, 0.45, 1.25], [1.4, 0.0, 0.5, 1.3], [1.1, 0.25, 0.5, 1.35], [1.5, 0.5, 0.55, 1.4], [1.25, 0.75, 0.5, 1.4], [1.6, 1.05, 0.6, 1.45],
    [1.3, 1.25, 0.55, 1.45], [0.95, 1.05, 0.5, 1.5], [1.75, 1.45, 0.5, 1.5], [1.35, 1.5, 0.5, 1.5], [0.9, 1.45, 0.45, 1.55], [0.6, 1.25, 0.45, 1.6]]) hackle(x, y, l, a);
  // shading: the eye socket under the brow (it cuts across the top of the eye: the glare), the bill's
  // underside and chin, the cheek, the back of the head and the neck turning away
  shade((X, Y) => {
    const [x, y] = Hi(X, Y);
    const inB = inP(beakPoly, X, Y);
    if (!inP(headPoly, X, Y) && !inB) return 0;
    const ex = x - 0.0, ey = y + 0.1, dEye = Math.hypot(ex, ey);
    if (dEye < 0.15 && ey > -0.03) return 0;                                      // the lit lower eye
    let v = 0;
    const sock = ((x - 0.05) / 0.55) ** 2 + ((y + 0.2) / 0.22) ** 2;              // the socket under the brow shelf
    if (sock < 1 && y > -0.36) v += 1.0 * (1 - sock * 0.6);
    if (inB) v += 0.5 * sm(0.0, 0.32, y) + 0.45 * sm(-1.25, -1.6, x) * sm(0.15, 0.55, y);
    if (y > 0.46 && x < 0.35) v += 0.7;                                           // chin / lower mandible
    if (!inB) v += 0.32 * sm(0.05, 0.3, y) * sm(0.1, 0.4, x);                     // cheek
    v += 0.75 * sm(0.9, 1.8, x) + 0.4 * sm(0.8, 2.0, y) * sm(0.2, 1.2, x);       // nape and neck
    return Math.min(1, v);
  }, [E[0] - 0.17, E[1] - 0.1, E[0] + 0.24, E[1] + 0.2], { sp: 3.6, d: 0.62, w: 1.9 });
  // the body: the back line runs on from the nape behind the wing; the breast swells out from the throat and
  // down into the wing's leading edge (its feathers and shadow drawn once the wing is laid out, below)
  ch(spline([Hd([2.45, 1.8]), [0.33, -0.06], [0.36, 0.02]], 1.5 * PX), { w: 2.0, d: 0.6, speed: 0.5, taper: [6, 40] });
  const breast = [Hd([-0.05, 0.63]), [0.048, -0.172], [0.037, -0.122], [0.034, -0.072], [0.038, -0.036], [0.046, -0.012]];
  ch(spline(breast, 1.5 * PX), { w: 2.2, d: 0.7, speed: 0.5, taper: [6, 16] });
  ch(spline([[0.05, -0.18], [0.04, -0.125], [0.038, -0.07]], 1.5 * PX).map(([x, y]) => [x - 2.5 * PX, y]), { w: 1.3, d: 0.3, speed: 0.8, taper: [16, 16] });
  for (const [x, y, l, a] of [[2.1, 1.85, 0.5, 1.5], [1.7, 1.9, 0.55, 1.55], [1.3, 1.9, 0.5, 1.6], [0.95, 1.85, 0.45, 1.65]]) hackle(x, y, l, a);
  // ---------------- the wing (u along it from the shoulder, v toward the trailing edge) ----------------
  const Sh = [0.165, -0.095], U = nrm([-0.6, 0.8]), Vv = [U[1], -U[0]], WS = 0.82;
  const Wp = (u, v) => [Sh[0] + (u * U[0] + v * Vv[0]) * WS, Sh[1] + (u * U[1] + v * Vv[1]) * WS];
  // a feather: centre line from `base` (wing coords) along angle a (from U toward V), length L, width wd;
  // fingers narrow their vanes beyond ~60% (emargination). Returns the page outline and rachis.
  const feather = (base, a, L, wd, o = {}) => {
    const n = 26, front = [], back = [], rach = [];
    const bend = o.bend ?? 0.12;
    for (let i = 0; i <= n; i++) {
      const s = i / n, aa = a + bend * s * s;
      const c = [base[0] + Math.cos(a) * L * s + (Math.cos(aa) - Math.cos(a)) * L * s * 0.5, base[1] + Math.sin(a) * L * s + (Math.sin(aa) - Math.sin(a)) * L * s * 0.5];
      const tipK = s > 0.8 ? Math.sqrt(Math.max(0, 1 - ((s - 0.8) / 0.2) ** 2)) : 1;
      const baseK = 0.55 + 0.45 * sm(0, 0.12, s);
      const em = o.finger ? 1 - 0.42 * sm(0.5, 0.64, s) : 1;
      const em2 = o.finger ? 1 - 0.22 * sm(0.58, 0.7, s) : 1;
      const nx = -Math.sin(aa), ny = Math.cos(aa);                        // toward V (trailing side)
      const wf = wd * 0.34 * tipK * baseK * em2, wb = wd * 0.66 * tipK * baseK * em;
      front.push(Wp(c[0] - nx * wf, c[1] - ny * wf));
      back.push(Wp(c[0] + nx * wb, c[1] + ny * wb));
      if (s < 0.96) rach.push(Wp(c[0], c[1]));
    }
    const outline = poly([...front, ...back.slice().reverse()]);
    return { front, back, rach, outline, tip: front[front.length - 1], kind: o.kind || 'flight', d: o.d, w: o.w };
  };
  const prim = [], sec = [], gcov = [], mcov = [], lcov = [];
  const PL = [0.22, 0.24, 0.27, 0.3, 0.32, 0.34, 0.35, 0.35, 0.33, 0.29];
  for (let i = 0; i < 10; i++) {
    const f = i / 9, b = lerp2([0.33, 0.045], [0.46, 0.03], f), a = 1.15 + (-0.32 - 1.15) * f;
    prim.push(feather(b, a, PL[i], 0.052 + (0.04 - 0.052) * f, { finger: i >= 4, bend: 0.1 + 0.1 * f }));
    gcov.push(feather([b[0] - 0.012, b[1] - 0.012], a + 0.04, PL[i] * 0.3, 0.046, { kind: 'cov', bend: 0.05 }));
  }
  for (let j = 0; j < 12; j++) {
    const f = j / 11, b = lerp2([0.02, 0.05], [0.32, 0.048], f), a = 1.62 + (1.12 - 1.62) * f;
    sec.push(feather(b, a, j < 2 ? 0.23 : 0.25, 0.058, { bend: 0.06 }));
    gcov.push(feather([b[0] + 0.004, b[1] - 0.004], a - 0.04, 0.085, 0.05, { kind: 'cov', bend: 0.04 }));
  }
  for (let j = 0; j < 14; j++) {
    const f = j / 13, b = lerp2([0.03, 0.006], [0.37, 0.004], f), a = 1.5 + (0.95 - 1.5) * f;
    mcov.push(feather(b, a, 0.06, 0.042, { kind: 'cov', bend: 0.03 }));
  }
  for (let r = 0; r < 2; r++) for (let j = 0; j < 12 - r * 2; j++) {
    const f = j / (11 - r * 2), b = lerp2([0.03 + r * 0.04, -0.03 + r * 0.02], [0.34 - r * 0.02, -0.03 + r * 0.02], f), a = 1.45 + (1.0 - 1.45) * f;
    lcov.push(feather(b, a, 0.04, 0.034, { kind: 'cov', bend: 0.02 }));
  }
  const alula = feather([0.33, -0.03], 0.06, 0.085, 0.022, { kind: 'cov', bend: 0.02 });   // the bastard wing, along the leading edge at the wrist
  // stacking, top first: lesser, median, greater coverts, alula, secondaries (body first), primaries (inner first)
  const stack = [...lcov, ...mcov, alula, ...gcov, ...sec, ...prim];
  const lead = spline([[0, -0.02], [0.1, -0.05], [0.22, -0.058], [0.33, -0.03], [0.4, -0.02]].map(([u, v]) => Wp(u, v)), 1.5 * PX);
  const top = stackGrid(stack.map((q) => q.outline), [-0.4, -0.2, 0.5, 0.6], 0.6 * PX);
  const nCov = lcov.length + mcov.length + 1 + gcov.length;               // stack indices below this are coverts
  const drawFeather = (k, o = {}) => {
    const F = stack[k], occ = [(x, y) => top(x, y) < k];
    const flight = F.kind === 'flight';
    const w = o.w ?? (flight ? 2.2 : 1.7), d = o.d ?? (flight ? 0.8 : 0.68);
    const fr = resample([...F.front, F.back[F.back.length - 1]], 1.3 * PX), bk = resample(F.back, 1.3 * PX);
    for (const r of clipOut(fr, occ)) ch(r, { w: w * 0.85, d: d * 0.88, speed: o.speed ?? 1.2, taper: [5, 8] });
    for (const r of clipOut(bk, occ)) ch(r, { w: w * 1.12, d: Math.min(1, d * 1.06), speed: o.speed ?? 1.2, taper: [5, 8] });
    if (flight) for (const r of clipOut(resample(F.rach, 1.3 * PX), occ)) ch(r, { w: 1.1, d: 0.42, speed: (o.speed ?? 1.2) * 1.4, taper: [10, 30] });
  };
  // inner wing before the cut
  D.at(-16 + 8);
  ch(lead, { w: 3.4, d: 0.9, speed: 0.5, taper: [8, 10] });
  for (let k = 0; k < stack.length - prim.length; k++) drawFeather(k);
  scriptBlock(D, ['l’aquila di Giove', 'che pasce del fegato', 'del ladro del foco'], -0.14, -0.08, { size: 19, lh: 26, d: 0.56, kind: 'chalk' });
  // the breast: rows of small feathers, the shadow under the shoulder and the throat
  const brX = (y) => { const b = spline(breast, 3 * PX); let x = b[0][0]; for (let i = 1; i < b.length; i++) if ((b[i - 1][1] - y) * (b[i][1] - y) <= 0) { x = b[i][0]; break; } return x; };
  const inBreast = (x, y) => y > -0.196 && y < -0.004 && x > brX(y) + 0.003 && x < 0.15 && top(x, y) === 65535 && !inP(headPoly, x, y);
  for (const [x, y] of [[0.07, -0.168], [0.058, -0.14], [0.08, -0.138], [0.052, -0.11], [0.072, -0.108], [0.094, -0.112], [0.056, -0.08], [0.076, -0.078], [0.062, -0.05], [0.082, -0.06]]) {
    const pts = arcPts(x, y, 0.0085, 0.35, Math.PI - 0.35, { step: 1 * PX }).filter(([a, b]) => inBreast(a, b));
    if (pts.length > 4) ch(pts, { w: 1.3, d: 0.5, speed: 0.5, taper: [4, 4] });
  }
  shade((x, y) => (inBreast(x, y) ? Math.min(1, 0.2 + 0.6 * sm(0.05, 0.12, x) + 0.45 * sm(-0.06, -0.01, y) + 0.4 * sm(-0.16, -0.196, y)) : 0), [0.03, -0.2, 0.16, 0.0], { sp: 3.8, d: 0.55, w: 1.9 });
  D.fitTo(0, -16, -0.3);
  // ---- during the cut: the primaries fan out, inner to outer, each in one quick stroke
  D.at(-0.12);
  const p0 = D.mark();
  for (let k = stack.length - prim.length; k < stack.length; k++) drawFeather(k, { w: 2.6, d: 0.88, speed: 3.2 });
  D.fitTo(p0, -0.12, 0.38);
  // ---- then the shadows: under each covert row, the inner vanes, the gaps between the fingers
  D.at(0.34);
  const s0 = D.mark();
  const covTips = gcov.concat(mcov).map((q) => q.tip);
  const bbw = [-0.3, -0.12, 0.4, 0.5];
  shade((x, y) => {
    const k = top(x, y);
    if (k === 65535 || k < nCov) return 0;                                       // only on the flight feathers
    let v = 0.18;
    for (const c of covTips) { const dd = Math.hypot(x - c[0], y - c[1]); if (dd < 0.08) v += 0.75 * Math.exp(-dd / 0.018); }
    // the secondaries and inner primaries turn from the light toward the trailing edge
    const dx = x - Sh[0], dy = y - Sh[1], vv = (dx * Vv[0] + dy * Vv[1]) / WS;
    v += 0.35 * sm(0.12, 0.3, vv);
    return Math.min(1, v);
  }, bbw, { sp: 4.0, d: 0.56, maxLen: 30, speed: 3.5, gap: 0.002 });
  // the coverts: a light tone, darker toward the body
  shade((x, y) => {
    const k = top(x, y);
    if (k >= nCov) return 0;
    const dx = x - Sh[0], dy = y - Sh[1], uu = (dx * U[0] + dy * U[1]) / WS, vv = (dx * Vv[0] + dy * Vv[1]) / WS;
    return 0.25 + 0.4 * sm(0.3, 0.0, uu) + 0.3 * sm(0.0, 0.08, vv);
  }, [-0.05, -0.12, 0.35, 0.25], { sp: 4.4, d: 0.48, maxLen: 26, speed: 3.5, gap: 0.002, angle: -0.5 });
  D.fitTo(s0, 0.34, 0.74);
  return D;
}
