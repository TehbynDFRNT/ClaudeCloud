// Plasma macro inserts: shared GLSL.
//   PLASMA_COMMON  heat -> emission palette (crimson -> ember -> gold -> white), noise helper
//   BOIL           raymarched convecting plasma slab (heightfield surface + rising emissive/absorbing wisps)
//   CORE           hot plasma core (boiling sphere + turbulent corona) with a cold-blue field haze
//   DOF / COMP     depth-of-field gather (alpha = depth) and the final composite with the canvas overlay
// All passes write linear HDR radiance; nothing is clamped or tonemapped here.

export const PLASMA_COMMON = `
vec4 nz(vec3 p){ return texture(uNoise, p * 0.125); }
// heat h: 0 = abyssal crimson lane, 0.4 ember, 0.6 gold, 0.8 white-gold, 1 white; >1 keeps getting brighter
vec3 heatColor(float h){
  const vec3 k0 = vec3(0.20, 0.006, 0.003);
  const vec3 k1 = vec3(0.70, 0.030, 0.010);
  const vec3 k2 = vec3(1.00, 0.170, 0.030);
  const vec3 k3 = vec3(1.00, 0.480, 0.110);
  const vec3 k4 = vec3(1.00, 0.780, 0.450);
  const vec3 k5 = vec3(1.00, 0.950, 0.870);
  float x = clamp(h, 0.0, 1.0) * 5.0;
  if (x < 1.0) return mix(k0, k1, x);
  if (x < 2.0) return mix(k1, k2, x - 1.0);
  if (x < 3.0) return mix(k2, k3, x - 2.0);
  if (x < 4.0) return mix(k3, k4, x - 3.0);
  return mix(k4, k5, x - 4.0);
}
float heatI(float h){ return 0.03 * exp(7.6 * min(h, 1.45)); }
vec3 heatEmit(float h){ return heatColor(h) * heatI(h); }
`;

