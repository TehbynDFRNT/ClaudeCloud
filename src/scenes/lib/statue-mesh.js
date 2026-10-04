// Statue meshes (media/scenes/statue/<figure>.json + .bin, written by tools/prepare_statues.py).
// Head space: origin halfway between chin and crown on the turn axis, +Y up (the turn axis), +Z the measured gaze,
// +X the figure's own left; 1.0 = chin-to-crown height. The .bin holds separate little-endian blocks:
// position float32x3, normal int16x3 (normalised), bake uint8x4 (ao, cavity, thickness, skin), index uint32.

const CACHE = new Map();   // figure -> { meta, buf }
export const FIGURE_IDS = ['david', 'sol', 'prometheus'];

// fetch one figure (relative to src/index.html); idempotent
export async function loadFigure(figure, base = '../media/scenes/statue/') {
  if (CACHE.has(figure)) return CACHE.get(figure);
  if (!FIGURE_IDS.includes(figure)) throw new Error(`statue: unknown figure "${figure}"`);
  const meta = await fetch(base + figure + '.json').then((r) => { if (!r.ok) throw new Error(`statue: ${figure}.json ${r.status}`); return r.json(); });
  const buf = await fetch(base + (meta.layout.file || figure + '.bin')).then((r) => { if (!r.ok) throw new Error(`statue: ${figure}.bin ${r.status}`); return r.arrayBuffer(); });
  if (buf.byteLength !== meta.layout.byteLength) throw new Error(`statue: ${figure}.bin is ${buf.byteLength} bytes, json says ${meta.layout.byteLength}`);
  const fig = { figure, meta, buf, gpu: null };
  CACHE.set(figure, fig);
  return fig;
}

export function getFigure(figure) {
  const fig = CACHE.get(figure);
  if (!fig) throw new Error(`statue: figure "${figure}" was not preloaded (the plan's statue shots decide which figures load)`);
  return fig;
}

// Upload to the GPU once: VAO with attribute 0 = position, 1 = normal, 2 = bake; uint32 indices.
// Leaves the engine's VAO bound afterwards.
export function gpuFigure(G, fig) {
  if (fig.gpu) return fig.gpu;
  const gl = G.gl;
  const L = fig.meta.layout, A = L.attributes;
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const attr = (loc, a, view, type, comps, norm) => {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, view, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, comps, type, norm, 0, 0);
    return b;
  };
  const bufs = [
    attr(0, A.position, new Float32Array(fig.buf, A.position.offset, A.position.byteLength / 4), gl.FLOAT, 3, false),
    attr(1, A.normal, new Int16Array(fig.buf, A.normal.offset, A.normal.byteLength / 2), gl.SHORT, 3, true),
    attr(2, A.bake, new Uint8Array(fig.buf, A.bake.offset, A.bake.byteLength), gl.UNSIGNED_BYTE, 4, true),
  ];
  const { index, clusters } = clusterize(
    new Float32Array(fig.buf, A.position.offset, A.position.byteLength / 4),
    new Uint32Array(fig.buf, L.index.offset, L.index.count), fig.meta.bounds);
  const ib = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, index, gl.STATIC_DRAW);
  gl.bindVertexArray(G.vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  fig.gpu = { vao, bufs, ib, count: L.index.count, clusters };
  return fig.gpu;
}

