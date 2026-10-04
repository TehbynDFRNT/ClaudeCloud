// F30.3: the CNO cycle as a natural philosopher's notebook page (scene 'studies', drawing 'cno').
// Six nuclei sit on a compass wheel as solid balls resting on the page, modelled with the pen under one light
// from the upper left: a straight '\' hatch for the half-tone, curved strokes wrapping the shadow side,
// cross-hatching in the core of the shadow, the rim lifted by reflected light, the highlight left bare, and
// each ball throwing its shadow down-right onto the sheet. Protons fly in on curved paths, the positrons
// leave in wavering trails, and the helium nucleus (four balls in a clump) is cast off into the hub.
// During the shot the pen runs the arrows round the wheel, counter-clockwise on screen.
import { Drawing, PX, TAU, arcPts, linePts, resample, spline, fnoise, clamp01 } from './studies-ink.js';

const sm = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
// the light: from the upper left and above the sheet (page x right, y down, z toward the viewer)
const LV = (() => { const v = [-0.52, -0.66, 1.0], n = Math.hypot(...v); return v.map((c) => c / n); })();
const LH = Math.hypot(LV[0], LV[1]);
const SD = [-LV[0] / LH, -LV[1] / LH];                 // the direction the shadows fall on the page
const COT_E = LH / LV[2], SIN_E = LV[2];               // light elevation

// split one dense polyline into the runs where val > th, each run into hand-length strokes
function strokeRuns(D, pts, val, th, o) {
  const minLen = (o.minLen ?? 4) * PX, maxLen = (o.maxLen ?? 30) * PX;
  let run = null;
  const flush = () => {
    if (!run || run.length < 3) { run = null; return; }
    const r = resample(run, 1.2 * PX);
    const L = (r.length - 1) * 1.2 * PX;
    if (L >= minLen) {
      const pieces = Math.max(1, Math.round(L / maxLen + D.r(-0.3, 0.3)));
      for (let q = 0; q < pieces; q++) {
        let a = q / pieces, b = (q + 1) / pieces;
        a += D.r(-0.01, o.shA ?? 0.08) / pieces; b -= D.r(-0.01, o.shB ?? 0.12) / pieces;
        const i0 = Math.max(0, Math.floor(a * (r.length - 1))), i1 = Math.min(r.length - 1, Math.ceil(b * (r.length - 1)));
        if ((i1 - i0) * 1.2 * PX < minLen) continue;
        let seg = r.slice(i0, i1 + 1);
        // the nib lands in the dark and flicks off toward the light, so each stroke fades where the tone does
        const e0 = seg[0], e1 = seg[seg.length - 1];
        if (val(e0[0], e0[1]) < val(e1[0], e1[1]) - 0.04) seg = seg.reverse();
        const Ls = (seg.length - 1) * 1.2 * PX, LP = Ls / PX;
        D.stroke(seg, {
          kind: 'ink', w: (o.w ?? 1.0) * D.r(0.8, 1.18), d: (o.d ?? 0.6) * D.r(0.78, 1.1), speed: o.speed ?? 2.4,
          taper: [Math.min(o.tin ?? 3, LP * 0.2), Math.min(o.tout ?? 22, LP * 0.75)], press: 0.2, pfreq: 14, load: 0.1, gap: 0.004, wet: false, nib: o.nib ?? 0.25,
        });
      }
    }
    run = null;
  };
  for (const p of pts) {
    if (val(p[0], p[1]) > th) (run || (run = [])).push(p); else flush();
  }
  flush();
}

// parallel straight hatching of a scalar field over a box; each line its own threshold
function lineHatch(D, val, bb, o) {
  const ang = o.angle, ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux;
  const sp = o.sp * PX, cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2;
  const R = Math.hypot(bb[2] - bb[0], bb[3] - bb[1]) / 2 + sp;
  for (let k = -R; k <= R; k += sp) {
    const kk = k + (D.rnd() - 0.5) * sp * 0.4;
    const th = o.thr[0] + (o.thr[1] - o.thr[0]) * D.rnd();
    const bow = (D.rnd() - 0.3) * 0.5 * PX;
    const pts = [];
    for (let t = -R; t <= R; t += 1.2 * PX) {
      const u = (t + R) / (2 * R), b = bow * Math.sin(u * Math.PI) * 4;
      pts.push([cx + nx * (kk + b) + ux * t, cy + ny * (kk + b) + uy * t]);
    }
    strokeRuns(D, pts, val, th, o);
  }
}

