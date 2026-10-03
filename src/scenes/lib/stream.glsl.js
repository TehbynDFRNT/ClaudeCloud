// System-scale volumetrics for the binary: the L1 mass stream and the accretion disk around the white dwarf.
// Units: binary.js (a = 1, orbital plane XZ, Y up). The stream centreline comes from a precomputed signed
// distance field over the orbital plane (lib/binary-stream.js): r = signed distance (+ toward the dwarf side),
// g = arc length s from L1, b = advection time (full stretch), a = advection time (sqrt stretch).
// Emission is HDR radiance (source function S per sample, optical depth from density): never clamped here.
// Rotation sense: seen from +Y (X right, Z down) the disk turns counter-clockwise, i.e. atan(z, x) decreases.
export const STREAM = `
uniform sampler2D uStreamField;
uniform vec4 uFieldBox;      // x0, z0, 1/(x1-x0), 1/(z1-z0)
uniform float uStreamHead;   // arc length reached by the head of the stream (large = fully developed)
uniform float uStreamCut;    // arc length where the stream ends (disk rim / hot spot, or end of path)
uniform float uStreamFade;   // fade length before the cut
uniform float uStreamAmt;    // density multiplier (0 = no stream)
uniform float uStreamW;      // width multiplier
uniform float uStreamGlow;   // emission multiplier
uniform float uRip;          // violence near L1 (sheets tear, edges spray) 0..1
uniform float uFlowT;        // advection clock (stream)
uniform float uDetail;       // extra octave weight for close-ups (0..1)
uniform vec4 uWhip;          // amplitude, seconds since strike, wave speed (arc length / s), decay rate
uniform vec3 uWD;            // white dwarf position
uniform float uRake;         // dwarf irradiation (blue-white raking light) strength
uniform float uDiskIn, uDiskOut, uDiskAmt, uDiskH, uDiskT, uDiskGlow;
uniform float uRingAmt;      // forming ring at the circularisation radius (before the disk exists)
uniform float uRCirc;
uniform float uFlare;        // strike flare of the inner disk (0..)
uniform vec4 uHot;           // hot spot: x, z, strength, arc length along the rim (radians)
uniform vec3 uBoxMin, uBoxMax;
uniform float uPixAng;       // radians per volume-target pixel
uniform vec2 uClump;         // bright knot riding the stream: arc length, strength

// display temperature -> film palette (crimson -> ember -> gold -> white -> ice blue), linear
vec3 heatColor(float T){
  float x = log2(max(T, 900.0) / 1300.0) * 2.0;     // 1300K:0 1840:1 2600:2 3680:3 5200:4 7350:5 10400:6 14700:7 20800:8
  vec3 c0 = vec3(0.30, 0.012, 0.006);
  vec3 c1 = vec3(0.88, 0.060, 0.016);
  vec3 c2 = vec3(1.00, 0.230, 0.040);
  vec3 c3 = vec3(1.00, 0.500, 0.130);
  vec3 c4 = vec3(1.00, 0.780, 0.480);
  vec3 c5 = vec3(1.00, 0.940, 0.880);
  vec3 c6 = vec3(0.86, 0.920, 1.000);
  vec3 c7 = vec3(0.68, 0.820, 1.000);
  vec3 c8 = vec3(0.52, 0.720, 1.000);
  if (x < 1.0) return mix(c0, c1, sat(x));
  if (x < 2.0) return mix(c1, c2, x - 1.0);
  if (x < 3.0) return mix(c2, c3, x - 2.0);
  if (x < 4.0) return mix(c3, c4, x - 3.0);
  if (x < 5.0) return mix(c4, c5, x - 4.0);
  if (x < 6.0) return mix(c5, c6, x - 5.0);
  if (x < 7.0) return mix(c6, c7, x - 6.0);
  return mix(c7, c8, sat(x - 7.0));
}
vec3 heatEmission(float T){
  float b = T < 6000.0 ? pow(T / 2600.0, 2.4) : 7.45 * pow(T / 6000.0, 1.1);   // softer above white heat
  return heatColor(T) * b * 1.25;
}
// disk: gentler radiance law so the inner disk blazes without swallowing the frame
vec3 diskEmission(float T){ return heatColor(T) * pow(T / 2600.0, 1.15) * 1.2; }

vec4 fieldAt(vec2 xz){
  vec2 uv = (xz - uFieldBox.xy) * uFieldBox.zw;
  vec4 f = texture(uStreamField, clamp(uv, 0.0, 1.0));
  vec2 o = max(max(-uv, uv - 1.0), 0.0) / uFieldBox.zw;
  f.x += sign(f.x) * length(o);
  return f;
}
float streamW(float s){ return uStreamW * (0.0105 + 0.037 * exp(-max(s, 0.0) / 0.075)); }
float streamWarpAmt(float s){ return 0.5 + 0.55 * uRip * exp(-max(s, 0.0) / 0.12); }

// strike pulse travelling down the stream (0..1)
float whipEnv(float s){
  if (uWhip.x <= 0.0) return 0.0;
  float front = uWhip.y * uWhip.z;
  return exp(-uWhip.y * uWhip.w) * smoothstep(-0.02, 0.06, front - s) * exp(-max(0.0, front - s) * 3.0) * smoothstep(-0.05, 0.25, s);
}
// transverse whip wave after a strike: displacement of the centreline (in-plane, vertical)
vec2 whipOffset(float s){
  if (uWhip.x <= 0.0) return vec2(0.0);
  float front = uWhip.y * uWhip.z;                 // wave front position along the stream
  float ph = (front - s) * 20.0;
  float env = exp(-uWhip.y * uWhip.w) * smoothstep(-0.02, 0.06, front - s) * exp(-max(0.0, front - s) * 3.0);
  float grow = smoothstep(-0.05, 0.25, s);
  return uWhip.x * env * grow * vec2(sin(ph), 0.6 * cos(ph * 0.83 + 1.0));
}

// stream sample at p from a field sample f: returns extinction k (per unit length) and emission rate j (radiance
// per unit length). Hot sheets and threads glow and barely absorb; cool dense clumps absorb (dark lanes, depth).
float streamSample(vec3 p, vec4 f, out vec3 j){
  j = vec3(0.0);
  float s = f.y;
  float d = f.x, y = p.y;
  vec2 wo = whipOffset(s);
  d -= wo.x; y -= wo.y;
  // developing head: a tapering, more turbulent tongue
  float hd = uStreamHead - s;
  float bulb = uStreamHead < 50.0 ? exp(-max(hd, 0.0) / 0.035) : 0.0;
  float w = streamW(s) * (1.0 - 0.4 * bulb), h = w * 0.8;
  float a = f.w * 4.0 - uFlowT;                     // advected along-stream coordinate for sheets (sqrt stretch)
  float af = f.z * 1.1 - uFlowT * 0.12;             // fully stretched coordinate for the fine streaks
  // low-frequency warp of the cross-section (one fetch, two decorrelated channels): meanders, folds, ragged edges
  vec4 wn = n4(vec3(a * 0.22, d / w * 0.30, y / h * 0.30 + a * 0.05) + vec3(0.0, 0.0, uFlowT * 0.02));
  float warpAmt = streamWarpAmt(s) + 0.8 * bulb;
  float dw = d + w * warpAmt * (wn.r * 2.0 - 1.0) * 1.3;
  float yw = y + h * warpAmt * (wn.b * 2.0 - 1.0) * 1.3;
  float re = sqrt(dw * dw / (w * w) + yw * yw / (h * h));
  if (re > 2.4) return 0.0;
  float cut = smoothstep(uStreamCut, uStreamCut - uStreamFade, s);
  if (cut <= 0.001 || hd < -0.09) return 0.0;
  // twisting cross-section: a few incandescent sheets (curtains) across the stream, folding along it
  float th = 2.2 * (wn.a - 0.35) + a * 0.06;
  vec2 cs = rot2(th) * vec2(dw / w, yw / h);
  vec3 q = vec3(a * 0.5, cs.x * 0.95, cs.y * 0.45 + a * 0.07);
  float sh = ridged3(q, 3) * 1.15;
  // head of a developing stream: ragged, fingered front (sheets run ahead, gaps lag)
  float fr = 0.03 + 0.05 * min(uStreamHead, 1.0);
  float hn = hd + 0.05 * (sh - 0.45) + 0.03 * (wn.g - 0.5) - 0.01 * re * re;
  float head = smoothstep(-0.005, fr, hn);
  float headT = smoothstep(-0.022, fr * 0.6, hn);         // threads run ahead of the bulk
  float m = head * cut;
  if (headT * cut <= 0.001) return 0.0;
  // braided threads along the flow (coarse + fine)
  float fl = 1.0 - abs(n3(vec3(af, cs.x * 2.2, cs.y * 1.7) + 13.0));
  float fl2 = uDetail > 0.0 ? 1.0 - abs(n3(vec3(af * 1.7 + 5.0, cs.x * 5.5, cs.y * 4.5) + 37.0)) : 0.0;
  fl = pow(fl, 6.0) + 0.6 * pow(fl2, 8.0) * uDetail;
  float det = uDetail > 0.0 ? uDetail * pow(1.0 - abs(n3(q * vec3(2.2, 3.4, 3.0) + 29.0)), 4.0) : 0.0;
  float clump = 0.45 + 0.85 * sat(n3(vec3(a * 0.16, 3.1, 7.7)) * 0.9 + 0.5);
  float env = exp(-re * re * 0.5) * smoothstep(2.4, 1.4, re);
  float core = pow(sh, 2.4) * (1.0 + 0.8 * det);
  float knot = uClump.y * exp(-pow((s - uClump.x) / 0.016, 2.0)) * exp(-re * re * 0.8);
  float hot = (env * ((0.03 + 1.5 * core) * m + 1.2 * fl * (0.25 + sh) * headT * cut) * clump + knot * 2.0) * uStreamAmt;
  // cool, dense gas between the sheets: absorbing veils
  float cn = wn.g * 0.6 + 0.4 * (n3(vec3(a * 0.4, cs.x * 0.8, cs.y * 0.7) + 41.0) * 0.5 + 0.5);
  float cool = env * smoothstep(0.42, 0.8, cn) * (1.0 - 0.7 * sat(sh)) * m * uStreamAmt * (0.4 + 0.6 * exp(-max(s, 0.0) / 0.25));
  // temperature: gas heats as it falls into the dwarf's potential; sheets and threads hotter in their cores
  float rD = length(p.xz - uWD.xz);
  float T = 2000.0 * pow(0.56 / max(rD, 0.03), 0.72) * (0.72 + 0.42 * sh + 0.22 * fl);
  T *= 1.0 + 0.2 * bulb;   // shocked head
  float we = whipEnv(s);
  T *= 1.0 + 0.5 * we;
  hot *= 1.0 + 1.5 * we;
  T *= 1.0 + 0.6 * knot;
  // raking light from the dwarf: scattered by all gas, on the side facing it (envelope sampled toward the dwarf)
  vec3 rake = vec3(0.0);
  if (uRake > 0.01){
    vec3 l = normalize(uWD - p);
    vec3 p2 = p + l * w * 1.2;
    vec4 f2 = fieldAt(p2.xz);
    float w2 = streamW(f2.y);
    float e22 = (f2.x * f2.x) / (w2 * w2) + p2.y * p2.y / (w2 * w2 * 0.64);
    float lit = exp(-6.0 * exp(-e22 * 0.6));
    float rD2 = dot(p - uWD, p - uWD);
    rake = vec3(0.55, 0.75, 1.0) * uRake * lit / (0.02 + rD2 * 6.0);
  }
  j = (heatEmission(T) * uStreamGlow * hot + rake * (hot + cool) * 0.5) * 24.0;
  return (hot * 0.3 + cool * 1.7) * 26.0;
}

// accretion disk (and forming ring) around the dwarf
float diskH(float r){ return uDiskH * r * pow(max(r, 0.01) / 0.2, 0.125) * (1.0 + 0.6 * smoothstep(0.75, 0.98, r / max(uDiskOut, 0.05))) + 0.0010; }
float diskDensity(vec3 p, out float T){
  T = 0.0;
  vec3 q = p - uWD;
  float r = length(q.xz);
  float H = diskH(r);
  float z2 = q.y * q.y / (H * H);
  if (z2 > 9.0) return 0.0;
  float phi = atan(q.z, q.x);
  float lr = log(max(r, 1e-3));
  float om = 0.34 * pow(max(r, 0.012) / 0.1, -1.5);                  // visual Keplerian angular speed (rad/s)
  float pa = phi + om * uDiskT;                                        // pattern frozen into the gas
  vec2 cp = vec2(cos(pa), sin(pa));
  float n = fbm3(vec3(cp * 2.2, lr * 9.0 + q.y / H * 0.2), 3);          // large turbulent patches
  float g1 = n3(vec3(cp * 1.5, lr * 52.0));                             // fine concentric shear streaks
  float g2 = n3(vec3(cp * 3.6, lr * 23.0) + 7.0);
  float streaks = sat(0.5 + 0.85 * g1 + 0.5 * g2);
  float arm = 0.5 + 0.5 * cos(2.0 * (phi - 1.7 * lr) + 0.9);           // tidal two-armed spiral, fixed in the binary frame
  float rOut = uDiskOut * (1.0 + 0.035 * n3(vec3(cos(phi) * 3.0, sin(phi) * 3.0, uDiskT * 0.05)));
  float edge = smoothstep(rOut * 1.03, rOut * 0.86, r);
  float rim = 1.0 + 0.5 * exp(-pow((r - rOut * 0.95) / (0.03 * rOut), 2.0));
  float sig = smoothstep(uDiskIn * 0.45, uDiskIn * 1.5, r) * edge * pow(max(r, 0.01) / 0.1, -0.5) * rim;
  float tex = (0.3 + 0.7 * streaks) * pow(sat(0.62 + 0.85 * n), 1.4) * (0.62 + 0.7 * arm);
  float dens = uDiskAmt * sig * tex;
  // hot spot and the heated rim downstream of it (downstream = decreasing phi)
  float hs = 0.0;
  if (uHot.z > 0.0){
    float phH = atan(uHot.y - uWD.z, uHot.x - uWD.x);
    float dphi = mod(phH - phi + 0.15, TAU) - 0.15;
    float rimR = exp(-pow((r - uDiskOut * 0.94) / (0.03 * uDiskOut / 0.27), 2.0));
    hs = uHot.z * rimR * exp(-max(dphi, 0.0) / uHot.w) * smoothstep(-0.15, 0.0, dphi) * (0.6 + 0.6 * streaks);
    vec2 dh = q.xz + uWD.xz - uHot.xy;
    hs += uHot.z * 1.3 * exp(-dot(dh, dh) / (0.016 * 0.016));
    dens += hs * 0.5 * (0.7 + 0.5 * n);
  }
  // forming ring at the circularisation radius
  if (uRingAmt > 0.0){
    float ring = exp(-pow((r - uRCirc) / 0.03, 2.0)) * (0.5 + 0.7 * streaks) * (0.6 + 0.5 * sat(n + 0.4));
    dens += uRingAmt * ring;
  }
  float vert = exp(-0.35 * z2 * sqrt(z2));                              // flat-topped, sharp-edged vertical profile
  // display temperature: steep radial law (inner ice-white, outer crimson)
  T = 2050.0 * pow(r / max(uDiskOut, 0.05), -1.2) * (0.85 + 0.3 * streaks);
  T += hs * 3200.0;
  T *= 1.0 + uFlare * 0.45 * exp(-r / 0.12);
  return dens * vert;
}

// conservative-ish distance to any non-empty region; also returns a local feature scale
float volBound(vec3 p, vec4 f, out float scale){
  float w = streamW(f.y);
  float bulb = uStreamHead < 50.0 ? exp(-max(uStreamHead - f.y, 0.0) / 0.035) : 0.0;
  float ws = w * (2.5 + 1.3 * (streamWarpAmt(f.y) + 0.8 * bulb)) + uWhip.x * 1.2;
  float bS = max(abs(f.x) - ws, abs(p.y) - ws * 0.8);
  if (uStreamAmt <= 0.0) bS = 1e3;
  bS = max(bS, (min(f.y - uStreamHead, f.y - uStreamCut) - 0.1) * 0.8);
  vec3 q = p - uWD;
  float r = length(q.xz);
  float ro = max(uDiskOut * 1.1, (uRingAmt > 0.0 ? uRCirc + 0.1 : 0.0));
  float bD = (uDiskAmt + uRingAmt > 0.0 || uHot.z > 0.0) ? max(r - ro, abs(q.y) - diskH(ro) * 3.2) : 1e3;
  scale = bS < bD ? w * (0.62 - 0.2 * uDetail) * (1.0 - 0.5 * bulb) : diskH(max(r, 0.02));
  return min(bS, bD);
}

// march stream + disk. returns (radiance, transmittance)
vec4 marchSystem(vec3 ro, vec3 rd, float tMax, float jit){
  vec3 inv = 1.0 / (rd + sign(rd) * 1e-6 + vec3(equal(rd, vec3(0.0))) * 1e-6);
  vec3 ta = (uBoxMin - ro) * inv, tb = (uBoxMax - ro) * inv;
  vec3 tsm = min(ta, tb), tbg = max(ta, tb);
  float tn = max(max(tsm.x, tsm.y), max(tsm.z, 0.0));
  float tf = min(min(tbg.x, tbg.y), min(tbg.z, tMax));
  if (tn >= tf) return vec4(0.0, 0.0, 0.0, 1.0);
  vec3 col = vec3(0.0);
  float tr = 1.0;
  float t = tn;
  bool skipping = true;
  for (int i = 0; i < 110; i++){
    if (t >= tf || tr < 0.012) break;
    vec3 p = ro + rd * t;
    vec4 f = fieldAt(p.xz);
    float scale;
    float b = volBound(p, f, scale);
    float foot = t * uPixAng;
    if (b > foot * 1.5 + 0.0015){ t += max(b * 0.85, foot); skipping = true; continue; }
    float dt = clamp(scale * 0.32, foot * 1.1, 0.025);
    if (skipping){ t += dt * jit; p = ro + rd * t; f = fieldAt(p.xz); skipping = false; }
    vec3 J = vec3(0.0); float K = 0.0;
    if (uStreamAmt > 0.0){
      vec3 js;
      float ks = streamSample(p, f, js);
      J += js; K += ks;
    }
    if (uDiskAmt + uRingAmt > 0.0 || uHot.z > 0.0){
      float T;
      float dd = diskDensity(p, T);
      if (dd > 0.0){
        vec3 e = diskEmission(T) * uDiskGlow * (1.0 + uFlare * (0.35 + exp(-length(p.xz - uWD.xz) / 0.12)));
        J += e * dd * 26.0; K += dd * 26.0;
      }
    }
    if (K > 1e-4 || dot(J, J) > 1e-10){
      float tau = K * dt;
      float a = tau > 1e-4 ? (1.0 - exp(-tau)) / K : dt;
      col += tr * J * a;
      tr *= exp(-tau);
    }
    t += dt;
  }
  return vec4(col, tr);
}
`;
