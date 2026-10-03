// The two frenzy studies of the Sol Invictus cut (scene 'studies'), composed for the vertical page:
//   sol      (F29.1): iron-gall numismatic study of a coin of Sol Invictus: the radiate bust of the sun god,
//                     the legend SOLI INVICTO COMITI round the rim, a magnified detail of the crown of rays
//   solstice (F30.3): a cosmographic diagram of the winter solstice (Sacrobosco/Apian): the horizon, the sun's
//                     three daily arcs, the tropic of Capricorn, the sun-face at the lowest noon: BRUMA
// Page units: frame height at zoom 1, origin at the page centre, y down. Times are shot-local seconds; each
// shot runs ~0.79 s, so the first frame must already read and the bold strokes draw themselves inside it.
import { Drawing, PX, TAU, arcPts, linePts, hatch, resample, spline } from './studies-ink.js';
import { circleStroke, dot, scriptBlock } from './studies-drawings.js';

// ---- shared geometry ------------------------------------------------------------------------------
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
const nrm = (v) => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function inPoly(poly, x, y) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function poly(pts) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const P = pts.slice();
  P.bb = [x0, y0, x1, y1];
  return P;
}
const inP = (P, x, y) => x >= P.bb[0] && x <= P.bb[2] && y >= P.bb[1] && y <= P.bb[3] && inPoly(P, x, y);
const hidden = (occ, x, y) => occ.some((o) => (typeof o === 'function' ? o(x, y) : inP(o, x, y)));
function clipOut(pts, occ) {
  const runs = [];
  let cur = [];
  for (const p of pts) {
    if (hidden(occ, p[0], p[1])) { if (cur.length > 1) runs.push(cur); cur = []; } else cur.push(p);
  }
  if (cur.length > 1) runs.push(cur);
  return runs.filter((r) => r.length > 2);
}
// time at which the pen of stroke `it` reaches the fraction `q` of its length (inverts the pen easing)
function penTime(it, q) {
  const ease = (f) => { const s = f * f * (3 - 2 * f); return 0.2 * f + 0.8 * s; };
  let a = 0, b = 1;
  for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (ease(m) < q) a = m; else b = m; }
  return it.t0 + (it.t1 - it.t0) * (a + b) / 2;
}
// one pen stroke that lifts where `occ` hides it: the visible runs keep the timing of the whole stroke.
// Returns a stand-in item (t0, t1, pts, s, L) for penTime.
function timedStroke(D, pts, occ, o) {
  const r = resample(pts, 1.6 * PX), s = [0];
  for (let i = 1; i < r.length; i++) s.push(s[i - 1] + Math.hypot(r[i][0] - r[i - 1][0], r[i][1] - r[i - 1][1]));
  const L = s[s.length - 1], it = { t0: o.t0, t1: o.t0 + o.dur, pts: r, s, L };
  const hid = r.map(([x, y]) => hidden(occ, x, y));
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
function arrowHead(D, tip, dir, len, o = {}) {
  const d = nrm(dir), n = [-d[1], d[0]];
  const sp = o.spread ?? 0.55;
  const a = add(add(tip, d, -len), n, len * sp), b = add(add(tip, d, -len), n, -len * sp);
  const so = { w: o.w ?? 1.8, d: o.d ?? 0.85, dur: o.dur ?? 0.03, taper: [3, 2], gap: 0, t0: o.t0 };
  D.stroke(linePts(a[0], a[1], tip[0], tip[1]), so);
  D.stroke(linePts(b[0], b[1], tip[0], tip[1]), { ...so, t0: o.t0 != null ? o.t0 + (o.dur ?? 0.03) * 0.6 : undefined });
}

// ---- lettering: upright roman capitals (the shader's IM Fell English), measured to set them on a circle --
let MC = null;
function textW(str, size) {
  try {
    if (!MC) MC = document.createElement('canvas').getContext('2d');
    MC.font = '64px "IM Fell English"';
    return (MC.measureText(str).width / 64) * size * PX;
  } catch (e) { return str.length * 0.66 * size * PX; }
}
const caps = (D, str, x, y, o = {}) => D.text(str, x, y, { mirror: false, font: 'roman', size: o.size ?? 24, d: o.d ?? 0.8, angle: o.angle ?? 0, t0: o.t0, dur: o.dur, cps: o.cps ?? 30, gap: o.gap ?? 0.02 });
// letters set round a circle (centre c, baseline radius r) centred on page angle aMid. dir 1: clockwise on
// screen, tops outward (a coin's legend); dir -1: reading left to right along the bottom, tops inward.
// `span` (radians) spreads the letters to fill it; otherwise `track` (em) spaces them.
function arcCaps(D, str, c, r, aMid, o = {}) {
  const size = o.size ?? 24, dir = o.dir ?? 1, chars = [...str];
  const ws = chars.map((ch) => textW(ch, size) * (ch === ' ' ? (o.space ?? 1.6) : 1));
  const sum = ws.reduce((a, b) => a + b, 0);
  const track = o.span ? Math.max(0, (o.span * r - sum) / Math.max(1, chars.length - 1)) : (o.track ?? 0.1) * size * PX;
  const total = sum + track * (chars.length - 1);
  let a = aMid - (dir * total) / r / 2;
  const t0 = o.t0, per = o.dur != null ? o.dur / chars.length : null;
  chars.forEach((ch, i) => {
    const w = ws[i], am = a + (dir * w) / 2 / r;
    if (ch !== ' ') {
      const rot = dir > 0 ? am + Math.PI / 2 : am - Math.PI / 2;
      const bx = c[0] + Math.cos(am) * r, by = c[1] + Math.sin(am) * r;
      caps(D, ch, bx - (Math.cos(rot) * w) / 2, by - (Math.sin(rot) * w) / 2, { size, d: o.d, angle: rot, t0: t0 != null ? t0 + per * i : undefined, dur: per ?? undefined, gap: 0.004 });
    }
    a += (dir * (w + track)) / r;
  });
}

// ==== F29.1 (Sol cut): the coin of Sol Invictus ======================================================
// A bronze of Constantine's mint, drawn as a numismatist would: the raised rim and its border of pellets, the
// legend SOLI INVICTO COMITI round it, and in the field the bust of the sun god in profile to the right: the
// crown of rays rising from a fillet whose ties flutter at the nape, curls under it, the cloak pinned on the
// shoulder. Light from the upper left: the relief's lower-right flanks hatched, the rim's shadow inside it,
// the coin's edge and cast shadow on the paper. Above it a lens magnifies the crown: during the cut the last
// rays go in on the coin, then the pen lays the great rays of the detail and hatches their shadowed flanks.
export function sol() {
  const D = new Drawing(2921);
  const C = [-0.02, 0.1], RC = 0.235;                                // the coin
  const h = 0.19, HC = [C[0] - 0.004, C[1] - 0.006];                 // head units (crown to chin ~1) -> page
  const I = [0.13, -0.29], RI = 0.125, K = 2.2;                      // the magnified detail
  const PM = [0.1, -0.53];                                           // its centre, in head units
  const coinM = { f: ([x, y]) => [HC[0] + x * h, HC[1] + y * h], inv: (X, Y) => [(X - HC[0]) / h, (Y - HC[1]) / h] };
  const P0 = coinM.f(PM);
  const magM = {
    f: (p) => { const q = coinM.f(p); return [I[0] + (q[0] - P0[0]) * K, I[1] + (q[1] - P0[1]) * K]; },
    inv: (X, Y) => coinM.inv(P0[0] + (X - I[0]) / K, P0[1] + (Y - I[1]) / K),
  };
  const outLens = (x, y) => Math.hypot(x - I[0], y - I[1]) > RI - 0.006;
  const Lt = nrm([-0.6, -0.8]);                                      // toward the light (page)

  // ---- the bust, in head units (x right, y down; facing right) ----
  const face = [[0.33, -0.31], [0.375, -0.22], [0.41, -0.12], [0.435, -0.06], [0.428, -0.02], [0.47, 0.06], [0.52, 0.14], [0.546, 0.178],
    [0.522, 0.2], [0.476, 0.212], [0.484, 0.245], [0.494, 0.266], [0.466, 0.283], [0.484, 0.303], [0.466, 0.327], [0.442, 0.347],
    [0.462, 0.39], [0.45, 0.432], [0.4, 0.46], [0.3, 0.468], [0.2, 0.488]];
  const neckF = [[0.2, 0.488], [0.17, 0.56], [0.18, 0.64], [0.22, 0.705]];
  const skull = [[0.3, -0.39], [0.2, -0.47], [0.02, -0.535], [-0.18, -0.515], [-0.34, -0.43], [-0.44, -0.3]];
  const hairBack = [[-0.45, -0.22], [-0.505, -0.06], [-0.52, 0.08], [-0.49, 0.2], [-0.43, 0.3], [-0.35, 0.39], [-0.29, 0.45]];
  const neckB = [[-0.29, 0.45], [-0.27, 0.55], [-0.29, 0.665]];
  const bandC = spline([[0.33, -0.355], [0.16, -0.425], [-0.04, -0.448], [-0.24, -0.408], [-0.4, -0.318], [-0.47, -0.24]], 0.01);
  const bandOff = (k) => bandC.map((p, i) => {
    const a = bandC[Math.max(0, i - 1)], b = bandC[Math.min(bandC.length - 1, i + 1)], t = nrm([b[0] - a[0], b[1] - a[1]]);
    return [p[0] + t[1] * k, p[1] - t[0] * k];                      // k > 0: toward the top of the head
  });
  const bandHi = bandOff(0.032), bandLo = bandOff(-0.032);
  const hairIn = [[-0.29, 0.45], [-0.2, 0.36], [-0.1, 0.26], [-0.03, 0.15], [0.0, 0.02], [0.05, -0.1], [0.14, -0.19], [0.24, -0.26], [0.33, -0.31]];
  const hairPoly = poly([...bandLo, ...hairBack, ...hairIn.slice(1)]);
  const headPoly = poly([...face, ...neckF, [-0.29, 0.665], ...neckB.slice().reverse(), ...hairBack.slice().reverse(), ...skull.slice().reverse()]);
  const frontLine = resample([...face, ...neckF.slice(1)], 0.012);
  const dFront = (x, y) => { let m = 9; for (const p of frontLine) { const d = (p[0] - x) ** 2 + (p[1] - y) ** 2; if (d < m) m = d; } return Math.sqrt(m); };
  // rays: slender spikes rising from the fillet, radial from a point inside the head
  const Q = [-0.04, -0.03];
  const bandAt = (u) => bandC[Math.min(bandC.length - 1, Math.round(u * (bandC.length - 1)))];
  const rays = [0.05, 0.19, 0.33, 0.48, 0.63, 0.78, 0.93].map((u, i) => {
    const b = bandAt(u), d = nrm([b[0] - Q[0], b[1] - Q[1]]), n = [-d[1], d[0]];
    const L = [0.27, 0.315, 0.335, 0.335, 0.325, 0.3, 0.265][i], hw = 0.048;
    const base = add(b, d, 0.012);
    const b1 = add(base, n, hw), b2 = add(base, n, -hw), tip = add(base, d, L);
    const sgn = (n[0] * Lt[0] + n[1] * Lt[1]) < 0 ? 1 : -1;           // the flank turned from the light
    return { b1, b2, tip, base, d, n, L, sgn, tri: poly([b1, tip, b2]) };
  });
  // the cloak over the shoulders, pinned with a round brooch
  const shB = [[-0.29, 0.66], [-0.42, 0.7], [-0.54, 0.78], [-0.6, 0.885]];
  const shF = [[0.22, 0.705], [0.38, 0.72], [0.5, 0.78], [0.56, 0.865]];
  const trunc = [[-0.6, 0.885], [-0.3, 0.93], [0.0, 0.945], [0.3, 0.925], [0.56, 0.865]];
  const neckline = [[-0.29, 0.675], [-0.1, 0.735], [0.06, 0.74], [0.22, 0.705]];
  const BR = [0.33, 0.795];
  const folds = [[[0.29, 0.815], [0.08, 0.855], [-0.2, 0.88], [-0.48, 0.885]], [[0.29, 0.77], [0.08, 0.785], [-0.2, 0.795], [-0.5, 0.805]],
    [[0.37, 0.83], [0.39, 0.87], [0.41, 0.91]], [[-0.3, 0.71], [-0.43, 0.77], [-0.56, 0.845]], [[0.37, 0.755], [0.46, 0.785], [0.54, 0.835]]];
  const cloakPoly = poly([...shB, ...trunc.slice(1), ...shF.slice().reverse().slice(1), ...neckline.slice().reverse()]);
  const necklineY = (x) => { const s = spline(neckline, 0.01); let y = s[0][1]; for (const p of s) if (p[0] <= x) y = p[1]; return y; };
  // the hair: wavy locks sweeping back from the brow under the fillet, each rolling into a curl at the back;
  // a fringe of small curls under the fillet; curls at the nape
  const along = (pl, f) => { const r = resample(pl, 0.004); return r[Math.min(r.length - 1, Math.round(f * (r.length - 1)))]; };
  const hairInR = hairIn.slice().reverse();
  const locks = [];
  for (let k = 0; k < 7; k++) {
    const f = 0.1 + k * 0.125, S0 = along(hairInR, f * 0.9), E0 = along(hairBack, Math.min(0.96, f * 1.05 + 0.02));
    const dv = [E0[0] - S0[0], E0[1] - S0[1]], nv = nrm([dv[1], -dv[0]]);       // nv: toward the top/back
    const wv = 0.025 * (1 - f * 0.5);
    const ctrl = [S0, add(add(S0, dv, 0.3), nv, 0.03 + wv), add(add(S0, dv, 0.58), nv, 0.03 - wv), add(add(S0, dv, 0.86), nv, 0.02 + wv * 0.5), E0];
    locks.push({ ctrl, end: E0, dv: nrm(dv), nv });
  }
  const curl = (c, r, a0, dir, turns = 1.35) => { const pts = []; for (let i = 0; i <= 30; i++) { const u = i / 30, a = a0 + dir * u * turns * TAU, rr = r * (1 - 0.75 * u); pts.push([c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr * 0.9]); } return pts; };
  const curls = [];
  for (let u = 0.08; u < 0.95; u += 0.115) { const b = bandAt(u), q = add(b, [0, 1], 0.075); if (inP(hairPoly, q[0], q[1])) curls.push({ c: q, r: 0.04, a0: -1.2, dir: 1 }); }
  for (const [x, y] of [[-0.38, 0.36], [-0.3, 0.3], [-0.44, 0.24], [-0.22, 0.4]]) curls.push({ c: [x, y], r: 0.045, a0: 0.4, dir: -1 });
  // ---- pens: a spline in head units through a map, lifted where `clip` hides it
  const pen = (M, ctrl, o = {}, clip = null) => {
    const pts = o.raw ? resample(ctrl.map(M.f), 1.2 * PX) : spline(ctrl.map(M.f), 1.2 * PX, !!o.closed);
    const runs = clip ? clipOut(pts, [clip]) : [pts];
    for (const r of runs) D.stroke(r, { w: o.w ?? 1.8, d: o.d ?? 0.85, speed: o.speed ?? 0.9, taper: o.taper ?? [6, 10], press: o.press ?? 0.25, wet: o.wet });
  };
  const shadeH = (M, fn, bbH, o = {}, clip = null) => {
    const cs = [M.f([bbH[0], bbH[1]]), M.f([bbH[2], bbH[3]])];
    const bb = [Math.min(cs[0][0], cs[1][0]), Math.min(cs[0][1], cs[1][1]), Math.max(cs[0][0], cs[1][0]), Math.max(cs[0][1], cs[1][1])];
    return hatch(D, (X, Y) => { if (clip && clip(X, Y)) return 0; const [x, y] = M.inv(X, Y); return fn(x, y); }, bb, { angle: 0.95, sp: 2.8, w: 1.0, d: 0.66, maxLen: 24, speed: 2.6, minLen: 2, gap: 0.003, thr: [0.22, 0.88], wet: false, ...o });
  };
  // ---------------- before the cut: the coin ----------------
  D.at(-16);
  // the coin's face and its edge seen a little from above (lower right), the shadow it casts on the paper
  const eOff = [0.0045, 0.0065];
  circleStroke(D, C[0], C[1], RC, { w: 2.6, d: 0.92, speed: 1.2, sweep: TAU * 1.02, wob: 0.25 * PX, a0: -2.2 });
  D.stroke(arcPts(C[0] + eOff[0], C[1] + eOff[1], RC, -0.75, 2.45, { step: 1.5 * PX, wob: 0.2 * PX, seed: 5 }), { w: 2.2, d: 0.88, speed: 1.2, taper: [30, 30] });
  hatch(D, (x, y) => {
    const r0 = Math.hypot(x - C[0], y - C[1]), r1 = Math.hypot(x - C[0] - eOff[0], y - C[1] - eOff[1]);
    return r0 > RC + 0.6 * PX && r1 < RC ? 1 : 0;
  }, [C[0] - RC, C[1] - RC, C[0] + RC + 0.01, C[1] + RC + 0.01], { angle: -0.6, sp: 2.2, w: 1.0, d: 0.8, speed: 3, minLen: 1.5, gap: 0.002, thr: [0.2, 0.8] });
  hatch(D, (x, y) => {
    const r1 = Math.hypot(x - C[0] - eOff[0], y - C[1] - eOff[1]), rs = Math.hypot(x - C[0] - 0.016, y - C[1] - 0.02);
    return r1 > RC + 0.6 * PX && rs < RC + 0.004 ? 0.85 : 0;
  }, [C[0] - RC, C[1] - RC, C[0] + RC + 0.03, C[1] + RC + 0.03], { angle: 0.95, sp: 3.4, w: 1.0, d: 0.5, speed: 3, maxLen: 30, gap: 0.002, thr: [0.25, 0.9] });
  // the raised rim, its border of pellets, the rim's shadow on the field at the upper left
  circleStroke(D, C[0], C[1], RC - 0.012, { w: 1.5, d: 0.8, speed: 1.2, sweep: TAU * 1.01, wob: 0.2 * PX });
  for (let i = 0; i < 92; i++) { const a = (i / 92) * TAU + 0.02; dot(D, C[0] + Math.cos(a) * (RC - 0.021), C[1] + Math.sin(a) * (RC - 0.021), 3.4, { d: 0.85 }); }
  hatch(D, (x, y) => {
    const dx = x - C[0], dy = y - C[1], r = Math.hypot(dx, dy);
    if (r > RC - 0.013 || r < RC - 0.03) return 0;
    return Math.max(0, -(dx * 0.6 + dy * 0.8) / r) * sm(RC - 0.03, RC - 0.014, r) * 1.1;
  }, [C[0] - RC, C[1] - RC, C[0] + RC, C[1] + RC], { angle: 0.95, sp: 2.6, w: 0.9, d: 0.6, speed: 3, minLen: 1.5, gap: 0.002, thr: [0.2, 0.9] });
  // the legend, clockwise from the lower left, leaving the bottom to the bust
  arcCaps(D, 'SOLI INVICTO COMITI', C, RC - 0.064, -Math.PI / 2, { size: 40, span: 1.56 * Math.PI, d: 0.88, space: 2.2 });

  // ---- the head: hair and fillet behind, the profile, the neck, the cloak
  const W = { w: 2.0, d: 0.9 };
  pen(coinM, skull, { w: 1.6, d: 0.8, taper: [6, 6] });
  pen(coinM, hairBack, { w: 2.2, d: 0.9 });
  pen(coinM, face, { w: 2.2, d: 0.92, speed: 0.6, taper: [4, 6] });
  pen(coinM, neckF, { w: 2.3, d: 0.92 });
  pen(coinM, neckB, { w: 1.6, d: 0.78 });
  pen(coinM, bandHi, { raw: true, ...W }); pen(coinM, bandLo, { raw: true, ...W });
  pen(coinM, [bandHi[0], bandLo[0]], { raw: true, w: 1.6, d: 0.85 });
  for (let i = 4; i < bandC.length - 3; i += 7) dot(D, ...coinM.f(bandC[i]), 2.6, { d: 0.8 });   // pearls on the fillet
  // the fillet's ties fluttering behind the nape
  pen(coinM, [[-0.47, -0.235], [-0.56, -0.1], [-0.6, 0.05], [-0.68, 0.17], [-0.66, 0.24]], { w: 2.0, d: 0.86, taper: [4, 20] });
  pen(coinM, [[-0.47, -0.225], [-0.62, -0.13], [-0.72, 0.0], [-0.8, 0.07]], { w: 1.8, d: 0.82, taper: [4, 20] });
  pen(coinM, [[-0.5, -0.17], [-0.6, -0.02], [-0.64, 0.12]], { w: 1.0, d: 0.55, taper: [10, 10] });
  // the locks and curls, the hair on the crown under the rays, the ear, the face's features
  const hairPen = (M, o, clip) => {
    for (const L of locks) {
      pen(M, L.ctrl, { w: o.w, d: o.d, speed: o.speed, taper: [10, 4] }, clip);
      const cc = add(add(L.end, L.dv, -0.035), L.nv, -0.03);
      pen(M, curl(cc, 0.04, Math.atan2(L.end[1] - cc[1], L.end[0] - cc[0]), -1, 1.2), { raw: true, w: o.w * 0.9, d: o.d, speed: o.speed, taper: [3, 6] }, clip);
    }
    for (const q of curls) pen(M, curl(q.c, q.r, q.a0, q.dir), { raw: true, w: o.w * 0.85, d: o.d * 0.95, speed: o.speed, taper: [3, 6] }, clip);
  };
  hairPen(coinM, { w: 1.4, d: 0.82, speed: 0.6 });
  for (let x = 0.24; x > -0.42; x -= 0.07) { const yb = -0.36 - 0.12 * Math.cos((x + 0.05) * 2.3); pen(coinM, [[x + 0.03, yb - 0.005], [x, yb - 0.06], [x - 0.02, yb - 0.09]], { w: 1.0, d: 0.6, taper: [4, 8] }); }
  pen(coinM, [[0.06, -0.06], [0.13, -0.045], [0.155, 0.05], [0.12, 0.15], [0.065, 0.165]], { w: 1.7, d: 0.85 });
  pen(coinM, [[0.1, -0.005], [0.125, 0.06], [0.095, 0.11]], { w: 1.1, d: 0.7 });
  pen(coinM, [[0.27, -0.045], [0.33, -0.068], [0.385, -0.04]], { w: 1.9, d: 0.92, taper: [3, 4] });
  pen(coinM, [[0.285, -0.022], [0.335, -0.012], [0.378, -0.032]], { w: 1.3, d: 0.8, taper: [3, 4] });
  dot(D, ...coinM.f([0.35, -0.038]), 2.8, { d: 0.95 });
  pen(coinM, [[0.23, -0.105], [0.33, -0.12], [0.42, -0.085]], { w: 1.5, d: 0.75 });
  pen(coinM, [[0.47, 0.17], [0.49, 0.192], [0.505, 0.186]], { w: 1.3, d: 0.8, taper: [2, 3] });
  pen(coinM, [[0.468, 0.283], [0.43, 0.29]], { w: 1.2, d: 0.75, taper: [2, 4] });
  pen(coinM, [[0.08, 0.22], [0.2, 0.37], [0.33, 0.448]], { w: 1.0, d: 0.5, taper: [10, 10] });
  // the cloak, its folds and the brooch on the shoulder
  pen(coinM, shB, { w: 1.7, d: 0.8 });
  pen(coinM, shF, { w: 2.2, d: 0.9 });
  pen(coinM, trunc, { w: 2.2, d: 0.9 });
  pen(coinM, neckline, { w: 1.6, d: 0.82 });
  for (const f of folds) pen(coinM, f, { w: 1.4, d: 0.78, taper: [6, 14] });
  pen(coinM, arcPts(BR[0], BR[1], 0.045, 0, TAU * 1.05, { step: 0.005 }), { raw: true, w: 1.6, d: 0.9, taper: [2, 2] });
  dot(D, ...coinM.f(BR), 2.6);
  // the rays already on the coin (the back ones); the front ones go in at the cut
  const rayPen = (M, r, o, clip) => pen(M, [r.b1, r.tip, r.b2], { raw: true, taper: [3, 3], ...o }, clip);
  for (let i = 3; i < rays.length; i++) rayPen(coinM, rays[i], { w: 1.9, d: 0.9, speed: 0.6 });
  // relief shading: the front of the face and neck turned from the light, under the jaw, the eye socket,
  // the hair toward the nape, the cloak's folds and its far side
  shadeH(coinM, (x, y) => {
    if (!inP(headPoly, x, y) || inP(hairPoly, x, y)) return 0;
    let v = 0.8 * Math.exp(-dFront(x, y) / 0.018) * sm(0.36, 0.5, y);              // the throat turning away
    if (y > 0.46 && x > -0.2) v += 0.9 * sm(0.6, 0.48, y);                         // the jaw's shadow on the neck
    v += 0.75 * Math.exp(-(((x - 0.34) / 0.06) ** 2) - (((y + 0.07) / 0.04) ** 2)); // the eye socket under the brow
    return Math.min(1, v);
  }, [-0.35, -0.4, 0.56, 0.72]);
  shadeH(coinM, (x, y) => (inP(hairPoly, x, y) ? 0.2 + 0.45 * sm(-0.2, 0.4, y) + 0.3 * sm(-0.3, -0.48, x) : 0), [-0.55, -0.45, 0.35, 0.46], { sp: 3.4, d: 0.5 });
  shadeH(coinM, (x, y) => {
    if (!inP(cloakPoly, x, y)) return 0;
    let v = 0.2 + 0.45 * sm(-0.3, 0.6, x) + 0.7 * Math.exp(-Math.max(0, y - necklineY(x)) / 0.04);
    for (const f of folds) { const s = spline(f, 0.02); for (const p of s) { const dy = y - p[1], dx = x - p[0]; if (dy > 0 && dy < 0.05 && Math.abs(dx) < 0.012) v += 0.45 * (1 - dy / 0.05); } }
    return Math.min(1, v);
  }, [-0.62, 0.64, 0.6, 0.96], { sp: 3.0, d: 0.6 });
  for (let i = 3; i < rays.length; i++) {
    const r = rays[i];
    shadeH(coinM, (x, y) => (inP(r.tri, x, y) && r.sgn * ((x - r.base[0]) * r.n[0] + (y - r.base[1]) * r.n[1]) > 0.004 ? 0.8 : 0), r.tri.bb, { sp: 2.4, d: 0.7, angle: Math.atan2(r.d[1], r.d[0]) + 0.5 });
  }

  // ---- the lens over the crown: its rim, the circle marking the detail on the coin, the tangents joining them
  const rm = (RI / K) * 1.0;
  circleStroke(D, P0[0], P0[1], rm, { w: 1.1, d: 0.6, speed: 0.8, wob: 0.2 * PX });
  {
    const dv = [I[0] - P0[0], I[1] - P0[1]], L = Math.hypot(dv[0], dv[1]), u = [dv[0] / L, dv[1] / L], n = [-u[1], u[0]];
    const sg = (rm - RI) / L, cg = Math.sqrt(1 - sg * sg);
    for (const s of [1, -1]) {
      const m = [n[0] * cg * s + u[0] * sg, n[1] * cg * s + u[1] * sg];
      const a = add(P0, m, rm), b = add(I, m, RI);
      D.stroke(linePts(a[0], a[1], b[0], b[1], { wob: 0.15 * PX, seed: s + 4 }), { w: 1.0, d: 0.55, speed: 1.4, taper: [8, 8] });
    }
  }
  circleStroke(D, I[0], I[1], RI, { w: 2.4, d: 0.92, speed: 1.0, sweep: TAU * 1.02, wob: 0.2 * PX });
  circleStroke(D, I[0], I[1], RI + 0.007, { w: 1.2, d: 0.7, speed: 1.0, sweep: TAU * 1.01, wob: 0.2 * PX });
  // in the lens, already: the fillet with its pearls, the hair under it, the line of the skull
  pen(magM, bandHi, { raw: true, w: 2.4, d: 0.9 }, outLens); pen(magM, bandLo, { raw: true, w: 2.4, d: 0.9 }, outLens);
  for (let i = 2; i < bandC.length - 1; i += 3) { const p = magM.f(bandC[i]); if (!outLens(p[0], p[1])) circleStroke(D, p[0], p[1], 0.0045, { w: 1.4, d: 0.88, speed: 0.2, sweep: TAU * 1.1 }); }
  pen(magM, skull, { w: 1.6, d: 0.7 }, outLens);
  pen(magM, face.slice(0, 5), { w: 2.2, d: 0.9 }, outLens);
  hairPen(magM, { w: 2.0, d: 0.82, speed: 1.2 }, outLens);
  shadeH(magM, (x, y) => (inP(hairPoly, x, y) ? 0.3 + 0.4 * sm(-0.4, -0.15, y) : 0), [-0.3, -0.9, 0.55, -0.1], { sp: 3.4, d: 0.5 }, outLens);
  shadeH(magM, (x, y) => {
    let best = 9, side = 0;
    for (let i = 0; i < bandC.length; i++) { const d2 = (bandC[i][0] - x) ** 2 + (bandC[i][1] - y) ** 2; if (d2 < best) { best = d2; side = i; } }
    const p = bandC[side], q = bandC[Math.min(bandC.length - 1, side + 1)], t = nrm([q[0] - p[0], q[1] - p[1]]);
    const off = (x - p[0]) * t[1] - (y - p[1]) * t[0];                 // > 0 toward the top of the head
    return Math.abs(off) < 0.03 ? 0.35 + 0.55 * sm(0.0, -0.03, off) : 0;
  }, [-0.3, -0.62, 0.45, -0.25], { sp: 2.6, d: 0.6 }, outLens);
  scriptBlock(D, ['la medaglia del sole invitto', 'col capo coronato di razzi'], -0.02, -0.405, { size: 18, lh: 24, d: 0.55 });
  scriptBlock(D, ['nasce nel dì più breve'], 0.2, 0.385, { size: 18, d: 0.5 });
  D.text('a', P0[0] - rm - 0.008, P0[1] - 0.012, { size: 20, d: 0.7 });
  D.text('a', I[0] - RI - 0.012, I[1] + 0.03, { size: 20, d: 0.7 });
  D.fitTo(0, -16, -0.42);

  // ---- just before and into the cut: the front rays go in on the coin
  D.at(-0.36);
  const f0 = D.mark();
  for (let i = 2; i >= 0; i--) rayPen(coinM, rays[i], { w: 2.1, d: 0.92, speed: 0.6, wet: true });
  for (let i = 0; i < 3; i++) {
    const r = rays[i];
    shadeH(coinM, (x, y) => (inP(r.tri, x, y) && r.sgn * ((x - r.base[0]) * r.n[0] + (y - r.base[1]) * r.n[1]) > 0.004 ? 0.8 : 0), r.tri.bb, { sp: 2.4, d: 0.7, angle: Math.atan2(r.d[1], r.d[0]) + 0.5, wet: true });
  }
  D.fitTo(f0, -0.36, 0.06);

  // ---- during the cut: the great rays of the detail, each in one stroke up a flank and down the other
  const big = rays.map((r, i) => ({ r, i })).filter(({ r }) => {
    const m = magM.f(r.base); return Math.hypot(m[0] - I[0], m[1] - I[1]) < RI * 1.15;
  });
  let tr = 0.04;
  for (const { r } of big) {
    const pts = [r.b1, r.tip, r.b2].map(magM.f);
    timedStroke(D, resample(pts, 1.2 * PX), [outLens], { w: 3.6, d: 0.95, t0: tr, dur: 0.11, taper: [3, 3], press: 0.15, nib: 0.4, wet: true, gap: 0 });
    timedStroke(D, resample([r.base, add(r.base, r.d, r.L * 0.9)].map(magM.f), 1.2 * PX), [outLens], { w: 1.2, d: 0.7, t0: tr + 0.08, dur: 0.06, taper: [4, 12], wet: true, gap: 0 });
    tr += 0.1;
  }
  // then the shadowed flank of each great ray, hatched dark across its ridge
  D.at(Math.max(0.3, tr - 0.02));
  const h0 = D.mark();
  for (const { r } of big) {
    shadeH(magM, (x, y) => {
      if (!inP(r.tri, x, y)) return 0;
      const s = r.sgn * ((x - r.base[0]) * r.n[0] + (y - r.base[1]) * r.n[1]);
      return s > 0.002 ? 0.75 + 0.3 * sm(0.0, 0.03, s) : 0.0;
    }, r.tri.bb, { sp: 2.6, w: 1.25, d: 0.82, angle: Math.atan2(r.d[1], r.d[0]) + 0.55, maxLen: 40, wet: true, speed: 3.2 }, outLens);
  }
  D.fitTo(h0, Math.max(0.3, tr - 0.02), 0.74);
  return D;
}

// ==== F30.3 (Sol cut): the winter solstice ===========================================================
// The sphere as a cosmographer prints it: a graduated meridian ring, the horizon ruled straight across, and
// above it the sun's three daily circles, each cut by the horizon: the summer arc high and long, the
// equinoctial half above and half below, the winter circle (the tropic of Capricorn) almost wholly sunk,
// its day a low short arc. Hour ticks on each arc; the night under the horizon hatched; the tropic's
// hidden part dotted and lettered. The sun-face sits at the lowest noon with BRUMA under it; at the cut its
// rays flare, and the low winter arc is swept last.
export function solstice() {
  const D = new Drawing(3037);
  const O = [0.0, 0.035], RS = 0.3;
  const Pp = (u, v) => [O[0] + u * RS, O[1] - v * RS];                // sphere units, v up
  // a daily circle through the horizon at +-a and culminating at b (sphere units): centre, radius, the page
  // angles of its rising and setting points (the day runs clockwise on screen from aL up to aR)
  const daily = (a, b, hours) => {
    const y0 = (b * b - a * a) / (2 * b);
    return { a, b, hours, c: Pp(0, y0), r: (b - y0) * RS, aL: Math.atan2(y0, -a), aR: Math.atan2(y0, a) };
  };
  const SUM = daily(0.88, 0.8, 15), EQ = daily(0.7, 0.56, 12), WIN = daily(0.44, 0.29, 9);
  const S = Pp(0, WIN.b), SR = 0.029;                                // the sun at the lowest noon
  const ticks = (A, o = {}) => {
    for (let i = 0; i <= A.hours; i++) {
      const a = A.aL + ((A.aR - A.aL) * i) / A.hours, l = i % 3 === 0 ? 0.016 : 0.01;
      const p = [A.c[0] + Math.cos(a) * A.r, A.c[1] + Math.sin(a) * A.r], q = [A.c[0] + Math.cos(a) * (A.r + l), A.c[1] + Math.sin(a) * (A.r + l)];
      if (o.skip && o.skip(p)) continue;
      D.stroke(linePts(p[0], p[1], q[0], q[1]), { w: o.w ?? 1.3, d: o.d ?? 0.8, speed: 0.4, taper: [2, 3], t0: o.tAt ? o.tAt(i / A.hours) : undefined, dur: o.tAt ? 0.02 : undefined, gap: o.tAt ? 0 : undefined });
    }
  };
  const dotted = (A, a0, a1, o = {}) => {
    const n = Math.max(2, Math.round((Math.abs(a1 - a0) * A.r) / (o.pitch ?? 0.011)));
    for (let i = 0; i < n; i++) {
      const u0 = (i + 0.15) / n, u1 = (i + 0.6) / n;
      D.stroke(arcPts(A.c[0], A.c[1], A.r, a0 + (a1 - a0) * u0, a0 + (a1 - a0) * u1, { step: 1 * PX }), { w: o.w ?? 1.4, d: (o.d ?? 0.75) * (o.fade ? 1 - 0.85 * (i / n) : 1), speed: 0.5, taper: [2, 2] });
    }
  };

  D.at(-16);
  // the graduated ring: two compass circles, degrees between them
  D.stroke(arcPts(O[0], O[1], RS, 0, TAU, { step: 3 * PX }), { kind: 'relief', w: 1.3, d: 0.5, speed: 3, wet: false, taper: [2, 2] });
  circleStroke(D, O[0], O[1], RS, { w: 2.4, d: 0.9, speed: 1.2, sweep: TAU * 1.02, wob: 0.2 * PX, a0: -2.0 });
  circleStroke(D, O[0], O[1], RS + 0.014, { w: 1.4, d: 0.78, speed: 1.2, sweep: TAU * 1.02, wob: 0.2 * PX, a0: 1.0 });
  for (let k = 0; k < 72; k++) {
    const a = (k / 72) * TAU, l = k % 6 === 0 ? 0.014 : 0.007;
    D.stroke(linePts(O[0] + Math.cos(a) * RS, O[1] + Math.sin(a) * RS, O[0] + Math.cos(a) * (RS + l), O[1] + Math.sin(a) * (RS + l)), { w: k % 6 === 0 ? 1.3 : 0.9, d: 0.75, speed: 0.4, taper: [2, 2] });
  }
  // the horizon, ruled across the page; the night under it hatched within the sphere
  D.stroke(linePts(-0.37, O[1], 0.37, O[1], { step: 3 * PX }), { kind: 'relief', w: 1.5, d: 0.55, speed: 3, wet: false, taper: [2, 2] });
  D.stroke(linePts(-0.36, O[1] + 0.3 * PX, 0.36, O[1] - 0.3 * PX, { wob: 0.2 * PX, seed: 7 }), { w: 3.0, d: 0.94, speed: 1.0, taper: [10, 10], press: 0.15 });
  D.stroke(linePts(-0.345, O[1] + 0.0055, 0.345, O[1] + 0.0052, { wob: 0.3 * PX, seed: 8 }), { w: 1.0, d: 0.5, speed: 1.4, taper: [20, 20] });
  // BRUMA's cartouche, kept clear of the hatching
  const bw = textW('BRUMA', 50) * 1.08, BX = [-bw / 2 - 0.018, O[1] + 0.03, bw / 2 + 0.018, O[1] + 0.098];
  const inBox = (x, y) => x > BX[0] - 0.004 && x < BX[2] + 0.004 && y > BX[1] - 0.004 && y < BX[3] + 0.004;
  hatch(D, (x, y) => {
    const r = Math.hypot(x - O[0], y - O[1]);
    if (y < O[1] + 0.009 || r > RS - 0.004 || inBox(x, y)) return 0;
    return 0.32 + 0.5 * sm(0.0, RS, y - O[1]);
  }, [-RS, O[1], RS, O[1] + RS], { angle: 0.0, sp: 4.4, w: 1.0, d: 0.4, maxLen: 90, jit: 0.15, speed: 3, gap: 0.003, thr: [0.25, 0.9], bow: 0.01 });
  // the summer and the equinoctial days: firm arcs with their hours; their nights begin dotted under the horizon
  for (const A of [SUM, EQ]) {
    D.stroke(arcPts(A.c[0], A.c[1], A.r, A.aL, A.aR, { step: 1.6 * PX, wob: 0.2 * PX, seed: 11 }), { w: 2.2, d: 0.88, speed: 0.9, taper: [6, 6] });
    ticks(A);
    dotted(A, A.aR + 0.03, A.aR + 0.55, { fade: true });
    dotted(A, A.aL - 0.03, A.aL - 0.55, { fade: true });
    const e = [A.c[0] + Math.cos(A.aR - 0.06) * A.r, A.c[1] + Math.sin(A.aR - 0.06) * A.r];
    arrowHead(D, e, [-Math.sin(A.aR - 0.06), Math.cos(A.aR - 0.06)], 0.018, { w: 1.6, d: 0.85 });
    // the sun's mark at its noon
    const n = Pp(0, A.b);
    circleStroke(D, n[0], n[1], 0.012, { w: 1.4, d: 0.85, speed: 0.3 });
    dot(D, n[0], n[1], 2.4);
  }
  // the winter circle under the horizon: the tropic of Capricorn, dotted, lettered along its foot
  dotted(WIN, WIN.aR + 0.02, WIN.aL + TAU - 0.02, { pitch: 0.01, w: 1.6, d: 0.82 });
  arcCaps(D, 'TROPICVS CAPRICORNI', WIN.c, WIN.r + 0.026, Math.PI / 2, { size: 19, dir: -1, track: 0.12, d: 0.72 });
  // its day ruled blind with the stylus, waiting for the pen
  D.stroke(arcPts(WIN.c[0], WIN.c[1], WIN.r, WIN.aL, WIN.aR, { step: 3 * PX }), { kind: 'relief', w: 1.5, d: 0.55, speed: 3, wet: false, taper: [2, 2] });
  // labels and notes
  arcCaps(D, 'AESTAS', SUM.c, SUM.r + 0.02, -Math.PI / 2 - 0.62, { size: 17, track: 0.12, d: 0.66 });
  arcCaps(D, 'AEQVINOCTIVM', EQ.c, EQ.r + 0.02, -Math.PI / 2 - 0.62, { size: 15, track: 0.08, d: 0.62 });
  caps(D, 'ZENIT', -textW('ZENIT', 15) / 2, O[1] - RS - 0.022, { size: 15, d: 0.62 });
  scriptBlock(D, ['nella bruma il sole', 'fa il minore arco', 'e poi ritorna invitto'], 0.3, -0.395, { size: 18, lh: 24, d: 0.55 });
  scriptBlock(D, ['il dì più breve dell’anno'], 0.27, 0.41, { size: 18, d: 0.5 });
  // the cartouche
  D.stroke(resample([[BX[0], BX[1]], [BX[2], BX[1]], [BX[2], BX[3]], [BX[0], BX[3]], [BX[0], BX[1]]], 1.2 * PX), { w: 1.4, d: 0.8, speed: 0.8, taper: [3, 3] });
  D.fitTo(0, -16, -0.42);

  // ---- just before the cut: the sun-face at the lowest noon
  D.at(-0.4);
  const s0 = D.mark();
  circleStroke(D, S[0], S[1], SR, { w: 2.8, d: 0.94, speed: 0.5, sweep: TAU * 1.03, wet: true, a0: -2.4 });
  const fp = (x, y) => [S[0] + x * SR, S[1] + y * SR];
  for (const sx of [-1, 1]) {
    D.stroke(spline([fp(sx * 0.62, -0.2), fp(sx * 0.38, -0.32), fp(sx * 0.14, -0.22)], 1 * PX), { w: 1.5, d: 0.9, speed: 0.2, taper: [2, 3], wet: true });   // brow
    D.stroke(spline([fp(sx * 0.58, -0.06), fp(sx * 0.38, -0.14), fp(sx * 0.18, -0.06)], 1 * PX), { w: 1.4, d: 0.9, speed: 0.2, taper: [2, 3], wet: true });   // lid
    dot(D, ...fp(sx * 0.38, -0.05), 2.4, { wet: true });
    D.stroke(spline([fp(sx * 0.62, 0.22), fp(sx * 0.52, 0.32), fp(sx * 0.4, 0.3)], 1 * PX), { w: 1.0, d: 0.6, speed: 0.2, taper: [2, 3], wet: true });          // cheek
  }
  D.stroke(spline([fp(0.02, -0.12), fp(0.06, 0.12), fp(-0.06, 0.2)], 1 * PX), { w: 1.3, d: 0.85, speed: 0.2, taper: [2, 3], wet: true });                    // nose
  D.stroke(spline([fp(-0.34, 0.42), fp(0, 0.5), fp(0.34, 0.42)], 1 * PX), { w: 1.5, d: 0.88, speed: 0.2, taper: [2, 3], wet: true });                       // mouth
  hatch(D, (x, y) => { const dx = (x - S[0]) / SR, dy = (y - S[1]) / SR, r = Math.hypot(dx, dy); return r > 0.9 ? 0 : 0.2 + 0.7 * sm(0.3, 0.9, r) * sm(-0.6, 0.8, dx * 0.6 + dy * 0.8); }, [S[0] - SR, S[1] - SR, S[0] + SR, S[1] + SR], { angle: 0.95, sp: 2.4, w: 0.9, d: 0.6, speed: 3, minLen: 1.5, gap: 0.002, thr: [0.3, 0.9], wet: true });
  caps(D, 'BRUMA', -bw / 2, O[1] + 0.083, { size: 50, d: 0.95 });
  D.fitTo(s0, -0.4, -0.04);

  // ---- at the cut: the rays flare round the face, straight and waved by turns
  D.at(0.0);
  const r0 = D.mark();
  for (let k = 0; k < 16; k++) {
    const a = -Math.PI / 2 + (k / 16) * TAU, d = [Math.cos(a), Math.sin(a)], n = [-d[1], d[0]];
    const ri = SR + 0.007;
    if (k % 2 === 0) {
      const ro = SR + 0.036, hw = 0.0072;
      const pts = [add(add(S, d, ri), n, hw), add(S, d, ro), add(add(S, d, ri), n, -hw)];
      D.stroke(resample(pts, 1 * PX), { w: 1.9, d: 0.94, dur: 0.035, taper: [2, 2], gap: 0, wet: true });
    } else {
      const ro = SR + 0.022;
      D.stroke(linePts(...add(S, d, ri), ...add(S, d, ro)), { w: 2.0, d: 0.92, dur: 0.025, taper: [2, 6], gap: 0, wet: true });
    }
  }
  D.fitTo(r0, 0.0, 0.2);

  // ---- last: the low winter arc swept bold from the eastern horizon to the western, lifting behind the sun,
  // its hours ticked as the pen passes, an arrow at its setting
  const behindSun = (x, y) => Math.hypot(x - S[0], y - S[1]) < SR + 0.006;
  const wa = timedStroke(D, arcPts(WIN.c[0], WIN.c[1], WIN.r, WIN.aL, WIN.aR, { step: 1.6 * PX, wob: 0.25 * PX, seed: 41 }), [behindSun], { w: 5.4, d: 0.97, t0: 0.3, dur: 0.38, taper: [6, 10], press: 0.2, nib: 0.45, load: 0.12, wet: true });
  timedStroke(D, arcPts(WIN.c[0], WIN.c[1], WIN.r - 0.0075, WIN.aL + 0.05, WIN.aR - 0.05, { step: 1.6 * PX, wob: 0.2 * PX, seed: 43 }), [behindSun], { w: 1.3, d: 0.8, t0: 0.34, dur: 0.36, taper: [10, 10], press: 0.2, wet: true });
  ticks(WIN, { w: 1.8, d: 0.9, tAt: (q) => penTime(wa, Math.min(1, q + 0.02)), skip: (p) => behindSun(p[0], p[1]) });
  const ae = WIN.aR - 0.08, ep = [WIN.c[0] + Math.cos(ae) * WIN.r, WIN.c[1] + Math.sin(ae) * WIN.r];
  arrowHead(D, ep, [-Math.sin(ae), Math.cos(ae)], 0.024, { w: 2.8, d: 0.94, t0: 0.68, dur: 0.03 });
  return D;
}
