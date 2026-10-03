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
uniform vec4 uWhip;          // strike whip: amplitude, seconds since strike, front speed (arc length / s), decay (1/s)
uniform vec3 uWhipK;         // whip wavenumber (rad per unit arc length), weight of in-plane (d) and vertical (y) swing
uniform vec3 uWD;            // white dwarf position
uniform float uRake;         // dwarf irradiation: cold blue-white rim light on the dwarf-facing gas
uniform float uDiskIn, uDiskOut, uDiskAmt, uDiskH, uDiskT, uDiskGlow;
uniform float uRingAmt;      // forming ring at the circularisation radius (before the disk exists)
uniform float uRCirc;
uniform float uFlare;        // strike flare of the inner disk (0..)
uniform vec4 uHot;           // hot spot: x, z, strength, arc length along the rim (radians)
uniform vec3 uBoxMin, uBoxMax;
uniform float uPixAng;       // radians per volume-target pixel
uniform float uCool;         // amount of cool absorbing veils in the stream (1 = default)
uniform vec2 uClump;         // bright knot riding the stream: arc length, strength
uniform vec2 uDiskBound;     // disk/ring bounding radius and half-height (0 = no disk), from JS
uniform float uStepK;        // march step multiplier (1 = default; close-ups may relax it)
uniform float uDiskCore;     // radiance of the boundary layer where the disk meets the dwarf

// display temperature -> film palette (crimson -> ember -> gold -> white -> ice blue), linear
vec3 heatColor(float T){
  float x = log2(max(T, 900.0) / 1300.0) * 2.0;     // 1300K:0 1840:1 2600:2 3680:3 5200:4 7350:5 10400:6 14700:7 20800:8
  vec3 c0 = vec3(0.30, 0.012, 0.006);
  vec3 c1 = vec3(0.88, 0.060, 0.016);
  vec3 c2 = vec3(1.00, 0.230, 0.040);
  vec3 c3 = vec3(1.00, 0.500, 0.130);
  vec3 c4 = vec3(1.00, 0.780, 0.480);
  vec3 c5 = vec3(1.00, 0.920, 0.840);
  vec3 c6 = vec3(0.80, 0.890, 1.000);
  vec3 c7 = vec3(0.50, 0.700, 1.000);
  vec3 c8 = vec3(0.34, 0.560, 1.000);
  if (x < 1.0) return mix(c0, c1, sat(x));
  if (x < 2.0) return mix(c1, c2, x - 1.0);
  if (x < 3.0) return mix(c2, c3, x - 2.0);
  if (x < 4.0) return mix(c3, c4, x - 3.0);
  if (x < 5.0) return mix(c4, c5, x - 4.0);
  if (x < 6.0) return mix(c5, c6, x - 5.0);
  if (x < 7.0) return mix(c6, c7, x - 6.0);
  return mix(c7, c8, sat(x - 7.0));
}
// stream radiance law: steep through crimson/gold, strongly compressed above white heat so the hottest gas keeps
// its texture (threads vs lanes) instead of burning out to a flat white
vec3 heatEmission(float T){
  float b = T < 5200.0 ? pow(T / 2600.0, 2.4) : 5.28 * pow(T / 5200.0, 0.55);
  return heatColor(T) * b * 1.25;
}
// disk source function: optically thick, the inner disk blazes white / ice blue, the rim glows crimson
// (moderate radiance so the ice-blue inner disk keeps its colour through the tonemap; only the innermost
// boundary layer and the dwarf itself burn to white)
vec3 diskEmission(float T){ return heatColor(T) * pow(min(T, 20000.0) / 2600.0, 0.7) * 0.55; }

vec4 fieldAt(vec2 xz){
  vec2 uv = (xz - uFieldBox.xy) * uFieldBox.zw;
  vec4 f = texture(uStreamField, clamp(uv, 0.0, 1.0));
  vec2 o = max(max(-uv, uv - 1.0), 0.0) / uFieldBox.zw;
  f.x += sign(f.x) * length(o);
  return f;
}
float gRe = 9.0;          // envelope radius of the last stream sample (adaptive stepping)
float streamW(float s){ return uStreamW * (0.0105 + 0.037 * exp(-max(s, 0.0) / 0.075)); }
float streamWarpAmt(float s){ return 0.5 + 0.55 * uRip * exp(-max(s, 0.0) / 0.12); }

