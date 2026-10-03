// DAVID up close: the white dwarf as a resolved sphere (whitedwarf scene).
// Dwarf-centric units: the dwarf sits at the origin with radius 1. Requires DWARF (for dwarfColor()) and STARS.
//
// Layers, outside in:
//   backdrop     stars, crimson haze lit by the off-screen giant, (aftermath) the receding nova shell as bokeh
//   corona       thin exponential atmosphere (sharp limb ring) + a faint extended halo (crimson on the giant side)
//   filaments    dipole field lines r = L sin^2(theta). Every line lies in a meridional plane of the magnetic
//                axis, so one ray/plane intersection per plane gives an exact 2D distance to its arcs (crisp,
//                pixel-width-aware, no raymarch). Shape is deformed per line for wobble / snapping / tremolo.
//   ocean        accreted hydrogen layer: emission-absorption raymarch through a turbulent shell (gold-white)
//   columns      accretion curtains along field lines onto the magnetic poles (raymarched, only when enabled)
//   surface      smooth ~30,000 K photosphere: slight limb darkening, polar caps, hot spots, flash, scorch
export const DWARF_CLOSE = `
uniform float uSurfGain;     // surface radiance at disk centre
uniform float uSpin;         // star rotation angle (surface pattern)
uniform vec3 uMagAxis;       // magnetic dipole axis (unit, world)
uniform vec3 uMagRef;        // unit vector perpendicular to uMagAxis (azimuth 0)
uniform float uFil;          // filament brightness
uniform vec2 uFilL;          // L-shell range of the drawn filaments
uniform float uFilW;         // filament core radius (R)
uniform float uFilShimmer;   // slow wobble amplitude
uniform float uTremolo;      // fast vibration amplitude (final tremolo)
uniform float uSnap;         // seconds since the filaments snapped (<0: intact)
uniform float uOcean;        // accreted hydrogen layer 0..1
uniform float uOceanH;       // mean layer thickness at ocean = 1 (R)
uniform float uOceanHeat;    // 0..1 hotter, whiter, brighter
uniform float uOceanGain;    // emission gain of the layer
uniform float uTurbF;        // turbulence frequency (lattice cells per R)
uniform float uTurbV;        // turbulence speed
uniform float uCells;        // 0 = smooth swirling layer, 1 = fully convective cells
uniform vec4 uConv;          // convulsion: xyz origin direction, w = seconds since (<0 none)
uniform float uConvAmp;      // convulsion amplitude (in layer thicknesses)
uniform float uFlare;        // flare / hot spot activity 0..1
uniform vec4 uFlash;         // xyz direction, w = amount (surface thermonuclear flash)
uniform float uFlashR;       // flash front angular radius (radians)
uniform float uColumns;      // accretion column strength
uniform vec2 uColL;          // L range of the accretion curtains
uniform float uHaze;         // heat-haze displacement amplitude (R)
uniform float uHazeF;        // heat-haze noise frequency (per R)
uniform vec3 uGiantDir;      // direction toward the giant (unit)
uniform float uCrimson;      // crimson haze / rim from the giant
uniform float uScorch;       // aftermath scarring 0..1
uniform float uShell;        // aftermath: receding nova shell brightness
uniform float uShellScale;   // its pattern scale (grows = recedes)
uniform vec3 uShellAxis;     // view axis the shell pattern recedes toward
uniform float uThread;       // new stream: head progress 0..1 (0 = off)
uniform vec2 uThreadPts[14]; // stream centreline in the orbital plane (x, z)
uniform float uThreadGain;
uniform float uStarGain;
uniform float uAtmo;         // corona strength
uniform float uPoint;        // point-source glow weight (far away)
uniform float uWhite;        // convergence to white (final frames)
uniform float uDust;         // parallax haze sheets (push-in)

// ---------- palette helpers
vec3 wdIce(){ return vec3(0.30, 0.56, 1.0); }
vec3 oceanColor(float h){
  // crimson -> ember -> molten gold -> gold-white -> white
  vec3 c0 = vec3(0.45, 0.025, 0.008), c1 = vec3(0.95, 0.16, 0.025), c2 = vec3(1.0, 0.46, 0.09), c3 = vec3(1.0, 0.74, 0.36), c4 = vec3(1.0, 0.95, 0.86);
  return h < 0.4 ? mix(c0, c1, sat(h / 0.4)) : h < 0.75 ? mix(c1, c2, (h - 0.4) / 0.35) : h < 1.05 ? mix(c2, c3, (h - 0.75) / 0.3) : mix(c3, c4, sat((h - 1.05) / 0.45));
}

// ---------- heat haze: displace the ray where it passes through hot gas near the dwarf
vec3 wdHaze(vec3 ro, vec3 rd, float t){
  if (uHaze <= 0.0) return rd;
  vec3 pc; float tc;
  vec2 hs = sphereHit(ro, rd, vec3(0.0), 1.0 + uOceanH * 2.5);
  if (hs.x > 0.0) { tc = hs.x; pc = ro + rd * tc; }
  else { tc = max(dot(-ro, rd), 0.0); pc = ro + rd * tc; }
  float b = length(pc);
  float w = exp(-max(b - 1.0, 0.0) * 1.8);
  if (w < 0.01) return rd;
  vec3 q = pc * uHazeF + vec3(0.0, t * 1.9, t * 0.7);
  vec3 dsp = vec3(n3(q), n3(q + vec3(19.1, 7.3, 0.0)), n3(q + vec3(3.7, 41.9, 11.0)));
  dsp += 0.5 * vec3(n3(q * 2.3 + 5.0), n3(q * 2.3 + 23.0), n3(q * 2.3 + 51.0));
  dsp -= rd * dot(dsp, rd);
  float lens = max(tc, (length(ro) - 1.0) * 1.5 + 0.01);      // the refracting gas is never closer than ~the camera altitude
  return normalize(rd + dsp * uHaze * w / lens);
}

// ---------- backdrop
vec3 wdBackdrop(vec3 rd, float t){
  vec3 c = (starField(rd, 0.0) + deepSky(rd)) * uStarGain;
  if (uCrimson > 0.0){
    float g = dot(rd, uGiantDir);
    float glow = exp((g - 1.0) * 3.2) * 1.8 + exp((g - 1.0) * 1.2) * 0.08;   // from the giant far left, fading across the frame
    float dust = fbm3(rd * 4.0 + vec3(7.0, 2.0, t * 0.01), 4) * 0.5 + 0.5;
    float fil = ridged3(rd * 2.6 + vec3(2.0, 9.0, 4.0), 3);
    float cl = smoothstep(0.32, 0.85, dust) * (0.35 + 1.1 * fil);
    c += mix(C_CRIMSON, C_EMBER * 0.35, 0.25 * cl) * uCrimson * glow * (0.12 + cl);
  }
  if (uShell > 0.0){
    // far hemisphere of the expanding shell, seen out of focus: soft gold haze + bokeh knots that slowly
    // contract toward the view axis (they recede behind the dwarf)
    vec3 ax = uShellAxis;
    vec3 ex = normalize(cross(ax, vec3(0.0, 1.0, 0.0))), ey = cross(ex, ax);
    float ca = dot(rd, ax);
    vec2 pl = vec2(dot(rd, ex), dot(rd, ey)) / max(0.25, 1.0 + ca * 0.0);
    vec3 sp = vec3(pl * uShellScale, ca * 1.5);
    float lo = fbm3(sp * 0.9 + vec3(3.0, 1.0, 7.0), 3) * 0.5 + 0.5;
    float lo2 = fbm3(sp * 2.2 + vec3(9.0, 4.0, 1.0), 3) * 0.5 + 0.5;
    // the shell's dense equatorial ring seen from inside: a broad diagonal band behind the dwarf, out of focus
    float bd = pl.y * 0.93 + pl.x * 0.36 + 0.03 + 0.05 * (lo - 0.5);
    float band = exp(-pow(bd / 0.16, 2.0));
    float clumps = smoothstep(0.42, 0.78, lo2 * 0.65 + lo * 0.5);
    float haze = (0.04 * lo + band * (0.18 + 1.5 * clumps * lo));
    // out-of-focus knots of the receding ejecta: small soft bokeh discs, mostly along the band
    vec2 k = cells3(sp * 4.2 + vec3(11.0, 5.0, 0.0));
    float kb = n3(sp * 2.1 + 31.0) * 0.5 + 0.5;
    float rb = 0.16;
    float disc = smoothstep(rb, rb - 0.03, k.x) * (0.7 + 0.5 * smoothstep(rb - 0.07, rb - 0.01, k.x));
    float knots = disc * smoothstep(0.55, 0.85, kb) * (0.15 + 1.4 * band);
    vec3 shellC = mix(vec3(1.0, 0.30, 0.05), vec3(1.0, 0.70, 0.30), clumps * 0.85 + 0.15 * lo);
    c += shellC * uShell * (haze * 0.42 + knots * 0.55);
  }
  return c;
}

// ---------- thin atmosphere / corona (analytic exponential column)
vec3 wdCorona(vec3 ro, vec3 rd, float tHit, float mu){
  float tc = max(dot(-ro, rd), 0.0);
  vec3 pc = ro + rd * tc;
  float b = length(pc);
  float H1 = mix(0.0035, 0.010, smoothstep(1.1, 2.2, length(ro))), H2 = 0.16;
  float c1, c2;
  bool hit = tHit < 1e8;
  if (!hit){
    c1 = exp(-(b - 1.0) / H1) * sqrt(TAU * H1);
    c2 = exp(-(b - 1.0) / H2) * sqrt(TAU * H2);
  } else {
    c1 = H1 / max(mu, sqrt(H1) * 0.8);
    c2 = H2 / max(mu, sqrt(H2) * 0.8) * 0.5;
  }
  vec3 dirc = b > 1e-4 ? pc / b : vec3(0.0);
  float gside = sat(dot(dirc, uGiantDir));
  float outside = smoothstep(1.4, 3.0, length(ro));               // the extended halo only reads from afar
  // the off-screen giant lights the outer haze crimson on its side
  float H3 = 1.4;
  float c3 = hit ? 0.0 : exp(-(b - 1.0) / H3) * sqrt(TAU * H3);
  vec3 crim = vec3(0.42, 0.02, 0.012) * 0.14 * c3 * uCrimson * gside * gside * outside;
  return (vec3(0.40, 0.66, 1.0) * c1 * 9.0 + wdIce() * c2 * 0.9 * outside) * uAtmo + crim;
}

// ---------- dipole field geometry helpers
// signed deformation of a line's L as a function of position along it (c = cos theta in [-1,1])
float filDeform(float id, float c, float t, float snapT){
  float d = uFilShimmer * (n3(vec3(id * 3.1, c * 2.2, t * 0.35)) );
  d += uTremolo * sin(t * 52.0 + id * 2.3 + c * 9.0) * (1.0 - c * c) * 0.6;
  if (snapT >= 0.0){
    // whip: a decaying wave runs from the break (apex) toward the footpoints; strands recoil outward
    float ac = abs(c);
    float env = exp(-snapT * 1.6);
    d += 0.22 * env * sin(ac * 11.0 - snapT * 17.0 + id) * smoothstep(0.0, 0.25, ac);
    d += 0.35 * (1.0 - exp(-snapT * 2.5)) * smoothstep(0.55, 0.05, ac);
  }
  return d;
}

vec3 wdFilaments(vec3 ro, vec3 rd, float tMax, float pixA, float t){
  if (uFil <= 0.0) return vec3(0.0);
  vec3 m = uMagAxis, a = uMagRef, b = cross(m, a);
  vec3 acc = vec3(0.0);
  for (int j = 0; j < 7; j++){
    float fj = float(j);
    float phi = (fj + 0.5) / 7.0 * PI + (hash11(fj * 7.31 + 2.0) - 0.5) * 0.35;
    vec3 e = cos(phi) * a + sin(phi) * b;
    vec3 N = cross(m, e);
    float dn = dot(rd, N);
    if (abs(dn) < 1e-5) continue;
    float tp = -dot(ro, N) / dn;
    if (tp <= 0.0 || tp > tMax) continue;
    vec3 p = ro + rd * tp;
    float x = dot(p, e), z = dot(p, m);
    float r = length(vec2(x, z));
    if (r < 1.0) continue;
    float sg = x >= 0.0 ? 1.0 : -1.0;
    float s = abs(x) / r, c = z / r;
    float psi = s * s / r;
    float grad = s * sqrt(1.0 + 3.0 * c * c) / (r * r);
    vec3 T = normalize(3.0 * s * c * sg * e + (2.0 * c * c - s * s) * m);
    float sinA = max(length(cross(rd, T)), 0.12);
    float wpx = pixA * tp * 0.55;
    for (int k = 0; k < 2; k++){
      float id = fj * 2.0 + (sg > 0.0 ? 0.0 : 1.0) + float(k) * 17.0;
      float hk = hash11(id * 3.17 + 5.0);
      if (hash11(id * 1.37 + 9.0) < 0.12) continue;                 // a few lines missing
      float snapT = uSnap >= 0.0 ? uSnap - hash11(id * 4.1) * 0.12 : -1.0;
      float L = mix(uFilL.x, uFilL.y, hk) * (1.0 + filDeform(id, c, t, snapT));
      float dIn = abs(psi - 1.0 / L) / max(grad, 1e-4);
      float d = dIn * abs(dn) / sinA;
      float w0 = uFilW * (0.7 + 0.6 * hash11(id * 2.9 + 1.0));
      float w = max(w0, wpx);
      float core = exp(-d * d / (w * w)) * (w0 / w);
      float glow = exp(-d / (w0 * 6.0 + wpx)) * 0.08 * w0 / max(w0, wpx * 0.25);
      float v = core + glow;
      if (v < 2e-3) continue;
      // brightness along the strand: plasma beads drifting toward the footpoints, hot footpoints
      float ac = abs(c);
      float bead = 0.55 + 0.45 * n3(vec3(id * 5.7, ac * 7.0 - t * 0.9 * (0.6 + hk), 3.0));
      float seg = smoothstep(-0.25, 0.35, n3(vec3(id * 2.3, c * 3.2 + t * 0.05, 7.0)));     // strands fade in and out along their length
      float hgt = (r - 1.0) / max(L - 1.0, 0.02);                                             // 0 at the footpoints, 1 at the apex
      float foot = (1.0 + 2.0 * exp(-(r - 1.0) * 14.0)) * mix(1.0, 0.25, smoothstep(0.1, 1.0, hgt));
      float br = uFil * (0.25 + 0.95 * hk * hk) * bead * seg * foot / max(sinA, 0.4);
      if (snapT >= 0.0){
        float gap = 0.62 * (1.0 - exp(-snapT * 3.2));
        float keep = smoothstep(gap, gap + 0.06, ac);
        float flash = 1.0 + 6.0 * exp(-snapT * 7.0) * smoothstep(gap + 0.25, gap, ac);
        br *= keep * flash * mix(1.0, 0.35, 1.0 - exp(-snapT * 0.7));
      }
      vec3 fc = mix(wdIce(), vec3(0.85, 0.93, 1.0), sat(core * br * 0.08));
      acc += fc * v * br;
    }
  }
  return acc;
}

// ---------- surface features
// small flares: hashed kernels on a 3D grid (exact, per-kernel random timing), bursting and flickering
float wdFlareMask(vec3 n, float t){
  if (uFlare <= 0.0) return 0.0;
  vec3 q = n * 38.0;
  vec3 c = floor(q);
  vec3 h = hash33(c + 13.7);
  vec3 fp = c + 0.25 + 0.5 * h;
  vec3 dv = q - fp;
  float d = length(dv - n * dot(dv, n));                               // kernels project radially onto the surface
  float r1 = hash13(c * 1.31 + 7.1);
  if (r1 > 0.25 + 0.55 * uFlare) return 0.0;                         // more kernels awake as activity grows
  float r2 = hash13(c * 0.77 + 3.3), r3 = hash13(c * 2.11 + 9.9);
  float ph = fract(t * (0.35 + 0.6 * r2) + r3);
  float life = smoothstep(0.0, 0.04, ph) * smoothstep(0.32, 0.06, ph);   // fast rise, quick decay
  float flick = 0.55 + 0.45 * sin(t * (31.0 + 23.0 * r2) + r3 * 40.0);
  float core = exp(-d * d / 0.004);
  float halo = exp(-d / 0.05) * 0.12 * smoothstep(0.24, 0.12, d);    // stays inside its own cell (no seams)
  return (core + halo) * life * flick * (0.5 + uFlare);
}

// the eruption above the flash point, seen along the ray (additive, sharp pass)
vec3 wdFlashPlume(vec3 ro, vec3 rd, float tMax, float t){
  if (uFlash.w <= 0.0) return vec3(0.0);
  vec3 pf = uFlash.xyz * (1.0 + 0.06 + 0.25 * uFlashR);
  vec2 rp = rayPoint(ro, rd, pf);
  if (rp.x > tMax + 0.3) return vec3(0.0);
  float w = 0.03 + 0.12 * uFlashR;
  return vec3(1.0, 0.92, 0.80) * uFlash.w * 0.7 / (1.0 + rp.y * rp.y / (w * w));
}

float wdFlashMask(vec3 n, float t){
  if (uFlash.w <= 0.0) return 0.0;
  float g = acos(clamp(dot(n, uFlash.xyz), -1.0, 1.0));
  float rag = fbm3(n * 9.0 + vec3(0.0, 0.0, t * 3.0), 3);
  float core = exp(-pow(g / max(uFlashR * 0.4, 1e-3), 2.0));
  float ring = exp(-pow((g - uFlashR - rag * 0.08) / (0.03 + 0.05 * uFlashR), 2.0));
  return uFlash.w * (core * (1.0 + 0.6 * rag) + ring * 0.8);
}

vec3 wdSurface(vec3 n, float mu, float t){
  vec3 ns = rotY(uSpin) * n;
  float big = fbm3(ns * 1.6 + 11.0, 3);
  float mid = n3(ns * 6.5 + 3.0);
  float cm = abs(dot(n, uMagAxis));
  float cap = smoothstep(0.82, 0.97, cm);
  float limb = 0.30 + 0.70 * pow(mu, 0.55);
  vec3 c = mix(vec3(0.20, 0.44, 1.0), vec3(0.68, 0.84, 1.0), pow(mu, 0.7));
  c = mix(c, vec3(0.26, 0.52, 1.0), 0.55 * sat(uOcean * 2.0));      // under the gold ocean the floor reads cold blue
  float b = 1.0 + 0.10 * big + 0.04 * mid + 0.22 * cap;
  vec3 col = c * limb * b * uSurfGain;
  if (uScorch > 0.0){
    // aftermath: ablated, streaked layer of processed ash (still white-hot) and dying gold embers
    vec3 sq = ns * 5.0;
    vec3 wv = vec3(n3(sq * 0.7 + 1.0), n3(sq * 0.7 + 9.0), n3(sq * 0.7 + 17.0));
    float st = fbm3(sq + wv * 1.4, 4) * 0.5 + 0.5;
    float scar = smoothstep(0.42, 0.72, st);
    float rid = ridged3(ns * 9.0 + wv * 2.0, 3);
    col *= 1.0 - 0.45 * uScorch * scar * (0.6 + 0.4 * mu);
    col += vec3(1.0, 0.50, 0.16) * uScorch * uSurfGain * 0.16 * pow(rid, 3.0) * (0.3 + scar);
  }
  // accretion footprints at the magnetic poles
  if (uColumns > 0.0){
    float zc = dot(n, uMagAxis);
    float s2 = max(1.0 - zc * zc, 1e-4);
    float Ls = 1.0 / s2;
    float phi = atan(dot(n, cross(uMagAxis, uMagRef)), dot(n, uMagRef));
    float arc = smoothstep(uColL.x * 0.92, uColL.x, Ls) * smoothstep(uColL.y * 1.1, uColL.y, Ls);
    float az = exp(-pow((phi - 0.3) / 0.9, 2.0)) + exp(-pow((phi - 0.3 - PI) / 0.9, 2.0)) + exp(-pow((phi - 0.3 + PI) / 0.9, 2.0));
    col += vec3(0.80, 0.90, 1.0) * uColumns * arc * az * uSurfGain * 2.2 * (0.7 + 0.6 * n3(n * 40.0 + t * 3.0));
  }
  col += vec3(1.0, 0.97, 0.94) * wdFlashMask(n, t) * uSurfGain;
  return col;
}

// hot spots erupting through the layer (sharp pass): n = surface direction under the pixel
vec3 wdFlares(vec3 n, float mu, float t){
  float f = wdFlareMask(n, t);
  return mix(vec3(0.40, 0.66, 1.0), vec3(0.92, 0.96, 1.0), sat(f * 1.5)) * f * uSurfGain * 40.0 * (0.4 + 0.6 * mu);
}

// ---------- convulsion: height offset of the ocean (in layer thicknesses)
float wdConvulse(vec3 n, float t){
  if (uConv.w < 0.0 || uConvAmp <= 0.0) return 0.0;
  float ts = uConv.w;
  float g = acos(clamp(dot(n, uConv.xyz), -1.0, 1.0));
  float front = g - ts * 0.55;
  float wave = (0.35 + 0.65 * sin(front * 38.0)) * exp(-front * front * 18.0) * exp(-ts * 0.6);
  float heave = (0.4 + 0.6 * sin(ts * 9.0)) * exp(-ts * 1.3) * exp(-g * g * 1.5);
  return uConvAmp * (wave * 0.8 + heave * 0.9);
}

// ---------- accreted hydrogen ocean
// Thin layer (thickness ~ a quarter of a convective cell). Top height in mean layer thicknesses, and heat.
// macro: large-scale activity (0..1) for this ray; lod: 0 = full detail, 1 = pattern below pixel size
float oceanField(vec3 n, vec3 warp, float t, float macro, float lod, out float heat){
  vec3 q = n * uTurbF + warp;
  float tv = t * uTurbV;
  vec2 c = cells3(q * 0.55 + vec3(0.0, tv * 0.10, tv * 0.07));
  vec2 c2 = cells3(q * 1.35 + vec3(5.0, tv * 0.21, -tv * 0.15));
  float lw = mix(0.09, 0.19, macro);
  float bill = fbm3(q * 1.25 + vec3(tv * 0.30, -tv * 0.18, tv * 0.22), 3);   // turbulent billows
  float laneC = smoothstep(0.0, lw, c.y) * mix(1.0, smoothstep(0.0, 0.16, c2.y), 0.55 * (1.0 - macro));
  float lane = mix(smoothstep(-0.32, 0.18, bill + 0.12 * (c2.y - 0.3)), laneC, uCells);   // thin swirls before convection sets in
  float rim = smoothstep(0.02, 0.10, c.y) * (1.0 - smoothstep(0.10, 0.34, c.y)) * uCells;
  float core = mix(0.55 + 0.45 * smoothstep(0.0, 0.5, bill), (1.0 - smoothstep(0.0, 0.95, c.x)) * (0.75 + 0.25 * (1.0 - c2.x)), uCells);
  // compressive shimmer: interfering pressure-wave trains racing across the layer
  float sw = 0.5 * sin(dot(q, vec3(0.31, 0.12, 0.27)) * 1.9 - t * 5.0 + bill * 4.0)
           + 0.5 * sin(dot(q, vec3(-0.17, 0.33, 0.11)) * 2.3 - t * 6.3 + bill * 3.0);
  float fil = 1.0 - abs(n3(q * 3.1 + vec3(bill * 2.0, tv * 0.5, 0.0)));
  fil = fil * fil; fil *= fil; fil *= fil;                     // thin bright plasma threads inside the cells
  heat = 0.22 + 0.80 * lane * core + 0.50 * bill - 0.30 * rim + 0.08 * sw * uOcean + 0.25 * macro + 0.16 * fil * lane;
  float top = 0.18 + 0.95 * lane + 0.45 * bill + 0.12 * sw;
  heat = mix(heat, 0.55 + 0.25 * macro, lod);
  return mix(top, 0.95, lod);
}

// emission-absorption raymarch through the layer. returns (radiance, transmittance)
vec4 wdOcean(vec3 ro, vec3 rd, float tSurf, float t, float pixA){
  if (uOcean <= 0.0) return vec4(0.0, 0.0, 0.0, 1.0);
  float Hm = uOceanH * uOcean;
  float Hx = Hm * (1.75 + uConvAmp * 1.3);
  vec2 hh = sphereHit(ro, rd, vec3(0.0), 1.0 + Hx);
  if (hh.y <= 0.0 || hh.x > tSurf) return vec4(0.0, 0.0, 0.0, 1.0);
  float t0 = max(hh.x, 0.0), t1 = min(hh.y, tSurf);
  const int N = 22;
  float tCap = t0 + float(N) * Hm * 0.30;                   // grazing rays: march the first stretch, the rest is opaque
  bool capped = t1 > tCap;
  t1 = min(t1, tCap);
  // per-ray domain warp and flare, evaluated mid-layer
  vec2 hmid = sphereHit(ro, rd, vec3(0.0), 1.0 + Hm * 0.6);
  float tm = hmid.x > 0.0 && hmid.x < t1 ? hmid.x : mix(t0, t1, 0.5);
  vec3 pm = ro + rd * tm;
  vec3 q0 = normalize(pm) * uTurbF * 0.19;
  float tv = t * uTurbV;
  vec3 warp = vec3(n3(q0 + vec3(tv * 0.05, 0.0, 0.0)), n3(q0 + vec3(0.0, 17.0, tv * 0.04)), n3(q0 + vec3(41.0, tv * 0.03, 0.0))) * 2.4;
  vec3 q1 = q0 * 3.1 + warp * 0.6;
  warp += vec3(n3(q1 + vec3(0.0, 0.0, tv * 0.12)), n3(q1 + vec3(13.0, tv * 0.1, 0.0)), n3(q1 + vec3(tv * 0.09, 29.0, 0.0))) * 0.9;
  float flare = 0.0;
  vec3 nm = normalize(pm);
  float macro = smoothstep(-0.35, 0.45, fbm3(nm * uTurbF * 0.07 + vec3(3.0, 7.0, tv * 0.02), 2));
  float foot = pixA * tm / max(abs(dot(rd, nm)), 0.08);                  // pixel footprint on the layer
  float lod = smoothstep(0.12, 0.6, foot * uTurbF * 0.55);
  float sigma0 = (0.6 + 2.6 * uOcean) / Hm;
  float dt = (t1 - t0) / float(N);
  float j = ign(gl_FragCoord.xy);
  vec3 acc = vec3(0.0); float T = 1.0;
  vec3 S = vec3(0.0);
  for (int i = 0; i < N; i++){
    float ts = t0 + (float(i) + j) * dt;
    vec3 p = ro + rd * ts;
    float r = length(p); vec3 n = p / r;
    float h = (r - 1.0) / Hm;
    float heat;
    float cv = wdConvulse(n, t);
    float top = oceanField(n, warp, t, macro, lod, heat) + cv;
    heat += 0.22 * max(cv, 0.0) - 0.12 * max(-cv, 0.0);
    float dens = sat((top - h) * 4.0);
    if (dens <= 0.002) continue;
    float g3 = n3(p * (uTurbF * 4.1) + vec3(0.0, tv * 0.6, 0.0));        // 3D grain so emission is not extruded
    float skin = smoothstep(top - 0.5, top, h);                             // hot compressed skin near the top
    float hh2 = heat * (0.80 + 0.30 * skin) + 0.10 * g3 + 0.28 * uOceanHeat;
    S = oceanColor(hh2) * uOceanGain * (0.07 + 2.0 * pow(max(hh2, 0.0), 3.0)) * (1.0 + flare * 8.0);
    float a = 1.0 - exp(-sigma0 * dens * dt);
    acc += T * S * a;
    T *= 1.0 - a;
    if (T < 0.02) break;
  }
  if (capped){
    // the rest of a grazing ray is optically thick: finish with the layer's mean glow (also the far-field LOD)
    float hm = 0.62 + 0.25 * macro + 0.28 * uOceanHeat;
    vec3 Sm = oceanColor(hm) * uOceanGain * (0.07 + 2.0 * hm * hm * hm);
    // only rays that dip below the mean top are opaque; rays skimming above the limb stay clear
    float bmin = length(ro + rd * max(dot(-ro, rd), 0.0));
    float fill = tSurf < 1e8 ? 1.0 : smoothstep(1.25, 0.65, (bmin - 1.0) / Hm);
    acc += T * (dot(S, S) > 0.0 ? mix(S, Sm, 0.5) : Sm) * fill; T *= 1.0 - fill;
  }
  return vec4(acc, T);
}

// ---------- accretion curtains: gas threaded onto field lines at r ~ L, falling along them onto both poles.
// Each curtain is a fan of field-line streams in meridional planes near azimuths phi0 and phi0 + pi.
vec3 wdColumns(vec3 ro, vec3 rd, float tMax, float pixA, float t){
  if (uColumns <= 0.0) return vec3(0.0);
  vec3 m = uMagAxis, a = uMagRef, b = cross(m, a);
  vec3 acc = vec3(0.0);
  for (int j = 0; j < 5; j++){
    float fj = float(j);
    float phi = 0.3 + (fj - 2.0) * 0.14 + (hash11(fj * 3.7 + 1.0) - 0.5) * 0.08;
    vec3 e = cos(phi) * a + sin(phi) * b;
    vec3 N = cross(m, e);
    float dn = dot(rd, N);
    if (abs(dn) < 1e-5) continue;
    float tp = -dot(ro, N) / dn;
    if (tp <= 0.0 || tp > tMax) continue;
    vec3 p = ro + rd * tp;
    float x = dot(p, e), z = dot(p, m);
    float r = length(vec2(x, z));
    if (r < 1.0) continue;
    float sg = x >= 0.0 ? 1.0 : -1.0;
    float s = abs(x) / r, c = z / r;
    float psi = s * s / r;
    float grad = s * sqrt(1.0 + 3.0 * c * c) / (r * r);
    vec3 T = normalize(3.0 * s * c * sg * e + (2.0 * c * c - s * s) * m);
    float sinA = max(length(cross(rd, T)), 0.4);
    float wpx = pixA * tp * 0.6;
    for (int k = 0; k < 2; k++){
      float id = fj * 3.0 + float(k) + (sg > 0.0 ? 0.0 : 40.0);
      float L = mix(uColL.x, uColL.y, (float(k) + 0.15 + 0.7 * hash11(id * 1.9)) / 2.0);
      float dIn = abs(psi - 1.0 / L) / max(grad, 1e-4);
      float d = dIn * abs(dn) / sinA;
      float fall = sat((1.0 - r / L) / (1.0 - 1.0 / L));            // 0 where threaded, 1 at the pole
      float w0 = 0.0045 * L * mix(1.0, 0.3, fall);                   // the stream narrows as the flux tube converges
      float w = max(w0, wpx);
      float core = exp(-d * d / (w * w)) * (w0 / w);
      float glow = exp(-d / (w0 * 4.0 + wpx)) * 0.25;
      if (core + glow < 2e-3) continue;
      float ac = abs(c);
      float clump = 0.35 + 0.65 * smoothstep(0.35, 0.85, n3(vec3(id * 3.3, ac * 7.0 - t * (3.0 + 6.0 * fall), 1.0)) * 0.5 + 0.5);
      clump *= 0.4 + 0.6 * hash11(id * 7.7 + 3.0);
      float detach = smoothstep(0.0, 0.12, fall);                      // fades in where the gas leaves the disk plane
      float heat = 0.45 + 0.9 * fall * fall;
      vec3 sc = mix(oceanColor(heat), vec3(0.75, 0.88, 1.0), smoothstep(0.82, 1.0, fall));
      acc += sc * (core * clump * (0.8 + 6.0 * pow(fall, 5.0)) + glow * 0.18 * (0.5 + clump)) * detach;
    }
  }
  return acc * uColumns;
}

// ---------- the new stream thread in the orbital plane (y = 0)
vec3 wdThread(vec3 ro, vec3 rd, float tMax, float pixA, float t){
  if (uThread <= 0.0 || abs(rd.y) < 1e-4) return vec3(0.0);
  float tp = -ro.y / rd.y;
  if (tp <= 0.0 || tp > tMax) return vec3(0.0);
  vec2 p = (ro + rd * tp).xz;
  float best = 1e9, sBest = 0.0; vec2 tan2 = vec2(1.0, 0.0);
  float sAcc = 0.0;
  for (int i = 0; i < 13; i++){
    vec2 a = uThreadPts[i], b = uThreadPts[i + 1];
    vec2 ab = b - a; float l = length(ab);
    float h = clamp(dot(p - a, ab) / (l * l), 0.0, 1.0);
    float d = length(p - a - ab * h);
    if (d < best){ best = d; sBest = (float(i) + h) / 13.0; tan2 = ab / l; }
  }
  vec3 T3 = vec3(tan2.x, 0.0, tan2.y);
  float sinA = max(length(cross(rd, T3)), 0.15);
  float d = best * abs(rd.y) / sinA;
  float w0 = 0.0045 * (1.0 + 1.5 * (1.0 - sBest)), wpx = pixA * tp * 0.6;
  float w = max(w0, wpx);
  float core = exp(-d * d / (w * w)) * (w0 / w);
  float clumps = 0.12 + 0.88 * smoothstep(0.3, 0.8, n3(vec3(sBest * 55.0 - t * 1.6, 2.0, 5.0)) * 0.5 + 0.5);
  clumps *= 0.6 + 0.4 * (n3(vec3(sBest * 160.0 - t * 4.0, 7.0, 1.0)) * 0.5 + 0.5);
  float glow = exp(-d / (w0 * 8.0 + wpx)) * 0.10 * (0.4 + clumps);
  float head = smoothstep(uThread, uThread - 0.05, sBest);
  float tip = exp(-pow((sBest - uThread) / 0.03, 2.0));
  vec3 c = mix(vec3(1.0, 0.18, 0.04), vec3(1.0, 0.62, 0.24), smoothstep(0.3, 1.0, sBest));
  return c * (core * clumps * 1.6 + glow * 0.6) * (head + tip * 1.2) / max(sinA, 0.4) * uThreadGain;
}

// ---------- parallax haze sheets for the push-in: spherical veils around the dwarf, lit blue by it and crimson by the giant
vec3 wdDust(vec3 ro, vec3 rd, float tMax, float t){
  if (uDust <= 0.0) return vec3(0.0);
  vec3 acc = vec3(0.0);
  for (int k = 0; k < 4; k++){
    float fk = float(k);
    float R = 11.0 * pow(4.0, fk);
    vec2 h = sphereHit(ro, rd, vec3(0.0), R);
    if (h.y <= 0.0) continue;
    for (int s = 0; s < 2; s++){
      float tt = s == 0 ? h.x : h.y;
      if (tt <= 0.0 || tt > tMax) continue;
      vec3 p = ro + rd * tt;
      vec3 n = p / R;
      float mu = abs(dot(n, rd));
      float d = fbm3(n * (3.0 + fk * 0.7) + vec3(fk * 13.1, 2.0, t * 0.01), 3) * 0.5 + 0.5;
      float wisp = smoothstep(0.52, 0.85, d);
      float giant = 0.5 + 0.5 * dot(n, uGiantDir);
      vec3 lit = wdIce() * (6.0 / R) + C_CRIMSON * uCrimson * giant * giant * 0.6;
      acc += lit * wisp * mu * mu * 0.10;
    }
  }
  return acc * uDust;
}
`;
