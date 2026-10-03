// ATOMS: tactile atomic intensity. Nuclei as clusters of dense, self-luminous nucleons (protons molten
// gold, neutrons cold blue-white): limb-darkened like tiny stars, boiling granulation, jittering quark
// cores, pressed together with contact shadows. Each shot has one crisp focal plane; everything else
// melts into flat energy-conserving bokeh. Vibration, interference wave rings, trails and sparks, on
// abyssal black; heat reads crimson -> ember -> gold -> white through emission, never a veil.
//
// Rendering: every element is projected on the CPU into a depth-sorted, tile-binned sprite list
// (lib/atoms-sprites.js); one fullscreen pass composites the tile lists. Frames are pure functions of
// the shot's local time (+ film frame for the per-frame jitter hash).
//
// Shot generators (params.mode):
//   lattice : the compressed layer on the dwarf, a crystal of C/O nuclei; optional proton rain (S13),
//             crush + multiplying fusion events (S20)
//   cno     : the CNO cycle, six nuclei stations on a ring (S14f)
//   gas     : a compressed proton gas, jittering (F28.1)
//   collide : scripted bodies, hits, flashes, shatters (F30.1, F31.3, F31.8)
import { frag } from '../engine/glsl.js';
import { camFromKeys, camera, keys } from './lib/util.js';
import { hash1 } from '../engine/rng.js';
import { SpriteBatch, SPRITE_GLSL } from './lib/atoms-sprites.js';
import { packNucleus, axisAngle } from './lib/atoms-pack.js';

// ------------------------------------------------------------------------------------------ shader
const FS = frag(SPRITE_GLSL, `
uniform vec4 uRingC[8];     // centre (world), radius (world)
uniform vec4 uRingW[8];     // width, wavenumber, amplitude, -
uniform vec4 uRingS[8];     // projected centre (px, y up), outer / inner screen radius bound (px)
uniform int uNR;
uniform int uRingMode;      // 0: rings lie in uRingPlane, 1: camera-facing plane through each centre
uniform vec4 uRingPlane;    // n.xyz, d   (dot(n, p) = d)
uniform vec3 uRingCol;
uniform float uRefract;     // px of refraction per unit wave slope
uniform vec3 uFillCol;
uniform float uFill;        // white-hot plasma fill (heat toward white)
uniform vec3 uFillC;        // optional fill centre: px (y up), radius px (0 = uniform)
uniform vec3 uHazeCol;
uniform float uHaze;        // faint glow of the hot layer (plane mode), keeps the black from being flat

float waveField(vec3 ro, vec3 rd, vec2 q, out vec2 disp, out float zr){
  disp = vec2(0.0); zr = 1e9;
  if (uNR == 0) return 0.0;
  vec3 fwd = uCamRot[2];
  float dn = dot(uRingPlane.xyz, rd);
  float tp = abs(dn) > 1e-4 ? (uRingPlane.w - dot(uRingPlane.xyz, ro)) / dn : -1.0;
  float A = 0.0, best = 0.0;
  for (int i = 0; i < 8; i++){
    if (i >= uNR) break;
    vec2 sd = q - uRingS[i].xy;
    float sl = length(sd);
    if (sl > uRingS[i].z || sl < uRingS[i].w) continue;   // screen-space bound of the ring band
    vec3 c = uRingC[i].xyz;
    float t = uRingMode == 0 ? tp : dot(c - ro, fwd) / dot(rd, fwd);
    if (t <= 0.0) continue;
    vec3 P = ro + rd * t;
    float x = length(P - c) - uRingC[i].w;
    float w = uRingW[i].x;
    float env = exp(-x * x / (w * w));
    if (env < 0.003) continue;
    float ph = x * uRingW[i].y;
    float a = uRingW[i].z * env;
    if (uRingMode == 0) a *= smoothstep(0.02, 0.12, abs(dn)) * exp(-t * 0.008);
    A += a * cos(ph);
    disp += sd / max(sl, 1.0) * a * sin(ph);
    if (a > best){ best = a; zr = t * dot(rd, fwd); }
  }
  disp *= uRefract;
  return A;
}

void main(){
  vec2 q = gl_FragCoord.xy * (uFull / uRes);
  vec3 ro = uCamPos;
  vec3 rd = cameraRay(frameUV());
  vec2 disp; float zr;
  float A = waveField(ro, rd, q, disp, zr);
  vec3 ringE = uRingCol * (A * A + 0.35 * max(A, 0.0));
  float T = 1.0;
  vec3 col = compositeSprites(q + disp, T, ringE, zr);
  // hot layer glow: emissive haze hugging the lattice plane, fading with distance
  if (uHaze > 0.0){
    float dn = dot(uRingPlane.xyz, rd);
    float tp = abs(dn) > 1e-4 ? (uRingPlane.w - dot(uRingPlane.xyz, ro)) / dn : 1e9;
    float hz = 0.0;
    if (tp > 0.0 && tp < 1e8){
      vec3 P = ro + rd * tp;
      float n = fbm3(P * 0.045 + vec3(0.0, uTime * 0.12, uTime * 0.05), 3) * 0.5 + 0.5;
      hz = exp(-tp * 0.012) * (0.35 + 0.9 * n * n);
    }
    // grazing rays pass through more of the glowing layer
    hz += 0.25 * exp(-abs(dn) * 7.0);
    col += T * uHazeCol * hz * uHaze;
  }
  if (uFill > 0.0){
    vec2 uv = q / uFull.y;
    float n = fbm3(vec3(uv * 3.2, uTime * 0.6), 3) * 0.5 + 0.5;
    float rad = 1.0;
    if (uFillC.z > 0.0){ vec2 dq = (q - uFillC.xy) / uFillC.z; rad = 0.12 + 0.88 * exp(-dot(dq, dq)); }
    col += uFillCol * uFill * rad * (0.55 + 0.9 * n) * (0.35 + 0.65 * T);
  }
  fragColor = vec4(col, 1.0);
}`);

// ------------------------------------------------------------------------------------- utilities
const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const kv = (v, t, d) => (v === undefined || v === null ? d : typeof v === 'number' ? v : keys(v, t));
// colour param: plain [r,g,b] or keyed [[t,[r,g,b]], ...]
const kc = (v, t, d) => (!v ? d : Array.isArray(v[0]) ? keys(v, t) : v);
const H1 = (n, s) => hash1(n | 0, s | 0);
const unitDir = (n, s) => {
  const u = H1(n, s) * 2 - 1, a = H1(n, s + 1) * TAU, r = Math.sqrt(1 - u * u);
  return [r * Math.cos(a), u, r * Math.sin(a)];
};
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cam0 = (B) => B.cam.fwd;   // camera forward (unit)
const rotApply = (M, v) => [M[0] * v[0] + M[1] * v[1] + M[2] * v[2], M[3] * v[0] + M[4] * v[1] + M[5] * v[2], M[6] * v[0] + M[7] * v[1] + M[8] * v[2]];

// palette (linear): molten gold protons, pale cold blue-white neutrons, white-hot, ember, ice
const GOLD = [1.0, 0.5, 0.16];
const PALE = [0.46, 0.68, 1.0];
const WHITE = [1.0, 0.93, 0.85];
const EMBER = [1.0, 0.24, 0.05];
const ICE = [0.36, 0.62, 1.0];
const CRIMSON = [0.42, 0.018, 0.012];

// heat brightens and whitens mostly the core (in the shader); the body keeps its colour until it is
// white-hot, when the emission is big enough to clip and the colour comes back only through bloom
function nucleonCol(isP, heat) {
  return mix3(isP ? GOLD : PALE, WHITE, clamp(heat * 0.07 + Math.max(0, heat - 2) * 0.1));
}
function nucleonInt(isP, heat) { const h = Math.max(0, heat); return (isP ? 0.7 : 0.5) * (1 + 0.6 * h + 0.3 * h * h); }