// curved hatching: arcs about a centre (they wrap round the ball's turning form)
function arcHatch(D, val, c, r0, r1, o) {
  const sp = o.sp * PX;
  for (let r = r0; r <= r1; r += sp) {
    const rr = r + (D.rnd() - 0.5) * sp * 0.35;
    const th = o.thr[0] + (o.thr[1] - o.thr[0]) * D.rnd();
    const a0 = o.a0 ?? 0;
    const pts = arcPts(c[0], c[1], rr, a0, a0 + TAU, { step: 1.2 * PX, ry: rr * (o.sq ?? 1), rot: o.rot ?? 0, wob: 0.5 * PX, seed: D.n });
    strokeRuns(D, pts, val, th, o);
  }
}

// a ball resting on the page. occ: discs [x, y, r] in front of it (hide its contour and hatching)
function ball(D, c, r, o = {}) {
  const occ = o.occ || [], k = o.k ?? 1;
  const hid = (x, y, pad = 0) => occ.some(([ox, oy, orr]) => (x - ox) ** 2 + (y - oy) ** 2 < (orr + pad) ** 2);
  const tone = (x, y) => {
    const dx = (x - c[0]) / r, dy = (y - c[1]) / r, q = dx * dx + dy * dy;
    if (q >= 0.985 || hid(x, y, 1.0 * PX)) return 0;
    const rho = Math.sqrt(q), nz = Math.sqrt(1 - q);
    const lam = dx * LV[0] + dy * LV[1] + nz * LV[2];
    let t = clamp01((0.86 - lam) / 1.0);
    t -= 0.38 * sm(0.74, 0.99, rho) * sm(0.0, -0.5, lam);          // reflected light lifts the rim
    t += 0.07 * fnoise(x * 900 + y * 400, 5);
    return clamp01(t);
  };
  const bb = [c[0] - r, c[1] - r, c[0] + r, c[1] + r];
  // half-tone: straight left-handed hatching, then strokes wrapping the shadow side, then the core cross-hatch
  lineHatch(D, tone, bb, { angle: 0.98, sp: 5.0 * k, thr: [0.07, 0.18], w: 0.6 * k, d: 0.42, maxLen: 22 * k, tin: 6, tout: 30 });   // the faint turn into the light
  lineHatch(D, tone, bb, { angle: 0.98, sp: 2.5 * k, thr: [0.16, 0.42], w: 0.9 * k, d: 0.7, maxLen: 30 * k, tin: 2, tout: 30 });
  const hl = [c[0] + LV[0] * r * 0.62, c[1] + LV[1] * r * 0.62];
  arcHatch(D, (x, y) => tone(x, y), hl, r * 0.55, r * 1.62, { sp: 3.0 * k, thr: [0.42, 0.66], w: 0.95 * k, d: 0.72, maxLen: 26 * k, a0: Math.atan2(SD[1], SD[0]) + Math.PI });
  lineHatch(D, tone, bb, { angle: -0.42, sp: 3.2 * k, thr: [0.6, 0.78], w: 0.9 * k, d: 0.68, maxLen: 18 * k, tin: 3, tout: 10 });
  if (k > 0.6) lineHatch(D, tone, bb, { angle: 0.35, sp: 3.6 * k, thr: [0.76, 0.88], w: 0.85 * k, d: 0.62, maxLen: 12 * k, tin: 3, tout: 8 });
  // the contour: firm and dark where the ball turns from the light and sits down on the page, thin and broken
  // where the light strikes it, with a second searching line here and there
  const aS = Math.atan2(SD[1], SD[0]);
  const run = (a0, a1, rr, op) => {
    const pts = arcPts(c[0], c[1], rr, a0, a1, { step: 1.2 * PX, wob: 0.5 * PX, seed: D.n + 11 });
    let cur = [];
    const out = [];
    for (const p of pts) { if (hid(p[0], p[1], 0.8 * PX)) { if (cur.length > 2) out.push(cur); cur = []; } else cur.push(p); }
    if (cur.length > 2) out.push(cur);
    for (const s of out) D.stroke(s, { press: 0.3, pfreq: 10, nib: 0.35, wet: false, ...op });
  };
  const j = D.r(-0.2, 0.2);
  run(aS - 1.75 + j, aS + 1.85 + j, r, { w: 2.5 * k, d: 0.92, speed: 0.5, taper: [14, 18], pool: 0.4 });
  run(aS - 0.9 + j, aS + 0.95 + j, r * 1.012, { w: 1.6 * k, d: 0.8, speed: 0.5, taper: [20, 20] });   // the weight at the bottom
  run(aS + 1.6 + j, aS + Math.PI - 0.25 + D.r(-0.1, 0.1), r * 0.998, { w: 1.15 * k, d: 0.7, speed: 0.6, taper: [6, 26] });
  run(aS + Math.PI + 0.2 + D.r(-0.1, 0.1), aS + TAU - 1.6 + j, r * 0.998, { w: 1.1 * k, d: 0.66, speed: 0.6, taper: [26, 8] });
  if (k > 0.6) run(aS + 0.4, aS + 2.4, r * D.r(1.02, 1.035), { w: 0.8, d: 0.34, speed: 0.8, taper: [20, 20] });  // a pentimento
  return [c[0], c[1], r];
}

