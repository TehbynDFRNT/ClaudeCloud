// S10 Prometheus: the fist as a small solid model, so that the red-chalk study can be modelled under one light.
// A right hand is built on its skeleton in a hand frame (cm; X radial, Y distal, Z dorsal; wrist at the
// origin): metacarpals, the thenar and hypothenar masses, wrist and forearm (radial and ulnar sides, the
// flexor bellies, the palmar tendons, the head of the ulna), and the four fingers, which are closed one
// segment at a time until each phalanx lies tangent to the fennel stalk (a power grip: the stalk crosses
// the palm obliquely, from the hypothenar to the root of the index), with the thumb laid across the middle
// phalanges of the index and middle fingers. Bones are sphere-swept cones; flesh masses of one group are
// joined with a smooth maximum.
//
// The model is seen orthographically in the drawing's canonical frame (cm, x right, y down, z toward the
// viewer; the stalk vertical at x = 0) and rasterised into a height field per group. From it come:
//   lightField()  per-cell tone, 0 (paper) .. 1 (darkest): Lambert under the key, the core shadow at the
//                 terminator, reflected light from the lower right, cast shadows (ray-marched through the
//                 height field) and occlusion in the creases
//   contours()    the visible outlines of every group (marching squares), each point marked with the depth
//                 jump it stands on (a silhouette against something far behind, or a crease where two masses
//                 meet), its outward normal and the group on the other side
// The bones are returned too, so the drawing can turn cross-contour strokes round them.

export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a) => mul(a, 1 / (len(a) || 1));
export const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const rot = (v, k, th) => {
  k = norm(k);
  const c = Math.cos(th), s = Math.sin(th);
  return add(add(mul(v, c), mul(cross(k, v), s)), mul(k, dot(k, v) * (1 - c)));
};
const DEG = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// distance from a capsule's axis samples to an infinite line, less the radii: < 0 means it cuts into the stalk
function clearance(p, q, ra, rb, o, u, R) {
  let m = 1e9;
  for (let i = 0; i <= 12; i++) {
    const t = i / 12, x = lerp3(p, q, t);
    m = Math.min(m, len(cross(sub(x, o), u)) - R - (ra + (rb - ra) * t));
  }
  return m;
}