// strike crush: under-damped step response of the lattice spacing from `from` to `to`, starting at
// crush.t, first peak (deepest squeeze) at crush.tp seconds, damping zeta. Returns scale, progress k
// (overshoots past 1) and dk/dt (drives zoom blur and the camera push).
function crushState(P, t) {
  const Cr = P.crush;
  if (!Cr) return { sc: 1, k: 0, v: 0 };
  const tc = t - Cr.t;
  if (tc < 0) return { sc: Cr.from ?? 1, k: 0, v: 0 };
  const z = Cr.zeta ?? 0.5, q = Math.sqrt(1 - z * z);
  const wd = Math.PI / (Cr.tp ?? 0.36), wn = wd / q;
  const ex = Math.exp(-z * wn * tc);
  const k = 1 - ex * (Math.cos(wd * tc) + (z / q) * Math.sin(wd * tc));
  const v = ex * (wn / q) * Math.sin(wd * tc);
  return { sc: lerp(Cr.from ?? 1, Cr.to, k), k, v };
}

// One nucleus: per-nucleon spheres when resolvable and roughly in focus, else a single lumpy sphere.
// o: {rot, scale, heat, jit, t, f, seed, gain, alpha}
function addNucleus(B, c, A, Z, o) {
  const N = packNucleus(A, Z);
  const q = B.proj(c);
  if (!q) return;
  const sc = o.scale ?? 1;
  const Rw = N.radius * sc;
  const Rpx = Rw * q[3];
  if (!B.onScreen(q[0], q[1], Rpx + q[4] + 2)) return;
  const heat = o.heat ?? 0, gain = o.gain ?? 1, alpha = o.alpha ?? 0.94;
  const tn = o.tint;
  const ncol = (isP, h) => { const c = nucleonCol(isP, h); return tn ? [c[0] * tn[0], c[1] * tn[1], c[2] * tn[2]] : c; };
  const seed = o.seed ?? 0;
  if (A > 1 && (q[4] > (o.discAt ?? 0.9) * Rpx || Rpx < 6 * B.k)) {
    const fp = Z / A;
    const col = mix3(ncol(false, heat), ncol(true, heat), clamp(fp * 1.15));
    B.sphere(c, Rw * 0.84, col, lerp(nucleonInt(false, heat), nucleonInt(true, heat), fp) * gain * 0.95, alpha, null, heat, (seed % 97) + 0.5, 1, q);
    return;
  }
  const M = o.rot;
  const jit = o.jit ?? 0;
  const t = o.t ?? 0, f = o.f ?? 0;
  for (let i = 0; i < A; i++) {
    let l = [N.pos[i * 3] * sc, N.pos[i * 3 + 1] * sc, N.pos[i * 3 + 2] * sc];
    if (M) l = rotApply(M, l);
    const s = seed * 31 + i * 7;
    let p = add(c, l);
    if (jit > 0) {
      const w = 23 + 31 * H1(s, 3);
      p = add(p, [
        jit * (Math.sin(t * w + H1(s, 4) * TAU) * 0.6 + (H1(f * 977 + s, 11) - 0.5) * 0.8),
        jit * (Math.sin(t * w * 1.13 + H1(s, 5) * TAU) * 0.6 + (H1(f * 977 + s, 12) - 0.5) * 0.8),
        jit * (Math.sin(t * w * 0.91 + H1(s, 6) * TAU) * 0.6 + (H1(f * 977 + s, 13) - 0.5) * 0.8),
      ]);
    }
    const isP = N.isP[i] === 1;
    const ng = o.ghosts | 0;
    if (ng > 0 && jit > 0) {
      // vibration smear: samples across a 180-degree shutter (1/48 s) of the fast oscillation
      const w = 23 + 31 * H1(s, 3);
      for (let gI = 0; gI <= ng; gI++) {
        const tt = t - (gI / ng) * (1 / 48);
        const pg = add(add(c, l), [
          jit * (Math.sin(tt * w + H1(s, 4) * TAU) * 0.9 + (H1(f * 977 + s, 11) - 0.5) * 0.5),
          jit * (Math.sin(tt * w * 1.13 + H1(s, 5) * TAU) * 0.9 + (H1(f * 977 + s, 12) - 0.5) * 0.5),
          jit * (Math.sin(tt * w * 0.91 + H1(s, 6) * TAU) * 0.9 + (H1(f * 977 + s, 13) - 0.5) * 0.5),
        ]);
        const k = gI === 0 ? 0.7 : 0.3 / ng;
        B.sphere(pg, sc * (o.rn ?? 0.88), ncol(isP, heat), nucleonInt(isP, heat) * gain * k * 1.15, gI === 0 ? alpha : 0.08, A > 1 ? c : null, heat, (s % 89) + H1(s, 9) * 3, gI === 0 ? 0 : 2);
      }
      continue;
    }
    B.sphere(p, sc * (o.rn ?? 0.88), ncol(isP, heat), nucleonInt(isP, heat) * gain, alpha, A > 1 ? c : null, heat, (s % 89) + H1(s, 9) * 3, 0);
  }
}

function sparkCol(u) { // u: 0 fresh .. 1 cooled
  return u < 0.35 ? mix3(WHITE, GOLD, u / 0.35) : mix3(GOLD, EMBER, clamp((u - 0.35) / 0.65));
}

// burst of sparks from c at t0. o: {n, speed, life, trail, r, inten, drag, up (hemisphere normal|null), seed, col}
function sparks(B, c, t0, t, o) {
  const tau = t - t0;
  if (tau < 0) return;
  const n = o.n | 0, drag = o.drag ?? 3.0;
  for (let s = 0; s < n; s++) {
    const id = (o.seed | 0) * 211 + s;
    const life = o.life * (0.4 + 0.9 * H1(id, 21));
    if (tau > life) continue;
    let d = unitDir(id, 22);
    if (o.up) { const k = d[0] * o.up[0] + d[1] * o.up[1] + d[2] * o.up[2]; if (k < 0) d = sub(d, mul(o.up, 2 * k)); }
    if (o.flat) d = norm([d[0], d[1] * o.flat, d[2] * (o.zsq ?? 1)]);
    if (o.bias) d = norm(add(d, o.bias));
    if (o.flatView) { const v = B.cam.fwd, k = dot3(d, v); d = norm(sub(d, mul(v, k * o.flatView))); }
    const sp = o.speed * (0.3 + 1.0 * Math.pow(H1(id, 23), 0.7));
    const dist = (x) => (sp * (1 - Math.exp(-drag * x))) / drag;
    const head = add(c, mul(d, dist(tau)));
    const tail = add(c, mul(d, dist(Math.max(0, tau - (o.trail ?? 0.06)))));
    const u = tau / life;
    const col = o.col ? mix3(o.col, o.cool || EMBER, u * 0.5) : sparkCol(u);
    B.streak(head, tail, o.r ?? 0.05, col, (o.inten ?? 30) * Math.pow(1 - u, 1.4) * (0.5 + H1(id, 24)), 1.1, s);
  }
}

function ring(fx, c, tau, o) {
  if (tau < 0 || tau > (o.life ?? 1.2)) return;
  const amp = (o.amp ?? 1) * Math.exp(-tau / (o.decay ?? 0.35)) * smooth(0, 0.03, tau);
  if (amp < 0.01) return;
  const r = (o.speed ?? 30) * tau;
  fx.rings.push({ c, r, w: (o.w ?? 0.8) + r * (o.spread ?? 0.08), k: TAU / (o.lambda ?? 1.6), amp });
}

function fieldNuclei(B, P, t, f, F, hAdd = 0) {
  // a deep field of dim, defocused nuclei for depth (bokeh)
  if (!F) return;
  for (let i = 0; i < F.n; i++) {
    const p = [lerp(F.box[0][0], F.box[0][1], H1(i, 61)), lerp(F.box[1][0], F.box[1][1], H1(i, 62)), lerp(F.box[2][0], F.box[2][1], H1(i, 63))];
    const dr = F.drift || [0, 0, 0];
    const pp = add(p, mul(dr, t * (0.6 + 0.8 * H1(i, 64))));
    const A = H1(i, 65) < (F.pFrac ?? 0.3) ? 1 : (H1(i, 66) < 0.5 ? 12 : 16);
    const Z = A === 1 ? 1 : A / 2;
    addNucleus(B, pp, A, Z, { rot: axisAngle(unitDir(i, 67), t * 0.6 + i), heat: kv(F.heat, t, 0.1) + hAdd * 0.6, jit: 0.05, t, f, seed: i + 500, gain: F.gain ?? 0.6, alpha: 0.9 });
  }
}

