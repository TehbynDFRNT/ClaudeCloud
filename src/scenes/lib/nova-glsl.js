// NOVA: shared GLSL for the eruption, the shock front and the fractured shell.
// All functions output linear HDR radiance; nothing is tonemapped here.
//
// Temperature palette: h in [0,1] is a display heat index
//   0 abyssal crimson -> .17 crimson -> .33 ember -> .5 molten gold -> .67 white-gold -> .83 white -> 1 blue-white
// Radiance grows ~exponentially with heat: novaLum(.5) ~ 4, (.75) ~ 26, (1) ~ 160.

export const NOVA_COMMON = `
const vec3 NK0 = vec3(0.30, 0.012, 0.006);
const vec3 NK1 = vec3(0.80, 0.050, 0.014);
const vec3 NK2 = vec3(1.00, 0.200, 0.035);
const vec3 NK3 = vec3(1.00, 0.480, 0.120);
const vec3 NK4 = vec3(1.00, 0.640, 0.220);
const vec3 NK5 = vec3(1.00, 0.930, 0.800);
const vec3 NK6 = vec3(0.86, 0.930, 1.000);
vec3 novaRamp(float h){
  float x = clamp(h, 0.0, 1.0) * 6.0;
  if (x < 1.0) return mix(NK0, NK1, x);
  if (x < 2.0) return mix(NK1, NK2, x - 1.0);
  if (x < 3.0) return mix(NK2, NK3, x - 2.0);
  if (x < 4.0) return mix(NK3, NK4, x - 3.0);
  if (x < 5.0) return mix(NK4, NK5, x - 4.0);
  return mix(NK5, NK6, x - 5.0);
}
float novaLum(float h){ return 0.12 * exp(7.2 * h); }
vec3 novaEmit(float h){ return novaRamp(h) * novaLum(h); }
// erf approximation (abs error < 5e-4), used for exact integration of thin radial profiles per step
float erfa(float x){ float x2 = x * x; return sign(x) * sqrt(1.0 - exp(-x2 * (1.27324 + 0.147 * x2) / (1.0 + 0.147 * x2))); }
// integral over a ray step of a gaussian radial profile exp(-((x-c)/s)^2), x varying linearly x0 -> x1 over length dt
float gaussStep(float x0, float x1, float c, float s, float dt){
  float dx = x1 - x0;
  if (abs(dx) < 2e-3 * s) { float m = (0.5 * (x0 + x1) - c) / s; return exp(-m * m) * dt; }
  return 0.886227 * s * (erfa((x1 - c) / s) - erfa((x0 - c) / s)) * dt / dx;
}
// same for a one-sided exponential tail exp((x-c)/L) for x<c (0 beyond c)
float tailStep(float x0, float x1, float c, float L, float dt){
  float dx = x1 - x0;
  if (abs(dx) < 2e-3 * L) { float m = 0.5 * (x0 + x1); return (m < c ? exp((m - c) / L) : 0.0) * dt; }
  float G1 = L * exp((min(x1, c) - c) / L), G0 = L * exp((min(x0, c) - c) / L);
  return (G1 - G0) * dt / dx;
}
`;

