// DAVID up close: the white dwarf as a resolved sphere (whitedwarf scene).
// Dwarf-centric units: the dwarf sits at the origin with radius 1. Requires DWARF (for dwarfColor()) and STARS.
//
// Layers, outside in:
//   backdrop     stars, crimson haze lit by the off-screen giant, (aftermath) the receding nova shell: a defocused,
//                limb-brightened ring of clumpy knots around the dwarf (rhymes with the nova scene's ring)
//   corona       thin exponential atmosphere (sharp limb ring) + a faint extended halo (crimson on the giant side)
//   filaments    dipole field lines r = L sin^2(theta). Every line lies in a meridional plane of the magnetic
//                axis, so one ray/plane intersection per plane gives an exact 2D distance to its arcs (crisp,
//                pixel-width-aware, no raymarch). Shape is deformed per line for wobble / snapping / tremolo.
//   ocean        accreted hydrogen layer: emission-absorption raymarch through a turbulent shell. Value hierarchy:
//                dark crimson downflow lanes (~0.1), saturated molten-gold mid-tones (~0.5-2), white-gold cores (5-30),
//                cold blue only as thin seams where the floor shows through the narrowest cracks.
//   columns      accretion curtains along field lines onto the magnetic poles (exact plane distance)
//   surface      smooth ~30,000 K photosphere: limb darkening, polar caps, banding, footprints, flash, scorch
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
uniform float uFilN;         // meridional planes carrying filaments (<= 16)
uniform float uFilPhase;     // azimuth offset of those planes (rad)
uniform float uFilK;         // strands per half-plane (1..3)
uniform float uFilSpan;      // azimuth range covered by the planes (rad, PI = all around)
uniform float uOcean;        // accreted hydrogen layer 0..1
uniform float uOceanH;       // mean layer thickness at ocean = 1 (R)
uniform float uOceanHeat;    // 0..1 hotter, whiter, brighter
uniform float uOceanGain;    // emission gain of the layer
uniform float uTurbF;        // turbulence frequency (lattice cells per R)
uniform float uTurbV;        // turbulence speed
uniform float uCells;        // 0 = smooth swirling layer, 1 = fully convective cells
uniform float uWarp;         // domain-warp strength of the ocean pattern (1 = default)
uniform float uBig;          // large coherent structures: equatorial hot belt, darker polar caps, broad patches
uniform float uDetail;       // full-resolution fine detail laid over the soft ocean (sharp pass)
uniform vec4 uConv;          // convulsion: xyz origin direction, w = seconds since (<0 none)
uniform float uConvAmp;      // convulsion amplitude (in layer thicknesses)
uniform float uFlare;        // flare / hot spot activity 0..1
uniform float uFlareSize;    // flare size multiplier
uniform vec4 uFlash;         // xyz direction, w = amount (surface thermonuclear flash)
uniform float uFlashR;       // flash front angular radius (radians)
uniform float uPlume;        // eruption plume progress 0..1 (fingers and sparks)
uniform float uColumns;      // accretion column strength
uniform vec2 uColL;          // L range of the accretion curtains
uniform float uHaze;         // heat-haze displacement amplitude (R)
uniform float uHazeF;        // heat-haze noise frequency (per R)
uniform vec3 uGiantDir;      // direction toward the giant (unit)
uniform float uCrimson;      // crimson haze / rim from the giant
uniform float uScorch;       // aftermath scarring 0..1
uniform float uShell;        // aftermath: receding nova shell brightness
uniform float uShellR;       // its ring radius (tangent-plane units around the view axis to the dwarf)
uniform float uShellBlur;    // its defocus (fraction of the ring radius)
uniform vec3 uShellAxis;     // view axis to the dwarf (ring centre)
uniform float uThread;       // new stream: head progress 0..1 (0 = off)
uniform vec2 uThreadPts[40]; // stream centreline in the orbital plane (x, z)
uniform float uThreadGain;
uniform float uStarGain;
uniform float uAtmo;         // corona strength
uniform float uPoint;        // point-source glow weight (far away)
uniform float uWhite;        // convergence to white (final frames)
uniform float uDust;         // parallax haze sheets (push-in)