// ---------------------------------------------------------------- the model
export function fistModel(o = {}) {
  const X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, 1];
  const R = o.R ?? 1.05;                              // the stalk's radius
  const u = norm(o.rodDir ?? [0.9, 0.38, 0.04]);      // the stalk's axis, pointing up (toward the thumb side)
  const Q = o.rodAt ?? [0.55, 7.4, -2.25];            // a point on it, pressed into the palm under the knuckles
  const groups = [], prims = [], bones = [];
  const G = (name, k) => { groups.push({ name, k, prims: [] }); return groups.length - 1; };
  // a sphere-swept cone a->b, radii ra->rb; part of group g
  const bone = (a, b, ra, rb, g, x = {}) => {
    const B = { a, b, ra, rb, g, ...x };
    bones.push(B);
    prims.push(B);
    return B;
  };

  // ---- fingers: closed joint by joint around the stalk
  const FING = [
    { n: 'index', mcp: [2.35, 9.45, 0.05], L: [4.1, 2.5, 1.9], r: [0.97, 0.87, 0.84, 0.74, 0.71, 0.6], abd: 3, conv: 3 },
    { n: 'middle', mcp: [0.55, 9.85, 0.25], L: [4.5, 2.85, 2.0], r: [1.0, 0.9, 0.87, 0.77, 0.74, 0.62], abd: 0, conv: -2 },
    { n: 'ring', mcp: [-1.22, 9.4, 0.1], L: [4.2, 2.75, 1.95], r: [0.95, 0.85, 0.82, 0.72, 0.69, 0.58], abd: -4, conv: -7 },
    { n: 'little', mcp: [-2.75, 8.5, -0.25], L: [3.4, 2.1, 1.75], r: [0.84, 0.75, 0.73, 0.64, 0.61, 0.51], abd: -9, conv: -13 },
  ];
  const fingers = FING.map((f) => {
    let dir = rot(Y, Z, -f.abd * DEG);
    const A = rot(cross(Z, dir), dir, f.conv * DEG);
    let P = f.mcp;
    const joints = [P], segs = [];
    const lim = [[8, 92], [25, 108], [12, 72]];
    for (let k = 0; k < 3; k++) {
      const ra = f.r[2 * k], rb = f.r[2 * k + 1];
      let th = lim[k][0];
      for (let a = lim[k][0]; a <= lim[k][1]; a += 0.5) {
        const nd = rot(dir, A, a * DEG);
        if (clearance(P, add(P, mul(nd, f.L[k])), ra, rb, Q, u, R) < -0.18) break;
        th = a;
      }
      dir = rot(dir, A, th * DEG);
      const E = add(P, mul(dir, f.L[k]));
      segs.push({ a: P, b: E, ra, rb, dir });
      joints.push(E);
      P = E;
    }
    return { ...f, joints, segs, A };
  });

  // ---- palm, wrist, forearm: one fleshy group
  const gPalm = G('palm', 1.0);
  const mcpBase = (f) => [f.mcp[0] * 0.5, 1.9, -0.05];
  for (const f of FING) {
    bone(mcpBase(f), f.mcp, 1.18, f.r[0] * 1.08, gPalm);                       // metacarpal slab
    bone(add(f.mcp, [0, -0.15, 0.25]), add(f.mcp, [0, 0.05, 0.25]), f.r[0] * 1.02, f.r[0] * 1.02, gPalm, { k: 0.25 }); // knuckle head
  }
  bone([-2.9, 1.7, -0.45], [-3.0, 6.6, -0.75], 1.38, 1.12, gPalm);             // hypothenar
  bone([-2.4, 2.4, -0.9], [-2.6, 6.2, -1.05], 1.15, 0.95, gPalm);
  const CMC = [1.75, 2.35, -0.35];
  // the thumb: across the middle phalanges of the index and middle fingers, tip on the middle finger
  const ix = fingers[0], md = fingers[1];
  const outDir = (p) => { const w = sub(p, Q); return norm(sub(w, mul(u, dot(w, u)))); };
  const midOf = (s, t = 0.5) => lerp3(s.a, s.b, t);
  const tT = o.thumbT ?? 0.15;
  const tipT = add(midOf(md.segs[1], tT), mul(outDir(midOf(md.segs[1], tT)), md.segs[1].ra + 0.7));
  const mcpT = add(CMC, mul(norm(sub(add(ix.mcp, o.thumbAim ?? [1.4, -3.2, -4.0]), CMC)), 4.3));
  // two-bone reach from the MCP to the tip, the IP joint bowed away from the stalk
  const L1 = 3.1, L2 = 2.55;
  const dv = sub(tipT, mcpT), dl = Math.min(L1 + L2 - 0.05, len(dv)), dn = norm(dv);
  const a1 = (L1 * L1 - L2 * L2 + dl * dl) / (2 * dl), h1 = Math.sqrt(Math.max(0, L1 * L1 - a1 * a1));
  let pole = add(outDir(mcpT), mul(X, 0.6));
  pole = norm(sub(pole, mul(dn, dot(pole, dn))));
  const ipT = add(add(mcpT, mul(dn, a1)), mul(pole, h1));
  const thumb = { cmc: CMC, mcp: mcpT, ip: ipT, tip: add(ipT, mul(norm(sub(add(mcpT, mul(dn, dl)), ipT)), L2)) };
  // thenar: the muscle over the first metacarpal, toward the palm; the web to the index
  bone(add(CMC, [-0.4, 0.3, -1.05]), add(lerp3(CMC, mcpT, 0.7), [-0.6, -0.1, -0.7]), 1.78, 1.28, gPalm);
  bone(add(CMC, [0.1, -0.2, -0.2]), lerp3(CMC, mcpT, 1.04), 1.08, 1.1, gPalm);    // the first metacarpal, up into the thumb's root
  bone(lerp3(CMC, mcpT, 0.6), add(ix.mcp, [-0.2, -0.4, -0.55]), 0.8, 0.75, gPalm); // adductor web
  // wrist and forearm (radial deviation, a little extension; the forearm leaves away from the viewer)
  const df = norm(add(add(rot(mul(Y, -1), Z, -(o.dev ?? 22) * DEG), mul(Z, o.ext ?? 0.3)), [0, 0, 0]));
  const perpR = norm(sub(X, mul(df, dot(X, df))));
  const perpP = norm(cross(perpR, df));               // ~ -Z: the palmar (flexor) side
  const fa = (t, side, depth = 0) => add(add(add([0, 0.9, 0], mul(df, t)), mul(perpR, side)), mul(perpP, depth));
  bone([-1.55, 1.05, 0.05], [1.55, 1.15, 0.0], 1.62, 1.58, gPalm);              // carpus
  const chain = (pts, g, x) => { for (let i = 0; i < pts.length - 1; i++) bone(pts[i][0], pts[i + 1][0], pts[i][1], pts[i + 1][1], g, x); };
  chain([[fa(0, 1.05), 1.5], [fa(4.5, 1.2), 1.75], [fa(10, 1.1), 2.15], [fa(17, 0.9), 2.3]], gPalm);   // radial side (brachioradialis)
  chain([[fa(0, -1.05), 1.45], [fa(4.5, -1.1), 1.6], [fa(10, -0.95), 1.95], [fa(17, -0.75), 2.2]], gPalm); // ulnar side
  chain([[fa(5.5, 0.1, 0.55), 1.45], [fa(11, 0.0, 0.75), 2.0], [fa(17, 0.0, 0.6), 2.15]], gPalm);         // the flexor bellies
  bone(add(fa(0.2, -1.6), mul(perpP, -0.95)), add(fa(0.8, -1.65), mul(perpP, -0.95)), 0.62, 0.55, gPalm, { k: 0.3 }); // head of the ulna
  // palmar tendons (flexor carpi radialis, palmaris longus) stand under the skin of a gripping wrist
  bone(fa(-0.6, 0.55, 1.2), fa(6.5, 0.45, 0.7), 0.3, 0.26, gPalm, { k: 0.18 });
  bone(fa(-0.6, -0.1, 1.25), fa(6.0, -0.2, 0.75), 0.27, 0.24, gPalm, { k: 0.18 });

  // ---- the fingers' groups (back to front does not matter: depth decides)
  fingers.forEach((f) => {
    f.g = f.segs.map((s, k) => G(f.n + k, 0.3));
    f.segs.forEach((s, k) => {
      // an oval section, wider than deep: a core and two flanks along the joint axis. Each phalanx stops short
      // of the bent joints so the knuckle there is the bone's head, tighter than the finger is thick
      const lat = norm(f.A), dors = norm(cross(s.dir, f.A));
      const cutA = k > 0 ? 0.32 * s.ra : 0, cutB = k < 2 ? 0.32 * s.rb : 0;
      const A0 = add(s.a, mul(s.dir, cutA)), B0 = add(s.b, mul(s.dir, -cutB));
      const ra = s.ra + (s.rb - s.ra) * (cutA / len(sub(s.b, s.a))), rb = s.rb - (s.rb - s.ra) * (cutB / len(sub(s.b, s.a)));
      bone(A0, B0, ra * 0.86, rb * 0.86, f.g[k], { finger: f.n, k, lat, dors, wk: 1.14, dk: 0.86 });
      for (const sg of [-1, 1]) bone(add(A0, mul(lat, sg * 0.25 * ra)), add(B0, mul(lat, sg * 0.25 * rb)), ra * 0.82, rb * 0.82, f.g[k], { k: 0.25 });
      if (k < 2) {
        const nx = f.segs[k + 1], dn = norm(cross(nx.dir, f.A));
        const bis = norm(add(dors, dn));
        const rh = s.rb * 0.6;
        const hd = add(s.b, mul(bis, s.rb * 0.86 - rh + 0.04));
        for (const sg of [-1, 1]) bone(add(hd, mul(lat, sg * 0.3 * s.rb)), add(add(hd, mul(lat, sg * 0.3 * s.rb)), mul(s.dir, -0.3)), rh, rh * 1.05, f.g[k], { k: 0.22, joint: true });
        // the joint's palmar side and core, so the two phalanges stay joined
        bone(add(s.b, mul(s.dir, -0.25)), add(s.b, mul(nx.dir, 0.25)), s.rb * 0.78, nx.ra * 0.78, f.g[k], { k: 0.25, joint: true });
      }
    });
    // the skin of the back of the hand runs on over the knuckles and the base of each finger
    const s0 = f.segs[0];
    bone(add(s0.a, mul(s0.dir, -0.2)), lerp3(s0.a, s0.b, 0.22), s0.ra * 0.92, s0.ra * 0.8, gPalm, { k: 0.5 });
    // the pulp of the fingertip
    const d = f.segs[2];
    bone(lerp3(d.a, d.b, 0.55), d.b, d.rb * 1.12, d.rb * 0.98, f.g[2], { k: 0.2 });
  });
  // webs between the finger bases: the back of the hand is one skin over the row of knuckles
  for (let i = 0; i < fingers.length - 1; i++) {
    const a = fingers[i].segs[0], b = fingers[i + 1].segs[0];
    const pa = lerp3(a.a, a.b, 0.22), pb = lerp3(b.a, b.b, 0.22), m = lerp3(pa, pb, 0.5);
    bone(lerp3(a.a, b.a, 0.5), m, (a.ra + b.ra) * 0.4, (a.ra + b.ra) * 0.34, gPalm, { k: 0.6 });
  }
  const gTP = G('thumb0', 0.3), gTD = G('thumb1', 0.3);
  bone(thumb.mcp, thumb.ip, 1.06, 0.92, gTP, { finger: 'thumb', k: 0 });
  bone(thumb.mcp, add(thumb.mcp, mul(norm(sub(thumb.ip, thumb.mcp)), 0.02)), 1.08, 1.08, gTP, { k: 0.2, joint: true });
  bone(thumb.ip, thumb.tip, 0.95, 0.78, gTD, { finger: 'thumb', k: 1 });
  bone(thumb.ip, add(thumb.ip, mul(norm(sub(thumb.tip, thumb.ip)), 0.02)), 0.98, 0.98, gTD, { k: 0.2, joint: true });
  bone(lerp3(thumb.ip, thumb.tip, 0.4), lerp3(thumb.ip, thumb.tip, 0.9), 0.9, 0.8, gTD, { k: 0.25 }); // the broad, flattened tip

  return { R, u, Q, fingers, thumb, groups, prims, bones, gPalm, gTP, gTD, df, CMC };
}

