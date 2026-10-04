// The statue's turn, cameras, lights and matrices.
// Studio (world) frame: the viewer axis is +Z (a camera on +Z looking at the head looks down -Z), +Y up, +X screen
// right. The head turns about +Y through its origin: world = R_y(yaw) head. yaw 90 puts the camera on the figure's
// right (-X head side): pure profile, the face pointing screen-right; yaw 0 looks straight down the lens.
import { camera, keys, v3, clamp } from '../../engine/math.js';
import { drift } from './util.js';
import { resolvePoint } from './statue-mesh.js';

export const D2R = Math.PI / 180;

// Head yaw (deg) from params.turn = [fromFrame, toFrame, fromDeg, toDeg] as a function of the FILM frame: linear,
// with a gentle settle over the last 8% (C1: the speed eases to zero exactly at toFrame, then holds).
export function turnYaw(turn, f) {
  const [f0, f1, a0, a1] = turn;
  const u = clamp((f - f0) / Math.max(1, f1 - f0));
  const k = 0.92, s = 1 / (1 - (1 - k) / 2);
  const g = u < k ? s * u : s * u - (s * (u - k) * (u - k)) / (2 * (1 - k));
  return a0 + (a1 - a0) * Math.min(1, g);
}

// rotate v about +Y by deg (the head -> world map for the head's yaw)
export function rotY(v, deg) {
  const a = deg * D2R, c = Math.cos(a), s = Math.sin(a);
  return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
}
// unit direction from azimuth (deg, from the viewer axis +Z toward screen-right +X) and elevation (deg)
export function dirAzEl(az, el) {
  const a = az * D2R, e = el * D2R;
  return [Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a)];
}

// value or keyframes [[u, value, easing?], ...] over the shot (u = 0 first frame .. 1 last)
export function kv(v, u, def) {
  if (v === undefined || v === null) return def;
  if (Array.isArray(v) && Array.isArray(v[0])) return keys(v, u);
  return v;
}

// The shot camera. P (resolved at the shot time u): aim (head-space point spec), height (visible frame height at the
// aim point, head units, over the FULL frame), fov (vertical, deg), az / el (deg, the camera's direction from the aim
// point in the studio frame), screen [sx, sy] (where the aim point sits, frameUV), roll (deg), drift (amplitude).
export function statueCamera(E, meta, P, yaw, u, t) {
  const tgtH = resolvePoint(meta, P.aim ?? 'eyes');
  const tgt = rotY(tgtH, yaw);
  const fov = kv(P.fov, u, 24);
  const tanH = Math.tan((fov * D2R) / 2);
  const height = kv(P.height, u, 1.0);
  const dist = height / (2 * tanH);
  const dir = dirAzEl(kv(P.az, u, 0), kv(P.el, u, 0));
  const pos = v3.add(tgt, v3.mul(dir, dist));
  const [sx, sy] = kv(P.screen, u, [0, 0]);
  const aspect = E.W / E.H;
  const f0 = v3.norm(v3.sub(tgt, pos));
  const ya = Math.atan(sx * tanH * aspect), pa = Math.atan(sy * tanH);
  const r0 = v3.norm(v3.cross(f0, [0, 1, 0])), u0 = v3.cross(r0, f0);
  let f = v3.add(v3.mul(f0, Math.cos(ya)), v3.mul(r0, -Math.sin(ya)));
  f = v3.norm(v3.add(v3.mul(f, Math.cos(pa)), v3.mul(u0, -Math.sin(pa))));
  let look = v3.add(pos, f);
  const dr = kv(P.drift, u, 0.6);
  let p2 = pos;
  if (dr) {
    // a slow breathing drift of the lens: tiny angular wander plus a whisper of translation (scaled to the framing)
    const d = drift(t, dr * 0.0025, 0.55, 3), d2 = drift(t + 11.3, dr * 0.004 * height, 0.4, 7);
    look = v3.add(look, d);
    p2 = v3.add(pos, d2);
    look = v3.add(look, d2);
  }
  const cam = camera(p2, look, fov, kv(P.roll, u, 0) * D2R);
  return { cam, dist, tgt, tgtH, fov, height };
}

// ---------------------------------------------------------------- column-major 4x4 helpers
export function mul4(a, b) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
    o[c * 4 + r] = s;
  }
  return o;
}
// world -> clip for an engine camera (same projection as cameraRay(frameUV()) in the fullscreen passes)
export function viewProj(cam, aspect, near, far) {
  const r = cam.right, u = cam.up, f = cam.fwd, p = cam.pos;
  const V = new Float32Array([
    r[0], u[0], -f[0], 0,
    r[1], u[1], -f[1], 0,
    r[2], u[2], -f[2], 0,
    -v3.dot(r, p), -v3.dot(u, p), v3.dot(f, p), 1,
  ]);
  const t = cam.tanH;
  const Pm = new Float32Array([
    1 / (t * aspect), 0, 0, 0,
    0, 1 / t, 0, 0,
    0, 0, (far + near) / (near - far), -1,
    0, 0, (2 * far * near) / (near - far), 0,
  ]);
  return mul4(Pm, V);
}
// head -> world rotation for yaw, as a mat4
export function yawMat4(yaw) {
  const a = yaw * D2R, c = Math.cos(a), s = Math.sin(a);
  return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
}

// Orthographic key-light matrix in HEAD space: looks along -L (L points toward the light), covers a disc of radius r
// around centre c, depth spans the whole mesh (bounding sphere bc, br) so every caster is inside.
export function shadowMatrix(L, c, r, bc, br) {
  const f = v3.mul(L, -1);
  const right = v3.norm(v3.cross(f, Math.abs(f[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0]));
  const up = v3.cross(right, f);
  const zr = br + Math.abs(v3.dot(v3.sub(bc, c), L)) + 0.05;
  const m = new Float32Array([
    right[0] / r, up[0] / r, f[0] / zr, 0,
    right[1] / r, up[1] / r, f[1] / zr, 0,
    right[2] / r, up[2] / r, f[2] / zr, 0,
    -v3.dot(c, right) / r, -v3.dot(c, up) / r, -v3.dot(c, f) / zr, 1,
  ]);
  return { m, depthRange: 2 * zr };
}

// letterbox fraction at film frame f (mirrors the engine's plan effects; used to skip rows the bars hide)
export function letterboxAt(plan, f, ease) {
  let lb = plan?.format?.letterbox ?? 0.128;
  for (const e of plan?.effects || []) {
    if (e.type === 'letterbox' && f >= e.frame) {
      const u = clamp((f - e.frame) / Math.max(1, e.frames || 1));
      lb = (e.from ?? lb) + (e.to - (e.from ?? lb)) * ease(u);
    }
  }
  return lb;
}