export const BOIL = `
uniform float uEvo;       // convection phase (cells morph through the 3D Worley volume)
uniform float uCell;      // cells per world unit
uniform vec2  uDrift;     // pattern drift (cell units)
uniform float uWarp;      // domain-warp strength
uniform float uRelief;    // surface relief (world units)
uniform float uHeat;      // heat offset
uniform float uHeatGain;  // heat contrast
uniform float uGain;      // emission gain
uniform float uPlume;     // wisp density above the surface
uniform float uPlumeH;    // wisp scale height
uniform float uRise;      // wisp rise phase (world units)
uniform float uAbsorb;    // wisp absorption (dark veils) relative to emission
uniform float uTMax;      // march distance
uniform float uFog;       // hot haze extinction per unit
uniform vec3  uHaze;      // haze / sky radiance
uniform float uDetail;    // fine turbulence amount
uniform float uFlowSpin;  // swirl of the warp field over time

// coarse surface: x = height, y = heat, zw = warp (cell units)
vec4 boilCoarse(vec2 xz){
  vec2 q = xz * uCell + uDrift;
  vec4 a = nz(vec3(q * 0.21, uEvo * 0.08 + 1.7));
  vec2 w = (a.rb - 0.5) * 2.2 * uWarp;
  w = rot2(uFlowSpin * (a.r - 0.5)) * w;
  vec4 b = nz(vec3(q * 0.57 + w * 0.7 + 9.3, uEvo * 0.19 + 4.1));
  w += (b.rb - 0.5) * 1.2 * uWarp;
  vec4 c = nz(vec3(q + w, uEvo));
  float F1 = c.g * 1.1, E1 = c.a * 0.8;
  float dome = 1.0 - smoothstep(0.0, 0.95, F1);
  float lane = exp(-E1 * 9.0);
  float h = 0.75 * dome * dome - 0.65 * lane + 0.12 * (b.g - 0.5);
  float heat = 0.14 + 0.82 * dome * (1.0 - 0.8 * lane) - 0.08 * lane + 0.1 * (a.g - 0.5);
  return vec4(h * uRelief, heat, w);
}

// fine heat + bump: granules riding on the big cells and turbulent filaments
vec3 boilFine(vec2 xz, vec2 w, float k){
  vec2 q = xz * uCell + uDrift;
  vec4 d = nz(vec3(q * 2.6 + w * 1.6 + 17.3, uEvo * 1.7 + 5.0));
  float F1b = d.g * 1.1, E1b = d.a * 0.8;
  float g = 1.0 - smoothstep(0.0, 0.9, F1b);
  float laneB = exp(-E1b * 11.0);
  vec4 e = nz(vec3(q * 7.1 + w * 3.1 + vec2(g * 0.6), uEvo * 3.3 + 11.0));
  float turb = (e.r - 0.5) * 0.7 + (e.b - 0.5) * 0.5;
  float heat = k * (0.16 * g - 0.16 * laneB + uDetail * 0.22 * turb);
  float bump = k * (0.30 * g - 0.30 * laneB + uDetail * 0.12 * turb);
  return vec3(heat, bump, laneB);
}

float boilWisp(vec3 p, vec2 w){
  vec3 q = vec3(p.x * uCell + w.x * 0.35, (p.y - uRise) * uCell * 1.6, p.z * uCell + w.y * 0.35) * 1.15;
  vec4 n = nz(q + vec3(0.0, 0.0, uEvo * 0.35));
  float v = n.r * 0.6 + n.b * 0.4;
  return smoothstep(0.50, 0.80, v) * (0.6 + 0.8 * n.g);
}

vec3 boilSky(vec3 rd){
  float e = clamp(rd.y, -0.2, 1.0);
  return uHaze * (exp(-max(e, 0.0) * 9.0) * 0.9 + 0.1 * exp(-max(e, 0.0) * 2.0));
}

vec3 boilMarch(vec3 ro, vec3 rd, out float depth){
  float ytop = uRelief * 0.9 + uPlumeH * 3.0;
  float ybot = -uRelief * 1.0;
  depth = uTMax;
  vec3 col = vec3(0.0);
  float T = 1.0;
  float t = 0.0;
  if (ro.y > ytop){
    if (rd.y >= -1e-4) return boilSky(rd);
    t = (ytop - ro.y) / rd.y;
  }
  float tExit = rd.y < 0.0 ? min(uTMax, (ybot - ro.y) / rd.y) : uTMax;
  float j = ign(gl_FragCoord.xy);
  float tPrev = t, dyPrev = 1.0, dyHit = -1e-3;
  bool hit = false;
  vec4 f = vec4(0.0);
  float dt = 0.02;
  t += j * 0.03;
  for (int i = 0; i < 44; i++){
    if (t > tExit || T < 0.02) break;
    vec3 p = ro + rd * t;
    f = boilCoarse(p.xz);
    float dy = p.y - f.x;
    if (dy < 0.0){ hit = true; dyHit = dy; break; }
    dt = clamp(dy * 0.65, 0.01 + t * 0.006, 0.3 + t * 0.03);
    if (uPlume > 0.0 && dy < uPlumeH * 4.0){
      float dens = uPlume * boilWisp(p, f.zw) * exp(-dy / uPlumeH);
      float hw = f.y * 0.95 - dy * 1.2 / max(uPlumeH, 0.02) * 0.12 + uHeat - 0.08;
      col += T * heatEmit(hw * uHeatGain) * dens * dt * uGain;
      T *= exp(-dens * dt * uAbsorb);
      if (T < 0.55 && depth >= uTMax) depth = t;
    }
    tPrev = t; dyPrev = dy;
    t += dt;
  }
  if (hit){
    // secant refinement of the surface crossing
    float ta = tPrev, tb = t, da = dyPrev, db = dyHit;
    for (int k = 0; k < 4; k++){
      float tm = mix(ta, tb, clamp(da / max(da - db, 1e-5), 0.1, 0.9));
      vec3 pm = ro + rd * tm;
      vec4 fm = boilCoarse(pm.xz);
      float dm = pm.y - fm.x;
      if (dm > 0.0){ ta = tm; da = dm; } else { tb = tm; db = dm; f = fm; }
    }
    float th = mix(ta, tb, clamp(da / max(da - db, 1e-5), 0.0, 1.0));
    vec3 p = ro + rd * th;
    float e = 0.012 + 0.0025 * th;
    float lod = 1.0 - smoothstep(uTMax * 0.35, uTMax * 0.9, th);
    vec3 fi = boilFine(p.xz, f.zw, lod);
    vec3 fx = boilFine(p.xz + vec2(e, 0.0), f.zw, lod);
    vec3 fz = boilFine(p.xz + vec2(0.0, e), f.zw, lod);
    float hx = boilCoarse(p.xz + vec2(e, 0.0)).x, hz = boilCoarse(p.xz + vec2(0.0, e)).x;
    float bs = uRelief * 0.35;
    float h0 = f.x + fi.y * bs;
    vec3 n = normalize(vec3(-(hx + fx.y * bs - h0) / e, 1.0, -(hz + fz.y * bs - h0) / e));
    float mu = sat(dot(n, -rd));
    float heat = f.y + fi.x;
    // grazing views of dome flanks look through cooler overlying gas (limb darkening)
    heat -= (1.0 - pow(mu, 0.55)) * 0.22;
    // deep lanes are shadowed by their walls: occlusion from height below the local mean
    heat -= sat(-f.x / max(uRelief, 1e-3) * 0.6) * 0.10;
    vec3 L = heatEmit(heat * uHeatGain + uHeat) * uGain;
    float fog = exp(-th * uFog);
    col += T * (L * fog + uHaze * (1.0 - fog));
    if (depth >= uTMax) depth = th;
  } else {
    float fog = exp(-uTMax * uFog);
    col += T * (boilSky(rd) * fog + uHaze * (1.0 - fog) * step(rd.y, 0.0));
  }
  return col;
}
`;

