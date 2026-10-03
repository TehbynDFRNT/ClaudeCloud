// 3D strokes for the plasma scene: magnetic filaments and incandescent sparks, projected through the
// shot camera and emitted as soft HDR geometry into SoftLines (lib/plasma-lines.js).
// Deterministic: every strand/spark is a pure function of (params, integer ids, local time).
import { hash1 } from '../../engine/rng.js';

const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const keyed = (v, t) => (Array.isArray(v) ? v[0] + (v[1] - v[0]) * smooth(0, 1, t) : v);
const lin = (c) => [(c[0] / 255) ** 2.2, (c[1] / 255) ** 2.2, (c[2] / 255) ** 2.2];

// circle-of-confusion diameter in output pixels (params are in px at 1920 wide; k = W / 1920)
function cocPx(z, D, k) {
  if (!D || !D.aperture) return 0;
  return Math.min(D.max ?? 30, D.aperture * Math.abs(1 - (D.focus ?? 3) / Math.max(z, 1e-3))) * k;
}

// visibility of point p behind an opaque sphere (c, r) seen from the camera
function sphereVis(cam, p, c, r) {
  const d = [p[0] - cam.pos[0], p[1] - cam.pos[1], p[2] - cam.pos[2]];
  const L = Math.hypot(d[0], d[1], d[2]);
  const u = [d[0] / L, d[1] / L, d[2] / L];
  const oc = [c[0] - cam.pos[0], c[1] - cam.pos[1], c[2] - cam.pos[2]];
  const tc = oc[0] * u[0] + oc[1] * u[1] + oc[2] * u[2];
  if (tc <= 0 || tc >= L) return 1;
  const dx = oc[0] - u[0] * tc, dy = oc[1] - u[1] * tc, dz = oc[2] - u[2] * tc;
  const dist = Math.hypot(dx, dy, dz);
  const h = Math.sqrt(Math.max(0, r * r - dist * dist));
  if (tc - h > L) return 1;
  return smooth(r * 0.92, r * 1.04, dist);
}

// half width (px) and intensity factor for a stroke of core width wc (px) at depth z: energy-conserving
// widening by the circle of confusion, never thinner than ~1.6 px so strands stay antialiased
function dofWidth(z, wc, D, k) {
  const coc = cocPx(z, D, k);
  const w = Math.max(wc, coc * 0.6, 2.6);   // strip width; the soft profile's FWHM is ~0.6 of it
  return [w * 0.5, Math.pow(Math.max(wc, 1.4) / w, 0.85)];
}

// ---------------------------------------------------------------------------------------------
// FILAMENTS: a twisted magnetic flux rope draped around a hot core.
// P.fil = { n, heroes, len, R0, wrap:[a,b], twist:[a,b], twistLin, twistCore, pinch:[a,b], spin, braid,
//           coreW, width, gain, hdr, color, glow, tension, bBase, bCore, endFade, occlude,
//           events:[{t, i, s, type:'snap'|'reconnect', j, recoil, gap, kink, va, sparks}] }
function linePoint(F, i, s, t, u, Rc, out) {
  const h1 = hash1(i, 11), h2 = hash1(i, 23), h3 = hash1(i, 37);
  const r0 = F.R0 * Math.sqrt(0.08 + 0.92 * h1) * (i >= (F.n ?? 40) - (F.outer ?? 0) ? (F.outerMul ?? 2.6) : 1);
  const phi = TAU * h2;
  const pinch = keyed(F.pinch ?? 1, u);
  const wrap = keyed(F.wrap ?? 1.4, u) * Rc;
  const w = F.coreW ?? 1.2;
  const g = Math.exp(-(s * s) / (w * w));
  const braid = F.braid ?? 0.25;
  const br = braid * (Math.sin(1.7 * s + TAU * h3 * 3 + t * 1.9) * 0.6 + Math.sin(3.1 * s - TAU * h1 * 5 - t * 2.7) * 0.4);
  let rad = Math.sqrt((r0 * pinch) ** 2 + wrap * wrap * g) * (1 + 0.18 * br);
  const tw = keyed(F.twist ?? 1, u);
  const th = phi + tw * (s * (F.twistLin ?? 0.6) + (F.twistCore ?? 1.0) * Math.atan(s / w)) + (F.spin ?? 0) * t + br * 0.6;
  rad += (F.tension ?? 0) * Math.sin(s * 2.3 + t * 47 + h3 * 20) * Math.sin(t * 31 + h2 * 9); // taut vibration
  out[0] = s; out[1] = Math.cos(th) * rad; out[2] = Math.sin(th) * rad; out[3] = th;
  return out;
}

