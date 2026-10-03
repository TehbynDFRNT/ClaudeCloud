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
const vec3 NK4 = vec3(1.00, 0.760, 0.450);
const vec3 NK5 = vec3(1.00, 0.950, 0.880);
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
  for (int i = 0; i < 48; i++){
    if (t > t1) break;
    vec3 p = ro + rd * t;
    vec3 v = p - uFbC; float r = length(v); vec3 n = v / max(r, 1e-6);
    float hot; float s = fbShape(n, hot);
    float e = s - r / R;
    if (e < -0.16){ t += max(0.012, (-e - 0.13) * 0.8) * R; continue; }
    float eph0 = s * uFbPh - r / R;
    vec3 q = v / R;
    float w1 = n3(q * 6.5 + vec3(0.0, uFbEvo * 0.35, uFbSeed));
    float w2 = 0.0, w3 = 0.0;
    if (e > -0.07){                                   // fine turbulence only near the front
      w2 = n3(q * 17.0 + vec3(uFbEvo * 0.5, 0.0, 0.0));
      w3 = n3(q * 43.0 + vec3(0.0, 0.0, uFbEvo * 0.8));
    }
    float ee = e + 0.045 * uFbTurb * (w1 + 0.5 * w2) + 0.006 * w3;
    float body = smoothstep(-0.004, 0.004, ee);
    float veil = smoothstep(0.5, 0.85, w1 * 0.5 + 0.5 + 0.35 * w2 + 0.15 * w3);
    float cor = exp(min(ee, 0.0) / 0.05) * (1.0 - body) * veil;
    float mu = abs(dot(n, rd));
    float vein = 1.0 - abs(w2 + 0.5 * w3);
    // optically thin shell: clumpy density (billow tops and hot veins) so texture survives translucency
    float clumpd = 0.2 + 1.6 * hot * hot + 0.9 * pow(vein, 4.0) + 0.3 * w1;
    float rho = body * mix(12.0, (0.1 + 0.9 * exp(-max(ee, 0.0) / 0.06)) * clumpd, uFbShell) + mix(0.55, 0.12, uFbShell) * cor;
    // opaque white-hot pseudo-photosphere receding through the ejecta
    float ph = uFbPh > 0.0 ? smoothstep(-0.005, 0.005, s * uFbPh - r / R + 0.012 * w1 + 0.004 * w2) : 0.0;
    rho += ph * 12.0;
    rho *= FB_MASK(p);
    float hb = 0.30 + 0.3 * smoothstep(0.0, 0.03, ee) + 0.32 * (hot - 0.45) + 0.15 * pow(mu, 1.5) + 0.13 * pow(vein, 3.0);
    // translucent swept-up shell (uFbShell -> 1): gold-white source, cooler thin interior
    float hs = 0.2 + 0.24 * min(clumpd, 2.2) + 0.08 * (hot - 0.45) + 0.1 * pow(vein, 3.0) - 0.08 * smoothstep(0.04, 0.2, ee);
    hb = mix(hb, hs, uFbShell);
    float h = uFbHeat * mix(hb, 0.22 + 0.1 * veil, (1.0 - body));
    h = mix(h, uFbHeat * (0.47 + 0.2 * pow(mu, 1.2) + 0.22 * (hot - 0.45) + 0.1 * pow(vein, 3.0)), ph);
    float dt = R * clamp(min(0.35 * abs(ee - 0.003), uFbPh > 0.0 ? max(0.35 * abs(eph0), 0.004) : 1.0), 0.004, 0.05) * (0.7 + 0.6 * fract(jit + float(i) * 0.618034));
    float a = 1.0 - exp(-rho * uFbDens * dt / R);
    vec3 em = novaEmit(h);
    em += C_ICE * uFbBlue * 3.0 * cor * exp(min(ee + 0.06, 0.0) / 0.03) * step(ee, -0.03);
    col += T * a * em;
    T *= 1.0 - a;
    if (T < 0.02) break;
    t += dt;
  }
  return vec4(col, T);
}
`;

// ---------------------------------------------------------------------------------------------
// Fractured shell: limb-brightened, optically thin; Rayleigh-Taylor fingers with bright knot heads
// at the outer edge and tails pointing back toward the centre (GK Per / T Pyx), a coarse filament
// network, a thin cold-blue forward-shock skin and a faint crimson interior haze.
// Radial profiles are integrated exactly per step (erf), so thin heads never alias with few steps.
export const NOVA_SHELL = `
uniform vec3 uShC;       // shell centre
uniform float uShR;      // outer radius
uniform vec3 uShAxis;    // symmetry axis (orbital pole)
uniform float uProlate;  // elongation along the axis
uniform float uFrac;     // 0 continuous sheet -> 1 fully fractured into knots and fingers
uniform float uShHeat;   // heat index of knot heads (white-gold .75, gold .62, ember .45)
uniform float uShGain;   // overall brightness
uniform float uSkin;     // cold-blue forward shock skin strength
uniform float uKnotK;    // knot frequency, ~10-16
uniform float uShSeed;
uniform float uShEvo;    // slow morphing clock
uniform float uEquator;  // equatorial enhancement (orbital plane)
uniform float uSheetW;   // continuous sheet weight multiplier
uniform int uShSteps;    // max steps per segment
uniform float uShStep;   // target step length (fraction of R)
// palette, precomputed on the CPU with the same ramp (novaColor in nova-*.js)
uniform vec3 uCHead0, uCHead1, uCHead2, uCTail0, uCTail1, uCWall, uCSheet, uCHaze, uCSkin;