// ---- strike whip: one big transverse kink jerked into the root at L1 that runs down the whole stream -------
// x = arc length behind the travelling front; the kink is a 1.5-cycle wavelet riding just behind the front
float whipAmp(){ return uWhip.x * exp(-uWhip.y * uWhip.w); }
float whipX(float s){ return uWhip.y * uWhip.z - s; }
vec2 whipOffset(float s){
  if (uWhip.x <= 0.0) return vec2(0.0);
  float x = whipX(s);
  float lam = TAU / uWhipK.x;
  float on = smoothstep(-0.01, 0.12 * lam, x);
  float pk = exp(-pow((x - 0.45 * lam) / (0.55 * lam), 2.0));
  float ring = 0.25 * exp(-max(x - lam, 0.0) * 4.0) * step(lam, x);   // small ringing left behind the kink
  float grow = 0.6 + 0.4 * smoothstep(0.0, 0.3, s);                  // the whip's lash grows toward the tip
  float d = whipAmp() * grow * on * sin(uWhipK.x * x) * (pk + ring);
  return d * uWhipK.yz;
}
// brightening crest: compressed gas in the bend of the kink
float whipCrest(float s){
  if (uWhip.x <= 0.0) return 0.0;
  float x = whipX(s);
  float lam = TAU / uWhipK.x;
  return exp(-uWhip.y * uWhip.w * 0.7) * exp(-pow((x - 0.25 * lam) / (0.3 * lam), 2.0)) * smoothstep(-0.02, 0.02, x);
}

// stream sample at p from a field sample f: returns extinction k (per unit length) and emission rate j (radiance
// per unit length). Hot sheets and threads glow and absorb a little (more when very hot and dense); cool clumps
// absorb strongly (dark lanes, depth).
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
  gRe = re;
  if (re > 2.4) return 0.0;
  float cut = smoothstep(uStreamCut, uStreamCut - uStreamFade, s);
  if (cut <= 0.001 || hd < -0.09) return 0.0;
  // twisting cross-section: a few incandescent sheets (curtains) across the stream, folding along it
  float th = 2.2 * (wn.a - 0.35) + a * 0.06;
  vec2 cs = rot2(th) * vec2(dw / w, yw / h);
  vec3 q = vec3(a * 0.5, cs.x * 0.95, cs.y * 0.45 + a * 0.07);
  float sh = ridged3(q, 2) * 1.3 + uDetail * 0.12 * (1.0 - abs(n3(q * 4.1 + 3.0)));
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
  float f2 = fl * fl; fl = f2 * f2 * f2;
  float g2 = fl2 * fl2; g2 *= g2; fl += 0.6 * g2 * g2 * uDetail;
  float clump = 0.45 + 0.85 * sat(n3(vec3(a * 0.16, 3.1, 7.7)) * 0.9 + 0.5);
  float env = exp(-re * re * 0.5) * smoothstep(2.4, 1.4, re);
  float core = sh * sh * sqrt(sqrt(max(sh, 0.0))) * 0.9;
  float knot = uClump.y * exp(-pow((s - uClump.x) / 0.016, 2.0)) * exp(-re * re * 0.8);
  float hot = (env * ((0.03 + 1.5 * core) * m + 1.2 * fl * (0.25 + sh) * headT * cut) * clump + knot * 2.0) * uStreamAmt;
  // cool, dense gas between the sheets: absorbing veils
  float cn = wn.g * 0.75 + 0.25 * (1.0 - sh);
  float cool = uCool * env * smoothstep(0.42, 0.8, cn) * (1.0 - 0.7 * sat(sh)) * m * uStreamAmt * (0.4 + 0.6 * exp(-max(s, 0.0) / 0.25));
  // temperature: gas heats as it falls into the dwarf's potential. The radial law sets the base; sheets and
  // threads carry the contrast (lanes between them stay much cooler, so the hook near pericentre keeps texture)
  float rD = length(p.xz - uWD.xz);
  float Tb = 2000.0 * pow(0.56 / max(rD, 0.03), 0.72);
  float hk = smoothstep(3500.0, 9000.0, Tb);              // 0 far out .. 1 near pericentre
  float T = Tb * mix(0.72 + 0.42 * sh + 0.22 * fl, 0.50 + 0.62 * sh + 0.45 * fl, hk);
  T *= 1.0 + 0.2 * bulb;   // shocked head
  float we = whipCrest(s);
  T *= 1.0 + 0.35 * we;
  hot *= 1.0 + 1.6 * we;
  T *= 1.0 + 0.6 * knot;
  // hot dense gas near pericentre: dimmer per unit density (it is thin and fast) but more opaque, so the threads
  // in front shadow those behind instead of summing to a flat white
  float kb = 1.0 / (1.0 + pow(Tb / 7000.0, 3.0));
  vec3 em = heatEmission(T) * uStreamGlow * hot * (0.35 + 0.65 * kb);
  // the dwarf's cold light: a rim light on the side of the gas facing it (never on the cool veils, never a fill)
  if (uRake > 0.3 && re > 0.4 && hot > 1e-3){
    vec3 L = uWD - p; float r2 = dot(L, L); L *= inversesqrt(r2);
    // facing test: does stepping toward the dwarf leave the stream envelope (lit rim) or go deeper (shadow)?
    vec3 p2 = p + L * w * 0.9;
    vec4 f2 = fieldAt(p2.xz);
    float w2 = streamW(f2.y);
    // same width for both samples: only motion ACROSS the stream toward the dwarf counts (it narrows downstream)
    float e2 = (f2.x - wo.x) * (f2.x - wo.x) / (w * w) + (p2.y - wo.y) * (p2.y - wo.y) / (h * h);
    float e0 = d * d / (w * w) + y * y / (h * h);
    float facing = smoothstep(0.15, 1.0, e2 - e0) * exp(-5.0 * exp(-e2 * 0.6));
    float rim = smoothstep(0.85, 1.6, re);
    em += vec3(0.20, 0.46, 1.0) * (uRake * 4.5 * facing * rim / (0.02 + r2 * 6.0)) * hot;
  }
  j = em * 24.0;
  return (hot * mix(0.3, 0.9, 1.0 - kb) + cool * 1.7) * 26.0;
}