// ---------------------------------------------------------------- the view
// basis: up = the stalk, toward the viewer = the palmar side turned by phi about the stalk, then tipped by
// alpha so the stalk's cut top faces us a little. mirror flips x (a left hand).
export function viewOf(M, o = {}) {
  const u = M.u;
  let v = sub([0, 0, -1], mul(u, dot([0, 0, -1], u)));
  v = rot(norm(v), u, (o.phi ?? 0) * DEG);
  const al = (o.alpha ?? 12) * DEG;
  const view = norm(add(mul(v, Math.cos(al)), mul(u, Math.sin(al))));
  const up = norm(sub(mul(u, Math.cos(al)), mul(v, Math.sin(al))));
  const down = mul(up, -1);
  const right = cross(down, view);
  const mir = o.mirror ? -1 : 1;
  const org = o.origin ?? M.Q;
  const off = o.offset ?? [0, 0];
  const C = (p) => { const w = sub(p, org); return [mir * dot(w, right) + off[0], dot(w, down) + off[1], dot(w, view)]; };
  // a direction (no translation)
  const Cd = (d) => [mir * dot(d, right), dot(d, down), dot(d, view)];
  return { C, Cd, right, down, view, mir };
}

// ---------------------------------------------------------------- the height field
// prims in canonical space: { a, b (3D), ra, rb, g, k? }. grid: { x0, y0, x1, y1, h (cell, cm) }
export function rasterise(prims, groups, grid, o = {}) {
  const hc = grid.h;
  const nx = Math.ceil((grid.x1 - grid.x0) / hc) + 1, ny = Math.ceil((grid.y1 - grid.y0) / hc) + 1;
  const M = 0.35;                                   // margin outside each group (cm) for the iso-lines
  const NEG = -1e9;
  const GR = groups.map((g, gi) => {
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const p of prims) if (p.g === gi) for (const [q, r] of [[p.a, p.ra], [p.b, p.rb]]) {
      bx0 = Math.min(bx0, q[0] - r); by0 = Math.min(by0, q[1] - r); bx1 = Math.max(bx1, q[0] + r); by1 = Math.max(by1, q[1] + r);
    }
    const i0 = Math.max(0, Math.floor((bx0 - M - grid.x0) / hc)), j0 = Math.max(0, Math.floor((by0 - M - grid.y0) / hc));
    const i1 = Math.min(nx - 1, Math.ceil((bx1 + M - grid.x0) / hc)), j1 = Math.min(ny - 1, Math.ceil((by1 + M - grid.y0) / hc));
    const w = Math.max(0, i1 - i0 + 1), h = Math.max(0, j1 - j0 + 1);
    const c = new Float32Array(w * h).fill(-M), z = new Float32Array(w * h).fill(NEG);
    const ux = new Float32Array(w * h), uy = new Float32Array(w * h);
    return { ...g, i0, j0, w, h, c, z, ux, uy };
  });
  // one primitive, hard max over its own spheres, then a smooth max into its group
  for (const p of prims) {
    const g = GR[p.g];
    if (!g.w) continue;
    const L = Math.hypot(p.b[0] - p.a[0], p.b[1] - p.a[1], p.b[2] - p.a[2]);
    const n = Math.max(1, Math.ceil(L / 0.06));
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const [q, r] of [[p.a, p.ra], [p.b, p.rb]]) { bx0 = Math.min(bx0, q[0] - r); by0 = Math.min(by0, q[1] - r); bx1 = Math.max(bx1, q[0] + r); by1 = Math.max(by1, q[1] + r); }
    const i0 = Math.max(g.i0, Math.floor((bx0 - M - grid.x0) / hc)), j0 = Math.max(g.j0, Math.floor((by0 - M - grid.y0) / hc));
    const i1 = Math.min(g.i0 + g.w - 1, Math.ceil((bx1 + M - grid.x0) / hc)), j1 = Math.min(g.j0 + g.h - 1, Math.ceil((by1 + M - grid.y0) / hc));
    const w = i1 - i0 + 1, h = j1 - j0 + 1;
    if (w <= 0 || h <= 0) continue;
    const tc = new Float32Array(w * h).fill(-M), tz = new Float32Array(w * h).fill(NEG), tx = new Float32Array(w * h), ty = new Float32Array(w * h);
    for (let s = 0; s <= n; s++) {
      const t = s / n;
      const cx = p.a[0] + (p.b[0] - p.a[0]) * t, cy = p.a[1] + (p.b[1] - p.a[1]) * t, cz = p.a[2] + (p.b[2] - p.a[2]) * t;
      const r = p.ra + (p.rb - p.ra) * t;
      const ii0 = Math.max(i0, Math.floor((cx - r - M - grid.x0) / hc)), ii1 = Math.min(i1, Math.ceil((cx + r + M - grid.x0) / hc));
      const jj0 = Math.max(j0, Math.floor((cy - r - M - grid.y0) / hc)), jj1 = Math.min(j1, Math.ceil((cy + r + M - grid.y0) / hc));
      for (let j = jj0; j <= jj1; j++) {
        const y = grid.y0 + j * hc, dy = y - cy;
        for (let i = ii0; i <= ii1; i++) {
          const x = grid.x0 + i * hc, dx = x - cx;
          const d = Math.hypot(dx, dy), k = (j - j0) * w + (i - i0);
          const cv = r - d;
          if (cv > tc[k]) tc[k] = cv;
          if (cv > 0) {
            const zz = cz + Math.sqrt(r * r - d * d);
            if (zz > tz[k]) { tz[k] = zz; tx[k] = dx / r; ty[k] = dy / r; }
          }
        }
      }
    }
    const kk = p.k ?? g.k;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const k = (j - j0) * w + (i - i0), q = (j - g.j0) * g.w + (i - g.i0);
      if (tc[k] > g.c[q]) g.c[q] = kk > 0 ? Math.max(tc[k], g.c[q]) : tc[k];
      if (tz[k] === NEG) continue;
      if (g.z[q] === NEG) { g.z[q] = tz[k]; g.ux[q] = tx[k]; g.uy[q] = ty[k]; continue; }
      if (kk <= 0) { if (tz[k] > g.z[q]) { g.z[q] = tz[k]; g.ux[q] = tx[k]; g.uy[q] = ty[k]; } continue; }
      const m = clamp(0.5 + 0.5 * (tz[k] - g.z[q]) / kk);
      g.z[q] = g.z[q] + (tz[k] - g.z[q]) * m + kk * m * (1 - m) * 0.5;
      g.ux[q] += (tx[k] - g.ux[q]) * m; g.uy[q] += (ty[k] - g.uy[q]) * m;
    }
  }
  // per-group clips (the stalk's cut top)
  GR.forEach((g, gi) => {
    const clip = o.clip?.[g.name];
    if (!clip) return;
    for (let j = 0; j < g.h; j++) for (let i = 0; i < g.w; i++) {
      const q = j * g.w + i, x = grid.x0 + (g.i0 + i) * hc, y = grid.y0 + (g.j0 + j) * hc;
      const d = clip(x, y);
      if (d < g.c[q]) g.c[q] = d;
      if (g.c[q] <= 0) g.z[q] = NEG;
    }
  });
  // the front surface: height, group, and the best height of any other group
  const H = new Float32Array(nx * ny).fill(-50), H2 = new Float32Array(nx * ny).fill(-50);
  const GI = new Int16Array(nx * ny).fill(-1);
  const NX = new Float32Array(nx * ny), NY = new Float32Array(nx * ny);
  GR.forEach((g, gi) => {
    for (let j = 0; j < g.h; j++) for (let i = 0; i < g.w; i++) {
      const q = j * g.w + i;
      if (g.c[q] <= 0 || g.z[q] === NEG) continue;
      const k = (g.j0 + j) * nx + g.i0 + i, z = g.z[q];
      if (z > H[k]) { if (GI[k] >= 0) H2[k] = H[k]; H[k] = z; GI[k] = gi; NX[k] = g.ux[q]; NY[k] = g.uy[q]; }
      else if (z > H2[k]) H2[k] = z;
    }
  });
  return { nx, ny, hc, x0: grid.x0, y0: grid.y0, GR, H, H2, GI, NX, NY };
}