// ---------------------------------------------------------------------------------------------
// Young eruption: an optically thick, turbulent, white-hot ball (S22) that becomes a swept-up
// shell with a thinner glowing interior as it grows (S23).
// Optional hooks (define before this chunk): FB_MASK(p) density multiplier.
export const NOVA_FIREBALL = `
#ifndef FB_MASK
#define FB_MASK(p) 1.0
#endif
uniform vec3 uFbC;       // explosion centre (world)
uniform float uFbR;      // nominal front radius
uniform float uFbTurb;   // boundary relief (fraction of R)
uniform float uFbEvo;    // boiling clock
uniform float uFbHeat;   // global heat scale (1 = white-hot)
uniform float uFbDens;   // opacity per unit R
uniform float uFbShell;  // 0 = filled ball, 1 = swept-up shell with a low-density interior
uniform float uFbSeed;
uniform float uFbBlue;   // faint cold-blue shock precursor at the leading edge
uniform float uFbPh;     // receding pseudo-photosphere radius (fraction of R) inside translucent ejecta; 0 = none

// front radius factor in direction n (unit); hot = upwelling (billow tops). Rounded billows on three scales.
float fbShape(vec3 n, out float hot){
  vec4 a = n4(n * 1.7 + vec3(uFbSeed, uFbEvo * 0.09, 7.7));
  vec3 w = (vec3(a.r, a.b, a.a) - 0.5) * 1.8;
  vec4 b = n4(n * 4.4 + w + vec3(uFbEvo * 0.13, 1.3 + uFbSeed, -uFbEvo * 0.11));
  vec4 c = n4(n.zxy * 10.3 + w * 2.0 + (b.rbr - 0.5) * 1.5 + vec3(0.0, -uFbEvo * 0.2, 5.0));
  float big = smoothstep(0.95, 0.0, a.g * 1.1);
  float mid = smoothstep(0.95, 0.0, b.g * 1.1);
  float sml = smoothstep(0.95, 0.0, c.g * 1.1);
  float plume = smoothstep(0.56, 0.8, a.b) * (0.5 + big);
  hot = 0.4 * big + 0.35 * mid + 0.25 * sml;
  return 1.0 + uFbTurb * (0.45 * big + 0.28 * mid + 0.14 * sml + 0.9 * plume - 0.45);
}

// emission-absorption march over [tMin, tMax]; returns (radiance, transmittance).
// The front is crisp (photon mean free path << R): steps converge geometrically onto it, the temperature
// climbs over a mean free path below it (each billow limb-darkened), and global limb darkening of the ball
// (Eddington-like) gives the white core and gold rim. Ahead of it: ragged, cooler smoky veils.
vec4 fireballMarch(vec3 ro, vec3 rd, float tMin, float tMax, float jit){
  float R = uFbR;
  vec2 hs = sphereHit(ro, rd, uFbC, R * (1.0 + uFbTurb * 1.45) + 0.08 * R);
  float t0 = max(max(hs.x, 0.0), tMin), t1 = min(hs.y, tMax);
  vec3 col = vec3(0.0); float T = 1.0;
  if (t1 <= t0) return vec4(col, T);
  float t = t0 + jit * 0.01 * R;
  int iters = uFbShell > 0.5 ? 28 : 48;
  for (int i = 0; i < 48; i++){
    if (t > t1 || i >= iters) break;
    vec3 p = ro + rd * t;
    vec3 v = p - uFbC; float r = length(v); vec3 n = v / max(r, 1e-6);
    float hot; float s = fbShape(n, hot);
    float e = s - r / R;
    if (e < -0.16){ t += max(0.012, (-e - 0.13) * 0.8) * R; continue; }
    float eph0 = s * uFbPh - r / R;
    vec3 q = v / R;
    float w1 = n3(q * 6.5 + vec3(0.0, uFbEvo * 0.35, uFbSeed));
    float w2 = 0.0, w3 = 0.0;
    if (e > -0.05 && e < mix(0.08, 0.16, uFbShell)){  // fine turbulence only near the front
      w2 = n3(q * 17.0 + vec3(uFbEvo * 0.5, 0.0, 0.0));
      if (abs(e) < 0.04) w3 = n3(q * 43.0 + vec3(0.0, 0.0, uFbEvo * 0.8)) * (1.0 - 0.75 * uFbShell);   // finest octave would fizz at low res
    }
    float ee = e + 0.045 * uFbTurb * (w1 + 0.5 * w2) + 0.006 * w3;
    float body = smoothstep(-0.004, 0.004, ee);
    float veil = smoothstep(0.5, 0.85, w1 * 0.5 + 0.5 + 0.35 * w2 + 0.15 * w3);
    float cor = exp(min(ee, 0.0) / 0.05) * (1.0 - body) * veil;
    float mu = abs(dot(n, rd));
    float vein = 1.0 - abs(w2 + 0.5 * w3);
    // optically thin shell: clumpy density (billow tops and hot veins) so texture survives translucency
    float clumpd = 0.2 + 1.6 * hot * hot + 0.9 * pow(vein, 4.0) + 0.3 * w1;
    float dl = (0.1 + 0.9 * exp(-max(ee, 0.0) / 0.06)) * clumpd;
    float rhoB = body * mix(12.0, dl, uFbShell);
    float rhoC = mix(0.55, 0.12, uFbShell) * cor;
    // opaque white-hot pseudo-photosphere receding through the ejecta
    float ph = uFbPh > 0.0 ? smoothstep(-0.018, 0.018, s * uFbPh - r / R + 0.012 * w1 + 0.004 * w2) : 0.0;   // soft enough for a low-res pass
    float msk = FB_MASK(p);
    // translucent ejecta (uFbShell -> 1) glow rather than smoke: emission keeps its density, absorption drops,
    // and the outer veils barely absorb at all (no sooty edges in front of the bright interior)
    float rhoE = (rhoB + rhoC + ph * 12.0) * msk;
    float rhoA = (rhoB * mix(1.0, 0.3, uFbShell) + rhoC * mix(1.0, 0.04, uFbShell) + ph * 12.0) * msk;
    // opaque ball: white upwelling tops, inter-billow lanes sinking to deep gold / ember
    float hb = 0.27 + 0.3 * smoothstep(0.0, 0.03, ee) + 0.44 * (hot - 0.45) + 0.15 * pow(mu, 1.5) + 0.13 * pow(vein, 3.0);
    // swept-up shell: heat follows density and depth -> gold where dense and deep, crimson-ember skirts where thin
    float hs = 0.18 + 0.4 * smoothstep(0.6, 2.0, dl) + 0.06 * smoothstep(0.03, 0.3, ee) + 0.05 * (hot - 0.45) + 0.05 * pow(vein, 3.0);
    hb = mix(hb, hs, uFbShell);
    float h = uFbHeat * mix(hb, mix(0.22 + 0.1 * veil, 0.16 + 0.08 * veil, uFbShell), (1.0 - body));
    h = mix(h, uFbHeat * (0.47 + 0.2 * pow(mu, 1.2) + 0.22 * (hot - 0.45) + 0.1 * pow(vein, 3.0)), ph);
    // translucent ejecta have no hard front to converge on: coarser minimum step (the photosphere is still found)
    float dmin = mix(0.004, 0.018, uFbShell);
    float dt = R * clamp(min(max(0.35 * abs(ee - 0.003), dmin), uFbPh > 0.0 ? max(0.35 * abs(eph0), 0.004) : 1.0), 0.004, mix(0.05, 0.09, uFbShell)) * (0.7 + 0.6 * fract(jit + float(i) * 0.618034));
    float dtc = min(dt, t1 - t);                                  // last step clamped to the segment (no double counting at splits)
    float aE = 1.0 - exp(-rhoE * uFbDens * dtc / R);
    float aA = 1.0 - exp(-rhoA * uFbDens * dtc / R);
    vec3 em = novaEmit(h);
    em += C_ICE * uFbBlue * 3.0 * cor * exp(min(ee + 0.06, 0.0) / 0.03) * step(ee, -0.03);
    col += T * aE * em;
    T *= 1.0 - aA;
    if (T < 0.02) break;
    t += dt;
  }
  return vec4(col, T);
}
`;