// ------------------------------------------------------------------------------------ generators
const GEN = {};

// The compressed layer: a crystal of carbon/oxygen nuclei (a white dwarf's lattice) under accreted hydrogen.
GEN.lattice = function (B, P, t, S, fx) {
  const L = P.lattice, f = S.f;
  const a0 = L.a;
  const cs = crushState(P, t);
  const sc = kv(P.compress, t, 1) * cs.sc;
  const heatBase = kv(P.heat, t, 0.1);
  const jit = kv(P.jitter, t, 0.06);
  const C = L.center || [0, 0, 20];
  const yS = L.top ?? 2.5;
  // ----- events (fusion flashes in the lattice) and impacts of rain protons
  const events = [];
  const E = P.events;
  if (E) {
    // cumulative count N(t) = r0/k (e^{k t} - 1)  ->  event i at t_i = ln(1 + i k / r0) / k
    const tt = t - (E.t0 ?? 0);
    const Nn = Math.floor((E.r0 / E.k) * (Math.exp(E.k * Math.max(0, tt)) - 1));
    for (let i = Math.max(0, Nn - 400); i <= Nn; i++) {
      const ti = Math.log(1 + (i * E.k) / E.r0) / E.k + (E.t0 ?? 0);
      const tau = t - ti;
      if (tau < 0 || tau > E.life) continue;
      let gi, gk;
      if (E.spread) {
        // chain reaction: a front expanding from the hero nucleus at the lattice centre, biased toward
        // the camera-facing rows so the multiplying flashes are not hidden behind the crushed lattice
        const Sp = E.spread;
        const rad = i === 0 ? 0 : Math.min(Sp.max ?? 1e9, (Sp.r0 + Sp.v * (ti - (E.t0 ?? 0))) * Math.sqrt(0.15 + 0.85 * H1(i, 71)));
        const ang = H1(i, 72) * TAU;
        let sa = Math.sin(ang);
        if (Sp.near && sa > 0 && H1(i, 74) < Sp.near) sa = -sa;
        const scN = Math.max(0.3, sc);
        gi = Math.round((C[0] + (Math.cos(ang) * rad) / scN) / a0);
        gk = Math.round((C[2] + (sa * rad * (Sp.zs ?? 1)) / scN) / a0);
        if (Sp.k) gk = Math.max(Sp.k[0], Math.min(Sp.k[1], gk));       // keep events inside the focal band
      } else {
        gi = Math.round(lerp(E.i[0], E.i[1], H1(i, 71))); gk = Math.round(lerp(E.k2[0], E.k2[1], Math.pow(H1(i, 72), E.zPow ?? 1)));
      }
      events.push({ i, gi, gk, gj: 0, tau, s: (i === 0 ? 1.4 : 0.6 + 0.8 * H1(i, 73)) });
    }
  }
  const R = P.rain;
  const impacts = [];
  if (R) {
    const fall = R.height / R.speed;
    const near = R.near ?? 12;
    const i0 = Math.floor((t - fall - 0.8 - R.t0) * R.rate) - 1, i1 = Math.ceil((t - R.t0) * R.rate) + 1;
    for (let i = Math.max(0, i0); i <= i1; i++) {
      const ti = R.t0 + i / R.rate + (H1(i, 81) - 0.5) * 0.8 / R.rate;
      const x = lerp(R.x[0], R.x[1], H1(i, 82)), z = lerp(R.z[0], R.z[1], Math.pow(H1(i, 83), R.zPow ?? 1));
      const th = ti + fall;
      const pTop = add(C, mul(sub([x, 0, z], C), sc));
      if (t < ti) continue;
      if (t < th) {
        const y = yS + R.height - R.speed * (t - ti);
        const p = [pTop[0] + (R.drift || 0) * (y - yS), y, pTop[2]];
        const q = B.proj(p);
        if (!q || q[2] < near) continue;                         // never let a proton graze the lens
        let g = smooth(near, near + 7, q[2]);
        // fade as it defocuses: a near proton must not become a big soft coin that pulls the eye
        const rp = 0.75 * q[3];
        g *= clamp(1.45 - 3.0 * (q[4] / (rp + q[4])), 0.06, 1);
        const tail = [p[0] + (R.drift || 0) * R.trail, y + R.trail, p[2]];
        B.streak(p, tail, 0.2, mix3(GOLD, WHITE, 0.2), (R.trailInt ?? 3.0) * g, 1.3, i);
        B.sphere(p, 0.75, mix3(GOLD, WHITE, 0.1), (R.inten ?? 2.4) * g, 0.9, null, 0.3, (i % 50) + 0.3, 0, q);
        B.glow(p, 0.5, GOLD, 0.5 * g, 3.0);
      } else if (t < th + 0.9) {
        impacts.push({ i, p: [pTop[0], yS, pTop[2]], tau: t - th });
      }
    }
  }
  // ----- lattice nuclei
  const evById = new Map();
  for (const ev of events) evById.set(`${ev.gi},${ev.gk}`, ev);
  for (let j = 0; j < L.layers; j++) {
    for (let k = L.k[0]; k <= L.k[1]; k++) {
      for (let i = L.i[0]; i <= L.i[1]; i++) {
        const id = (j * 997 + (k + 300)) * 1009 + (i + 300);
        const off = j & 1 ? 0.5 : 0;
        const dis = L.disorder ?? 0.05;
        const p0 = [(i + off) * a0 + (H1(id, 1) - 0.5) * dis * a0, -j * a0 * 0.62 + (H1(id, 2) - 0.5) * dis * a0, (k + off) * a0 + (H1(id, 3) - 0.5) * dis * a0];
        const p = add(C, mul(sub(p0, C), sc));
        const isO = H1(id, 4) < (L.oFrac ?? 0.4);
        let heat = heatBase * (0.75 + 0.5 * H1(id, 5));
        let jj = jit;
        // flare when a fusion event lands on this nucleus
        const ev = j === 0 ? evById.get(`${i},${k}`) : null;
        if (ev) { heat += (E.heatKick ?? 3.0) * ev.s * Math.exp(-ev.tau / 0.2); jj += 0.35 * Math.exp(-ev.tau / 0.12); }
        let hi = 0;
        for (const im of impacts) {
          const d = len(sub(im.p, p));
          if (d < a0 * 1.2) hi = Math.max(hi, Math.exp(-im.tau / 0.22) * Math.exp(-(d * d) / (a0 * a0 * 0.18)));
        }
        heat += 1.3 * hi; jj += 0.2 * hi;
        const rot = axisAngle(unitDir(id, 6), H1(id, 7) * TAU + t * (0.2 + 0.4 * H1(id, 8)));
        addNucleus(B, p, isO ? 16 : 12, isO ? 8 : 6, { rot, scale: 1, discAt: L.discAt ?? 0.9, heat: j === 0 ? heat : heat * 0.6, jit: jj, t, f, seed: id % 10007, gain: (L.gain ?? 1) * (j === 0 ? 1 : L.lowerGain ?? 0.45), alpha: 0.95, tint: j === 0 ? null : (L.lowerTint || [1.0, 0.32, 0.16]) });
      }
    }
  }
  // ----- event visuals: flash glows sort ahead of the nuclei in front of them (zBias), sparks skim the
  // surface inside the focal band
  for (const ev of events) {
    const p0 = [ev.gi * a0, 0, ev.gk * a0];
    const p = add(add(C, mul(sub(p0, C), sc)), [0, 0.5, 0]);
    const fl = E.flash * ev.s * Math.exp(-ev.tau / E.flashDecay) * smooth(0, 0.02, ev.tau);
    if (fl > 0.05) B.glow(add(p, [0, E.glowLift ?? 1.5, 0]), E.flashR, mix3(GOLD, WHITE, 0.4), fl, E.reach ?? 3.5, E.zBias ?? 0);
    sparks(B, add(p, [0, E.sparkLift ?? 1.8, 0]), 0, ev.tau, { n: E.sparks, speed: E.sparkSpeed, life: E.sparkLife, trail: E.trail ?? 0.09, r: E.sparkR ?? 0.045, inten: E.sparkInt, up: [0, 1, 0], flat: E.flat ?? 0.45, zsq: E.zsq, seed: ev.i + 7000, drag: 2.0 });
    ring(fx, [p[0], yS, p[2]], ev.tau, { speed: E.ringSpeed ?? 24, amp: 0.55 * ev.s, decay: 0.3, lambda: 1.8, w: 1.0 });
  }
  for (const im of impacts) {
    // near (defocused) impacts flash softer, so they do not bloom into big white blobs at the frame edge
    const qi = B.proj(im.p);
    const dfo = qi ? clamp(1.5 - 2.0 * (qi[4] / (0.6 * qi[3] + qi[4])), 0.15, 1) : 0;
    const fl = (R.flash ?? 40) * dfo * Math.exp(-im.tau / 0.07) * smooth(0, 0.015, im.tau);
    if (fl > 0.05) B.glow(add(im.p, [0, 0.4, 0]), 0.6, mix3(GOLD, WHITE, 0.5), fl, 4.0, 2);
    sparks(B, add(im.p, [0, 0.3, 0]), 0, im.tau, { n: R.sparks ?? 8, speed: 16, life: 0.35, trail: 0.05, r: 0.08, inten: 28, up: [0, 1, 0], seed: im.i + 3000, drag: 3 });
    ring(fx, im.p, im.tau, { speed: R.ringSpeed ?? 20, amp: R.ringAmp ?? 0.5, decay: 0.32, lambda: 1.5, w: 0.8 });
  }
  if (P.crush) {
    // the shock of the strike: a ring racing out across the surface, and compression heating that
    // peaks with the deepest squeeze (kept modest in the first frames, under the plan's strike flash)
    const Cr = P.crush, tc = t - Cr.t;
    ring(fx, [C[0], yS, C[2]], tc, { speed: Cr.ringSpeed ?? 30, amp: 1.3, decay: 0.5, lambda: 2.6, w: 1.6, life: 1.6, spread: 0.12 });
    if (tc >= 0 && tc < 1.2) {
      const g = (Cr.glow ?? 10) * smooth(0.08, Cr.tp ?? 0.36, tc) * Math.exp(-Math.max(0, tc - (Cr.tp ?? 0.36)) / 0.18);
      if (g > 0.05) B.glow(add(C, [0, 1.2, 0]), Cr.glowR ?? 0.9, mix3(GOLD, WHITE, 0.35), g, 3.0, 4);
    }
  }
  fx.ringMode = 0;
  fx.ringPlane = [0, 1, 0, yS];
};