// bilinear sample of a full-grid array; outside -> def
export function sampler(F, A, def = 0) {
  return (x, y) => {
    const fx = (x - F.x0) / F.hc, fy = (y - F.y0) / F.hc;
    const i = Math.floor(fx), j = Math.floor(fy);
    if (i < 0 || j < 0 || i >= F.nx - 1 || j >= F.ny - 1) return def;
    const u = fx - i, v = fy - j, k = j * F.nx + i;
    return (A[k] * (1 - u) + A[k + 1] * u) * (1 - v) + (A[k + F.nx] * (1 - u) + A[k + F.nx + 1] * u) * v;
  };
}
export const at = (F, x, y) => {
  const i = Math.round((x - F.x0) / F.hc), j = Math.round((y - F.y0) / F.hc);
  if (i < 0 || j < 0 || i >= F.nx || j >= F.ny) return -1;
  return j * F.nx + i;
};

// ---------------------------------------------------------------- light
// L: unit vector toward the key (canonical). Rf: the reflected light's direction. Returns per-cell tone.
export function lightField(F, o) {
  const { nx, ny, hc, H, GI, NX, NY } = F;
  const L = norm(o.L), Rf = norm(o.Rf);
  const T = new Float32Array(nx * ny), LAM = new Float32Array(nx * ny), SH = new Float32Array(nx * ny);
  // occlusion: height above the local mean
  const Hp = new Float32Array(nx * ny);
  for (let k = 0; k < nx * ny; k++) Hp[k] = GI[k] >= 0 ? H[k] : H[k] < -40 ? -8 : H[k];
  const blur = (A, r) => {
    const B = new Float32Array(A.length), C = new Float32Array(A.length);
    for (let j = 0; j < ny; j++) { let s = 0; for (let i = -r; i <= r; i++) s += A[j * nx + Math.min(nx - 1, Math.max(0, i))]; for (let i = 0; i < nx; i++) { B[j * nx + i] = s / (2 * r + 1); s += A[j * nx + Math.min(nx - 1, i + r + 1)] - A[j * nx + Math.max(0, i - r)]; } }
    for (let i = 0; i < nx; i++) { let s = 0; for (let j = -r; j <= r; j++) s += B[Math.min(ny - 1, Math.max(0, j)) * nx + i]; for (let j = 0; j < ny; j++) { C[j * nx + i] = s / (2 * r + 1); s += B[Math.min(ny - 1, j + r + 1) * nx + i] - B[Math.max(0, j - r) * nx + i]; } }
    return C;
  };
  const r1 = Math.round(0.22 / hc), r2 = Math.round(0.9 / hc);
  const B1 = blur(blur(Hp, r1), r1), B2 = blur(blur(Hp, r2), r2);
  const lxy = Math.hypot(L[0], L[1]), sx = L[0] / lxy, sy = L[1] / lxy, rise = L[2] / lxy;
  const step = hc * 1.5, nst = Math.ceil(6 / step);
  for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const k = j * nx + i;
    if (GI[k] < 0) continue;
    const ux = NX[k], uy = NY[k], uz = Math.sqrt(Math.max(0, 1 - ux * ux - uy * uy));
    const lam = ux * L[0] + uy * L[1] + uz * L[2];
    LAM[k] = lam;
    // cast shadow: march toward the light through the height field (soft with distance)
    let sh = 0;
    const x = i * hc, y = j * hc, h0 = H[k] + 0.04;
    for (let s = 1; s <= nst; s++) {
      const d = s * step;
      const ii = Math.round(i + sx * d / hc), jj = Math.round(j + sy * d / hc);
      if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) break;
      const kk = jj * nx + ii;
      if (GI[kk] < 0) continue;
      const above = H[kk] - (h0 + rise * d);
      if (above > 0) { sh = Math.max(sh, clamp(above / (0.08 + 0.1 * d))); if (sh >= 1) break; }
    }
    SH[k] = sh;
    const ao = clamp((B1[k] - H[k] - 0.04) / 0.45) * 0.8 + clamp((B2[k] - H[k] - 0.3) / 2.5) * 0.2;
    // form: light side bare paper, half-tones, the terminator darkest, reflected light inside the shadow
    const refl = clamp(ux * Rf[0] + uy * Rf[1] + uz * Rf[2]);
    let t = sm(0.85, -0.1, lam);
    t *= 1 - 0.5 * refl * sm(0.1, -0.35, lam);
    t = Math.min(1, t + 0.18 * Math.exp(-((lam + 0.02) ** 2) / 0.012));       // the core shadow at the terminator
    t = 1 - (1 - t) * (1 - 0.82 * sh * sm(-0.2, 0.25, lam + 0.3));
    t = t + (1 - t) * clamp(ao) * 0.6;
    T[k] = clamp(t);
  }
  return { T, LAM, SH };
}

