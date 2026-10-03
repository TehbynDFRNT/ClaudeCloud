// Deterministic additive Canvas2D effects for the vortex scene: shock sparks and foreground debris streaks.
// Everything is a pure function of (params, local time): particles are re-born on fixed cycles keyed by id.
import { hash1, hash2 } from '../../engine/rng.js';
import { v3 } from '../../engine/math.js';

// hot spark colour from a 0..1 heat
function sparkRGB(h) {
  const r = 255, g = Math.round(255 * Math.min(1, 0.25 + 0.85 * h)), b = Math.round(255 * Math.max(0, Math.min(1, (h - 0.55) * 1.8)));
  return `${r},${g},${b}`;
}

// sparks: { origin:[x,y,z], count, life, speed, spread, up, drift:[x,y,z], gain, width, shutter, axis:[x,y,z] }
// origin: impact point; axis: mean ejection direction; drift: bulk velocity (e.g. downstream rotation)
export function sparks(ctx, E, F, o) {
  const { cam, local } = F;
  const W = E.W, H = E.H;
  // pixel clamps follow the frame's short side (E.k = 1 at 1080), so a 9:16 frame and a 16:9 frame draw the same
  // stroke weights; the projected width itself is resolution-independent (H / (z * 2 tanH) px per world unit)
  const pk = E.k || H / 1080;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  const axis = v3.norm(o.axis || [0, 1, 0]);
  const n = o.count || 260;
  const life = o.life || 0.9;
  const shutter = o.shutter || 0.035;
  const g = o.gravity || [0, 0, 0];
  const pos = (p0, v, a) => [
    p0[0] + v[0] * a + 0.5 * g[0] * a * a,
    p0[1] + v[1] * a + 0.5 * g[1] * a * a,
    p0[2] + v[2] * a + 0.5 * g[2] * a * a,
  ];
  for (let k = 0; k < n; k++) {
    const lk = life * (0.45 + 0.9 * hash1(k, 11));
    const ph = local / lk + hash1(k, 12);
    const cyc = Math.floor(ph);
    const a = (ph - cyc) * lk;
    const id = k * 977 + cyc;
    // random direction in a cone around the axis
    const u1 = hash2(id, 1, 5), u2 = hash2(id, 2, 5), u3 = hash2(id, 3, 5);
    const rnd = v3.norm([u1 * 2 - 1, u2 * 2 - 1, u3 * 2 - 1]);
    const dir = v3.norm(v3.add(v3.mul(axis, 1.0), v3.mul(rnd, o.spread ?? 0.8)));
    const sp = (o.speed || 0.5) * (0.3 + 1.2 * Math.pow(hash2(id, 4, 5), 1.6));
    const v = v3.add(v3.mul(dir, sp), o.drift || [0, 0, 0]);
    const jit = (o.jitter ?? 0.02);
    const p0 = v3.add(o.origin, [(hash2(id, 6, 5) - 0.5) * jit, (hash2(id, 7, 5) - 0.5) * jit * 0.5, (hash2(id, 8, 5) - 0.5) * jit]);
    const a0 = Math.max(0, a - shutter);
    const A = cam.project(pos(p0, v, a0), W, H), B = cam.project(pos(p0, v, a), W, H);
    if (!A || !B) continue;
    const heat = Math.exp(-3.0 * a / lk) * (0.6 + 0.4 * hash2(id, 9, 5));
    const fade = Math.min(1, a / 0.03);
    const wpx = Math.max(0.5 * pk, Math.min(3.0 * pk, (o.width || 0.004) * H / (B.z * cam.tanH * 2)));
    const alpha = Math.min(1, heat * fade * (o.gain || 1));
    if (alpha < 0.01) continue;
    // tapered streak: transparent tail -> hot head, plus a tiny bright head dot
    const g = ctx.createLinearGradient(A.x, A.y, B.x, B.y);
    const rgb = sparkRGB(heat);
    g.addColorStop(0, `rgba(${rgb},0)`);
    g.addColorStop(1, `rgba(${rgb},${alpha.toFixed(3)})`);
    ctx.strokeStyle = g;
    ctx.lineWidth = wpx;
    ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
    ctx.fillStyle = `rgba(255,${Math.round(220 + 35 * heat)},${Math.round(160 + 90 * heat)},${(alpha * 0.9).toFixed(3)})`;
    ctx.beginPath(); ctx.arc(B.x, B.y, wpx * 0.75, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// debris: foreground glowing clumps swept past the lens along the Keplerian flow
// { count, rmin, rmax, ymax, omega, shutter, gain, width, color:[r,g,b], zmax (only foreground: max depth) }
export function debris(ctx, E, F, o) {
  const { cam, tau } = F;
  const W = E.W, H = E.H;
  const pk = E.k || H / 1080;   // pixel clamps follow the frame's short side (see sparks)
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  const n = o.count || 200;
  const sh = o.shutter || 0.05;
  for (let k = 0; k < n; k++) {
    const r = o.rmin + (o.rmax - o.rmin) * hash1(k, 31);
    const y = (hash1(k, 32) * 2 - 1) * (o.ymax || 0.05) * r;
    const om = (o.omega || 0.22) * Math.pow(r, -1.5);
    const phi0 = hash1(k, 33) * Math.PI * 2;
    const P = (tt) => { const ph = phi0 + om * tt; return [r * Math.cos(ph), y, -r * Math.sin(ph)]; };
    const A = cam.project(P(tau - sh), W, H), B = cam.project(P(tau), W, H);
    if (!A || !B || B.z < 0.02 || B.z > (o.zmax || 1e9)) continue;
    const near = Math.min(1, 0.12 / B.z);
    const temp = hash1(k, 34);
    const c = o.color || [255, 120, 40];
    const alpha = Math.min(1, (o.gain || 0.5) * near * (0.4 + 0.6 * temp));
    if (alpha < 0.01) continue;
    ctx.strokeStyle = `rgba(${c[0]},${Math.round(c[1] * (0.6 + 0.6 * temp))},${c[2]},${alpha.toFixed(3)})`;
    ctx.lineWidth = Math.max(0.7 * pk, Math.min(6 * pk, (o.width || 0.003) * H / (B.z * cam.tanH * 2)));
    ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
  }
  ctx.restore();
}