// ---------- palette helpers
vec3 wdIce(){ return vec3(0.30, 0.56, 1.0); }
// heat ramp shared with the nova: abyssal crimson -> crimson -> ember -> molten gold -> white-gold -> white
vec3 oceanColor(float h){
  const vec3 k0 = vec3(0.30, 0.012, 0.006), k1 = vec3(0.80, 0.050, 0.014), k2 = vec3(1.00, 0.200, 0.035);
  const vec3 k3 = vec3(1.00, 0.480, 0.120), k4 = vec3(1.00, 0.760, 0.450), k5 = vec3(1.00, 0.950, 0.880);
  float x = clamp(h, 0.0, 1.25) * 4.0;
  if (x < 1.0) return mix(k0, k1, x);
  if (x < 2.0) return mix(k1, k2, x - 1.0);
  if (x < 3.0) return mix(k2, k3, x - 2.0);
  if (x < 4.0) return mix(k3, k4, x - 3.0);
  return mix(k4, k5, x - 4.0);
}
// radiance grows ~exponentially with heat: lanes ~0.1, gold mid-tones 0.5-2, cores 5-30 (clip white, gold falloff)
float oceanLum(float h){ return 0.035 * exp(5.6 * h); }
vec3 oceanEmit(float h){ return oceanColor(h) * oceanLum(h); }

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
    // the expanding nova shell, seen out of focus around and behind the dwarf: the limb-brightened rim of a thin shell
    // (projected column ~ 1/sqrt(1 - rho^2)) broken into clumpy Rayleigh-Taylor knots, defocused into soft bokeh discs.
    // Receding = the ring slowly grows, softens and dims (driven by uShellR, uShellBlur, uShell). Sky stays black inside.
    vec3 ax = uShellAxis;
    float ca = dot(rd, ax);
    if (ca > 0.05){
      vec3 ex = normalize(cross(ax, vec3(0.0, 1.0, 0.0))), ey = cross(ex, ax);
      vec2 pl = vec2(dot(rd, ex), dot(rd, ey)) / ca;
      float rr = length(pl) + 1e-5;
      vec2 cs = pl / rr;
      float wob = 0.035 * n3(vec3(cs * 1.7, 3.0)) + 0.012 * n3(vec3(cs * 6.0, 9.0));
      float rho = rr / uShellR - wob;
      float bl = uShellBlur;
      float lim = inversesqrt(max(1.0 - rho * rho, 0.0) + 0.05 + bl * 0.6);
      float edge = smoothstep(1.0 + bl * 0.8, 1.0 - bl * 0.5, rho);
      float prof = lim * lim * edge;                                  // ~1 in the interior, ~6-8 at the rim
      vec2 kp = pl / uShellR;
      float clump = smoothstep(0.38, 0.78, fbm3(vec3(kp * 5.0, 2.0), 3) * 0.5 + 0.5 + 0.15 * n3(vec3(kp * 13.0, 5.0)));
      // bokeh knots: worley discs in the screen plane, gated by a coarse field, mostly on the rim
      vec2 k = cells3(vec3(kp * 10.0, 4.3));
      float kr = 0.26 + 0.9 * bl;
      float disc = smoothstep(kr, kr - 0.05 - 0.2 * bl, k.x) * (0.7 + 0.45 * smoothstep(kr - 0.14, kr - 0.03, k.x));
      float gate = smoothstep(0.05, 0.45, n3(vec3(kp * 3.1, 7.0)));
      float knots = disc * gate * prof * 0.16;
      float fill = prof * (0.25 + 0.75 * clump) * 0.055;
      // gold inner face, crimson outer edge
      vec3 shC = mix(vec3(1.0, 0.50, 0.14), vec3(0.85, 0.07, 0.018), smoothstep(0.86, 1.06, rho));
      c += shC * uShell * (fill + knots * (0.4 + 0.6 * clump));
    }
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
  float H3 = 1.4;
  float c3 = hit ? 0.0 : exp(-(b - 1.0) / H3) * sqrt(TAU * H3);
  vec3 crim = vec3(0.42, 0.02, 0.012) * 0.14 * c3 * uCrimson * gside * gside * outside;
  return (vec3(0.40, 0.66, 1.0) * c1 * 9.0 + wdIce() * c2 * 0.9 * outside) * uAtmo + crim;
}

// ---------- dipole field geometry helpers
// signed deformation of a line's L as a function of position along it (c = cos theta in [-1,1])
float filDeform(float id, float c, float t, float snapT, float tears){
  float d = uFilShimmer * n3(vec3(id * 3.1, c * 2.2, t * 0.35));
  d += uTremolo * (0.6 * sin(t * 52.0 + id * 2.3 + c * 9.0) + 0.4 * sin(t * 33.0 + id * 5.1 - c * 13.0)) * (1.0 - c * c) * 0.6;
  if (snapT >= 0.0){
    float ac = abs(c);
    if (tears > 0.5){
      // torn: a whip runs from the break (apex) toward the footpoints, peaking ~0.3 s after the snap (after the
      // strike flash has decayed) and dying away over ~2.5 s; the loose ends recoil outward
      float env = sat(snapT / 0.3) * exp(-0.42 * max(snapT - 0.3, 0.0));
      d += 0.30 * env * sin(ac * 9.0 - snapT * 7.0 + id) * smoothstep(0.0, 0.3, ac);
      d += 0.40 * (1.0 - exp(-snapT * 1.3)) * smoothstep(0.6, 0.05, ac);
    } else {
      // intact loops ring and visibly re-tension
      d += 0.12 * sin(snapT * 8.0 + id * 1.7) * exp(-snapT * 0.8) * (1.0 - c * c);
    }
  }
  return d;
}

