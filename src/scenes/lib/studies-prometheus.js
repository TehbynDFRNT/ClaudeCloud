// S10 Prometheus: a red-chalk study of a fist carrying fire in a fennel stalk (scene 'studies').
// The fist is a small solid model (studies-prometheus-form.js): a hand built on its skeleton and closed
// around the stalk joint by joint, the thumb laid across the middle phalanges of the index and middle
// fingers, the wrist breaking and the forearm leaving down-left and away. It is seen in a canonical frame
// (cm, y down; the stalk vertical at x = 0) rotated onto the page so the stalk leans right.
// Everything is modelled under one key from the upper left (the page's own light): contours are the
// model's visible outlines, heavy and closed on the shadow side, thin and lifting on the lit side, light
// where two masses only meet; tone is laid in Leonardo's left-handed parallel hatching, densening in
// passes into the core shadows, with cross-contour strokes round the fingers and a rubbed ground in the
// darkest places; the forearm and the stalk below the fist are left unfinished. The fennel stalk is a
// ribbed, fibrous stem with swollen nodes, a clasping leaf-sheath and a cut, pithy top in which the ember
// is carried; the flame rises out of it during the shot, drawn in chalk tongue by tongue.
import { Drawing, PX, TAU, arcPts, resample, hatch, fnoise } from './studies-ink.js';
import { streamPath, XG, XW, R_LOBE_GIANT } from './binary.js';
import * as F from './studies-prometheus-form.js';

