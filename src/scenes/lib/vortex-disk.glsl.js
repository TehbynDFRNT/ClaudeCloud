// Close-in accretion vortex around the white dwarf (local frame: dwarf at origin, disk in XZ, Y up).
// Units: disk outer radius ~ uRout (~1). Rotation counter-clockwise seen from +Y (positive angle about +Y).
// Model
//  * Turbulent, flared, emitting/absorbing gas: radiance integrates the source function S(T) with optical depth,
//    so cool outer gas silhouettes against the hot inner disk (physically consistent dark lanes).
//  * Keplerian shear: angular speed = uOmega * r^-1.5. Turbulence lives in log-polar coordinates (eddies scale with r)
//    and is advected with two cross-faded layers (variance normalised) to avoid the winding problem.
//  * Trailing logarithmic spiral arms (shock heated), hot puffed inner rim, magnetic accretion curtains along dipole
//    field lines onto the poles, optional L1 stream + impact hot spot at the outer rim.
//  * Display temperature -> colour: crimson -> ember -> molten gold -> white -> ice blue. Brightness ~ (T/2200)^3.2.
export const VORTEX = `
uniform float uTau;        // disk time (seconds, may run faster/slower than film time)
uniform float uOmega;      // angular speed at r = 1 (rad per disk-second)
uniform float uCycle;      // advection layer life (disk-seconds)
uniform float uRin, uRout; // inner (magnetospheric) and outer radius
uniform float uH0, uFlare; // scale height H = uH0 * r^uFlare
uniform float uRimPuff;    // extra thickness of the hot inner rim
uniform float uDens;       // optical depth per unit length scale
uniform float uDensExp;    // midplane density ~ r^-uDensExp
uniform float uTin;        // display temperature at the inner rim (K)
uniform float uHeat;       // global temperature multiplier (flares)
uniform float uTurb;       // turbulence contrast (lognormal)
uniform float uArms, uArmM, uArmPitch, uArmSpeed; // spiral arms: strength, count, pitch (rad), pattern speed
uniform float uCurtain;    // magnetic curtain brightness
uniform float uCurtainSpin;// magnetosphere angular speed
uniform float uDwarfSurf;  // dwarf surface brightness
uniform float uHot;        // stream + hot spot strength (0 = none)
uniform float uHotPhi;     // azimuth of the impact point on the rim
uniform vec3 uStreamDir;   // stream velocity direction (unit, toward the impact)
uniform float uStreamW;    // stream half width
uniform float uShutter;    // per-sample time jitter (disk-seconds) -> volumetric motion blur
uniform float uRb;         // radial bound of the gas
uniform float uLod;        // step growth with distance (fraction of t)
uniform float uStepK;      // step = uStepK * H inside the gas
uniform float uSeedV;
uniform float uStarGain;
uniform float uEdgeFade;   // outer edge softness
uniform float uGrain3;     // fine-scale detail octave strength

const float KC = 32.0;          // lattice cells around the circumference (multiple of 16 keeps phi seamless)
const float KS = KC / TAU;

vec3 vxColor(float T){
  vec3 c0 = vec3(0.30, 0.012, 0.006);   // 1300 K abyssal crimson
  vec3 c1 = vec3(0.85, 0.055, 0.016);   // 1800 K crimson
  vec3 c2 = vec3(1.00, 0.20, 0.035);    // 2400 K ember
  vec3 c3 = vec3(1.00, 0.46, 0.11);     // 3000 K molten gold
  vec3 c4 = vec3(1.00, 0.78, 0.48);     // 4200 K white-gold
  vec3 c5 = vec3(1.00, 0.95, 0.90);     // 6500 K white
  vec3 c6 = vec3(0.74, 0.86, 1.00);     // 11000 K blue-white
  vec3 c7 = vec3(0.46, 0.66, 1.00);     // 20000 K ice
  if (T < 1800.0) return mix(c0, c1, sat((T - 1300.0) / 500.0));
  if (T < 2400.0) return mix(c1, c2, (T - 1800.0) / 600.0);
  if (T < 3000.0) return mix(c2, c3, (T - 2400.0) / 600.0);
  if (T < 4200.0) return mix(c3, c4, (T - 3000.0) / 1200.0);
  if (T < 6500.0) return mix(c4, c5, (T - 4200.0) / 2300.0);
  if (T < 11000.0) return mix(c5, c6, (T - 6500.0) / 4500.0);
  return mix(c6, c7, sat((T - 11000.0) / 9000.0));
}
vec3 vxEmit(float T){ return vxColor(T) * pow(max(T, 600.0) / 2200.0, 3.2); }

float diskH(float r){
  float h = uH0 * pow(r, uFlare);
  return h * (1.0 + uRimPuff * exp(-pow((r - uRin * 1.15) / (0.45 * uRin), 2.0)));
}

// stream + hot spot geometry (local frame)
vec3 hotPos(){ return vec3(cos(uHotPhi), 0.0, -sin(uHotPhi)) * uRout * 0.97; }

// conservative-ish distance to any gas (0 inside the bounding shell)
float gasGap(vec3 p, float r){
  float H = diskH(r);
  float g = max(abs(p.y) - 4.2 * H, max(r - uRb, uRin * 0.62 - r));
  if (uHot > 0.0){
    vec3 hp = hotPos();
    vec3 d = p - hp;
    float s = dot(d, -uStreamDir);
    float dl = length(d + uStreamDir * s);
    float gs = (s > -0.15) ? dl - uStreamW * (3.5 + 2.0 * max(s, 0.0)) : length(d) - 0.25;
    g = min(g, max(gs, 0.0));
    g = min(g, max(length(d) - 0.35, 0.0));
  }
  return max(g, 0.0);
}

// two advected, cross-faded turbulence layers in log-polar coordinates.
// returns x: turbulence (~zero mean), y: low-frequency field (for puffing), z: cell borders (filaments)
vec3 vxTurb(float lr, float phi, float yv, float om, float tau){
  float ph = tau / uCycle;
  vec3 acc = vec3(0.0); float w2 = 0.0;
  for (int i = 0; i < 2; i++){
    float fi = float(i);
    float f = fract(ph + 0.5 * fi);
    float w = 1.0 - abs(2.0 * f - 1.0);
    float id = floor(ph + 0.5 * fi) * 2.0 + fi;
    vec3 off = floor(hash33(vec3(id, uSeedV, 3.7)) * 64.0);
    float a = phi - om * f * uCycle;
    vec3 q = vec3(lr * KS * 1.7, a * KS, yv * KS * 1.4) + off;
    vec4 A = n4(q * 0.5);
    q += (A.rgb - 0.5) * vec3(2.2, 1.6, 2.0);
    vec4 B = n4(q);
    vec4 C = n4(q * vec3(3.0, 3.0, 3.0) + 17.0);
    float t = (B.r - 0.5) * 1.1 + (B.b - 0.5) * 0.6 + (C.r - 0.5) * 0.42 * uGrain3 + (C.b - 0.5) * 0.24 * uGrain3;
    float fil = smoothstep(0.0, 0.22, B.a) * smoothstep(0.0, 0.35, C.a);
    acc += w * vec3(t, A.b - 0.5, fil);
    w2 += w * w;
  }
  return vec3(acc.xy / sqrt(w2), acc.z);
}

// gas field at p: x = extinction (per unit length), y = display temperature (K)
vec2 vxField(vec3 p, float tau){
  float r = length(p.xz);
  float H = diskH(r);
  float phi = atan(-p.z, p.x);
  float lr = log(max(r, 1e-3));
  float om = uOmega * pow(max(r, uRin * 0.5), -1.5);
  vec3 tb = vxTurb(lr, phi, p.y / max(r, 1e-3), om, tau);
  float n = tb.x;
  // spiral arms (trailing, CCW) perturbed by turbulence
  float psi = uArmM * (phi + lr / tan(uArmPitch) - uArmSpeed * tau) + 1.7 * n;
  float armP = pow(0.5 + 0.5 * cos(psi), 3.0);
  float arm = 1.0 + uArms * (armP * 2.4 - 0.55);
  // radial profile: inner truncation at the magnetosphere, ragged outer edge
  float rin = uRin * (1.0 + 0.12 * tb.y);
  float edge = uRout * (1.0 + 0.10 * tb.y + 0.05 * n);
  float sig = smoothstep(rin * 0.92, rin * 1.22, r) * (1.0 - smoothstep(edge - uEdgeFade, edge, r));
  float Heff = H * (1.0 + 0.9 * tb.y + 0.35 * n) * (1.0 + 0.25 * uArms * armP);
  float vert = exp(-0.5 * pow(p.y / max(Heff, 1e-4), 2.0));
  float rho = uDens * pow(r, -uDensExp) * sig * vert * exp(uTurb * (n * 2.4 + 0.5 * tb.z - 0.25)) * arm;
  float T = uTin * pow(max(r, rin) / uRin, -0.75);
  T *= (1.0 + 0.22 * n + 0.28 * uArms * armP + 0.10 * tb.z);
  // hot inner rim (irradiated wall)
  T *= 1.0 + 0.6 * exp(-pow((r - rin * 1.1) / (0.25 * uRin), 2.0));
  // the upper layers are hotter (irradiated atmosphere)
  T *= 1.0 + 0.18 * sat(abs(p.y) / max(Heff, 1e-4) - 1.0);
  if (uHot > 0.0){
    vec3 hp = hotPos();
    vec3 d = p - hp;
    // incoming stream: a turbulent tube along -uStreamDir from the impact point
    float s = dot(d, -uStreamDir);
    vec3 perp = d + uStreamDir * s;
    float w = uStreamW * (1.0 + 0.8 * max(s, 0.0));
    float along = s * 9.0 + tau * 3.2;
    float sn = n3(vec3(perp.x * 30.0, perp.y * 30.0 + along, perp.z * 30.0 - along * 0.7)) * 0.6 + n3(vec3(along * 2.5, perp.y * 70.0, perp.x * 70.0)) * 0.4;
    float tube = exp(-dot(perp, perp) / (w * w * (1.0 + 0.6 * sn))) * smoothstep(-0.04, 0.05, s) * exp(-max(s, 0.0) * 0.4);
    float srho = uHot * 60.0 * tube * exp(1.6 * sn);
    // impact shock: splash puffed above and below the rim, swept downstream (CCW) along the rim
    float dphi = phi - uHotPhi; dphi = mod(dphi + PI, TAU) - PI;
    float down = exp(-max(dphi, 0.0) * 2.2) * exp(-max(-dphi, 0.0) * 14.0);
    float rr = (r - uRout * 0.93) / (0.09 + 0.12 * max(dphi, 0.0));
    float yy = p.y / (0.05 + 0.10 * exp(-abs(dphi) * 4.0));
    float shock = exp(-rr * rr - yy * yy) * down;
    float core = exp(-dot(d, d) / 0.0035);
    float shn = exp(1.5 * n);
    float hrho = uHot * (90.0 * shock * shn + 200.0 * core * shn);
    float Ts = 2600.0 + 1400.0 * sn;
    float Th = 3200.0 + 9000.0 * core + 4200.0 * shock * (0.6 + 0.6 * n);
    float tot = rho + srho + hrho;
    T = (T * rho + Ts * srho + Th * hrho) / max(tot, 1e-5);
    rho = tot;
  }
  return vec2(rho, T * uHeat);
}

// ---------------- magnetic accretion curtains (dipole field lines, axis +Y) ----------------
vec3 vxCurtain(vec3 ro, vec3 rd, float tMax, float jit){
  float Rm = uRin * 1.55;
  vec2 h = sphereHit(ro, rd, vec3(0.0), Rm);
  if (h.x > h.y || h.y < 0.0) return vec3(0.0);
  float t0 = max(h.x, 0.0), t1 = min(h.y, tMax);
  if (t1 <= t0) return vec3(0.0);
  const int N = 22;
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
    vec3 q = vec3(cos(phi) * 9.0, sin(phi) * 9.0, L / uRin * 6.0);
    float fil = n3(q + vec3(0.0, 0.0, 0.0)) * 0.6 + n3(q * 2.7 + vec3(c * 3.0 - uTau * 2.0)) * 0.4;
    fil = pow(sat(fil * 0.9 + 0.55), 6.0);
    float flow = 0.6 + 0.4 * n3(vec3(phi * 5.0, c * 9.0 - uTau * 5.0, L * 40.0));
    float fall = pow(uRin / r, 1.6);
    // two broad curtains (dipole slightly tilted -> azimuthal preference)
    float bundle = 0.35 + 0.65 * pow(0.5 + 0.5 * cos(phi * 2.0 + 0.6 * sign(p.y)), 2.0);
    acc += m * fil * flow * fall * bundle * dt;
  }
  return acc * C_ICE * uCurtain * 900.0 / max(uRin, 1e-3);
}

// ---------------- the dwarf ----------------
// resolved sphere (surface) + point-source glow consistent with lib/dwarf.glsl.js
vec3 vxDwarfSurface(vec3 ro, vec3 rd, vec2 h){
  vec3 n = normalize(ro + rd * max(h.x, 0.0));
  float mu = sat(dot(n, -rd));
  vec3 nq = rotY(uCurtainSpin * uTau) * n;
  float g = n3(nq * 22.0) * 0.5 + n3(nq * 61.0) * 0.25;
  float caps = smoothstep(0.80, 0.97, abs(n.y));
  float ring = exp(-pow((abs(n.y) - 0.9) / 0.04, 2.0));
  vec3 c = dwarfColor() * (0.45 + 0.55 * pow(mu, 0.5)) * (1.0 + 0.25 * g);
  return (c + C_ICE * (caps * 0.8 + ring * 2.5)) * 420.0 * uDwarfSurf * uDwarfLum;
}
vec3 vxDwarfGlow(vec3 ro, vec3 rd, float pixAngle){
  vec3 d = uDwarfPos - ro;
  float t = dot(d, rd);
  if (t <= 0.0) return vec3(0.0);
  float dist = length(d);
  float ang = length(cross(rd, d / dist));
  float angR = max(uDwarfR / dist, pixAngle * 0.8);
  float resolved = smoothstep(1.2, 3.0, uDwarfR / dist / pixAngle);
  float core = exp(-pow(ang / angR, 2.0)) * 220.0 * (1.0 - resolved);
  float halo = 1.0 / (1.0 + pow(ang / max(pixAngle * 6.0, angR * 1.6), 2.0)) * 2.2;
  float wide = 1.0 / (1.0 + pow(ang / max(pixAngle * 60.0, angR * 12.0), 2.0)) * 0.12;
  return dwarfColor() * (core + halo + wide) * uDwarfLum;
}

// ---------------- main volume march ----------------
// returns radiance; trans = final transmittance; transD = transmittance at distance tD
vec3 vxMarch(vec3 ro, vec3 rd, float tMax, float jit, float pixAngle, float tD, out float trans, out float transD){
  vec3 col = vec3(0.0);
  trans = 1.0; transD = -1.0;
  // bounding: slab |y| < Yb and cylinder r < uRb (stream region is inside the cylinder)
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
  float t = t0;
  float first = 1.0;
  for (int i = 0; i < 72; i++){
    if (t > t1 || trans < 0.012) break;
    vec3 p = ro + rd * t;
    float r = length(p.xz);
    float gap = gasGap(p, r);
    float lodStep = t * uLod + pixAngle * t;
    if (gap > 0.0){ t += max(gap * 0.85, max(lodStep, 0.002)); continue; }
    float H = diskH(r);
    float dt = clamp(max(uStepK * H, lodStep), 0.0015, 0.12);
    if (uHot > 0.0) dt = min(dt, 0.02 + lodStep);
    if (first > 0.5){ t += dt * jit; first = 0.0; p = ro + rd * t; }
    float tt = uTau + (hash13(vec3(gl_FragCoord.xy, float(i) + uFrame * 0.37)) - 0.5) * uShutter;
    vec2 f = vxField(p, tt);
    float a = 1.0 - exp(-f.x * dt);
    if (transD < 0.0 && t + 0.5 * dt > tD) transD = trans;
    col += trans * a * vxEmit(f.y);
    trans *= 1.0 - a;
    t += dt;
  }
  if (transD < 0.0) transD = trans;
  return col;
}
`;
