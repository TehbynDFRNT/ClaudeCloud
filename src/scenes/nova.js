// NOVA: thermonuclear runaway on the white dwarf; the eruption, the shock front, the fractured shell.
// Two passes per frame: a volumetric pass into a reduced-resolution target (rgb radiance, a transmittance),
// then a full-resolution composite (stars, the giant, the dwarf point, refraction) into the scene target.
//
// Preset params (all scalar params accept a number or keys [[localSec, value, easing?], ...]):
//   mode: 'fire' | 'system' | 'wave' | 'shell'
//   cam: camera keys (lib/util.js), volScale: resolution of the volumetric pass (number or keys)
//   fire/system: fbR, fbTurb, fbDens, fbHeat, fbShell, fbEvo, fbBlue, contact, novaLight, disk, stream
//   wave: wvR, wvDens, wvHeat, debris, adv, refract (composite refraction strength)
//   shell: shR, frac, shHeat, gain, skin, knotK, prolate, equator, sheetW, sheetWid, knotGain, faceDim, steps, stepLen, giant/dwarf
//   dur: authored duration; local time is warped to the plan's actual shot length
//   post: static post overrides; postKeys: { name: keys } animated post overrides
import { frag, STARS } from '../engine/glsl.js';
import { GIANT } from './lib/giant.glsl.js';
import { DWARF } from './lib/dwarf.glsl.js';
import { NOVA_COMMON, NOVA_FIREBALL, NOVA_SHELL, NOVA_GIANTFAR, NOVA_WAVE } from './lib/nova-glsl.js';
import { camFromKeys, keys } from './lib/util.js';
import { WD, GIANT as GIANT_POS, L1, R_DISK, streamPath } from './lib/binary.js';

const kv = (v, t, d = 0) => (v === undefined ? d : Array.isArray(v) ? keys(v, t) : v);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };

// CPU twin of novaRamp/novaLum in lib/nova-glsl.js (same anchors), for precomputed palette uniforms
const NK = [[0.30, 0.012, 0.006], [0.80, 0.05, 0.014], [1, 0.2, 0.035], [1, 0.48, 0.12], [1, 0.64, 0.22], [1, 0.93, 0.80], [0.86, 0.93, 1.0]];
function novaEmit(h) {
  const x = clamp01(h) * 6, i = Math.min(5, Math.floor(x)), u = x - i, L = 0.12 * Math.exp(7.2 * h);
  return NK[i].map((v, k) => (v + (NK[i + 1][k] - v) * u) * L);
}
function shellPalette(H, frac) {
  const fr = sstep(0, 1, frac);
  return {
    uCHead0: novaEmit(H - 0.07), uCHead1: novaEmit(H + 0.01), uCHot: novaEmit(H + 0.13),
    uCTail0: novaEmit(H - 0.33), uCTail1: novaEmit(H - 0.2),
    uCSheet: novaEmit(H - 0.06 - 0.1 * fr), uCGap: novaEmit(0.16), uCWisp: novaEmit(H - 0.26), uCSkin: [0.2, 0.5, 1.0],
  };
}

// ------------------------------------------------------------------------------------------------
const VOL_FIRE = frag(NOVA_COMMON, NOVA_FIREBALL, `
void main(){
  vec3 rd = cameraRay(frameUV());
  fragColor = fireballMarch(uCamPos, rd, 0.0, 1e9, ign(gl_FragCoord.xy));
}`);

const SYS_PRE = `
uniform vec3 uShadowSrc;
// the giant blocks the ejecta: no shell material inside the giant's shadow cone
float giantShadowMask(vec3 p){
  vec3 dg = uGiantPos - uShadowSrc; float L = length(dg); vec3 ax = dg / L;
  vec3 v = p - uShadowSrc; float along = dot(v, ax);
  float Rg = uGiantR * 1.1;
  if (along < L - Rg * 1.25) return 1.0;
  float perp = length(v - ax * along);
  float cone = Rg * along / L;
  return smoothstep(cone * 0.78, cone * 1.3, perp);
}
#define FB_MASK(p) giantShadowMask(p)
`;