// accretion disk (and forming ring) around the dwarf
float diskH(float r){ return uDiskH * r * pow(max(r, 0.01) / 0.2, 0.125) * (1.0 + 0.6 * smoothstep(0.75, 0.98, r / max(uDiskOut, 0.05))) + 0.0010; }
float diskDensity(vec3 p, out float T, out float br){
  T = 0.0; br = 1.0;
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
  // large sheared turbulent clumps (low radial frequency), then soft shear streaks
  float n = fbm3(vec3(cp * 1.9, lr * 4.5 + q.y / H * 0.15), 3);
  float g2 = n3(vec3(cp * 3.2, lr * 15.0) + 7.0);
  float g1 = n3(vec3(cp * 1.5, lr * 44.0));
  float streaks = sat(0.5 + 0.28 * g1 + 0.6 * g2);
  // tidal two-armed spiral shocks (trailing, fixed in the binary frame), strongest in the outer disk
  float armPh = 2.0 * (phi - 2.0 * lr) + 0.9 + 0.6 * n;
  float arm = pow(0.5 + 0.5 * cos(armPh), 3.0);
  float armW = smoothstep(0.06, 0.18, r);
  float rOut = uDiskOut * (1.0 + 0.035 * n3(vec3(cos(phi) * 3.0, sin(phi) * 3.0, uDiskT * 0.05)));
  float edge = smoothstep(rOut * 1.03, rOut * 0.86, r);
  float rim = 1.0 + 0.5 * exp(-pow((r - rOut * 0.95) / (0.03 * rOut), 2.0));
  float sig = smoothstep(uDiskIn * 0.45, uDiskIn * 1.5, r) * edge * pow(max(r, 0.01) / 0.1, -0.5) * rim;
  float clumps = smoothstep(-0.35, 0.45, n);                           // dark gaps between turbulent clumps
  float tex = (0.45 + 0.55 * streaks) * mix(0.25, 1.0, clumps) * mix(1.0, 0.45 + 1.1 * arm, armW);
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
  // display temperature: steep radial law (inner white / ice blue, outer crimson); arms and clumps run hotter
  // surface brightness texture (what an optically thick disk shows): streaks, clumps and the spiral shocks.
  // Bright clumps run hot, the lanes between them cooler and redder (colour contrast, not grey shading)
  br = (0.55 + 0.6 * streaks) * mix(0.55, 1.15, clumps) * mix(1.0, 0.7 + 0.7 * arm, armW);
  T = 1950.0 * pow(r / max(uDiskOut, 0.05), -1.4) * (0.42 + 0.58 * br);
  T += hs * 3200.0;
  T *= 1.0 + uFlare * 0.3 * exp(-r / 0.12);
  return dens * vert;
}