export const CORE = `
uniform vec3  uCoreC;
uniform float uCoreR;
uniform float uCoreHeat;
uniform float uCoreGlow;
uniform float uEvo;
uniform float uSpin;
uniform vec3  uAxis;       // flux-rope axis (unit)
uniform vec3  uHazeCol;    // cold field haze radiance
uniform float uHazeR;      // haze radius around the axis
uniform float uRopeR;      // wrap radius of the rope near the core (corona extent)
uniform float uGain;

vec3 coreShade(vec3 ro, vec3 rd, out float depth){
  vec3 col = vec3(0.0);
  vec2 rp = rayPoint(ro, rd, uCoreC);
  float x = rp.y / uCoreR;
  vec2 hs = sphereHit(ro, rd, uCoreC, uCoreR);
  bool hit = hs.x < hs.y && hs.y > 0.0;
  depth = max(rp.x, 0.01);
  // turbulent corona: emissive shell integrated along the ray (analytic radial profile x turbulence)
  if (x < 3.5){
    vec3 q = (ro + rd * rp.x - uCoreC) / uCoreR;
    vec3 qs = rotY(uSpin * 0.7) * q;
    vec4 a = nz(qs * 2.2 + vec3(0.0, uEvo * 0.6, uEvo * 0.2));
    vec4 b = nz(qs * 5.3 + (a.rgb - 0.5) * 1.6 + vec3(uEvo * 1.1));
    float r = max(x, 1.0) - 1.0;
    float tur = 0.55 + 0.9 * (a.r - 0.5) + 0.6 * (b.b - 0.5);
    float rays = pow(sat(1.0 - b.a * 2.2), 2.0) * 1.2;
    float prof = exp(-r * 5.0) * (0.8 + 0.5 * tur) + exp(-r * 1.6) * 0.12 * (0.5 + rays);
    col += heatEmit(uCoreHeat - 0.32 - r * 0.25 + 0.12 * (tur - 0.5)) * prof * uCoreGlow;
  }
  if (hit){
    vec3 p = ro + rd * max(hs.x, 0.0);
    vec3 n = normalize(p - uCoreC);
    float mu = sat(dot(n, -rd));
    vec3 ns = rotY(uSpin) * n;
    vec4 a = nz(ns * 1.7 + vec3(uEvo * 0.15, 0.0, 3.0));
    vec3 w = vec3(a.r, a.b, a.g) - 0.5;
    vec4 c = nz(ns * 3.4 + w * 1.6 + vec3(0.0, 0.0, uEvo * 0.55));
    vec4 d = nz(ns * 8.5 + w * 3.0 + vec3(uEvo * 1.3, 7.0, 0.0));
    float lane = exp(-c.a * 0.8 * 9.0);
    float dome = 1.0 - smoothstep(0.0, 0.95, c.g * 1.1);
    float heat = uCoreHeat - 0.30 * lane + 0.10 * dome - 0.10 * exp(-d.a * 0.8 * 10.0) + 0.08 * (d.r - 0.5);
    heat -= (1.0 - pow(mu, 0.5)) * 0.32;
    col = col * 0.35 + heatEmit(heat);
    depth = max(hs.x, 0.01);
  }
  // cold field haze along the rope: faint, streaked along the axis
  {
    vec3 o = ro - uCoreC;
    // distance of the ray to the axis line (closest approach of two lines)
    vec3 nrm = cross(rd, uAxis);
    float nl = length(nrm);
    float dAx = nl > 1e-4 ? abs(dot(o, nrm)) / nl : length(cross(o, uAxis));
    // position along the axis at closest approach
    vec3 n2 = cross(uAxis, nrm);
    float tc = nl > 1e-4 ? dot(-o, n2) / dot(rd, n2) : 0.0;
    vec3 pc = o + rd * max(tc, 0.0);
    float s = dot(pc, uAxis);
    vec3 perp = pc - uAxis * s;
    float ang = atan(dot(perp, cross(uAxis, vec3(0.0, 1.0, 0.0))), dot(perp, vec3(0.0, 1.0, 0.0)));
    vec4 h = nz(vec3(s * 0.35 - uEvo * 0.4, ang * 1.2 + s * 0.6, uEvo * 0.2));
    float streak = 0.35 + 0.9 * pow(h.b, 2.0);
    float prof = exp(-pow(dAx / uHazeR, 2.0));
    float hz = prof * streak * (hit ? 0.0 : 1.0);
    col += uHazeCol * hz;
  }
  return col * uGain;
}
`;

