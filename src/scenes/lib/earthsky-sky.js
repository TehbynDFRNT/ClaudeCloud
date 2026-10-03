// Earth sky (coda) geometry, computed once in JS: the locked-off camera, the galactic frame, real bright
// stars, the new star's sky position and the tree silhouettes.
//
// Screen space "s": reference pixels of a 1080x1920 frame, origin at the frame centre, x right, y up
// (so the frame spans x in [-540, 540], y in [-960, 960] in portrait). Every sky feature lives in s at
// zoom 1; the slow push scales s about an anchor, so the whole sky (and the silhouette) moves as one.
import { mulberry32 } from '../../engine/rng.js';

const D2R = Math.PI / 180;
const v = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
};

// Real bright stars near the Sagittarius / Scorpius / Aquila stretch of the plane (galactic l, b in degrees,
// V magnitude, colour temperature K). Approximate positions; only their arrangement matters on screen.
export const BRIGHT_STARS = [
  ['Altair', 47.74, -8.91, 0.76, 7700],
  ['Antares', 351.95, 15.06, 1.06, 3500],
  ['Shaula', 351.74, -2.21, 1.62, 22000],
  ['Kaus Australis', 359.14, -9.83, 1.85, 10000],
  ['Sargas', 347.14, -5.98, 1.86, 7200],
  ['Nunki', 9.56, -12.43, 2.05, 18000],
  ['Rasalhague', 35.9, 22.6, 2.08, 8000],
  ['Sabik', 6.7, 14.0, 2.43, 8900],
  ['Ascella', 6.0, -15.4, 2.60, 9000],
  ['Kaus Media', 2.6, -6.1, 2.70, 4300],
  ['Kaus Borealis', 7.0, -6.6, 2.81, 4700],
  ['Alnasl', 0.9, -4.4, 2.98, 4800],
  ['Tarazed', 47.4, -7.0, 2.72, 4100],
  ['Eta Ser', 26.9, 5.6, 3.26, 4800],
  ['Theta Oph', 0.5, 6.6, 3.27, 21000],
  ['Xi Ser', 15.9, 10.2, 3.54, 7500],
];

function galToDir(G, l, b) {
  const L = l * D2R, B = b * D2R;
  return v.norm(v.add(v.add(v.mul(G.c, Math.cos(B) * Math.cos(L)), v.mul(G.t, Math.cos(B) * Math.sin(L))), v.mul(G.n, Math.sin(B))));
}

// Build the whole rig from preset params. p: { fov, horizonY, coreAlt, coreX, tilt, nova: [x, y] (frame fractions,
// y from top), anchor: [x, y] }
export function buildSky(p, aspect) {
  const tanH = Math.tan((p.fov * D2R) / 2);
  const sHalfX = 960 * aspect;                       // s half-width of the frame
  // horizon at frame fraction horizonY (from top): uv.y = 1 - 2*horizonY, pitch so that the
  // mathematical horizon (altitude 0) lands there
  const uvH = 1 - 2 * p.horizonY;
  const pitch = Math.atan(-uvH * tanH);
  const cam = {
    r: [1, 0, 0],
    u: [0, Math.cos(pitch), -Math.sin(pitch)],
    f: [0, Math.sin(pitch), Math.cos(pitch)],
  };
  const sOf = (uvx, uvy) => [uvx * sHalfX, uvy * 960];
  const dirOfS = (s) => v.norm(v.add(v.add(v.mul(cam.r, (s[0] / 960) * tanH), v.mul(cam.u, (s[1] / 960) * tanH)), cam.f));
  const sOfDir = (d) => { const z = v.dot(d, cam.f); if (z <= 1e-4) return null; return [(v.dot(d, cam.r) / z / tanH) * 960, (v.dot(d, cam.u) / z / tanH) * 960]; };

  // galactic centre: altitude coreAlt, azimuth chosen so it sits at frame x = coreX
  const A = p.coreAlt * D2R;
  const dirAzAlt = (az, alt) => [Math.sin(az) * Math.cos(alt), Math.sin(alt), Math.cos(az) * Math.cos(alt)];
  const targetSx = (p.coreX * 2 - 1) * sHalfX;
  let lo = -1.2, hi = 1.2;
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; const s = sOfDir(dirAzAlt(m, A)); if (s && s[0] < targetSx) lo = m; else hi = m; }
  const coreAz = (lo + hi) / 2;
  const c = v.norm([Math.sin(coreAz) * Math.cos(A), Math.sin(A), Math.cos(coreAz) * Math.cos(A)]);
  const up = v.norm(v.add([0, 1, 0], v.mul(c, -c[1])));
  const right = v.norm(v.cross(up, c));
  const tl = p.tilt * D2R;
  const t = v.norm(v.add(v.mul(up, Math.cos(tl)), v.mul(right, Math.sin(tl))));   // +l: up the band, leaning right
  const n = v.norm(v.add(v.mul(right, Math.cos(tl)), v.mul(up, -Math.sin(tl))));  // +b: right of the band
  const G = { c, t, n };

  const toGal = (d) => {
    const b = Math.asin(Math.max(-1, Math.min(1, v.dot(d, n)))) / D2R;
    let l = Math.atan2(v.dot(d, t), v.dot(d, c)) / D2R;
    return [l, b];
  };

  // the new star: a fixed frame position (fractions, y from top) -> s, sky direction, galactic coords
  const novaS = sOf(p.nova[0] * 2 - 1, 1 - 2 * p.nova[1]);
  const novaDir = dirOfS(novaS);
  const novaGal = toGal(novaDir);
  const anchorS = sOf(p.anchor[0] * 2 - 1, 1 - 2 * p.anchor[1]);

  // bright catalogue stars projected into s (vec4: sx, sy, magnitude, temperature)
  const bright = [];
  for (const [name, l, b, mag, T] of BRIGHT_STARS) {
    const s = sOfDir(galToDir(G, l, b));
    if (!s) continue;
    if (Math.abs(s[0]) > sHalfX + 60 || Math.abs(s[1]) > 1020) continue;
    bright.push({ name, s, mag, T });
  }

  return { tanH, pitch, cam, G, sHalfX, novaS, novaDir, novaGal, anchorS, bright, toGal, dirOfS, sOfDir };
}

