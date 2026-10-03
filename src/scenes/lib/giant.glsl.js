// GOLIATH: shared red-giant shading so close-ups and system shots match.
// Reference look: 3D radiative-hydrodynamics models of red supergiants (Freytag / Chiavassa): a handful of
// giant convection cells across the disk, smaller granulation inside them, strong limb darkening to deep
// crimson, an extended glowing atmosphere with clumpy molecular layers, arcing prominences and mass-loss plumes.
//
// Units: giant radius = uGiantR (scene units). Object space = world - uGiantPos; pattern space is that rotated by
// rotY(uGiantSpin) (the surface pattern, loops and plumes turn with the star; tidal bulge and scar do not).
// Display temperature palette (artistic mapping of emission temperature):
//   ~1500 K crimson lanes -> ~2200 K ember -> ~3300 K gold upflows; brightness ~ (T/2500)^4.
//
// Public API (stable; binary and nova call these):
//   vec3  giantColor(float T), giantEmission(float T)
//   float giantRadius(vec3 n)                           n = object-space unit vector (unspun), incl. relief
//   float giantTemperature(vec3 ns, float mu, float t)  ns = pattern-space unit vector
//   float giantTrace(vec3 o, vec3 rd)                   photosphere distance (o = ray origin - uGiantPos), -1 = miss
//   vec4  giantShade(vec3 ro, vec3 rd, float t, out float dist)   one-call look: rgb radiance, a = coverage
// Building blocks for multi-pass scenes (see scenes/redgiant.js): giantVolume + giantVolumeSteps (structured gas:
// molecular veils, mass-loss plumes, aftermath streamers/soot), giantHaze (analytic limb haze), giantSurface,
// gLoops (prominence loops, full resolution). Optional uniforms (0 = off/default): uGiantAtmo, hero loops/plumes,
// uGiantHeroOnly.
// Evolution: bounded periodic motion uses `t`; in-place "boiling" (cells born and dying) uses uLocal so the pattern
// never drifts in scale over the film. Detail is filtered by the pixel footprint (no shimmer at system scale).
import { mulberry32 } from '../../engine/rng.js';