// Reorder the triangles into spatial clusters (a 4x4x4 grid over the bounds x 6 dominant-normal bins) so a pass can
// skip what it cannot see: off-frustum clusters (close-ups see a small part of the head) and clusters whose normals all
// face away from the camera. Returns the reordered index array and [{ offset, count, c: centre, r: radius, axis }].
const BIN_AXES = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
function clusterize(pos, idx, bounds) {
  const G = 4, T = idx.length / 3;
  const mn = bounds.min, mx = bounds.max;
  const sx = G / (mx[0] - mn[0] + 1e-6), sy = G / (mx[1] - mn[1] + 1e-6), sz = G / (mx[2] - mn[2] + 1e-6);
  const key = new Uint16Array(T);
  const counts = new Uint32Array(G * G * G * 6);
  for (let t = 0; t < T; t++) {
    const a = idx[t * 3] * 3, b = idx[t * 3 + 1] * 3, c = idx[t * 3 + 2] * 3;
    const cx = (pos[a] + pos[b] + pos[c]) / 3, cy = (pos[a + 1] + pos[b + 1] + pos[c + 1]) / 3, cz = (pos[a + 2] + pos[b + 2] + pos[c + 2]) / 3;
    const ix = Math.min(G - 1, Math.max(0, Math.floor((cx - mn[0]) * sx)));
    const iy = Math.min(G - 1, Math.max(0, Math.floor((cy - mn[1]) * sy)));
    const iz = Math.min(G - 1, Math.max(0, Math.floor((cz - mn[2]) * sz)));
    // face normal -> dominant axis bin
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
    const bin = ax >= ay && ax >= az ? (nx >= 0 ? 0 : 1) : ay >= az ? (ny >= 0 ? 2 : 3) : (nz >= 0 ? 4 : 5);
    const k = ((ix * G + iy) * G + iz) * 6 + bin;
    key[t] = k; counts[k]++;
  }
  const start = new Uint32Array(counts.length);
  for (let k = 1; k < counts.length; k++) start[k] = start[k - 1] + counts[k - 1];
  const fill = start.slice();
  const out = new Uint32Array(idx.length);
  for (let t = 0; t < T; t++) { const d = fill[key[t]]++ * 3; out[d] = idx[t * 3]; out[d + 1] = idx[t * 3 + 1]; out[d + 2] = idx[t * 3 + 2]; }
  const clusters = [];
  for (let k = 0; k < counts.length; k++) {
    if (!counts[k]) continue;
    const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
    for (let i = start[k] * 3, e = (start[k] + counts[k]) * 3; i < e; i++) {
      const v = out[i] * 3;
      for (let j = 0; j < 3; j++) { const x = pos[v + j]; if (x < lo[j]) lo[j] = x; if (x > hi[j]) hi[j] = x; }
    }
    const c = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
    const r = Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) / 2;
    clusters.push({ offset: start[k] * 3, count: counts[k] * 3, c, r, axis: BIN_AXES[k % 6] });
  }
  return { index: out, clusters };
}

// Draw the clusters accepted by visible(cluster), merging runs that are contiguous in the index buffer.
// Returns the number of indices drawn.
export function drawClusters(gl, gpu, visible) {
  let runStart = -1, runEnd = -1, drawn = 0;
  const flush = () => { if (runStart >= 0) { gl.drawElements(gl.TRIANGLES, runEnd - runStart, gl.UNSIGNED_INT, runStart * 4); drawn += runEnd - runStart; } runStart = -1; };
  for (const cl of gpu.clusters) {
    if (!visible(cl)) { flush(); continue; }
    if (runStart >= 0 && cl.offset === runEnd) runEnd += cl.count;
    else { flush(); runStart = cl.offset; runEnd = cl.offset + cl.count; }
  }
  flush();
  return drawn;
}

// Named head-space points. Anchors from the json plus a few derived ones:
//   eyes  midpoint of eyeL/eyeR      brow   above the eyes on the brow ridge     face  between eyes and mouth
//   head  the origin                 lips   the mouth anchor                     jaw   between mouth, chin and the near ear
export function anchor(meta, name) {
  const a = meta.anchors;
  const mid = (p, q, t = 0.5) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
  switch (name) {
    case 'head': return [0, 0, 0];
    case 'eyes': return mid(a.eyeL, a.eyeR);
    case 'brow': { const e = mid(a.eyeL, a.eyeR); return [e[0], e[1] + 0.085, e[2] + 0.02]; }
    case 'browR': return [a.eyeR[0], a.eyeR[1] + 0.08, a.eyeR[2] + 0.0];
    case 'browL': return [a.eyeL[0], a.eyeL[1] + 0.08, a.eyeL[2] + 0.0];
    case 'face': return mid(mid(a.eyeL, a.eyeR), a.mouth, 0.45);
    case 'lips': return a.mouth;
    case 'jaw': return mid(mid(a.mouth, a.chin), a.earR, 0.3);
    default:
      if (a[name]) return a[name];
      throw new Error(`statue: no anchor "${name}" on ${meta.figure}`);
  }
}

// spec: 'name' | [x,y,z] | { name: weight, ... } (weights normalised) | { at: spec, off: [dx,dy,dz] }
export function resolvePoint(meta, spec) {
  if (typeof spec === 'string') return anchor(meta, spec);
  if (Array.isArray(spec)) return spec;
  if (spec && spec.at !== undefined) {
    const p = resolvePoint(meta, spec.at), o = spec.off || [0, 0, 0];
    return [p[0] + o[0], p[1] + o[1], p[2] + o[2]];
  }
  let s = 0; const p = [0, 0, 0];
  for (const [k, w] of Object.entries(spec || {})) { const q = anchor(meta, k); p[0] += q[0] * w; p[1] += q[1] * w; p[2] += q[2] * w; s += w; }
  return s ? p.map((x) => x / s) : [0, 0, 0];
}