// the shadows a set of balls throw on the sheet: a dark seat at the contact, softening as it runs out
function castShadow(D, balls, o = {}) {
  const k = o.k ?? 1;
  const val = (x, y) => {
    let v = 0;
    for (const [bx, by, br] of balls) {
      const dx = x - bx, dy = y - by;
      if (dx * dx + dy * dy < (br + 1.2 * PX) ** 2) return 0;
    }
    for (const [bx, by, br] of balls) {
      const dx = x - bx, dy = y - by;
      const u = dx * SD[0] + dy * SD[1], w = -dx * SD[1] + dy * SD[0];
      const d0 = br * COT_E, a = br / SIN_E;
      const q = ((u - d0) / a) ** 2 + (w / br) ** 2;
      if (q > 1.25) continue;
      const along = clamp01((u + br) / (d0 + a + br));
      const edge = sm(1.2, 0.55, q);
      const seat = Math.exp(-Math.max(0, Math.hypot(dx, dy) - br) / (0.22 * br));
      v = Math.max(v, edge * (0.92 - 0.42 * along) + 0.3 * seat * sm(-0.3, 0.3, u / br));
    }
    return clamp01(v + 0.05 * fnoise(x * 700 - y * 500, 9));
  };
  let x0 = 9, y0 = 9, x1 = -9, y1 = -9;
  for (const [bx, by, br] of balls) {
    const e = br * (COT_E + 1 / SIN_E) + br;
    x0 = Math.min(x0, bx - br); y0 = Math.min(y0, by - br); x1 = Math.max(x1, bx + SD[0] * e + br); y1 = Math.max(y1, by + SD[1] * e + br);
  }
  const bb = [x0, y0, x1, y1];
  lineHatch(D, val, bb, { angle: 0.74, sp: 2.6 * k, thr: [0.14, 0.46], w: 0.95 * k, d: 0.6, maxLen: 24 * k, tin: 2, tout: 24 });
  lineHatch(D, val, bb, { angle: -0.15, sp: 3.0 * k, thr: [0.6, 0.86], w: 0.85 * k, d: 0.55, maxLen: 11 * k, tin: 2, tout: 9 });
}

// the runs of a polyline outside every disc [x, y, r]
function clipDiscs(pts, discs) {
  const out = [];
  let cur = [];
  for (const p of pts) {
    if (discs.some(([x, y, r]) => (p[0] - x) ** 2 + (p[1] - y) ** 2 < r * r)) { if (cur.length > 2) out.push(cur); cur = []; } else cur.push(p);
  }
  if (cur.length > 2) out.push(cur);
  return out;
}

// a hand-drawn arrowhead: one movement, barb - point - barb
function arrowHead(D, tip, dir, sz, o = {}) {
  const [tx, ty] = dir, nx = -ty, ny = tx;
  const b1 = [tip[0] - tx * sz + nx * sz * 0.5, tip[1] - ty * sz + ny * sz * 0.5];
  const b2 = [tip[0] - tx * sz * 0.92 - nx * sz * 0.46, tip[1] - ty * sz * 0.92 - ny * sz * 0.46];
  const m1 = [(b1[0] + tip[0]) / 2 + tx * sz * 0.08, (b1[1] + tip[1]) / 2 + ty * sz * 0.08];
  const m2 = [(b2[0] + tip[0]) / 2 + tx * sz * 0.08, (b2[1] + tip[1]) / 2 + ty * sz * 0.08];
  const pts = spline([b1, m1, tip, m2, b2], 1.0 * PX);
  return D.stroke(pts, { w: 1.7, d: 0.9, taper: [6, 10], press: 0.2, nib: 0.4, pool: 0.3, ...o });
}