// A compressed proton gas, jittering violently.
GEN.gas = function (B, P, t, S, fx) {
  const G = P.gas, f = S.f;
  const sc = kv(P.compress, t, 1);
  const heat = kv(P.heat, t, 0.3);
  const jit = kv(P.jitter, t, 0.2);
  const C = G.center;
  const L = G.lattice;
  const n = L ? L[0] * L[1] * L[2] : G.n;
  for (let i = 0; i < n; i++) {
    let p0, iz = 0;
    if (L) {
      // close-packed (hcp-like) layers with a little disorder; layer 0 faces the camera
      const ix = i % L[0], iy = Math.floor(i / L[0]) % L[1];
      iz = Math.floor(i / (L[0] * L[1]));
      const sp = G.spacing, dz = G.disorder ?? 0.1;
      p0 = [(ix - (L[0] - 1) / 2 + 0.5 * (iy & 1) + 0.5 * (iz & 1)) * sp + (H1(i, 91) - 0.5) * dz * sp,
        (iy - (L[1] - 1) / 2 + 0.33 * (iz & 1)) * sp * 0.866 + (H1(i, 92) - 0.5) * dz * sp,
        (iz - (L[2] - 1) / 2) * sp * 0.816 * (G.zs ?? 1) + (H1(i, 93) - 0.5) * dz * sp];
    } else {
      p0 = [lerp(-G.size[0], G.size[0], H1(i, 91)), lerp(-G.size[1], G.size[1], H1(i, 92)), lerp(-G.size[2], G.size[2], H1(i, 93))];
    }
    const p = add(C, mul(p0, sc));
    const isP = H1(i, 94) > (G.nFrac ?? 0);
    const A = isP ? 1 : (H1(i, 95) < 0.5 ? 4 : 12);
    // deeper layers dimmer and redder: black survives between the front protons until the pressure rises
    const lg = Math.pow(kv(G.layerFall, t, 1), iz);
    addNucleus(B, p, A, isP ? 1 : A / 2, { rot: axisAngle(unitDir(i, 96), t * 2 + i), heat: heat * (0.7 + 0.6 * H1(i, 97)), jit: jit * (A === 1 ? 1 : 0.4), t, f, seed: i + 100, gain: (G.gain ?? 1) * lg, alpha: 0.95, ghosts: G.ghosts ?? 0, tint: iz > 0 ? G.deepTint : null });
  }
  // pressure waves rolling through the gas
  for (const w of P.waves || []) ring(fx, w.c, t - w.t, w);
  for (const h of P.hits || []) doHit(B, fx, h, t, S);
  fieldNuclei(B, P, t, f, P.field);
  fx.ringMode = 1;
};

function doHit(B, fx, h, t, S) {
  const tau = t - h.t;
  if (tau < 0) return;
  const fl = h.flash * Math.exp(-tau / (h.decay ?? 0.12)) * smooth(0, 0.02, tau);
  if (fl > 0.05) B.glow(h.p, h.r ?? 1.2, h.col || mix3(GOLD, WHITE, 0.45), fl, h.reach ?? 4.0, h.zBias ?? 2);
  if (h.sparks) sparks(B, h.p, h.t, t, { n: h.sparks, speed: h.sparkSpeed ?? 24, life: h.sparkLife ?? 0.6, trail: h.trail ?? 0.07, r: h.sparkR ?? 0.1, inten: h.sparkInt ?? 40, seed: h.seed ?? 1, drag: h.drag ?? 2.2, bias: h.bias, flat: h.flat, flatView: h.flatView });
  if (h.ring) ring(fx, h.p, tau, h.ring);
  if (h.shatter) {
    // the colliding nuclei fly apart as individual nucleons with trails
    const Sh = h.shatter;
    for (let i = 0; i < Sh.A; i++) {
      const id = (h.seed ?? 1) * 97 + i;
      let d = unitDir(id, 41);
      if (Sh.flatView) {                                  // spray across the frame, not into the lens
        const v = B.cam.fwd, k = dot3(d, v);
        d = norm(sub(d, mul(v, k * Sh.flatView)));
      }
      const sp = Sh.speed * (0.4 + 0.8 * H1(id, 42));
      const drag = 1.6;
      const dist = (x) => (sp * (1 - Math.exp(-drag * x))) / drag;
      const p = add(h.p, mul(d, dist(tau)));
      const isP = i < Sh.Z;
      const hh = (Sh.heat ?? 2.5) * Math.exp(-tau / 0.4) + 0.4;
      B.sphere(p, 0.88 * (Sh.scale ?? 1), nucleonCol(isP, hh), nucleonInt(isP, hh), 0.94, null, hh, (id % 60) + 0.5, 0);
      B.streak(p, add(h.p, mul(d, dist(Math.max(0, tau - 0.12)))), 0.4 * (Sh.scale ?? 1), mix3(isP ? GOLD : PALE, WHITE, 0.4), (Sh.trail ?? 3.5) * Math.exp(-tau / 0.6), 1.3, i);
    }
  }
}