export const DOF = `
uniform sampler2D uSrc;
uniform float uFocus;     // focus distance (scene units)
uniform float uAperture;  // CoC in target pixels for objects at infinity / half focus distance
uniform float uMaxCoc;    // max CoC radius in target pixels
float cocOf(float z){ return min(uMaxCoc, uAperture * abs(1.0 - uFocus / max(z, 1e-3))); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec4 c = texture(uSrc, uv);
  float cz = c.a, cc = cocOf(cz);
  vec3 acc = c.rgb; float tot = 1.0;
  if (uMaxCoc > 0.5){
    float a0 = ign(gl_FragCoord.xy) * TAU;
    const int N = 40;
    for (int i = 0; i < N; i++){
      float fi = float(i) + 0.5;
      float r = sqrt(fi / float(N)) * uMaxCoc;
      float a = fi * 2.39996323 + a0;
      vec4 s = texture(uSrc, uv + vec2(cos(a), sin(a)) * r / uRes);
      float sc = cocOf(s.a);
      if (s.a > cz) sc = min(sc, cc * 2.0);
      float m = smoothstep(r - 1.0, r + 1.0, sc);
      acc += mix(acc / tot, s.rgb, m);
      tot += 1.0;
    }
  }
  fragColor = vec4(acc / tot, cz);
}`;

export const COMP = `
uniform sampler2D uSrc;
uniform sampler2D uOverlay;
uniform float uHasOverlay;
uniform float uOvGain;     // overlay emission gain (overlay is display-encoded, decoded with ^2.2)
uniform float uOvAbsorb;   // overlay optical depth against the plate (filaments silhouetted on the core)
uniform float uFlash;      // additive in-scene flash radiance
uniform vec3  uFlashCol;
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 col = texture(uSrc, uv).rgb;
  if (uHasOverlay > 0.5){
    vec4 o = texture(uOverlay, uv);
    vec3 e = pow(max(o.rgb, 0.0), vec3(2.2)) * uOvGain;
    float tau = uOvAbsorb * (o.r + o.g + o.b) * 0.3333;
    col = col * exp(-tau) + e;
  }
  col += uFlash * uFlashCol;
  fragColor = vec4(col, 1.0);
}`;
