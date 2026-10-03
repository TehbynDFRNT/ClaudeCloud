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
  // breakpoints chosen so dim plasma reads crimson (never brown) and orange only appears when bright
  const vec3 k0 = vec3(0.22, 0.006, 0.004);
  const vec3 k1 = vec3(0.75, 0.028, 0.012);   // deep crimson   (h 0.30)
  const vec3 k2 = vec3(1.00, 0.150, 0.030);   // ember          (h 0.50)
  const vec3 k3 = vec3(1.00, 0.420, 0.070);   // molten gold    (h 0.66)
  const vec3 k4 = vec3(1.00, 0.760, 0.420);   // white-gold     (h 0.82)
  const vec3 k5 = vec3(1.00, 0.950, 0.880);   // white          (h 1.00)
  if (h < 0.30) return mix(k0, k1, sat(h / 0.30));
  if (h < 0.50) return mix(k1, k2, (h - 0.30) / 0.20);
  if (h < 0.66) return mix(k2, k3, (h - 0.50) / 0.16);
  if (h < 0.82) return mix(k3, k4, (h - 0.66) / 0.16);
  return mix(k4, k5, sat((h - 0.82) / 0.18));
}
float heatI(float h){ return 0.03 * exp(7.6 * h); }
// soft knee above 0.85 so whole cells cannot run away to thousands (cores still clip white)
float heatKnee(float h){ return h < 0.82 ? h : 0.82 + 0.2 * (1.0 - exp(-(h - 0.82) / 0.2)); }
vec3 heatEmit(float h){ h = heatKnee(h); return heatColor(h) * heatI(h); }
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
uniform float uSoft;      // half thickness of the translucent skin (world units)
uniform float uSigma;     // extinction inside the plasma body (per world unit)
uniform float uSkin;      // heat drop across the skin (cooler, redder edges)
uniform float uFlowRate;  // outflow cycles per unit of uEvo
uniform vec4  uVents[4];  // white-hot eruption vents on the surface: xyz, strength

// coarse surface sample (3 fetches): chained domain warp -> cells
struct Cell { float h; float heat; vec2 w; vec2 q; float F1; float plat; float core; };
Cell boilCoarse(vec2 xz){
  Cell C;
  vec2 q = xz * uCell + uDrift;
  vec4 a = nz(vec3(q * 0.31, uEvo * 0.07 + 1.7));
  vec2 w1 = (a.rb - 0.5) * 2.0 * uWarp;
  w1 = rot2(uFlowSpin * (a.r - 0.5)) * w1;
  vec4 b = nz(vec3(q * 0.93 + w1 * 1.1 + 9.3, uEvo * 0.21 + 4.1));
  vec2 w2 = (b.rb - 0.5) * 2.0 * uWarp;
  vec2 w = w1 * 0.75 + w2 * 0.45;
  vec4 c = nz(vec3(q + w, uEvo));
  float F1 = c.g * 1.1, E1 = c.a * 0.8;
  float dome = 1.0 - smoothstep(0.0, 1.0, F1);
  float plat = smoothstep(0.0, 0.22, E1);          // 0 in the (narrow) lanes, 1 on the cell body
  float core = exp(-F1 * F1 * 10.0);               // compact upflow core
  float cellHot = min(1.25, 0.78 + 1.3 * (a.g - 0.45)); // some cells hotter than others
  C.h = (0.55 * plat + 0.25 * dome - 0.45 + 0.25 * (b.g - 0.5)) * uRelief;
  C.heat = 0.04 + plat * (0.20 + 0.34 * dome * cellHot) + 0.36 * core * cellHot * plat;
  for (int i = 0; i < 4; i++){
    if (uVents[i].w <= 0.0) continue;
    vec2 dv = xz - uVents[i].xz;
    float v = exp(-dot(dv, dv) / 0.02);
    C.heat += uVents[i].w * v * (0.8 + 0.4 * c.r);
    C.h += uVents[i].w * v * uRelief * 0.6;
  }
  C.w = w2; C.q = q + w; C.F1 = F1; C.plat = plat; C.core = core;
  return C;
}

