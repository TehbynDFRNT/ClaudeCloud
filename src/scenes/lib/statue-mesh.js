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
  const ib = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(fig.buf, L.index.offset, L.index.count), gl.STATIC_DRAW);
  gl.bindVertexArray(G.vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  fig.gpu = { vao, bufs, ib, count: L.index.count };
  return fig.gpu;
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