vec3 wdFilaments(vec3 ro, vec3 rd, float tMax, float pixA, float t){
  if (uFil <= 0.0) return vec3(0.0);
  vec3 m = uMagAxis, a = uMagRef, b = cross(m, a);
  vec3 acc = vec3(0.0);
  float NP = max(uFilN, 1.0);
  for (int j = 0; j < 16; j++){
    float fj = float(j);
    if (fj >= NP) break;
    float phi = uFilPhase + ((fj + 0.5) + (hash11(fj * 7.31 + 2.0) - 0.5) * 0.75) / NP * uFilSpan;
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
    float edgeOn = smoothstep(0.03, 0.18, abs(dn));                     // loops seen edge-on collapse to lines: fade them
    float ac = abs(c);
    for (int k = 0; k < 3; k++){
      if (float(k) >= uFilK) break;
      float id = fj * 2.0 + (sg > 0.0 ? 0.0 : 1.0) + float(k) * 37.0;
      float hk = hash11(id * 3.17 + 5.0);
      if (hash11(id * 1.37 + 9.0) < 0.12) continue;                 // a few lines missing
      float tears = step(0.3, hash11(id * 6.7 + 2.0));               // ~70% tear at the snap, the rest ring
      float snapT = uSnap >= 0.0 ? uSnap - hash11(id * 4.1) * 0.10 : -1.0;
      float L = mix(uFilL.x, uFilL.y, hk) * (1.0 + filDeform(id, c, t, snapT, tears));
      float dIn = abs(psi - 1.0 / L) / max(grad, 1e-4);
      float d = dIn * abs(dn) / sinA;
      float w0 = uFilW * (0.7 + 0.6 * hash11(id * 2.9 + 1.0));
      float w = max(w0, wpx);
      float core = exp(-d * d / (w * w)) * (w0 / w);
      float glow = exp(-d / (w0 * 6.0 + wpx)) * 0.08 * w0 / max(w0, wpx * 0.25);
      float v = core + glow;
      if (v < 2e-3) continue;
      // brightness along the strand: plasma beads drifting toward the footpoints, hot footpoints
      float bead = 0.55 + 0.45 * n3(vec3(id * 5.7, ac * 7.0 - t * 0.9 * (0.6 + hk), 3.0));
      float seg = smoothstep(-0.25, 0.35, n3(vec3(id * 2.3, c * 3.2 + t * 0.05, 7.0)));     // strands fade in and out along their length
      float hgt = (r - 1.0) / max(L - 1.0, 0.02);                                             // 0 at the footpoints, 1 at the apex
      float foot = (1.0 + 2.0 * exp(-(r - 1.0) * 14.0)) * mix(1.0, 0.35, smoothstep(0.1, 1.0, hgt));
      float br = uFil * (0.25 + 0.95 * hk * hk) * bead * seg * foot / max(sinA, 0.4);
      if (snapT >= 0.0 && tears > 0.5){
        float gap = 0.70 * (1.0 - exp(-snapT * 1.1));                                         // torn ends retract to the footpoints
        float keep = smoothstep(gap, gap + 0.05, ac);
        float endG = exp(-pow((ac - gap - 0.035) / 0.05, 2.0));                               // the torn end glows hot
        float drag = exp(-max(ac - gap, 0.0) * 7.0) * (0.5 + 0.5 * n3(vec3(id * 3.3, ac * 30.0 - snapT * 4.0, 1.0)));
        float hot = 1.0 + 6.0 * endG * exp(-snapT * 0.6) + 2.0 * drag * exp(-snapT * 0.5);      // plasma beads dragged behind it
        br *= keep * hot * mix(1.0, 0.3, 1.0 - exp(-snapT * 0.5));
      }
      vec3 fc = mix(wdIce(), vec3(0.85, 0.93, 1.0), sat(core * br * 0.08));
      acc += fc * v * br * edgeOn;
    }
  }
  return acc;
}

// ---------- surface features
// small flares: arched loops (two footpoints joined by a bright arc) on hashed kernels of a 3D grid projected onto the
// sphere, each with its own random timing: sharp rise, fast decay, flicker. The 2x2x2 neighbourhood covers every
// kernel within 0.5 lattice of q; the depth (0.3) and radius (0.2) bounds keep contributing kernels inside it (no seams).
float wdFlareMask(vec3 n, float t){
  if (uFlare <= 0.0) return 0.0;
  float F = 38.0 / max(uFlareSize, 0.3);
  vec3 q = n * F;
  vec3 b0 = floor(q - 0.5);
  float acc = 0.0;
  for (int i = 0; i < 8; i++){
    vec3 c = b0 + vec3(float(i & 1), float((i >> 1) & 1), float((i >> 2) & 1));
    if (hash13(c * 1.31 + 7.1) > 0.35 + 0.6 * uFlare) continue;       // more kernels awake as activity grows
    vec3 fp = c + 0.25 + 0.5 * hash33(c + 13.7);
    float rf = length(fp);
    if (abs(rf - F) > 0.3) continue;
    vec3 nn = fp / rf;
    vec3 dq = q - nn * F;
    if (dot(dq, dq) > 0.04) continue;
    float r2 = hash13(c * 0.77 + 3.3), r3 = hash13(c * 2.11 + 9.9);
    float ph = fract(t * (0.35 + 0.6 * r2) + r3);
    float life = smoothstep(0.0, 0.02, ph) * smoothstep(0.30, 0.04, ph);
    if (life <= 0.0) continue;
    vec3 u = normalize(cross(nn, hash33(c + 5.1) - 0.5));
    vec3 v = cross(nn, u);
    float len = 0.07 + 0.06 * hash13(c * 3.7);
    float ax = dot(dq, u) / len;
    float ar = dot(dq, v) + 0.22 * len * (1.0 - ax * ax) * (0.4 + 0.6 * life);   // a low arch that grows as the loop rises
    float along = max(abs(ax) - 1.0, 0.0) * len;
    float w = 0.011 + 0.006 * (1.0 - min(abs(ax), 1.0));
    float core = exp(-(ar * ar + along * along) / (w * w));
    float feet = exp(-((abs(ax) - 0.92) * (abs(ax) - 0.92)) / 0.03) * exp(-ar * ar / (w * w * 2.0));
    float dl = length(dq);
    float hotc = exp(-dl * dl / (len * len * 0.12));                               // white-hot kernel at the loop top
    float halo = exp(-dl / 0.05) * 0.10 * smoothstep(0.2, 0.08, dl);
    float flick = 0.55 + 0.45 * sin(t * (31.0 + 23.0 * r2) + r3 * 40.0);
    acc += (core * (0.5 + 0.7 * feet) + hotc * 0.9 + halo) * life * flick;
  }
  return acc * (0.5 + uFlare);
}

