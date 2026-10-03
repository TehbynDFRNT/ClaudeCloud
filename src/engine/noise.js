// Precomputed tileable noise volumes, generated deterministically at load.
// uNoise (sampler3D, 128^3 RGBA8, REPEAT):
//   R: tileable gradient (Perlin) noise, period 128 voxels / 8 cells -> 1 texture unit = 8 lattice cells
//   G: tileable Worley F1 distance (cells), 8 cells per unit -> convection/granulation cells
//   B: tileable gradient noise, different seed, 16 cells per unit
//   A: tileable Worley F2-F1 (cell borders), 8 cells per unit
import { mulberry32 } from './rng.js';

const N = 128;

function makeGradNoise(cells, seed) {
  const rnd = mulberry32(seed);
  const g = new Float32Array(cells * cells * cells * 3);
  for (let i = 0; i < cells * cells * cells; i++) {
    // random unit vector
    const z = rnd() * 2 - 1, a = rnd() * Math.PI * 2, r = Math.sqrt(1 - z * z);
    g[i * 3] = r * Math.cos(a); g[i * 3 + 1] = r * Math.sin(a); g[i * 3 + 2] = z;
  }
  const out = new Float32Array(N * N * N);
  const s = cells / N;
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const idx = (x, y, z) => ((((z % cells) + cells) % cells) * cells + (((y % cells) + cells) % cells)) * cells + (((x % cells) + cells) % cells);
  let o = 0;
  for (let z = 0; z < N; z++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const px = x * s, py = y * s, pz = z * s;
    const ix = Math.floor(px), iy = Math.floor(py), iz = Math.floor(pz);
    const fx = px - ix, fy = py - iy, fz = pz - iz;
    let acc = 0;
    const u = fade(fx), v = fade(fy), w = fade(fz);
    for (let c = 0; c < 8; c++) {
      const dx = c & 1, dy = (c >> 1) & 1, dz = (c >> 2) & 1;
      const gi = idx(ix + dx, iy + dy, iz + dz) * 3;
      const d = g[gi] * (fx - dx) + g[gi + 1] * (fy - dy) + g[gi + 2] * (fz - dz);
      acc += d * (dx ? u : 1 - u) * (dy ? v : 1 - v) * (dz ? w : 1 - w);
    }
    out[o++] = acc; // roughly [-0.87, 0.87]
  }
  return out;
}

function makeWorley(cells, seed) {
  const rnd = mulberry32(seed);
  const pts = new Float32Array(cells * cells * cells * 3);
  for (let i = 0; i < pts.length; i++) pts[i] = rnd();
  const f1 = new Float32Array(N * N * N), f21 = new Float32Array(N * N * N);
  const s = cells / N;
  let o = 0;
  for (let z = 0; z < N; z++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const px = (x + 0.5) * s, py = (y + 0.5) * s, pz = (z + 0.5) * s;
    const ix = Math.floor(px), iy = Math.floor(py), iz = Math.floor(pz);
    let d1 = 9, d2 = 9;
    for (let dz = -1; dz <= 1; dz++) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const cx = ix + dx, cy = iy + dy, cz = iz + dz;
      const wx = ((cx % cells) + cells) % cells, wy = ((cy % cells) + cells) % cells, wz = ((cz % cells) + cells) % cells;
      const pi = ((wz * cells + wy) * cells + wx) * 3;
      const qx = cx + pts[pi] - px, qy = cy + pts[pi + 1] - py, qz = cz + pts[pi + 2] - pz;
      const d = qx * qx + qy * qy + qz * qz;
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
    }
    d1 = Math.sqrt(d1); d2 = Math.sqrt(d2);
    f1[o] = d1; f21[o] = d2 - d1; o++;
  }
  return { f1, f21 };
}

export function buildNoiseVolume() {
  const a = makeGradNoise(8, 1234);
  const w = makeWorley(8, 777);
  const b = makeGradNoise(16, 4321);
  const data = new Uint8Array(N * N * N * 4);
  const q = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  for (let i = 0; i < N * N * N; i++) {
    data[i * 4] = q(a[i] * 0.575 + 0.5);
    data[i * 4 + 1] = q(Math.min(1, w.f1[i] / 1.1));
    data[i * 4 + 2] = q(b[i] * 0.575 + 0.5);
    data[i * 4 + 3] = q(Math.min(1, w.f21[i] / 0.8));
  }
  return { n: N, data };
}