// ---------------------------------------------------------------------------------------------
// Fractured shell (GK Per / T Pyx): optically thin and limb-brightened. Knot heads at the outer edge with short
// fingers (tails) pointing back toward the centre, gathered by a large-scale field into arcs and dense complexes
// with empty patches between them; torn filaments between the knots; a faint crimson diffuse layer; a thin,
// faint cold-blue forward-shock skin.
// Everything is integrated analytically per crossing of thin spherical layers (no ray march, no jitter):
// the angular fields are sampled where the ray crosses each layer, and the radial profile is integrated in closed
// form. A finger is a stack of thin layers below its head, so it projects as a streak toward the centre and stays
// noise-free in motion.
export const NOVA_SHELL = `
uniform vec3 uShC;       // shell centre
uniform float uShR;      // outer radius
uniform vec3 uShAxis;    // symmetry axis (orbital pole)
uniform float uProlate;  // elongation along the axis
uniform float uDeform;   // low-order lumpy asymmetry of the outline (0 = sphere)
uniform float uFrac;     // 0 continuous sheet -> 1 fully fractured into knots and fingers
uniform float uShGain;   // overall brightness
uniform float uSkin;     // cold-blue forward shock skin strength
uniform float uKnotK;    // knot frequency, ~10-16
uniform float uShSeed;
uniform float uShEvo;    // slow morphing clock
uniform float uEquator;  // equatorial enhancement (orbital plane)
uniform float uSheetW;   // continuous sheet weight
uniform float uSheetWid; // sheet radial width (fraction of R): thinner = stronger limb brightening
uniform float uKnotGain; // knot heads brightness
uniform float uTailGain; // finger brightness
uniform float uTailL;    // mean finger length (fraction of R)
uniform float uClump;    // 0..1 large-scale clumping (arcs, complexes, voids)
uniform float uWisp;     // torn inter-knot filaments
uniform float uDiffuse;  // faint diffuse layer
uniform float uFaceDim;  // 0..1 suppress the projected interior relative to the limb (calm ring)
uniform float uKnotKc;   // knot cells per cube-face edge (~25: one knot per ~0.06 rad)
uniform float uKnotDens; // probability that a cell holds a knot
// palette (linear radiance per unit column), precomputed on the CPU from the same ramp
uniform vec3 uCHead0, uCHead1, uCHot, uCTail0, uCTail1, uCSheet, uCGap, uCWisp, uCSkin;

float shScale(vec3 n){
  float c = dot(n, uShAxis);
  float d = dot(n, vec3(0.62, 0.21, -0.76)), e = dot(n, vec3(-0.33, 0.55, 0.77));
  return 1.0 + uProlate * (c * c - 0.3) + uDeform * (0.6 * d * d - 0.2 + 0.5 * d * e + 0.25 * e * e * e);
}
// line integral of a thin gaussian spherical layer (radius rh, width w) for ONE crossing; p = impact parameter.
// Exact far from tangency, matches the tangent-ray integral at p = rh, decays outside.
float shellCross(float p, float rh, float w){
  float d = max(rh * rh - p * p, 0.0);
  return 1.7725 * w * rh / sqrt(d + 1.92 * rh * w) * exp(-pow(max(p - rh, 0.0) / w, 2.0));
}
// unit direction where the ray crosses radius r (front s = -1, back s = +1); tangent point if it misses
vec3 shDir(vec3 oc, vec3 rd, float b, float p, float r, float s){
  float disc = r * r - p * p;
  float ts = -b + s * sqrt(max(disc, 0.0));
  return normalize(oc + rd * ts);
}
// large-scale structure at direction n: x = clump gate (0 empty .. 1 dense complex), y = flank brightness,
// z = equatorial weight, w = patch field (0..1)
vec4 shLarge(vec3 n){
  vec4 a = n4(n * 1.25 + vec3(uShSeed * 0.37, 5.1, 2.3 + uShEvo * 0.01));
  // arcs: borders of a few huge cells, bent and broken -> chains of knots; plus a few dense complexes;
  // large empty patches between them (perlin channels span ~0.32..0.68, F2-F1 median ~0.2)
  float arc = (1.0 - smoothstep(0.0, 0.05 + 0.1 * a.b, a.a)) * smoothstep(0.44, 0.58, a.b + 0.3 * (a.r - 0.5));
  float blob = smoothstep(0.54, 0.68, a.r + 0.3 * (a.b - 0.5));
  float open = smoothstep(0.43, 0.55, a.r + 0.25 * (a.g - 0.48));
  float g = max(0.85 * arc, blob) * open;
  float gate = mix(1.0, 0.02 + 0.98 * g, uClump);
  float lop = 0.5 + 1.0 * smoothstep(-0.7, 0.9, dot(n, normalize(vec3(-0.5, 0.35, 0.6))) + (a.r - 0.5) * 0.9);
  float c = dot(n, uShAxis);
  float eq = 1.0 + uEquator * exp(-c * c / 0.05);
  return vec4(gate, lop, eq, a.b);
}
// ---- analytic knots: one per cell of an equi-angular cube map, jittered inside the cell interior so its whole
// footprint stays in that cell. Each knot is a 3D gaussian head with a tapered finger pointing at the centre.
vec3 knotCell(vec3 n){
  vec3 an = abs(n); vec2 uv; float face;
  if (an.x >= an.y && an.x >= an.z){ face = n.x > 0.0 ? 0.0 : 1.0; uv = n.yz / an.x; }
  else if (an.y >= an.z){ face = n.y > 0.0 ? 2.0 : 3.0; uv = n.zx / an.y; }
  else { face = n.z > 0.0 ? 4.0 : 5.0; uv = n.xy / an.z; }
  vec2 ab = atan(uv) * (4.0 / PI);
  return vec3(face, min(floor((ab * 0.5 + 0.5) * uKnotKc), uKnotKc - 1.0));
}
vec3 cubeDir(vec2 ab, float face){
  vec2 uv = tan(ab * (PI / 4.0));
  vec3 d = face < 0.5 ? vec3(1.0, uv) : face < 1.5 ? vec3(-1.0, uv) : face < 2.5 ? vec3(uv.y, 1.0, uv.x)
         : face < 3.5 ? vec3(uv.y, -1.0, uv.x) : face < 4.5 ? vec3(uv, 1.0) : vec3(uv, -1.0);
  return normalize(d);
}
// radiance of the knot in cell cid seen along the ray (oc = ray origin - centre); pa = pixel angle
vec3 knotEval(vec3 oc, vec3 rd, vec3 cid, float tMax, float pa){
  vec3 h1 = hash33(cid * vec3(7.31, 1.17, 1.93) + uShSeed * 11.7 + 0.37);
  if (h1.z > uKnotDens) return vec3(0.0);
  vec3 nk = cubeDir((cid.yz + 0.2 + 0.6 * h1.xy) / uKnotKc * 2.0 - 1.0, cid.x);
  vec4 Lg = shLarge(nk);
  // knots live in the complexes and arcs: the large-scale field sets presence, not only brightness
  if (h1.z > uKnotDens * mix(1.0, Lg.x, uClump)) return vec3(0.0);
  float g = sqrt(Lg.x) * Lg.y * Lg.z;
  vec3 h2 = hash33(cid.zxy * vec3(3.7, 5.3, 2.9) + uShSeed * 3.1 + 17.0);
  float q = h2.x;
  float fr = smoothstep(0.0, 1.0, uFrac);
  float scK = shScale(nk) * uShR;
  vec3 Ph = nk * (0.972 + 0.026 * (h2.y - 0.5) * 2.0) * scK;
  float s = (0.0011 + 0.0015 * h2.y + 0.0006 * q * q) * scK;
  float B = 0.1 + 0.6 * q * q * q * q + 0.9 * pow(q, 60.0);    // power law: a few blazing knots
  vec3 col = vec3(0.0);
  // head (column normalised to peak 1 when resolved; flux-conserving blur to the pixel footprint)
  float th = dot(Ph - oc, rd);
  if (th > 0.0 && th < tMax){
    vec3 dv = oc + rd * th - Ph; float dr = dot(dv, nk);
    float d2 = dot(dv, dv) - dr * dr * 0.6;                   // heads drawn out along the finger axis
    float px = 0.6 * th * pa; float se2 = s * s + px * px;
    vec3 hc = mix(uCHead0, uCHead1, smoothstep(0.55, 0.97, q));
    hc = mix(hc, uCHot, smoothstep(0.975, 0.998, q));
    col += hc * (s * s / se2) * exp(-d2 / se2) * B * fr * fr * uKnotGain;
  }
  // finger: tapered tube from the head toward the centre
  float L = uTailL * (0.3 + 1.5 * h2.z * h2.z * h2.z) * fr * scK;
  if (L > 1e-4 * scK && uTailGain > 0.0){
    vec3 ax = -nk, w0 = oc - Ph;
    float b2 = dot(rd, ax), dd = dot(rd, w0), ee = dot(ax, w0);
    float den = max(1.0 - b2 * b2, 1e-6), sinA = sqrt(den);
    float u = clamp((ee - b2 * dd) / den, 0.0, L);
    float x = mix(0.25, u / L, smoothstep(0.04, 0.2, sinA));  // end-on: the whole finger lies behind the head
    vec3 Q = Ph + ax * (x * L);
    float tq = dot(Q - oc, rd);
    if (tq > 0.0 && tq < tMax){
      vec3 dv = oc + rd * tq - Q; float d2 = dot(dv, dv);
      float sw = s * (0.85 - 0.5 * x);
      float px = 0.6 * tq * pa; float se2 = sw * sw + px * px;
      float eps = exp(-x / 0.45) * smoothstep(0.0, 0.1, x);
      float path = min(1.0 / sinA, 0.45 * L / (1.7725 * sw));
      col += mix(uCTail1, uCTail0, sat(x * 1.3)) * eps * path * (sw / sqrt(se2)) * exp(-d2 / se2) * sqrt(B) * uTailGain * fr;
    }
  }
  return col * g;
}
// visit the cells the ray's direction sweeps through the knot layer (radii rLo..rHi) on one side
vec3 knotsSide(vec3 oc, vec3 rd, float b, float p, float s, float sc, float tMax, float pa){
  // knot layer: heads 0.946..0.998, fingers down to ~0.946 - 1.8 uTailL (margin for the prolate radius)
  float rHi = 1.012 * sc, rLo = (0.935 - 1.8 * uTailL) * sc;
  if (p >= rHi) return vec3(0.0);
  vec3 nt = p > 1e-5 * sc ? (oc - rd * b) / p : normalize(cross(rd, vec3(0.31, 0.83, 0.46)));
  float phA = atan(sqrt(rHi * rHi - p * p), p);
  float phB = p < rLo ? atan(sqrt(rLo * rLo - p * p), p) : 0.0;
  int M = int(clamp(ceil((phA - phB) * uKnotKc / 0.55), 1.0, 10.0));
  vec3 col = vec3(0.0), prev = vec3(-1.0);
  for (int i = 0; i < 10; i++){
    if (i >= M) break;
    float ph = s * mix(phB, phA, (float(i) + 0.5) / float(M));
    vec3 cid = knotCell(nt * cos(ph) + rd * sin(ph));
    if (cid == prev) continue;
    prev = cid;
    col += knotEval(oc, rd, cid, tMax, pa);
  }
  return col;
}
vec3 shWarp(vec3 n){
  vec4 w = n4(n * 1.7 + vec3(2.3, uShSeed * 0.37, 5.1));
  vec3 u = cross(n, vec3(0.267, 0.802, 0.535));
  return (w.r - 0.5) * u + (w.b - 0.5) * cross(n, u);
}
// torn filament network (warped, two scales, borders of varying width, ~40% of borders missing)
// x = filament strength, y = sheet thickness texture (0 thin .. 1 thick)
vec2 shFil(vec3 n){
  vec3 nw = normalize(n + shWarp(n) * 1.6);
  vec4 Q1 = n4(nw * (uKnotK * 0.45) + vec3(-4.1, 7.9, uShSeed + uShEvo * 0.03));
  vec4 Q2 = n4(nw.zxy * (uKnotK * 1.2) + vec3(3.3, -uShSeed, 1.9));
  float bw = 0.015 + 0.09 * Q2.r * Q2.r;                       // width varies along each edge
  float e1 = (1.0 - smoothstep(0.0, bw, Q1.a + 0.05 * (Q2.b - 0.5))) * smoothstep(0.44, 0.6, Q2.b + 0.35 * (Q1.r - 0.5));
  float e2 = (1.0 - smoothstep(0.0, 0.03 + 0.05 * Q1.b, Q2.a)) * smoothstep(0.52, 0.7, Q1.b + 0.25 * (Q2.r - 0.5));
  float fil = max(e1, 0.6 * e2);
  float thick = sat(0.5 + (Q1.r - 0.5) * 1.6 + (Q2.r - 0.5) * 0.8);
  return vec2(fil, thick);
}

// one side (front s = -1 or back s = +1) of the shell: analytic knots + thin layers (sheet / filaments,
// diffuse, skin) integrated at their crossings
vec3 shellSide(vec3 oc, vec3 rd, float b, float p, float s, float tMax, float pa){
  float fr = smoothstep(0.0, 1.0, uFrac);
  // layer crossing (two iterations for the direction-dependent radius)
  float sc = uShR;
  vec3 n0 = normalize(oc + rd * (-b));
  for (int it = 0; it < 2; it++){
    sc = shScale(n0) * uShR;
    n0 = shDir(oc, rd, b, p, 0.965 * sc, s);
  }
  vec3 col = vec3(0.0);
  if (uKnotGain > 0.0 && fr > 0.01) col += knotsSide(oc, rd, b, p, s, sc, tMax, pa);
  float th = dot(n0 * 0.965 * sc - oc, rd);
  if (th > tMax || th < 0.0) return col;
  float rh = 0.965 * sc;
  // outside the limb the crossing freezes at the tangent point: fade angular detail to its mean (no spikes)
  float lb = smoothstep(0.0, 0.03, (p - rh) / sc);
  vec4 Lg = shLarge(n0);
  float gate = Lg.x, wgt = Lg.y * Lg.z;
  vec3 c = vec3(0.0);
  vec2 F = (uSheetW > 0.0 || uWisp > 0.0) ? shFil(n0) : vec2(0.0, 0.5);
  float fil = mix(F.x, 0.25, lb), thick = mix(F.y, 0.5, lb);
  // continuous sheet: gold where thick, crimson where thin; holes open and it contracts onto filaments
  float hole = smoothstep(fr * 0.95 - 0.12, fr * 0.95 + 0.1, thick * 0.75 + 0.25 * fil);
  float sheetD = mix(1.0, 0.15 + 1.4 * fil, fr) * hole * (0.35 + 0.65 * thick);
  float sheet = shellCross(p, (0.962 + 0.02 * (thick - 0.5)) * sc, uSheetWid * sc) * sheetD;
  c += mix(uCGap * 1.6, uCSheet, smoothstep(0.38, 0.85, thick) * (1.0 - 0.5 * fr) + 0.5 * fr * fil) * sheet * uSheetW * mix(1.0, gate, fr);
  // torn filaments between the knots (fractured state)
  float wisp = shellCross(p, (0.958 + 0.03 * (thick - 0.5)) * sc, 0.016 * sc) * fil * fr;
  c += uCWisp * wisp * uWisp * gate * gate;
  // faint diffuse layer (deep crimson), thicker; gives depth without filling the gaps
  // clumpy diffuse nebulosity (deep crimson) gathered in the knot complexes; gives depth without filling the gaps
  c += uCGap * shellCross(p, 0.93 * sc, 0.05 * sc) * uDiffuse * (0.12 + 0.88 * gate * sqrt(gate)) * (0.3 + 1.4 * smoothstep(0.42, 0.8, thick));
  // thin cold-blue forward shock, just outside the knots: steady with gentle patches
  float skin = shellCross(p, (1.012 + 0.006 * (Lg.w - 0.5)) * sc, 0.006 * sc) * (0.5 + 0.5 * smoothstep(0.35, 0.65, Lg.w));
  c += uCSkin * skin * uSkin;
  return col + c * wgt / sc;
}

vec3 shellMarch(vec3 ro, vec3 rd, float jit, float tMax){
  float smax = 1.0 + max(uProlate * 0.7, 0.0) + abs(uDeform) * 0.8;
  float rOut = uShR * smax * 1.1;
  vec2 ho = sphereHit(ro, rd, uShC, rOut);
  if (ho.y <= 0.0 || ho.x > ho.y) return vec3(0.0);
  vec3 oc = ro - uShC;
  float b = dot(oc, rd), c0 = dot(oc, oc);
  float p = sqrt(max(c0 - b * b, 0.0));     // impact parameter
  float pa = 2.0 * uTanHalfFov / uRes.y;
  vec3 col = shellSide(oc, rd, b, p, -1.0, tMax, pa) + shellSide(oc, rd, b, p, 1.0, tMax, pa);
  // final ring: dim the projected interior toward the centre, keep the limb
  float face = 1.0 - uFaceDim * (1.0 - smoothstep(0.7, 0.97, p / uShR));
  return col * uShGain * face;
}
`;