// closest approach between a ray and a segment a->b: (t along ray, s in [0,1] along segment, distance)
vec3 raySeg(vec3 ro, vec3 rd, vec3 a, vec3 b){
  vec3 ab = b - a, w = ro - a;
  float bb = dot(rd, ab), cc = dot(ab, ab), dd = dot(rd, w), ee = dot(ab, w);
  float den = max(cc - bb * bb, 1e-8);
  float s = clamp((ee - bb * dd) / den, 0.0, 1.0);
  vec3 q = a + ab * s;
  float tr = max(dot(q - ro, rd), 0.0);
  return vec3(tr, s, length(ro + rd * tr - q));
}

// the eruption above the flash point (additive, sharp pass): a fireball plus filamentary fingers and sparks
vec3 wdFlashPlume(vec3 ro, vec3 rd, float tMax, float t, float pixA){
  if (uFlash.w <= 0.0) return vec3(0.0);
  vec3 nf = uFlash.xyz;
  vec3 col = vec3(0.0);
  vec3 pf = nf * (1.0 + 0.03 + 0.12 * uFlashR);
  vec2 rp = rayPoint(ro, rd, pf);
  if (rp.x < tMax + 0.2){
    float w = 0.02 + 0.06 * uFlashR;
    col += vec3(1.0, 0.94, 0.86) * uFlash.w * 0.5 / (1.0 + rp.y * rp.y / (w * w));
  }
  if (uPlume <= 0.0) return col;
  vec3 u = normalize(cross(nf, abs(nf.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0))), v = cross(nf, u);
  for (int i = 0; i < 16; i++){
    float fi = float(i);
    vec3 h = hash33(vec3(fi * 1.71, 3.1, 9.2));
    float ang = h.x * TAU, sp = 0.12 + 0.9 * h.y * h.y;
    vec3 side = cos(ang) * u + sin(ang) * v;
    vec3 dir = normalize(nf + side * sp);
    float len = uPlume * (0.25 + 0.95 * h.z);
    vec3 A = nf * 1.005 + side * 0.015;
    // fingers bend slightly (Rayleigh-Taylor): two segments
    vec3 M = A + dir * len * 0.55 + side * len * 0.06 * (h.y - 0.5);
    vec3 B = M + normalize(dir + side * 0.15 * (h.z - 0.5)) * len * 0.45;
    vec3 s1 = raySeg(ro, rd, A, M), s2 = raySeg(ro, rd, M, B);
    vec3 sg = s1.z < s2.z ? vec3(s1.xy * vec2(1.0, 0.55), s1.z) : vec3(s2.x, 0.55 + 0.45 * s2.y, s2.z);
    if (sg.x > tMax) continue;
    float wpx = pixA * sg.x * 0.6;
    float w0 = (0.004 + 0.010 * h.y) * (1.0 + 1.5 * sg.y) * (0.6 + 0.4 * uPlume);
    float w = max(w0, wpx);
    float core = exp(-sg.z * sg.z / (w * w)) * (w0 / w);
    float glow = exp(-sg.z / (w0 * 5.0 + wpx)) * 0.15;
    float knot = 0.55 + 0.45 * n3(vec3(fi * 4.3, sg.y * 9.0 - t * 6.0, 2.0));
    float tipFade = smoothstep(1.0, 0.7, sg.y) + 1.5 * exp(-pow((sg.y - 0.97) / 0.05, 2.0));
    float heat = mix(1.15, 0.55, sg.y);                                      // white-hot base, ember tips
    col += oceanEmit(heat) * (core * knot * tipFade + glow * 0.3) * uFlash.w * 0.35;
  }
  // sparks: fast droplets with short motion streaks
  for (int i = 0; i < 20; i++){
    float fi = float(i);
    vec3 h = hash33(vec3(fi * 2.37, 11.3, 4.9));
    float ang = h.x * TAU, sp = 0.2 + 1.2 * h.y;
    vec3 dir = normalize(nf + (cos(ang) * u + sin(ang) * v) * sp);
    float dist = uPlume * (0.4 + 1.3 * h.z);
    vec3 P = nf * 1.01 + dir * dist;
    vec3 sg = raySeg(ro, rd, P - dir * (0.02 + 0.05 * uPlume), P);
    if (sg.x > tMax) continue;
    float wpx = pixA * sg.x * 0.7;
    float w0 = 0.003;
    float w = max(w0, wpx);
    col += oceanEmit(0.95 - 0.3 * h.z) * exp(-sg.z * sg.z / (w * w)) * (w0 / w) * (0.4 + sg.y) * uFlash.w * 0.5;
  }
  return col;
}

float wdFlashMask(vec3 n, float t){
  if (uFlash.w <= 0.0) return 0.0;
  float g = acos(clamp(dot(n, uFlash.xyz), -1.0, 1.0));
  float rag = fbm3(n * 9.0 + vec3(0.0, 0.0, t * 3.0), 3);
  float core = exp(-pow(g / max(uFlashR * 0.35, 1e-3), 2.0));
  float fr = g - uFlashR - rag * 0.06;
  float ring = exp(-fr * fr / pow(0.02 + 0.03 * uFlashR, 2.0)) + 0.35 * exp(-max(-fr, 0.0) * 5.0) * step(fr, 0.0);
  return uFlash.w * (core * (1.0 + 0.6 * rag) + ring * 0.9);
}

