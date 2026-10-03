// A fist in iron-gall ink for the 9:16 frenzy studies (scene 'studies'): the S10 fist's forms (canonical cm,
// y down, seen from the front: the four middle phalanges stacked across the grip with their knuckles on the
// right, the thumb crossing the index and middle fingers, the thenar the left silhouette, the wrist breaking
// and the forearm leaving down-left), redrawn with the pen at a smaller scale: firm contours on the shadow
// side, broken light ones on the lit side, the undersides hatched. Whatever the hand grips (a cord, a stalk)
// leaves the top of the fist at canonical (0, -2.5); `front` are the page polygons that hide it.
import { PX, spline, hatch, resample } from './studies-ink.js';

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
export const inP = (P, x, y) => x >= P.bb[0] && x <= P.bb[2] && y >= P.bb[1] && y <= P.bb[3] && inPoly(P, x, y);
export function clipOut(pts, occ) {
  const runs = [];
  let cur = [];
  for (const p of pts) {
    if (occ.some((o) => (typeof o === 'function' ? o(p[0], p[1]) : inP(o, p[0], p[1])))) { if (cur.length > 1) runs.push(cur); cur = []; } else cur.push(p);
  }
  if (cur.length > 1) runs.push(cur);
  return runs.filter((r) => r.length > 2);
}
const lerpY = (pts, x) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) if (x <= pts[i + 1][0]) { const u = (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0]); return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u; }
  return pts[pts.length - 1][1];
};
const lerpX = (pts, y) => {
  if (y <= pts[0][1]) return pts[0][0];
  for (let i = 0; i < pts.length - 1; i++) if (y <= pts[i + 1][1]) { const u = (y - pts[i][1]) / (pts[i + 1][1] - pts[i][1]); return pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u; }
  return pts[pts.length - 1][0];
};
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// o: { O: page position of the canonical origin, CM: page units per cm, TH: rotation (radians, clockwise on
// screen), armTo: how far down the forearm runs (cm, default 16), wk: stroke-weight factor }
export function inkFist(D, o = {}) {
  const CM = o.CM ?? 0.017, O = o.O ?? [0, 0], TH = o.TH ?? 0, wk = o.wk ?? 1;
  const c = Math.cos(TH), s = Math.sin(TH);
  const T = (x, y) => [O[0] + (x * c - y * s) * CM, O[1] + (x * s + y * c) * CM];
  const Ti = (X, Y) => { const dx = (X - O[0]) / CM, dy = (Y - O[1]) / CM; return [dx * c + dy * s, -dx * s + dy * c]; };
  const TP = (pts) => resample(pts.map(([x, y]) => T(x, y)), 1.3 * PX);
  const sp = (ctrl, closed = false) => spline(ctrl, 0.06, closed);

  // ---- forms (as S10)
  const FD = [
    { yT: -2.55, yB: -0.70, xL: -1.95, xR: 2.05 },
    { yT: -0.74, yB: 1.22, xL: -2.0, xR: 2.42 },
    { yT: 1.18, yB: 2.98, xL: -1.7, xR: 2.18 },
    { yT: 2.94, yB: 4.34, xL: -1.15, xR: 1.66 },
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
  const thTop = [[-3.5, -1.5], [-2.8, -2.3], [-1.9, -2.78], [-1.0, -2.86], [0.0, -2.46], [0.9, -1.84], [1.58, -1.28]];
  const thTip = [[1.98, -0.86], [2.04, -0.38], [1.7, -0.06]];
  const thBot = [[1.02, -0.04], [0.22, -0.3], [-0.6, -0.72], [-1.45, -0.98], [-2.25, -0.78]];
  const thumbC = poly(sp([...thTop, ...thTip, ...thBot, [-2.9, -0.95]], true));
  const nail = [[0.5, -1.62], [0.95, -1.98], [1.5, -1.62], [1.82, -1.08], [1.6, -0.74], [1.05, -0.98], [0.6, -1.26]];
  const nailC = poly(sp(nail, true));
  const thenarOut = [[-3.5, -1.5], [-3.85, -0.4], [-3.95, 1.1], [-3.7, 2.75], [-3.15, 4.15], [-2.4, 5.15]];
  const thenarIn = [[-2.25, -0.78], [-1.7, 0.3], [-1.38, 1.6], [-1.12, 2.9], [-0.88, 4.0], [-0.66, 4.85]];
  const thenarC = poly(sp([...thenarOut, [-1.6, 5.45], ...thenarIn.slice().reverse(), [-2.9, -0.95]], true));
  const hypo = [[1.02, 4.34], [1.5, 4.66], [1.72, 5.25]];
  const aT = o.armTo ?? 16;
  const armR = [[1.72, 5.25], [1.25, 6.55], [0.05, 9.0], [-1.95, 12.5], [-1.95 - (aT - 12.5) * 0.58, aT]];
  const armL = [[-2.4, 5.15], [-3.2, 6.3], [-4.4, 8.6], [-6.2, 12.0], [-6.2 - (aT - 1 - 12) * 0.52, aT - 1]];

  const toPage = (P) => poly(P.map(([x, y]) => T(x, y)));
  const fingerP = fingerC.map(toPage), thumbP = toPage(thumbC), thenarP = toPage(thenarC);
  const front = [thumbP, thenarP, ...fingerP];
  // the whole silhouette (fist + forearm), for things passing behind the hand
  const sil = toPage([...sp([[-3.5, -1.5], [-1.9, -2.78], [0.0, -2.62], [2.05, -2.5], [2.42, -0.2], [2.18, 2.0], [1.66, 4.3]]), ...armR.slice(1), ...armL.slice().reverse(), ...thenarOut.slice().reverse()]);

  const ink = (r, w, d, taper = [8, 14], speed = 0.9) => D.stroke(r, { w: w * wk, d, speed, taper, press: 0.3, pfreq: 12 });
  const contour = (ctrl, oo = {}, occ = []) => {
    const pts = TP(oo.raw ? ctrl : sp(ctrl));
    let runs = occ.length ? clipOut(pts, occ) : [pts];
    if (oo.broken) {
      const out = [];
      for (const r of runs) {
        let a = 0;
        while (a < r.length - 3) {
          const b = Math.min(r.length, a + Math.max(6, Math.floor(D.r(0.35, 1.0) * r.length / oo.broken)));
          out.push(r.slice(a, b));
          a = b + Math.floor(D.r(2, 6));
        }
      }
      runs = out.filter((r) => r.length > 3);
    }
    for (const r of runs) {
      ink(r, oo.w ?? 2.0, oo.d ?? 0.85, oo.taper ?? [8, 14], oo.speed ?? 0.9);
      if (oo.search) {
        const off = (D.rnd() - 0.5) * 2.4 * PX;
        const a = Math.floor(r.length * D.r(0, 0.25)), b = Math.floor(r.length * D.r(0.6, 1));
        const sub = r.slice(a, b).map(([x, y]) => [x + off, y - off * 0.7]);
        if (sub.length > 3) ink(sub, (oo.w ?? 2.0) * 0.6, (oo.d ?? 0.85) * 0.42, [16, 16], 1.3);
      }
    }
  };
  const shadeIn = (fn, occ, bbox, oo = {}) => {
    const inside = (X, Y) => {
      for (const q of occ) if (inP(q, X, Y)) return 0;
      const [x, y] = Ti(X, Y);
      return fn(x, y);
    };
    const [x0, y0, x1, y1] = bbox;
    const cs = [T(x0, y0), T(x1, y0), T(x0, y1), T(x1, y1)];
    const bb = [Math.min(...cs.map((p) => p[0])), Math.min(...cs.map((p) => p[1])), Math.max(...cs.map((p) => p[0])), Math.max(...cs.map((p) => p[1]))];
    return hatch(D, inside, bb, { angle: 0.95, sp: 3.3, w: 1.05 * wk, d: 0.62, maxLen: 26, speed: 2.4, gap: 0.004, thr: [0.25, 0.85], wet: false, ...oo });
  };

  // ---- forearm and heel of the hand
  contour(armL, { w: 1.8, d: 0.72, search: true, taper: [10, 110], broken: 2.5 }, [thenarP]);
  contour([...hypo, ...armR.slice(1)], { w: 2.4, d: 0.88, search: true, taper: [10, 120] }, fingerP);
  contour([[-1.7, 5.45], [-0.4, 5.75], [1.0, 5.55]], { w: 1.2, d: 0.5, taper: [8, 8] });
  contour([[-2.3, 7.4], [-1.1, 7.15], [0.4, 7.4]], { w: 1.0, d: 0.36, taper: [10, 10] });
  // ---- the fingers, back to front
  for (let i = FD.length - 1; i >= 0; i--) {
    const f = FD[i], k = FC[i];
    const occ = [thumbP, thenarP, ...fingerP.slice(0, i)];
    contour(k.slice(0, 4), { w: 1.4, d: 0.62, broken: 2.2 }, occ);
    contour(k.slice(3, 8), { w: 2.3, d: 0.92, taper: [8, 8], search: i === 1 }, occ);
    contour(k.slice(7, 11), { w: 2.1, d: 0.88, taper: [8, 24] }, occ);
    contour([k[10], k[11], k[12], k[0]], { w: 1.5, d: 0.72, taper: [6, 6] }, occ);
    const h = f.yB - f.yT;
    const xx = f.xR - 0.45;
    contour([[xx + 0.05, f.yT + 0.22 * h], [xx - 0.08, f.yT + 0.5 * h], [xx + 0.02, f.yT + 0.76 * h]], { w: 1.0, d: 0.45, taper: [5, 5] }, occ);
    contour([[f.xR - 0.5, f.yT + 0.05], [f.xR + 0.05, f.yT + 0.12], [f.xR + 0.42, f.yT + 0.42]], { w: 1.3, d: 0.6, taper: [4, 10] }, [thumbP, ...fingerP.slice(0, i)]);
  }
  // ---- thumb and thenar, in front
  contour(thTop, { w: 1.7, d: 0.7, search: true, broken: 2 });
  contour([thTop[thTop.length - 2], thTop[thTop.length - 1], ...thTip, thBot[0], thBot[1]], { w: 2.4, d: 0.92, taper: [8, 8] });
  contour(thBot, { w: 2.4, d: 0.92, taper: [8, 20] });
  contour([...nail, nail[0]], { w: 1.2, d: 0.66, taper: [3, 3] });
  contour([[-1.2, -2.95], [-0.98, -2.5], [-1.06, -2.12]], { w: 1.0, d: 0.48, taper: [5, 5] });
  contour(thenarOut, { w: 1.9, d: 0.78, search: true, broken: 1.3 });
  contour([[-2.25, -0.78], [-2.7, -0.9], [-3.1, -1.15]], { w: 1.3, d: 0.6, taper: [6, 14] });
  contour(thenarIn, { w: 1.7, d: 0.62, taper: [10, 30], broken: 2.2 });

  // ---- shading: light from the upper left of the canonical fist
  const thBotRev = [...thBot].reverse();
  FD.forEach((f, i) => {
    const occ = [thumbP, thenarP, ...fingerP.slice(0, i)];
    shadeIn((x, y) => {
      if (!inP(fingerC[i], x, y)) return 0;
      const v = (y - f.yT) / (f.yB - f.yT);
      let sh = sm(0.35, 0.95, v) * 0.8 + sm(f.xR - 1.1, f.xR - 0.05, x) * 0.4 + sm(f.xL + 1.1, f.xL - 0.1, x) * 0.45;
      sh += Math.exp(-Math.max(0, f.yB - y) / 0.2) * 0.8;
      if (i > 0) sh += Math.exp(-Math.max(0, y - f.yT) / 0.28) * 0.6;
      if (i < 2 && x < 2.0) sh += Math.exp(-Math.max(0, y - lerpY(thBotRev, x)) / 0.55) * 0.7;
      return Math.min(1, sh);
    }, occ, [f.xL - 0.3, f.yT - 0.3, f.xR + 0.2, f.yB + 0.3]);
  });
  shadeIn((x, y) => {
    if (!inP(thumbC, x, y) || inP(nailC, x, y)) return 0;
    const yt = lerpY(thTop, x), yb = lerpY(thBotRev, x);
    return Math.min(1, sm(0.4, 1.0, (y - yt) / Math.max(0.3, yb - yt)) * 0.85 + sm(1.0, 2.0, x) * 0.3);
  }, [], [-4.2, -3.3, 2.2, 0.1]);
  shadeIn((x, y) => {
    if (!inP(thenarC, x, y)) return 0;
    const xl = lerpX(thenarOut, y), xr = lerpX(thenarIn, y);
    const u = (x - xl) / Math.max(0.3, xr - xl);
    return Math.min(1, (sm(0.35, 1.0, u) * 0.7 + sm(1.5, 5.0, y) * 0.45) * (1 - 0.5 * sm(0.12, 0.0, u)));
  }, [thumbP], [-4.1, -1.8, -0.4, 5.6]);
  shadeIn((x, y) => {
    if (y < 5.3) return 0;
    const xl = lerpX(armL, y), xr = lerpX(armR, y);
    const u = (x - xl) / Math.max(0.5, xr - xl);
    if (u < 0 || u > 1) return 0;
    return (sm(0.4, 0.95, u) * 0.85 * (1 - 0.5 * sm(0.9, 1.0, u)) + Math.exp(-(y - 5.3) / 0.9) * 0.6) * sm(aT - 2, 7.5, y);
  }, [thenarP, ...fingerP], [-9, 5.0, 2.0, aT], { maxLen: 40, sp: 3.8, d: 0.5 });

  return { T, Ti, front, sil, grip: T(0, -2.5) };
}
