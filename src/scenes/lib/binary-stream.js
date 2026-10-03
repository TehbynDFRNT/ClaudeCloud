// JS side of the system-scale mass stream (binary scene): the ballistic L1 stream resampled by arc length,
// a signed-distance field over the orbital plane for the shader, and helpers shared by cameras and overlays.
// Everything here is precomputed once (deterministic) from lib/binary.js.
import { streamPath, L1, XW, XG, WD, GIANT, lobeContour, R_CIRC } from './binary.js';

// Field domain in the orbital plane (x, z) and its resolution. Texel centres at x0 + (i + 0.5) * dx.
export const FIELD = { x0: -0.46, x1: 0.66, z0: -0.30, z1: 0.36, nx: 560, nz: 330 };

const VMIN = 0.16;      // floor on the speed used for texture advection (keeps L1 features from collapsing)

// Ballistic stream from L1, resampled uniformly in arc length.
// Each point: { x, z, s (arc length from L1), tau (ballistic time), tv (visual advection time), v (speed), tx, tz }
// A short straight run is prepended inside the giant (s < 0) so the stream's base continues into the envelope.
export function buildPath({ tauStop = 1.40, ds = 0.0028 } = {}) {
  const raw = streamPath({ every: 2, maxT: tauStop, rStop: 0.005 });
  const cum = [0];
  for (let i = 1; i < raw.length; i++) cum.push(cum[i - 1] + Math.hypot(raw[i].x - raw[i - 1].x, raw[i].z - raw[i - 1].z));
  const total = cum[cum.length - 1];
  const pts = [];
  // base inside the giant: from x = L1 - 0.12 to the first sample
  const x0 = raw[0].x;
  for (let s = -0.12; s < 0; s += ds) pts.push({ x: x0 + s, z: 0, s, tau: 0, v: raw[0].vx, tx: 1, tz: 0 });
  let j = 0;
  for (let s = 0; s <= total; s += ds) {
    while (j < raw.length - 2 && cum[j + 1] < s) j++;
    const u = (s - cum[j]) / Math.max(1e-9, cum[j + 1] - cum[j]);
    const a = raw[j], b = raw[j + 1];
    const L = (k) => a[k] + (b[k] - a[k]) * u;
    pts.push({ x: L('x'), z: L('z'), s, tau: L('t'), v: Math.hypot(L('vx'), L('vz')), tx: 0, tz: 0 });
  }
  // tangents
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const l = Math.hypot(b.x - a.x, b.z - a.z) || 1;
    pts[i].tx = (b.x - a.x) / l; pts[i].tz = (b.z - a.z) / l;
  }
  // visual advection times: tv = integral of ds / max(v, VMIN) (features stretch with the flow, fine streaks);
  // tw = integral of ds / sqrt(max(v, VMIN)) (gentler stretch, for the large sheets). Negative inside the giant.
  let tv = 0, tw = 0;
  const i0 = pts.findIndex((p) => p.s >= 0);
  for (let i = i0; i < pts.length; i++) {
    if (i > i0) {
      const vm = Math.max(VMIN, 0.5 * (pts[i].v + pts[i - 1].v)), dsi = pts[i].s - pts[i - 1].s;
      tv += dsi / vm; tw += dsi / Math.sqrt(vm);
    }
    pts[i].tv = tv; pts[i].tw = tw;
  }
  for (let i = i0 - 1; i >= 0; i--) { pts[i].tv = pts[i].s / VMIN; pts[i].tw = pts[i].s / Math.sqrt(VMIN); }
  // pericentre (closest approach to the dwarf)
  let peri = 0, best = 9;
  pts.forEach((p, i) => { const r = Math.hypot(p.x - XW, p.z); if (r < best) { best = r; peri = i; } });
  return { pts, total, peri, sPeri: pts[peri].s, rPeri: best };
}