export function drawFilaments(L, cam, t, P, W, H, S) {
  const F = P.fil || {};
  const C = (P.core && P.core.pos) || [0, 0, 0];
  const Rc = (P.core && P.core.r) || 0.4;
  const A = norm(F.axis || (P.core && P.core.axis) || [1, 0, 0]);
  const e1 = norm(cross(A, Math.abs(A[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]));
  const e2 = cross(A, e1);
  const toW = (q) => [C[0] + A[0] * q[0] + e1[0] * q[1] + e2[0] * q[2], C[1] + A[1] * q[0] + e1[1] * q[1] + e2[1] * q[2], C[2] + A[2] * q[0] + e1[2] * q[1] + e2[2] * q[2]];
  const k = W / 1920;
  const u = clamp(t / Math.max(S.dur, 1e-3));
  const n = F.n ?? 40, M = F.samples ?? 160, Ls = F.len ?? 5;
  const D = P.dof;
  const col = lin(F.color || [150, 205, 255]);
  const glowCol = lin(F.glow || [40, 120, 255]);
  const white = [1, 0.97, 0.94];
  const hdr = F.hdr ?? 14;
  const gain = F.gain ?? 1;
  const events = F.events || [];
  const tmp = [0, 0, 0, 0];
  const occl = F.occlude !== false;
  const snaps = [];
  for (let i = 0; i < n; i++) {
    const bi = (0.12 + 0.88 * Math.pow(hash1(i, 51), 2.2)) * (i < (F.heroes ?? 4) ? 2.2 : 1);
    const ph1 = TAU * hash1(i, 63), ph2 = TAU * hash1(i, 67), ph3 = TAU * hash1(i, 61);
    const ev = events.filter((e) => e.i === i && t >= e.t);
    let run = [], glowRun = [];
    const flush = () => {
      if (run.length >= 2) { L.strip(glowRun); L.strip(run); }
      run = []; glowRun = [];
    };
    for (let m = 0; m <= M; m++) {
      const s = -Ls + (2 * Ls * m) / M;
      linePoint(F, i, s, t, u, Rc, tmp);
      let px = tmp[0], py = tmp[1], pz = tmp[2];
      let b = 1, cut = false;
      for (const e of ev) {
        const dt = t - e.t, ds = s - e.s;
        if (e.type === 'snap') {
          const gap = (e.gap ?? 0.35) * (1 - Math.exp(-dt / 0.06));
          if (Math.abs(ds) < gap) cut = true;
          // recoil: free ends whip outward and back; a kink runs away along the line (Alfven wave)
          const side = Math.sign(ds) || 1;
          const rec = (e.recoil ?? 0.5) * Math.exp(-Math.abs(ds) / 0.6) * (1 - Math.exp(-dt / 0.08));
          const kp = Math.abs(ds) - (e.va ?? 7) * dt;
          const kink = (e.kink ?? 0.25) * Math.exp(-(kp * kp) / 0.08) * Math.exp(-dt / 0.5);
          const ang = tmp[3] + 0.9 * side, rr = rec + kink;
          py += Math.cos(ang) * rr; pz += Math.sin(ang) * rr; px += side * rec * 0.6;
          b *= 1 + 5 * Math.exp(-dt / 0.12) * Math.exp(-Math.abs(ds) / 0.5) + 3 * kink;
        } else if (e.type === 'reconnect') {
          const bw = 0.15 + dt * 2.5;
          const wgt = smooth(-bw, bw, ds);
          if (wgt > 0) {
            const q = linePoint(F, e.j, s, t, u, Rc, [0, 0, 0, 0]);
            px += (q[0] - px) * wgt; py += (q[1] - py) * wgt; pz += (q[2] - pz) * wgt;
          }
          b *= 1 + 4 * Math.exp(-dt / 0.15) * Math.exp(-Math.abs(ds) / 0.4);
        }
      }
      if (cut) { flush(); continue; }
      const wp = toW([px, py, pz]);
      const pr = cam.project(wp, W, H);
      if (!pr) { flush(); continue; }
      // brightness along the strand: field strength near the core, travelling pulses, beads, faded ends
      const g = Math.exp(-(s * s) / ((F.coreW ?? 1.2) * 1.8) ** 2);
      const pulse = 0.7 + 0.3 * Math.sin(4.0 * s - 7.0 * t + ph3);
      const bead = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(1.3 * s + ph1 + t * 0.9) * Math.sin(2.3 * s + ph2 - t * 1.4), 1.5);
      b *= ((F.bBase ?? 0.25) + (F.bCore ?? 0.95) * g) * pulse * bead * smooth(Ls, Ls * (F.endFade ?? 0.75), Math.abs(s));
      if (occl && b > 0) b *= sphereVis(cam, wp, C, Rc);
      const [hw, f] = dofWidth(pr.z, (F.width ?? 1.4) * k, D, k);
      const e = b * bi * gain * f;
      const hot = clamp((e - 0.9) * 0.7);
      const c = [(col[0] + (white[0] - col[0]) * hot) * e * hdr, (col[1] + (white[1] - col[1]) * hot) * e * hdr, (col[2] + (white[2] - col[2]) * hot) * e * hdr];
      run.push({ x: pr.x, y: pr.y, w: hw, c });
      glowRun.push({ x: pr.x, y: pr.y, w: hw * 3.5 + 3 * k, c: [glowCol[0] * e * hdr * 0.06, glowCol[1] * e * hdr * 0.06, glowCol[2] * e * hdr * 0.06] });
    }
    flush();
    for (const e of ev) if (e.type === 'snap' && t - e.t < 0.45) snaps.push({ e, i });
  }
  // reconnection outflow: bidirectional jets of sparks along the local field + a flash at the X-point
  for (const { e, i } of snaps) {
    const dt = t - e.t;
    linePoint(F, i, e.s, e.t, u, Rc, tmp);
    const c0 = toW(tmp);
    const tq = linePoint(F, i, e.s + 0.05, e.t, u, Rc, [0, 0, 0, 0]);
    const tang = norm([A[0] * (tq[0] - tmp[0]) + e1[0] * (tq[1] - tmp[1]) + e2[0] * (tq[2] - tmp[2]), A[1] * (tq[0] - tmp[0]) + e1[1] * (tq[1] - tmp[1]) + e2[1] * (tq[2] - tmp[2]), A[2] * (tq[0] - tmp[0]) + e1[2] * (tq[1] - tmp[1]) + e2[2] * (tq[2] - tmp[2])]);
    const b1 = norm(cross(tang, [0, 1, 0])), b2 = cross(tang, b1);
    const ns = e.sparks ?? 30;
    for (let q = 0; q < ns; q++) {
      const id = q + i * 97;
      const hA = hash1(id, 71), hB = hash1(id, 83), hC = hash1(id, 89), hD = hash1(id, 91);
      const sgn = q % 2 ? 1 : -1, cone = 0.15 + 0.6 * hB * hB, ang = TAU * hA;
      const dir = norm([0, 1, 2].map((a) => tang[a] * sgn + (b1[a] * Math.cos(ang) + b2[a] * Math.sin(ang)) * cone));
      const sp = 1.5 + 9 * hC * hC;
      const life = 0.12 + 0.35 * hD;
      if (dt > life) continue;
      const drag = 6;
      const dist = (x) => (sp * (1 - Math.exp(-drag * x))) / drag;
      const pts = [];
      for (let m = 0; m <= 3; m++) {
        const d = dist(Math.max(0, dt - 0.045 * (1 - m / 3)));
        const pr = cam.project([c0[0] + dir[0] * d, c0[1] + dir[1] * d - 0.3 * d * d, c0[2] + dir[2] * d], W, H);
        if (!pr) break;
        const [hw, f] = dofWidth(pr.z, (1.0 + 1.2 * hash1(id, 93)) * k, D, k);
        const fade = Math.pow(1 - dt / life, 1.5) * (0.2 + 0.8 * (m / 3) ** 2) * f;
        pts.push({ x: pr.x, y: pr.y, w: hw, c: [0.7 * fade * 30, 0.85 * fade * 30, 1.0 * fade * 30] });
      }
      if (pts.length === 4) L.strip(pts);
    }
    const pc = cam.project(c0, W, H);
    if (pc) {
      const f = Math.exp(-dt / 0.06);
      L.disk(pc.x, pc.y, (24 + 50 * (1 - f)) * k, [0.8 * f * 40, 0.9 * f * 40, 1.0 * f * 40]);
      L.disk(pc.x, pc.y, (90 + 80 * (1 - f)) * k, [0.15 * f * 2, 0.35 * f * 2, 1.0 * f * 2]);
    }
  }
}