float shScale(vec3 n){ float c = dot(n, uShAxis); return 1.0 + uProlate * (c * c - 0.3); }
vec4 shellA(vec3 nw){ return n4(nw * (uKnotK * 0.35) + vec3(uShSeed, 3.7, uShEvo * 0.05)); }
vec4 shellB(vec3 nw){ return n4(nw * uKnotK + vec3(11.3, uShSeed * 1.7, -uShEvo * 0.08)); }
float shNet(vec4 A){ return 1.0 - smoothstep(0.0, 0.3, A.a); }
float shEq(vec3 n){ return 1.0 + uEquator * exp(-pow(dot(n, uShAxis) / 0.25, 2.0)); }
float shClump(vec4 A){ return 0.3 + 0.55 * shNet(A) + 0.8 * smoothstep(0.45, 0.75, A.r); }
float shKw(float pk, float fr){ return mix(0.5, 0.12 + 0.3 * pk * pk, fr); }
float shXh(float pk, vec4 A){ return 0.985 - 0.035 * (pk - 0.5) * 2.0 - 0.02 * (A.r - 0.5) * 2.0; }

// line integral of a thin gaussian spherical shell (radius rh, width w) for ONE crossing; p = impact parameter.
// Exact far from tangency, matches the tangent-ray integral at p = rh, decays outside.
float shellCross(float p, float rh, float w){
  float d = max(rh * rh - p * p, 0.0);
  return 1.7725 * w * rh / sqrt(d + 1.92 * rh * w) * exp(-pow(max(p - rh, 0.0) / w, 2.0));
}

