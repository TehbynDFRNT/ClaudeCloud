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
//    Motion blur of the flow is deterministic: the azimuthal smear during the shutter (om * uSmear) prefilters the
//    noise octaves it would wash out (no per-pixel time jitter, so no grain).
//  * Trailing logarithmic spiral arms (shock heated), hot puffed inner rim, irradiated flared skin (scattered light:
//    ice-blue dwarf light on the inner rim, ember reprocessed light on the outer skin), optional L1 stream impact:
//    analytic stream tube, analytic bow-shock sheet and a volumetric splash plume.
//  * Emission law (vxEmit) is designed through the film's ACES grade: saturated crimson -> ember -> molten gold up
//    to ~5000 K, white only above ~6500 K, brightness ~T^3 in the warm range and ~T^1.2 above, so the white-hot inner
//    disk is a few stops above the gold mid-disk instead of seven (no extreme camera stop-down needed).
// Magnetic curtains and the dwarf are drawn at full resolution in the composite pass (VXMAG below).
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
uniform float uArmSharp;   // arm crest sharpness (power)
uniform float uHot;        // stream + hot spot strength (0 = none)
uniform float uHotPhi;     // azimuth of the impact point on the rim
uniform vec3 uStreamDir;   // stream velocity direction (unit, toward the impact)
uniform float uStreamW;    // stream half width
uniform float uShockK;     // bow-shock brightness
uniform float uStreamK;    // stream column density multiplier
uniform float uSmear;      // shutter length in disk-seconds (deterministic flow motion blur)
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
uniform float uMaxSteps;   // march step cap (<= 64)
uniform float uKr, uKy;    // radial (per unit ln r) and vertical (per unit y/r) lattice frequency of the sheets
uniform vec4 uClear;       // camera clearing: xyz = centre, w = radius (thins gas right at the lens; 0 = off)

// emission (exposure-1 linear radiance) vs display temperature; knots solved through the post grade
vec3 vxEmit(float T){
  T = max(T, 800.0);
  if (T < 1300.0) return mix(vec3(0.004, 0.0002, 0.0001), vec3(0.06, 0.003, 0.0006), (T - 800.0) / 500.0);
  if (T < 1800.0) return mix(vec3(0.06, 0.003, 0.0006), vec3(0.26, 0.016, 0.0012), (T - 1300.0) / 500.0);
  if (T < 2400.0) return mix(vec3(0.26, 0.016, 0.0012), vec3(0.70, 0.045, 0.0015), (T - 1800.0) / 600.0);
  if (T < 3000.0) return mix(vec3(0.70, 0.045, 0.0015), vec3(1.25, 0.12, 0.002), (T - 2400.0) / 600.0);
  if (T < 3800.0) return mix(vec3(1.25, 0.12, 0.002), vec3(1.9, 0.36, 0.006), (T - 3000.0) / 800.0);
  if (T < 5000.0) return mix(vec3(1.9, 0.36, 0.006), vec3(3.4, 0.85, 0.04), (T - 3800.0) / 1200.0);
  if (T < 6500.0) return mix(vec3(3.4, 0.85, 0.04), vec3(6.0, 2.4, 0.6), (T - 5000.0) / 1500.0);
  if (T < 8500.0) return mix(vec3(6.0, 2.4, 0.6), vec3(8.5, 6.5, 4.2), (T - 6500.0) / 2000.0);
  if (T < 12000.0) return mix(vec3(8.5, 6.5, 4.2), vec3(10.0, 10.0, 10.0), (T - 8500.0) / 3500.0);
  if (T < 20000.0) return mix(vec3(10.0, 10.0, 10.0), vec3(11.0, 12.5, 15.0), (T - 12000.0) / 8000.0);
  return vec3(11.0, 12.5, 15.0) * pow(T / 20000.0, 0.8);
}

float diskH(float r){
  float h = uH0 * pow(r, uFlare);
  return h * (1.0 + uRimPuff * exp(-pow((r - uRin * 1.15) / (0.45 * uRin), 2.0)));
}

// stream + hot spot geometry (local frame)
vec3 hotPos(){ return vec3(cos(uHotPhi), 0.0, -sin(uHotPhi)) * uRout * 0.97; }
// downstream (orbital, CCW) direction at the impact
vec3 hotDown(){ return vec3(-sin(uHotPhi), 0.0, -cos(uHotPhi)); }

