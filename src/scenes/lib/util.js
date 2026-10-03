// Shared scene helpers.
import { keys, camera, v3 } from '../../engine/math.js';

// Camera from keyframes in shot params:
//   cam: [[localSeconds, [px,py,pz], [tx,ty,tz], fovDeg, rollRad?, easing?], ...]
// Easing names from engine/math.js `ease` apply to the segment ending at that key.
export function camFromKeys(list, local) {
  const k = (idx, def) => list.map((e) => [e[0], e[idx] ?? def, e[5]]);
  const pos = keys(k(1), local);
  const tgt = keys(k(2), local);
  const fov = keys(k(3, 40), local);
  const roll = keys(k(4, 0), local);
  return camera(pos, tgt, fov, roll);
}

// Deterministic handheld/orbital drift: small smooth offsets from time (seconds).
export function drift(t, amp = 1, speed = 1, seed = 0) {
  const s = (a, b) => Math.sin(t * speed * a + seed * 13.1 + b) * 0.5 + Math.sin(t * speed * a * 2.31 + seed * 7.7 + b * 1.7) * 0.25;
  return [s(0.37, 0.0) * amp, s(0.29, 1.3) * amp, s(0.23, 2.9) * amp];
}

export function addDrift(cam, t, amp, speed, seed) {
  const d = drift(t, amp, speed, seed);
  const pos = v3.add(cam.pos, d);
  const tgt = v3.add(v3.add(cam.pos, cam.fwd), v3.mul(d, 0.6));
  return { pos, tgt };
}

export { keys, camera, v3 };