// accretion footprints at the magnetic poles (arcs where the curtains land)
vec3 wdFootprint(vec3 n, float t){
  if (uColumns <= 0.0) return vec3(0.0);
  float zc = dot(n, uMagAxis);
  float s2 = max(1.0 - zc * zc, 1e-4);
  float Ls = 1.0 / s2;
  float phi = atan(dot(n, cross(uMagAxis, uMagRef)), dot(n, uMagRef));
  float arc = smoothstep(uColL.x * 0.92, uColL.x, Ls) * smoothstep(uColL.y * 1.1, uColL.y, Ls);
  float az = exp(-pow((phi - 0.3) / 0.9, 2.0)) + exp(-pow((phi - 0.3 - PI) / 0.9, 2.0)) + exp(-pow((phi - 0.3 + PI) / 0.9, 2.0));
  return vec3(0.80, 0.90, 1.0) * uColumns * arc * az * 2.2 * (0.6 + 0.8 * smoothstep(-0.2, 0.6, n3(n * 40.0 + t * 3.0)));
}

vec3 wdSurface(vec3 n, float mu, float t){
  vec3 ns = rotY(uSpin) * n;
  float big = fbm3(ns * 1.6 + 11.0, 3);
  float mid = n3(ns * 6.5 + 3.0);
  float cm = dot(n, uMagAxis);
  float cap = smoothstep(0.80, 0.97, abs(cm));
  // smooth degenerate photosphere: clear limb darkening, deeper ice-blue toward the limb
  float limb = 0.22 + 0.78 * pow(mu, 0.8);
  vec3 c = mix(vec3(0.20, 0.42, 1.0), vec3(0.70, 0.85, 1.0), pow(mu, 0.6));
  // very low-contrast sculpting: magnetic banding, brighter polar caps, broad mottling
  float band = sin(cm * 15.0 + big * 2.5) * 0.5 + 0.5;
  float b = 1.0 + 0.08 * big + 0.03 * mid + 0.28 * cap + 0.06 * (band - 0.5);
  vec3 col = c * limb * b * uSurfGain;
  // under the ocean the floor is dim, saturated cold blue: it shows only through the narrowest cracks
  float oc = sat(uOcean * 2.0);
  col = mix(col, vec3(0.10, 0.30, 1.0) * uSurfGain * 0.4 * (0.4 + 0.6 * mu), oc);
  if (uScorch > 0.0){
    // aftermath: ablated, streaked layer of processed ash (still white-hot) and dying gold embers
    vec3 sq = ns * 5.0;
    vec3 wv = vec3(n3(sq * 0.7 + 1.0), n3(sq * 0.7 + 9.0), n3(sq * 0.7 + 17.0));
    float st = fbm3(sq + wv * 1.4, 4) * 0.5 + 0.5;
    float scar = smoothstep(0.42, 0.72, st);
    float rid = ridged3(ns * 9.0 + wv * 2.0, 3);
    col *= 1.0 - 0.55 * uScorch * scar * (0.6 + 0.4 * mu);
    col += vec3(1.0, 0.42, 0.10) * uScorch * uSurfGain * 0.20 * pow(rid, 3.0) * (0.3 + scar) * (0.3 + 0.7 * mu);
  }
  col += wdFootprint(n, t) * uSurfGain;
  col += vec3(1.0, 0.97, 0.94) * wdFlashMask(n, t) * uSurfGain;
  return col;
}

// hot spots erupting through the layer (sharp pass): n = surface direction under the pixel
vec3 wdFlares(vec3 n, float mu, float t){
  float f = wdFlareMask(n, t);
  return mix(vec3(0.40, 0.66, 1.0), vec3(0.92, 0.96, 1.0), sat(f * 1.5)) * f * uSurfGain * 14.0 * (0.4 + 0.6 * mu);
}

// ---------- convulsion: (height offset of the ocean in layer thicknesses, extra heat of the compression front)
vec2 wdConvulse(vec3 n, float t){
  if (uConv.w < 0.0 || uConvAmp <= 0.0) return vec2(0.0);
  float ts = uConv.w;
  float g = acos(clamp(dot(n, uConv.xyz), -1.0, 1.0));
  float front = g - ts * 0.75;
  // a sharp compression ring racing outward, with a trailing ripple train
  float ring = exp(-front * front / 0.003) + 0.35 * sin(front * 30.0) * exp(max(front, -1.0) * 5.0) * step(front, 0.0);
  ring *= exp(-ts * 0.4);
  // the whole layer heaves: bulges out and recoils, strongest near the origin
  float heave = sin(ts * 6.5) * exp(-ts * 1.0) * (0.45 + 0.55 * exp(-g * g * 0.8));
  return vec2(uConvAmp * (ring * 1.3 + heave * 1.4), exp(-front * front / 0.004) * exp(-ts * 0.35));
}