// ---------------------------------------------------------------------------------------------
// Distant giant (needs the GIANT chunk first): same palette and tidal silhouette as giantShade, without the dark
// downflow lanes, so a giant of < 60 px radius reads as a smouldering ember: gentle broad cells, limb darkening to
// crimson, and the hemisphere toward uScarDir still glowing from the nova (uScar).
export const NOVA_GIANTFAR = `
vec4 giantFar(vec3 ro, vec3 rd, float t, out float dist){
  vec3 o = ro - uGiantPos;
  dist = 1e9;
  float Rb = uGiantR * (1.0 + uBulge * 1.2);
  vec2 hs = sphereHit(o, rd, vec3(0.0), Rb * 1.15);
  if (hs.y < 0.0 || hs.x > hs.y) return vec4(0.0);
  vec2 core = sphereHit(o, rd, vec3(0.0), Rb);
  bool hit = false; float th = 0.0;
  if (core.y > 0.0 && core.x < core.y){
    th = max(core.x, 0.0);
    for (int i = 0; i < 24; i++){
      vec3 p = o + rd * th; float r = length(p);
      float d = r - giantRadius0(p / r);
      if (d < 0.001 * uGiantR){ hit = true; break; }
      th += d * 0.7;
      if (th > core.y) break;
    }
  }
  if (!hit){
    // thin warm atmosphere just above the limb
    vec3 pc = o + rd * max(-dot(o, rd), 0.0); float rc = length(pc);
    float hh = max(rc - giantRadius0(pc / rc), 0.0) / uGiantR;
    float g = exp(-hh / 0.035);
    return vec4(giantEmission(1750.0) * 0.18 * g * uGiantGlow, 0.25 * g);
  }
  vec3 p = o + rd * th; vec3 n = normalize(p);
  float mu = sat(dot(gNormal0(p), -rd));
  vec3 ns = rotY(uGiantSpin) * n;
  vec4 c4 = n4(ns * 1.5 + vec3(0.0, t * 0.01, 3.0));
  // broad convection cells with soft (never black) lanes
  vec2 cb = cells3(ns * 2.2 + (c4.rgb - 0.5) * 1.2 + vec3(0.0, 0.0, t * 0.004));
  // same temperature logic as the shared giant: crimson lanes ~1850 K, ember-gold upflow centres ~2500 K
  float T = 1930.0 + 540.0 * smoothstep(0.95, 0.05, cb.x) * (0.6 + 0.4 * smoothstep(0.0, 0.3, cb.y)) + 120.0 * (c4.b - 0.5) * 2.0;
  // granulation only where it is resolved (footprint-filtered), so a 20 px giant never aliases
  float fp = th * 2.0 * uTanHalfFov / uRes.y / uGiantR;
  float lod = 1.0 - smoothstep(0.004, 0.012, fp);
  if (lod > 0.0){ vec2 cg = cells3(ns * 7.0 + c4.rgb * 0.8); T += lod * (130.0 * smoothstep(0.9, 0.1, cg.x) - 65.0 + 60.0 * (c4.g - 0.5)); }
  T *= mix(1.0 - 0.5 * uLimbDark, 1.0, pow(mu, 0.42));
  float f = dot(n, uScarDir) + (c4.b - 0.5) * 0.5;
  T += uScar * 380.0 * smoothstep(0.1, 0.9, f) * (0.75 + 0.25 * c4.r);
  dist = th;
  vec4 hz = giantHaze(o, rd, th);                            // the shared analytic limb haze (soft crimson limb)
  return vec4((giantEmission(T) * hz.a + hz.rgb) * uGiantGlow, 1.0);
}
`;