const VOL_SYSTEM = frag(GIANT, NOVA_COMMON, SYS_PRE, NOVA_FIREBALL, `
uniform float uDiskR, uDiskGain, uSpinT, uStreamGain, uContact;
uniform vec3 uStream[16];

float giantHit(vec3 ro, vec3 rd){
  vec3 o = ro - uGiantPos;
  vec2 core = sphereHit(o, rd, vec3(0.0), uGiantR * (1.0 + uBulge * 1.2));
  if (core.y < 0.0 || core.x > core.y) return 1e9;
  float th = max(core.x, 0.0);
  for (int i = 0; i < 28; i++){
    vec3 p = o + rd * th; float r = length(p);
    float d = r - giantRadius0(p / r);
    if (d < 0.0008 * uGiantR) return th;
    th += d * 0.75;
    if (th > core.y) break;
  }
  return 1e9;
}

vec4 diskLayer(vec3 ro, vec3 rd, out float tD){
  tD = 1e9;
  if (uDiskGain <= 0.0 || abs(rd.y) < 1e-5) return vec4(0.0);
  float t = (uFbC.y - ro.y) / rd.y;
  if (t <= 0.0) return vec4(0.0);
  vec3 p = ro + rd * t;
  vec2 q = p.xz - uFbC.xz;
  float rr = length(q);
  float x = rr / uDiskR;
  if (x > 1.25 || rr < 0.003 || rr < uFbR * 0.86) return vec4(0.0);   // swallowed: no layer, no march split
  tD = t;
  float phi = atan(q.y, q.x);
  float om = 0.9 * pow(max(x, 0.04), -1.5);
  float ang = phi + om * uSpinT;               // co-moving angle (disk turns counter-clockwise from +Y)
  float lr = log(x);
  vec2 cs = vec2(cos(ang), sin(ang));
  float tex = fbm3(vec3(cs * 2.2, lr * 2.6) + vec3(0.0, 0.0, 4.0), 3);
  float fine = n3(vec3(cs * 9.0, lr * 9.0) + 2.0);
  float arms = 0.5 + 0.5 * sin(2.0 * ang + lr * 6.5 + tex * 2.5);
  float dens = smoothstep(1.2, 0.8, x + 0.15 * tex) * smoothstep(0.0, 0.05, x) * (0.55 + 0.45 * arms) * (0.75 + 0.5 * tex + 0.2 * fine);
  float h = mix(0.95, 0.30, pow(x, 0.45)) + 0.07 * tex;
  float R = uFbR;
  float alive = smoothstep(0.9, 1.08, rr / R);
  float ring = exp(-pow((rr / R - 1.03) / 0.06, 2.0));
  float obl = clamp(0.35 / abs(rd.y), 1.0, 3.0);  // thin emitting sheet seen obliquely
  vec3 em = novaEmit(h) * 0.35 * dens * alive * (1.0 + 2.5 * exp(-max(rr - R, 0.0) / 0.07)) * obl;
  em += novaEmit(0.74) * ring * dens * 1.2 * obl;
  float a = sat(dens * alive * 0.75);
  return vec4(em * uDiskGain, a * step(0.001, uDiskGain));
}

vec4 streamLayer(vec3 ro, vec3 rd, out float tS){
  tS = 1e9;
  if (uStreamGain <= 0.0) return vec4(0.0);
  float best = 1e9, bt = 1e9, bs = 0.0; vec3 bp = vec3(0.0);
  for (int i = 0; i < 15; i++){
    vec3 a = uStream[i], b = uStream[i + 1];
    vec3 ab = b - a; vec3 w0 = ro - a;
    float B = dot(rd, ab), C = dot(ab, ab), D = dot(rd, w0), E = dot(ab, w0);
    float den = C - B * B;
    float s = den > 1e-10 ? clamp((E - B * D) / den, 0.0, 1.0) : 0.0;
    vec3 q = a + ab * s;
    float t = dot(q - ro, rd);
    float d = length(ro + rd * t - q);
    if (d < best){ best = d; bt = t; bs = (float(i) + s) / 15.0; bp = q; }
  }
  float w = mix(0.0035, 0.008, bs);
  float prof = exp(-best * best / (w * w));
  float dd = length(bp - uFbC);
  if (prof < 0.003 || bt <= 0.0 || dd < uFbR * 0.93) return vec4(0.0);
  tS = bt;
  float alive = smoothstep(0.97, 1.1, dd / uFbR);
  float flare = exp(-pow((dd / uFbR - 1.05) / 0.07, 2.0));
  float tex = 0.65 + 0.35 * n3(bp * 45.0 + vec3(0.0, 0.0, -uSpinT * 2.0));
  float h = 0.40 + 0.14 * bs;
  vec3 em = novaEmit(h) * prof * alive * tex * (1.0 + 2.0 * exp(-max(dd - uFbR, 0.0) / 0.12));
  em += novaEmit(0.8) * prof * flare * 1.2;
  return vec4(em * uStreamGain, sat(prof * alive * 0.6));
}

// hot shocked gas piling onto the giant's facing hemisphere once the shell arrives: an analytic column of an
// exponential layer (GIANT chunk's gChapman), shaped by the facing angle and turbulence at the hit/tangent point
vec3 bowLayer(vec3 ro, vec3 rd, float tG){
  if (uContact <= 0.0) return vec3(0.0);
  vec3 o = ro - uGiantPos;
  if (sphereHit(o, rd, vec3(0.0), uGiantR * (1.0 + uBulge * 1.2) * 1.5).y < 0.0) return vec3(0.0);
  float tH = tG < 1e8 ? tG : -1.0;
  float colm = gChapman(o, rd, tH, 0.045);
  vec3 pr = tH > 0.0 ? o + rd * tH : o + rd * max(dot(-o, rd), 0.0);
  vec3 n = normalize(pr);
  float face = dot(n, normalize(uShadowSrc - uGiantPos));
  float turb = n3(n * 9.0 + vec3(uSpinT * 0.8, 0.0, 0.0)) * 0.5 + 0.5;
  float d = smoothstep(-0.1, 0.8, face + 0.35 * (turb - 0.5)) * (0.5 + turb);
  return novaEmit(0.52 + 0.14 * turb * sat(face)) * colm * d * uContact * 1.6;
}

void main(){
  vec3 rd = cameraRay(frameUV()); vec3 ro = uCamPos;
  float j = ignStatic(gl_FragCoord.xy);      // static dither: a low-res pass with per-frame jitter fizzes in motion
  float tG = giantHit(ro, rd);
  float tD, tS;
  vec4 dk = diskLayer(ro, rd, tD); if (tD > tG){ tD = 1e9; dk = vec4(0.0); }
  vec4 st = streamLayer(ro, rd, tS); if (tS > tG){ tS = 1e9; st = vec4(0.0); }
  bool dFirst = tD < tS;
  float tA = dFirst ? tD : tS, tB = dFirst ? tS : tD;
  vec4 LA = dFirst ? dk : st, LB = dFirst ? st : dk;
  vec3 col = vec3(0.0); float T = 1.0;
  vec4 f = fireballMarch(ro, rd, 0.0, min(tA, tG), j); col += T * f.rgb; T *= f.a;
  if (tA < tG){
    col += T * LA.rgb; T *= 1.0 - LA.a;
    f = fireballMarch(ro, rd, tA, min(tB, tG), j); col += T * f.rgb; T *= f.a;
    if (tB < tG){
      col += T * LB.rgb; T *= 1.0 - LB.a;
      f = fireballMarch(ro, rd, tB, tG, j); col += T * f.rgb; T *= f.a;
    }
  }
  col += T * bowLayer(ro, rd, tG);
  fragColor = vec4(col, T);
}`);

