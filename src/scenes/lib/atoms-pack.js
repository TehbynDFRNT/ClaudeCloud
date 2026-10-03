// Nucleus geometry for the 'atoms' scene: compact, deterministic packings of A nucleons
// (unit nucleon radius, centres ~1.62 apart so the translucent spheres interpenetrate a little),
// with Z protons spread through the cluster (greedy farthest-point choice) so gold and
// blue-white nucleons interleave the way the eye expects of a real nucleus.

const SPACING = 1.62;
const cache = new Map();

export function packNucleus(A, Z) {
  const key = A * 1000 + Z;
  if (cache.has(key)) return cache.get(key);
  const p = [];
  for (let i = 0; i < A; i++) {
    const y = A === 1 ? 0 : 1 - (2 * (i + 0.5)) / A;
    const rr = Math.sqrt(Math.max(0, 1 - y * y));
    const th = i * 2.399963;
    const rad = A === 1 ? 0 : SPACING * 0.62 * Math.cbrt(A) * Math.cbrt((i + 0.5) / A);
    p.push([Math.cos(th) * rr * rad, y * rad, Math.sin(th) * rr * rad]);
  }
  const push = () => {
    for (let i = 0; i < A; i++) for (let j = i + 1; j < A; j++) {
      const dx = p[j][0] - p[i][0], dy = p[j][1] - p[i][1], dz = p[j][2] - p[i][2];
      const l = Math.hypot(dx, dy, dz) || 1e-6;
      if (l < SPACING) {
        const k = ((SPACING - l) / l) * 0.5;
        p[i][0] -= dx * k; p[i][1] -= dy * k; p[i][2] -= dz * k;
        p[j][0] += dx * k; p[j][1] += dy * k; p[j][2] += dz * k;
      }
    }
  };
  for (let it = 0; it < 500; it++) {
    push();
    const s = 1 - 0.03 * (1 - it / 500);
    for (const q of p) { q[0] *= s; q[1] *= s; q[2] *= s; }
  }
  for (let it = 0; it < 40; it++) push();
  // centre on the centroid
  const c = [0, 0, 0];
  for (const q of p) { c[0] += q[0] / A; c[1] += q[1] / A; c[2] += q[2] / A; }
  for (const q of p) { q[0] -= c[0]; q[1] -= c[1]; q[2] -= c[2]; }
  let radius = 1;
  for (const q of p) radius = Math.max(radius, Math.hypot(q[0], q[1], q[2]) + 1);
  // protons: greedy farthest-point so they spread through the cluster
  const isP = new Uint8Array(A);
  if (Z > 0) {
    let first = 0;
    for (let i = 1; i < A; i++) if (p[i][0] + p[i][1] * 0.3 > p[first][0] + p[first][1] * 0.3) first = i;
    isP[first] = 1;
    for (let n = 1; n < Z; n++) {
      let best = -1, bestD = -1;
      for (let i = 0; i < A; i++) {
        if (isP[i]) continue;
        let md = 1e9;
        for (let j = 0; j < A; j++) if (isP[j]) md = Math.min(md, Math.hypot(p[i][0] - p[j][0], p[i][1] - p[j][1], p[i][2] - p[j][2]));
        if (md > bestD) { bestD = md; best = i; }
      }
      isP[best] = 1;
    }
  }
  const pos = new Float32Array(A * 3);
  p.forEach((q, i) => { pos[i * 3] = q[0]; pos[i * 3 + 1] = q[1]; pos[i * 3 + 2] = q[2]; });
  const out = { A, Z, pos, isP, radius };
  cache.set(key, out);
  return out;
}

// rotation matrix (row-major 3x3) from an axis (unit) and angle
export function axisAngle(ax, ang) {
  const c = Math.cos(ang), s = Math.sin(ang), t = 1 - c;
  const [x, y, z] = ax;
  return [
    t * x * x + c, t * x * y - s * z, t * x * z + s * y,
    t * x * y + s * z, t * y * y + c, t * y * z - s * x,
    t * x * z - s * y, t * y * z + s * x, t * z * z + c,
  ];
}
