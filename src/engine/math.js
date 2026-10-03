// Small vector/camera/easing toolkit shared by scenes and overlays.

export const v3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: (a) => Math.hypot(a[0], a[1], a[2]),
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
};

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const mix = lerp;
export const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const remap = (x, a, b, c, d) => c + (d - c) * clamp((x - a) / (b - a));

export const ease = {
  linear: (t) => t,
  inQuad: (t) => t * t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  inCubic: (t) => t * t * t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  outSine: (t) => Math.sin((t * Math.PI) / 2),
  inSine: (t) => 1 - Math.cos((t * Math.PI) / 2),
};

// Per-shot reframing for a different output aspect (the 9:16 cut). The film sets it for the shot being
// drawn (identity otherwise), and every camera() built while it is set is reframed exactly once:
//   roll  extra camera roll, degrees (positive rolls the camera counter-clockwise, so the picture turns
//         clockwise on screen: the top of the old frame moves to the right)
//   zoom  tan(fov/2) divisor (2 = twice as tight)
//   pan   [x, y] point of the ORIGINAL 16:9 frame (frameUV units, y up) that becomes the new centre
//   dolly world units along the view direction (positive = closer)
// The unframed camera stays available as cam.raw; code that rebuilds a camera from an existing one
// (handheld drift, shake) must start from cam.raw so the reframing is not applied twice.
export const IDENTITY_FRAMING = Object.freeze({ roll: 0, zoom: 1, pan: [0, 0], dolly: 0 });
let FRAMING = IDENTITY_FRAMING;
export function setFraming(fr) { FRAMING = fr ? { ...IDENTITY_FRAMING, ...fr } : IDENTITY_FRAMING; }
export function getFraming() { return FRAMING; }

function basis(f, worldUp, roll) {
  let r = v3.norm(v3.cross(f, worldUp));
  if (!isFinite(r[0]) || v3.len(v3.cross(f, worldUp)) < 1e-6) r = [1, 0, 0];
  let u = v3.cross(r, f);
  if (roll) {
    const c = Math.cos(roll), s = Math.sin(roll);
    const r2 = v3.add(v3.mul(r, c), v3.mul(u, s));
    const u2 = v3.add(v3.mul(u, c), v3.mul(r, -s));
    r = r2; u = u2;
  }
  return [r, u];
}

// Build a camera. fov = vertical field of view in degrees. roll in radians.
// Returns uniforms {uCamPos, uCamRot (mat3 column-major), uTanHalfFov} and a project() fn.
export function camera(pos, target, fovDeg = 40, roll = 0, worldUp = [0, 1, 0]) {
  const f0 = v3.norm(v3.sub(target, pos));
  const [r0, u0] = basis(f0, worldUp, roll);
  const tan0 = Math.tan((fovDeg * Math.PI) / 360);
  const raw = { pos, fwd: f0, right: r0, up: u0, tanH: tan0, fov: fovDeg, roll, worldUp };
  let f = f0, r = r0, u = u0, tanH = tan0;
  const F = FRAMING;
  if (F !== IDENTITY_FRAMING) {
    if (F.dolly) pos = v3.add(pos, v3.mul(f0, F.dolly));
    if (F.pan && (F.pan[0] || F.pan[1])) {
      // aim at the original frame's point (pan.x, pan.y), keeping the original horizon orientation
      f = v3.norm(v3.add(f0, v3.add(v3.mul(r0, F.pan[0] * tan0 * (16 / 9)), v3.mul(u0, F.pan[1] * tan0))));
      r = v3.norm(v3.cross(f, u0)); u = v3.cross(r, f);
    }
    if (F.roll) {
      const a = (F.roll * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
      const r2 = v3.add(v3.mul(r, c), v3.mul(u, s));
      const u2 = v3.add(v3.mul(u, c), v3.mul(r, -s));
      r = r2; u = u2;
    }
    if (F.zoom && F.zoom !== 1) tanH /= F.zoom;
  }
  return {
    pos, fwd: f, right: r, up: u, tanH, raw,
    uniforms: { uCamPos: pos, uCamRot: [...r, ...u, ...f], uTanHalfFov: tanH },
    // project world point -> full-frame pixel coords (x right, y down) + depth; null if behind
    project(p, W, H) {
      const d = v3.sub(p, pos);
      const z = v3.dot(d, f);
      if (z <= 1e-6) return null;
      const x = v3.dot(d, r) / (z * tanH * (W / H));
      const y = v3.dot(d, u) / (z * tanH);
      return { x: (x * 0.5 + 0.5) * W, y: (0.5 - y * 0.5) * H, z };
    },
    // angular size in pixels of a sphere radius R at point p
    pixelRadius(p, R, H) { const z = v3.dot(v3.sub(p, pos), f); return z > 0 ? (R / (z * tanH)) * H * 0.5 : 0; },
  };
}

// Catmull-Rom through points (arrays of numbers of any length), t in [0,1] over whole path.
export function catmull(points, t) {
  const n = points.length - 1;
  const x = clamp(t) * n;
  const i = Math.min(n - 1, Math.floor(x));
  const u = x - i;
  const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(n, i + 2)];
  return p1.map((_, k) => {
    const a = p0[k], b = p1[k], c = p2[k], d = p3[k];
    return 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
  });
}

// Piecewise keyframes: keys = [[t, value(s)], ...] sorted; easing per segment optional (key[2]).
export function keys(list, t) {
  if (t <= list[0][0]) return list[0][1];
  for (let i = 0; i < list.length - 1; i++) {
    const [t0, a] = list[i], [t1, b, e] = list[i + 1];
    if (t <= t1) {
      const u = (t - t0) / (t1 - t0);
      const k = (e ? ease[e] : ease.inOutSine)(u);
      return Array.isArray(a) ? a.map((x, j) => lerp(x, b[j], k)) : lerp(a, b, k);
    }
  }
  return list[list.length - 1][1];
}