const VOL_WAVE = frag(NOVA_COMMON, NOVA_FIREBALL, NOVA_WAVE, `
void main(){
  vec3 rd = cameraRay(frameUV());
  fragColor = waveMarch(uCamPos, rd, hash12(gl_FragCoord.xy * 1.13 + fract(uFrame * 0.618) * 211.0));
}`);

const VOL_SHELL = frag(GIANT, NOVA_COMMON, NOVA_SHELL, `
// the giant (tidal teardrop) hides the far side of the shell
float occHit(vec3 ro, vec3 rd){
  if (uGiantR <= 0.0) return 1e9;
  vec3 o = ro - uGiantPos;
  vec2 core = sphereHit(o, rd, vec3(0.0), uGiantR * (1.0 + uBulge * 1.2));
  if (core.y < 0.0 || core.x > core.y) return 1e9;
  float th = max(core.x, 0.0);
  for (int i = 0; i < 20; i++){
    vec3 p = o + rd * th; float r = length(p);
    float d = r - giantRadius0(p / r);
    if (d < 0.002 * uGiantR) return th;
    th += d * 0.7;
    if (th > core.y) break;
  }
  return 1e9;
}
void main(){
  vec3 rd = cameraRay(frameUV());
  float tMax = occHit(uCamPos, rd);
  float j = hash12(gl_FragCoord.xy * 1.37 + fract(uFrame * 0.6180339) * 413.0);
  fragColor = vec4(shellMarch(uCamPos, rd, j, tMax), 1.0);
}`);