// fine structure riding on the cells (2 fetches): marbled flow, bright filaments, dark veins,
// and small fast-popping bubbles. x = heat offset, y = density modulation
vec2 boilFlow(vec3 p, Cell C, float k){
  if (k < 0.02) return vec2(0.0);
  vec2 qf = C.q * 2.9 + C.w * 0.35;
  vec4 n = nz(vec3(qf, uEvo * uFlowRate + 7.0));
  float marble = n.b - 0.5;
  float rid = 1.0 - abs(n.r * 2.0 - 1.0);
  float fil = rid * rid * rid * rid;                         // thin bright threads
  float gran = 1.0 - smoothstep(0.0, 0.8, n.g * 1.1);        // granules
  float vein = exp(-n.a * 0.8 * 12.0);                       // dark veins between granules
  vec4 m = nz(vec3(qf * 2.45 + (n.rb - 0.5) * 0.5 + 3.1, uEvo * uFlowRate * 2.6 + 19.0));
  float bub = 1.0 - smoothstep(0.0, 0.7, m.g * 1.1);         // small boiling bubbles
  float rim = exp(-m.a * 0.8 * 10.0);
  float tur = m.r - 0.5;
  float heat = k * uDetail * (C.plat * (0.06 * marble + 0.11 * fil + 0.04 * gran + 0.09 * bub * bub + 0.06 * tur - 0.05)
                              - 0.035 * vein * (0.3 + 0.7 * C.plat) - 0.03 * rim * C.plat);
  float dens = k * uDetail * (0.4 * marble + 0.4 * gran + 0.4 * bub - 0.5 * vein - 0.3 * rim);
  return vec2(heat, dens);
}

float boilWisp(vec3 p, vec2 w){
  vec3 q = vec3(p.x * uCell + w.x * 0.35, (p.y - uRise) * uCell * 1.6, p.z * uCell + w.y * 0.35) * 1.15;
  vec4 n = nz(q + vec3(0.0, 0.0, uEvo * 0.35));
  float v = n.r * 0.6 + n.b * 0.4;
  return smoothstep(0.50, 0.80, v) * (0.6 + 0.8 * n.g);
}

vec3 boilSky(vec3 rd){
  float e = max(rd.y, 0.0);
  return uHaze * (exp(-e * 9.0) * 0.9 + 0.1 * exp(-e * 2.0));
}

// Emission/absorption march through the plasma body (soft cellular top surface) and the wisps above it.
vec3 boilMarch(vec3 ro, vec3 rd, out float depth){
  float ytop = uRelief * 0.6 + uSoft + uPlumeH * 3.0;
  float ybot = -uRelief - 0.6;
  depth = uTMax;
  vec3 col = vec3(0.0);
  float T = 1.0, t = 0.0;
  if (ro.y > ytop){
    if (rd.y >= -1e-4) return boilSky(rd) * uGain;
    t = (ytop - ro.y) / rd.y;
  }
  float tExit = rd.y < 0.0 ? min(uTMax, (ybot - ro.y) / rd.y) : uTMax;
  float dIn = 0.45 / uSigma;
  t += ign(gl_FragCoord.xy) * dIn;
  for (int i = 0; i < 48; i++){
    if (t > tExit || T < 0.03) break;
    vec3 p = ro + rd * t;
    Cell f = boilCoarse(p.xz);
    float dy = p.y - f.h;
    float fog = exp(-t * uFog);
    float dt;
    if (dy < uSoft){
      float rho = smoothstep(uSoft, -uSoft, dy);
      float far = smoothstep(uTMax * 0.3, uTMax * 0.95, t);
      vec2 fi = boilFlow(p, f, 1.0 - far);
      float heat = f.heat + fi.x - (1.0 - rho) * uSkin;
      heat = mix(heat, 0.16 + 0.45 * f.heat, far * 0.7);
      float sig = uSigma * rho * max(0.15, 1.0 + fi.y);
      dt = dIn * (1.0 + t * 0.12);
      float a = 1.0 - exp(-sig * dt);
      col += T * a * fog * heatEmit(heat * uHeatGain + uHeat);
      T *= 1.0 - a;
      if (T < 0.5 && depth >= uTMax) depth = t;
    } else {
      dt = clamp((dy - uSoft) * 0.6, dIn * 0.5 * (1.0 + t * 0.3), 0.3 + t * 0.03);
      if (uPlume > 0.0 && dy < uPlumeH * 4.0){
        float dens = uPlume * boilWisp(p, f.w) * exp(-dy / uPlumeH);
        float hw = f.heat * 0.9 - dy / max(uPlumeH, 0.02) * 0.1 - 0.06;
        col += T * fog * heatEmit(hw * uHeatGain + uHeat) * dens * dt;
        T *= exp(-dens * dt * uAbsorb);
        if (T < 0.55 && depth >= uTMax) depth = t;
      }
    }
    t += dt;
  }
  float tf = min(t, uTMax);
  col += T * (rd.y > 0.0 ? boilSky(rd) : uHaze) * (1.0 - exp(-tf * uFog)) + (1.0 - T) * uHaze * (1.0 - exp(-depth * uFog)) * 0.5;
  return col * uGain;
}
`;

// Fully volumetric boiling plasma: warped 3D convection cells (hot interiors, cool absorbing walls),
// rising and churning; seen as overlapping glowing bubbles at many depths.
export const VOLBOIL = `
uniform float uEvo, uCell, uWarp, uHeat, uHeatGain, uGain, uRise, uTMax, uFog, uDetail, uSigma, uEmis, uFlowSpin;
uniform vec3 uHaze;
uniform vec3 uRiseDir;    // direction the plasma streams (unit)
uniform float uNear;      // march start distance