export function cnoStudy(o = {}) {
  const V = !!o.vertical;
  const D = new Drawing(3033);
  const C = [0.02, 0.0], R = 0.2;
  const names = [['C', '12', 'carbone'], ['N', '13', 'azoto'], ['C', '13', 'carbone'], ['N', '14', 'azoto'], ['O', '15', 'ossigeno'], ['N', '15', 'azoto']];
  const st = names.map((nm, i) => {
    const a = -Math.PI / 2 - (i / 6) * TAU;                      // counter-clockwise on screen
    return { a, p: [C[0] + Math.cos(a) * R, C[1] + Math.sin(a) * R], r: 0.034 + 0.0012 * (+nm[1] - 12), nm };
  });
  D.at(-15);
  // ---- construction: the compass pivot, the wheel scored blind and lightly inked, faint radii to each station
  D.stroke(arcPts(C[0], C[1], 0.9 * PX, 0, TAU, { step: 0.5 * PX }), { kind: 'relief', w: 2.2, d: 0.9, speed: 0.1, wet: false });
  const discs = st.map((s) => [s.p[0], s.p[1], s.r + 1.5 * PX]);
  for (const r of clipDiscs(arcPts(C[0], C[1], R, 0, TAU, { step: 3 * PX }), discs)) D.stroke(r, { kind: 'relief', w: 1.4, d: 0.5, speed: 3, wet: false });
  for (const r of clipDiscs(arcPts(C[0], C[1], R, -0.4, -0.4 + TAU * 1.03, { step: 2 * PX }), discs)) D.stroke(r, { w: 0.75, d: 0.26, speed: 1.2, wet: false, taper: [12, 12], press: 0.3 });
  D.stroke(arcPts(C[0], C[1], R * 1.18, 2.3, 2.3 + TAU * 0.4, { step: 2 * PX }), { w: 0.7, d: 0.16, speed: 1.2, wet: false, taper: [40, 40] });
  st.forEach((s) => {
    const p0 = [C[0] + Math.cos(s.a) * 0.035, C[1] + Math.sin(s.a) * 0.035];
    const pe = [C[0] + Math.cos(s.a) * (R - s.r - 0.004), C[1] + Math.sin(s.a) * (R - s.r - 0.004)];
    D.stroke(linePts(p0[0], p0[1], pe[0], pe[1], { step: 3 * PX }), { kind: 'relief', w: 1.0, d: 0.45, speed: 3, wet: false, taper: [2, 2] });
  });
  // ---- the cast shadows first (the balls' contours then sit crisply on them), then the six nuclei
  castShadow(D, st.map((s) => [s.p[0], s.p[1], s.r]));
  st.forEach((s) => ball(D, s.p, s.r));
  // ---- the labels, set clear of the shadows: letter, weight and the name beneath
  // (each label turned off the incoming proton or outgoing positron and off the cast shadow)
  const LA = [[0.55, 0.05], [0.62, 0.054], [0.48, 0.05], [0.62, 0.046], [-1.0, 0.052], [0.5, 0.05]];
  st.forEach((s, i) => {
    const la = s.a + LA[i][0], lr = s.r + LA[i][1];
    const lp = [s.p[0] + Math.cos(la) * lr, s.p[1] + Math.sin(la) * lr];
    D.text(s.nm[0], lp[0] + 0.016, lp[1] + 0.012, { size: 27, d: 0.78 });
    D.text(s.nm[1], lp[0] + 0.038, lp[1] - 0.008, { size: 15, d: 0.62 });
    D.text(s.nm[2], lp[0] + 0.03, lp[1] + 0.036, { size: 13, d: 0.42 });
  });
  // ---- protons arriving at C12, C13, N14, N15: small balls flying in on curved paths
  const protonAt = [0, 2, 3, 5], betaAt = [1, 4];
  const pBalls = [];
  for (const i of protonAt) {
    const s = st[i], am = s.a - Math.PI / 6;
    const p0 = [C[0] + Math.cos(am) * (R + 0.13), C[1] + Math.sin(am) * (R + 0.13)];
    const tgt = [s.p[0] + Math.cos(am + 0.3) * (s.r + 0.008), s.p[1] + Math.sin(am + 0.3) * (s.r + 0.008)];
    const pr = 0.0115;
    // the flight: leaves the proton, bends in toward the nucleus
    const st0 = [p0[0] + (tgt[0] - p0[0]) * 0.17, p0[1] + (tgt[1] - p0[1]) * 0.17];
    const mid = [(st0[0] + tgt[0]) / 2, (st0[1] + tgt[1]) / 2], L = Math.hypot(tgt[0] - st0[0], tgt[1] - st0[1]);
    const nrm = [-(tgt[1] - st0[1]) / L, (tgt[0] - st0[0]) / L];
    const bend = 0.09 * L;
    const path = spline([st0, [mid[0] + nrm[0] * bend, mid[1] + nrm[1] * bend], tgt], 1.2 * PX).map((p, k, a) => {
      const u = k / (a.length - 1), wv = fnoise(u * 9, i + 70) * 0.9 * PX;
      return [p[0] + nrm[0] * wv, p[1] + nrm[1] * wv];
    });
    D.stroke(path, { w: 1.45, d: 0.78, speed: 0.6, taper: [12, 6], press: 0.3, nib: 0.4, wet: false });
    const e = path[path.length - 1], q = path[path.length - 8];
    const td = [e[0] - q[0], e[1] - q[1]], tl = Math.hypot(...td);
    arrowHead(D, e, [td[0] / tl, td[1] / tl], 0.0115, { w: 1.3, d: 0.8, wet: false });
    // speed strokes behind the proton
    for (let m = -1; m <= 1; m++) {
      const bx = p0[0] - (st0[0] - p0[0]) * 0.9 + nrm[0] * m * 0.006, by = p0[1] - (st0[1] - p0[1]) * 0.9 + nrm[1] * m * 0.006;
      const ex = p0[0] - (st0[0] - p0[0]) * 0.35 + nrm[0] * m * 0.005, ey = p0[1] - (st0[1] - p0[1]) * 0.35 + nrm[1] * m * 0.005;
      D.stroke(linePts(bx, by, ex, ey, { wob: 0.3 * PX, seed: i * 3 + m }), { w: 0.8, d: 0.4, speed: 1.5, taper: [20, 4], wet: false });
    }
    pBalls.push([p0[0], p0[1], pr]);
    D.text('p', p0[0] - 0.012, p0[1] + 0.03, { size: 15, d: 0.5 });
  }
  castShadow(D, pBalls, { k: 0.7 });
  pBalls.forEach((b) => ball(D, [b[0], b[1]], b[2], { k: 0.6 }));
  // ---- positrons leaving N13 and O15: a little open ring flung out on a wavering trail
  for (const i of betaAt) {
    const s = st[i], am = s.a - Math.PI / 6;
    const len = V ? 0.05 : 0.09;
    const pts = [];
    for (let k = 0; k <= 90; k++) {
      const u = k / 90, r = R + 0.046 + u * len;
      const amp = 0.05 * (1 - 0.55 * u) * sm(0, 0.15, u);
      const aa = am + amp * Math.sin(u * 19 + 0.4) * (R / r) + 0.04 * u;
      pts.push([C[0] + Math.cos(aa) * r, C[1] + Math.sin(aa) * r]);
    }
    D.stroke(resample(pts, 1.2 * PX), { w: 1.35, d: 0.72, speed: 0.55, taper: [8, 4], press: 0.35, pfreq: 6, nib: 0.4, wet: false });
    const e = pts[pts.length - 1];
    // the positron itself: a tiny bright ball throwing off short rays, a spark
    ball(D, e, 0.0068, { k: 0.42 });
    for (let m = 0; m < 7; m++) {
      const ra = am + (m / 7) * TAU + D.r(-0.15, 0.15), l0 = 0.011, l1 = l0 + D.r(0.005, 0.009);
      const sp0 = e;
      D.stroke(linePts(sp0[0] + Math.cos(ra) * l0, sp0[1] + Math.sin(ra) * l0, sp0[0] + Math.cos(ra) * l1, sp0[1] + Math.sin(ra) * l1), { w: 0.8, d: 0.45, speed: 0.5, taper: [2, 6], wet: false });
    }
  }
  // ---- the helium cast into the hub: four balls in a clump (the two behind first)
  const hp = [C[0] + 0.02, C[1] + 0.02], hr = 0.0145, ho = 0.0118;
  const hb = [[hp[0] - ho * 0.2, hp[1] - ho], [hp[0] + ho, hp[1] - ho * 0.15], [hp[0] - ho, hp[1] + ho * 0.2], [hp[0] + ho * 0.25, hp[1] + ho * 0.95]];
  castShadow(D, hb.map((b) => [b[0], b[1], hr]), { k: 0.8 });
  hb.forEach((b, j) => ball(D, b, hr, { k: 0.7, occ: hb.slice(j + 1).map((q) => [q[0], q[1], hr]) }));
  D.text('He', hp[0] + 0.016, hp[1] + 0.068, { size: 21, d: 0.66 });
  // the helium's way in from N15 + p, drawn as a dotted path with a small head
  {
    const s = st[5], a0 = s.a + 0.22;
    const p0 = [C[0] + Math.cos(a0) * (R - s.r - 0.012), C[1] + Math.sin(a0) * (R - s.r - 0.012)];
    const p1 = [hp[0] + 0.03, hp[1] - 0.032];
    const path = spline([p0, [(p0[0] + p1[0]) / 2 + 0.006, (p0[1] + p1[1]) / 2 + 0.012], p1], 1.2 * PX);
    for (let k = 0; k < path.length - 6; k += 9) D.stroke(path.slice(k, k + 5), { w: 1.2, d: 0.6, speed: 0.4, taper: [2, 2], wet: false });
    const e = path[path.length - 1], q = path[path.length - 8];
    const td = [e[0] - q[0], e[1] - q[1]], tl = Math.hypot(...td);
    arrowHead(D, e, [td[0] / tl, td[1] / tl], 0.01, { w: 1.1, d: 0.62, wet: false });
  }
  // ---- in the margin, earlier and fainter: how the light falls on a ball and how its shadow is thrown
  if (V) lightStudy(D, [-0.185, -0.362]);
  else lightStudy(D, [-0.5, -0.3]);
  scriptBlock(D, ['la ruota del foco', 'che mai si ferma'], V ? 0.2 : -0.36, V ? 0.352 : 0.22, { size: 19, lh: 26, d: 0.5 });
  scriptBlock(D, ['il carbone si fa azoto', 'e l’azoto si fa carbone'], V ? 0.29 : 0.74, V ? -0.372 : -0.24, { size: 18, lh: 25, d: 0.45 });
  D.fitTo(0, -15, -0.1);
  // ---- during the cut: the pen runs the arrows round the wheel (counter-clockwise), freehand over the compass line
  D.at(-0.12);
  const a0i = D.mark();
  st.forEach((s, i) => {
    const n = st[(i + 1) % 6];
    const a0 = s.a - (s.r + 0.014) / R, a1 = s.a - TAU / 6 + (n.r + 0.018) / R;
    const off = D.r(0.001, 0.0028), sd = 50 + i;
    const raw = arcPts(C[0], C[1], R, a0, a1, { step: 1.2 * PX });
    const pts = raw.map(([x, y], k) => {
      const u = k / (raw.length - 1), dx = x - C[0], dy = y - C[1], rr = Math.hypot(dx, dy);
      const dr = off * Math.sin(u * Math.PI) + fnoise(u * 7, sd) * 1.6 * PX;
      return [C[0] + dx / rr * (rr + dr), C[1] + dy / rr * (rr + dr)];
    });
    D.stroke(pts, { w: 2.1, d: 0.9, dur: 0.12, taper: [16, 5], gap: 0.0, press: 0.35, pfreq: 5, nib: 0.45, pool: 0.3 });
    const e = pts[pts.length - 1], q = pts[pts.length - 6];
    const td = [e[0] - q[0], e[1] - q[1]], tl = Math.hypot(...td);
    arrowHead(D, e, [td[0] / tl, td[1] / tl], 0.017, { dur: 0.035, gap: 0.0 });
  });
  D.fitTo(a0i, -0.12, 0.72);
  return D;
}