// thin components for one crossing of the shell at parameter ts (angular fields sampled where the ray
// crosses them, so compact heads never speckle): knot heads, secondary knots, sheet / inter-knot gas,
// network walls (limb-brightened), cold-blue forward shock
vec3 shellCrossing(vec3 oc, vec3 rd, vec3 warp, float ts, float obl, float sc, float p){
  float fr = smoothstep(0.0, 1.0, uFrac);
  vec3 n0 = normalize(oc + rd * ts);
  vec3 nh = normalize(n0 + warp);
  vec4 A = shellA(nh);
  vec4 B = shellB(nh);
  vec4 C = n4(nh.yzx * (uKnotK * 2.13) + vec3(-4.1, 7.9, uShSeed));
  float pat = n4(nh * 4.1 + vec3(2.0, uShSeed, 9.0)).b;
  float eq = shEq(n0), clump = shClump(A);
  // fragmented network: borders of varying width that break up, never a clean honeycomb
  float net = (1.0 - smoothstep(0.0, 0.12 + 0.3 * pat, A.a)) * smoothstep(0.35, 0.65, pat + 0.4 * (B.b - 0.5));
  // knot heads; on oblique chords the mask is widened (energy-conserving) so limb knots stay blobs
  float pk = B.r, kw = shKw(pk, fr);
  float kwe = kw * obl;
  float kn = 1.0 - smoothstep(0.0, kwe, B.g * 1.1);
  float amp = kn * kn * (0.12 + 1.9 * pk * pk * pk) / (obl * obl);
  float w = clamp(0.75 * kw / uKnotK, 0.007, 0.03) + 0.01 * (1.0 - fr);
  float sk = max(w, 0.5 * kw / uKnotK);                       // blob size caps the chord
  float head = min(shellCross(p, shXh(pk, A) * sc, w * sc), 1.7725 * sk * sc);
  float kn2 = 1.0 - smoothstep(0.0, 0.22 * obl, C.g * 1.1);
  float xh2 = 0.975 - 0.03 * (C.r - 0.5) * 2.0;
  float head2 = min(shellCross(p, xh2 * sc, 0.009 * sc), 1.7725 * 0.02 * sc) * kn2 * kn2 * 0.8 / (obl * obl);
  vec3 heads = (mix(uCHead0, uCHead1, pk) * head * amp * mix(0.1, 1.0, fr) * 13.0 + uCHead2 * head2 * fr * 4.0) * clump * eq;
  float sheet = shellCross(p, (0.965 + 0.025 * (A.r - 0.5)) * sc, 0.026 * sc) * max(0.0, 0.6 + 0.3 * net + 0.7 * (A.r - 0.5) + 0.4 * (pat - 0.5));
  float walls = shellCross(p, (0.96 + 0.04 * (pat - 0.5)) * sc, 0.03 * sc) * net * eq;
  float skinPatch = smoothstep(0.4, 0.85, pat + 0.35 * (A.r - 0.5));
  float skin = shellCross(p, (1.022 + 0.015 * (A.r - 0.5)) * sc, 0.012 * sc) * (0.12 + 0.88 * skinPatch);
  vec3 c = heads;
  c += uCWall * walls * (0.07 + 0.3 * (1.0 - fr));
  c += uCSheet * sheet * mix(1.4, 0.42, fr) * uSheetW;
  c += uCSkin * skin * uSkin;
  return c / sc;
}

// extended structure over one ray step (radii r0 -> r1, n at a jittered point): finger tails, interior haze
vec3 shellBody(vec3 nw, vec4 A, float sc, float r0, float r1, float dt){
  float x0 = r0 / sc, x1 = r1 / sc;
  vec4 B = shellB(nw);
  float fr = smoothstep(0.0, 1.0, uFrac);
  float pk = B.r, kw = shKw(pk, fr);
  float kn = 1.0 - smoothstep(0.0, kw * 1.15, B.g * 1.1);
  float amp = kn * shClump(A) * shEq(nw) * (0.3 + 1.4 * pk * pk);
  float L = (0.02 + 0.13 * uFrac) * (0.5 + 1.0 * fract(pk * 7.13));
  float tail = tailStep(x0, x1, shXh(pk, A) - 0.01, L, dt);
  float xm = 0.5 * (x0 + x1) - 0.8;
  float haze = exp(-xm * xm / 0.029) * dt;
  return (mix(uCTail0, uCTail1, pk) * tail * amp * fr * 1.6 + uCHaze * haze * 0.07) / sc;
}