// conservative-ish distance to any gas (0 inside the bounding shell)
float gasGap(vec3 p, float r){
  float H = diskH(r);
  float g = max(abs(p.y) - 4.2 * H, max(r - min(uRb, uRout * 1.3), uRin * 0.78 - r));
  if (uHot > 0.0){
    // splash plume above/below the rim, swept downstream
    vec3 d = p - hotPos() - hotDown() * 0.12;
    g = min(g, max(length(d * vec3(1.0, 0.8, 1.0)) - 0.26, 0.0));
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

// gas field at p seen along rd: rgb = source function (phase-averaged emission), a = extinction per unit length;
// scat = scattered central light from the irradiated flared skin.
// xs/xf carry the sheet coordinates of the previous sample along the ray (pre-integration); hasPrev = continuity.
vec4 vxField(vec3 p, vec3 rd, float tau, float seg, inout vec4 xs, inout vec2 xf, bool hasPrev, out float scat){
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
  // deterministic motion blur: azimuthal smear during the shutter, in lattice cells of the B octave
  float sm = om * uSmear * (8.0 / TAU);
  // (rate counts B cells per unit length; the domain warp roughly doubles the effective frequency, C is 3x B)
  float k1 = max(sat(seg * rate * 2.4 - 0.4), 0.85 * smoothstep(0.3, 1.2, sm));
  float k2 = max(sat(seg * rate * 9.0 - 0.45), smoothstep(0.1, 0.4, sm));
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
    // (the fine octave only enters through the pre-integrated filament term s2: point-sampled, it would be noise)
    float t = (B.r - 0.5) * 1.15 + (B.b - 0.5) * 0.65;
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
  float armP = pow(0.5 + 0.5 * cos(psi), uArmSharp);
  float arm = mix(1.0, mix(uArmFloor, 2.2, armP), uArms);
  // radial profile: inner truncation at the magnetosphere, ragged outer edge
  float rin = uRin * (1.0 + 0.12 * puff);
  float edge = uRout * (1.0 + 0.12 * puff + 0.06 * n);
  float sig = smoothstep(rin * 0.92, rin * 1.22, r) * (1.0 - smoothstep(edge - uEdgeFade, edge, r));
  // stream impact: shock-heated, compressed region of the disk's own turbulent sheets + a splash plume
  float hinf = 0.0, plume = 0.0, Tp = 0.0;
  if (uHot > 0.0){
    float dphi = phi - uHotPhi; dphi = mod(dphi + PI, TAU) - PI;     // > 0 downstream
    float dn = max(dphi, 0.0);
    float down = exp(-dn * 2.2) * exp(-max(-dphi, 0.0) * 14.0);
    float rr = (r - uRout * 0.95) / (0.06 + 0.10 * dn);
    float horiz = exp(-rr * rr) * down;
    hinf = uHot * horiz * exp(-pow(p.y / 0.06, 2.0));
    // splash: shocked gas thrown above and below the plane, rising and cooling as the flow sweeps it downstream
    float yext = (0.045 + 0.16 * sat(dn * 1.8)) * (1.0 + 0.35 * puff + 0.25 * n);
    float yy = abs(p.y) / yext;
    float shell = exp(-yy * yy) * smoothstep(-0.05, 0.25, n + 0.6 * sheet - 0.2);
    plume = uHot * horiz * shell * (0.3 + 1.6 * sheet) * 3.2;
    float hot = exp(-dn * 2.8) * exp(-yy * 0.9);
    Tp = mix(1900.0, 9800.0, hot) * (0.85 + 0.35 * sheet + 0.1 * n);
  }
  float Heff = H * max(0.15, 1.0 + uPuff * (1.5 * puff + 0.6 * n)) * (1.0 + 0.3 * uArms * armP) * (1.0 + 0.6 * hinf);
  float zz = abs(p.y) / max(Heff, 1e-4);
  float vert = exp(-0.5 * zz * zz);
  float clump = exp(uTurb * (n * 3.6 - 0.5)) * smoothstep(uVoid - 0.25, uVoid + 0.25, n + 0.3 * puff);
  float patchy = smoothstep(uSheetMask - 0.18, uSheetMask + 0.18, puff * 1.4 + 0.5 * n);
  float zm = abs(p.y) / max(0.55 * Heff, 1e-4);
  float rf = (uFloor + uFloorMid * exp(-0.5 * zm * zm)) * clump, rs = uSheet * sheet * patchy;
  rs *= 1.0 + 4.0 * hinf;
  float ws = rs / max(rf + rs, 1e-5);          // fraction of the sample in hot sheets
  float rho = uDens * pow(r, -uDensExp) * sig * vert * arm * (rf + rs);
  // camera clearing (a lens-sized pocket so the near field is discrete clumps, not fog)
  if (uClear.w > 0.0){ float dc = length(p - uClear.xyz) / uClear.w; rho *= smoothstep(0.35, 1.0, dc + 0.25 * n); }
  float rT = max(r, rin);
  float T0 = uTout * pow(rT / uRout, -0.55) * (1.0 + uTinK * (uRin / rT) * (uRin / rT));
  T0 *= (1.0 + 0.12 * n + 0.10 * fine + uArmHeat * uArms * armP) * uHeat;
  T0 *= 1.0 + 0.6 * exp(-pow((r - rin * 1.1) / (0.25 * uRin), 2.0));   // hot inner wall
  // two-phase medium: hot dissipative sheets and cold diffuse gas. The source function is averaged over the
  // phases (linear in the pre-integrated sheet density), so the result converges with coarse steps and does not
  // depend on where the samples fall - temperature contrast is what makes structure visible.
  float Th = T0 * (1.0 + uSheetHeat) * (1.0 + 1.26 * hinf);               // shock heating at the impact
  float Tc = T0 * uColdGas * (1.0 + 0.36 * hinf);
  vec3 S = mix(vxEmit(Tc), vxEmit(Th), ws);
  // irradiation of the flared skin by the dwarf + inner disk (radial optical depth ~ smooth vertical profile)
  float z0 = abs(p.y) / max(H, 1e-4);
  float lit = exp(-uDens * 2.6 * exp(-0.5 * z0 * z0 * z0) * (0.5 + 0.9 * sat(n + 0.5)));
  float cth = dot(normalize(p), -rd);
  float hg = 0.8775 / pow(1.1225 - 0.7 * cth, 1.5);
  scat = uIrr * lit * hg * pow(uRin / max(r, uRin), 2.0) * sig;
  if (uHot > 0.0){
    float rp = uDens * plume;
    float tot = rho + rp;
    S = (S * rho + vxEmit(Tp * uHeat) * rp) / max(tot, 1e-5);
    scat *= rho / max(tot, 1e-5);
    rho = tot;
  }
  return vec4(S, rho);
}

// ---------------- S09: analytic stream tube and bow shock ----------------
// stream axis: hotPos() + U*s, U = -uStreamDir (upstream), s >= SHOCK_S0 (it ends at the shock apex)
const float SHOCK_S0 = 0.03;
// closest approach of the ray to the stream axis -> (t, column density through the Gaussian tube, temperature, 0)
vec4 vxStream(vec3 ro, vec3 rd){
  vec3 U = -uStreamDir;
  vec3 w0 = ro - hotPos();
  float b = dot(rd, U), d = dot(rd, w0), e = dot(U, w0);
  float den = max(1.0 - b * b, 0.04);
  float t = (b * e - d) / den;
  float s = e + b * t;
  vec3 v = w0 + rd * t - U * s;
  float dist = length(v);
  float ds = max(s - SHOCK_S0, 0.0);
  // the head splays and frays as it rams the shocked gas
  float head = exp(-ds / 0.06);
  float w = uStreamW * (1.0 + 0.5 * max(s, 0.0) + 0.45 * head);
  // lateral coordinate across the tube as seen along the ray (signed), and the along-flow coordinate
  vec3 side = normalize(cross(U, rd) + vec3(1e-5));
  float lat = dot(v, side) / w;
  float fs = s + uTau * 0.35;                                  // material coordinate (flows into the impact)
  float sn = n3(vec3(fs * 6.0, lat * 1.2, 2.7)) * 0.6 + n3(vec3(fs * 15.0, lat * 2.4, 8.1)) * 0.3;
  float strands = 0.35 + 0.65 * smoothstep(-0.35, 0.35, n3(vec3(lat * 2.6, fs * 1.4, 4.0)) + 0.4 * n3(vec3(lat * 5.5, fs * 3.0, 11.0)));
  float prof = exp(-dist * dist / (w * w * (1.0 + 0.7 * sn)));
  // ragged head: the tube is eaten away unevenly as it enters the shock
  float rag = n3(vec3(lat * 1.8, uTau * 0.9, 5.3)) * 0.05 + n3(vec3(lat * 4.0, uTau * 1.7, 9.1)) * 0.025;
  float ends = smoothstep(SHOCK_S0 - 0.01, SHOCK_S0 + 0.10, s + rag) * (1.0 - smoothstep(0.9, 1.6, s));
  float col = 1.7725 * w / sqrt(den) * prof * ends * strands * exp(1.5 * sn) * uStreamK;
  float Ts = 2800.0 + 1300.0 * sn + 4800.0 * head + 700.0 * strands;
  return vec4(t, col, Ts, 0.0);
}
// bow shock: thin paraboloid sheet facing upstream, apex SHOCK_S0 upstream of the rim point, torn into knots.
// returns the emission of up to two crossings; tHit = ray distance of the nearer one (negative = none)
vec3 vxShockHit(vec3 ro, vec3 rd, float tt, out float tHit){
  vec3 U = -uStreamDir;
  vec3 E1 = normalize(cross(U, vec3(0.0, 1.0, 0.0)));
  vec3 E2 = cross(E1, U);
  vec3 o = ro - hotPos();
  vec3 lo = vec3(dot(o, U), dot(o, E1), dot(o, E2)), ld = vec3(dot(rd, U), dot(rd, E1), dot(rd, E2));
  const float Rc = 0.04, RHO = 0.10;
  float A2 = (ld.y * ld.y + ld.z * ld.z) / (2.0 * Rc);
  float B2 = ld.x + (lo.y * ld.y + lo.z * ld.z) / Rc;
  float C2 = lo.x - SHOCK_S0 + (lo.y * lo.y + lo.z * lo.z) / (2.0 * Rc);
  tHit = -1.0;
  float disc = B2 * B2 - 4.0 * A2 * C2;
  if (disc < 0.0 || A2 < 1e-6) return vec3(0.0);
  float sq = sqrt(disc);
  vec3 acc = vec3(0.0);
  for (int k = 0; k < 2; k++){
    float th = (-B2 + (k == 0 ? -sq : sq)) / (2.0 * A2);
    if (th <= 0.0) continue;
    vec3 x = lo + ld * th;
    float rho = length(x.yz);
    if (rho > RHO) continue;
    vec3 nn = normalize(vec3(1.0, x.y / Rc, x.z / Rc));
    float ci = max(abs(dot(ld, nn)), 0.3);
    vec3 kq = vec3(x.y / 0.010, x.z / 0.010, tt * 1.4 - rho * 40.0);
    float kn = n3(kq) * 0.6 + n3(kq * 2.3 + 5.0) * 0.3 + n3(kq * 5.1 + 2.0) * 0.15;
    float knots = smoothstep(-0.05, 0.45, kn);
    float fr = rho / RHO;
    float prof = exp(-fr * fr * 4.0) * (1.0 - smoothstep(0.6, 1.0, fr + 0.25 * kn));
    float T = mix(4200.0, 9800.0, exp(-fr * fr * 6.0)) * (0.85 + 0.3 * knots) * uHeat;
    acc += vxEmit(T) * (prof * knots * 0.3 / ci);
    if (tHit < 0.0) tHit = th;
  }
  return acc * uShockK;
}

// ray-start jitter: high-passed white noise (blue-ish): no structured IGN hatching, finer grain than white noise
float vxJit(vec2 px){
  vec2 o = vec2(fract(uFrame * 0.6180339), fract(uFrame * 0.7548776)) * 517.0;
  float c = hash12(px + o);
  float nb = hash12(px + o + vec2(1.0, 0.0)) + hash12(px + o - vec2(1.0, 0.0)) + hash12(px + o + vec2(0.0, 1.0)) + hash12(px + o - vec2(0.0, 1.0));
  return fract(c - 0.25 * nb + 0.5);
}

// ---------------- main volume march ----------------
// returns radiance; trans = final transmittance (0 if the ray ended opaque); transD = transmittance at distance tD
vec3 vxMarch(vec3 ro, vec3 rd, float tMax, float jit, float pixAngle, float tD, out float trans, out float transD){
  vec3 col = vec3(0.0);
  trans = 1.0; transD = -1.0;
  // S09 analytic events: stream tube (absorbs + emits) and the bow shock (emits), composited at their distance
  float tS = 1e9, tauS = 0.0; vec3 emS = vec3(0.0);
  float tB = -1.0; vec3 emB = vec3(0.0);
  if (uHot > 0.0){
    vec4 st = vxStream(ro, rd);
    if (st.x > 0.0 && st.x < tMax && st.y > 1e-4){
      tS = st.x; tauS = st.y * uHot * 60.0;
      emS = vxEmit(st.z * uHeat) * (1.0 - exp(-tauS));
    }
    emB = vxShockHit(ro, rd, uTau, tB);
    if (tB > tMax) tB = -1.0;
  }
  float Yb = 4.2 * diskH(uRb) + (uHot > 0.0 ? 0.3 : 0.0);
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
  if (t1 <= t0){
    transD = 1.0;
    if (tB > 0.0) col += emB;
    if (tS < 1e8){ col += emS; trans = exp(-tauS); }
    return col;
  }
  float t = t0, tPrev = t0;
  bool hasPrev = false;
  float rhoPrev = 0.0;
  vec4 xs = vec4(0.0); vec2 xf = vec2(0.0);
  const int N = 64;
  for (int i = 0; i < N; i++){
    if (t > t1 || trans < 0.004 || float(i) >= uMaxSteps) break;
    vec3 p = ro + rd * t;
    float r = length(p.xz);
    float gap = gasGap(p, r);
    float lodStep = t * uLod + pixAngle * t;
    float budget = max(t1 - t, 0.0) / max(uMaxSteps - float(i), 1.0);
    if (gap > 0.0){ t += max(gap * 0.85, max(lodStep, max(budget * mix(0.35, 1.0, smoothstep(0.15, 0.4, r)), 0.002))); hasPrev = false; rhoPrev = 0.0; continue; }
    float H = diskH(r);
    float dt = clamp(max(uStepK * H, lodStep), 0.0012, 0.12);
    // the reach-the-exit budget is waived in the thin inner disk: resolving the opaque rim matters more there
    dt = max(dt, budget * mix(0.15, 1.0, smoothstep(uRin * 1.6, 0.4, r)));
    // optical-depth limit: no step may swallow more than ~1.5 e-folds of the gas just sampled
    dt = min(dt, max(1.5 / max(rhoPrev, 1e-3), 0.0012));
    // approaching the opaque inner wall from the hole: resolve its face (else it stipples under jitter)
    if (r < uRin * 1.4) dt = min(dt, max(uRin * 0.035, lodStep));
    if (uHot > 0.0){
      float dh = length(p - hotPos() - hotDown() * 0.1);
      // near the impact the step budget is waived: the hot trail is the subject
      dt = min(dt, mix(0.016, 0.05, smoothstep(0.08, 0.35, dh)) + lodStep);
    }
    if (!hasPrev){
      // entering gas: this sample only initialises the pre-integration state (every contributing segment is integrated)
      float scD;
      vxField(p, rd, uTau, 0.0, xs, xf, false, scD);
      hasPrev = true; tPrev = t;
      t += dt * max(jit, 0.04); jit = fract(jit + 0.6180339);
      continue;
    }
    float seg = t - tPrev;
    // analytic events falling inside this segment are composited before the segment's gas
    if (tB > 0.0 && tB <= t){ col += trans * emB; tB = -1.0; }
    if (tS < 1e8 && tS <= t){ col += trans * emS; trans *= exp(-tauS); tS = 1e9; }
    if (transD < 0.0 && t > tD) transD = trans;
    float scat;
    vec4 f = vxField(p, rd, uTau, seg, xs, xf, true, scat);
    float a = 1.0 - exp(-f.a * seg);
    rhoPrev = f.a;
    // scattered light: cool white dwarf light on the inner rim (a saturated blue added to gold emission would read
    // pink), ember (reprocessed through red gas) further out
    vec3 sc = mix(vec3(0.75, 0.8, 0.9), vec3(1.0, 0.3, 0.06), smoothstep(uRin * 1.3, uRin * 3.5, r));
    col += trans * a * (f.rgb + scat * sc);
    trans *= 1.0 - a;
    tPrev = t;
    t += dt;
  }
  if (trans < 0.012){ trans = 0.0; }
  else {
    if (tB > 0.0){ col += trans * emB; }
    if (tS < 1e8){ col += trans * emS; trans *= exp(-tauS); }
  }
  if (transD < 0.0) transD = trans;
  return col;
}
`;

// ---------------- full-resolution composite chunk: magnetic curtains + the dwarf ----------------
// Requires DWARF (uDwarfPos, uDwarfR, uDwarfLum, dwarfColor).
export const VXMAG = `
uniform float uTau, uRin;
uniform float uCurtain;     // curtain brightness (0 = off)
uniform float uCurtainSpin; // magnetosphere angular speed
uniform float uCurtainPhi;  // azimuth of the upper curtain (lower one is opposite)
uniform float uDwarfSurf;   // dwarf surface radiance multiplier
uniform float uGlowK;       // dwarf glow (halo + wide) multiplier

const vec3 C_CURT = vec3(0.16, 0.40, 1.0);
float vmJit(vec2 px){
  vec2 o = vec2(fract(uFrame * 0.6180339), fract(uFrame * 0.7548776)) * 517.0 + 31.0;
  float c = hash12(px + o);
  float nb = hash12(px + o + vec2(1.0, 0.0)) + hash12(px + o - vec2(1.0, 0.0)) + hash12(px + o + vec2(0.0, 1.0)) + hash12(px + o - vec2(0.0, 1.0));
  return fract(c - 0.25 * nb + 0.5);
}
// Accretion curtains: plasma lifted off the inner disk edge, sliding along dipole field lines (r = L sin^2 theta)
// onto the dwarf's magnetic poles. Two broad curtains (oblique rotator), field-aligned threads, poleward knots.
// The thin shell profile in L is pre-integrated per segment (L is ~linear along a short segment), so the shell
// is resolved exactly with few samples and needs no jitter (no salt); the slow factors are taken at midpoints.
float vmShAvg(float x0, float x1, float w){
  float d = x1 - x0;
  float a0 = min(abs(x0), w) / w, a1 = min(abs(x1), w) / w;
  if (abs(d) < 0.02 * w){ float a = min(abs(0.5 * (x0 + x1)) / w, 1.0); return 1.0 - a * a * (3.0 - 2.0 * a); }
  float c0 = sign(x0) * w * a0 * (1.0 - a0 * a0 + 0.5 * a0 * a0 * a0);
  float c1 = sign(x1) * w * a1 * (1.0 - a1 * a1 + 0.5 * a1 * a1 * a1);
  return (c1 - c0) / d;
}
float vmL(vec3 p){ float r2 = dot(p, p); return r2 * sqrt(r2) / max(dot(p.xz, p.xz), 1e-7); }
vec3 vxCurtain(vec3 ro, vec3 rd, float tMax, float jitUnused){
  float Rm = uRin * 1.65;
  vec2 h = sphereHit(ro, rd, uDwarfPos, Rm);
  if (h.x > h.y || h.y < 0.0) return vec3(0.0);
  float t0 = max(h.x, 0.0), t1 = min(h.y, tMax);
  if (t1 <= t0) return vec3(0.0);
  const int N = 28;
  float dt = (t1 - t0) / float(N);
  vec3 acc = vec3(0.0);
  float spin = uCurtainSpin * uTau;
  float Lc = uRin * 1.06, W = uRin * 0.42;
  vec3 pa = ro + rd * t0 - uDwarfPos;
  float La = vmL(pa);
  for (int i = 0; i < N; i++){
    vec3 pb = pa + rd * dt;
    float Lb = vmL(pb);
    float m = vmShAvg(La - Lc, Lb - Lc, W);
    if (m > 0.004){
      vec3 p = 0.5 * (pa + pb);
      float r = length(p);
      if (r > uDwarfR){
        float L = vmL(p);
        float c = abs(p.y) / r;                       // 0 in the disk plane, 1 at the pole
        float hemi = p.y >= 0.0 ? 1.0 : -1.0;
        float phi = atan(-p.z, p.x) - spin;
        float bun = pow(0.5 + 0.5 * cos(phi - uCurtainPhi - (hemi > 0.0 ? 0.0 : PI)), 2.0);
        // field-aligned threads: constant along a field line (functions of phi and L only)
        float th = n3(vec3(cos(phi) * 9.0, sin(phi) * 9.0, L / uRin * 4.0 + hemi * 7.0));
        float thr = smoothstep(-0.12, 0.42, th);
        // knots sliding poleward along the lines
        float fl = 0.6 + 0.4 * n3(vec3(cos(phi) * 6.0 + 3.0, sin(phi) * 6.0, c * 6.0 - uTau * 3.5));
        float g = min(pow(uRin / r, 1.2), 6.0);
        float lift = smoothstep(0.06, 0.4, c);           // lifts off above the disk surface
        acc += m * (0.04 + 0.96 * bun) * thr * fl * g * lift * dt;
      }
    }
    pa = pb; La = Lb;
  }
  return acc * C_CURT * uCurtain * 30.0 / max(uRin, 1e-3);
}

// resolved dwarf: limb darkened, faint granulation, blue accretion footprints where the curtains land
vec3 vxDwarfSurface(vec3 ro, vec3 rd, vec2 h){
  vec3 n = normalize(ro + rd * max(h.x, 0.0) - uDwarfPos);
  float mu = sat(dot(n, -rd));
  vec3 nq = rotY(uCurtainSpin * uTau) * n;
  float g = n3(nq * 22.0) * 0.5 + n3(nq * 61.0) * 0.25;
  // footprint ring: field lines from L ~ 1.06 rin land at sin^2(theta) = R / L
  float cr = sqrt(max(1.0 - uDwarfR / (uRin * 1.06), 0.0));
  float ring = exp(-pow((abs(n.y) - cr) / 0.035, 2.0));
  float caps = smoothstep(cr - 0.05, cr + 0.06, abs(n.y));
  // strong limb darkening of a hot degenerate atmosphere; the limb shifts toward the cold blue
  float ld = 0.12 + 0.88 * mu;
  vec3 c = mix(C_CURT * 0.8, dwarfColor(), sqrt(mu)) * ld * (1.0 + 0.25 * g);
  return (c + C_CURT * (caps * 0.6 + ring * 2.2) * (0.5 + 0.5 * mu)) * 9.0 * uDwarfSurf * uDwarfLum;
}
// point-source glow consistent with lib/dwarf.glsl.js (core suppressed once the sphere is resolved)
vec3 vxDwarfGlow(vec3 ro, vec3 rd, float pixAngle){
  vec3 d = uDwarfPos - ro;
  float t = dot(d, rd);
  if (t <= 0.0) return vec3(0.0);
  float dist = length(d);
  float front = smoothstep(0.0, 0.5, t / dist);
  float ang = length(cross(rd, d / dist));
  float angR = max(uDwarfR / dist, pixAngle * 0.8);
  float resolved = smoothstep(1.2, 3.0, uDwarfR / dist / pixAngle);
  float core = exp(-pow(ang / angR, 2.0)) * 220.0 * (1.0 - resolved);
  // once resolved, the halo is a corona measured from the limb (it must not wash over the shaded sphere)
  float al = max(ang - (uDwarfR / dist) * resolved, 0.0);
  float halo = 1.0 / (1.0 + pow(al / max(pixAngle * 6.0, angR * (1.6 - 1.2 * resolved)), 2.0)) * 2.2 * (1.0 - 0.5 * resolved);
  float wide = 1.0 / (1.0 + pow(al / max(pixAngle * 60.0, angR * 12.0), 2.0)) * 0.12;
  return dwarfColor() * (core + (halo + wide) * uGlowK) * uDwarfLum * front;
}
`;