// conservative-ish distance to any non-empty region; also returns a local feature scale
float volBound(vec3 p, vec4 f, out float scale){
  float w = streamW(f.y);
  float bulb = uStreamHead < 50.0 ? exp(-max(uStreamHead - f.y, 0.0) / 0.035) : 0.0;
  float ws = w * (2.5 + 1.3 * (streamWarpAmt(f.y) + 0.8 * bulb)) + whipAmp() * 1.1;
  float bS = max(abs(f.x) - ws, abs(p.y) - ws * 0.8);
  if (uStreamAmt <= 0.0) bS = 1e3;
  bS = max(bS, (min(f.y - uStreamHead, f.y - uStreamCut) - 0.1) * 0.8);
  vec3 q = p - uWD;
  float r = length(q.xz);
  float bD = uDiskBound.x > 0.0 ? max(r - uDiskBound.x, abs(q.y) - uDiskBound.y) : 1e3;
  scale = bS < bD ? w * (0.78 - 0.25 * uDetail) * (1.0 - 0.3 * bulb) : -(uDiskH * max(r, 0.02) + 0.001);
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
  const int NMAX = 64;
  for (int i = 0; i < NMAX; i++){
    if (t >= tf || tr < 0.015) break;
    vec3 p = ro + rd * t;
    vec4 f = fieldAt(p.xz);
    float scale;
    float b = volBound(p, f, scale);
    float foot = t * uPixAng;
    if (b > foot * 1.5 + 0.0015){ t += max(b * 0.85, foot); skipping = true; continue; }
    bool inDisk = scale < 0.0;
    scale = abs(scale);
    float dt = clamp(scale * 0.32 * uStepK, foot * 1.1, 0.025);
    // thin disk: resolve its vertical profile along oblique rays
    if (inDisk) dt = clamp(min(dt, 0.7 * scale / max(abs(rd.y), 0.08)), foot * 0.6, 0.025);
    // never run out of steps inside the volume: spread what is left over the rest of the box
    dt = max(dt, (tf - t) / float(NMAX - i) * 0.6);
    if (skipping){ t += dt * jit; p = ro + rd * t; f = fieldAt(p.xz); skipping = false; }
    vec3 J = vec3(0.0); float K = 0.0;
    if (uStreamAmt > 0.0){
      vec3 js;
      float ks = streamSample(p, f, js);
      J += js; K += ks;
    }
    if (uDiskAmt + uRingAmt > 0.0 || uHot.z > 0.0){
      float T, br;
      float dd = diskDensity(p, T, br);
      if (dd > 0.0){
        float rr = length(p.xz - uWD.xz);
        // optically thick inner disk (radiance -> source function), translucent outer disk and rim
        float kd = dd * 26.0 * (1.0 + 70.0 * exp(-rr / 0.06));
        vec3 S = diskEmission(T) * (0.6 + 0.4 * br) * uDiskGlow * (1.0 + uFlare * (0.2 + 0.6 * exp(-rr / 0.12)));
        // blinding boundary layer where the disk meets the dwarf
        S += vec3(0.75, 0.86, 1.0) * uDiskCore * exp(-pow((rr - uDiskIn * 1.05) / (0.3 * uDiskIn), 2.0)) * uDiskGlow;
        J += S * kd; K += kd;
      }
    }
    if (gRe > 1.5) dt *= 1.0 + 1.2 * sat((gRe - 1.5) / 0.9);
    gRe = 9.0;
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
