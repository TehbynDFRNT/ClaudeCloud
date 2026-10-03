// Restricted three-body geometry for the binary (rotating frame, G = 1, a = 1, Omega = 1).
// Orbital plane = world XZ, Y up. Giant (donor, M2) at negative x, white dwarf (accretor, M1) at positive x.
// Used by both the 3D scenes and the scientific drawings, so the ink matches the fire.
//
// Mass ratio q = M2 / M1 = 0.55 (cf. symbiotic recurrent novae such as T CrB / RS Oph:
// ~1.3 Msun white dwarf, ~0.7 Msun red giant). Values are illustrative, not a fit to one system.

export const Q = 0.55;
export const M1 = 1 / (1 + Q);       // white dwarf
export const M2 = Q / (1 + Q);       // giant
export const XW = M2;                // white dwarf x (centre of mass at origin)
export const XG = -M1;               // giant x
export const WD = [XW, 0, 0];
export const GIANT = [XG, 0, 0];

export function potential(x, y, z) {
  const r1 = Math.hypot(x - XW, y, z), r2 = Math.hypot(x - XG, y, z);
  return -M1 / r1 - M2 / r2 - 0.5 * (x * x + z * z);
}

function dPhidx(x) { // along the x axis
  const h = 1e-6;
  return (potential(x + h, 0, 0) - potential(x - h, 0, 0)) / (2 * h);
}

// L1 between the stars (bisection on dPhi/dx)
export const L1 = (() => {
  let a = XG + 1e-3, b = XW - 1e-3;
  for (let i = 0; i < 200; i++) { const m = (a + b) / 2; if (dPhidx(a) * dPhidx(m) <= 0) b = m; else a = m; }
  return [(a + b) / 2, 0, 0];
})();
export const PHI_L1 = potential(L1[0], 0, 0);

// distance from a centre along direction dir (unit) to the critical (L1) equipotential
export function lobeRadius(center, dir, rMax = 0.9) {
  const f = (r) => potential(center[0] + dir[0] * r, center[1] + dir[1] * r, center[2] + dir[2] * r) - PHI_L1;
  // march outward to the FIRST crossing (far-side potential dips below PHI_L1 again beyond L2/L3)
  let a = 1e-3, b = a;
  const dr = 0.004;
  while (b < rMax) { b = Math.min(rMax, a + dr); if (f(b) >= 0) break; a = b; }
  if (f(b) < 0) return rMax;
  for (let i = 0; i < 50; i++) { const m = (a + b) / 2; if (f(m) < 0) a = m; else b = m; }
  return (a + b) / 2;
}

// Roche lobe outline in the orbital plane (figure eight), as arrays of [x, z]
export function lobeContour(which = 'giant', n = 256) {
  const c = which === 'giant' ? GIANT : WD;
  const toL1 = Math.sign(L1[0] - c[0]);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const d = [Math.cos(a) * toL1, 0, Math.sin(a)];
    // toward L1 the lobe is pinched: cap the search at the L1 distance
    const r = Math.cos(a) > 0.9999 ? Math.abs(L1[0] - c[0]) : lobeRadius(c, d, 1.2);
    pts.push([c[0] + d[0] * r, c[2] + d[2] * r]);
  }
  return pts;
}

// Axisymmetric approximation of the giant's Roche-filling surface: radius vs angle from the L1 axis.
// Returns Float32Array(n) for theta in [0, pi] (theta = 0 points at L1), scaled by `fill` (1 = exactly filling).
export function giantSurfaceTable(n = 64, fill = 0.995) {
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const th = (i / (n - 1)) * Math.PI;
    // average over azimuth around the x-axis (orbital plane vs. polar directions differ slightly)
    let s = 0;
    for (let k = 0; k < 8; k++) {
      const ph = (k / 8) * Math.PI * 2;
      const d = [Math.cos(th), Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph)];
      s += lobeRadius(GIANT, d, Math.abs(L1[0] - XG) * (th < 1e-6 ? 1 : 1.5));
    }
    out[i] = (s / 8) * fill;
  }
  return out;
}

// Ballistic stream from L1 (Lubow & Shu): integrate test particles in the rotating frame.
// Returns [{x, z, vx, vz, t}] samples until the particle reaches rStop of the white dwarf
// or completes `maxT`. Small initial velocity and offset produce the stream's width.
export function streamPath({ v0 = 0.02, angle = 0.0, offset = 0.0, dt = 2e-4, maxT = 3.0, rStop = 0.02, every = 25 } = {}) {
  // state s = [x, z, vx, vz]; Omega = +1 about +Y.
  // Coriolis -2 Omega x v = (-2 vz, +2 vx) in (x, z); centrifugal = (x, z).
  // With this convention the stream leaving L1 bows toward +Z, swings past the white dwarf on its
  // +Z side at ~0.07a, then loops around it (ballistic rosette; real gas circularises near R_CIRC).
  const deriv = (s) => {
    const [x, z, vx, vz] = s;
    const r1 = Math.hypot(x - XW, z), r2 = Math.hypot(x - XG, z);
    const ax = -M1 * (x - XW) / r1 ** 3 - M2 * (x - XG) / r2 ** 3 + x - 2 * vz;
    const az = -M1 * z / r1 ** 3 - M2 * z / r2 ** 3 + z + 2 * vx;
    return [vx, vz, ax, az];
  };
  let s = [L1[0] + 0.002, offset, v0 * Math.cos(angle), v0 * Math.sin(angle)];
  const add = (a, b, k) => a.map((v, i) => v + b[i] * k);
  const out = [];
  let t = 0, i = 0;
  while (t < maxT) {
    if (i % every === 0) out.push({ x: s[0], z: s[1], vx: s[2], vz: s[3], t });
    const k1 = deriv(s), k2 = deriv(add(s, k1, dt / 2)), k3 = deriv(add(s, k2, dt / 2)), k4 = deriv(add(s, k3, dt));
    s = s.map((v, j) => v + (dt / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
    t += dt; i++;
    if (Math.hypot(s[0] - XW, s[1]) < rStop) { out.push({ x: s[0], z: s[1], vx: s[2], vz: s[3], t }); break; }
  }
  return out;
}

// Circularisation radius of the stream around the accretor (Frank, King & Raine approximation), units of a.
export const R_CIRC = (1 + Q) * Math.pow(0.5 - 0.227 * Math.log10(Q), 4);
// A plausible outer disk radius (fraction of the accretor's Roche lobe), units of a.
export const R_DISK = 0.75 * lobeRadius(WD, [0, 0, 1], 1.0);
// Volume-equivalent Roche lobe radius of the giant (Eggleton 1983), units of a.
export const R_LOBE_GIANT = (0.49 * Math.pow(Q, 2 / 3)) / (0.6 * Math.pow(Q, 2 / 3) + Math.log(1 + Math.pow(Q, 1 / 3)));