// full-resolution composite
const COMP = frag(STARS, GIANT, DWARF, NOVA_COMMON, NOVA_GIANTFAR, `
uniform sampler2D uVol;
uniform float uStarGain, uUseGiant, uUseDwarf, uNovaLight, uContact, uVolGain, uRefract, uGiantFar, uDwarfOcc;
uniform vec3 uNovaPos;
void main(){
  vec2 uv = frameUV();
  vec2 tuv = gl_FragCoord.xy / uRes;
  vec3 rd = cameraRay(uv);
  vec3 ro = uCamPos;
  float pixAngle = 2.0 * uTanHalfFov / uFull.y;
  vec4 v;
  if (uRefract > 0.0){
    // refraction through the shock: a smooth displacement field with slight dispersion
    vec3 nq = vec3(uv * vec2(frameAspect(), 1.0) * 3.2, uTime * 1.7);
    vec2 d = vec2(n3(nq), n3(nq + vec3(17.0, 5.0, 0.0))) + 0.5 * vec2(n3(nq * 2.3 + 4.0), n3(nq * 2.3 + 9.0));
    d *= uRefract * 0.02;
    v.r = texture(uVol, tuv + d * 0.9).r;
    v.g = texture(uVol, tuv + d).g;
    v.ba = texture(uVol, tuv + d * 1.12).ba;
    rd = cameraRay(uv + d * 2.0);
  } else v = texture(uVol, tuv);
  vec3 bg = (starField(rd, pixAngle) + deepSky(rd)) * uStarGain;
  float dist = 1e9;
  if (uUseGiant > 0.5){
    vec4 g = uGiantFar > 0.5 ? giantFar(ro, rd, uTime, dist) : giantShade(ro, rd, uTime, dist);
    if (dist < 1e8){
      vec3 p = ro + rd * dist; vec3 n = normalize(p - uGiantPos);
      vec3 Ld = uNovaPos - p; float dl = length(Ld); Ld /= dl;
      float mu = dot(n, Ld);
      float tex = luma(g.rgb) / (luma(g.rgb) + 0.5);
      // irradiation heats the facing photosphere (granulation stays visible), soft terminator
      float irr = uNovaLight * pow(smoothstep(-0.15, 1.0, mu), 1.2) / (dl * dl);
      g.rgb *= 1.0 + 2.0 * irr;
      g.rgb += vec3(1.0, 0.6, 0.28) * 0.3 * irr * (0.3 + tex);
      // shock heating once the shell arrives: a ragged flare on the facing hemisphere, gold at its edges and
      // white-gold only toward the sub-nova point; the surface texture and a turbulent flare pattern survive it
      float rag = fbm3(n * 6.0 + vec3(0.0, uTime * 0.5, 0.0), 3) * 0.5 + 0.5;
      float fl = n3(n * 17.0 + vec3(uTime * 0.9, 0.0, 0.0)) * 0.5 + 0.5;
      float burn = smoothstep(0.05, 0.85, mu + (rag - 0.5) * 0.7) * uContact;
      float hB = 0.42 + 0.13 * rag + 0.09 * fl + 0.15 * smoothstep(0.55, 1.0, mu) * uContact;
      g.rgb = mix(g.rgb, g.rgb * 0.5, burn * 0.5) + novaEmit(hB) * burn * (0.45 + 0.9 * tex) * (0.55 + 0.9 * fl) * 0.9;
    }
    bg = bg * (1.0 - g.a) + g.rgb;
  }
  if (uUseDwarf > 0.5) bg += dwarfGlow(ro, rd, uDwarfOcc > 0.5 ? dist : 1e9, pixAngle);
  fragColor = vec4(v.rgb * uVolGain + v.a * bg, 1.0);
}`);