// ---------------------------------------------------------------- contours
// marching squares on each group's visibility field. Returns polylines [{ g, pts: [[x, y, jump, inner]] }]
export function contours(F, o = {}) {
  const out = [];
  const { hc, nx } = F;
  const front = sampler(F, F.H, -50);
  F.GR.forEach((g, gi) => {
    if (!g.w) return;
    const w = g.w, h = g.h;
    // visibility: inside the group's outline and in front of every other group
    const v = new Float32Array(w * h);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const q = j * w + i, k = (g.j0 + j) * nx + g.i0 + i;
      let val = g.c[q];
      if (val > 0) {
        const other = F.GI[k] === gi ? F.H2[k] : F.H[k];
        if (other > -40) val = Math.min(val, (g.z[q] - other) * 0.6);
      }
      v[q] = val;
    }
    const P = (i, j) => [F.x0 + (g.i0 + i) * hc, F.y0 + (g.j0 + j) * hc];
    const pts = new Map();
    const edge = (i, j, horiz) => {
      const id = (j * w + i) * 2 + (horiz ? 0 : 1);
      if (!pts.has(id)) {
        const a = v[j * w + i], b = horiz ? v[j * w + i + 1] : v[(j + 1) * w + i];
        const t = a / (a - b);
        const p = P(i, j);
        pts.set(id, horiz ? [p[0] + t * hc, p[1]] : [p[0], p[1] + t * hc]);
      }
      return id;
    };
    const adj = new Map();
    const link = (a, b) => { (adj.get(a) || adj.set(a, []).get(a)).push(b); (adj.get(b) || adj.set(b, []).get(b)).push(a); };
    for (let j = 0; j < h - 1; j++) for (let i = 0; i < w - 1; i++) {
      const a = v[j * w + i] > 0, b = v[j * w + i + 1] > 0, c = v[(j + 1) * w + i + 1] > 0, d = v[(j + 1) * w + i] > 0;
      const cs = (a ? 1 : 0) | (b ? 2 : 0) | (c ? 4 : 0) | (d ? 8 : 0);
      if (cs === 0 || cs === 15) continue;
      const T = () => edge(i, j, true), B = () => edge(i, j + 1, true), Lf = () => edge(i, j, false), Rt = () => edge(i + 1, j, false);
      switch (cs) {
        case 1: case 14: link(Lf(), T()); break;
        case 2: case 13: link(T(), Rt()); break;
        case 3: case 12: link(Lf(), Rt()); break;
        case 4: case 11: link(Rt(), B()); break;
        case 6: case 9: link(T(), B()); break;
        case 7: case 8: link(Lf(), B()); break;
        case 5: case 10: {
          const ctr = (v[j * w + i] + v[j * w + i + 1] + v[(j + 1) * w + i + 1] + v[(j + 1) * w + i]) / 4 > 0;
          if ((cs === 5) === ctr) { link(Lf(), B()); link(T(), Rt()); } else { link(Lf(), T()); link(Rt(), B()); }
          break;
        }
      }
    }
    // chain
    const used = new Set();
    const ends = [...adj.keys()].sort((p, q) => (adj.get(p).length === 1 ? 0 : 1) - (adj.get(q).length === 1 ? 0 : 1));
    for (const s of ends) {
      if (used.has(s)) continue;
      const chainIds = [s];
      used.add(s);
      let cur = s;
      for (;;) {
        const nb = adj.get(cur).find((n) => !used.has(n));
        if (nb === undefined) break;
        used.add(nb); chainIds.push(nb); cur = nb;
      }
      if (chainIds.length < 4) continue;
      let line = chainIds.map((id) => pts.get(id).slice());
      for (let it = 0; it < 3; it++) line = line.map((p, k) => (k === 0 || k === line.length - 1) ? p : [(line[k - 1][0] + 2 * p[0] + line[k + 1][0]) / 4, (line[k - 1][1] + 2 * p[1] + line[k + 1][1]) / 4]);
      // classify every point: the depth jump across it, and whether it is this group's line at all
      const gz = (x, y) => {
        const i = Math.round((x - F.x0) / hc) - g.i0, j = Math.round((y - F.y0) / hc) - g.j0;
        if (i < 0 || j < 0 || i >= w || j >= h) return -1e9;
        return g.z[j * w + i];
      };
      const vv = (x, y) => {
        const i = Math.round((x - F.x0) / hc) - g.i0, j = Math.round((y - F.y0) / hc) - g.j0;
        if (i < 0 || j < 0 || i >= w || j >= h) return -1;
        return v[j * w + i];
      };
      const res = line.map((p, k) => {
        const a = line[Math.max(0, k - 2)], b = line[Math.min(line.length - 1, k + 2)];
        let tx = b[0] - a[0], ty = b[1] - a[1];
        const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
        let nx2 = -ty, ny2 = tx;                         // a normal; point it outward (toward v < 0)
        const e = hc * 1.6;
        if (vv(p[0] + nx2 * e, p[1] + ny2 * e) > vv(p[0] - nx2 * e, p[1] - ny2 * e)) { nx2 = -nx2; ny2 = -ny2; }
        let zin = -1e9;
        for (const f of [1.5, 2.5, 3.5]) { zin = gz(p[0] - nx2 * hc * f, p[1] - ny2 * hc * f); if (zin > -1e8) break; }
        const xo = p[0] + nx2 * hc * 2.5, yo = p[1] + ny2 * hc * 2.5;
        const zout = front(xo, yo);
        const ko = at(F, xo, yo);
        return [p[0], p[1], zin > -1e8 ? zin - zout : 0, nx2, ny2, ko < 0 ? -1 : F.GI[ko]];
      });
      out.push({ g: gi, name: g.name, pts: res });
    }
  });
  return out;
}