// F31.8-style swarm: many small collisions across a wide field, staggered in time. Generated once per
// preset (deterministic) as ordinary bodies + hits.
const swarmCache = new WeakMap();
function swarmOf(Sw) {
  if (swarmCache.has(Sw)) return swarmCache.get(Sw);
  const bodies = [], hits = [];
  const kinds = [[4, 2], [12, 6], [1, 1], [16, 8], [4, 2], [12, 6]];
  for (let j = 0; j < Sw.n; j++) {
    const th = lerp(Sw.t[0], Sw.t[1], (j + 0.8 * H1(j, 201)) / Sw.n);
    const c = [lerp(Sw.box[0][0], Sw.box[0][1], H1(j, 202)), lerp(Sw.box[1][0], Sw.box[1][1], H1(j, 203)), lerp(Sw.box[2][0], Sw.box[2][1], H1(j, 204))];
    const a = H1(j, 205) * TAU, el = (H1(j, 206) - 0.5) * 0.9;
    const dir = [Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el) * 0.5];
    const [A1, Z1] = kinds[Math.floor(H1(j, 207) * kinds.length)];
    const [A2, Z2] = kinds[Math.floor(H1(j, 208) * kinds.length)];
    const d = (Sw.dist ?? 6) * (0.7 + 0.6 * H1(j, 209));
    const r1 = packNucleus(A1, Z1).radius * 0.6, r2 = packNucleus(A2, Z2).radius * 0.6;
    const t0 = th - (Sw.app ?? 0.09);
    const hot = [[t0, 0.6], [th, 1.6]];
    bodies.push({ A: A1, Z: Z1, p0: add(c, mul(dir, d)), p1: add(c, mul(dir, r1)), t0, t1: th, off: th, ease: 'in', heat: hot, jit: 0.2, trail: 0.6, trailInt: 2.2 });
    bodies.push({ A: A2, Z: Z2, p0: sub(c, mul(dir, d)), p1: sub(c, mul(dir, r2)), t0, t1: th, off: th, ease: 'in', heat: hot, jit: 0.2, trail: 0.6, trailInt: 2.2 });
    const big = (A1 + A2) / 20;
    hits.push({ t: th, p: c, flash: (Sw.flash ?? 60) * (0.6 + 0.6 * big), r: 0.5 + 0.25 * big, decay: 0.06, reach: 3.0, sparks: Math.round((Sw.sparks ?? 30) * (0.6 + 0.6 * big)), sparkSpeed: 34, sparkLife: 0.35, sparkInt: 26, seed: 300 + j,
      ring: { speed: 30, amp: 0.7, decay: 0.25, lambda: 1.8, w: 0.9 }, shatter: { A: Math.min(12, A1 + A2), Z: Math.min(6, Z1 + Z2), speed: 20, heat: 1.6, trail: 1.6 } });
  }
  const out = { bodies, hits };
  swarmCache.set(Sw, out);
  return out;
}

// Scripted collisions: bodies move along eased paths, hits flash and spray.
GEN.collide = function (B, P, t, S, fx) {
  const f = S.f;
  const sw = P.swarm ? swarmOf(P.swarm) : null;
  const bodies = sw ? [...(P.bodies || []), ...sw.bodies] : (P.bodies || []);
  const hits = sw ? [...(P.hits || []), ...sw.hits] : (P.hits || []);
  const hAdd = kv(P.heatAdd, t, 0);
  for (const [bi, b] of bodies.entries()) {
    if (t < (b.on ?? -1e9) || t >= (b.off ?? 1e9)) continue;
    const u = clamp((t - b.t0) / (b.t1 - b.t0));
    const e = b.ease === 'in' ? u * u : b.ease === 'out' ? 1 - (1 - u) * (1 - u) : b.ease === 'lin' ? u : u * u * (3 - 2 * u);
    const p = add(mix3(b.p0, b.p1, e), b.drift ? mul(b.drift, t) : [0, 0, 0]);
    const heat = kv(b.heat, t, 0.2) + hAdd;
    const rot = axisAngle(norm(b.axis || [0.3, 1, 0.2]), (b.spin ?? 0.8) * t + bi);
    addNucleus(B, p, b.A, b.Z, { rot, heat, jit: kv(b.jit, t, 0.08), t, f, seed: bi * 13 + 1, gain: b.gain ?? 1, alpha: 0.95, scale: b.scale ?? 1 });
    if (b.trail && u > 0 && u < 1) {
      const pb = add(mix3(b.p0, b.p1, Math.max(0, e - b.trail)), b.drift ? mul(b.drift, t) : [0, 0, 0]);
      B.streak(p, pb, b.A === 1 ? 0.5 : 1.2, mix3(b.A === 1 ? GOLD : WHITE, WHITE, 0.3), b.trailInt ?? 3, 1.5, bi);
      if (b.A === 1) B.glow(p, 0.9, GOLD, 1.2, 3.0);
    }
  }
  for (const h of hits) doHit(B, fx, h, t, S);
  fieldNuclei(B, P, t, f, P.field, hAdd);
  fx.ringMode = 1;
};

