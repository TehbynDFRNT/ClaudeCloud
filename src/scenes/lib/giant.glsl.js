// GOLIATH: shared red-giant shading so close-ups and system shots match.
// Units: giant radius = uGiantR (scene units). Object space = world - uGiantPos, rotated by uGiantSpin.
// Display temperature palette (artistic mapping of emission temperature):
//   ~1500 K crimson lanes -> ~2200 K ember -> ~3300 K gold upflows; brightness ~ (T/2200)^4.
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
uniform float uRelief;        // surface relief of convection cells as fraction of R (close-ups: ~0.004)
uniform float uLimbDark;      // limb darkening strength (default 0.62)

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

// surface radius in direction n (object space, unit vector)
float giantRadius(vec3 n){
  float b = pow(max(0.0, dot(n, uBulgeDir)), 5.0);
  float r = uGiantR * (1.0 + uBulge * b + uBulge * 0.15 * max(0.0, dot(n, uBulgeDir)));
  if (uRelief > 0.0){
    vec3 ns = rotY(uGiantSpin) * n;
    vec2 c = cells3(ns * 4.6 + vec3(uTime * uBoil * 0.035, -uTime * uBoil * 0.02, uTime * uBoil * 0.03));
    r += uRelief * uGiantR * (smoothstep(0.0, 0.3, c.y) * (1.0 - c.x) - 0.3);
  }
  return r;
}

// temperature on the photosphere at object-space unit vector n; mu = cos(view angle)
float giantTemperature(vec3 n, float mu, float t){
  float tt = t * uBoil;
  vec3 p = n * 1.55 + vec3(0.0, tt * 0.012, tt * 0.021);
  vec3 w = vec3(fbm3(p * 1.4 + 5.2, 3), fbm3(p * 1.4 + 9.1, 3), fbm3(p * 1.4 + 1.7, 3));
  vec2 c = cells3(p + w * 0.55);
  float lane = smoothstep(0.0, 0.32, c.y);                 // broad, soft downflow lanes
  float up = 1.0 - smoothstep(0.05, 1.0, c.x);             // hot upflow cores
  vec3 q = n * 4.6 + w * 0.9 + vec3(tt * 0.035, -tt * 0.02, tt * 0.03);
  vec2 c2 = cells3(q);
  float gran = smoothstep(0.0, 0.3, c2.y) * (1.0 - 0.6 * smoothstep(0.0, 0.9, c2.x));
  float fine = fbm3(n * 13.0 + w * 1.5 + vec3(0.0, 0.0, tt * 0.08), 4);
  float mott = fbm3(n * 2.6 + w * 0.6 + vec3(tt * 0.01), 3);
  float T = 1750.0 + 950.0 * up * (0.35 + 0.65 * lane) + 330.0 * gran * (0.5 + 0.5 * lane) + 170.0 * fine + 220.0 * mott;
  T *= mix(0.80, 1.0, lane);
  // cool starspots: rare large dark patches
  float spot = smoothstep(0.62, 0.78, fbm3(n * 2.1 + 40.0 + vec3(0.0, 0.0, tt * 0.005), 3) * 0.5 + 0.5);
  T *= 1.0 - 0.32 * spot;
  // limb: we see higher, cooler layers
  T *= mix(1.0 - 0.55 * uLimbDark, 1.0, pow(sat(mu), 0.42));
  // aftermath heating / ablation on the hemisphere facing the nova
  if (uScar > 0.0){
    float f = sat(dot(n, uScarDir));
    float rag = fbm3(n * 6.0 + 17.0, 4) * 0.5 + 0.5;
    float burn = smoothstep(0.15, 0.95, f + (rag - 0.5) * 0.6) * uScar;
    T = mix(T, T * (0.55 + 0.25 * rag), burn * 0.65);           // scorched, torn layers
    T += burn * 1600.0 * pow(rag, 3.0) * smoothstep(0.5, 1.0, f); // shock-heated filaments
  }
  return T;
}