// ---------- accreted hydrogen ocean
// Thin layer (thickness ~ a quarter of a convective cell). Returns the top height in mean layer thicknesses; heat out.
// macro: large-scale activity (0..1) for this ray; lod: 0 = full detail, 1 = pattern below pixel size.
// crack: lane centres where the layer thins to nothing and the cold-blue floor shows through.
float oceanField(vec3 n, vec3 warp, float t, float macro, float lod, out float heat){
  vec3 q = n * uTurbF + warp;
  float tv = t * uTurbV;
  vec2 c = cells3(q * 0.55 + vec3(0.0, tv * 0.10, tv * 0.07));
  vec2 c2 = cells3(q * 1.35 + vec3(5.0, tv * 0.21, -tv * 0.15));
  float bill = fbm3(q * 1.25 + vec3(tv * 0.30, -tv * 0.18, tv * 0.22), 3);   // turbulent billows
  float lw = mix(0.10, 0.20, macro);
  float laneC = smoothstep(0.0, lw, c.y) * mix(1.0, smoothstep(0.0, 0.16, c2.y), 0.45 * (1.0 - macro));
  float laneS = smoothstep(-0.30, 0.22, bill + 0.12 * (c2.y - 0.3));          // thin swirls before convection sets in
  float lane = mix(laneS, laneC, uCells);
  float coreC = (1.0 - smoothstep(0.0, 0.9, c.x)) * (0.7 + 0.3 * (1.0 - c2.x));
  float coreS = smoothstep(-0.05, 0.5, bill);
  float core = mix(coreS, coreC, uCells);
  float crack = mix(1.0 - smoothstep(-0.48, -0.30, bill), 1.0 - smoothstep(0.0, 0.035, c.y), uCells);
  // compressive shimmer: interfering pressure-wave trains racing across the layer
  float sw = 0.5 * sin(dot(q, vec3(0.31, 0.12, 0.27)) * 1.9 - t * 5.0 + bill * 4.0)
           + 0.5 * sin(dot(q, vec3(-0.17, 0.33, 0.11)) * 2.3 - t * 6.3 + bill * 3.0);
  float fil = 1.0 - abs(n3(q * 3.1 + vec3(bill * 2.0, tv * 0.5, 0.0)));
  fil = fil * fil; fil *= fil; fil *= fil;                     // thin bright plasma threads inside the cells
  heat = 0.05 + 0.36 * lane + 0.44 * lane * core * core + 0.08 * bill + 0.10 * fil * lane + 0.04 * sw * uOcean + 0.10 * macro;
  float top = 0.42 + 0.72 * lane + 0.30 * bill + 0.10 * sw - 0.40 * crack * (1.0 - lod);
  heat = mix(heat, 0.52 + 0.10 * macro, lod);
  return mix(top, 0.95, lod);
}

// mean of sat(u) for u varying linearly from uA to uB across a ray step (exact coverage, no contour slicing)
float coverG(float u){ return u <= 0.0 ? 0.0 : (u < 1.0 ? 0.5 * u * u : u - 0.5); }
float coverMean(float uA, float uB){
  float du = uB - uA;
  if (abs(du) < 1e-3) return sat(0.5 * (uA + uB));
  return (coverG(uB) - coverG(uA)) / du;
}

// emission-absorption raymarch through the layer. returns (radiance, transmittance)
vec4 wdOcean(vec3 ro, vec3 rd, float tSurf, float t, float pixA){
  if (uOcean <= 0.0) return vec4(0.0, 0.0, 0.0, 1.0);
  float Hm = uOceanH * uOcean;
  float Hx = Hm * (1.75 + uConvAmp * 1.6);
  vec2 hh = sphereHit(ro, rd, vec3(0.0), 1.0 + Hx);
  if (hh.y <= 0.0 || hh.x > tSurf) return vec4(0.0, 0.0, 0.0, 1.0);
  float t0 = max(hh.x, 0.0), t1 = min(hh.y, tSurf);
  const int N = 22;
  float tCap = t0 + float(N) * Hm * 0.30;                   // grazing rays: march the first stretch, the rest is opaque
  bool capped = t1 > tCap;
  t1 = min(t1, tCap);
  // per-ray domain warp, large-scale structure and convulsion, evaluated mid-layer
  vec2 hmid = sphereHit(ro, rd, vec3(0.0), 1.0 + Hm * 0.6);
  float tm = hmid.x > 0.0 && hmid.x < t1 ? hmid.x : mix(t0, t1, 0.5);
  vec3 pm = ro + rd * tm;
  vec3 nm = normalize(pm);
  vec3 q0 = nm * uTurbF * 0.19;
  float tv = t * uTurbV;
  vec3 warp = vec3(n3(q0 + vec3(tv * 0.05, 0.0, 0.0)), n3(q0 + vec3(0.0, 17.0, tv * 0.04)), n3(q0 + vec3(41.0, tv * 0.03, 0.0))) * 2.4;
  vec3 q1 = q0 * 3.1 + warp * 0.6;
  warp += vec3(n3(q1 + vec3(0.0, 0.0, tv * 0.12)), n3(q1 + vec3(13.0, tv * 0.1, 0.0)), n3(q1 + vec3(tv * 0.09, 29.0, 0.0))) * 0.9;
  warp *= uWarp;
  float macro = smoothstep(-0.35, 0.45, fbm3(nm * uTurbF * 0.07 + vec3(3.0, 7.0, tv * 0.02), 2));
  float bigH = 0.0;
  if (uBig > 0.0){
    float cm = dot(nm, uMagAxis);
    float belt = exp(-cm * cm / 0.05);
    float cap = smoothstep(0.72, 0.95, abs(cm));
    float bpatch = fbm3(rotY(uSpin) * nm * 2.4 + vec3(5.0, 1.0, tv * 0.02), 3);
    bigH = uBig * (0.13 * belt - 0.32 * cap + 0.22 * bpatch);
  }
  vec2 cv = wdConvulse(nm, t);
  float foot = pixA * tm / max(abs(dot(rd, nm)), 0.08);                  // pixel footprint on the layer
  float lod = smoothstep(0.12, 0.6, foot * uTurbF * 0.55);
  float sigma0 = (1.6 + 5.0 * uOcean) / Hm;
  float dt = (t1 - t0) / float(N);
  float j = 0.5 + 0.6 * (ignStatic(gl_FragCoord.xy) - 0.5);           // static mild jitter: no frame-to-frame crawl
  vec3 acc = vec3(0.0); float T = 1.0;
  vec3 S = vec3(0.0);
  float hb = 0.22 * uOceanHeat + bigH + 0.35 * cv.y;
  for (int i = 0; i < N; i++){
    float ts = t0 + (float(i) + j) * dt;
    vec3 p = ro + rd * ts;
    float r = length(p); vec3 n = p / r;
    float heat;
    float top = oceanField(n, warp, t, macro, lod, heat) + cv.x;
    float hA = (length(p - rd * (dt * 0.5)) - 1.0) / Hm, hB = (length(p + rd * (dt * 0.5)) - 1.0) / Hm;
    float dens = coverMean((top - hA) * 3.0, (top - hB) * 3.0);
    if (dens <= 0.002) continue;
    float g3 = n3(p * (uTurbF * 4.1) + vec3(0.0, tv * 0.6, 0.0));        // 3D grain so emission is not extruded
    float skin = smoothstep(top - 0.45, top, 0.5 * (hA + hB));            // hot compressed skin near the top
    float hh2 = heat * (0.86 + 0.22 * skin) + 0.05 * g3 + hb + 0.10 * max(cv.x, 0.0);
    S = oceanEmit(hh2) * uOceanGain;
    float a = 1.0 - exp(-sigma0 * dens * dt);
    acc += T * S * a;
    T *= 1.0 - a;
    if (T < 0.02) break;
  }
  if (capped){
    // the rest of a grazing ray is optically thick: finish with the layer's mean glow (also the far-field LOD)
    vec3 Sm = oceanEmit(0.56 + 0.10 * macro + hb) * uOceanGain;
    // only rays that dip below the mean top are opaque; rays skimming above the limb stay clear
    float bmin = length(ro + rd * max(dot(-ro, rd), 0.0));
    float fill = tSurf < 1e8 ? 1.0 : smoothstep(1.25, 0.65, (bmin - 1.0) / Hm);
    acc += T * (dot(S, S) > 0.0 ? mix(S, Sm, 0.5) : Sm) * fill; T *= 1.0 - fill;
  }
  // the flash and the accretion footprints heat the layer from below
  if (uFlash.w > 0.0 || uColumns > 0.0)
    acc += (vec3(1.0, 0.95, 0.88) * wdFlashMask(nm, t) + wdFootprint(nm, t)) * uSurfGain * (1.0 - T);
  return vec4(acc, T);
}