// The CNO cycle: 12C +p-> 13N -b+-> 13C +p-> 14N +p-> 15O -b+-> 15N +p-> 12C + 4He
const CNO = [[12, 6], [13, 7], [13, 6], [14, 7], [15, 8], [15, 7]];
const CNO_CAPTURE = [true, false, true, true, false, true];
GEN.cno = function (B, P, t, S, fx) {
  const f = S.f;
  const Rr = P.ringR;
  const C = P.center || [0, 0, 0];
  const tilt = axisAngle([1, 0, 0], P.tilt ?? 0.3);
  const spin = (P.spin0 ?? 0) + (P.spin ?? 0) * t;
  const stations = [];
  for (let s = 0; s < 6; s++) {
    const a = (P.start ?? Math.PI / 2) - (s * TAU) / 6 - spin;   // clockwise from the start angle
    stations.push(add(C, rotApply(tilt, [Math.cos(a) * Rr, Math.sin(a) * Rr, 0])));
  }
  const RT = P.react;                                       // reaction times per station
  const leg = P.leg ?? 0.2;
  // pulse position along the ring (station index, fractional)
  let pulse = -1;
  for (let s = 0; s < 6; s++) if (t >= RT[s] && t < RT[s] + leg) pulse = s + (t - RT[s]) / leg;
  // path: thin ice-blue arcs between stations, brightening where the pulse runs. Abutting segments with
  // seamless ends and no fade, so the line is continuous instead of beaded.
  const segs = 96;
  const ang = (u) => (P.start ?? Math.PI / 2) - u * TAU - spin;
  const ringP = (u) => add(C, rotApply(tilt, [Math.cos(ang(u)) * Rr, Math.sin(ang(u)) * Rr, 0]));
  for (let g = 0; g < segs; g++) {
    const u0 = g / segs, u1 = (g + 1) / segs, um = (g + 0.5) / segs;
    const su = um * 6;
    const ds = Math.abs(su - Math.round(su)) * 2;            // 0 at a station, 1 midway
    let I = (P.pathInt ?? 0.5) * smooth(0.2, 0.55, ds) * smooth(0, 0.25, t + 0.1);
    if (pulse >= 0) {
      let d = su - pulse; if (d > 3) d -= 6; if (d < -3) d += 6;
      I += 9 * Math.exp(-Math.pow(Math.max(0, -d) / 0.35, 2)) * (d < 0.05 ? 1 : Math.exp(-d * 30)) * smooth(0.0, 0.3, ds + 0.2);
    }
    if (I > 0.02) B.streak(ringP(u1), ringP(u0), 0.07, ICE, I, 0, g, 1);
  }
  for (let s = 0; s < 6; s++) {
    const [A, Z] = CNO[s];
    const tau = t - RT[s];
    const cap = CNO_CAPTURE[s];
    let heat = 0.25 + 0.08 * Math.sin(t * 9 + s);
    let jit = 0.05;
    // captures flare white-hot; the beta+ stations stay cooler and flash cold blue instead
    if (tau >= -0.05) { heat += (cap ? 2.6 : 0.35) * Math.exp(-Math.max(0, tau) / 0.22) * smooth(-0.05, 0.0, tau); jit += 0.25 * Math.exp(-Math.max(0, tau) / 0.15); }
    const rot = axisAngle(norm([0.2 + 0.1 * s, 1, 0.3]), t * 0.9 + s * 1.7);
    addNucleus(B, stations[s], A, Z, { rot, heat, jit, t, f, seed: s * 17 + 3, gain: P.gain ?? 1, alpha: 0.95 });
    const outward = norm(sub(stations[s], C));
    if (cap) {
      // incoming proton, arriving exactly at the reaction: from outside the ring and from above,
      // off-axis from every other station
      const ta = RT[s] - (P.inT ?? 0.32);
      if (t >= ta && t < RT[s]) {
        const u = (t - ta) / (RT[s] - ta);
        const tang = norm(sub(stations[(s + 5) % 6], stations[s]));
        const dir = s === 0 && P.inDir ? norm(P.inDir)
          : norm(add(add(mul(outward, P.inOut ?? 0.95), mul(tang, P.inTan ?? 0.3)), [0, P.inUp ?? 0.85, 0]));
        const startP = add(stations[s], mul(dir, P.inDist ?? 26));
        const p = mix3(startP, stations[s], u * u * 0.15 + u * 0.85);
        const pt = mix3(startP, stations[s], Math.max(0, u - 0.3));
        B.streak(p, pt, 0.3, mix3(GOLD, WHITE, 0.2), 6.0, 1.2, s);
        B.sphere(p, 0.9, mix3(GOLD, WHITE, 0.25), 2.6, 0.9, null, 0.8, s + 0.5, 0);
        B.glow(p, 0.8, GOLD, 1.0, 3.0);
      }
    }
    if (tau >= 0 && tau < 1.0) {
      const big = s === 0 ? 1 : 0.45;
      const fl = (s === 0 ? P.flash ?? 60 : (P.flash ?? 60) * (cap ? 0.35 : 0.3)) * Math.exp(-tau / (s === 0 ? 0.12 : 0.08)) * smooth(0, 0.02, tau);
      if (fl > 0.05) B.glow(stations[s], 0.55 + 0.45 * big, cap ? mix3(GOLD, WHITE, 0.4) : ICE, fl, 3.5, 3, cap ? 0 : 0.75);
      ring(fx, stations[s], tau, { speed: 22, amp: 0.5 * big + 0.15, decay: 0.3, lambda: 1.6, w: 0.7 });
      sparks(B, stations[s], 0, tau, { n: s === 0 ? 26 : 8, speed: 20, life: 0.55, trail: 0.06, r: 0.08, inten: 30, seed: s + 40, drag: 2.5, col: cap ? null : mix3(ICE, WHITE, 0.15), cool: [0.05, 0.15, 0.7] });
      if (!cap) {
        // beta+ decay: a positron (cold blue spark) streaks away
        const d = norm(add(outward, rotApply(tilt, [0, 0, -0.6])));
        const sp = 70;
        const hd = add(stations[s], mul(d, sp * tau)), tl = add(stations[s], mul(d, Math.max(0, sp * (tau - 0.05))));
        B.streak(hd, tl, 0.12, mix3(ICE, WHITE, 0.15), 22 * Math.exp(-tau / 0.5), 1.0, s + 90);
      }
      if (s === 5) {
        // 15N + p -> 12C + alpha: the helium nucleus is ejected outward and upward, never into the lens
        const d = norm(add(sub(outward, mul(cam0(B), dot3(outward, cam0(B)) * 1.2)), [0, 0.6, 0]));
        const p = add(stations[s], mul(d, 3 + 22 * (1 - Math.exp(-tau * 2.5))));
        addNucleus(B, p, 4, 2, { rot: axisAngle([0, 1, 0], t * 4), heat: 1.2 * Math.exp(-tau / 0.4) + 0.3, jit: 0.08, t, f, seed: 333, alpha: 0.95 });
        B.streak(p, add(stations[s], mul(d, 3)), 0.35, mix3(GOLD, WHITE, 0.5), 2.0, 1.5, 77);
      }
    }
  }
  fieldNuclei(B, P, t, f, P.field);
  fx.ringMode = 1;
};

