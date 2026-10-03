// Close-in accretion vortex around the white dwarf (local frame: dwarf at origin, disk in XZ, Y up).
// Units: disk outer radius ~ uRout (~1). Rotation counter-clockwise seen from +Y (positive angle about +Y).
// Model
//  * Emitting/absorbing gas: radiance integrates the source function S(T) against optical depth, so cool gas
//    silhouettes against hot gas. Structure is carried by TEMPERATURE contrast: thin hot dissipative sheets
//    (current sheets / shocks: zero-crossing surfaces of warped, flow-stretched noise) inside cold, dark,
//    absorbing diffuse gas. Sheets are pre-integrated between consecutive samples (analytic integral of the sheet
//    profile across the noise values at both ends), so they stay crisp and alias-free with coarse steps.
//  * Keplerian shear: angular speed = uOmega * r^-1.5. Turbulence lives in log-polar coordinates (eddies scale with
//    r; 8 lattice cells around keeps phi seamless) and is advected by two cross-faded layers (no winding problem).
//  * Trailing logarithmic spiral arms (shock heated), hot puffed inner rim, irradiated flared skin, magnetic
//    accretion curtains along dipole field lines onto the poles, optional L1 stream + impact hot spot at the rim.
//  * Display temperature -> colour: crimson -> ember -> molten gold -> white -> ice blue; brightness ~ T^2.6.
export const VORTEX = `
uniform float uTau;        // disk time (seconds, may run faster/slower than film time)
uniform float uOmega;      // angular speed at r = 1 (rad per disk-second)
uniform float uCycle;      // advection layer life (disk-seconds)
uniform float uRin, uRout; // inner (magnetospheric) and outer radius
uniform float uH0, uFlare; // scale height H = uH0 * r^uFlare
uniform float uRimPuff;    // extra thickness of the hot inner rim
uniform float uDens;       // optical depth per unit length scale
uniform float uDensExp;    // midplane density ~ r^-uDensExp
uniform float uTout;       // display temperature at the outer edge (K)
uniform float uTinK;       // steep inner rise: T *= 1 + uTinK*(rin/r)^2
uniform float uHeat;       // global temperature multiplier (flares)
uniform float uTurb;       // lognormal contrast of the diffuse gas
uniform float uArms, uArmM, uArmPitch, uArmSpeed; // spiral arms: strength, count, pitch (rad), pattern speed
uniform float uArmFloor;   // inter-arm density fraction
uniform float uArmHeat;    // spiral shock heating
uniform float uCurtain;    // magnetic curtain brightness
uniform float uCurtainSpin;// magnetosphere angular speed
uniform float uDwarfSurf;  // dwarf surface brightness
uniform float uHot;        // stream + hot spot strength (0 = none)
uniform float uHotPhi;     // azimuth of the impact point on the rim
uniform vec3 uStreamDir;   // stream velocity direction (unit, toward the impact)
uniform float uStreamW;    // stream half width
uniform float uShutter;    // per-pixel time jitter (disk-seconds) -> motion blur of the flow
uniform float uRb;         // radial bound of the gas
uniform float uLod;        // step growth with distance (fraction of t)
uniform float uStepK;      // step = uStepK * H inside the gas
uniform float uSeedV;
uniform float uEdgeFade;   // outer edge softness
uniform float uGrain3;     // fine filament octave strength
uniform float uIrr;        // irradiation (scattered central light) strength
uniform float uVoid;       // void threshold of the diffuse gas
uniform float uPuff;       // vertical billow strength
uniform float uFloor, uSheet, uSheetHeat; // diffuse gas, luminous sheets, sheet heating
uniform float uSheetW;     // sheet half-thickness in noise units (~0.13 = 1 sigma)
uniform float uColdGas;    // temperature factor of the diffuse gas between sheets
uniform float uFloorMid;   // cold dense midplane layer
uniform float uSheetMask;  // sheets only in coherent patches (-1 = everywhere)
uniform float uMaxSteps;   // march step cap (<= 52)
uniform float uKr, uKy;    // radial (per unit ln r) and vertical (per unit y/r) lattice frequency of the sheets

vec3 vxColor(float T){
  vec3 c0 = vec3(0.30, 0.012, 0.006);   // 1300 K abyssal crimson
  vec3 c1 = vec3(0.85, 0.055, 0.016);   // 1800 K crimson
  vec3 c2 = vec3(1.00, 0.20, 0.035);    // 2400 K ember
  vec3 c3 = vec3(1.00, 0.46, 0.11);     // 3200 K molten gold
  vec3 c4 = vec3(1.00, 0.63, 0.27);     // 4800 K white-gold
  vec3 c5 = vec3(1.00, 0.93, 0.86);     // 7500 K white
  vec3 c6 = vec3(0.74, 0.86, 1.00);     // 12000 K blue-white
  vec3 c7 = vec3(0.46, 0.66, 1.00);     // 20000 K ice
  if (T < 1800.0) return mix(c0, c1, sat((T - 1300.0) / 500.0));
  if (T < 2400.0) return mix(c1, c2, (T - 1800.0) / 600.0);
  if (T < 3200.0) return mix(c2, c3, (T - 2400.0) / 800.0);
  if (T < 4800.0) return mix(c3, c4, (T - 3200.0) / 1600.0);
  if (T < 7500.0) return mix(c4, c5, (T - 4800.0) / 2700.0);
  if (T < 12000.0) return mix(c5, c6, (T - 7500.0) / 4500.0);
  return mix(c6, c7, sat((T - 12000.0) / 8000.0));
}
vec3 vxEmit(float T){ return vxColor(T) * 0.35 * pow(max(T, 600.0) / 2200.0, 2.6); }

float diskH(float r){
  float h = uH0 * pow(r, uFlare);
  return h * (1.0 + uRimPuff * exp(-pow((r - uRin * 1.15) / (0.45 * uRin), 2.0)));
}

// stream + hot spot geometry (local frame)
vec3 hotPos(){ return vec3(cos(uHotPhi), 0.0, -sin(uHotPhi)) * uRout * 0.97; }

// conservative-ish distance to any gas (0 inside the bounding shell)
float gasGap(vec3 p, float r){
  float H = diskH(r);
  float g = max(abs(p.y) - 4.2 * H, max(r - min(uRb, uRout * 1.3), uRin * 0.62 - r));
  if (uHot > 0.0){
    vec3 d = p - hotPos();
    float s = dot(d, -uStreamDir);
    float dl = length(d + uStreamDir * s);
    float gs = (s > -0.15) ? dl - uStreamW * (3.5 + 2.0 * max(s, 0.0)) : length(d) - 0.25;
    g = min(g, max(gs, 0.0));
    g = min(g, max(length(d) - 0.35, 0.0));
  }
  return max(g, 0.0);
}

// smoothstep(w,0,|x|) sheet profile: antiderivative and segment average (pre-integration)
float shCDF(float x, float w){ float a = min(abs(x), w); float q = a / w; return sign(x) * a * (1.0 - q * q + 0.5 * q * q * q); }
float shPoint(float x, float w){ float a = min(abs(x) / w, 1.0); return 1.0 - a * a * (3.0 - 2.0 * a); }
float shAvg(float x0, float x1, float w){
  float d = x1 - x0;
  if (abs(d) < 0.02 * w) return shPoint(0.5 * (x0 + x1), w);
  return (shCDF(x1, w) - shCDF(x0, w)) / d;
}

// gas field at p seen along rd: x = extinction (per unit length), y = display temperature (K),
// z = scattered central light from the irradiated flared skin.
// xs/xf carry the sheet coordinates of the previous sample along the ray (pre-integration); hasPrev = continuity.
vec3 vxField(vec3 p, vec3 rd, float tau, float seg, inout vec4 xs, inout vec2 xf, bool hasPrev){
  float r = length(p.xz);
  float H = diskH(r);
  float phi = atan(-p.z, p.x);
  float lr = log(max(r, 1e-3));
  float om = uOmega * pow(max(r, uRin * 0.5), -1.5);
  float yv = p.y / max(r, 1e-3);
  float ph = tau / uCycle;
  // LOD: how many lattice cells the segment spans along the ray -> fade sheets to their mean (prefilter)
  vec2 radial = p.xz / max(r, 1e-4);
  float rdr = dot(rd.xz, radial), rdt = rd.x * radial.y - rd.z * radial.x;
  float rate = length(vec3(uKr * rdr, 1.27 * rdt, uKy * rd.y)) / max(r, 1e-3);
  float k1 = sat(seg * rate * 1.6 - 0.35), k2 = sat(seg * rate * 4.8 - 0.35);
  float n = 0.0, puff = 0.0, sheet = 0.0, fine = 0.0, w2 = 0.0;
  vec4 xsn = vec4(0.0); vec2 xfn = vec2(0.0);
  for (int i = 0; i < 2; i++){
    float fi = float(i);
    float f = fract(ph + 0.5 * fi);
    float w = 1.0 - abs(2.0 * f - 1.0);
    float id = floor(ph + 0.5 * fi) * 2.0 + fi;
    vec3 off = floor(hash33(vec3(id, uSeedV, 3.7)) * 64.0);
    float a = phi - om * f * uCycle;
    vec3 q = vec3(lr * uKr, a * (8.0 / TAU), yv * uKy) + off;
    vec4 A = n4(q * vec3(0.5, 1.0, 0.5));
    q += (A.rgb - 0.5) * vec3(1.6, 0.9, 1.4);
    vec4 B = n4(q);
    vec4 C = n4(q * 3.0 + 17.0);
    float t = (B.r - 0.5) * 1.1 + (B.b - 0.5) * 0.6 + ((C.r - 0.5) * 0.42 + (C.b - 0.5) * 0.24) * uGrain3;
    vec2 x = vec2(B.r - 0.5, B.b - 0.5);
    float xc = C.r - 0.5;
    vec2 x0 = i == 0 ? xs.xy : xs.zw;
    float xc0 = i == 0 ? xf.x : xf.y;
    float s1, s1b, s2;
    if (hasPrev){ s1 = shAvg(x0.x, x.x, uSheetW); s1b = shAvg(x0.y, x.y, uSheetW * 1.2); s2 = shAvg(xc0, xc, 0.09); }
    else { s1 = shPoint(x.x, uSheetW); s1b = shPoint(x.y, uSheetW * 1.2); s2 = shPoint(xc, 0.09); }
    s1 = mix(s1, 3.07 * uSheetW, k1); s1b = mix(s1b, 3.68 * uSheetW, sat(k1 * 1.5)); s2 = mix(s2, 0.276, k2);
    if (i == 0){ xsn.xy = x; xfn.x = xc; } else { xsn.zw = x; xfn.y = xc; }
    sheet += w * (s1 + 0.5 * s1b) * (0.35 + 1.1 * s2 * uGrain3);
    n += w * t; puff += w * (A.b - 0.5); fine += w * s2; w2 += w * w;
  }
  xs = xsn; xf = xfn;
  float nrm = inversesqrt(w2);
  n *= nrm; puff *= nrm; sheet *= mix(1.0, nrm, 0.5);
  // spiral arms (trailing, CCW) perturbed by turbulence
  float psi = uArmM * (phi + lr / tan(uArmPitch) - uArmSpeed * tau) + 1.9 * n;
  float armP = pow(0.5 + 0.5 * cos(psi), 3.0);
  float arm = mix(1.0, mix(uArmFloor, 2.2, armP), uArms);
  // radial profile: inner truncation at the magnetosphere, ragged outer edge
  float rin = uRin * (1.0 + 0.12 * puff);
  float edge = uRout * (1.0 + 0.12 * puff + 0.06 * n);
  float sig = smoothstep(rin * 0.92, rin * 1.22, r) * (1.0 - smoothstep(edge - uEdgeFade, edge, r));
  // stream impact: shock-heated, compressed, splashed-up region of the disk's own turbulent sheets
  float hinf = 0.0;
  if (uHot > 0.0){
    float dphi = phi - uHotPhi; dphi = mod(dphi + PI, TAU) - PI;
    float down = exp(-max(dphi, 0.0) * 2.6) * exp(-max(-dphi, 0.0) * 16.0);
    float rr = (r - uRout * 0.95) / (0.07 + 0.10 * max(dphi, 0.0));
    hinf = uHot * exp(-rr * rr) * down * exp(-pow(p.y / 0.07, 2.0));
  }
  float Heff = H * max(0.15, 1.0 + uPuff * (1.5 * puff + 0.6 * n)) * (1.0 + 0.3 * uArms * armP) * (1.0 + 0.6 * hinf);
  float zz = abs(p.y) / max(Heff, 1e-4);
  float vert = exp(-0.5 * zz * zz);
  float clump = exp(uTurb * (n * 3.6 - 0.5)) * smoothstep(uVoid - 0.25, uVoid + 0.25, n + 0.3 * puff);
  float patchy = smoothstep(uSheetMask - 0.18, uSheetMask + 0.18, puff * 1.4 + 0.5 * n);
  float zm = abs(p.y) / max(0.55 * Heff, 1e-4);
  float rf = (uFloor + uFloorMid * exp(-0.5 * zm * zm)) * clump, rs = uSheet * sheet * patchy;
  float ws = rs / max(rf + rs, 1e-5);          // fraction of the sample in hot sheets
  rs *= 1.0 + 4.0 * hinf;
  ws = rs / max(rf + rs, 1e-5);
  float rho = uDens * pow(r, -uDensExp) * sig * vert * arm * (rf + rs);
  float rT = max(r, rin);
  float T = uTout * pow(rT / uRout, -0.55) * (1.0 + uTinK * (uRin / rT) * (uRin / rT));
  // cold diffuse gas vs. hot dissipative sheets: temperature contrast is what makes structure visible
  T *= mix(uColdGas, 1.0 + uSheetHeat, ws) * (1.0 + 0.12 * n + 0.10 * fine + uArmHeat * uArms * armP);
  T *= 1.0 + 0.6 * exp(-pow((r - rin * 1.1) / (0.25 * uRin), 2.0));   // hot inner wall
  T *= 1.0 + 0.9 * hinf * (0.4 + ws);                                       // shock heating at the impact
  // irradiation of the flared skin by the dwarf + inner disk (radial optical depth ~ smooth vertical profile)
  float z0 = abs(p.y) / max(H, 1e-4);
  float lit = exp(-uDens * 2.6 * exp(-0.5 * z0 * z0 * z0) * (0.5 + 0.9 * sat(n + 0.5)));
  float cth = dot(normalize(p), -rd);
  float hg = 0.8775 / pow(1.1225 - 0.7 * cth, 1.5);
  float scat = uIrr * lit * hg * pow(uRin / max(r, uRin), 2.0) * sig;
  if (uHot > 0.0){
    vec3 d = p - hotPos();
    // incoming stream: a turbulent tube along -uStreamDir with flow-aligned striations moving into the impact
    float s = dot(d, -uStreamDir);
    vec3 perp = d + uStreamDir * s;
    vec3 sideV = normalize(cross(uStreamDir, vec3(0.0, 1.0, 0.0)));
    float ph1 = dot(perp, sideV), ph2 = perp.y;
    float w = uStreamW * (1.0 + 0.6 * max(s, 0.0));
    float along = s * 3.0 + tau * 1.6;
    float sn = n3(vec3(along, ph1 / w * 0.7, ph2 / w * 0.7)) * 0.6
             + n3(vec3(along * 2.7 + 5.0, ph1 / w * 1.5, ph2 / w * 1.5)) * 0.3
             + n3(vec3(along * 0.8 + 9.0, ph1 / w * 0.35, ph2 / w * 0.35)) * 0.4;
    float tube = exp(-(ph1 * ph1 + ph2 * ph2) / (w * w * (1.0 + 0.6 * sn))) * smoothstep(-0.02, 0.03, s);
    float srho = uHot * 30.0 * tube * exp(2.2 * sn - 0.3);
    float Ts = 2900.0 + 900.0 * sn + 2500.0 * exp(-max(s, 0.0) * 14.0);
    float tot = rho + srho;
    T = (T * uHeat * rho + Ts * srho) / max(tot, 1e-5) / uHeat;
    scat *= rho / max(tot, 1e-5);
    rho = tot;
  }
  return vec3(rho, T * uHeat, scat);
}

// ---------------- magnetic accretion curtains (dipole field lines, axis +Y) ----------------
vec3 vxCurtain(vec3 ro, vec3 rd, float tMax, float jit){
  float Rm = uRin * 1.55;
  vec2 h = sphereHit(ro, rd, vec3(0.0), Rm);
  if (h.x > h.y || h.y < 0.0) return vec3(0.0);
  float t0 = max(h.x, 0.0), t1 = min(h.y, tMax);
  if (t1 <= t0) return vec3(0.0);
  const int N = 34;
  float dt = (t1 - t0) / float(N);
  vec3 acc = vec3(0.0);
  for (int i = 0; i < N; i++){
    vec3 p = ro + rd * (t0 + (float(i) + jit) * dt);
    float r = length(p);
    if (r < uDwarfR * 1.02) continue;
    float s2 = dot(p.xz, p.xz) / (r * r);
    float L = r / max(s2, 1e-3);
    float m = smoothstep(uRin * 0.82, uRin * 0.98, L) * (1.0 - smoothstep(uRin * 1.12, uRin * 1.45, L));
    if (m <= 0.0) continue;
    float phi = atan(-p.z, p.x) - uCurtainSpin * uTau;
    float c = abs(p.y) / r;   // ~ |cos theta|: 0 at the disk, 1 at the poles
    vec3 q = vec3(cos(phi) * 24.0, sin(phi) * 24.0, L / uRin * 14.0);
    float fil = n3(q) * 0.65 + n3(q * vec3(2.3, 2.3, 1.7) + vec3(0.0, 0.0, c * 2.0 - uTau * 1.5)) * 0.35;
    fil = pow(sat(fil * 1.0 + 0.5), 7.0);
    float flow = 0.6 + 0.4 * n3(vec3(phi * 5.0, c * 9.0 - uTau * 5.0, L * 40.0));
    float fall = pow(uRin / r, 1.6);
    float bundle = 0.35 + 0.65 * pow(0.5 + 0.5 * cos(phi * 2.0 + 0.6 * sign(p.y)), 2.0);
    acc += m * fil * flow * fall * bundle * dt;
  }
  return acc * C_ICE * uCurtain * 900.0 / max(uRin, 1e-3);
}

// ---------------- the dwarf ----------------
vec3 vxDwarfSurface(vec3 ro, vec3 rd, vec2 h){
  vec3 n = normalize(ro + rd * max(h.x, 0.0) - uDwarfPos);
  float mu = sat(dot(n, -rd));
  vec3 nq = rotY(uCurtainSpin * uTau) * n;
  float g = n3(nq * 22.0) * 0.5 + n3(nq * 61.0) * 0.25;
  float caps = smoothstep(0.80, 0.97, abs(n.y));
  float ring = exp(-pow((abs(n.y) - 0.9) / 0.04, 2.0));
  vec3 c = dwarfColor() * (0.45 + 0.55 * pow(mu, 0.5)) * (1.0 + 0.25 * g);
  return (c + C_ICE * (caps * 0.8 + ring * 2.5)) * 420.0 * uDwarfSurf * uDwarfLum;
}
// point-source glow consistent with lib/dwarf.glsl.js (core suppressed once the sphere is resolved)
vec3 vxDwarfGlow(vec3 ro, vec3 rd, float pixAngle, float pixRender){
  vec3 d = uDwarfPos - ro;
  float t = dot(d, rd);
  if (t <= 0.0) return vec3(0.0);
  float dist = length(d);
  float front = smoothstep(0.0, 0.5, t / dist);
  float ang = length(cross(rd, d / dist));
  float angR0 = max(uDwarfR / dist, pixAngle * 0.8);
  float angR = max(angR0, pixRender * 0.75);                 // never thinner than a render pixel (no flicker)
  float resolved = smoothstep(1.2, 3.0, uDwarfR / dist / pixAngle);
  float core = exp(-pow(ang / angR, 2.0)) * 220.0 * (angR0 * angR0) / (angR * angR) * (1.0 - resolved);
  float halo = 1.0 / (1.0 + pow(ang / max(pixAngle * 6.0, angR * 1.6), 2.0)) * 2.2;
  float wide = 1.0 / (1.0 + pow(ang / max(pixAngle * 60.0, angR * 12.0), 2.0)) * 0.12;
  return dwarfColor() * (core + halo + wide) * uDwarfLum * front;
}

// ---------------- main volume march ----------------
// returns radiance; trans = final transmittance (0 if the ray ended opaque); transD = transmittance at distance tD
vec3 vxMarch(vec3 ro, vec3 rd, float tMax, float jit, float jitT, float pixAngle, float tD, out float trans, out float transD){
  vec3 col = vec3(0.0);
  trans = 1.0; transD = -1.0;
  float Yb = 4.2 * diskH(uRb) + (uHot > 0.0 ? 0.4 : 0.0);
  float t0 = 0.0, t1 = tMax;
  if (abs(rd.y) > 1e-5){
    float ta = (-Yb - ro.y) / rd.y, tb = (Yb - ro.y) / rd.y;
    t0 = max(t0, min(ta, tb)); t1 = min(t1, max(ta, tb));
  } else if (abs(ro.y) > Yb) t1 = -1.0;
  float a2 = dot(rd.xz, rd.xz);
  if (a2 > 1e-8){
    float b = dot(ro.xz, rd.xz), c = dot(ro.xz, ro.xz) - uRb * uRb;
    float disc = b * b - a2 * c;
    if (disc < 0.0) t1 = -1.0; else { float s = sqrt(disc); t0 = max(t0, (-b - s) / a2); t1 = min(t1, (-b + s) / a2); }
  }
  if (t1 <= t0){ transD = 1.0; return col; }
  // exit of the disk's own bound (the step budget ignores the stream's larger bound)
  float t1d = t1;
  if (uHot > 0.0 && a2 > 1e-8){
    float Rd = uRout * 1.25;
    float b = dot(ro.xz, rd.xz), c = dot(ro.xz, ro.xz) - Rd * Rd;
    float disc = b * b - a2 * c;
    t1d = disc < 0.0 ? t0 : min(t1, (-b + sqrt(disc)) / a2);
  }
  float tt = uTau + (jitT - 0.5) * uShutter;
  vec2 hc = uHot > 0.0 ? rayPoint(ro, rd, hotPos()) : vec2(1e9);
  float transC = -1.0;
  float t = t0, tPrev = t0;
  bool first = true, hasPrev = false;
  vec4 xs = vec4(0.0); vec2 xf = vec2(0.0);
  const int N = 52;
  for (int i = 0; i < N; i++){
    if (t > t1 || trans < 0.004 || float(i) >= uMaxSteps) break;
    vec3 p = ro + rd * t;
    float r = length(p.xz);
    float gap = gasGap(p, r);
    float lodStep = t * uLod + pixAngle * t;
    float budget = max(t1d - t, 0.0) / max(uMaxSteps - float(i), 1.0);
    if (gap > 0.0){ t += max(gap * 0.85, max(lodStep, max(budget, 0.002))); hasPrev = false; continue; }
    float H = diskH(r);
    float dt = clamp(max(uStepK * H, lodStep), 0.0015, 0.12);
    if (uHot > 0.0){
      vec3 dh = p - hotPos();
      float ss = dot(dh, -uStreamDir);
      float dl = length(dh + uStreamDir * ss);
      float ws0 = uStreamW * (1.0 + 0.6 * max(ss, 0.0));
      float dtS = dl < 3.0 * ws0 && ss > -0.05 ? 0.35 * ws0 : 0.03;
      dt = min(dt, min(dtS, mix(0.008, 0.022, smoothstep(0.12, 0.4, length(dh)))) + lodStep);
    }
    dt = max(dt, budget);
    if (!hasPrev){
      // entering gas: this sample only initialises the pre-integration state (every contributing segment is integrated)
      vxField(p, rd, tt, 0.0, xs, xf, false);
      hasPrev = true; tPrev = t;
      t += dt * max(jit, 0.04); jit = fract(jit + 0.6180339); first = false;
      continue;
    }
    float seg = t - tPrev;
    vec3 f = vxField(p, rd, tt, seg, xs, xf, true);
    float a = 1.0 - exp(-f.x * seg);
    if (transD < 0.0 && t > tD) transD = trans;
    if (transC < 0.0 && t > hc.x) transC = trans;
    col += trans * a * (vxEmit(f.y) + f.z * vec3(1.0, 0.72, 0.45));
    trans *= 1.0 - a;
    tPrev = t;
    t += dt;
  }
  if (trans < 0.012){ trans = 0.0; if (transD < 0.0) transD = 0.0; if (transC < 0.0) transC = 0.0; }
  if (transD < 0.0) transD = trans;
  if (uHot > 0.0){
    // white-hot impact core: closed-form line integral of a Gaussian blob, attenuated by the gas in front of it
    if (transC < 0.0) transC = trans;
    float sc = 0.026;
    float g = exp(-hc.y * hc.y / (sc * sc));
    float g2 = exp(-hc.y * hc.y / (0.07 * 0.07));
    float flick = 0.85 + 0.15 * n3(vec3(uTau * 3.0, 1.7, 0.3));
    col += transC * uHot * flick * (vxEmit(9500.0 * uHeat) * 1.3 * g + vxEmit(5200.0 * uHeat) * 0.18 * g2);
  }
  return col;
}
`;