const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

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
  const CH = { kind: 'chalk', nib: 0, wet: false };
  const toCanon = (v) => [c * v[0] + s * v[1], -s * v[0] + c * v[1], v[2]];

  // ---------------- the solid ----------------
  const M = F.fistModel();
  const ALPHA = 17, OFF = [0, 0.6];
  const VW = F.viewOf(M, { phi: 36, alpha: ALPHA, mirror: true, offset: OFF });
  const cosA = Math.cos(ALPHA * Math.PI / 180), sinA = Math.sin(ALPHA * Math.PI / 180);
  const R = M.R;
  const yTop = -8.3;
  const tOf = (y) => (OFF[1] - y) / cosA;                      // stalk parameter (cm along its axis) at canonical y
  const rSt = (t) => R * (1 - 0.016 * Math.max(0, t) - 0.004 * Math.min(0, t));   // the stem tapers toward the cut
  const axis = (t) => VW.C(F.add(M.Q, F.mul(M.u, t)));
  const prims = M.prims.map((p) => ({ ...p, a: VW.C(p.a), b: VW.C(p.b) }));
  const groups = M.groups.map((g) => ({ ...g }));
  const gStalk = groups.length; groups.push({ name: 'stalk', k: 0.3 });
  const tTop = tOf(yTop), tBot = tOf(19);
  prims.push({ a: axis(tBot), b: axis(0), ra: rSt(tBot), rb: rSt(0), g: gStalk });
  prims.push({ a: axis(0), b: axis(tTop + 0.3), ra: rSt(0), rb: rSt(tTop + 0.3), g: gStalk });
  const NODES = [tOf(-4.6), tOf(10.6)];
  for (const tn of NODES) prims.push({ a: axis(tn - 0.15), b: axis(tn + 0.35), ra: rSt(tn) * 1.1, rb: rSt(tn) * 1.04, g: gStalk, k: 0.35 });
  const ryTop = R * sinA;
  const FF = F.rasterise(prims, groups, { x0: -9, y0: -10.5, x1: 7, y1: 18, h: 0.045 }, {
    clip: { stalk: (x, y) => y - (yTop - ryTop * Math.sqrt(Math.max(0, 1 - (x / rSt(tTop)) ** 2))) },
  });
  const Lc = F.norm(toCanon([-0.6, -0.62, 0.5])), Rc = F.norm(toCanon([0.55, 0.62, 0.12]));
  const LF = F.lightField(FF, { L: Lc, Rf: Rc });
  // the study is left unfinished down the forearm and the stalk below the fist
  const wrist = VW.C([0, 0.9, 0]), dfa = VW.Cd(M.df);
  const dfl = Math.hypot(dfa[0], dfa[1]), dfx = dfa[0] / dfl, dfy = dfa[1] / dfl;
  const FADE = new Float32Array(FF.nx * FF.ny);
  for (let j = 0; j < FF.ny; j++) for (let i = 0; i < FF.nx; i++) {
    const k = j * FF.nx + i, g = FF.GI[k];
    if (g < 0) continue;
    const x = FF.x0 + i * FF.hc, y = FF.y0 + j * FF.hc;
    if (g === M.gPalm) { const fa = (x - wrist[0]) * dfx + (y - wrist[1]) * dfy; FADE[k] = sm(9.5, 2.5, fa); }
    else if (g === gStalk) FADE[k] = y > 0 ? sm(14.5, 6.5, y) : 1;
    else FADE[k] = 1;
  }
  const toneS = F.sampler(FF, LF.T, 0), fadeS = F.sampler(FF, FADE, 0);
  const tone = (x, y) => toneS(x, y) * fadeS(x, y);
  const front = (x, y) => { const k = F.at(FF, x, y); return k < 0 ? -1 : FF.GI[k]; };
  const visible = (q, tol = 0.07) => { const k = F.at(FF, q[0], q[1]); return k >= 0 && FF.GI[k] >= 0 && q[2] >= FF.H[k] - tol; };

  // ---------------- drawing helpers ----------------
  // a chalk line through canonical points with per-point weight/density factors (the line swells and tapers)
  const line = (pts, wf, df, op = {}) => {
    if (pts.length < 3) return null;
    const P = pts.map(([x, y]) => T(x, y));
    const it = D.stroke(P, { ...CH, w: (op.w ?? 2.0) * 1.45, d: op.d ?? 0.7, speed: op.speed ?? 0.6, taper: op.taper ?? [10, 16], press: op.press ?? 0.3, pfreq: 14, load: op.load ?? 0.14, gap: op.gap });
    if (it) for (let i = 0; i < it.W.length; i++) { it.W[i] *= wf[i]; it.D[i] = clamp(it.D[i] * df[i]); }
    return it;
  };
  // split a long run into hand-length strokes that overlap a little
  const handRuns = (pts, cmMin = 1.2, cmMax = 3.4) => {
    const out = [];
    let a = 0;
    while (a < pts.length - 3) {
      let L = 0, b = a + 1;
      const want = D.r(cmMin, cmMax);
      while (b < pts.length - 1 && L < want) { L += Math.hypot(pts[b][0] - pts[b - 1][0], pts[b][1] - pts[b - 1][1]); b++; }
      if (pts.length - b < 6) b = pts.length;
      out.push([a, b]);
      a = Math.max(a + 3, b - Math.floor(D.r(1, 4)));
    }
    return out;
  };

  // ---------------- contours: the model's visible outlines ----------------
  const CT = F.contours(FF);
  const big = new Set([M.gPalm, gStalk, M.gTP, M.gTD]);
  const contourStrokes = (filter) => {
    for (const C of CT) {
      if (!filter(C)) continue;
      const pts = C.pts;
      // owned points, with their weights
      const own = pts.map((p) => {
        // this group's line where it stands in front; where two masses only meet, the lower-numbered draws it
        const crease = Math.abs(p[2]) <= 0.1;
        if (p[2] < -0.1 || (crease && !(p[5] > C.g))) return null;
        const xi = p[0] - p[3] * 0.14, yi = p[1] - p[4] * 0.14;
        const tin = toneS(xi, yi), fd = fadeS(xi, yi) || fadeS(p[0] - p[3] * 0.3, p[1] - p[4] * 0.3);
        if (fd < 0.06) return null;
        const sil = crease ? (p[5] >= 0 && p[5] !== M.gPalm && C.g !== M.gPalm ? 0.75 : 0.1) : p[5] < 0 ? sm(0.1, 1.2, p[2]) : 0.45 + 0.55 * sm(0.05, 0.6, p[2]);
        return { p, tin, fd, sil };
      });
      // runs of owned points; the lit side lifts here and there
      let run = [];
      const runs = [];
      let sAcc = 0;
      own.forEach((q, i) => {
        if (i > 0) sAcc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        const lift = q && q.tin < 0.12 && q.sil > 0.5 && fnoise(sAcc * 1.3, C.g * 13 + 5) > 0.5 - 0.8 * q.tin;
        if (q && !lift) run.push(q); else { if (run.length > 4) runs.push(run); run = []; }
      });
      if (run.length > 4) runs.push(run);
      for (const r of runs) {
        for (const [a, b] of handRuns(r.map((q) => q.p))) {
          const seg = r.slice(a, b);
          if (seg.length < 4) continue;
          const wf = seg.map((q) => (0.42 + 0.62 * q.sil) * (0.68 + 0.85 * q.tin) * (0.3 + 0.7 * q.fd));
          const df = seg.map((q) => (0.5 + 0.5 * q.sil) * (0.78 + 0.42 * q.tin) * Math.pow(q.fd, 0.6));
          // a slight unsteadiness of the hand along the line
          const sd0 = D.r(0, 100);
          let acc = 0;
          const wob = seg.map((q, i) => {
            if (i) acc += Math.hypot(q.p[0] - seg[i - 1].p[0], q.p[1] - seg[i - 1].p[1]);
            const o2 = 0.018 * fnoise(acc * 2.2 + sd0, 77);
            return [q.p[0] + q.p[3] * o2, q.p[1] + q.p[4] * o2];
          });
          line(wob, wf, df, { w: 2.0, d: 0.72, taper: [9, 14] });
          // a searching line beside the big forms
          if (big.has(C.g) && seg.length > 40 && D.rnd() < 0.4) {
            const off = D.r(0.04, 0.09) * (D.rnd() < 0.5 ? 1 : -1);
            const a2 = Math.floor(seg.length * D.r(0, 0.3)), b2 = Math.floor(seg.length * D.r(0.55, 1));
            const sub = seg.slice(a2, b2);
            if (sub.length > 6) line(sub.map((q) => [q.p[0] + q.p[3] * off, q.p[1] + q.p[4] * off]), sub.map(() => 0.75), sub.map((q) => 0.38 * Math.pow(q.fd, 0.8)), { w: 1.5, d: 0.6, taper: [20, 20], speed: 1.0 });
          }
        }
      }
    }
  };

  // cross-sections of a bone, kept where visible and dark enough: hatching that turns round the form
  const rings = (B, op = {}) => {
    const a = B.a, b = B.b, ax = F.sub(b, a), L = F.len(ax);
    const e1 = B.e1, e2 = B.e2, k1 = B.k1 ?? 1, k2 = B.k2 ?? 1;
    const step = op.step ?? 0.13;
    for (let t = op.t0 ?? 0.08; t < (op.t1 ?? 0.92); t += (step / L) * D.r(0.75, 1.25)) {
      const cc = F.lerp3(a, b, t), r = (B.ra + (B.rb - B.ra) * t) * 1.004;
      const th = D.r(op.thr?.[0] ?? 0.42, op.thr?.[1] ?? 0.85);
      let cur = [];
      const flush = () => {
        if (cur.length > 5) {
          const tn = cur.map((q) => tone(q[0], q[1]));
          line(cur, tn.map((v) => 0.75 + 0.5 * v), tn.map((v) => 0.55 + 0.6 * v), { w: op.w ?? 1.35, d: op.d ?? 0.46, speed: 1.6, taper: [5, 9], press: 0.25, gap: 0.006, load: 0.1 });
        }
        cur = [];
      };
      for (let k = 0; k <= 96; k++) {
        const ang = (k / 96) * TAU;
        const q = F.add(cc, F.add(F.mul(e1, Math.cos(ang) * r * k1), F.mul(e2, Math.sin(ang) * r * k2)));
        if (visible(q, 0.16) && front(q[0], q[1]) === B.g && tone(q[0], q[1]) > th) cur.push(q); else flush();
      }
      flush();
    }
  };

  // tone by parallel hatching in page space, from the shade field
  const pageBox = (() => {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let j = 0; j < FF.ny; j += 2) for (let i = 0; i < FF.nx; i += 2) {
      const k = j * FF.nx + i;
      if (FF.GI[k] < 0 || FADE[k] < 0.03) continue;
      const P = T(FF.x0 + i * FF.hc, FF.y0 + j * FF.hc);
      x0 = Math.min(x0, P[0]); y0 = Math.min(y0, P[1]); x1 = Math.max(x1, P[0]); y1 = Math.max(y1, P[1]);
    }
    return [x0, y0, x1, y1];
  })();
  const shadeHatch = (fn, op) => hatch(D, (X, Y) => { const [x, y] = Ti(X, Y); return fn(x, y); }, op.bb ?? pageBox,
    { kind: 'chalk', angle: 0.95, sp: 5, w: 1.7, d: 0.5, maxLen: 34, speed: 1.6, gap: 0.004, bow: 0.04, wet: false, nib: 0, thr: [0.15, 0.6], ...op });

  D.at(-60);
  // ---------------- the stalk's own marks: ribs, nodes, the leaf-sheath, the cut top ----------------
  const stalkHatchTop = -4.2;                 // above this the stalk is worked up during the shot
  const onStalk = (x, y) => front(x, y) === gStalk;
  // the stem is fluted: its ribs carry the tone, sparse and faint in the light, close and firm in the shade
  const ribs = (pre) => {
    const NR = 13;
    for (let f = 0; f < NR; f++) {
      const th = -Math.PI / 2 + (Math.PI * (f + 0.5 + D.r(-0.15, 0.15))) / NR;
      for (const dbl of [0, 1]) {
        const pts = [];
        const yA = pre ? stalkHatchTop - 0.3 : yTop + 0.12, yB = pre ? 17.5 : stalkHatchTop + 0.3;
        for (let y = yA; y <= yB; y += 0.06) {
          const r = rSt(tOf(y));
          const x = r * Math.sin(th + dbl * 0.07) * (1 + 0.01 * fnoise(y * 0.8, f + 3)) + 0.018 * fnoise(y * 1.7, f * 7 + dbl);
          pts.push([x, y]);
        }
        let run = [], sAcc = 0, thr = D.r(0.05, 0.45) + dbl * 0.35;
        const runs = [];
        pts.forEach((p) => {
          sAcc += 0.06;
          const tn = tone(p[0], p[1]);
          const keep = onStalk(p[0], p[1]) && fadeS(p[0], p[1]) > 0.04 && tn + 0.25 * fnoise(sAcc * 0.7, 40 + f * 3 + dbl) > thr;
          if (keep) run.push(p); else { if (run.length > 5) runs.push(run); run = []; if (D.rnd() < 0.3) thr = D.r(0.05, 0.45) + dbl * 0.35; }
        });
        if (run.length > 5) runs.push(run);
        for (const r of runs) for (const [a, b] of handRuns(r, 1.4, 4.2)) {
          const seg = r.slice(a, b);
          if (seg.length < 5) continue;
          const tn = seg.map((p) => tone(p[0], p[1]));
          const fd = seg.map((p) => fadeS(p[0], p[1]));
          line(seg, tn.map((v, i) => (0.5 + 0.8 * v) * (0.4 + 0.6 * fd[i])), tn.map((v, i) => (0.4 + 0.75 * v) * fd[i]), { w: 1.1, d: 0.62, taper: [14, 18], speed: pre ? 1.2 : 2.6, press: 0.45, load: 0.1, gap: pre ? 0.04 : 0.004 });
        }
      }
    }
  };
  ribs(true);
  // nodes: the stem swells a little; a leaf-base wraps it like a sheath, its front edge running up and across
  // the stem to a torn tip that stands off on the far side; a stub of the leaf stalk broken off beside it
  NODES.forEach((tn, ni) => {
    const fdN = ni === 0 ? 1 : 0.6;
    const cy = axis(tn)[1];
    const draw = (pts, w, d, op = {}) => {
      let run = [];
      const flush = () => { if (run.length > 4) { const tnn = run.map((q) => toneS(q[0], q[1])); line(run, tnn.map((v) => (op.wk ?? 0.8) + 0.6 * v), tnn.map((v) => fdN * (0.75 + 0.4 * v)), { w, d, taper: op.taper ?? [6, 10], speed: 0.8 }); } run = []; };
      for (const p of pts) { const g = front(p[0], p[1]); if (g === gStalk || g < 0) run.push(p); else flush(); }
      flush();
    };
    const sd = ni === 0 ? -1 : 1;               // the side the sheath's tip stands off
    const Ls = ni === 0 ? 2.1 : 1.7;
    // the node: a faint, uneven ring where the stem swells
    const ring = [];
    for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI; ring.push([Math.cos(a) * rSt(tn) * 1.06, cy + Math.sin(a) * rSt(tn) * sinA * 1.06 + 0.04 + 0.02 * fnoise(i * 0.4, ni)]); }
    draw(ring.slice(0, 22), 1.3, 0.55, { wk: 0.6 });
    draw(ring.slice(26), 1.3, 0.55, { wk: 0.6 });
    // the sheath: papery, clasping the stem from the node, its back edge standing off the stem as it rises,
    // its front edge wrapping across to a torn point
    const back = [], frontE = [], flareAt = [];
    for (let i = 0; i <= 32; i++) {
      const v = i / 32, y = cy - v * Ls, r = rSt(tOf(y));
      const fl = 0.42 * Math.pow(v, 1.5);
      flareAt.push([sd * r, y, sd * (r + fl)]);
      back.push([sd * (r + fl), y]);
      const k = Math.cos(Math.PI * Math.pow(v, 0.85) * 0.95);          // +1 .. -1: across the front of the stem
      frontE.push([-sd * r * k * (1 + 0.05 * v) + sd * fl * Math.pow(v, 1.5), y + v * v * 0.3 * ryTop]);
    }
    const tipP = [sd * (rSt(tOf(cy - Ls)) + 0.5), cy - Ls - 0.22];
    draw([...back, tipP], 1.8, 0.72, { taper: [6, 4] });
    draw([...frontE, tipP], 1.5, 0.66, { taper: [6, 4] });
    draw([[tipP[0] - sd * 0.03, tipP[1] + 0.12], [tipP[0] + sd * 0.05, tipP[1] + 0.05], [tipP[0] + sd * 0.02, tipP[1] - 0.05]], 0.9, 0.5, { taper: [2, 4] });
    // the dark gap between the stem and the sheath's flare, hatched across
    for (let i = 4; i < 30; i += 2) {
      const [x0, y0, x1] = flareAt[i];
      if (Math.abs(x1 - x0) < 0.05) continue;
      draw([[x0, y0 + 0.02], [(x0 + x1) / 2, y0 - 0.05], [x1 - sd * 0.02, y0 - 0.12]], 1.0, 0.6, { taper: [2, 4], wk: 1.0 });
    }
    // veins of the sheath, running up from the node and ending against its front edge
    for (let k = 0; k < 6; k++) {
      const vk = 0.15 + k * 0.13;
      const pts = [];
      for (let i = 0; i <= 30; i++) {
        const v = i / 30, y = cy - 0.12 - v * Ls * 0.95, r = rSt(tOf(y));
        const fl = 0.42 * Math.pow(v, 1.5);
        const xb = sd * ((r + fl * (1 - vk)) * Math.sin(Math.PI / 2 - vk * 2.4));
        const kf = Math.cos(Math.PI * Math.pow(v, 0.85) * 0.95);
        if (sd * xb < sd * (-sd * r * kf) + 0.03) break;       // past the front edge: the sheath has ended
        pts.push([xb, y]);
      }
      draw(pts, 0.8, 0.38, { taper: [10, 10], wk: 0.6 });
    }
    // the scar of a fallen leaf on the other side: a short torn stub
    const sx = -sd * rSt(tn) * 0.98, syy = cy - 0.05;
    const stubA = [[sx, syy], [sx - sd * 0.25, syy - 0.18], [sx - sd * 0.5, syy - 0.42]];
    const stubB = [[sx, syy - 0.42], [sx - sd * 0.2, syy - 0.55], [sx - sd * 0.42, syy - 0.68]];
    draw(stubA, 1.6, 0.66, { taper: [4, 3] });
    draw(stubB, 1.2, 0.5, { taper: [4, 3] });
    draw([[sx - sd * 0.5, syy - 0.42], [sx - sd * 0.47, syy - 0.52], [sx - sd * 0.52, syy - 0.58], [sx - sd * 0.44, syy - 0.68]], 1.0, 0.6, { taper: [2, 2] });
    for (let k = 0; k < 4; k++) draw([[sx - sd * (0.08 + k * 0.1), syy - 0.06 - k * 0.12], [sx - sd * (0.04 + k * 0.1), syy - 0.2 - k * 0.12]], 0.9, 0.5, { taper: [2, 2], wk: 1 });
  });
  // the cut top: the near rim of the rind (the far rim is the outline), the rind's thickness
  const rt = rSt(tTop);
  const rimNear = [], rimIn = [], rimInFar = [];
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * Math.PI;
    rimNear.push([Math.cos(a) * rt, yTop + Math.sin(a) * ryTop]);
    rimIn.push([Math.cos(a) * rt * 0.8, yTop + Math.sin(a) * ryTop * 0.8]);
    rimInFar.push([Math.cos(a + Math.PI) * rt * 0.8, yTop + Math.sin(a + Math.PI) * ryTop * 0.8]);
  }
  line(rimNear, rimNear.map((p) => 0.7 + 0.6 * clamp(0.5 + p[0] / rt)), rimNear.map(() => 1), { w: 2.2, d: 0.76, taper: [6, 6] });
  line(rimIn, rimIn.map(() => 0.75), rimIn.map(() => 0.8), { w: 1.3, d: 0.55, taper: [6, 6] });
  line(rimInFar, rimInFar.map(() => 0.85), rimInFar.map(() => 0.9), { w: 1.4, d: 0.6, taper: [6, 6] });
  // the rind's ribs show as little notches round the rim; frayed fibres stand up from the cut
  for (let k = 0; k < 13; k++) {
    const a = Math.PI * (k + 0.5) / 13;
    const x0 = Math.cos(a) * rt, y0 = yTop + Math.sin(a) * ryTop;
    line([[x0, y0], [x0 * 0.92, y0 + 0.05], [x0 * 0.9, y0 + 0.11]], [1, 1, 1], [1, 1, 1], { w: 0.9, d: 0.5, taper: [2, 4], speed: 0.4 });
  }
  for (let k = 0; k < 7; k++) {
    const a = D.r(0.15, Math.PI - 0.15) + (k % 2 ? Math.PI : 0);
    const x0 = Math.cos(a) * rt * D.r(0.84, 1.0), y0 = yTop + Math.sin(a) * ryTop * 0.95;
    const h = D.r(0.1, 0.26), lean = D.r(-0.1, 0.1);
    line([[x0, y0], [x0 + lean * 0.4, y0 - h * 0.5], [x0 + lean, y0 - h]], [1, 0.9, 0.6], [1, 1, 1], { w: 0.9, d: 0.5, taper: [2, 6], speed: 0.4 });
  }

  // ---------------- the hand: contours, then tone ----------------
  contourStrokes((C) => C.g !== gStalk);
  contourStrokes((C) => C.g === gStalk);

  // the thumbnail, the cuticle and lunula, and the creases of the skin
  const H2C = (p) => VW.C(p);
  const th = M.thumb;
  const tAx = F.sub(th.tip, th.ip), tL = F.len(tAx), tu = F.norm(tAx);
  const md1 = M.fingers[1].segs[1];
  const outT = F.norm(F.sub(F.lerp3(th.ip, th.tip, 0.6), F.lerp3(md1.a, md1.b, 0.4)));
  let nD = F.add(outT, F.mul(VW.view, 0.6));
  nD = F.norm(F.sub(nD, F.mul(tu, F.dot(nD, tu))));
  const eS = F.cross(tu, nD);
  const onThumb = (sx, ang, k = 1.02) => {
    const r = (0.95 + (0.78 - 0.95) * sx) * k;
    return H2C(F.add(F.lerp3(th.ip, th.tip, sx), F.add(F.mul(nD, Math.cos(ang) * r), F.mul(eS, Math.sin(ang) * r))));
  };
  const visRun = (pts, w, d, op = {}) => {
    let run = [];
    const flush = () => { if (run.length > 3) { const tn = run.map((q) => tone(q[0], q[1])); line(run, tn.map((v) => (op.wk ?? 0.8) + 0.6 * v), tn.map((v) => 0.75 + 0.4 * v), { w, d, taper: op.taper ?? [4, 6], speed: op.speed ?? 0.5 }); } run = []; };
    for (const q of pts) { if (visible(q, op.tol ?? 0.1)) run.push(q); else flush(); }
    flush();
  };
  const NA = 0.82;
  const nail = [];
  for (let i = 0; i <= 16; i++) nail.push(onThumb(0.47 + 0.07 * ((i / 16) * 2 - 1) ** 2, -NA + 2 * NA * (i / 16)));   // cuticle
  for (let i = 0; i <= 18; i++) nail.push(onThumb(0.47 + 0.07 + (0.98 - 0.54) * (i / 18), NA));                     // side
  for (let i = 0; i <= 12; i++) nail.push(onThumb(0.98 + 0.03 * Math.sin(Math.PI * i / 12), NA - 2 * NA * (i / 12)));  // free edge
  for (let i = 0; i <= 18; i++) nail.push(onThumb(0.98 - (0.98 - 0.54) * (i / 18), -NA));
  visRun(nail, 1.5, 0.66);
  const lun = [];
  for (let i = 0; i <= 14; i++) lun.push(onThumb(0.56 + 0.05 * ((i / 14) * 2 - 1) ** 2 * -1 + 0.05, -0.5 + (i / 14)));
  visRun(lun, 0.9, 0.3);
  const fold = [];
  for (let i = 0; i <= 16; i++) fold.push(onThumb(0.42 + 0.06 * ((i / 16) * 2 - 1) ** 2, -1.0 + 2.0 * (i / 16), 1.03));
  visRun(fold, 1.0, 0.36);
  // dorsal wrinkles over the thumb's IP joint
  for (let q = 0; q < 3; q++) {
    const pts = [];
    const sx = -0.06 + q * 0.07;
    for (let i = 0; i <= 14; i++) pts.push(onThumb(sx + 0.03 * Math.sin(i * 0.7 + q), -0.9 + 1.8 * (i / 14) + 0.1 * q, 1.03));
    visRun(pts, 0.9, 0.34);
  }
  // skin over the PIP knuckles: a few faint transverse folds on the dorsum of each middle phalanx's base
  M.fingers.forEach((f, fi) => {
    const sg = f.segs[1], dir = F.norm(F.sub(sg.b, sg.a));
    const nd = F.norm(F.cross(dir, f.A));
    const es = F.cross(dir, nd);
    for (let q = 0; q < 3; q++) {
      const sx = 0.06 + q * 0.07 + D.r(-0.015, 0.015);
      const r = (sg.ra + (sg.rb - sg.ra) * sx) * 1.02;
      const cc = F.lerp3(sg.a, sg.b, sx);
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const ang = -0.75 + 1.5 * (i / 12) + 0.15 * q;
        pts.push(H2C(F.add(cc, F.add(F.mul(nd, Math.cos(ang) * r), F.mul(es, Math.sin(ang) * r)))));
      }
      visRun(pts, 0.85 - 0.1 * q, 0.3, { wk: 0.7 });
    }
  });
  // the wrist's bracelet creases across its palmar side
  {
    const perpR = F.norm(F.sub([1, 0, 0], F.mul(M.df, M.df[0])));
    const perpP = F.norm(F.cross(perpR, M.df));
    for (const [tw, wk] of [[0.55, 0.9], [1.15, 0.6]]) {
      const pts = [];
      for (let i = 0; i <= 30; i++) {
        const ang = -0.9 + 1.8 * (i / 30);
        const cc = F.add([0, 0.9, 0], F.mul(M.df, tw - 0.6));
        const p = F.add(cc, F.add(F.mul(perpP, Math.cos(ang) * 1.62), F.mul(perpR, Math.sin(ang) * 2.45)));
        pts.push(H2C(p));
      }
      let run = [];
      const flush = () => { if (run.length > 4) line(run, run.map(() => wk), run.map((q) => 0.8 * fadeS(q[0], q[1])), { w: 1.15, d: 0.5, taper: [8, 8], speed: 0.6 }); run = []; };
      for (const q of pts) { if (front(q[0], q[1]) === M.gPalm && visible(q, 0.4)) run.push(q); else flush(); }
      flush();
    }
  }

  // tone: Leonardo's parallel hatching from the upper left, in passes that deepen into the core shadows
  const handTone = (x, y) => (front(x, y) === gStalk && y < stalkHatchTop ? 0 : tone(x, y));
  const fleshTone = (x, y) => (front(x, y) === gStalk ? 0 : tone(x, y));
  // (tone is eased so the half-tones stay open and the passes gather in the core shadows)
  const ease = (f) => (x, y) => Math.pow(f(x, y), 1.25);
  shadeHatch(ease(fleshTone), { thr: [0.1, 0.55], sp: 4.2, d: 0.56, w: 1.45, maxLen: 64, jit: 0.25, bow: 0.025 });
  shadeHatch((x, y) => Math.pow(handTone(x, y), 1.5), { thr: [0.42, 0.85], sp: 4.2, d: 0.6, w: 1.5, angle: 0.99, jit: 0.25, maxLen: 52, bow: 0.025 });
  shadeHatch((x, y) => Math.pow(handTone(x, y), 1.5), { thr: [0.82, 1.0], sp: 5.0, d: 0.5, w: 1.4, angle: 0.95 - 1.05, maxLen: 18, jit: 0.4 });
  // a rubbed ground under the darkest passages
  shadeHatch(ease(handTone), { thr: [0.55, 0.92], sp: 7, d: 0.26, w: 7, maxLen: 40, angle: 0.85, bow: 0.02 });
  // cross-contour strokes round the fingers and the thumb in their half-shadows
  for (const B of M.bones) {
    if (!B.finger) continue;
    let e1, e2, k1 = 1, k2 = 1;
    if (B.lat) { e1 = VW.Cd(B.lat); e2 = VW.Cd(B.dors); k1 = B.wk; k2 = B.dk; }
    else { const u = F.norm(F.sub(B.b, B.a)); e1 = F.norm(F.cross(u, [0, 0, 1])); e2 = F.cross(u, e1); e1 = VW.Cd(e1); e2 = VW.Cd(e2); }
    rings({ ...B, a: VW.C(B.a), b: VW.C(B.b), e1, e2, k1, k2 }, { thr: [0.35, 0.8], step: 0.16, d: 0.5, w: 1.4 });
  }

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

  // ---------------- during the shot: the top of the stalk shaded and scorched, the flame, the theft ----------------
  D.at(0.0);
  const topTone = (x, y) => {
    if (front(x, y) !== gStalk || y >= stalkHatchTop || y < yTop - ryTop) return 0;
    return Math.min(1, tone(x, y) + 0.5 * Math.exp(-(y - yTop) / 0.9));   // scorched below the cut
  };
  const bbTop = (() => { const a = T(-rt - 0.3, yTop - 0.5), b = T(rt + 0.3, stalkHatchTop + 0.2), cc = T(-rt - 0.3, stalkHatchTop + 0.2), d = T(rt + 0.3, yTop - 0.5); return [Math.min(a[0], b[0], cc[0], d[0]), Math.min(a[1], b[1], cc[1], d[1]), Math.max(a[0], b[0], cc[0], d[0]), Math.max(a[1], b[1], cc[1], d[1])]; })();
  ribs(false);
  shadeHatch(topTone, { bb: bbTop, thr: [0.45, 0.9], sp: 4.6, d: 0.5, w: 1.6, speed: 2.4, angle: 1.03, maxLen: 26 });
  // the pith: spongy, flecked, darkened where the ember sits
  for (let k = 0; k < 34; k++) {
    const a = D.r(0, TAU), rr = Math.sqrt(D.rnd()) * 0.74;
    const x = Math.cos(a) * rt * rr, y = yTop + Math.sin(a) * ryTop * rr;
    const l = D.r(0.03, 0.09), an = D.r(-0.5, 0.5) + (D.rnd() < 0.5 ? 0 : Math.PI);
    const dk = 0.45 + 0.4 * (1 - rr);                          // darker toward the ember at the centre
    line([[x, y], [x + Math.cos(an) * l * 0.5, y + Math.sin(an) * l * 0.25], [x + Math.cos(an) * l, y + Math.sin(an) * l * 0.4]], [1, 1, 1], [1, 1, 1], { w: D.r(0.9, 1.5), d: dk, taper: [2, 3], speed: 0.3, gap: 0.01 });
  }
  D.fitTo(preT, 0.0, 0.75);

  // ---------------- the flame: tongues rising out of the pith, modelled in chalk ----------------
  const base = T(0, yTop);
  const flame = { x: base[0], y: base[1] - 0.004 };
  const FSC = 1.0;
  const FP = ([x, yu]) => [flame.x + x * FSC, flame.y - yu * FSC];   // flame frame: y up, fire rises vertically
  const fstroke = (pts, wf, df, op) => {
    const P = resample(pts.map(FP), 1.3 * PX);
    const it = D.stroke(P, { ...CH, press: 0.35, pfreq: 10, load: 0.12, ...op, w: (op.w ?? 2) * 1.45 });
    if (it && wf) for (let i = 0; i < it.W.length; i++) { const u = i / (it.W.length - 1); it.W[i] *= wf(u); it.D[i] = clamp(it.D[i] * df(u)); }
    return it;
  };
  const bez = (p0, p1, p2, p3, n = 40) => {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, a = (1 - t) ** 3, b = 3 * (1 - t) ** 2 * t, cc = 3 * (1 - t) * t * t, d = t ** 3;
      out.push([p0[0] * a + p1[0] * b + p2[0] * cc + p3[0] * d, p0[1] * a + p1[1] * b + p2[1] * cc + p3[1] * d]);
    }
    return out;
  };
  D.at(0.65);
  const m0 = D.mark();
  // the root: short dark strokes where the fire leaves the pith, hugging the mouth of the stalk
  for (let k = 0; k < 6; k++) {
    const x0 = -0.02 + 0.04 * (k + D.r(0.1, 0.9)) / 6, h = D.r(0.012, 0.026), bend = D.r(-0.008, 0.008);
    fstroke(bez([x0, 0.0], [x0 + bend * 0.3, h * 0.4], [x0 * 0.85 + bend, h * 0.75], [x0 * 0.7 + bend * 1.4, h], 12), (u) => 1.1 - 0.5 * u, () => 1, { w: 1.4, d: 0.62, speed: 0.2, taper: [3, 10], gap: 0.006 });
  }
  // one body of fire: a swelling root that parts into tongues, each with its own sway and a curled tip.
  // tips: [x, y] in the flame frame (y up), with the sway of the tongue (+ bends right) and its width at
  // the notch; the body's outline runs from the root up each tongue and down into the notch beside it
  const TIPS = [
    { tip: [-0.064, 0.142], sw: -0.012, nb: [-0.046, 0.082] },
    { tip: [-0.03, 0.232], sw: 0.016, nb: [-0.018, 0.118] },
    { tip: [0.016, 0.178], sw: -0.014, nb: [0.012, 0.11] },
    { tip: [0.056, 0.128], sw: 0.012, nb: [0.046, 0.078] },
  ];
  const BL = [-0.027, 0.0], BR = [0.027, 0.0];
  // outline: left flank, then each tongue up and down, then the right flank
  
  TIPS.forEach((T0, i) => {
    const nL = i === 0 ? TIPS[0].nb : TIPS[i - 1].nbR ?? TIPS[i].nb;
    const nR = i < TIPS.length - 1 ? [(TIPS[i].tip[0] + TIPS[i + 1].tip[0]) / 2 + T0.sw * 0.3, Math.min(TIPS[i].tip[1], TIPS[i + 1].tip[1]) * 0.62] : TIPS[i].nb;
    T0.nbR = nR;
    const up = bez(i === 0 ? TIPS[0].nb : TIPS[i - 1].nbR, [nL[0] + T0.sw * 1.5 - 0.006, nL[1] + (T0.tip[1] - nL[1]) * 0.45], [T0.tip[0] - T0.sw * 1.2 - 0.004, T0.tip[1] - (T0.tip[1] - nL[1]) * 0.25], T0.tip, 24);
    const dn = bez(T0.tip, [T0.tip[0] - T0.sw * 0.6 + 0.006, T0.tip[1] - (T0.tip[1] - nR[1]) * 0.35], [nR[0] + T0.sw * 1.2 + 0.004, nR[1] + (T0.tip[1] - nR[1]) * 0.4], nR, 24);
    T0.up = up; T0.dn = dn;
  });
  // draw each tongue's two edges, root to tip (fire is drawn the way it rises)
  const fl = (pts, w, d, sp = 0.45) => fstroke(pts, (u) => 0.5 + 0.8 * Math.sin(Math.PI * Math.min(1, u * 1.15)), () => 1, { w, d, speed: sp, taper: [10, 30], gap: 0.004 });
  fl(bez(BL, [-0.036, 0.018], [-0.044, 0.05], TIPS[0].nb, 24), 2.4, 0.84);
  fl(bez(BR, [0.036, 0.016], [0.044, 0.045], TIPS[3].nb, 24), 2.7, 0.9);
  TIPS.forEach((T0, i) => {
    fl(T0.up, i === 1 ? 2.5 : 2.1, 0.82);
    fl(T0.dn.slice().reverse(), i === 1 ? 2.7 : 2.3, 0.86);
  });
  // streamlines: from the root, spread across it, fanning to each tip; dark toward the outer flanks and the
  // root, the hot core left bare
  TIPS.forEach((T0, i) => {
    const n = i === 1 ? 5 : 3;
    for (let k = 0; k < n; k++) {
      const f = (k + 0.5) / n;                                   // 0 = this tongue's left edge .. 1 = right
      const outer = i === 0 ? 1 - f : i === TIPS.length - 1 ? f : Math.abs(f - 0.5) * 2 * 0.8;
      const bx = BL[0] + (BR[0] - BL[0]) * ((i + f) / TIPS.length) * 1.0;
      const nL = i === 0 ? TIPS[0].nb : TIPS[i - 1].nbR, nR = T0.nbR;
      const mid = [nL[0] + (nR[0] - nL[0]) * f, nL[1] + (nR[1] - nL[1]) * f];
      const tgt = [T0.tip[0] + (f - 0.5) * 0.008, T0.tip[1] - D.r(0.012, 0.04)];
      const p0 = [bx, D.r(0.006, 0.03) + (1 - outer) * 0.035];
      const wv = D.r(-0.01, 0.01);
      const pts = bez(p0, [p0[0] * 0.5 + mid[0] * 0.5 - T0.sw * 0.8 + wv, p0[1] + (mid[1] - p0[1]) * 0.7], [mid[0] + T0.sw * (1.4 + f * 0.8) - wv, mid[1] + (tgt[1] - mid[1]) * 0.45], tgt, 36);
      const d = 0.34 + 0.5 * outer;
      fstroke(pts, (u) => 0.4 + 0.7 * Math.sin(Math.PI * u), (u) => 0.45 + 0.6 * Math.sin(Math.PI * Math.min(1, u * 1.6)), { w: 1.3 + 0.4 * outer, d, speed: 0.8, taper: [10, 26], gap: 0.004 });
    }
  });
  // tone inside the fire: hatched along its rise, dense at the flanks and down in the notches between the
  // tongues, thinning to nothing in the hot core
  {
    const poly = [...bez(BL, [-0.036, 0.018], [-0.044, 0.05], TIPS[0].nb, 24)];
    TIPS.forEach((T0) => { poly.push(...T0.up, ...T0.dn); });
    poly.push(...bez(BR, [0.036, 0.016], [0.044, 0.045], TIPS[3].nb, 24).reverse());
    const P = poly.map(FP);
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const [x, y] of P) { bx0 = Math.min(bx0, x); by0 = Math.min(by0, y); bx1 = Math.max(bx1, x); by1 = Math.max(by1, y); }
    const inside = (x, y) => {
      let c2 = false;
      for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
        const [xi, yi] = P[i], [xj, yj] = P[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c2 = !c2;
      }
      return c2;
    };
    const edgeD = (x, y) => {
      let m = 1e9;
      for (let i = 0; i < P.length - 1; i += 2) m = Math.min(m, Math.hypot(P[i][0] - x, P[i][1] - y));
      return m;
    };
    const fTone = (x, y) => {
      if (!inside(x, y)) return 0;
      const d = edgeD(x, y) / FSC, yu = (flame.y - y) / FSC;
      return Math.min(1, Math.exp(-d / 0.016) * 1.0 + 0.45 * sm(0.05, 0.0, yu) + 0.25 * sm(0.12, 0.2, yu));
    };
    hatch(D, fTone, [bx0, by0, bx1, by1], { kind: 'chalk', angle: -1.5, sp: 3.4, w: 1.4, d: 0.66, maxLen: 30, speed: 1.6, gap: 0.003, bow: 0.06, wet: false, nib: 0, thr: [0.25, 0.85], flip: true });
  }
  // flickers torn free above, sparks
  const lick = (x, y, h, sw, w = 1.6) => {
    const L = bez([x, y], [x + sw, y + h * 0.35], [x - sw * 0.6, y + h * 0.7], [x + sw * 0.4, y + h], 20);
    const Rr = bez([x + 0.006, y + 0.002], [x + sw + 0.008, y + h * 0.35], [x - sw * 0.5 + 0.004, y + h * 0.66], [x + sw * 0.4, y + h], 20);
    fl(L, w, 0.7, 0.3); fl(Rr, w * 1.1, 0.75, 0.3);
  };
  lick(-0.05, 0.19, 0.05, -0.012);
  lick(0.02, 0.215, 0.04, 0.01, 1.4);
  for (let k = 0; k < 7; k++) {
    const x = D.r(-0.07, 0.06), y = D.r(0.2, 0.27), a = D.r(1.2, 1.9), l = D.r(0.004, 0.01);
    fstroke([[x, y], [x + Math.cos(a) * l, y + Math.sin(a) * l]], null, null, { w: 1.4, d: 0.7, speed: 0.15, taper: [2, 2], gap: 0.03 });
  }
  // smoke curling off the tip
  const tip = [-0.04, 0.245];
  for (let k = 0; k < 3; k++) {
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const v = i / 60;
      pts.push([tip[0] + k * 0.014 - 0.035 * v + 0.012 * Math.sin(v * 9 + k * 2) * (0.3 + v), tip[1] + 0.01 * k + v * 0.05]);
    }
    fstroke(pts, (u) => 0.9 - 0.5 * u, (u) => 0.85 - 0.6 * u, { w: 1.3, d: 0.42, speed: 0.25, taper: [10, 30], press: 0.5, gap: 0.02 });
  }
  D.fitTo(m0, 0.45, 2.1);

  // the arc that links the large circle to the small one: the real ballistic stream from L1
  const arcS = streamPath({ maxT: 1.36, every: 10 }).map((q) => Pb(q.x, q.z));
  D.at(2.15);
  D.stroke(resample(arcS, 1.5 * PX), { ...CH, w: 2.8, d: 0.58, dur: 0.8, taper: [10, 20], press: 0.3 });
  if (V) D.text('dal grande al picholo', 0.105, gc[1] + 0.085, { size: 17, d: 0.56, kind: 'chalk', t0: 2.95, dur: 0.5 });
  else D.text('dal grande al picholo', gc[0] + 0.19, gc[1] + 0.145, { size: 17, d: 0.56, kind: 'chalk', t0: 2.95, dur: 0.5 });
  D.flame = [flame.x - 0.008, flame.y - 0.1];
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