vec3 volSample(vec3 p, out float sig){
  vec3 q = p * uCell - uRiseDir * uRise;
  vec4 a = nz(q * 0.29 + vec3(1.7, 4.2, uEvo * 0.05));
  vec3 w = (vec3(a.r, a.b, a.g) - 0.5) * 2.0 * uWarp;
  w.xz = rot2(uFlowSpin * (a.r - 0.5)) * w.xz;
  vec4 c = nz(q + w + vec3(0.0, 0.0, uEvo * 0.35));
  vec4 d = nz(q * 2.7 + w * 1.6 + vec3(uEvo * 0.6, 3.3, 0.0));
  float F1 = c.g * 1.1, E1 = c.a * 0.8;
  float tur = (d.r - 0.5) + (d.b - 0.5) * 0.6;
  float blob = 1.0 - smoothstep(0.12, 0.78, F1 + tur * 0.38 * uDetail);
  float wall = exp(-E1 * 9.0);
  float hot = 0.85 + 0.6 * (a.g - 0.5);
  float heat = 0.18 + 0.78 * blob * blob * hot - 0.12 * wall + 0.10 * uDetail * (d.a - 0.4);
  float dens = blob * (0.55 + 0.6 * d.g) + 0.04;
  sig = uSigma * (0.18 + 0.9 * wall + 0.35 * (1.0 - blob));
  return heatEmit(heat * uHeatGain + uHeat) * dens;
}

vec3 volMarch(vec3 ro, vec3 rd, out float depth){
  vec3 col = vec3(0.0);
  float T = 1.0;
  depth = uTMax;
  float t = uNear;
  float j = ign(gl_FragCoord.xy);
  const int N = 44;
  float dt0 = (uTMax - uNear) / float(N) * 0.7;
  t += j * dt0;
  for (int i = 0; i < N; i++){
    if (t > uTMax || T < 0.03) break;
    float dt = dt0 * (0.6 + 0.8 * float(i) / float(N));
    vec3 p = ro + rd * t;
    float sig;
    vec3 e = volSample(p, sig);
    float fog = exp(-t * uFog);
    col += T * e * uEmis * dt * fog;
    T *= exp(-sig * dt);
    if (T < 0.5 && depth >= uTMax) depth = t;
    t += dt;
  }
  col += T * uHaze;
  return col * uGain;
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
    float heat = uCoreHeat - 0.13 * lane + 0.08 * dome - 0.06 * exp(-d.a * 0.8 * 10.0) + 0.10 * (d.r - 0.5) + 0.06 * (d.b - 0.5);
    heat -= (1.0 - pow(mu, 0.6)) * 0.42;
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
uniform int uTaps;        // gather taps (24..48)
float cocOf(float z){ return min(uMaxCoc, uAperture * abs(1.0 - uFocus / max(z, 1e-3))); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec4 c = texture(uSrc, uv);
  float cz = c.a, cc = cocOf(cz);
  vec3 acc = c.rgb; float tot = 1.0;
  if (uMaxCoc > 0.5){
    float a0 = ign(gl_FragCoord.xy) * TAU;
    int N = uTaps;
    for (int i = 0; i < 48; i++){
      if (i >= N) break;
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
uniform sampler2D uLines;
uniform float uHasLines;
uniform float uLineGain;    // gain on the stroke layer (filaments / sparks, already HDR)
uniform float uLineAbsorb;  // optical depth of strokes against the plate (filaments silhouetted on the core)
uniform float uFlash;       // additive in-scene flash radiance
uniform vec3  uFlashCol;
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 col = texture(uSrc, uv).rgb;
  if (uHasLines > 0.5){
    vec3 e = texture(uLines, uv).rgb * uLineGain;
    float tau = uLineAbsorb * min(dot(e, vec3(0.3333)), 8.0) * 0.25;
    col = col * exp(-tau) + e;
  }
  col += uFlash * uFlashCol;
  fragColor = vec4(col, 1.0);
}`;