// ---------- full-resolution detail over the soft (low-res) ocean: granulation and fine plasma threads
vec3 wdDetail(vec3 ro, vec3 rd, vec3 low, float t, float pixA){
  if (uDetail <= 0.0 || uOcean <= 0.0) return low;
  float Hm = uOceanH * uOcean;
  vec2 hs = sphereHit(ro, rd, vec3(0.0), 1.0 + Hm * 0.9);
  if (hs.y <= 0.0) return low;
  float th = hs.x > 0.0 ? hs.x : hs.y;
  vec3 n = normalize(ro + rd * th);
  float F = uTurbF * 5.0;
  float foot = pixA * th / max(abs(dot(rd, n)), 0.1);
  float fade = 1.0 - smoothstep(0.25, 0.9, foot * F);
  if (fade <= 0.0) return low;
  float tv = t * uTurbV;
  vec3 q = n * F + vec3(0.0, tv * 0.45, tv * 0.3);
  float g1 = n3(q), g2 = n3(q * 2.3 + 7.0);
  // sparse plasma threads: thin ridges, warped and masked so they read as strands, not a caustic web
  vec3 qw = q * 0.35 + vec3(g1 * 1.4, 3.0, tv * 0.25);
  float tr = 1.0 - abs(n3(qw));
  tr = tr * tr; tr *= tr; tr *= tr; tr *= tr;
  tr *= smoothstep(0.15, 0.55, n3(q * 0.09 + vec3(7.0, tv * 0.05, 1.0)));
  float k = uDetail * fade;
  return low * max(1.0 + k * (0.55 * g1 + 0.30 * g2), 0.15) + low * tr * k * 0.9;
}