// ---------------------------------------------------------------------------------------------------
// Tree silhouettes (sparse eucalypts on the ridge). Deterministic limbs + foliage clumps, in s.
// Two habits:
//  - a living gum (leaf > 0): a short trunk that splits into 2-3 sinuous leaders of unequal length that
//    spread and turn up; one or two side limbs leave each leader, mostly to the outside; the foliage hangs
//    in separate drooping masses at the limb ends, at different heights, with sky between them and the odd
//    bare dead tip, so the crown is open and uneven (not a flat canopy);
//  - a dead gum (leaf == 0): a gnarled trunk with uneven arms, broken blunt stubs and a few dead twigs.
// Returns { segs: [x0,y0,x1,y1]*, rads: [r0,r1,0,0]*, clumps: [x,y,r,seed]*, boxes: [minx,miny,maxx,maxy]* }
export function buildTrees(trees) {
  const segs = [], rads = [], clumps = [], boxes = [];
  for (const T of trees) {
    const rnd = mulberry32(T.seed);
    const R = (a, b) => a + (b - a) * rnd();
    const box = [1e9, 1e9, -1e9, -1e9];
    const grow = (x, y, r = 0) => { box[0] = Math.min(box[0], x - r); box[1] = Math.min(box[1], y - r); box[2] = Math.max(box[2], x + r); box[3] = Math.max(box[3], y + r); };
    const seg = (x0, y0, x1, y1, r0, r1) => { segs.push([x0, y0, x1, y1]); rads.push([r0, r1, 0, 0]); grow(x0, y0, r0); grow(x1, y1, r1); };
    const clump = (x, y, r) => { clumps.push([x, y, r, rnd() * 100]); grow(x, y, r * 1.6); };
    // a wandering limb of n segments from (x, y), angle a (radians from vertical, + = right), radius r0 -> r1.
    // straighten < 1 bends it back toward the vertical (the ascending eucalypt habit). Returns the joints.
    const limb = (x, y, a, len, r0, r1, n, wander, straighten) => {
      const pts = [[x, y, a, r0]];
      let cx = x, cy = y;
      for (let k = 0; k < n; k++) {
        const l = (len / n) * R(0.8, 1.2);
        const nx = cx + Math.sin(a) * l, ny = cy + Math.cos(a) * l;
        const ra = r0 + (r1 - r0) * (k / n), rb = r0 + (r1 - r0) * ((k + 1) / n);
        seg(cx, cy, nx, ny, ra, rb);
        cx = nx; cy = ny;
        a = a * straighten + (rnd() - 0.5) * wander;
        pts.push([cx, cy, a, rb]);
      }
      return pts;
    };
    const H = T.h, hs = H * T.bole;
    if (T.leaf > 0) {
      // ---- a living gum
      const minR = T.minClump ?? 4.5;
      // a foliage mass: a few overlapping clumps in a wide, drooping knot (gums carry their leaves in
      // separate masses at the ends of the limbs, with sky between them)
      const mass = (x, y, a, scale) => {
        const n = 4 + (rnd() < 0.6 ? 1 : 0) + (scale > 0.95 ? 1 : 0);
        const M = H * 0.075 * T.leaf * scale;                 // mass half-width
        for (let i = 0; i < n; i++) {
          const r = Math.max(minR, M * R(0.62, 0.95));
          const u = n === 1 ? 0 : i / (n - 1) - 0.5;
          clump(x + Math.sin(a) * M * 0.3 + u * M * 1.9 + R(-0.25, 0.25) * M, y + R(-0.7, 0.15) * M - Math.abs(u) * M * 0.5, r);
        }
      };
      const trunk = limb(T.x, T.y - 6, T.lean * 0.5, hs + 6, T.trunk * 1.15, T.trunk * 0.82, 2, 0.16, 1.0);
      const [tx, ty, ta] = trunk[trunk.length - 1];
      const nL = T.leaders ?? 3;
      for (let i = 0; i < nL; i++) {
        const f = nL === 1 ? 0 : i / (nL - 1) - 0.5;
        const a = ta + f * T.spread + R(-0.12, 0.12);
        const len = (H - hs) * (Math.abs(f) < 0.2 ? R(0.72, 0.85) : R(0.55, 0.78));   // unequal leaders
        // outer leaders keep their spread (a broad crown) and turn up only a little
        const pts = limb(tx, ty, a, len, T.trunk * (0.78 - 0.06 * Math.abs(f)), T.trunk * 0.22, 3, T.wander ?? 0.4, 0.9);
        // one or two side limbs from the upper joints, mostly to the outside, each ending in a mass
        const nS = rnd() < (T.branchy ?? 0.6) ? 2 : 1;
        for (let j = 0; j < nS; j++) {
          const k = j === 0 ? 1 + Math.floor(rnd() * 2) : (rnd() < 0.5 ? 1 : 2);
          const [px, py, pa, pr] = pts[k];
          const side = f !== 0 ? (j === 0 ? Math.sign(f) : -Math.sign(f)) : (j === 0 ? 1 : -1) * (rnd() < 0.5 ? 1 : -1);
          const sa = pa + side * R(0.65, 1.1);
          const sl = H * R(0.12, 0.2);
          const sp = limb(px, py, sa, sl, Math.max(0.6, pr * 0.6), 0.5, 2, 0.4, 0.92);
          const [ex, ey, ea] = sp[sp.length - 1];
          if (rnd() > (T.gaps ?? 0.12)) mass(ex, ey, ea, R(0.7, 0.95));
          else limb(ex, ey, ea, H * 0.05, 0.5, 0.45, 1, 0.3, 1.0);   // a bare dead tip: sky through the crown
        }
        const [ex, ey, ea] = pts[pts.length - 1];
        mass(ex, ey, ea, R(0.9, 1.15));
      }
    } else {
      // ---- a dead gum
      const G = T.gnarl ?? 0.6;
      const stub = (p, a, len, r0) => seg(p[0], p[1], p[0] + Math.sin(a) * len, p[1] + Math.cos(a) * len, r0, r0 * 0.8);   // broken: blunt end
      const twigs = (p, a, len, r0) => {
        for (let i = 0; i < 2; i++) limb(p[0], p[1], a + (i ? 1 : -1) * R(0.3, 0.7), len * R(0.6, 1.0), r0, 0.45, rnd() < 0.5 ? 1 : 2, 0.6, 0.95);
      };
      const trunk = limb(T.x, T.y - 6, T.lean, hs + 6, T.trunk * 1.15, T.trunk * 0.8, 3, 0.16 * G, 1.0);
      // a broken limb low on the trunk
      const tp = trunk[2];
      stub(tp, tp[2] + (rnd() < 0.5 ? -1 : 1) * R(0.9, 1.25), H * R(0.06, 0.09), tp[3] * 0.5);
      const [tx, ty, ta, tr] = trunk[trunk.length - 1];
      const arms = [
        { a: ta + 0.12 + R(-0.1, 0.1), len: (H - hs) * R(0.85, 1.0), broken: false },     // the main stem, on up
        { a: ta - 0.75 * T.spread + R(-0.15, 0.1), len: (H - hs) * R(0.55, 0.7), broken: false },
        { a: ta + 0.85 * T.spread + R(-0.1, 0.1), len: (H - hs) * R(0.22, 0.32), broken: true },   // snapped short
      ];
      for (const A of arms) {
        const r1 = A.broken ? tr * 0.55 : 0.8;
        const pts = limb(tx, ty, A.a, A.len, tr * (A.broken ? 0.6 : 0.78), r1, A.broken ? 1 : 3, 0.5 * G, 0.92);
        if (A.broken) continue;
        // a stub or two along the arm, and dead twigs at the tip
        for (let k = 1; k < pts.length - 1; k++) {
          const p = pts[k];
          if (rnd() < 0.75) stub(p, p[2] + (k % 2 ? 1 : -1) * R(0.7, 1.2), H * R(0.04, 0.08), Math.max(0.9, p[3] * 0.55));
        }
        const e = pts[pts.length - 1];
        twigs(e, e[2], H * R(0.07, 0.11), Math.max(0.6, e[3] * 0.8));
      }
    }
    boxes.push([box[0] - 3, box[1] - 3, box[2] + 3, box[3] + 3]);
  }
  return { segs, rads, clumps, boxes };
}