// mass-loss plumes: c = footpoint direction (pattern space), l = lean direction (tangent),
// height = e-folding height (R), width = base half-width (R), lean = curvature, phase.
export const GIANT_PLUMES = (() => {
  const rnd = mulberry32(4242);
  const out = [];
  const N = 16;
  for (let i = 0; i < N; i++) {
    const y = 1 - (2 * (i + 0.5)) / N;
    const r = Math.sqrt(1 - y * y);
    const ph = i * 2.399963 + 1.1 + rnd() * 0.8;
    const c = [Math.cos(ph) * r, y, Math.sin(ph) * r];
    const tmp = Math.abs(c[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    let l = [c[1] * tmp[2] - c[2] * tmp[1], c[2] * tmp[0] - c[0] * tmp[2], c[0] * tmp[1] - c[1] * tmp[0]];
    const ll = Math.hypot(...l); l = l.map((v) => v / ll);
    const an = rnd() * Math.PI * 2;
    const t2 = [c[1] * l[2] - c[2] * l[1], c[2] * l[0] - c[0] * l[2], c[0] * l[1] - c[1] * l[0]];
    l = l.map((v, k) => v * Math.cos(an) + t2[k] * Math.sin(an));
    out.push({ c, l, height: 0.06 + rnd() * 0.10, width: 0.018 + rnd() * 0.02, lean: 0.4 + rnd() * 1.2, phase: rnd() });
  }
  return out;
})();

const fx = (x) => (Math.round(x * 1e5) / 1e5).toFixed(5);
const v3s = (v) => `vec3(${fx(v[0])},${fx(v[1])},${fx(v[2])})`;
const NP = GIANT_PLUMES.length;
const PLUME_GLSL = `
const int G_NPLUME = ${NP};
const vec3 G_PL_C[${NP}] = vec3[](${GIANT_PLUMES.map((l) => v3s(l.c)).join(',')});
const vec3 G_PL_L[${NP}] = vec3[](${GIANT_PLUMES.map((l) => v3s(l.l)).join(',')});
const vec4 G_PL_P[${NP}] = vec4[](${GIANT_PLUMES.map((l) => `vec4(${fx(l.height)},${fx(l.width)},${fx(l.lean)},${fx(l.phase)})`).join(',')});
`;
export const GIANT = `
uniform vec3 uGiantPos;
uniform float uGiantR;
uniform float uGiantSpin;     // rotation angle (radians) about object Y
uniform float uBoil;          // evolution rate multiplier
uniform float uBulge;         // tidal elongation toward uBulgeDir (0..0.5)
uniform vec3 uBulgeDir;
uniform float uScar;          // aftermath: ablated/heated hemisphere facing uScarDir (0..1)
uniform vec3 uScarDir;
uniform float uGiantGlow;     // brightness multiplier
uniform float uPlumes;        // prominence / mass-loss plume strength
uniform float uRelief;        // surface relief of convection cells as fraction of R (close-ups: ~0.004..0.02)
uniform float uLimbDark;      // limb darkening strength (default 0.62)
uniform float uGiantAtmo;     // optional extra atmosphere density (0 = default, 1 = double)
uniform vec3 uHeroC[2];       // optional hero prominence loops in OBJECT space (zero vector = unused):
uniform vec3 uHeroA[2];       //   footpoint-centre direction, footpoint axis,
uniform vec4 uHeroP[2];       //   (half span rad, height R, width R, phase)
uniform vec3 uHeroPlC[4];     // optional hero plumes in OBJECT space (zero = unused): footpoint direction,
uniform vec3 uHeroPlL[4];     //   lean direction,
uniform vec4 uHeroPlP[4];     //   (e-folding height R, base half-width R, lean, phase)
uniform float uGiantHeroOnly; // optional: 1 = draw only the hero loops/plumes (close-ups), 0 = full tables
${PLUME_GLSL}
// palette ramp (linear) keyed by display temperature; saturated crimson -> ember -> gold -> white-gold
vec3 giantColor(float T){
  vec3 c0 = vec3(0.30, 0.012, 0.006);  // 1400 K abyssal crimson
  vec3 c1 = vec3(0.85, 0.055, 0.016);  // 1900 K crimson
  vec3 c2 = vec3(1.00, 0.20, 0.035);   // 2400 K ember
  vec3 c3 = vec3(1.00, 0.46, 0.11);    // 2900 K molten gold
  vec3 c4 = vec3(1.00, 0.78, 0.48);    // 3700 K white-gold
  float x = (T - 1400.0) / 500.0;
  vec3 c = x < 1.0 ? mix(c0, c1, sat(x)) : x < 2.0 ? mix(c1, c2, x - 1.0) : x < 3.0 ? mix(c2, c3, x - 2.0) : mix(c3, c4, sat((x - 3.0) / 1.6));
  return c;
}
vec3 giantEmission(float T){ return giantColor(T) * pow(T / 2500.0, 4.0) * 1.4; }

// pixel angle of the current render target (radians per pixel)
float gPixAngle(){ return 2.0 * uTanHalfFov / uRes.y; }
// octave fade for a feature frequency (cycles per R) at footprint fp (R per pixel)
float gLod(float freq, float fp){ return 1.0 - smoothstep(0.10, 0.40, freq * fp); }
// two decorrelated octaves from one fetch (R: 1 cell/unit, B: 2 cells/unit), ~[-1,1]
float gFbm2(vec3 p){ vec4 t = n4(p); return (t.r - 0.5) * 1.6 + (t.b - 0.5) * 0.8; }

// tidal shape only (no relief)
float giantRadius0(vec3 n){
  float c = max(0.0, dot(n, uBulgeDir));
  return uGiantR * (1.0 + uBulge * pow(c, 5.0) + uBulge * 0.15 * c);
}
// mid-granulation field (pattern space): x = dome height 0..1 (shared by tracer and shading), y = F2-F1
vec2 gMid(vec3 ns, float bo){
  vec4 wq = n4(ns * 2.4 + 41.0);
  vec3 pm = ns * (6.2 + 0.07 * bo) + (wq.rbr - 0.5) * vec3(2.6, 2.6, -2.6);
  vec2 c = cells3(pm);
  float dome = exp(-c.x * c.x * 3.2);                       // rounded granule domes (no mesas on the horizon)
  return vec2(dome, c.y);
}
float giantRadius(vec3 n){
  float r = giantRadius0(n);
  if (uRelief > 0.0) r += uRelief * uGiantR * (gMid(rotY(uGiantSpin) * n, uLocal * uBoil).x - 0.35);
  return r;
}

// analytic Worley with slowly orbiting feature points: x=F1, y=F2, z,w = hashes of the nearest cell.
// r1/r2 = vectors from p to the nearest/second feature points (for analytic gradients).
vec4 gWorley(vec3 p, float t, out vec3 r1, out vec3 r2){
  vec3 ip = floor(p), fp = p - ip;
  float d1 = 9.0, d2 = 9.0; vec2 id = vec2(0.0);
  r1 = vec3(1.0); r2 = vec3(1.0);
  for (int k = -1; k <= 1; k++) for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
    vec3 g = vec3(float(i), float(j), float(k));
    vec3 h = hash33(ip + g + 71.0);
    vec3 o = 0.5 + 0.34 * sin(t * (0.55 + 0.9 * h.zxy) + TAU * h);
    vec3 r = g + o - fp;
    float d = dot(r, r);
    if (d < d1){ d2 = d1; r2 = r1; d1 = d; r1 = r; id = h.xy; }
    else if (d < d2){ d2 = d; r2 = r; }
  }
  return vec4(sqrt(d1), sqrt(d2), id);
}

// small + fine granulation, footprint filtered: x = height, y = temperature offset (K)
vec2 gFine(vec3 ns, vec3 w, float fp, float bo){
  float S = 0.0;
  float ls = gLod(20.0, fp);
  if (ls > 0.0){
    vec3 ps = ns * (20.0 + 0.25 * bo) + w * 1.8;
    vec2 cs = cells3(ps);
    S = smoothstep(0.95, 0.1, cs.x) * ls;
  }
  float F = 0.0, a = 0.5, fr = 60.0;
  vec3 q = ns * fr + w * 3.0 + ns * (0.6 * bo);
  for (int i = 0; i < 4; i++){
    float l = gLod(fr, fp);
    if (l <= 0.0) break;
    F += a * l * n3(q);
    q = q * 2.03 + vec3(1.7, -3.1, 2.3); fr *= 2.03; a *= 0.55;
  }
  return vec2(0.30 * S + 0.06 * F, 150.0 * (S - 0.4) + 220.0 * F);
}

// Full photosphere temperature with footprint filtering; optional relief gradient (pattern space).
float giantTemperatureLod(vec3 ns, float mu, float t, float fp, bool wantGrad, out vec3 gradH){
  float tt = t * uBoil;
  float bo = uLocal * uBoil;
  gradH = vec3(0.0);
  // large-scale flow warp (2 octaves per component), morphing in place
  vec3 pw = ns * (1.15 + 0.012 * bo);
  vec3 w = vec3(gFbm2(pw + 5.0), gFbm2(pw + 13.1), gFbm2(pw + 27.7));
  // GIANT CELLS: a handful across the disk; points orbit slowly, cells flare and fade
  const float GS = 1.7;
  vec3 r1, r2;
  vec4 gc = gWorley(ns * GS + w * 1.05, tt * 0.05, r1, r2);
  float F1 = gc.x, F2 = gc.y, E = F2 - F1;
  vec4 nq = n4(ns * 3.1 + w * 0.6 + 19.0);
  float lw = 0.10 + 0.30 * nq.r;                          // lane width varies along the network
  float lx = sat((E + (nq.b - 0.5) * 0.22 + (nq.a - 0.5) * 0.1) / lw);   // fuzzy, broken lane edges
  float lane = lx * lx * (3.0 - 2.0 * lx);
  float deep = 0.45 + 0.55 * smoothstep(0.3, 0.7, nq.b);   // some lanes shallow, some abyssal
  float core = exp(-F1 * F1 * 1.8);
  float life = 0.78 + 0.22 * sin(tt * (0.09 + 0.08 * gc.w) + TAU * gc.z);
  float amp = mix(0.68, (0.50 + 0.50 * gc.z) * life, lane);   // per-cell flare, continuous across borders
  // bright upflow plumes inside each giant cell (sub-cell structure)
  float sub = gFbm2(ns * 4.3 + w * 1.1 + vec3(0.0, 0.0, 0.02 * tt) + 3.3);
  float G = amp * (0.42 + 0.58 * core) * (0.84 + 0.26 * sub) * mix(1.0 - deep, 1.0, lane);
  vec2 md = gMid(ns, bo);
  float M = md.x * gLod(6.2, fp);
  vec2 fl = gFine(ns, w, fp, bo);
  float gran = (0.25 + 0.75 * sat(G * 1.4)) * (0.45 + 0.55 * smoothstep(0.25, 0.75, nq.g));   // patchy granulation
  // bright cells boil with granulation (cauliflower); dark lanes stay smooth and deep
  float T = 1640.0 + G * (1500.0 + 900.0 * (M - 0.45)) + (80.0 * (M - 0.45) + fl.y) * gran;
  // close-ups (relief set): the granulation boils everywhere, not only inside bright cells
  float closeK = sat(uRelief * 125.0);
  T += closeK * (260.0 * (M - 0.45) + 1.3 * fl.y) * (0.55 + 0.45 * sat(G * 1.5));
  // cool starspot-like depressions: rare, broad
  float spot = smoothstep(0.66, 0.82, n3(ns * 1.9 + 40.0 + vec3(0.0, 0.0, tt * 0.004)) * 0.5 + 0.5);
  T *= 1.0 - 0.22 * spot;
  if (wantGrad){
    // analytic gradient of the giant-cell dome (warp Jacobian ignored)
    vec3 gF1 = -r1 / max(F1, 1e-3), gF2 = -r2 / max(F2, 1e-3);
    float dcore = -2.4 * F1 * core;
    float dlane = 6.0 * lx * (1.0 - lx) / lw;
    vec3 gG = amp * (0.58 * dcore * gF1 * mix(1.0 - deep, 1.0, lane) + (0.42 + 0.58 * core) * deep * dlane * (gF2 - gF1)) * GS;
    // finite differences of the granulation along two tangents
    vec3 t1 = normalize(cross(ns, abs(ns.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
    vec3 t2 = cross(ns, t1);
    float e = max(fp * 1.5, 1.5e-4);
    vec3 nx = normalize(ns + t1 * e), ny = normalize(ns + t2 * e);
    bool fineFD = uRelief > 0.0065;                           // fine-layer slopes only matter in true close-ups
    float h0 = md.x * 0.55 + (fineFD ? fl.x : 0.0);
    float hx = gMid(nx, bo).x * 0.55 + (fineFD ? gFine(nx, w, fp, bo).x : 0.0);
    float hy = gMid(ny, bo).x * 0.55 + (fineFD ? gFine(ny, w, fp, bo).x : 0.0);
    gradH = 0.25 * gG + (t1 * (hx - h0) + t2 * (hy - h0)) / e;
  }
  // limb: we see higher, cooler layers
  T *= mix(1.0 - 0.55 * uLimbDark, 1.0, pow(sat(mu), 0.5));
  return T;
}
float giantTemperature(vec3 n, float mu, float t){ vec3 g; return giantTemperatureLod(n, mu, t, 0.003, false, g); }

// aftermath: scorched crust, incandescent fissures and a burning front on the hemisphere facing uScarDir
float gScarSurface(float T, vec3 n, vec3 ns, float t, float fp){
  float fdir = dot(n, uScarDir);
  float rag = gFbm2(ns * 3.0 + 17.0) * 0.5 + 0.5;
  float edge = fdir + (rag - 0.5) * 0.7;
  float burn = smoothstep(-0.12, 0.35, edge) * uScar;
  if (burn <= 0.0) return T;
  vec3 q = ns * 6.0 + vec3(0.0, 0.0, t * 0.015);
  q += vec3(gFbm2(q * 0.45 + 3.0), gFbm2(q * 0.45 + 11.0), 0.0) * 0.9;
  float fis = ridged3(q, 3);
  float crack = smoothstep(0.40, 0.80, fis);
  float flick = 0.8 + 0.2 * n3(ns * 21.0 + vec3(t * 0.8, 0.0, 0.0));
  // stripped envelope: smoke-darkened ablated crust, torn open onto hot layers beneath
  float crustT = T * (0.40 + 0.16 * rag);
  float deep = smoothstep(0.35, 0.95, fdir);                // centre of the wound: more exposed
  float raw = 2150.0 + 450.0 * (gFbm2(ns * 9.0 + vec3(0.0, t * 0.03, 0.0)) * 0.5 + 0.5);
  float base = mix(crustT, raw, deep * smoothstep(0.35, 0.75, rag) * 0.8);
  float hotT = 2450.0 + 650.0 * crack * flick;              // shock-heated fissures (gold, not white)
  float Ts = mix(base, hotT, crack * (0.6 + 0.4 * deep));
  // burning front where the stripping still eats into the envelope
  float front = exp(-pow((edge - 0.06) / 0.10, 2.0)) * (0.7 + 0.3 * smoothstep(0.3, 0.8, fis));
  Ts = mix(Ts, max(Ts, 2900.0 * flick), front * 0.9);
  return mix(T, Ts, burn);
}

// ---- tracing ---------------------------------------------------------------------------------------------
// distance to the photosphere along the ray, or -1 (o = ray origin relative to the giant centre)
float giantTrace(vec3 o, vec3 rd){
  // geometric relief only when its bumps span >= 1.5 px (shading relief is independent of this)
  float bumpPx = uRelief * uGiantR / max(length(o) - uGiantR, 1e-3 * uGiantR) / (2.0 * uTanHalfFov / uFull.y);   // full-frame px: same decision in every pass
  bool geo = uRelief > 0.0 && bumpPx > 1.5;
  if (uBulge <= 0.0 && !geo){
    vec2 h = sphereHit(o, rd, vec3(0.0), uGiantR);
    return h.y > 0.0 && h.x > 0.0 ? h.x : -1.0;
  }
  float rOut = uGiantR * (1.0 + uBulge * 1.2 + (geo ? uRelief * 0.7 : 0.0));
  vec2 hs = sphereHit(o, rd, vec3(0.0), rOut);
  if (hs.y < 0.0) return -1.0;
  float th = max(hs.x, 0.0), prev = th;
  float k = uBulge > 0.0 ? 0.6 : 0.9;
  float minStep = uGiantR * (geo ? 0.0012 : 0.0004);
  for (int i = 0; i < 64; i++){
    vec3 p = o + rd * th; float r = length(p);
    float d = r - (geo ? giantRadius(p / r) : giantRadius0(p / r));
    if (d < 0.0003 * uGiantR){
      if (d < 0.0){ // overshoot: bisect back to the crossing
        float a = prev, b = th;
        for (int j = 0; j < 5; j++){
          float m = 0.5 * (a + b); vec3 q = o + rd * m; float rq = length(q);
          if (rq - (geo ? giantRadius(q / rq) : giantRadius0(q / rq)) < 0.0) b = m; else a = m;
        }
        th = 0.5 * (a + b);
      }
      return th;
    }
    prev = th;
    th += max(d * k, minStep);
    if (th > hs.y) return -1.0;
  }
  return -1.0;
}

// cheap photosphere distance without relief (volume passes): analytic sphere unless tidally distorted
float giantTraceCoarse(vec3 o, vec3 rd){
  if (uBulge <= 0.0){
    vec2 h = sphereHit(o, rd, vec3(0.0), uGiantR);
    return h.y > 0.0 && h.x > 0.0 ? h.x : -1.0;
  }
  float rOut = uGiantR * (1.0 + uBulge * 1.2);
  vec2 hs = sphereHit(o, rd, vec3(0.0), rOut);
  if (hs.y < 0.0) return -1.0;
  float th = max(hs.x, 0.0);
  for (int i = 0; i < 40; i++){
    vec3 p = o + rd * th; float r = length(p);
    float d = r - giantRadius0(p / r);
    if (d < 0.0005 * uGiantR) return th;
    th += d * 0.6;
    if (th > hs.y) return -1.0;
  }
  return -1.0;
}

// ---- prominence loops: analytic braided gaussian tubes along circular arcs ----------------------------------
float gVn1(float x){ float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(hash11(i * 1.37 + 0.11), hash11(i * 1.37 + 1.48), f); }
// ros/rds: ray in pattern space. Returns rgb radiance and the depth of the brightest crossing; opac = opacity.
void gLoopEval(vec3 ros, vec3 rds, vec3 C, vec3 e1, vec3 e2, float rho, float thA, float thB, float w,
               float ph, float t, float tMax, inout vec3 acc, inout float tau, inout float dep, inout float best){
  vec3 e3 = cross(e1, e2);
  // two starts (one per leg), alternating projection line <-> circle
  float th0 = -10.0;
  for (int s = 0; s < 2; s++){
    float th = s == 0 ? mix(thA, thB, 0.2) : mix(thA, thB, 0.8);
    vec3 P; float tp = 0.0;
    for (int it = 0; it < 3; it++){
      P = C + rho * (cos(th) * e1 + sin(th) * e2);
      tp = max(dot(P - ros, rds), 0.0);
      vec3 q = ros + rds * tp - C;
      th = clamp(atan(dot(q, e2), dot(q, e1)), thA, thB);
    }
    if (s == 0) th0 = th; else if (abs(th - th0) < 0.03) continue;
    float u = (th - thA) / (thB - thA);                       // 0..1 along the arc
    // irregular arc: radial wobble and out-of-plane sway, width varying along the loop
    vec3 er = cos(th) * e1 + sin(th) * e2;
    float wob = rho * (0.07 * sin(u * 4.0 + ph * 5.0) + 0.035 * sin(u * 9.0 + ph * 3.0 + t * 0.06));
    float sway = w * 3.0 * sin(u * 3.0 + ph * 7.0 + t * 0.04);
    P = C + er * (rho + wob) + e3 * sway;
    tp = dot(P - ros, rds);
    if (tp < 0.0 || tp > tMax) continue;
    float wu = w * (0.6 + 0.8 * gVn1(u * 5.0 + ph * 13.0));
    vec3 v = ros + rds * tp - P;
    float d2 = dot(v, v);
    if (d2 > 9.0 * wu * wu) continue;
    vec3 T = -sin(th) * e1 + cos(th) * e2;
    vec3 kx = cross(rds, T); float sa = length(kx);
    float x = mix(length(v), dot(v, kx / max(sa, 1e-4)), smoothstep(0.08, 0.3, sa)) / wu;   // offset across the tube
    float along = abs(u - 0.5) * 2.0;                          // 0 apex .. 1 footpoints
    // fine threads that braid, part and fade along the loop
    float tw = u * 6.0 + ph * 3.0 + t * 0.1;
    float s1 = 0.5 + 0.5 * cos(x * 4.5 + tw * 2.0 + 2.5 * gVn1(u * 6.0 + ph * 3.0));
    float fib = 0.65 + 0.35 * gVn1(u * 34.0 + x * 2.5 + ph * 9.0);
    float s3 = 0.5 + 0.5 * cos(x * 15.0 + tw * 4.3 + 3.0 * gVn1(u * 14.0 + ph * 5.0));
    float thr = exp(-x * x * 1.4) * (0.45 + 0.55 * s1 * s1) * (0.6 + 0.4 * s3 * s3) * fib;
    float halo = exp(-d2 / (wu * wu * 2.5)) * 0.12;
    // knots of plasma sliding down the legs (draining); the apex thins out
    float vn = gVn1(along * 7.0 - t * 0.6 * uBoil + ph * 10.0);
    float foot = smoothstep(0.0, 0.05, min(u, 1.0 - u));
    float bright = (0.25 + 0.75 * vn) * mix(0.35, 1.0, smoothstep(0.05, 0.8, along)) * foot;
    float path = min(1.0 / max(sa, 1e-3), 2.5);
    float e = (thr + halo) * bright * path;
    float Tl = 1750.0 + 800.0 * vn * (0.55 + 0.45 * along);
    acc += giantEmission(Tl) * e * 2.6;
    tau += e * 0.5;
    if (e > best){ best = e; dep = tp; }
  }
}
// one loop or an arcade of nested loops (n sub-loops)
void gLoopOne(vec3 ros, vec3 rds, vec3 c, vec3 ax, vec4 P, int n, float tMax, float t, inout vec3 acc, inout float tau, inout float dep, inout float best){
  float R = uGiantR;
  float ph0 = P.w * TAU;
  float H0 = P.y * (0.85 + 0.2 * sin(t * 0.045 + ph0)) * (0.7 + 0.45 * min(uPlumes, 1.5));
  float rb = giantRadius0(c) / R;
  vec3 bc = c * R * (rb + H0 * 0.5);
  float br = R * (max(rb * sin(P.x), H0 * 0.6) * 1.3 + 4.0 * P.z);
  vec3 oc = ros - bc; float b = dot(oc, rds); float hh = b * b - dot(oc, oc) + br * br;
  if (hh < 0.0 || -b + sqrt(hh) < 0.0) return;
  vec3 bn = cross(c, ax);
  for (int j = 0; j < 3; j++){
    if (j >= n) break;
    float fj = float(j);
    float ph = ph0 + fj * 2.3;
    float H = H0 * (1.0 - 0.26 * fj + 0.08 * sin(fj * 3.7 + ph0));
    float s = max(P.x * (1.0 - 0.12 * fj), H * 0.85);          // keep arches arch-like (no closed rings)
    float sg = fract(P.w * 7.0) > 0.5 ? 1.0 : -1.0;
    float ra = 0.10 * fj * sg;                                      // arcade: nearly parallel arches
    vec3 a = normalize(ax * cos(ra) + bn * sin(ra));
    vec3 cc = normalize(c + ax * (fj * P.x * 0.15 * sg) + bn * (fj * P.x * 0.75));
    float yc = ((rb + H) * (rb + H) - rb * rb) / (2.0 * (rb + H - rb * cos(s)));
    float rho = (rb + H - yc) * R;
    float thf = atan(rb * cos(s) - yc, rb * sin(s));
    float w = P.z * R * (0.8 + 0.4 * min(uPlumes, 1.5)) * (1.0 - 0.2 * fj);
    gLoopEval(ros, rds, cc * yc * R, a, cc, rho, thf, PI - thf, w, ph, t, tMax, acc, tau, dep, best);
  }
}
// ros/rds: ray in pattern space; spin: object->pattern rotation
vec4 gLoops(vec3 ros, vec3 rds, mat3 spin, float tMax, float t, out float opac){
  vec3 acc = vec3(0.0); float tau = 0.0, dep = 0.0, best = 0.0;
  // only curated hero loops are drawn: small unresolved table loops read as glitches at every scale
  for (int k = 0; k < 2; k++){
    if (dot(uHeroC[k], uHeroC[k]) < 0.5) continue;
    vec3 c = spin * normalize(uHeroC[k]);
    vec3 a = spin * uHeroA[k]; a = normalize(a - c * dot(a, c));
    vec4 P = uHeroP[k];
    int n = P.w >= 1.0 ? int(P.w) : 3;             // integer part of phase = sub-loop count
    P.w = fract(P.w);
    gLoopOne(ros, rds, c, a, P, n, tMax, t, acc, tau, dep, best);
  }
  opac = 1.0 - exp(-tau);
  return vec4(acc * (0.7 + 0.5 * uPlumes), best > 0.0 ? dep : 0.0);
}

// ---- mass-loss plumes: analytic flaring columns along curved radial axes ------------------------------------
void gPlumeOne(vec3 ros, vec3 rds, vec3 c, vec3 l, vec4 P, float tMax, float t, inout vec3 acc, inout float tau, inout float dep, inout float best){
  float R = uGiantR;
  float Hs = P.x * (0.7 + 0.45 * min(uPlumes, 2.0));
  float lean = P.z, ph = P.w * TAU;
  float rb = giantRadius0(c) / R;
  float Lmax = Hs * 3.5;
  float kl = lean * 0.35 / Lmax;                               // bend: ~0.35*lean*Lmax sideways at the top
  // bounding sphere around the plume
  vec3 bc = R * (c * (rb + Lmax * 0.5) + l * (kl * Lmax * Lmax * 0.25));
  float br = R * (Lmax * 0.6 + P.y * 12.5 + kl * Lmax * Lmax * 0.3);   // covers the flared top (|x| < 3w)
  vec3 oc = ros - bc; float bb = dot(oc, rds); float hh = bb * bb - dot(oc, oc) + br * br;
  if (hh < 0.0 || -bb + sqrt(hh) < 0.0) return;
  // closest approach ray <-> curved axis A(s) = R (c (rb + s) + l kl s^2), linearised iterations
  float sp = Lmax * 0.3;
  vec3 A, T; float tp = 0.0;
  for (int it = 0; it < 3; it++){
    A = R * (c * (rb + sp) + l * (kl * sp * sp));
    T = normalize(c + l * (2.0 * kl * sp));
    vec3 w0 = ros - A;
    float b = dot(rds, T), dd = dot(rds, w0), ee = dot(T, w0);
    float den = max(1.0 - b * b, 0.02);
    sp = clamp(sp + (ee - b * dd) / den / R, 0.0, Lmax);
  }
  A = R * (c * (rb + sp) + l * (kl * sp * sp));
  T = normalize(c + l * (2.0 * kl * sp));
  tp = dot(A - ros, rds);
  if (tp < 0.0 || tp > tMax) return;
  vec3 v = ros + rds * tp - A;
  vec3 kx = cross(rds, T); float sa = length(kx);
  float sN = sp / Hs;
  float w = P.y * R * (1.0 + 0.9 * sN);                       // flares with height
  // across-coordinate (unsigned fallback when looking along the axis)
  float x = mix(length(v), dot(v, kx / max(sa, 1e-4)), smoothstep(0.08, 0.3, sa)) / w;
  if (abs(x) > 3.0) return;
  // turbulent interior: puffs and wisps rising along the column
  float rise = t * 0.35 * uBoil;
  float n1 = n3(vec3(sN * 3.0 - rise, x * 0.9, ph * 3.0)) * 0.5 + 0.5;
  float n2 = n3(vec3(sN * 9.0 - rise * 2.6, x * 2.4 + n1 * 1.5, ph * 5.0 + 7.0)) * 0.5 + 0.5;
  float edge = x * x * (1.0 - 0.5 * (n2 - 0.5));
  float prof = exp(-edge * 1.3);
  float along = exp(-sN) * smoothstep(0.0, 0.08, sN) * smoothstep(1.0, 0.7, sp / Lmax);
  float dens = prof * along * smoothstep(0.15, 0.75, n1) * (0.35 + 0.65 * n2);
  float path = min(1.0 / max(sa, 1e-3), 3.0);
  float e = dens * path * min(uPlumes, 2.0) * 3.5;
  float Tp = 1700.0 + 950.0 * exp(-sN * 1.2) * (0.6 + 0.4 * n1);
  acc += giantEmission(Tp) * e;
  tau += e * 0.4;
  if (e > best){ best = e; dep = tp; }
}
vec4 gPlumes(vec3 ros, vec3 rds, mat3 spin, float tMax, float t, out float opac){
  vec3 acc = vec3(0.0); float tau = 0.0, dep = 0.0, best = 0.0;
  if (uGiantHeroOnly < 0.5)
    for (int k = 0; k < G_NPLUME; k++) gPlumeOne(ros, rds, G_PL_C[k], G_PL_L[k], G_PL_P[k], tMax, t, acc, tau, dep, best);
  for (int k = 0; k < 4; k++){
    if (dot(uHeroPlC[k], uHeroPlC[k]) < 0.5) continue;
    vec3 c = spin * normalize(uHeroPlC[k]);
    vec3 l = spin * uHeroPlL[k]; l = normalize(l - c * dot(l, c));
    gPlumeOne(ros, rds, c, l, uHeroPlP[k], tMax, t, acc, tau, dep, best);
  }
  opac = 1.0 - exp(-tau);
  return vec4(acc, best > 0.0 ? dep : 0.0);
}

// ---- dense photospheric haze, analytic (Chapman column): optically thick edge-on, so the limb fogs softly ----
// returns rgb emission and transmittance in front of the surface (tHit > 0) or along the whole ray
// column density (rho0 = 1, units of R) of an exponential shell of scale height H along the ray
float gChapman(vec3 o, vec3 rd, float tHit, float H){
  float ro = length(o);
  float hCam = max(0.0, (ro - giantRadius0(o / ro)) / uGiantR);
  if (tHit > 0.0){
    vec3 n = normalize(o + rd * tHit);
    // column above the hit point, minus the part above the camera (camera inside the layer)
    return H / (sat(dot(n, -rd)) + sqrt(2.0 * H / PI)) * (1.0 - exp(-hCam / H));
  }
  float tc = dot(-o, rd);
  vec3 pc = o + rd * max(tc, 0.0);
  float r = length(pc);
  float h = max(0.0, (r - giantRadius0(pc / r)) / uGiantR);
  if (tc > 0.0){
    // gaussian density profile around the tangent point; keep only the part ahead of the camera
    float x = tc / uGiantR / sqrt(2.0 * H);
    float ahead = 0.5 + 0.5 * tanh(1.2028 * x);
    return sqrt(2.0 * PI * H) * exp(-h / H) * ahead;
  }
  return H * exp(-h / H) / (sat(dot(pc / r, rd)) + sqrt(2.0 * H / PI));
}
vec4 giantHaze(vec3 o, vec3 rd, float tHit){
  float atmo = 1.0 + uGiantAtmo;
  if (uScar > 0.0){
    // the stripped hemisphere has lost its photospheric haze
    vec3 nr = normalize(tHit > 0.0 ? o + rd * tHit : o + rd * max(dot(-o, rd), 0.0));
    atmo *= 1.0 - 0.85 * uScar * smoothstep(-0.1, 0.45, dot(nr, uScarDir));
  }
  // dense photospheric haze: optically thick edge-on, cool source function -> soft crimson limb
  float tau0 = gChapman(o, rd, tHit, 0.028) * 5.0 * atmo;   // ~0.13 at disk centre, opaque edge-on, soft rim
  float tr = exp(-tau0);
  vec3 col = giantEmission(2080.0) * 0.55 * (1.0 - tr);
  // extended warm atmosphere: optically thin glow that rims the star
  float c1 = gChapman(o, rd, tHit, 0.07) * 0.30 * atmo;
  float c2 = gChapman(o, rd, tHit, 0.25) * 0.012 * atmo;
  col = col * exp(-(c1 + c2) * 0.5) + giantEmission(1720.0) * c1 + giantEmission(1520.0) * c2;
  tr *= exp(-(c1 + c2) * 0.5);
  return vec4(col, tr);
}

// ---- spicule fringe: a forest of fine jets standing on the limb, evaluated at the ray's tangent point -------
// o relative to centre (unspun), returns radiance. Cheap: 2 fetches, only near the limb.
vec3 giantFringe(vec3 o, vec3 rd, float tHit, float t){
  float tc = dot(-o, rd);
  if (tc <= 0.0) return vec3(0.0);
  vec3 pc = o + rd * tc;
  float r = length(pc); vec3 n = pc / r;
  float h = (r - giantRadius0(n)) / uGiantR;
  if (h > 0.03 || tHit > 0.0) return vec3(0.0);
  // only meaningful when the observer is far compared with the fringe height
  float far = smoothstep(0.08, 0.35, (length(o) - uGiantR) / uGiantR);
  if (far <= 0.0) return vec3(0.0);
  // position angle around the limb (depth component removed) -> jets stay radial on screen
  vec3 nl = normalize(n - rd * dot(n, rd));
  vec3 ns = rotY(uGiantSpin) * nl;
  float tt = t * uBoil;
  float fpx = tc * gPixAngle() / uGiantR;                   // footprint at the limb (R per pixel)
  float lod = gLod(110.0, fpx);
  if (lod <= 0.0) return vec3(0.0);
  vec3 q = ns * 110.0;
  float j1 = n3(q + vec3(0.0, 0.0, h * 55.0 - tt * 0.7));
  float j2 = n3(q * 1.9 + 11.0 + vec3(0.0, h * 90.0 - tt * 1.2, 0.0)) * gLod(210.0, fpx);
  float jet = pow(sat(0.5 + 0.9 * j1), 3.0) * (0.55 + 0.45 * sat(0.5 + 0.9 * j2)) * lod;
  float H = 0.004 + 0.005 * sat(0.5 + n3(ns * 45.0 + 3.0));
  float prof = exp(-max(h, 0.0) / H) * smoothstep(-0.001, 0.0008, h);
  return giantEmission(1950.0 + 650.0 * jet) * jet * prof * far * 1.4 * (1.0 + uGiantAtmo * 0.5);
}

// suggested number of volume samples for a ray (o relative to centre)
int giantVolumeSteps(vec3 o, vec3 rd, bool hit){
  float b = length(o - rd * max(dot(-o, rd), 0.0)) / uGiantR;   // closest approach in radii
  if (!hit && b > 1.5 * (1.0 + uBulge * 1.2)) return 0;         // misses the gas shell: loops/plumes only
  float n = hit ? mix(6.0, 22.0, smoothstep(0.5, 0.98, b)) : mix(24.0, 8.0, smoothstep(1.02, 1.5, b));
  return int(n);
}

// ---- extended atmosphere: base glow, molecular clumps, mass-loss plumes, aftermath streamers & soot ---------
// integrates from ta to tb along the ray (o relative to centre, unspun). Returns rgb emission, a = transmittance.
vec4 giantVolume(vec3 o, vec3 rd, float ta, float tb, float t, float jit, int N, bool withLoops){
  mat3 spin = rotY(uGiantSpin);
  float R = uGiantR;
  float tt = t * uBoil;
  float bo = uLocal * uBoil;
  float atmo = 1.0 + uGiantAtmo;
  float tc = clamp(dot(-o, rd), ta, tb);
  float L1 = tc - ta, L2 = tb - tc, LT = max(L1 + L2, 1e-6);
  float kf = L1 / LT;
  vec3 col = vec3(0.0); float trans = 1.0;
  vec4 lp = vec4(0.0), pp = vec4(0.0); float lop = 0.0, pop = 0.0;
  vec3 pe = o + rd * tb;
  float onDisk = step(length(pe), giantRadius0(normalize(pe)) * 1.02);
  float tOcc = onDisk > 0.5 ? tb : 1e9;                     // loops/plumes are hidden only by the photosphere
  if (uPlumes > 0.0){
    if (withLoops) lp = gLoops(spin * o, spin * rd, spin, tOcc, t, lop);
    pp = gPlumes(spin * o, spin * rd, spin, tOcc, t, pop);
  }
  bool loopDone = lp.a <= 0.0, plDone = pp.a <= 0.0;
  // seen against the photosphere, loops and plumes read mostly as absorbing filaments
  lp.rgb *= 1.0 - 0.65 * onDisk; pp.rgb *= 1.0 - 0.65 * onDisk;
  float fN = float(max(N, 1));
  for (int i = 0; i < 48; i++){
    if (i >= N) break;
    float u = (float(i) + jit) / fN;
    float ts, s;
    if (u < kf){ s = (kf - u) / max(kf, 1e-6); ts = tc - L1 * s * s; }
    else { s = (u - kf) / max(1.0 - kf, 1e-6); ts = tc + L2 * s * s; }
    float ds = 2.0 * LT * max(s, 0.5 / fN) / fN / R;          // step length in R units
    if (!loopDone && ts > lp.a){ col += trans * lp.rgb; trans *= 1.0 - lop; loopDone = true; }
    if (!plDone && ts > pp.a){ col += trans * pp.rgb; trans *= 1.0 - pop; plDone = true; }
    vec3 p = o + rd * ts;
    float r = length(p); vec3 n = p / r;
    float h = max(0.0, (r - giantRadius0(n)) / R);
    if (h > 0.5) continue;
    vec3 ns = spin * n;
    // base: dense photospheric haze + extended warm atmosphere
    // (smooth exponential layers are analytic: giantHaze) — the march carries the structured gas only
    vec3 em = vec3(0.0);
    float ab = 0.0;
    // molecular layers: patchy, absorbing veils (MOLsphere)
    float mm = exp(-h / 0.18) * smoothstep(0.012, 0.06, h);
    if (mm > 0.04){
      float m = gFbm2(ns * 4.0 + vec3(0.0, -h * 2.5, 0.0) + ns * (0.03 * bo) + 23.0) * 0.75;
      float mol = smoothstep(0.0, 0.6, m) * mm * 0.5 * atmo;
      em += giantEmission(1480.0 + 350.0 * exp(-h / 0.08)) * mol * 0.7;
      ab += mol * 1.6;
    }
    // aftermath: torn envelope streamers (shock-heated) and soot (ablated, absorbing)
    if (uScar > 0.0){
      float fd = dot(n, uScarDir);
      float sm = smoothstep(-0.2, 0.5, fd) * uScar;
      if (sm > 0.0){
        // streamers lift off and are swept back, away from the nova, as they rise
        vec3 nsw = spin * normalize(n - uScarDir * h * 1.8);
        vec4 s4 = n4(nsw * (8.0 / (1.0 + h * 2.0)) + 91.0);
        float str = 1.0 - abs(s4.r * 2.0 - 1.0);
        str *= 1.0 - abs(s4.b * 2.0 - 1.0) * 0.7;
        float patchy = smoothstep(0.55, 0.15, s4.g);             // worley channel of the same fetch
        float tear = pow(str, 6.0) * patchy * exp(-h / 0.17) * sm * 9.0 * smoothstep(0.0, 0.02, h);
        em += giantEmission(1900.0 + 900.0 * exp(-h / 0.05)) * tear;
        ab += tear * 0.4;
        float sootN = gFbm2(ns * 5.0 + vec3(0.0, -h * 6.0 + tt * 0.03, 0.0) + 7.0) * 0.5 + 0.5;
        float soot = smoothstep(0.38, 0.70, sootN) * exp(-h / 0.09) * smoothstep(0.0, 0.01, h) * sm * 3.0;
        em += giantEmission(1500.0) * soot * 0.05;
        ab += soot * 5.0;
      }
    }
    col += trans * em * ds;
    trans *= exp(-ab * ds);
    if (trans < 0.02) break;
  }
  if (!loopDone){ col += trans * lp.rgb; trans *= 1.0 - lop; }
  if (!plDone){ col += trans * pp.rgb; trans *= 1.0 - pop; }
  return vec4(col, trans);
}

// photosphere radiance at hit distance th (o relative to centre, unspun)
vec3 giantSurface(vec3 o, vec3 rd, float th, float t){
  mat3 spin = rotY(uGiantSpin);
  vec3 p = o + rd * th; vec3 n = normalize(p);
  float mu = sat(dot(n, -rd));
  vec3 ns = spin * n;
  float fp = th * gPixAngle() / uGiantR / pow(max(mu, 0.02), 0.6);   // partial allowance for radial foreshortening
  vec3 gH;
  bool wantGrad = uRelief > 0.0;
  float T = giantTemperatureLod(ns, mu, t, fp, wantGrad, gH);
  if (uScar > 0.0) T = gScarSurface(T, n, ns, t, fp);
  float shade = 1.0;
  if (wantGrad){
    // shading relief: slope of the granulation domes (reads as 3D boiling plasma). Facets are shaded relative
    // to the macroscopic surface, independent of the global limb darkening.
    vec3 g = transpose(spin) * gH;
    g -= n * dot(g, n);
    vec3 nb = normalize(n - g * uRelief * 6.0);
    float muL = sat(dot(nb, -rd));
    shade = (1.0 - 0.75 * (1.0 - sqrt(muL))) / (1.0 - 0.75 * (1.0 - sqrt(max(mu, 0.02))));
    shade = mix(1.0, shade, smoothstep(0.0, 0.004, uRelief));
  }
  float limb = (1.0 - uLimbDark * (1.0 - sqrt(mu))) * shade;
  return giantEmission(T) * limb;
}

// returns rgb radiance; a = coverage (1 on disk); dist = hit distance (1e9 if none)
vec4 giantShade(vec3 ro, vec3 rd, float t, out float dist){
  vec3 o = ro - uGiantPos;
  dist = 1e9;
  float rB = uGiantR * (1.0 + uBulge * 1.2);
  if (sphereHit(o, rd, vec3(0.0), rB * 2.1).y < 0.0) return vec4(0.0);   // plumes reach ~2R
  vec2 hs = sphereHit(o, rd, vec3(0.0), rB * 1.5);                        // structured gas shell
  float t0 = max(hs.x, 0.0);
  float th = giantTrace(o, rd);
  bool hit = th > 0.0;
  float tEnd = hit ? th : max(hs.y, t0);
  vec4 vol = giantVolume(o, rd, t0, tEnd, t, hash12(gl_FragCoord.xy + fract(uFrame * 0.618) * 113.0), giantVolumeSteps(o, rd, hit), true);
  vec4 hz = giantHaze(o, rd, th);
  vec3 col = vol.rgb + vol.a * hz.rgb;
  vol.a *= hz.a;
  if (hit){
    col += vol.a * giantSurface(o, rd, th, t);
    dist = th;
    return vec4(col * uGiantGlow, 1.0);
  }
  return vec4(col * uGiantGlow, 1.0 - vol.a);
}
`;