// returns rgb radiance; a = coverage (1 on disk); dist = hit distance (1e9 if none)
vec4 giantShade(vec3 ro, vec3 rd, float t, out float dist){
  vec3 o = ro - uGiantPos;
  mat3 spin = rotY(uGiantSpin);
  float rMax = uGiantR * (1.0 + uBulge * 1.2) * 1.42;
  vec2 hs = sphereHit(o, rd, vec3(0.0), rMax);
  dist = 1e9;
  if (hs.y < 0.0) return vec4(0.0);
  vec3 col = vec3(0.0);
  float trans = 1.0;
  float t0 = max(hs.x, 0.0), t1 = hs.y;
  // find photosphere: sphere-trace the (possibly tidally distorted) surface
  float th = t0; bool hit = false;
  vec2 core = sphereHit(o, rd, vec3(0.0), uGiantR * (1.0 + uBulge * 1.2));
  if (core.y > 0.0){
    th = max(core.x, 0.0);
    for (int i = 0; i < 40; i++){
      vec3 p = o + rd * th; float r = length(p);
      float d = r - giantRadius(p / r);
      if (d < 0.0005 * uGiantR){ hit = true; break; }
      th += d * (uBulge > 0.0 ? 0.6 : 0.95);
      if (th > core.y) break;
    }
  }
  float tEnd = hit ? th : t1;
  // extended atmosphere + plumes (emissive, slightly absorbing), only near the limb
  vec3 pc = o + rd * max(0.0, dot(-o, rd));
  float impact = length(pc) / uGiantR;           // ray closest approach in radii
  float atmW = hit ? smoothstep(0.35, 0.75, impact) : 1.0;
  if (atmW > 0.0){
    const int N = 26;
    float dt = (tEnd - t0) / float(N);
    float j = ign(gl_FragCoord.xy);
    for (int i = 0; i < N; i++){
      vec3 p = o + rd * (t0 + (float(i) + j) * dt);
      float r = length(p); vec3 n = p / r;
      float h = (r - giantRadius(n)) / uGiantR;
      if (h < 0.0) continue;
      vec3 ns = spin * n;
      float base = exp(-h / 0.035) * 1.2 + exp(-h / 0.12) * 0.12;
      float pl = 0.0;
      if (uPlumes > 0.0){
        // arcs and loops: ridged noise on the sphere, slowly lifting with height
        vec3 q = ns * 3.4 + vec3(0.0, t * uBoil * 0.01, 0.0) + vec3(h * 1.8, h * 3.5, -h * 1.2);
        float rid = ridged3(q, 4);
        float mask = smoothstep(0.15, 0.6, n3(ns * 1.3 + 8.0) * 0.5 + 0.5);
        pl = pow(rid, 2.6) * exp(-h / 0.10) * uPlumes * 2.2 * mask * smoothstep(0.0, 0.015, h);
      }
      float dens = (base + pl) * dt / uGiantR * atmW;
      float T = 1650.0 + 500.0 * exp(-h / 0.05) + pl * 120.0;
      col += trans * giantEmission(T) * dens * 0.9;
      trans *= exp(-dens * 0.7);
    }
  }
  if (hit){
    vec3 p = o + rd * th; vec3 n = normalize(p);
    float mu = sat(dot(n, -rd));
    vec3 ns = spin * n;
    float T = giantTemperature(ns, mu, t);
    // fine granulation riding on the large cells: strongly warped so it never reads as tiles
    vec3 fp = ns * 15.0;
    vec3 fw = vec3(n3(fp * 0.6 + 3.0), n3(fp * 0.6 + 17.0), n3(fp * 0.6 + 29.0));
    vec2 cf = cells3(fp + fw * 1.6 + vec3(0.0, 0.0, t * uBoil * 0.06));
    float g1 = smoothstep(0.0, 0.45, cf.y) * (1.0 - 0.7 * cf.x);
    float g2 = n3(ns * 38.0 + fw * 2.0) * 0.5 + 0.5;
    T *= 0.93 + 0.06 * g1 + 0.04 * g2;
    float limb = 1.0 - uLimbDark * (1.0 - pow(mu, 0.5));   // strong limb darkening
    col += trans * giantEmission(T) * limb;
    dist = th;
    return vec4(col * uGiantGlow, 1.0);
  }
  return vec4(col * uGiantGlow, 1.0 - trans);
}
`;
