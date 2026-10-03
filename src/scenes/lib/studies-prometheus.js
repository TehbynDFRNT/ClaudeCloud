// S10 Prometheus: a red-chalk study of a fist carrying fire in a fennel stalk (scene 'studies').
// The fist is designed in a canonical frame (cm, y down) seen from the front: the stalk runs vertically
// through it at x = 0; the four middle phalanges wrap across the front of the stalk as a stack of short,
// unequal segments with their PIP knuckles on the right and the fingertips tucked under the thenar on the
// left; the thumb grows out of the thenar mass and crosses the index and middle fingers diagonally; the
// wrist breaks and the forearm leaves down-left, fading out like an unfinished study. The canonical frame
// is rotated onto the page so the stalk leans right and the arm enters from the lower left.
import { Drawing, PX, TAU, spline, arcPts, linePts, hatch, resample } from './studies-ink.js';
import { streamPath, XG, XW, R_LOBE_GIANT } from './binary.js';

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
function clipOut(pts, occ) {
  const runs = [];
  let cur = [];
  for (const p of pts) {
    const hid = occ.some((o) => inP(o, p[0], p[1]));
    if (hid) { if (cur.length > 1) runs.push(cur); cur = []; } else cur.push(p);
  }
  if (cur.length > 1) runs.push(cur);
  return runs.filter((r) => r.length > 2);
}
function lerpY(pts, x) {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) if (x <= pts[i + 1][0]) { const u = (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0]); return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u; }
  return pts[pts.length - 1][1];
}
function lerpX(pts, y) { // x(y) through points sorted by y
  if (y <= pts[0][1]) return pts[0][0];
  for (let i = 0; i < pts.length - 1; i++) if (y <= pts[i + 1][1]) { const u = (y - pts[i][1]) / (pts[i + 1][1] - pts[i][1]); return pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u; }
  return pts[pts.length - 1][0];
}
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// o.vertical (the 9:16 cut): the fist, stalk and flame are unchanged; the theft diagram moves to the top
// right beside the flame and the notes to the open paper right of the fist
export function prometheus(o = {}) {
  const V = !!o.vertical;
  const D = new Drawing(1010);
  const CM = 0.034;
  const O = [-0.30, 0.12];
  const TH = 0.32;                          // canonical -> page: clockwise, the stalk leans right
  const c = Math.cos(TH), s = Math.sin(TH);
  const T = (x, y) => [O[0] + (x * c - y * s) * CM, O[1] + (x * s + y * c) * CM];
  const Ti = (X, Y) => { const dx = (X - O[0]) / CM, dy = (Y - O[1]) / CM; return [dx * c + dy * s, -dx * s + dy * c]; };
  const TP = (pts) => resample(pts.map(([x, y]) => T(x, y)), 1.5 * PX);
  const sp = (ctrl, closed = false) => spline(ctrl, 0.08, closed);
  const CH = { kind: 'chalk', nib: 0, wet: false };

  // ---------------- forms (canonical cm) ----------------
  const FD = [
    { yT: -2.55, yB: -0.70, xL: -1.95, xR: 2.05 },   // index
    { yT: -0.74, yB: 1.22, xL: -2.0, xR: 2.42 },     // middle (its knuckle stands out furthest)
    { yT: 1.18, yB: 2.98, xL: -1.7, xR: 2.18 },      // ring
    { yT: 2.94, yB: 4.34, xL: -1.15, xR: 1.66 },     // little: smaller, set back
  ];
  const fingerCtrl = (f) => {
    const h = f.yB - f.yT;
    return [
      [f.xL + 0.25, f.yT + 0.2], [f.xL + 1.2, f.yT + 0.03], [f.xR - 1.35, f.yT - 0.04], [f.xR - 0.55, f.yT + 0.06],
      [f.xR - 0.12, f.yT + 0.3 * h], [f.xR, f.yT + 0.56 * h], [f.xR - 0.18, f.yT + 0.84 * h], [f.xR - 0.64, f.yB],
      [f.xR - 1.45, f.yB + 0.05], [f.xL + 1.0, f.yB + 0.03], [f.xL + 0.2, f.yB - 0.16],
      [f.xL - 0.1, f.yT + 0.62 * h], [f.xL - 0.04, f.yT + 0.38 * h],
    ];
  };
  const FC = FD.map(fingerCtrl);
  const fingerC = FC.map((k) => poly(sp(k, true)));
  // thumb: grows out of the thenar (upper left), crosses the index and the middle finger, tip on the right
  const thTop = [[-3.5, -1.5], [-2.8, -2.3], [-1.9, -2.78], [-1.0, -2.86], [0.0, -2.46], [0.9, -1.84], [1.58, -1.28]];
  const thTip = [[1.98, -0.86], [2.04, -0.38], [1.7, -0.06]];
  const thBot = [[1.02, -0.04], [0.22, -0.3], [-0.6, -0.72], [-1.45, -0.98], [-2.25, -0.78]];
  const thumbC = poly(sp([...thTop, ...thTip, ...thBot, [-2.9, -0.95]], true));
  const nail = [[0.5, -1.62], [0.95, -1.98], [1.5, -1.62], [1.82, -1.08], [1.6, -0.74], [1.05, -0.98], [0.6, -1.26]];
  const nailC = poly(sp(nail, true));
  // thenar: the thumb's fleshy base, the fist's left silhouette, in front of the tucked fingertips
  const thenarOut = [[-3.5, -1.5], [-3.85, -0.4], [-3.95, 1.1], [-3.7, 2.75], [-3.15, 4.15], [-2.4, 5.15]];
  const thenarIn = [[-2.25, -0.78], [-1.7, 0.3], [-1.38, 1.6], [-1.12, 2.9], [-0.88, 4.0], [-0.66, 4.85]];
  const thenarC = poly(sp([...thenarOut, [-1.6, 5.45], ...thenarIn.slice().reverse(), [-2.9, -0.95]], true));
  // hypothenar / heel of the hand below the little finger, the wrist break, the forearm down-left
  const hypo = [[1.02, 4.34], [1.5, 4.66], [1.72, 5.25]];
  const armR = [[1.72, 5.25], [1.25, 6.55], [0.05, 9.0], [-1.95, 12.5], [-4.2, 16.4]];
  const armL = [[-2.4, 5.15], [-3.2, 6.3], [-4.4, 8.6], [-6.2, 12.0], [-8.0, 15.4]];
  const rStalk = (y) => 0.95 + 0.006 * (y + 17);
  const yTop = -8.3, yBot = 22;

  // page polygons for occlusion (hatching masks are evaluated in page space)
  const toPage = (P) => poly(P.map(([x, y]) => T(x, y)));
  const fingerP = fingerC.map(toPage), thumbP = toPage(thumbC), thenarP = toPage(thenarC), nailP = toPage(nailC);
  const stalkP = poly([[-rStalk(yTop), yTop], [rStalk(yTop), yTop], [rStalk(yBot), yBot], [-rStalk(yBot), yBot]].map(([x, y]) => T(x, y)));
  const handFront = [thumbP, thenarP, ...fingerP];

  const contour = (ctrl, o = {}, occ = []) => {
    const pts = TP(o.raw ? ctrl : sp(ctrl));
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
      D.stroke(r, { ...CH, w: (o.w ?? 2.2) * 1.45, d: o.d ?? 0.62, speed: o.speed ?? 0.5, taper: o.taper ?? [12, 18], press: o.press ?? 0.35, pfreq: 14, load: 0.18 });
      if (o.search) { // a lighter searching line beside it
        const off = (D.rnd() - 0.5) * 2.6 * PX;
        const a = Math.floor(r.length * D.r(0, 0.25)), b = Math.floor(r.length * D.r(0.6, 1));
        const sub = r.slice(a, b).map(([x, y], i) => [x + off + 0.6 * PX * Math.sin(i * 0.05), y - off * 0.7]);
        if (sub.length > 3) D.stroke(sub, { ...CH, w: (o.w ?? 2.2) * 1.0, d: (o.d ?? 0.62) * 0.4, speed: 0.9, taper: [20, 20], press: 0.4 });
      }
    }
  };
  // tone by hatching: fn(x, y) in canonical cm -> shade 0..1; occluders in page space
  const shadeIn = (fn, occ, bbox, o) => {
    const inside = (X, Y) => {
      for (const q of occ) if (inP(q, X, Y)) return 0;
      const [x, y] = Ti(X, Y);
      return fn(x, y, X, Y);
    };
    const [x0, y0, x1, y1] = bbox;
    const corners = [T(x0, y0), T(x1, y0), T(x0, y1), T(x1, y1)];
    const bb = [Math.min(...corners.map((p) => p[0])), Math.min(...corners.map((p) => p[1])), Math.max(...corners.map((p) => p[0])), Math.max(...corners.map((p) => p[1]))];
    const oo = { kind: 'chalk', angle: 0.92, sp: 5.4, w: 2.2, d: 0.48, maxLen: 60, speed: 1.4, gap: 0.006, bow: 0.05, wet: false, nib: 0, ...o };
    return hatch(D, inside, bb, oo);
  };
  // cross-contour strokes over a horizontal cylinder (a finger segment): short arcs from top to bottom,
  // drawn where its shade exceeds a per-stroke threshold
  const crossContour = (f, shade, occ, o = {}) => {
    const step = o.step ?? 0.12;
    for (let x = f.xL + 0.15; x < f.xR - 0.15; x += step * D.r(0.8, 1.2)) {
      const th = D.r(o.thr?.[0] ?? 0.35, o.thr?.[1] ?? 0.8);
      const pts = [];
      for (let y = f.yT - 0.1; y <= f.yB + 0.05; y += 0.04) {
        const v = (y - f.yT) / (f.yB - f.yT);
        const xx = x + (o.bow ?? 0.22) * Math.sin(Math.PI * Math.min(1, Math.max(0, v)));
        if (inP(fingerC[FD.indexOf(f)], xx, y) && shade(xx, y) > th) pts.push([xx, y]);
        else if (pts.length) break;
      }
      if (pts.length < 6) continue;
      for (const r of clipOut(TP(pts), occ)) {
        D.stroke(r, { ...CH, w: (o.w ?? 1.9) * D.r(0.85, 1.15), d: (o.d ?? 0.42) * D.r(0.8, 1.1), speed: 1.6, taper: [4, 10], press: 0.3, load: 0.1, gap: 0.006 });
      }
    }
  };

  D.at(-60);
  // ---------------- the stalk, behind the fingers and in front of the palm heel ----------------
  const sL = [], sR = [];
  for (let y = yTop; y <= yBot; y += 0.5) { sL.push([-rStalk(y), y]); sR.push([rStalk(y) + 0.04 * Math.sin(y * 0.7), y]); }
  contour(sL, { w: 1.7, d: 0.45, search: true, broken: 3 }, handFront);
  contour(sR, { w: 2.4, d: 0.66, search: true }, handFront);
  for (const k of [-0.5, 0.08, 0.56]) { // ribs
    const rib = []; for (let y = yTop + 0.6; y <= yBot; y += 0.5) rib.push([k * rStalk(y) + 0.05 * Math.sin(y * 0.9 + k * 5), y]);
    for (const r of clipOut(TP(sp(rib)), handFront)) D.stroke(r, { ...CH, w: 1.4, d: 0.26, speed: 1.2, taper: [30, 30], press: 0.5 });
  }
  for (const yn of [-5.9, 9.5]) { // nodes: a swelling ring and a leaf-base stub
    const r = rStalk(yn);
    contour([[-r - 0.12, yn - 0.1], [-r * 0.4, yn + 0.32], [r * 0.4, yn + 0.32], [r + 0.12, yn - 0.1]], { w: 1.8, d: 0.52, taper: [6, 6] }, handFront);
    contour([[-r - 0.1, yn + 0.45], [0, yn + 0.8], [r + 0.1, yn + 0.45]], { w: 1.3, d: 0.32, taper: [6, 6] }, handFront);
    contour([[r + 0.08, yn + 0.1], [r + 0.9, yn - 1.4], [r + 1.25, yn - 3.0]], { w: 1.6, d: 0.48, taper: [4, 14] }, handFront);
    contour([[r + 0.05, yn + 0.5], [r + 0.75, yn - 0.6], [r + 1.25, yn - 3.0]], { w: 1.2, d: 0.36, taper: [4, 14] }, handFront);
  }
  // open top of the stalk (the hollow pith keeps the ember)
  const rt = rStalk(yTop);
  contour(arcPts(0, yTop, rt, 0, TAU, { ry: rt * 0.38, step: 0.08 }), { w: 1.9, d: 0.62, taper: [4, 4], raw: true });
  contour(arcPts(0, yTop + 0.05, rt * 0.55, 0, TAU, { ry: rt * 0.2, step: 0.06 }), { w: 1.5, d: 0.7, taper: [3, 3], raw: true });

  // ---------------- forearm and the heel of the hand (behind the stalk) ----------------
  contour(armL, { w: 2.0, d: 0.52, search: true, taper: [10, 120], broken: 2.5 }, [stalkP, thenarP]);
  contour([...hypo, ...armR.slice(1)], { w: 2.6, d: 0.66, search: true, taper: [10, 140] }, [stalkP, ...fingerP]);
  contour([[-1.7, 5.45], [-0.4, 5.75], [1.0, 5.55]], { w: 1.3, d: 0.3, taper: [8, 8] }, [stalkP]);   // wrist crease
  contour([[-2.3, 7.4], [-1.1, 7.15], [0.4, 7.4]], { w: 1.1, d: 0.22, taper: [10, 10] }, [stalkP]);   // a tendon's swell

  // ---------------- fingers: middle phalanges stacked, back to front (little finger first) ----------------
  for (let i = FD.length - 1; i >= 0; i--) {
    const f = FD[i], k = FC[i];
    const occ = [thumbP, thenarP, ...fingerP.slice(0, i)];
    const top = k.slice(0, 4), knuckle = k.slice(3, 8), bot = k.slice(7, 11), left = [k[10], k[11], k[12], k[0]];
    contour(top, { w: 1.7, d: 0.46, broken: 2.2 }, occ);                         // lit: light, broken
    contour(knuckle, { w: 2.5, d: 0.74, taper: [8, 8], search: i === 1 }, occ); // the knuckle, firm
    contour(bot, { w: 2.2, d: 0.68, taper: [8, 26] }, occ);                      // the crease below, firm
    contour(left, { w: 1.7, d: 0.55, taper: [6, 6] }, occ);
    // skin folds over the PIP joint and the proximal phalanx turning back toward the knuckles
    const h = f.yB - f.yT;
    for (let q = 0; q < 2; q++) {
      const xx = f.xR - 0.42 - q * 0.3;
      contour([[xx + 0.05, f.yT + 0.22 * h], [xx - 0.08, f.yT + 0.5 * h], [xx + 0.02, f.yT + 0.76 * h]], { w: 1.1, d: 0.3, taper: [6, 6] }, occ);
    }
    contour([[f.xR - 0.5, f.yT + 0.05], [f.xR + 0.05, f.yT + 0.12], [f.xR + 0.42, f.yT + 0.42]], { w: 1.5, d: 0.42, taper: [4, 10] }, [thumbP, ...fingerP.slice(0, i)]);
    // DIP crease where the fingertip turns under the thenar
    contour([[f.xL + 0.55, f.yT + 0.2 * h], [f.xL + 0.45, f.yT + 0.5 * h], [f.xL + 0.55, f.yT + 0.8 * h]], { w: 1.1, d: 0.3, taper: [5, 5] }, occ);
  }
  // ---------------- thumb and thenar (front-most) ----------------
  contour(thTop, { w: 1.9, d: 0.5, search: true, broken: 2 }, []);
  contour([thTop[thTop.length - 2], thTop[thTop.length - 1], ...thTip, thBot[0], thBot[1]], { w: 2.5, d: 0.72, taper: [8, 8] });
  contour(thBot, { w: 2.5, d: 0.74, taper: [8, 20] });
  contour([...nail, nail[0]], { w: 1.4, d: 0.5, taper: [3, 3] });
  contour([[0.72, -1.38], [1.12, -1.6], [1.5, -1.38]], { w: 1.0, d: 0.26, taper: [4, 4] });          // lunula / cuticle
  contour([[-1.2, -2.95], [-0.98, -2.5], [-1.06, -2.12]], { w: 1.2, d: 0.34, taper: [6, 6] });       // IP joint folds
  contour([[-0.85, -2.85], [-0.7, -2.55], [-0.78, -2.25]], { w: 1.0, d: 0.26, taper: [6, 6] });
  contour(thenarOut, { w: 2.0, d: 0.56, search: true, broken: 2.5 });
  contour([[-2.25, -0.78], [-2.7, -0.9], [-3.1, -1.15]], { w: 1.5, d: 0.44, taper: [6, 14] });   // thumb meets thenar
  contour(thenarIn, { w: 2.0, d: 0.46, taper: [10, 30], broken: 2.2 });
  contour([[-2.75, 1.0], [-2.45, 2.5], [-2.2, 3.8]], { w: 1.1, d: 0.22, taper: [20, 20] });             // the thenar's swell

  // ---------------- shading: light from the upper left; Leonardo's left-handed hatching ----------------
  const thBotRev = [...thBot].reverse();
  FD.forEach((f, i) => {
    const occ = [thumbP, thenarP, ...fingerP.slice(0, i)];
    const fsh = (x, y) => {
      if (!inP(fingerC[i], x, y)) return 0;
      const v = (y - f.yT) / (f.yB - f.yT);
      let sh = sm(0.3, 0.95, v) * 0.78;                              // the underside of the cylinder
      sh += sm(f.xR - 1.1, f.xR - 0.05, x) * 0.42;                    // the knuckle end turns away
      sh += sm(f.xL + 1.1, f.xL - 0.1, x) * 0.5;                      // the tip end turns under
      sh += Math.exp(-Math.max(0, f.yB - y) / 0.18) * 0.8;             // crease
      if (i > 0) sh += Math.exp(-Math.max(0, y - f.yT) / 0.26) * 0.62; // the finger above shades the top
      if (i < 2 && x < 2.0) sh += Math.exp(-Math.max(0, y - lerpY(thBotRev, x)) / 0.55) * 0.75; // the thumb's cast shadow
      return Math.min(1, sh * (1 - 0.25 * sm(0.75, 0.25, v) * sm(f.xR - 0.4, f.xR - 1.4, x)));
    };
    shadeIn(fsh, occ, [f.xL - 0.3, f.yT - 0.3, f.xR + 0.2, f.yB + 0.3], { sp: 4.8, d: 0.46, thr: [0.2, 0.85] });
    crossContour(f, fsh, occ, { thr: [0.5, 0.9], d: 0.38 });
  });
  // thumb: underside in shadow, the tip turning; nail left bare
  shadeIn((x, y) => {
    if (!inP(thumbC, x, y) || inP(nailC, x, y)) return 0;
    const yt = lerpY(thTop, x), yb = lerpY(thBotRev, x);
    const v = (y - yt) / Math.max(0.3, yb - yt);
    return Math.min(1, sm(0.38, 1.0, v) * 0.85 + sm(1.0, 2.0, x) * 0.3 + sm(-2.4, -3.6, x) * 0.25);
  }, [], [-4.2, -3.3, 2.2, 0.1], { sp: 4.6, d: 0.48, thr: [0.2, 0.85] });
  // thenar: a rounded mass, darker toward the fingertips and below; a reflected light at its left edge
  shadeIn((x, y) => {
    if (!inP(thenarC, x, y)) return 0;
    const xl = lerpX(thenarOut, y), xr = lerpX(thenarIn, y);
    const u = (x - xl) / Math.max(0.3, xr - xl);
    const refl = 1 - 0.5 * sm(0.12, 0.0, u);
    return Math.min(1, (sm(0.35, 1.0, u) * 0.7 + sm(1.5, 5.0, y) * 0.45 + Math.exp(-Math.max(0, y - lerpY(thBotRev, x)) / 0.4) * 0.5 * sm(-3.6, -2.4, x)) * refl);
  }, [thumbP], [-4.1, -1.8, -0.4, 5.6], { sp: 4.6, d: 0.5, thr: [0.22, 0.88] });
  // forearm: the lower side, fading out as the study is left unfinished
  shadeIn((x, y) => {
    if (y < 5.3) return 0;
    const xl = lerpX(armL, y), xr = lerpX(armR, y);
    const u = (x - xl) / Math.max(0.5, xr - xl);
    if (u < 0 || u > 1) return 0;
    return (sm(0.4, 0.95, u) * 0.85 * (1 - 0.5 * sm(0.9, 1.0, u)) + Math.exp(-(y - 5.3) / 0.9) * 0.6) * sm(14, 7.5, y);
  }, [stalkP, thenarP, ...fingerP], [-8.5, 5.0, 2.0, 15], { sp: 5.2, maxLen: 90, thr: [0.25, 0.8], d: 0.4, shortenA: 0.15, shortenB: 0.2 });
  // the stalk: right side in shade with reflected light at the very edge; the fist's shadow below it
  shadeIn((x, y) => {
    const r = rStalk(y), u = x / r;
    if (Math.abs(u) > 1 || y < yTop + 0.3) return 0;
    return Math.min(1, sm(-0.1, 0.55, u) * (1 - 0.5 * sm(0.8, 1.0, u)) + (y > 4.2 ? Math.exp(-(y - 4.3) / 1.1) * 0.8 : 0)) * sm(13, 6, y);
  }, handFront, [-1.5, yTop, 1.6, yBot], { sp: 4.4, maxLen: 70, thr: [0.2, 0.9], angle: -Math.PI / 2 + TH, d: 0.42, bow: 0.008 });

  // ---------------- mirror script (written before the cut) and the theft diagram ----------------
  if (V) scriptBlock(D, ['il foco furato', 'nella ferula portato', 'di cielo in terra', 'alli omini'], 0.11, 0.15, { size: 20, lh: 27, d: 0.62, kind: 'chalk' });
  else scriptBlock(D, ['il foco furato nella ferula', 'portato di cielo in terra', 'alli omini'], 0.6, 0.07, { size: 21, lh: 29, d: 0.62, kind: 'chalk' });
  const G0 = V ? [0.045, -0.385] : [0.46, -0.19], SC = V ? 0.15 : 0.31;
  const kS = SC / 0.31;
  const Pb = (x, z) => [G0[0] + x * SC, G0[1] + z * SC];
  const gc = Pb(XG, 0), wc = Pb(XW, 0);
  D.stroke(arcPts(gc[0], gc[1], R_LOBE_GIANT * SC, -2.4, -2.4 + TAU * 1.03, { step: 1.5 * PX }), { ...CH, w: 3.0, d: 0.6, speed: 1.6 * kS, taper: [8, 8], press: 0.25 });
  D.stroke(arcPts(wc[0], wc[1], V ? 0.008 : 0.011, 1, 1 + TAU * 1.1, { step: 1 * PX }), { ...CH, w: 2.5, d: 0.66, speed: 0.4, taper: [3, 3] });
  D.fitTo(0, -30, -0.05);
  const preT = D.mark();

  // ---------------- during the shot: last hatching near the top of the stalk, the flame, the theft ----------------
  D.at(0.0);
  shadeIn((x, y) => {
    const r = rStalk(y), u = x / r;
    if (Math.abs(u) > 1 || y < yTop + 0.3 || y > -4.2) return 0;
    return 0.4 + 0.6 * sm(-0.3, 0.7, u);
  }, handFront, [-1.5, yTop, 1.6, -4.1], { sp: 4.2, maxLen: 40, angle: -Math.PI / 2 + TH + 0.08, d: 0.4, speed: 2.2, gap: 0.004, thr: [0.3, 0.95], bow: 0.008 });
  D.fitTo(preT, 0.0, 0.75);

  // flame rising from the hollow top: a teardrop body, side tongues curling out, inner zone lines,
  // detached flicks and smoke curling off the tip (fire rises vertically, whatever the stalk's lean)
  const base = T(0, yTop);
  const flame = { x: base[0], y: base[1] - 0.004 };
  const bez = (p0, p1, p2, p3, n = 50) => {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, a = (1 - t) ** 3, b = 3 * (1 - t) ** 2 * t, cc = 3 * (1 - t) * t * t, d = t ** 3;
      out.push([p0[0] * a + p1[0] * b + p2[0] * cc + p3[0] * d, p0[1] * a + p1[1] * b + p2[1] * cc + p3[1] * d]);
    }
    return out;
  };
  const FSC = 1.35;
  const FP = ([x, yu]) => [flame.x + x * FSC, flame.y - yu * FSC];   // flame frame: y up
  const fl = (pts, o) => D.stroke(resample(pts.map(FP), 1.4 * PX), { ...CH, press: 0.3, ...o, w: (o.w ?? 2) * 1.5 });
  const tongue = (bl, br, tip, cl1, cl2, cr1, cr2, o = {}) => {
    fl(bez(bl, cl1, cl2, tip), { w: o.w ?? 2.2, d: o.d ?? 0.66, speed: o.speed ?? 0.45, taper: [8, 26], gap: 0.0 });
    fl(bez(br, cr1, cr2, tip), { w: (o.w ?? 2.2) * 1.08, d: (o.d ?? 0.66) * 1.05, speed: o.speed ?? 0.45, taper: [8, 26], gap: 0.03 });
  };
  D.at(0.65);
  const m0 = D.mark();
  tongue([-0.021, 0], [0.021, 0], [-0.034, 0.172], [-0.05, 0.05], [-0.012, 0.105], [0.046, 0.065], [0.0, 0.122]);   // main
  tongue([-0.03, 0.05], [-0.016, 0.075], [-0.07, 0.132], [-0.046, 0.088], [-0.058, 0.112], [-0.03, 0.104], [-0.05, 0.118], { w: 1.9, d: 0.6 });
  tongue([0.01, 0.06], [0.034, 0.04], [0.03, 0.128], [0.006, 0.09], [0.024, 0.108], [0.046, 0.08], [0.04, 0.104], { w: 1.8, d: 0.56 });
  tongue([-0.011, 0.012], [0.012, 0.012], [-0.016, 0.112], [-0.026, 0.05], [-0.006, 0.085], [0.024, 0.055], [-0.002, 0.09], { w: 1.4, d: 0.4 });
  tongue([-0.007, 0.006], [0.007, 0.006], [-0.003, 0.046], [-0.012, 0.022], [-0.004, 0.036], [0.012, 0.022], [0.002, 0.038], { w: 1.2, d: 0.34 });
  tongue([-0.036, 0.15], [-0.03, 0.152], [-0.05, 0.19], [-0.042, 0.165], [-0.048, 0.18], [-0.03, 0.165], [-0.044, 0.18], { w: 1.3, d: 0.46 });
  tongue([0.012, 0.135], [0.018, 0.136], [0.016, 0.166], [0.01, 0.148], [0.014, 0.16], [0.022, 0.148], [0.018, 0.16], { w: 1.2, d: 0.42 });
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
  sm2(curl(tipX, tipY - 0.01, 0.016, 1.3, -1, 0.04), { w: 1.5, d: 0.3, speed: 0.3, taper: [10, 30] });
  sm2(curl(tipX + 0.02, tipY - 0.035, 0.011, 1.1, -1, 0.03), { w: 1.4, d: 0.24, speed: 0.3, taper: [10, 30] });
  D.fitTo(m0, 0.45, 2.1);

  // the arc that links the large circle to the small one: the real ballistic stream from L1
  const arcS = streamPath({ maxT: 1.36, every: 10 }).map((q) => Pb(q.x, q.z));
  D.at(2.15);
  D.stroke(resample(arcS, 1.5 * PX), { ...CH, w: 2.8, d: 0.58, dur: 0.8, taper: [10, 20], press: 0.3 });
  if (V) D.text('dal grande al picholo', 0.105, gc[1] + 0.085, { size: 17, d: 0.56, kind: 'chalk', t0: 2.95, dur: 0.5 });
  else D.text('dal grande al picholo', gc[0] + 0.19, gc[1] + 0.145, { size: 17, d: 0.56, kind: 'chalk', t0: 2.95, dur: 0.5 });
  D.flame = [flame.x - 0.014, flame.y - 0.08];
  return D;
}

// a block of mirror-script lines; x is the RIGHT edge (Leonardo writes right to left)
function scriptBlock(D, lines, x, y, o = {}) {
  const lh = (o.lh ?? 30) * PX;
  lines.forEach((ln, i) => {
    const jx = (D.rnd() - 0.5) * 8 * PX * (o.ragged ?? 1);
    D.text(ln, x + jx, y + i * lh, { size: o.size ?? 22, d: (o.d ?? 0.6) * D.r(0.85, 1.08), cps: o.cps ?? 16, angle: (o.angle ?? 0) + (D.rnd() - 0.5) * 0.012, gap: 0.08, kind: o.kind });
  });
}