// ---------------------------------------------------------------------------------------- presets
// Times are shot-local seconds of a shot `refDur` long (stretched to the plan's actual length).
// Camera keys: [t, pos, target, fovDeg, roll?, ease?].
const presets = {
  // S13 (2.96 s): hydrogen nuclei rain onto the compressed lattice; pressing, jittering, glowing hotter
  'S13-atoms': {
    refDur: 2.958,
    mode: 'lattice',
    lattice: { a: 10.5, i: [-7, 7], k: [-2, 8], layers: 2, lowerGain: 0.14, discAt: 0.55, oFrac: 0.4, disorder: 0.05, center: [0, 0, 20], top: 2.6, gain: 0.8 },
    cam: [[0, [-4, 21, -3], [-0.5, 0, 20], 42, 0.03], [2.958, [1.5, 17.5, 1.5], [1.0, 0, 20], 40, -0.01, 'inOutSine']],
    dof: { focus: [[0, 30.5], [2.958, 25.5]], K: 85, max: 140 },
    fog: [36, 20],
    compress: [[0, 1.0], [2.958, 0.78, 'inOutSine']],
    heat: [[0, 0.1], [2.958, 0.95, 'inQuad']],
    jitter: [[0, 0.05], [2.958, 0.17, 'inQuad']],
    rain: { rate: 46, speed: 26, height: 10.5, trail: 8, trailInt: 5.0, inten: 1.5, near: 17, x: [-26, 26], z: [13, 52], zPow: 1.0, t0: -2.0, drift: 0.03, flash: 26, sparks: 9, ringAmp: 0.6, ringSpeed: 24 },
    haze: [[0, 0.04], [2.958, 0.12, 'inQuad']], hazeCol: [0.5, 0.02, 0.008],
    ringCol: [1.0, 0.55, 0.22], refract: 6,
    shake: [0.04, 9],
    post: { exposure: 1.0, bloomStrength: 0.07, bloomThreshold: 1.2, halation: 0.025, vignette: 0.6, grain: 0.04, contrast: 1.06, lift: 0.03 },
  },
  // S14f (1.42 s): the CNO cycle as a ring of six nuclei, the proton strike on carbon sets light running round
  'S14f-cno': {
    refDur: 1.7,
    mode: 'cno',
    ringR: 10, center: [0, 0, 0], tilt: 1.02, start: -Math.PI / 2, spin0: 0.0, spin: 0.08,
    react: [0.36, 0.58, 0.8, 1.02, 1.24, 1.46], leg: 0.22, inT: 0.3, inDist: 30, inOut: 0.95, inTan: 0.3, inUp: 0.85,
    inDir: [-0.3, 1.0, 0.3],      // hero strike on carbon: from above and outside, across the empty ring interior
    flash: 70, pathInt: 0.9,
    cam: [[0, [0, 9.6, -65], [0, -0.6, -3.5], 26], [1.7, [0, 9.2, -62], [0, -0.6, -3.5], 26]],
    dof: { focus: [[0, 58.5], [1.7, 55.5]], K: 40, max: 120 },
    field: { n: 26, box: [[-80, 80], [-40, 30], [45, 170]], gain: 0.16, heat: 0.0, pFrac: 0.35, drift: [0, 0, -4] },
    ringCol: [0.4, 0.65, 1.0], refract: 4,
    post: { exposure: 1.0, bloomStrength: 0.1, bloomThreshold: 1.2, halation: 0.03, vignette: 0.55, contrast: 1.05, streakStrength: 0.05, lift: 0.04 },
  },
  // F28.1 (0.79 s): protons jittering under compression. Black gaps close as the pressure rises; the front
  // layer is crisp, the deeper layers melt into dim flat bokeh.
  'F28.1': {
    refDur: 0.9,
    mode: 'gas',
    gas: { lattice: [12, 7, 3], spacing: 2.6, zs: 1.7, disorder: 0.1, center: [0, 0, 14.2], gain: 1.1, nFrac: 0.06, ghosts: 1, layerFall: [[0, 0.1], [0.9, 0.26, 'inQuad']], deepTint: [1.0, 0.27, 0.09] },
    compress: [[0, 1.0], [0.9, 0.74, 'inQuad']],
    heat: [[0, 0.12], [0.9, 0.5, 'inQuad']],
    jitter: [[0, 0.1], [0.9, 0.24, 'inQuad']],
    cam: [[0, [-0.6, 0.9, 0.0], [0.2, 0, 14.2], 40, 0.06], [0.9, [0.2, 0.5, 1.8], [0.3, 0, 14.2], 40, -0.02]],
    dof: { focus: [[0, 10.6], [0.9, 9.75]], K: 170, max: 150 },
    waves: [{ c: [0, 0, 10.8], t: 0.05, speed: 14, amp: 0.5, decay: 0.4, lambda: 1.2, w: 0.8 }],
    ringCol: [1.0, 0.55, 0.2], refract: 7,
    shake: [0.03, 13],
    post: { exposure: 1.0, bloomStrength: 0.09, bloomThreshold: 1.3, halation: 0.04, vignette: 0.62, contrast: 1.07, lift: 0.03 },
  },
  // F30.1 (0.79 s): a fusion flash — a proton strikes a carbon nucleus, leaving white-hot nitrogen-13
  'F30.1': {
    refDur: 0.9,
    mode: 'collide',
    bodies: [
      { A: 12, Z: 6, p0: [0.4, 0, 0], p1: [0.4, 0, 0], t0: 0, t1: 1, off: 0.32, heat: [[0, 0.3], [0.31, 1.0, 'inQuad']], jit: [[0, 0.06], [0.31, 0.22]], spin: 0.9 },
      { A: 1, Z: 1, p0: [-26, 6, 5], p1: [0.4, 0, 0], t0: 0.0, t1: 0.32, off: 0.32, ease: 'lin', trail: 0.3, trailInt: 6 },
      { A: 13, Z: 7, p0: [0.4, 0, 0], p1: [0.4, 0, 0], t0: 0, t1: 1, on: 0.32, heat: [[0.32, 2.8], [0.9, 0.7, 'outQuad']], jit: [[0.32, 0.45], [0.9, 0.12]], spin: 1.6 },
    ],
    hits: [{ t: 0.32, p: [0.4, 0, 0], flash: 90, r: 0.6, decay: 0.08, reach: 3.0, flatView: 0.7, sparks: 56, sparkSpeed: 28, sparkLife: 0.6, seed: 3, ring: { speed: 24, amp: 0.9, decay: 0.32, lambda: 1.6, w: 0.9 } }],
    field: { n: 34, box: [[-50, 50], [-24, 24], [22, 120]], gain: 0.22, heat: 0.15, pFrac: 0.4 },
    cam: [[0, [-2, 1.5, -24], [0.4, 0, 0], 30, 0.03], [0.9, [-1.2, 1.0, -19], [0.4, 0, 0], 30, -0.01]],
    dof: { focus: [[0, 24], [0.9, 19.5]], K: 60, max: 150 },
    ringCol: [1.0, 0.62, 0.28], refract: 8,
    post: { exposure: 1.0, bloomStrength: 0.09, bloomThreshold: 1.3, halation: 0.04, vignette: 0.6, streakStrength: 0.06, lift: 0.03 },
  },
  // F31.3 (0.42 s): a tight two-body head-on collision; white-hot starburst, nucleons sprayed with trails.
  // The edges of frame stay black.
  'F31.3': {
    refDur: 0.5,
    mode: 'collide',
    bodies: [
      { A: 16, Z: 8, p0: [-8.5, -0.8, 1.5], p1: [-0.8, 0, 0], t0: 0, t1: 0.14, off: 0.14, ease: 'in', heat: [[0, 0.7], [0.14, 2.0]], jit: 0.2, trail: 0.5, trailInt: 2.5 },
      { A: 12, Z: 6, p0: [8.5, 1.2, -1], p1: [0.8, 0, 0], t0: 0, t1: 0.14, off: 0.14, ease: 'in', heat: [[0, 0.7], [0.14, 2.0]], jit: 0.2, trail: 0.5, trailInt: 2.5 },
    ],
    hits: [{ t: 0.14, p: [0, 0, 0], flash: 100, r: 0.6, decay: 0.06, reach: 3.0, sparks: 110, sparkSpeed: 40, sparkLife: 0.5, sparkInt: 34, sparkR: 0.055, seed: 11, flatView: 0.8, ring: { speed: 30, amp: 0.7, decay: 0.3, lambda: 2.0, w: 1.2 }, shatter: { A: 18, Z: 9, speed: 34, heat: 1.1, trail: 2.2, flatView: 0.9, scale: 0.8 } }],
    field: { n: 30, box: [[-40, 40], [-22, 22], [16, 90]], gain: 0.32, heat: 0.5, pFrac: 0.4 },
    cam: [[0, [0, 1.0, -15.5], [0, 0, 0], 32, 0.05], [0.5, [0, 0.7, -12.5], [0, 0, 0], 32, -0.05]],
    dof: { focus: [[0, 15.5], [0.5, 12.5]], K: 55, max: 150 },
    ringCol: [1.0, 0.75, 0.45], refract: 10,
    shake: [0.12, 17],
    post: { exposure: 1.0, bloomStrength: 0.1, bloomThreshold: 1.3, halation: 0.05, vignette: 0.6, streakStrength: 0.08, lift: 0.03 },
  },
  // F31.8 (0.38 s): a wide field of small collisions firing at once, staggered, on a fast lateral track with
  // a Dutch tilt; everything heats until the emitters clip and the frame burns out to white.
  'F31.8': {
    refDur: 0.375,
    mode: 'collide',
    swarm: { n: 16, t: [0.0, 0.27], box: [[-24, 24], [-8, 8], [10, 38]], app: 0.08, dist: 6, flash: 60, sparks: 34 },
    heatAdd: [[0, 0], [0.19, 0.3], [0.333, 3.4, 'inQuad']],
    field: { n: 46, box: [[-60, 60], [-26, 26], [12, 90]], gain: 0.38, heat: [[0, 0.4], [0.375, 1.0]], pFrac: 0.4 },
    fill: [[0, 0], [0.235, 0], [0.333, 8.0, 'inCubic']], fillCol: [[0.235, [1.0, 0.22, 0.04]], [0.29, [1.0, 0.55, 0.16]], [0.333, [1.0, 0.95, 0.88]]],
    fillAt: [0, 0, 22], fillR: [[0.235, 0.22], [0.29, 0.4], [0.333, 1.6, 'inQuad']],
    cam: [[0, [-8, 1.2, -13], [-3.5, 0, 22], 46, 0.17], [0.375, [5, 0.4, -11], [6.5, 0, 22], 46, 0.23, 'linear']],
    dof: { focus: [[0, 30], [0.375, 29]], K: 38, max: 120 },
    ringCol: [1.0, 0.8, 0.55], refract: 10,
    shake: [0.14, 19],
    post: { exposure: 1.0, bloomStrength: 0.1, bloomThreshold: 1.3, halation: 0.05, vignette: 0.55, streakStrength: 0.08, lift: 0.03 },
  },
  // S20 strike 4 (3.04 s): the strike lands on an uncrushed lattice; it implodes over the next ~9 frames as the
  // strike flash decays (camera push + zoom blur), rebounds, and settles crushed. A chain reaction spreads
  // from the hero nucleus at frame centre, fusion events multiply, and the emission climbs to white.
  'S20-strike4': {
    refDur: 3.042,
    mode: 'lattice',
    lattice: { a: 11, i: [-6, 6], k: [-3, 7], layers: 2, lowerGain: 0.1, discAt: 0.55, oFrac: 0.45, disorder: 0.05, center: [0, 0, 11], top: 2.6, gain: 0.85 },
    crush: { t: 0, from: 1.1, to: 0.66, tp: 0.36, zeta: 0.5, push: 2.4, zoom: 0.012, glow: 9, glowR: 0.9, ringSpeed: 30 },
    cam: [[0, [-2, 19, -6], [0, 0, 11], 40, 0.04], [3.042, [1.0, 15, -2], [0.5, 0, 11], 37, -0.03, 'inOutSine']],
    dof: { focus: [[0, 23.5], [3.042, 18.8]], K: 80, max: 150 },
    fog: [28, 18],
    heat: [[0, 0.2], [0.1, 0.3], [0.38, 0.85], [0.8, 0.55], [2.0, 0.95], [2.65, 1.7], [3.042, 4.8, 'inQuad']],
    jitter: [[0, 0.08], [0.15, 0.35], [0.7, 0.16], [3.042, 0.4, 'inQuad']],
    events: { t0: 0.4, r0: 2.4, k: 1.15, life: 0.8, spread: { r0: 2, v: 9, zs: 0.75, near: 0.25, max: 26, k: [1, 3] }, flash: 50, flashR: 0.35, flashDecay: 0.06, reach: 3.0, zBias: 5, glowLift: 1.3, heatKick: 1.9,
      sparks: 32, sparkSpeed: 19, sparkLife: 0.6, sparkInt: 50, sparkR: 0.05, trail: 0.12, ringSpeed: 26, flat: 0.3, zsq: 0.4, sparkLift: 1.2 },
    haze: [[0, 0.04], [2.4, 0.07], [3.042, 0.22, 'inQuad']], hazeCol: [[0, [0.45, 0.02, 0.008]], [2.4, [0.5, 0.03, 0.01]], [3.042, [1.0, 0.22, 0.05]]],
    fill: [[0, 0], [2.74, 0], [3.042, 7.0, 'inCubic']], fillCol: [[2.74, [1.0, 0.22, 0.04]], [2.9, [1.0, 0.6, 0.2]], [3.042, [1.0, 0.95, 0.88]]],
    fillAt: [0, 1, 11], fillR: [[2.74, 0.25], [3.042, 1.6]],
    ringCol: [1.0, 0.6, 0.25], refract: 8,
    shake: [0.1, 15],
    post: { exposure: 1.0, bloomStrength: 0.09, bloomThreshold: 1.3, halation: 0.04, vignette: 0.58, streakStrength: 0.05, lift: 0.03, contrast: 1.08 },
  },
};
presets.default = presets['S13-atoms'];