// Signed distance field: r = signed in-plane distance to the centreline (+ toward the dwarf / inner side),
// g = arc length s of the nearest point, b = visual advection time tv, a = gentler advection time tw.
export function buildField(path, F = FIELD) {
  const P = path.pts;
  const n = P.length - 1;
  const ax = new Float32Array(n), az = new Float32Array(n), ex = new Float32Array(n), ez = new Float32Array(n), il = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    ax[k] = P[k].x; az[k] = P[k].z; ex[k] = P[k + 1].x - P[k].x; ez[k] = P[k + 1].z - P[k].z;
    il[k] = 1 / (ex[k] * ex[k] + ez[k] * ez[k]);
  }
  // inner side: the dwarf lies on the side where cross(e, D - a) has this sign at pericentre
  const kp = Math.min(n - 1, path.peri);
  const inner = Math.sign(ex[kp] * (0 - az[kp]) - ez[kp] * (XW - ax[kp])) || 1;
  const data = new Float32Array(F.nx * F.nz * 4);
  const dx = (F.x1 - F.x0) / F.nx, dz = (F.z1 - F.z0) / F.nz;
  let o = 0;
  for (let j = 0; j < F.nz; j++) {
    const z = F.z0 + (j + 0.5) * dz;
    for (let i = 0; i < F.nx; i++) {
      const x = F.x0 + (i + 0.5) * dx;
      let best = 1e9, bk = 0, bu = 0, bc = 0;
      for (let k = 0; k < n; k++) {
        const px = x - ax[k], pz = z - az[k];
        let u = (px * ex[k] + pz * ez[k]) * il[k];
        u = u < 0 ? 0 : u > 1 ? 1 : u;
        const qx = px - ex[k] * u, qz = pz - ez[k] * u;
        const d2 = qx * qx + qz * qz;
        if (d2 < best) { best = d2; bk = k; bu = u; bc = ex[k] * pz - ez[k] * px; }
      }
      const a = P[bk], b = P[bk + 1];
      data[o++] = Math.sqrt(best) * (Math.sign(bc) * inner || 1);
      data[o++] = a.s + (b.s - a.s) * bu;
      data[o++] = a.tv + (b.tv - a.tv) * bu;
      data[o++] = a.tw + (b.tw - a.tw) * bu;
    }
  }
  return data;
}

// Interpolate the path at arc length s or at ballistic time tau.
export function pathAtS(path, s) {
  const P = path.pts;
  if (s <= P[0].s) return P[0];
  if (s >= P[P.length - 1].s) return P[P.length - 1];
  let lo = 0, hi = P.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (P[m].s <= s) lo = m; else hi = m; }
  const a = P[lo], b = P[hi], u = (s - a.s) / (b.s - a.s);
  const o = {};
  for (const k of ['x', 'z', 's', 'tau', 'tv', 'tw', 'v', 'tx', 'tz']) o[k] = a[k] + (b[k] - a[k]) * u;
  return o;
}
export function sAtTau(path, tau) {
  const P = path.pts;
  const i0 = P.findIndex((p) => p.s >= 0);
  if (tau <= 0) return 0;
  for (let i = i0 + 1; i < P.length; i++) {
    if (P[i].tau >= tau) { const a = P[i - 1], b = P[i]; return a.s + (b.s - a.s) * (tau - a.tau) / Math.max(1e-9, b.tau - a.tau); }
  }
  return P[P.length - 1].s;
}
// first arc length (after L1) where the stream comes within radius r of the dwarf
export function sAtDwarfRadius(path, r) {
  const P = path.pts;
  for (let i = 1; i < P.length; i++) {
    const r0 = Math.hypot(P[i - 1].x - XW, P[i - 1].z), r1 = Math.hypot(P[i].x - XW, P[i].z);
    if (P[i].s > 0 && r0 >= r && r1 < r) return P[i - 1].s + (P[i].s - P[i - 1].s) * (r0 - r) / Math.max(1e-9, r0 - r1);
  }
  return P[P.length - 1].s;
}

// ---- giant occlusion (for hidden-line rendering of overlays) -----------------------------------------
// Same shape law as lib/giant.glsl.js giantRadius() without relief.
export function giantRadiusJS(n, R, bulge, dir = [1, 0, 0]) {
  const m = Math.max(0, n[0] * dir[0] + n[1] * dir[1] + n[2] * dir[2]);
  return R * (1 + bulge * Math.pow(m, 5) + bulge * 0.15 * m);
}
// true if the segment camera -> p passes through the giant before reaching p
export function occludedByGiant(camPos, p, R, bulge) {
  const c = GIANT;
  const dx = p[0] - camPos[0], dy = p[1] - camPos[1], dz = p[2] - camPos[2];
  const L = Math.hypot(dx, dy, dz);
  const rd = [dx / L, dy / L, dz / L];
  const oc = [camPos[0] - c[0], camPos[1] - c[1], camPos[2] - c[2]];
  const rMax = R * (1 + bulge * 1.2);
  const b = oc[0] * rd[0] + oc[1] * rd[1] + oc[2] * rd[2];
  const h = b * b - (oc[0] * oc[0] + oc[1] * oc[1] + oc[2] * oc[2]) + rMax * rMax;
  if (h < 0) return false;
  const sh = Math.sqrt(h);
  const t0 = Math.max(0, -b - sh), t1 = Math.min(L - 1e-4, -b + sh);
  if (t1 <= t0) return false;
  for (let i = 0; i <= 40; i++) {
    const t = t0 + (t1 - t0) * (i / 40);
    const q = [oc[0] + rd[0] * t, oc[1] + rd[1] * t, oc[2] + rd[2] * t];
    const r = Math.hypot(q[0], q[1], q[2]);
    if (r < giantRadiusJS([q[0] / r, q[1] / r, q[2] / r], R, bulge) * 0.995) return true;
  }
  return false;
}

export { L1, XW, XG, WD, GIANT, lobeContour, R_CIRC };