// march the shell: front and back crossings of the [rIn, rOut] annulus (or the two halves of a limb chord)
vec3 shellMarch(vec3 ro, vec3 rd, float jit, float tMax){
  float smax = 1.0 + uProlate * 0.7;
  float rOut = uShR * smax * 1.07;
  float rIn = uShR * (1.0 - uProlate * 0.3) * 0.7;
  vec2 ho = sphereHit(ro, rd, uShC, rOut);
  if (ho.y <= 0.0 || ho.x > ho.y) return vec3(0.0);
  vec2 hi = sphereHit(ro, rd, uShC, rIn);
  vec3 pm = normalize(ro + rd * max(ho.x, 0.0) - uShC);
  vec4 wq = n4(pm * 1.3 + vec3(uShSeed * 0.37, 5.1, 2.3));
  vec3 warp = (wq.rba - 0.5) * 0.5;
  // large-scale brightness asymmetry (one flank ploughs into denser surroundings)
  float lsb = 0.55 + 0.9 * smoothstep(-0.6, 0.9, dot(pm, normalize(vec3(-0.5, 0.35, 0.6))) + (wq.g - 0.5) * 0.8);
  vec3 col = vec3(0.0);
  vec3 oc = ro - uShC;
  float b = dot(oc, rd), c0 = dot(oc, oc);
  float p = sqrt(max(c0 - b * b, 0.0));     // impact parameter
  bool inner = hi.x < hi.y && hi.y > 0.0;
  float tc = max(-b, 0.0);                 // closest approach: split there so r is monotonic per segment
  for (int s = 0; s < 2; s++){
    float ta, tb;
    if (inner){
      if (s == 0){ ta = max(ho.x, 0.0); tb = max(hi.x, 0.0); }
      else { ta = max(hi.y, 0.0); tb = ho.y; }
    } else {
      if (s == 0){ ta = max(ho.x, 0.0); tb = max(tc, ta); }
      else { ta = max(tc, max(ho.x, 0.0)); tb = ho.y; }
    }
    tb = min(tb, tMax);
    if (tb <= ta) continue;
    // thin components: one analytic crossing per segment (two iterations for the prolate radius)
    {
      float sc = shScale(normalize(oc + rd * (0.5 * (ta + tb)))) * uShR;
      float ts = 0.0, cosT = 1.0;
      for (int it = 0; it < 2; it++){
        float rh = 0.975 * sc;
        float disc = rh * rh - p * p;
        cosT = sqrt(max(disc, 0.0)) / rh;
        ts = disc > 0.0 ? (s == 0 ? -b - sqrt(disc) : -b + sqrt(disc)) : -b;
        ts = clamp(ts, ta, tb);
        sc = shScale(normalize(oc + rd * ts)) * uShR;
      }
      // obliquity: chord through the head layer relative to a knot's size (1 face-on, up to 2.2 at the limb)
      float wl = 0.02 * sc;
      float chord = wl / max(cosT, sqrt(2.0 * wl / sc));
      float obl = clamp(sqrt(chord / (0.025 * sc)), 1.0, 2.2);
      if (ts < tMax) col += shellCrossing(oc, rd, warp, ts, obl, sc, p);
    }
    int N = int(clamp((tb - ta) / (uShStep * uShR), 5.0, float(uShSteps)));
    float dt = (tb - ta) / float(N);
    vec4 A = vec4(0.5);
    for (int i = 0; i < 64; i++){
      if (i >= N) break;
      float tA = ta + float(i) * dt, tB = tA + dt;
      float tm = tA + jit * dt;
      float r0 = sqrt(max(c0 + 2.0 * b * tA + tA * tA, 0.0));
      float r1 = sqrt(max(c0 + 2.0 * b * tB + tB * tB, 0.0));
      vec3 n = normalize(oc + rd * tm);
      vec3 nw = normalize(n + warp);
      if ((i & 1) == 0) A = shellA(nw);       // low-frequency field: refresh every other step
      col += shellBody(nw, A, shScale(n) * uShR, r0, r1, dt);
    }
  }
  return col * lsb * uShGain;
}
`;

// ---------------------------------------------------------------------------------------------
// Distant giant (needs the GIANT chunk first): same palette and silhouette as giantShade, but only the
// largest convection cells, so a giant of < 60 px radius reads as a glowing ember rather than aliasing
// into a rocky texture. The hemisphere toward uScarDir is heated by the nova (uScar).
export const NOVA_GIANTFAR = `
vec4 giantFar(vec3 ro, vec3 rd, float t, out float dist){
  vec3 o = ro - uGiantPos;
  dist = 1e9;
  float Rb = uGiantR * (1.0 + uBulge * 1.2);
  vec2 hs = sphereHit(o, rd, vec3(0.0), Rb * 1.3);
  if (hs.y < 0.0 || hs.x > hs.y) return vec4(0.0);
  float b = length(o + rd * max(-dot(o, rd), 0.0)) / uGiantR;
  vec2 core = sphereHit(o, rd, vec3(0.0), Rb);
  bool hit = false; float th = 0.0;
  if (core.y > 0.0 && core.x < core.y){
    th = max(core.x, 0.0);
    for (int i = 0; i < 24; i++){
      vec3 p = o + rd * th; float r = length(p);
      float d = r - giantRadius(p / r);
      if (d < 0.001 * uGiantR){ hit = true; break; }
      th += d * 0.7;
      if (th > core.y) break;
    }
  }
  if (!hit){
    float g = exp(-max(b - 1.0, 0.0) / 0.05);
    return vec4(giantEmission(1800.0) * 0.4 * g * uGiantGlow, 0.35 * g);
  }
  vec3 p = o + rd * th; vec3 n = normalize(p);
  float mu = sat(dot(n, -rd));
  vec3 ns = rotY(uGiantSpin) * n;
  vec2 c = cells3(ns * 1.6 + vec3(0.0, t * 0.01, 0.0));
  float m = fbm3(ns * 2.5 + 3.0, 2);
  float T = 2050.0 + 260.0 * (1.0 - smoothstep(0.05, 0.9, c.x)) * (0.5 + 0.5 * smoothstep(0.0, 0.3, c.y)) + 120.0 * m;
  T *= mix(1.0 - 0.5 * uLimbDark, 1.0, pow(mu, 0.45));
  float f = sat(dot(n, uScarDir));
  T += uScar * 700.0 * smoothstep(0.15, 1.0, f) * (0.6 + 0.4 * m);
  dist = th;
  return vec4(giantEmission(T) * uGiantGlow, 1.0);
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
  float t = 0.003 * R * (0.5 + jit);
  for (int i = 0; i < 72; i++){
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
    float w3 = n3(q * 43.0 + vec3(0.0, 0.0, uFbEvo * 0.8));
    float ee = e + 0.04 * (w1 + 0.5 * w2) + 0.008 * w3;
    float body = smoothstep(-0.004, 0.004, ee);
    float layer = exp(-max(ee, 0.0) / 0.035);
    float vein = 1.0 - abs(w2 + 0.5 * w3);
    float clump = max(0.0, 0.05 + 1.1 * hot * hot + 0.3 * vein * vein + 0.6 * w1 + 0.05 * w3);
    float gas = (0.012 + 0.3 * pow(smoothstep(0.55, 1.3, clump), 2.0)) * smoothstep(0.42, 0.85, x);
    float rho = body * (5.0 * layer + gas);
    // debris filaments: thin radial streaks (direction-space cells), segmented and advected outward
    float deb = 0.0;
    if (uWvDebris > 0.0 && x > 0.7 && x < 1.15){
      vec4 c = n4(n * 46.0 + vec3(3.0, 1.0, uFbSeed));
      float seg = n3(vec3(n * 7.0) + vec3(0.0, 0.0, x * 5.0 - uWvAdv));
      deb = smoothstep(0.1, 0.0, c.g * 1.1) * smoothstep(0.6, 0.72, c.r) * smoothstep(0.1, 0.5, seg + 0.1) * smoothstep(0.7, 0.85, x) * smoothstep(1.15, 1.02, x);
      deb *= smoothstep(0.06, 0.3, 1.0 - abs(dot(n, rd)));   // end-on filaments near the vanishing point read as noise
    }
    float mu = abs(dot(n, rd));
    float hFront = 0.31 + 0.3 * smoothstep(0.0, 0.03, ee) - 0.34 * smoothstep(0.04, 0.13, ee) + 0.3 * (hot - 0.45) + 0.14 * pow(mu, 1.5) + 0.13 * pow(vein, 3.0);
    // seen from inside (ray travelling outward) the layer shows its cooler, dense inner face
    hFront = mix(hFront, 0.22 + 0.3 * (hot - 0.45) + 0.12 * pow(vein, 3.0) + 0.05 * w1, smoothstep(-0.1, 0.35, dot(rd, n)));
    float hGas = 0.16 + 0.24 * smoothstep(0.3, 1.5, clump) + 0.05 * w2;
    float h = uWvHeat * mix(hGas, hFront, smoothstep(0.15, 0.6, layer));
    vec3 em = novaEmit(h);
    // cold-blue radiative precursor just ahead of the front
    float pre = exp(-pow((ee + 0.03) / 0.03, 2.0)) * (1.0 - body) * (0.5 + 0.5 * w1);
    float dt = clamp(min(0.35 * abs(ee - 0.003) * R + 0.002 * R, max(t * 0.07, 0.004 * R)), 0.002 * R, 0.07 * R) * (0.7 + 0.6 * fract(jit + float(i) * 0.618034));
    if (x < 0.4) dt = max(dt, (0.42 - x) * R * 0.9);     // empty hot interior: only the analytic core glow
    float a = 1.0 - exp(-rho * uWvDens * dt / R);
    // thin, very hot inner plasma around the surviving dwarf
    float core = exp(-x * x / 0.06) * body;
    col += T * (a * em + (C_ICE * 3.0 * pre + novaEmit(0.7) * 9.0 * deb * uWvDebris + novaEmit(0.62) * 0.22 * core) * dt / R);
    T *= 1.0 - a;
    T *= exp(-deb * uWvDebris * dt / R * 6.0);
    if (T < 0.02) break;
    t += dt;
  }
  return vec4(col, T);
}
`;