// ---------------------------------------------------------------------------------------------
// SPARKS: incandescent particles with linear drag + gravity, drawn as tapered motion-blurred streaks.
// P.sparks = { n, window:[t0,t1], life:[a,b], shutter, width, gain, hdr, hot,
//              emit:{pos | points:[...], spread:[x,y,z], dir, cone, speed:[a,b]}, gravity:[x,y,z], drag }
const SPARK_STOPS = [[0, [90, 6, 2]], [0.3, [200, 30, 6]], [0.55, [255, 110, 20]], [0.78, [255, 190, 90]], [1, [255, 245, 225]]].map(([t, c]) => [t, lin(c)]);
function sparkColor(T) {
  for (let i = 1; i < SPARK_STOPS.length; i++) {
    if (T <= SPARK_STOPS[i][0]) {
      const [t0, c0] = SPARK_STOPS[i - 1], [t1, c1] = SPARK_STOPS[i];
      const f = (T - t0) / (t1 - t0);
      return [c0[0] + (c1[0] - c0[0]) * f, c0[1] + (c1[1] - c0[1]) * f, c0[2] + (c1[2] - c0[2]) * f];
    }
  }
  return SPARK_STOPS[SPARK_STOPS.length - 1][1];
}

function sparkPos(Sp, id, age, out) {
  const E = Sp.emit || {};
  const h = (k) => hash1(id, k);
  const sp = E.spread || [0.3, 0, 0.3];
  const p0 = E.points ? E.points[Math.floor(h(12) * E.points.length) % E.points.length] : (E.pos || [0, 0, 0]);
  const dir = norm(E.dir || [0, 1, 0]);
  const cone = E.cone ?? 0.5;
  const a = TAU * h(3), c = 1 - (1 - Math.cos(cone)) * h(4);
  const sn = Math.sqrt(1 - c * c);
  const t1 = norm(cross(dir, Math.abs(dir[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]));
  const t2 = cross(dir, t1);
  const d = [0, 1, 2].map((q) => dir[q] * c + (t1[q] * Math.cos(a) + t2[q] * Math.sin(a)) * sn);
  const spd = (E.speed || [2, 5])[0] + ((E.speed || [2, 5])[1] - (E.speed || [2, 5])[0]) * Math.pow(h(5), 0.7);
  const kd = Sp.drag ?? 1.2;
  const g = Sp.gravity || [0, -3, 0];
  const f = (1 - Math.exp(-kd * age)) / kd;
  const fg = (age - f) / kd;
  out[0] = p0[0] + (h(6) - 0.5) * 2 * sp[0] + d[0] * spd * f + g[0] * fg;
  out[1] = p0[1] + (h(7) - 0.5) * 2 * sp[1] + d[1] * spd * f + g[1] * fg;
  out[2] = p0[2] + (h(8) - 0.5) * 2 * sp[2] + d[2] * spd * f + g[2] * fg;
  return out;
}

export function drawSparks(L, cam, t, P, W, H, S) {
  const Sp = P.sparks || {};
  const k = W / 1920;
  const n = Sp.n ?? 800;
  const win = Sp.window || [-1.5, S.dur];
  const life = Sp.life || [0.4, 1.2];
  const shutter = Sp.shutter ?? 0.03;
  const D = P.dof;
  const gain = Sp.gain ?? 1;
  const hdr = Sp.hdr ?? 40;
  const NS = 4;
  const pa = [0, 0, 0];
  for (let id = 0; id < n; id++) {
    const tb = win[0] + (win[1] - win[0]) * hash1(id, 1);
    const Lf = life[0] + (life[1] - life[0]) * hash1(id, 2);
    const age = t - tb;
    if (age < 0 || age > Lf) continue;
    const sh = shutter * (0.7 + 0.6 * hash1(id, 13));
    const ageS = Math.max(0, age - sh);
    const u = age / Lf;
    const T = clamp((Sp.hot ?? 1) * (1 - u * 0.85) * (0.75 + 0.25 * hash1(id, 9)));
    const flick = 0.75 + 0.25 * Math.sin(age * 60 + hash1(id, 10) * 30);
    const fadeIn = smooth(0, 0.04, age);
    const base = gain * flick * fadeIn * (1 - smooth(0.8, 1, u)) * (0.5 + 0.5 * T) * hdr;
    const size = (Sp.width ?? 1.6) * k * (0.6 + 0.8 * hash1(id, 11));
    const pts = [];
    let off = 0;
    for (let q = 0; q <= NS; q++) {
      sparkPos(Sp, id, ageS + (age - ageS) * (q / NS), pa);
      const pr = cam.project(pa, W, H);
      if (!pr) break;
      if (pr.x < -60 || pr.x > W + 60 || pr.y < -60 || pr.y > H + 60) off++;
      const f = q / NS;
      const [hw, fw] = dofWidth(pr.z, size, D, k);
      const c = sparkColor(clamp(T - (1 - f) * 0.25));
      const e = base * fw * (0.12 + 0.88 * f * f);
      pts.push({ x: pr.x, y: pr.y, w: hw * (0.65 + 0.35 * f), c: [c[0] * e, c[1] * e, c[2] * e] });
    }
    if (pts.length !== NS + 1 || off === NS + 1) continue;
    L.strip(pts);
    // faint wide glow around the streak
    L.strip(pts.map((p) => ({ x: p.x, y: p.y, w: p.w * 3.5 + 2 * k, c: [p.c[0] * 0.05, p.c[1] * 0.035, p.c[2] * 0.02] })), false);
  }
}