// ---------------------------------------------------------------------------------------------
// Inside the wave (needs NOVA_FIREBALL for fbShape and its uniforms): explosion centre at the origin.
// A crisp turbulent front (dense, white-gold swept-up layer, cold-blue precursor ahead of it), hot
// glowing gas behind it, and radial debris filaments advected outward (they streak past the camera).
export const NOVA_WAVE = `
uniform float uWvR;       // front radius
uniform float uWvDens;    // opacity scale
uniform float uWvHeat;    // heat scale
uniform float uWvDebris;  // debris filament strength
uniform float uWvAdv;     // radial advection clock of the debris (front-relative)

vec4 waveMarch(vec3 ro, vec3 rd, float jit){
  float R = uWvR;
  vec3 col = vec3(0.0); float T = 1.0;
  float t = 0.008 * R * (0.5 + jit);
  for (int i = 0; i < 56; i++){
    vec3 p = ro + rd * t;
    float r = length(p); vec3 n = p / max(r, 1e-6);
    float x = r / R;
    if (x > 1.6 && dot(p, rd) > 0.0) break;            // left the wave region, heading outward
    float hot; float s = fbShape(n, hot);
    float e = s - x;
    if (e < -0.2){ t += max(0.01, (-e - 0.17) * 0.8) * R; continue; }
    vec3 q = p / R;
    float w1 = n3(q * 6.5 + vec3(0.0, uFbEvo * 0.35, uFbSeed));
    float w2 = n3(q * 17.0 + vec3(uFbEvo * 0.5, 0.0, 0.0));
    float w3 = abs(e) < 0.06 ? n3(q * 43.0 + vec3(0.0, 0.0, uFbEvo * 0.8)) : 0.0;
    // finest octave right at the front (the camera meets it at close range)
    float w4 = abs(e) < 0.025 ? n3(q * 113.0 + vec3(uFbEvo * 1.1, 0.0, 0.0)) : 0.0;
    float ee = e + 0.04 * (w1 + 0.5 * w2) + 0.008 * w3 + 0.003 * w4;
    float body = smoothstep(-0.004, 0.004, ee);
    float layer = exp(-max(ee, 0.0) / 0.022);
    float vein = 1.0 - abs(w2 + 0.5 * w3 + 0.25 * w4);
    layer *= 0.3 + 1.4 * smoothstep(0.25, 0.85, 0.5 + 0.5 * w1 + 0.35 * (hot - 0.45) + 0.25 * w2);
    float clump = max(0.0, 0.05 + 1.1 * hot * hot + 0.3 * vein * vein + 0.6 * w1 + 0.05 * w3);
    float gas = (0.012 + 0.3 * pow(smoothstep(0.55, 1.3, clump), 2.0)) * smoothstep(0.42, 0.85, x);
    float rho = body * (5.0 * layer + gas);
    // debris filaments: bright radial threads (direction-space cells), segmented and advected outward; they are
    // what streaks past the camera once we are inside
    float deb = 0.0;
    if (uWvDebris > 0.0 && x > 0.6 && x < 1.08){
      vec4 c = n4(n * 46.0 + vec3(3.0, 1.0, uFbSeed));
      float seg = n3(vec3(n * 7.0) + vec3(0.0, 0.0, x * 4.0 - uWvAdv));
      deb = smoothstep(0.17, 0.0, c.g * 1.1) * smoothstep(0.5, 0.66, c.r) * smoothstep(-0.05, 0.35, seg) * smoothstep(0.6, 0.75, x) * smoothstep(1.08, 1.0, x);
      deb *= smoothstep(0.06, 0.3, 1.0 - abs(dot(n, rd)));   // end-on filaments near the vanishing point read as noise
    }
    float mu = abs(dot(n, rd));
    // front: white billow tops, ember lanes (strong contrast so the wall reads as turbulent matter, not a glow)
    float hFront = 0.22 + 0.3 * smoothstep(0.0, 0.03, ee) - 0.3 * smoothstep(0.04, 0.13, ee) + 0.55 * (hot - 0.45) + 0.12 * pow(mu, 1.5) + 0.22 * pow(vein, 5.0) + 0.04 * w3;
    // seen from inside (ray travelling outward) the layer shows its cooler, dense inner face
    hFront = mix(hFront, 0.22 + 0.3 * (hot - 0.45) + 0.12 * pow(vein, 3.0) + 0.05 * w1, smoothstep(-0.1, 0.35, dot(rd, n)));
    // hot gas behind the front: crimson body with gold clumps
    float hGas = 0.16 + 0.22 * smoothstep(0.3, 1.5, clump) + 0.16 * smoothstep(1.1, 1.7, clump) + 0.05 * w2;
    float h = uWvHeat * mix(hGas, hFront, smoothstep(0.15, 0.6, layer));
    vec3 em = novaEmit(h);
    // thin, faint cold-blue radiative precursor just ahead of the front
    float pre = exp(-pow((ee + 0.018) / 0.014, 2.0)) * (1.0 - body) * (0.5 + 0.5 * w1);
    // steps grow with distance from the camera (fast ramp: the first 0.1 R no longer eats the step budget)
    float dt = clamp(min(0.35 * abs(ee - 0.003) * R + 0.002 * R, max(t * 0.13, 0.008 * R)), 0.002 * R, 0.09 * R) * (0.7 + 0.6 * fract(jit + float(i) * 0.618034));
    if (x < 0.4) dt = max(dt, (0.42 - x) * R * 0.9);     // empty hot interior: only the analytic core glow
    float a = 1.0 - exp(-rho * uWvDens * dt / R);
    // thin, very hot inner plasma around the surviving dwarf
    float core = exp(-x * x / 0.06) * body;
    col += T * (a * em + (C_ICE * 1.0 * pre + novaEmit(0.72) * 14.0 * deb * uWvDebris + novaEmit(0.62) * 0.22 * core) * dt / R);
    T *= 1.0 - a;
    T *= exp(-deb * uWvDebris * dt / R * 4.0);
    if (T < 0.02) break;
    t += dt;
  }
  return vec4(col, T);
}
`;