// ------------------------------------------------------------------------------------------------
// The accretion stream from L1 to the disk edge, resampled by arc length (16 points).
function streamPoints() {
  const raw = streamPath({});
  const pts = [];
  for (const p of raw) { pts.push([p.x, 0, p.z]); if (Math.hypot(p.x - WD[0], p.z) < R_DISK * 0.97) break; }
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][2] - pts[i - 1][2]));
  const out = [];
  for (let k = 0; k < 16; k++) {
    const s = (cum[cum.length - 1] * k) / 15;
    let i = 1; while (i < cum.length - 1 && cum[i] < s) i++;
    const u = (s - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1]);
    out.push(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, 0, pts[i - 1][2] + (pts[i][2] - pts[i - 1][2]) * u);
  }
  return out;
}

const SYS_CAM = (t0, t1) => [[t0, [0.36, 0.62, 2.55], [-0.06, -0.03, 0], 40], [t1, [0.22, 0.78, 3.25], [-0.16, -0.03, 0], 40, 0, 'inOutSine']];

export default {
  id: 'nova',
  scale: 1,
  presets: {
    // 1.83 s: out of the white-out, a white-hot ball erupts from the dwarf and fills the frame.
    'S22-ignition': {
      mode: 'fire', volScale: 0.5, dur: 1.83,
      cam: [[0, [0, 0.06, -1.9], [0, 0, 0], 40], [0.8, [0.02, 0.07, -1.95], [0, 0, 0], 40], [1.83, [0.06, 0.12, -2.25], [0, 0.01, 0], 40, 0, 'inQuad']],
      fbR: [[0, 0.03], [0.95, 0.45, 'outQuad'], [1.83, 1.2, 'inQuad']],
      fbTurb: 0.26, fbDens: 26, fbHeat: [[0, 1.1], [1.0, 1.0], [1.83, 0.96]], fbShell: 0, fbEvo: [[0, 0], [1.83, 2.2, 'linear']], fbBlue: 0.3,
      starGain: 1,
      post: { bloomStrength: 0.14, halation: 0.04, streakStrength: 0.06, saturation: 1.12, contrast: 1.1, lift: 0 },
    },
    // 3.83 s: system wide. The sphere swallows the disk, severs the stream and slams into the giant.
    'S23-eruption': {
      mode: 'system', volScale: 0.33, dur: 3.83, seed: 7.3,
      cam: SYS_CAM(0, 3.83),
      fbR: [[0, 0.2], [3.83, 0.92, 'outSine']],
      fbTurb: 0.12, fbDens: [[0, 30], [0.8, 10], [1.8, 2.5], [3.83, 0.9]], fbHeat: [[0, 1.22], [0.6, 1.1], [1.2, 1.0], [3.83, 0.96]], fbShell: [[0, 0.3], [1.2, 1.0]],
      fbEvo: [[0, 2.2], [3.83, 4.5, 'linear']], fbBlue: 0.15, fbPh: [[0, 0], [0.7, 0.0], [0.71, 0.92], [1.5, 0.72], [3.83, 0.42]],
      contact: [[1.4, 0], [2.6, 1.0]], novaLight: [[0, 0.35], [0.5, 0.55], [3.83, 0.45]], scar: [[1.8, 0], [3.83, 0.6]],
      disk: [[0, 1], [0.6, 1], [0.9, 0]], stream: [[0, 0.55], [1.2, 0.55], [1.6, 0]], giantGlow: 1.0, giantFar: true, starGain: 0.5,
      post: { bloomStrength: 0.08, halation: 0.03, streakStrength: 0.01, saturation: 1.1, contrast: 1.06, lift: 0 },
    },
    // 2.5 s: the pressure wave passes through the camera: a wall of light approaches, envelops (refraction,
    // debris streaking past), then glowing hot gas all around. Peak of the Doppler roar.
    'S24-shockfront': {
      mode: 'wave', volScale: [[0, 0.55], [1.04, 0.55], [1.06, 0.45]], dur: 2.5,   // drops at the contact white-out
      cam: [[0, [0.05, 0.02, -1.0], [0, 0, 0], 58, 0], [1.05, [0.03, 0.01, -1.0], [0, 0, 0.2], 60, 0.03], [2.5, [0.0, 0.0, -0.98], [0.02, 0.02, 0.2], 62, 0.06]],
      wvR: [[0, 0.5], [1.05, 0.985, 'inQuad'], [2.5, 1.26, 'outQuad']],
      fbTurb: 0.12, fbEvo: [[0, 4.0], [1.05, 5.2], [2.5, 10.5, 'linear']], wvDens: 34, wvHeat: [[0, 0.8], [0.9, 0.9], [1.3, 1.0], [2.5, 1.1]],
      debris: [[0, 0.2], [0.85, 0.45], [1.05, 1.0], [2.5, 0.8]], adv: [[0, 0], [1.05, 2.0], [2.5, 22.0, 'linear']],
      refract: [[0.7, 0], [1.0, 1.0], [1.5, 0.35], [2.5, 0.12]],
      starGain: [[0, 0.6], [0.95, 0.5], [1.15, 0.0]],
      postKeys: { zoomBlur: [[0.6, 0.0], [0.98, 0.012], [1.1, 0.05], [1.6, 0.03], [2.5, 0.02]], exposure: [[0, 1.0], [0.95, 0.85], [1.12, 0.62], [1.4, 1.05], [2.5, 1.0]] },
      post: { bloomStrength: 0.12, halation: 0.04, saturation: 1.1, contrast: 1.06, lift: 0 },
    },
    // 2.88 s: limb of the decelerating shell; the gold sheet tears into filaments, knots condense, fingers grow.
    'S25-shell': {
      mode: 'shell', volScale: 0.7, dur: 2.88,
      cam: [[0, [1.2, 1.0, 5.6], [1.7, 1.2, 0.0], 36], [2.9, [1.45, 1.05, 5.9], [1.85, 1.25, 0.0], 36, 0, 'outCubic']],
      shR: [[0, 3.0], [2.88, 3.25, 'outQuad']], frac: [[0, 0.04], [2.88, 0.95, 'inOutSine']], shHeat: [[0, 0.64], [2.88, 0.62]],
      knotK: 13, knotKc: 34, prolate: 0.1, deform: 0.04, equator: 0.6, clump: 0.85, sheetW: 1.6, sheetWid: 0.026, knotGain: 1.0, tailGain: 1.2, tailL: 0.028,
      wisp: 6, diffuse: 1.8, skin: 0.3, giant: true, giantGlow: 0.8, scar: 0.8, dwarfLum: 1, starGain: 0.6,
      post: { bloomStrength: 0.1, lift: 0 },
    },
    // 6.0 s: the immense fractured golden shell (GK Per / T Pyx knots and fingers); the pair small inside; slow pull back.
    'S26-expansion': {
      mode: 'shell', volScale: 0.75, dur: 6.0,
      cam: [[0, [3.6, 5.0, 12.4], [0, 0, 0], 34], [6.0, [7.6, 10.4, 25.6], [0, 0, 0], 34]],
      shR: [[0, 7.0], [6.0, 7.45, 'linear']], frac: 1, shHeat: [[0, 0.62], [6.0, 0.57]],
      knotK: 16, knotKc: 34, prolate: 0.12, deform: 0.06, equator: 0.8, clump: 0.92, sheetW: 1.5, knotGain: 1.0, tailGain: 1.2, tailL: 0.028,
      wisp: 0, diffuse: 1.8, skin: 0.3, giant: true, giantGlow: 0.55, scar: 0.6, dwarfLum: 0.6, starGain: 0.6,
      post: { bloomStrength: 0.09, lift: 0 },
    },
    // 3.33 s (+ dissolve tail to S29b): centred, still. A near-perfect limb-brightened ring, outer radius ~0.32 H.
    'S29a-ring': {
      mode: 'shell', volScale: 0.75, dur: 3.33,
      cam: [[0, [0.0, 58.0, 10.2], [0, 0, 0], 30], [5.5, [0.0, 58.0, 10.2], [0, 0, 0], 30]],
      shR: [[0, 10.0], [5.5, 10.15, 'linear']], frac: 1, shHeat: 0.62,
      knotK: 11, knotKc: 34, prolate: 0.0, deform: 0, equator: 1.2, clump: 0.7, sheetW: 1.5, sheetWid: 0.012, knotGain: 0.55, tailGain: 1.0, tailL: 0.028,
      wisp: 0, diffuse: 2.2, skin: 0.35, faceDim: 0.95, giant: true, giantGlow: 0.55, scar: 0.6, dwarfLum: 0.5, starGain: 0.6,
      post: { bloomStrength: 0.08, lift: 0 },
    },
    default: { mode: 'fire', fbR: 0.6 },
  },

  init(E) {
    this.pFire = E.program(VOL_FIRE, 'nova.fire');
    this.pSystem = E.program(VOL_SYSTEM, 'nova.system');
    this.pShell = E.program(VOL_SHELL, 'nova.shell');
    this.pWave = E.program(VOL_WAVE, 'nova.wave');
    this.pComp = E.program(COMP, 'nova.comp');
    this.stream = new Float32Array(streamPoints());
  },

  // local time warped to the preset's authored duration (robust to plan retiming); may exceed dur in dissolves
  localT(S) { const P = S.params; return Math.max(0, S.local) * (P.dur ? P.dur / S.dur : 1); },

  render(E, S, target) {
    const P = S.params;
    const t = this.localT(S);
    const cam = camFromKeys(P.cam || [[0, [0, 0, -2], [0, 0, 0], 40]], t);
    // volScale may be keyed (quantised to 0.05 so the target is not reallocated every frame)
    const vs = Math.round(kv(P.volScale, t, 0.5) * 20) / 20;
    const vol = E.target('nova-vol-' + (target.name || 'x'), vs);
    const mode = P.mode || 'fire';
    const comp = { ...cam.uniforms, uVol: vol, uStarGain: kv(P.starGain, t, 1), uUseGiant: 0, uGiantFar: 0, uUseDwarf: 0, uNovaLight: 0, uContact: 0, uVolGain: 1, uRefract: 0, uNovaPos: WD };
    const giantU = (glow, scar, spin = 0.3) => ({
      uGiantPos: GIANT_POS, uGiantR: 0.31, uGiantSpin: spin + 0.004 * S.t, uBoil: 1, uBulge: 0.35, uBulgeDir: [1, 0, 0],
      uScar: scar, uScarDir: [1, 0, 0], uGiantGlow: glow, uPlumes: 0.6, uRelief: 0, uLimbDark: 0.62,
    });
    const fb = (centre) => ({
      uFbC: centre, uFbR: kv(P.fbR, t, 0.5), uFbTurb: kv(P.fbTurb, t, 0.2), uFbEvo: kv(P.fbEvo, t, t), uFbHeat: kv(P.fbHeat, t, 1),
      uFbDens: kv(P.fbDens, t, 50), uFbShell: kv(P.fbShell, t, 0), uFbSeed: P.seed ?? 3.0, uFbBlue: kv(P.fbBlue, t, 0.3), uFbPh: kv(P.fbPh, t, 0),
    });
    if (mode === 'fire') {
      E.draw(this.pFire, { ...cam.uniforms, ...fb([0, 0, 0]) }, vol);
    } else if (mode === 'wave') {
      E.draw(this.pWave, {
        ...cam.uniforms, ...fb([0, 0, 0]), uWvR: kv(P.wvR, t, 1), uWvDens: kv(P.wvDens, t, 30), uWvHeat: kv(P.wvHeat, t, 1),
        uWvDebris: kv(P.debris, t, 1), uWvAdv: kv(P.adv, t, t),
      }, vol);
      Object.assign(comp, { uRefract: kv(P.refract, t, 0), uUseDwarf: 1, uDwarfPos: [0, 0, 0], uDwarfR: 0.0003, uDwarfLum: kv(P.dwarfLum, t, 1.5) });
    } else if (mode === 'system') {
      const contact = kv(P.contact, t, 0);
      const gu = giantU(kv(P.giantGlow, t, 1), kv(P.scar, t, 0));
      E.draw(this.pSystem, {
        ...cam.uniforms, ...fb(WD), ...gu, uShadowSrc: WD, uDiskR: R_DISK, uDiskGain: kv(P.disk, t, 1), uSpinT: S.t,
        uStreamGain: kv(P.stream, t, 1), uStream: this.stream, uContact: contact,
      }, vol);
      Object.assign(comp, gu, { uUseGiant: 1, uGiantFar: P.giantFar ? 1 : 0, uNovaLight: kv(P.novaLight, t, 0), uContact: contact, uUseDwarf: 1, uDwarfPos: WD, uDwarfR: 0.0005, uDwarfLum: kv(P.dwarfLum, t, 1.5) });
    } else if (mode === 'shell') {
      const H = kv(P.shHeat, t, 0.62), fr = kv(P.frac, t, 1);
      E.draw(this.pShell, {
        ...cam.uniforms, uShC: [0, 0, 0], uShR: kv(P.shR, t, 5), uShAxis: [0, 1, 0], uProlate: kv(P.prolate, t, 0.1), uDeform: kv(P.deform, t, 0),
        uFrac: fr, ...shellPalette(H, fr),
        uShGain: kv(P.gain, t, 1), uSkin: kv(P.skin, t, 2), uKnotK: kv(P.knotK, t, 12), uShSeed: P.seed ?? 5.0, uShEvo: S.t,
        uEquator: kv(P.equator, t, 0.6), uSheetW: kv(P.sheetW, t, 2), uSheetWid: kv(P.sheetWid, t, 0.026), uKnotGain: kv(P.knotGain, t, 1.5),
        uTailGain: kv(P.tailGain, t, 9), uTailL: kv(P.tailL, t, 0.035), uClump: kv(P.clump, t, 0.85), uWisp: kv(P.wisp, t, 12),
        uDiffuse: kv(P.diffuse, t, 1), uFaceDim: kv(P.faceDim, t, 0), uKnotKc: P.knotKc ?? 25, uKnotDens: kv(P.knotDens, t, 0.9),
        ...giantU(1, 0), ...(P.giant ? {} : { uGiantR: 0 }),
      }, vol);
      if (P.giant) Object.assign(comp, giantU(kv(P.giantGlow, t, 0.6), kv(P.scar, t, 0.8)), { uUseGiant: 1, uGiantFar: 1, uNovaLight: 0, uContact: 0 });
      if (P.dwarfLum !== undefined) Object.assign(comp, { uUseDwarf: 1, uDwarfPos: WD, uDwarfR: 0.0005, uDwarfLum: kv(P.dwarfLum, t, 1) });
    }
    // the dwarf's glow is an optical halo: hide it only when the giant really blocks the line of sight to the dwarf
    // (a per-pixel depth test cuts the halo out of the giant's disc when both sit at nearly the same depth)
    if (comp.uUseDwarf && comp.uUseGiant) {
      const dp = comp.uDwarfPos, cp = cam.pos, gp = GIANT_POS;
      const d = [dp[0] - cp[0], dp[1] - cp[1], dp[2] - cp[2]], L = Math.hypot(...d);
      const u = d.map((x) => x / L), w = [gp[0] - cp[0], gp[1] - cp[1], gp[2] - cp[2]];
      const tc = w[0] * u[0] + w[1] * u[1] + w[2] * u[2];
      const miss = Math.hypot(w[0] - u[0] * tc, w[1] - u[1] * tc, w[2] - u[2] * tc);
      comp.uDwarfOcc = tc > 0 && tc < L && miss < 0.31 * 1.3 ? 1 : 0;
    } else comp.uDwarfOcc = 1;
    E.draw(this.pComp, comp, target);
  },

  post(E, S) {
    const P = S.params;
    const t = this.localT(S);
    const o = { ...(P.post || {}) };
    if (P.postKeys) for (const [k, v] of Object.entries(P.postKeys)) o[k] = kv(v, t);
    return o;
  },
};