// ------------------------------------------------------------------------------------------ scene
const localT = (S) => clamp(S.local, -0.25, S.dur + 0.25) * (S.params.refDur ? S.params.refDur / S.dur : 1);

export default {
  id: 'atoms',
  scale: 1,
  presets,
  init(E) {
    this.prog = E.program(FS, 'atoms');
    this.B = new SpriteBatch(E.G, E.W, E.H);
  },
  camera(P, t) {
    const base = camFromKeys(P.cam, t);
    let pos = base.pos;
    // strike push: the rig lurches in with the implosion
    if (P.crush && P.crush.push) pos = add(pos, mul(base.fwd, P.crush.push * clamp(crushState(P, t).k, 0, 1.3)));
    if (!P.shake && pos === base.pos) return base;
    // micro-vibration of the macro rig: smooth high-frequency shake
    const [amp, w] = P.shake || [0, 0];
    const o = (k) => amp * (Math.sin(t * w * (1 + 0.37 * k) + k * 1.7) * 0.6 + Math.sin(t * w * (2.13 + 0.21 * k) + k * 4.1) * 0.4);
    const off = [o(0), o(1), o(2) * 0.5];
    const p2 = add(pos, off);
    const tgt = add(add(pos, mul(base.fwd, 10)), mul(off, 0.4));
    const fov = (2 * Math.atan(base.tanH) * 180) / Math.PI;
    const roll = Math.atan2(base.right[1], base.up[1]);
    return camera(p2, tgt, fov, roll);
  },
  render(E, S, target) {
    const P = S.params;
    // presets are authored for refDur seconds; stretch so their beats land on the plan's actual timing
    const t = localT(S);
    const cam = this.camera(P, t);
    const B = this.B;
    const dof = P.dof || { focus: 20, K: 20 };
    B.begin(cam, { focus: kv(dof.focus, t, 20), K: dof.K, max: dof.max, fog: P.fog });
    const fx = { rings: [], ringMode: 1, ringPlane: [0, 1, 0, 0] };
    (GEN[P.mode] || GEN.lattice).call(this, B, P, t, S, fx);
    B.finish();
    if (P.debug) console.warn('atoms stats', JSON.stringify(B.stats), 'tiles', B.tx, B.ty, 'maxTile', Math.max(...B.cur));
    // strongest rings only
    fx.rings.sort((a, b) => b.amp - a.amp);
    const rc = new Float32Array(32), rw = new Float32Array(32), rs = new Float32Array(32);
    const nr = Math.min(8, fx.rings.length);
    for (let i = 0; i < nr; i++) {
      const r = fx.rings[i];
      rc.set([r.c[0], r.c[1], r.c[2], r.r], i * 4);
      rw.set([r.w, r.k, r.amp, 0], i * 4);
      rs.set(this.ringBound(B, r, fx), i * 4);
    }
    E.draw(this.prog, {
      ...cam.uniforms, ...B.uniforms(),
      uRingC: rc, uRingW: rw, uRingS: rs, uNR: nr, uRingMode: fx.ringMode, uRingPlane: fx.ringPlane,
      uRingCol: P.ringCol || [1.0, 0.6, 0.25], uRefract: (P.refract ?? 6) * (E.H / 1080),
      uFill: kv(P.fill, t, 0), uFillCol: kc(P.fillCol, t, WHITE), uFillC: this.fillCenter(B, P, t),
      uHaze: kv(P.haze, t, 0), uHazeCol: kc(P.hazeCol, t, CRIMSON),
    }, target);
  },
  // screen-space annulus bounding a ring's visible band (centre px, outer px, inner px), from 16 projected
  // points on its outer and inner edges (3 widths out), so the shader skips the ring almost everywhere
  ringBound(B, r, fx) {
    const q = B.proj(r.c);
    if (!q) return [0, 0, 1e9, 0];
    const cam = B.cam;
    let u, v;
    if (fx.ringMode === 0) { const n = fx.ringPlane; u = norm(Math.abs(n[1]) < 0.9 ? [n[2], 0, -n[0]] : [1, 0, 0]); v = norm([n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]]); }
    else { u = cam.right; v = cam.up; }
    const ro = r.r + 3 * r.w, ri = Math.max(0, r.r - 3 * r.w);
    let mx = 0, mn = 1e9, bad = false;
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * TAU, ca = Math.cos(a), sa = Math.sin(a);
      for (const [rad, outer] of [[ro, true], [ri, false]]) {
        const p = add(r.c, add(mul(u, ca * rad), mul(v, sa * rad)));
        const pp = B.proj(p);
        if (!pp) { bad = true; continue; }
        const d = Math.hypot(pp[0] - q[0], pp[1] - q[1]);
        if (outer) mx = Math.max(mx, d); else mn = Math.min(mn, d);
      }
    }
    if (bad) return [q[0], q[1], 1e9, 0];
    return [q[0], q[1], mx * 1.15 + 4 + (fx.ringRefract || 0), ri > 0 ? Math.max(0, mn * 0.85 - 4) : 0];
  },
  fillCenter(B, P, t) {
    if (!P.fillAt) return [0, 0, 0];
    const q = B.proj(P.fillAt);
    return q ? [q[0], q[1], kv(P.fillR, t, 0.35) * B.H] : [0, 0, 0];
  },
  post(E, S) {
    const P = S.params;
    const out = { ...(P.post || {}) };
    if (P.crush && P.crush.zoom) {
      // implosion: radial blur that follows the crush velocity (reads through the strike whiteout)
      const v = crushState(P, localT(S)).v;
      out.zoomBlur = Math.min(0.09, Math.abs(v) * P.crush.zoom);
    }
    return out;
  },
};