// ---------- accretion curtains: gas threaded onto field lines at r ~ L, falling along them onto the magnetic poles.
// Irregular: each stream has its own meridional plane (random azimuth around two uneven curtains), L, width and
// brightness; clumps with real gaps, a diffuse sheath that narrows toward the pole, some streams fragment.
vec3 wdColumns(vec3 ro, vec3 rd, float tMax, float pixA, float t){
  if (uColumns <= 0.0) return vec3(0.0);
  vec3 m = uMagAxis, a = uMagRef, b = cross(m, a);
  vec3 acc = vec3(0.0);
  for (int j = 0; j < 11; j++){
    float fj = float(j);
    vec3 h = hash33(vec3(fj * 3.7 + 1.0, 2.3, 5.1));
    float phi = 0.3 + (j < 6 ? 0.0 : PI) + (h.x - 0.5) * (j < 6 ? 1.3 : 0.9);
    vec3 e = cos(phi) * a + sin(phi) * b;
    vec3 N = cross(m, e);
    float dn = dot(rd, N);
    if (abs(dn) < 1e-5) continue;
    float tp = -dot(ro, N) / dn;
    if (tp <= 0.0 || tp > tMax) continue;
    vec3 p = ro + rd * tp;
    float x = dot(p, e), z = dot(p, m);
    if (x <= 0.0) continue;
    float r = length(vec2(x, z));
    if (r < 1.0) continue;
    float s = x / r, c = z / r;
    float psi = s * s / r;
    float grad = s * sqrt(1.0 + 3.0 * c * c) / (r * r);
    vec3 T = normalize(3.0 * s * c * e + (2.0 * c * c - s * s) * m);
    float sinA = max(length(cross(rd, T)), 0.4);
    float wpx = pixA * tp * 0.6;
    float L = mix(uColL.x, uColL.y, h.y);
    float dIn = abs(psi - 1.0 / L) / max(grad, 1e-4);
    float d = dIn * abs(dn) / sinA;
    float fall = sat((1.0 - r / L) / (1.0 - 1.0 / L));            // 0 where threaded, 1 at the pole
    float w0 = 0.0035 * L * mix(1.0, 0.3, fall) * (0.6 + 0.9 * h.z);  // the stream narrows as the flux tube converges
    float w = max(w0, wpx);
    float core = exp(-d * d / (w * w)) * (w0 / w);
    float ws = w0 * 7.0 * mix(1.0, 0.35, fall) + wpx;               // broad diffuse sheath
    float sheath = exp(-d * d / (ws * ws)) * 0.06;
    float glow = exp(-d / (w0 * 4.0 + wpx)) * 0.12;
    if (core + sheath + glow < 2e-3) continue;
    float ac = abs(c);
    float speed = 3.0 + 6.0 * fall;
    float cn = n3(vec3(fj * 3.3, ac * 6.0 - t * speed, 1.0)) * 0.5 + 0.5;
    float clump = smoothstep(0.38, 0.72, cn);                        // real gaps between clumps
    float frag = h.z > 0.68 ? smoothstep(0.45, 0.65, n3(vec3(fj * 7.1, ac * 22.0 - t * speed * 1.4, 4.0)) * 0.5 + 0.5) : 1.0;
    float bri = 0.35 + 0.9 * hash11(fj * 7.7 + 3.0);
    float detach = smoothstep(0.0, 0.12, fall);                      // fades in where the gas leaves the disk plane
    float heat = 0.55 + 0.55 * fall * fall;
    vec3 sc = mix(oceanEmit(heat), vec3(0.75, 0.88, 1.0) * 6.0, smoothstep(0.85, 1.0, fall));
    acc += sc * (core * clump * frag * (0.4 + 2.0 * pow(fall, 4.0)) + (glow * (0.3 + clump) + sheath) * 0.5) * detach * bri;
  }
  return acc * uColumns;
}

// ---------- the new stream thread in the orbital plane (y = 0)
vec3 wdThread(vec3 ro, vec3 rd, float tMax, float pixA, float t){
  if (uThread <= 0.0 || abs(rd.y) < 1e-4) return vec3(0.0);
  float tp = -ro.y / rd.y;
  if (tp <= 0.0 || tp > tMax || tp > 8.0 * length(ro)) return vec3(0.0);
  vec2 p = (ro + rd * tp).xz;
  float best = 1e9, sBest = 0.0; vec2 tan2 = vec2(1.0, 0.0);
  for (int i = 0; i < 39; i++){
    vec2 a = uThreadPts[i], b = uThreadPts[i + 1];
    vec2 ab = b - a; float l = length(ab);
    float h = clamp(dot(p - a, ab) / (l * l), 0.0, 1.0);
    float d = length(p - a - ab * h);
    if (d < best){ best = d; sBest = (float(i) + h) / 39.0; tan2 = ab / l; }
  }
  if (best > 0.8) return vec3(0.0);                                // far-field: no glow along the plane's vanishing line
  vec3 T3 = vec3(tan2.x, 0.0, tan2.y);
  float sinA = max(length(cross(rd, T3)), 0.15);
  float d = best * abs(rd.y) / sinA;
  // width varies along the stream, clumps with real gaps flow toward the dwarf
  float nw = n3(vec3(sBest * 30.0 - t * 0.8, 4.0, 1.0)) * 0.5 + 0.5;
  float w0 = 0.004 * (1.0 + 1.4 * (1.0 - sBest)) * (0.55 + 0.9 * nw), wpx = pixA * tp * 0.6;
  float w = max(w0, wpx);
  float core = exp(-d * d / (w * w)) * (w0 / w);
  float cl = n3(vec3(sBest * 60.0 - t * 1.6, 2.0, 5.0)) * 0.5 + 0.5;
  float clumps = smoothstep(0.40, 0.72, cl) * (0.6 + 0.4 * (n3(vec3(sBest * 170.0 - t * 4.0, 7.0, 1.0)) * 0.5 + 0.5));
  float glow = exp(-d / (w0 * 7.0 + wpx)) * 0.10 * (0.3 + clumps);
  float ws = w0 * 16.0 + wpx * 2.0;
  float sheath = exp(-d * d / (ws * ws)) * 0.035;                  // faint gold sheath
  // the head: a taper of separating beads running ahead
  float ahead = sBest - uThread;
  float body = smoothstep(0.03, -0.02, ahead);
  float beads = smoothstep(0.55, 0.9, sin(ahead * 260.0 - t * 3.0) * 0.5 + 0.5) * exp(-max(ahead, 0.0) / 0.025) * step(-0.02, ahead);
  float bodyCl = mix(clumps, 1.0, 0.25 * body);
  vec3 cC = mix(vec3(0.85, 0.07, 0.018), vec3(1.0, 0.45, 0.11), smoothstep(0.25, 0.95, sBest));
  vec3 cG = vec3(1.0, 0.55, 0.16);
  float far = smoothstep(0.8, 0.2, best);
  return (cC * (core * (bodyCl * body + beads * 1.3) * 1.8 + glow * 0.6 * (body + beads)) + cG * sheath * body)
         / max(sinA, 0.4) * uThreadGain * far;
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