// Leonardo's demonstration of light and shade: a small flame, the rays grazing a ball, the shadow they throw
function lightStudy(D, c) {
  const r = 0.017;
  const lp = [c[0] - 0.05, c[1] - 0.038];
  // the candle: a flame of two curving strokes licking up to a point, the dark wick, the stub with its rim
  const tip = [lp[0] + 0.002, lp[1] - 0.017], base = [lp[0], lp[1] + 0.009];
  D.stroke(spline([base, [lp[0] - 0.0055, lp[1] + 0.002], [lp[0] - 0.003, lp[1] - 0.008], tip], 0.8 * PX), { w: 1.1, d: 0.62, speed: 0.25, taper: [6, 10], wet: false });
  D.stroke(spline([base, [lp[0] + 0.005, lp[1] + 0.001], [lp[0] + 0.0035, lp[1] - 0.009], tip], 0.8 * PX), { w: 1.0, d: 0.55, speed: 0.25, taper: [6, 12], wet: false });
  D.stroke(spline([[lp[0] - 0.0015, lp[1] + 0.003], [lp[0] - 0.002, lp[1] - 0.003], [lp[0] + 0.0005, lp[1] - 0.008]], 0.8 * PX), { w: 0.7, d: 0.4, speed: 0.25, taper: [4, 8], wet: false });
  D.stroke(linePts(lp[0], lp[1] + 0.006, lp[0] + 0.0004, lp[1] + 0.013, { wob: 0.2 * PX, seed: 3 }), { w: 1.8, d: 0.75, speed: 0.2, taper: [3, 3], wet: false });
  const cw = 0.0065, cy0 = lp[1] + 0.013, cy1 = lp[1] + 0.034;
  D.stroke(arcPts(lp[0], cy0, cw, 0, TAU * 1.05, { ry: cw * 0.32, step: 0.8 * PX }), { w: 0.9, d: 0.55, speed: 0.3, taper: [3, 3], wet: false });
  D.stroke(linePts(lp[0] - cw, cy0, lp[0] - cw - 0.0003, cy1, { wob: 0.3 * PX, seed: 4 }), { w: 0.9, d: 0.5, speed: 0.4, taper: [3, 14], wet: false });
  D.stroke(linePts(lp[0] + cw, cy0, lp[0] + cw + 0.0004, cy1, { wob: 0.3 * PX, seed: 5 }), { w: 1.4, d: 0.65, speed: 0.4, taper: [3, 14], wet: false });
  for (let q = 0; q < 4; q++) { const x = lp[0] + cw * (0.15 + q * 0.22); D.stroke(linePts(x, cy0 + 0.003, x + 0.0006, cy1 - 0.003 - q * 0.002), { w: 0.6, d: 0.4, speed: 0.6, taper: [3, 10], wet: false }); }
  // the shadow on the sheet, then the ball
  castShadow(D, [[c[0], c[1], r]], { k: 0.6 });
  ball(D, c, r, { k: 0.6 });
  // two rays from the flame grazing the ball top and bottom, ruled lightly, running on to the shadow's ends
  for (const sg of [-1, 1]) {
    const dx = c[0] - lp[0], dy = c[1] - lp[1], L = Math.hypot(dx, dy);
    const al = Math.asin(r / L), ba = Math.atan2(dy, dx) + sg * al;
    const e = [lp[0] + Math.cos(ba) * (L + 0.04), lp[1] + Math.sin(ba) * (L + 0.04)];
    D.stroke(linePts(lp[0] + Math.cos(ba) * 0.012, lp[1] + Math.sin(ba) * 0.012, e[0], e[1], { wob: 0.25 * PX, seed: 8 + sg }), { w: 0.7, d: 0.32, speed: 1.2, taper: [10, 20], wet: false });
  }
  D.text('lume', c[0] + 0.045, c[1] - r - 0.004, { size: 13, d: 0.42 });
  D.text('ombra', c[0] - 0.008, c[1] + 0.045, { size: 13, d: 0.42 });
}

// a block of mirror-script lines; x is the RIGHT edge (as scriptBlock in studies-drawings.js)
function scriptBlock(D, lines, x, y, o = {}) {
  const lh = (o.lh ?? 30) * PX;
  lines.forEach((ln, i) => {
    const jx = (D.rnd() - 0.5) * 8 * PX;
    D.text(ln, x + jx, y + i * lh, { size: o.size ?? 22, d: (o.d ?? 0.6) * D.r(0.85, 1.08), cps: 16, angle: (D.rnd() - 0.5) * 0.012, gap: 0.08 });
  });
}
