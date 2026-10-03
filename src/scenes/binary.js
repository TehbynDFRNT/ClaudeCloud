// DAVID & GOLIATH — the binary at system scale: the Roche-filling red giant, the L1 mass stream,
// the accretion disk and the white dwarf, plus restrained scientific overlays (ice-blue diagram, gold trajectory).
// Units from lib/binary.js: a = 1, giant at (-0.645,0,0), dwarf at (0.355,0,0), L1 at (-0.206,0,0), orbital plane XZ.
//
// Two passes: (1) stream + disk volumetrics into a reduced-scale HDR target (lib/stream.glsl.js), marched up to the
// giant's photosphere; (2) full-resolution stars + giant (GIANT chunk) + dwarf (DWARF chunk) composited with (1).
//
// Preset params (any numeric param may be a keyframe list [[t, v, ease?], ...] in shot seconds):
//   cam            camFromKeys list, or chase {tau:[[t,tau]], back, up, side, lead, fov}
//   drift          [amp, speed] small deterministic camera float
//   headTau|headS  head of the developing stream (ballistic time or arc length); omitted = fully developed
//   streamAmt, streamW, streamGlow, rip, flowRate, detail, rake (dwarf light on gas), rakeG (on the photosphere)
//   diskOut, diskAmt, diskH, diskGlow, ringAmt, hot, flare {amt, decay}, whip {amp, speed, decay}
//   clump {tau:[[t,tau]], amt}    bright knot riding the stream (S08)
//   giant {R, bulge, glow, plumes, relief, boil, limb}, dwarfLum, starGain, volScale
//   overlay 'diagram' | 'trajectory' | 'topdiagram' with timing in the same param block; post {...}
import { frag, STARS } from '../engine/glsl.js';
import { GIANT } from './lib/giant.glsl.js';
import { DWARF } from './lib/dwarf.glsl.js';
import { STREAM } from './lib/stream.glsl.js';
import { camFromKeys, keys, camera, v3 } from './lib/util.js';
import {
  FIELD, buildPath, buildField, pathAtS, sAtTau, sAtDwarfRadius, occludedByGiant,
  lobeContour, L1, XW, XG, R_CIRC,
} from './lib/binary-stream.js';

const VOL_FS = frag(GIANT, STREAM, `
void main(){
  vec2 uv = frameUV();
  vec3 rd = cameraRay(uv);
  vec3 ro = uCamPos;
  float th = giantTrace(ro - uGiantPos, rd);       // photosphere (GIANT building block)
  // interleaved-gradient jitter: blue-noise-like, so the upsample's tent filter averages it away (no white grain)
  vec4 v = marchSystem(ro, rd, th > 0.0 ? th : 1e9, ign(gl_FragCoord.xy));
  // flag rays that ended on the photosphere (negative alpha) for the hit-aware upsample in the main pass
  fragColor = vec4(v.rgb, th > 0.0 ? -(v.a + 0.001) : v.a);
}`);

const MAIN_FS = frag(STARS, GIANT, DWARF, `
uniform sampler2D uVol;
uniform vec2 uVolRes;
uniform float uStarGain;
uniform float uRakeG;
uniform float uGiantOn;
uniform float uStarVeil;     // how strongly bright plasma hides the stars behind it
uniform float uDwarfCore;    // how much of the dwarf's point survives in front of an opaque disk (0..1)
uniform float uDbg;
// smooth upsample of the reduced-scale volume where every texel is a miss: 4 bilinear taps half a texel apart
// (a 3x3 tent), which also averages the interleaved-gradient ray jitter
vec4 volTent(){
  vec2 uv = gl_FragCoord.xy / uRes, h = 0.5 / uVolRes;
  vec4 s = texture(uVol, uv + vec2(-h.x, -h.y)) + texture(uVol, uv + vec2(h.x, -h.y))
         + texture(uVol, uv + vec2(-h.x, h.y)) + texture(uVol, uv + vec2(h.x, h.y));
  s *= 0.25; s.a = abs(s.a);
  return s;
}
// upsample the reduced-scale volume: bilinear, but texels whose ray disagrees with this pixel about hitting the
// photosphere are rejected (no serrated half-res edge along the giant's limb)
vec4 volUpsample(bool hit){
  vec2 p = gl_FragCoord.xy / uRes * uVolRes - 0.5;
  vec2 i0 = floor(p), fr = p - i0;
  ivec2 b = ivec2(i0), mx = ivec2(uVolRes) - 1;
  vec4 acc = vec4(0.0); float ws = 0.0;
  for (int k = 0; k < 4; k++){
    ivec2 o = ivec2(k & 1, k >> 1);
    vec4 s = texelFetch(uVol, clamp(b + o, ivec2(0), mx), 0);
    float w = (o.x == 1 ? fr.x : 1.0 - fr.x) * (o.y == 1 ? fr.y : 1.0 - fr.y);
    bool sh = s.a < 0.0;
    s.a = sh ? -s.a - 0.001 : s.a;
    float m = (sh == hit) ? 1.0 : 0.0;
    acc += s * w * m; ws += w * m;
  }
  if (ws > 1e-4) return acc / ws;
  // all four disagree (thin band along the limb): nearest agreeing texels in the 4x4 neighbourhood
  acc = vec4(0.0); ws = 0.0;
  for (int k = 0; k < 16; k++){
    ivec2 o = ivec2(k & 3, k >> 2) - 1;
    vec4 s = texelFetch(uVol, clamp(b + o, ivec2(0), mx), 0);
    bool sh = s.a < 0.0;
    if (sh != hit) continue;
    s.a = sh ? -s.a - 0.001 : s.a;
    vec2 d = vec2(o) - fr;
    float w = exp(-dot(d, d) * 1.5);
    acc += s * w; ws += w;
  }
  if (ws > 1e-5) return acc / ws;
  vec4 s = texelFetch(uVol, clamp(b, ivec2(0), mx), 0);
  s.a = s.a < 0.0 ? -s.a - 0.001 : s.a;
  return s;
}
// minimum along the ray of F(p) = |p| - r0(p/|p|) (tidal shape, no relief): ~ signed distance of the ray to the
// silhouette; returns (minF, t at min). Coarse samples + golden-section refinement.
float giantF(vec3 p){ float r = length(p); return r - giantRadius0(p / max(r, 1e-6)); }
vec2 giantMinF(vec3 o, vec3 rd, vec2 hs){
  float t0 = max(hs.x, 0.0), t1 = max(hs.y, t0 + 1e-4);
  float bt = t0, bf = 1e9;
  for (int i = 0; i <= 12; i++){
    float t = mix(t0, t1, float(i) / 12.0);
    float f = giantF(o + rd * t);
    if (f < bf){ bf = f; bt = t; }
  }
  float h = (t1 - t0) / 12.0;
  float a = max(t0, bt - h), b = min(t1, bt + h);
  for (int i = 0; i < 6; i++){
    float c = b - 0.618 * (b - a), d = a + 0.618 * (b - a);
    if (giantF(o + rd * c) < giantF(o + rd * d)) b = d; else a = c;
  }
  float tm = 0.5 * (a + b);
  return vec2(min(bf, giantF(o + rd * tm)), tm);
}
vec3 giantNormal(vec3 p){
  vec3 o = p - uGiantPos;
  float e = 0.002 * uGiantR;
  float f0 = length(o) - giantRadius(normalize(o));
  vec3 g = vec3(
    length(o + vec3(e,0,0)) - giantRadius(normalize(o + vec3(e,0,0))) - f0,
    length(o + vec3(0,e,0)) - giantRadius(normalize(o + vec3(0,e,0))) - f0,
    length(o + vec3(0,0,e)) - giantRadius(normalize(o + vec3(0,0,e))) - f0);
  return normalize(g);
}
void main(){
  vec2 uv = frameUV();
  vec3 rd = cameraRay(uv);
  vec3 ro = uCamPos;
  float pixAngle = 2.0 * uTanHalfFov / uRes.y;
  float dist = 1e9;
  vec4 g = vec4(0.0);
  if (uGiantOn > 0.5) g = giantShade(ro, rd, uTime, dist);
  if (dist < 1e8 && uRakeG > 0.0){
    // the dwarf's blue-white light raking the photosphere (strongest at grazing incidence near the L1 tip)
    vec3 p = ro + rd * dist;
    vec3 n = giantNormal(p);
    vec3 L = uDwarfPos - p; float r2 = dot(L, L); L *= inversesqrt(r2);
    float ndl = max(dot(n, L), 0.0);
    float graze = pow(1.0 - sat(dot(n, -rd)), 1.5);
    g.rgb += dwarfColor() * uRakeG * ndl * (0.3 + 0.7 * graze) / (r2 * 5.0 + 0.03);
  }
  vec3 bg = (starField(rd, pixAngle) + deepSky(rd)) * uStarGain;
  // volume: rays clearly clear of the giant's silhouette (or clearly on its disk) take the smooth tent upsample;
  // only rays within a few pixels of the limb pay for the hit-aware, anti-aliased one
  vec3 o = ro - uGiantPos;
  float vpx = pixAngle * uRes.y / uVolRes.y;                       // one volume texel, radians
  vec2 gb = sphereHit(o, rd, vec3(0.0), uGiantR * (1.0 + uBulge * 1.2) + 4.0 * length(o) * vpx);
  vec4 V;
  bool nearLimb = false;
  if (gb.y > 0.0 && uGiantOn > 0.5){
    if (dist < 1e8){
      // on the disk: angular distance to the limb ~ (r/D) mu^2 / 2 (local sphere), in volume texels
      vec3 ph = o + rd * dist;
      float mu = sat(dot(gNormal0(ph), -rd));
      nearLimb = length(ph) / dist * 0.5 * mu * mu < 3.0 * vpx;
    } else {
      // off the disk: coarse minimum of the shape function along the ray, in volume texels
      float t0 = max(gb.x, 0.0), t1 = max(gb.y, t0 + 1e-4), bf = 1e9, bt = t0;
      for (int i = 0; i <= 5; i++){
        float t = mix(t0, t1, float(i) / 5.0);
        float f = giantF(o + rd * t);
        if (f < bf){ bf = f; bt = t; }
      }
      nearLimb = bf < 4.0 * max(bt, 1e-3) * vpx + (t1 - t0) * (t1 - t0) / (150.0 * uGiantR);
    }
  }
  if (!nearLimb){ V = volTent(); if (dist < 1e8) V.a = max(V.a - 0.001, 0.0); }
  else {
    // anti-aliased limb: blend hit- and miss-consistent upsamples by the sub-pixel coverage of the silhouette
    vec2 mf = giantMinF(o, rd, gb);
    float sd = mf.x / (max(mf.y, 1e-4) * pixAngle);
    float cov = sat(0.5 - sd);
    cov = dist < 1e8 ? max(cov, 0.5) : min(cov, 0.5);         // stay consistent with the photosphere hit
    if (cov <= 0.0 || cov >= 1.0) V = volUpsample(dist < 1e8);
    else V = mix(volUpsample(false), volUpsample(true), cov);
  }
  if (uDbg > 0.5) { fragColor = vec4(nearLimb ? 5.0 : 0.0, dist < 1e8 ? 1.0 : 0.0, 0.0, 1.0); return; }
  // bright plasma hides the stars behind it (emission-dominated gas barely absorbs, but a star must not pierce it)
  float veil = exp(-luma(V.rgb) * uStarVeil);
  vec3 col = bg * (1.0 - g.a) * V.a * veil + g.rgb * V.a + V.rgb;
  col += dwarfGlow(ro, rd, dist, pixAngle) * mix(V.a, 1.0, uDwarfCore);
  fragColor = vec4(col, 1.0);
}`);

// ---------------------------------------------------------------------------------------------------------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const isKeys = (v) => Array.isArray(v) && Array.isArray(v[0]);
const ev = (v, t, d) => (v === undefined || v === null ? d : isKeys(v) ? keys(v, t) : v);
const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };

const GIANT_DEF = { R: 0.317, bulge: 0.33, glow: 1.0, plumes: 0.3, relief: 0, boil: 1.0, limb: 0.62 };

// ---------------------------------------------------------------------------------------------------------
// Presets (shot ids from film-plan.json). Keyframe times are NORMALISED shot progress u = local / dur (0..1), so the
// presets survive re-timing of the plan; decays, flow rates and drift stay in seconds.
const presets = {
  // Act I. Scale and attraction: the giant swollen into a teardrop, the dwarf a speck; ice-blue diagram draws on.
  'S04-scale': {
    cam: [[0, [-0.66, 0.50, 1.55], [-0.13, -0.03, 0.0], 36], [1, [-0.56, 0.455, 1.42], [-0.11, -0.03, 0.0], 36, 0, 'inOutSine']],
    streamAmt: 0, diskAmt: 0, ringAmt: 0,
    giant: { plumes: 0.75 }, dwarfLum: 1.3, rakeG: 0.12,
    overlay: 'diagram', diagram: { bary: [0.07, 0.17], orbit: [0.05, 0.5], lobes: [0.3, 0.8], mark: [0.77, 0.87], label: [0.82, 0.95] },
    volScale: 0.5,
    post: { bloomStrength: 0.09, streakStrength: 0.02 },
  },
  // Close on the L1 tip: a tongue of plasma lifts toward the off-screen dwarf, its dwarf-facing edge raked cold blue.
  'S06-first-pull': {
    cam: [[0, [-0.272, -0.031, 0.202], [-0.13, 0.03, -0.05], 50, -0.72], [1, [-0.259, -0.027, 0.188], [-0.12, 0.034, -0.05], 48, -0.84, 'inOutSine']],
    headS: [[0, -0.012], [1, 0.08, 'inQuad']],
    streamAmt: 0.85, streamW: 1.0, rip: 0.5, flowRate: 1.2, detail: 0.6, rake: 1.0, rakeG: 0.16, starGain: 0.5,
    giant: { relief: 0.012, plumes: 0, glow: 1.4, atmo: 1.0 }, dwarfLum: 1.2, volScale: 0.5,
    post: { bloomStrength: 0.08 },
  },
  // The stream rips out through L1 and reaches across space toward the dwarf (the bend round it belongs to S08).
  'S07-stream': {
    cam: [
      [0, [-0.31, 0.33, 0.44], [-0.15, -0.02, 0.03], 40],
      [0.5, [-0.235, 0.35, 0.49], [-0.085, -0.02, 0.04], 40, 0, 'inOutSine'],
      [1, [-0.13, 0.38, 0.57], [0.015, -0.02, 0.05], 40, 0, 'inOutSine'],
    ],
    headTau: [[0, 0.80], [1, 1.12, 'linear']],
    streamAmt: 1.0, rip: 1.0, flowRate: 1.6, rake: 0.0, rakeG: 0.1, streamGlow: 1.3, starGain: 0.55,
    giant: { plumes: 0.5 }, dwarfLum: 1.3, volScale: 0.5,
    post: { bloomStrength: 0.09, streakStrength: 0.02 },
  },
  // Ride with a clump at the head of the stream along its ballistic arc as Coriolis bends it round the dwarf;
  // the gold dashed trajectory and ticks draw ahead of it. Starts where S07 ends (head at tau 1.12).
  'S08-parabola': {
    chase: { tau: [[0, 1.106], [1, 1.372, 'linear']], back: 0.25, up: 0.36, side: 0.15, lead: 0.2, toDwarf: 0.3, look: 0.45, fov: 48 },
    clump: { tau: [[0, 1.106], [1, 1.372, 'linear']], amt: 1.0 },
    headTau: [[0, 1.12], [1, 1.386, 'linear']],
    streamAmt: 1.0, streamGlow: [[0, 0.85], [0.55, 0.75], [1, 0.55]], rip: 0.6, flowRate: 1.8, rake: 0.0, ringAmt: 0.0, starGain: 0.5,
    dwarfLum: 1.4, volScale: 0.45,
    overlay: 'trajectory',
    post: { bloomStrength: 0.09, streakStrength: 0.02 },
  },
  // Goliath bleeds: the torn L1 tip pours matter into space.
  'S11-giant-bleeds': {
    cam: [[0, [-0.30, 0.060, 0.30], [-0.16, 0.0, 0.02], 42], [1, [-0.285, 0.052, 0.275], [-0.15, 0.0, 0.02], 41, 0, 'inOutSine']],
    streamAmt: 1.0, streamW: 1.15, streamGlow: 1.15, cool: 2.4, rip: 1.0, flowRate: 2.0, detail: 0.5, rake: 0.0, rakeG: 0.06, starGain: 0.5,
    diskAmt: 0, cutR: 0.26,
    giant: { relief: 0.012, plumes: 0, atmo: 1.0, glow: 1.35 }, dwarfLum: 1.2, volScale: 0.45,
    post: { bloomStrength: 0.09 },
  },
  // The giant is drained: wide, high angle; a substantial disk fed by the stream.
  'S14c-mass-loss': {
    cam: [[0, [-0.17, 1.40, 1.52], [-0.08, -0.05, 0.0], 40], [1, [-0.13, 1.32, 1.43], [-0.07, -0.05, 0.0], 40, 0, 'linear']],
    streamW: 1.35, streamGlow: 1.4, starGain: 0.6, streamAmt: 1.1, rip: 0.7, flowRate: 2.0, rake: 0.0,
    diskAmt: 1.0, diskOut: 0.27, hot: 1.2,
    dwarfLum: 1.0, volScale: 0.62,
    post: { bloomStrength: 0.08, streakStrength: 0.02 },
  },
  // Frenzy vista: from behind the giant along the stream; the giant a dark crimson shoulder in the foreground.
  'F27.1': {
    cam: [[0, [-1.12, 0.56, 0.74], [0.28, -0.06, 0.06], 37], [1, [-0.98, 0.49, 0.66], [0.28, -0.06, 0.06], 36, 0, 'outQuad']],
    streamW: 1.35, streamGlow: 1.4, starGain: 0.6, streamAmt: 1.15, rip: 0.8, flowRate: 2.4, rake: 0.0,
    diskAmt: 1.0, diskOut: 0.27, hot: 1.2,
    dwarfLum: 1.0, volScale: 0.55,
    post: { bloomStrength: 0.09, streakStrength: 0.02 },
  },
  // Frenzy vista: high orbital view (tilted 25 degrees off the pole) with ice-blue diagram lines.
  'F29.4': {
    cam: [[0, [0.04, 1.54, 0.72], [0.04, 0, 0.02], 40, 0.10], [1, [0.04, 1.39, 0.65], [0.04, 0, 0.02], 40, -0.06, 'outQuad']],
    streamW: 1.35, streamGlow: 1.4, starGain: 0.6, streamAmt: 1.1, rip: 0.7, flowRate: 2.4, rake: 0.0,
    diskAmt: 1.0, diskOut: 0.27, hot: 1.2,
    dwarfLum: 1.0, volScale: 0.58,
    overlay: 'topdiagram',
    post: { bloomStrength: 0.08 },
  },
  // Strike 1: the whole system shudders; the disk flares white and decays, the stream whips.
  'S17-strike1': {
    cam: [[0, [0.57, 0.43, 1.27], [-0.05, 0.005, 0.0], 40], [1, [0.50, 0.395, 1.16], [-0.05, 0.03, 0.0], 42, 0, 'outQuad']],
    streamW: 1.35, streamGlow: 1.4, starGain: 0.6, streamAmt: 1.15, rip: 0.8, flowRate: 2.2, rake: 0.0,
    diskAmt: 1.0, diskOut: 0.27, hot: 1.3,
    flare: { amt: 2.0, decay: 0.75 }, whip: { amp: 0.10, speed: 1.1, decay: 1.1, k: 15 },
    dwarfLum: 1.1, volScale: 0.58,
    post: { bloomStrength: 0.08, streakStrength: 0.02 },
  },
};

// ---------------------------------------------------------------------------------------------------------
// 9:16 reframing (portrait renders only; landscape ignores it). Every shot here sits before ignition, inside the
// 3:4 window (y in [0.128H, 0.872H]). In space there is no up, so the shots are rolled: the giant looms at the top,
// the dwarf is the speck below it and the stolen matter falls down the frame. roll 90 / zoom 0.5625 would be the
// exact rotation of the 16:9 picture; each shot is tightened or opened from there so its subject (and all of its
// ink) sits inside the window. Keyed framings: [[u, {...}], [u, {...}, easing]].
const PORTRAIT = {
  // diagonal: the giant fills the upper left, the speck sits low right, and the whole figure-eight (with the
  // orbit and the L1 label, put in the dark on the dwarf's side of the mark) fits in the window
  'S04-scale': {
    framing: { roll: 60, zoom: 0.43, pan: [-0.06, -0.075] },
    diagram: { ...presets['S04-scale'].diagram, labelOff: [46, -4], labelScale: 1.4, inkW: 1.25 },
  },
  // the limb a ceiling across the top, the tongue dropping from it; pull back as the tongue stretches
  'S06-first-pull': {
    framing: [[0, { roll: 120, zoom: 0.85, pan: [-0.14, -0.14] }], [1, { roll: 120, zoom: 0.7, pan: [0.05, 0.1] }]],
    volRelief: true,     // this close (and this tight) the smooth/relief photosphere mismatch showed as a band inside the limb
  },
  // the giant overhead, the river pouring down through L1 toward the dwarf low in the frame; over the second half
  // the frame eases back up toward the giant as the camera tracks on, so the source stays overhead (not a sliver
  // under the bar) while the dwarf holds its place low in the window
  'S07-stream': {
    framing: [[0, { roll: 90, zoom: 0.46, pan: [0.17, 0] }], [0.45, { roll: 90, zoom: 0.46, pan: [0.17, 0] }], [1, { roll: 90, zoom: 0.46, pan: [0.05, 0] }]],
  },
  // the clump falls down the frame toward the dwarf; open up at the end so the whole bend round the dwarf (and the
  // gold trajectory drawing ahead of it) stays in the window, the dwarf near the centre and the stream leaving by the
  // right edge (the giant's clipped limb kept just out of frame)
  'S08-parabola': {
    framing: [[0, { roll: 120, zoom: 0.76, pan: [-0.064, 0.164] }], [0.45, { roll: 120, zoom: 0.76, pan: [-0.081, 0.154] }], [1, { roll: 120, zoom: 0.66, pan: [-0.30, -0.125] }]],
  },
  // the torn tip overhead, the stream pouring out of the bottom of the frame (no volRelief here: against this bright
  // stream its volume-resolution limb steps showed more than the thin dark limb line it removes)
  'S11-giant-bleeds': {
    framing: { roll: 90, zoom: 0.6 },
  },
  // the drained giant upper left feeding the disk lower right, the whole system filling the window
  'S14c-mass-loss': {
    framing: { roll: 70, zoom: 0.635, pan: [-0.094, -0.04] },
  },
  // frenzy: the giant's crimson shoulder in the top corner, the stream diving into a big bright disk
  'F27.1': {
    framing: { roll: 80, zoom: 0.8, pan: [-0.12, -0.06] },
  },
  // the whole top-down diagram in the window (air above the giant's crown and below the dwarf's lobe), its ink
  // heavier so it reads in 19 frames; L1 labelled in the dark right of the neck, between the giant's limb and the
  // dwarf's lobe
  'F29.4': {
    framing: { roll: 70, zoom: 0.44, pan: [-0.10, -0.019] },
    inkW: 1.6, labelOff: [62, -4], labelScale: 1.5,
  },
  // hard cut on the strike: the giant overhead, the stream whipping down into the flaring disk
  'S17-strike1': {
    framing: { roll: 90, zoom: 0.471, pan: [0.007, 0.073] },
  },
};
for (const [id, p] of Object.entries(PORTRAIT)) presets[id].portrait = p;
presets.default = presets['S14c-mass-loss'];

// ---------------------------------------------------------------------------------------------------------
export default {
  id: 'binary',
  scale: 1,
  presets,

  init(E) {
    this.vol = E.program(VOL_FS, 'binary.vol');
    this.main = E.program(MAIN_FS, 'binary.main');
    this.path = buildPath();
    const data = buildField(this.path);
    this.field = E.G.texture2D(null, FIELD.nx, FIELD.nz, data, { format: 'rgba32f', filter: 'linear' });
    this.lobeG = lobeContour('giant', 220).map(([x, z]) => [x, 0, z]);
    this.lobeW = lobeContour('wd', 220).map(([x, z]) => [x, 0, z]);
  },

  // everything that is a function of the shot time: camera + uniforms
  state(E, S) {
    const P = S.params;
    const t = clamp(S.local, 0, S.dur);          // seconds (decays, flow, drift)
    const u = clamp(t / Math.max(S.dur, 1e-3));    // normalised progress (keyframes)
    const path = this.path;
    const G = { ...GIANT_DEF, ...(P.giant || {}) };
    // camera
    let cam;
    if (P.chase) cam = this.chaseCam(P.chase, u);
    else cam = camFromKeys(P.cam || [[0, [0, 1.2, 1.2], [0, 0, 0], 40]], u);
    if (P.drift) {
      const [amp, sp] = P.drift;
      const o = [Math.sin(t * sp * 0.71 + 1.3) * amp, Math.sin(t * sp * 0.53 + 0.4) * amp * 0.6, Math.sin(t * sp * 0.61 + 2.1) * amp];
      const R = cam.raw;   // rebuild from the unframed camera (see engine/math.js framing)
      cam = camera(v3.add(R.pos, o), v3.add(v3.add(R.pos, R.fwd), v3.mul(o, 0.5)), 2 * Math.atan(R.tanH) * 180 / Math.PI);
    }
    // stream development
    let head = 99;
    if (P.headTau) head = sAtTau(path, ev(P.headTau, u));
    else if (P.headS !== undefined) head = ev(P.headS, u);
    const diskAmt = ev(P.diskAmt, u, 0);
    const diskOut = ev(P.diskOut, u, 0.27);
    let cut = path.total, fade = path.total - path.sPeri + 0.05, hot = [0, 0, 0, 1];
    const cutR = P.cutR ?? (diskAmt > 0.05 ? diskOut * 0.95 : null);
    if (cutR) {
      cut = sAtDwarfRadius(path, cutR);
      fade = 0.03;
      const h = pathAtS(path, cut);
      hot = [h.x, h.z, diskAmt > 0.05 ? ev(P.hot, u, 1.0) : 0, 1.3];
    }
    let flare = 0;
    if (P.flare) flare = P.flare.amt * Math.exp(-t / P.flare.decay);
    let whip = [0, 0, 0, 0], whipK = [14, 0, 1];
    if (P.whip) {
      whip = [P.whip.amp, t, P.whip.speed, P.whip.decay];
      // swing the stream across the line of sight: mix of the in-plane normal and +Y perpendicular to the view
      const m = pathAtS(path, 0.15), n = [-m.tz, 0, m.tx], f = (cam.raw || cam).fwd;   // unframed: same whip in every aspect
      let a = f[1], b = -v3.dot(n, f); const l = Math.hypot(a, b) || 1; a /= l; b /= l;
      if (b < 0) { a = -a; b = -b; }
      whipK = [P.whip.k ?? 14, a, b];
    }
    let clumpS = -9, clumpAmt = 0;
    if (P.clump) { clumpS = sAtTau(path, ev(P.clump.tau, u)); clumpAmt = P.clump.amt; }
    const boxX = Math.max(0.66, XW + Math.max(diskOut, R_CIRC + 0.1) * 1.25 + 0.02);
    const boxZ = Math.max(0.32, Math.max(diskOut, R_CIRC + 0.1) * 1.25 + 0.02);
    const U = {
      ...cam.uniforms,
      // giant (GIANT chunk owned by the redgiant department: uniforms only)
      uGiantPos: [XG, 0, 0], uGiantR: G.R, uGiantSpin: 0.6, uBoil: G.boil, uBulge: G.bulge, uBulgeDir: [1, 0, 0],
      uScar: 0, uScarDir: [1, 0, 0], uGiantGlow: G.glow, uPlumes: G.plumes, uRelief: G.relief, uLimbDark: G.limb,
      uGiantAtmo: G.atmo ?? 0,
      uGiantOn: 1,
      // dwarf
      uDwarfPos: [XW, 0, 0], uDwarfR: 2.5e-5, uDwarfLum: ev(P.dwarfLum, u, 1.3),
      // stream + disk
      uStreamField: this.field,
      uFieldBox: [FIELD.x0, FIELD.z0, 1 / (FIELD.x1 - FIELD.x0), 1 / (FIELD.z1 - FIELD.z0)],
      uStreamHead: head, uStreamCut: cut, uStreamFade: fade,
      uStreamAmt: ev(P.streamAmt, u, 1), uStreamW: ev(P.streamW, u, 1), uStreamGlow: ev(P.streamGlow, u, 1),
      uRip: ev(P.rip, u, 0.6), uFlowT: t * ev(P.flowRate, 0, 1.6) + (S.seed % 17), uDetail: ev(P.detail, u, 0),
      uWhip: whip, uWhipK: whipK, uWD: [XW, 0, 0], uRake: ev(P.rake, u, 0.0), uStepK: ev(P.stepK, u, 1), uDiskCore: ev(P.diskCore, u, 24),
      uDiskIn: 0.03, uDiskOut: diskOut, uDiskAmt: diskAmt, uDiskH: ev(P.diskH, u, 0.034), uDiskT: t + 4.0,
      uDiskGlow: ev(P.diskGlow, u, 1.0), uRingAmt: ev(P.ringAmt, u, 0), uRCirc: R_CIRC, uFlare: flare, uHot: hot,
      uClump: [clumpS, clumpAmt], uCool: ev(P.cool, u, 1),
      uDiskBound: this.diskBound(diskAmt, ev(P.ringAmt, u, 0), hot[2], diskOut, ev(P.diskH, u, 0.034)),
      uBoxMin: [-0.50, -0.15, -boxZ], uBoxMax: [boxX, 0.15, Math.max(0.38, boxZ)],
      uStarGain: ev(P.starGain, u, 0.6), uRakeG: ev(P.rakeG, u, 0.06),
      uStarVeil: ev(P.starVeil, u, 1.2), uDwarfCore: ev(P.dwarfCore, u, 0.15), uDbg: P.dbg ?? 0,
    };
    return { cam, U, t, u, head, cut, diskOut, diskAmt };
  },

  // bounding cylinder of the disk / forming ring (mirrors diskH() in lib/stream.glsl.js)
  diskBound(diskAmt, ringAmt, hot, diskOut, dh) {
    if (diskAmt + ringAmt <= 0 && hot <= 0) return [0, 0];
    const ro = Math.max(diskOut * 1.1, ringAmt > 0 ? R_CIRC + 0.1 : 0);
    const H = dh * ro * Math.pow(Math.max(ro, 0.01) / 0.2, 0.125) * 1.6 + 0.001;
    return [ro, H * 3.2];
  },

  // chase camera riding a point of the ballistic path (S08)
  chaseCam(C, t) {
    const path = this.path;
    const tau = ev(C.tau, t);
    const s = sAtTau(path, tau);
    const p = pathAtS(path, s);
    // smoothed heading (lagging) so the camera swings late and heavy round the bend
    const pa = pathAtS(path, s - 0.10), pb = pathAtS(path, s + 0.02);
    let tx = pb.x - pa.x, tz = pb.z - pa.z; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    const nx = -tz, nz = tx;                       // left of the heading (seen from above)
    const pos = [p.x - tx * C.back + nx * C.side, C.up, p.z - tz * C.back + nz * C.side];
    const ahead = pathAtS(path, s + C.lead);
    const far = [ahead.x * (1 - C.toDwarf) + XW * C.toDwarf, -0.02, ahead.z * (1 - C.toDwarf)];
    return camera(pos, v3.lerp([p.x, 0, p.z], far, C.look ?? 0.6), C.fov ?? 45);
  },

  render(E, S, target) {
    const P = S.params;
    const st = this.state(E, S);
    const vs = P.volScale ?? 0.5;
    const vt = E.target('binaryVol', vs);
    const U = st.U;
    U.uPixAng = 2 * st.cam.tanH / vt.h;
    // the volume stops at the smooth photosphere unless volRelief: then it stops where the main pass's relief
    // photosphere is, so the two agree on which rays hit the giant (no flat band inside the limb in close shots)
    E.draw(this.vol, { ...U, uRelief: P.volRelief ? U.uRelief : 0 }, vt);
    E.draw(this.main, { ...U, uVol: vt, uVolRes: [vt.w, vt.h] }, target);
  },

  post(E, S) {
    const P = S.params;
    const p = { ...(P.post || {}) };
    if (P.flare) {
      const t = clamp(S.local, 0, S.dur);
      const f = Math.exp(-t / (P.flare.decay * 1.4));
      p.bloomStrength = (p.bloomStrength ?? 0.08) + 0.05 * f;
      p.streakStrength = (p.streakStrength ?? 0) + 0.03 * f;
    }
    return p;
  },

  // ------------------------------------------------------------------------------------------------------
  overlay(E, S, ctx) {
    const P = S.params;
    if (!P.overlay) return null;
    const st = this.state(E, S);
    const t = st.t;
    // the overlay canvas is shared by every scene and keeps its state between frames: set what this ink depends
    // on, so a frame draws the same whatever was rendered before it (render order, chunking, the other cut)
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([]);
    ctx.shadowBlur = 0; ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    try {
      if (P.overlay === 'diagram') this.drawDiagram(E, ctx, st, st.u, P);
      else if (P.overlay === 'topdiagram') this.drawTopDiagram(E, ctx, st, st.u, P);
      else if (P.overlay === 'trajectory') this.drawTrajectory(E, ctx, st, t, P);
    } finally { ctx.restore(); }
    return 'add';
  },

  // pixel scale for the ink (line weights, marks, type): E.k (1.0 per 1080 px of the short side); the vertical
  // cut is watched on a phone, so its ink is drawn heavier (same 1.3x as the titles)
  inkScale(E) { return E.k * (E.portrait ? 1.3 : 1); },

  // project a 3D polyline; returns [{x,y,vis,len}] (len = cumulative world length)
  projectLine(E, cam, pts3, G) {
    const out = [];
    let len = 0;
    for (let i = 0; i < pts3.length; i++) {
      if (i) len += v3.len(v3.sub(pts3[i], pts3[i - 1]));
      const q = cam.project(pts3[i], E.W, E.H);
      if (!q) { out.push(null); continue; }
      const vis = G ? !occludedByGiant(cam.pos, pts3[i], G.R, G.bulge) : true;
      out.push({ x: q.x, y: q.y, vis, len });
    }
    return out;
  },

  // stroke a projected line up to fraction u of its world length; hidden parts faint. returns pen tip.
  strokeLine(ctx, pl, u, rgb, width, alpha, opts = {}) {
    const total = pl.reduce((m, p) => (p ? Math.max(m, p.len) : m), 0);
    const lim = total * clamp(u);
    if (lim <= 0) return null;
    const hidden = opts.hidden ?? 0.16;
    const dash = opts.dash || null;          // world-space dash [on, off]
    let tip = null;
    const passes = [[width * 5.0, 0.07], [width * 2.2, 0.20], [width, 1.0]];
    for (const [w, a] of passes) {
      ctx.lineWidth = w;
      let open = false, curVis = null;
      const flush = () => { if (open) { ctx.stroke(); open = false; } };
      for (let i = 1; i < pl.length; i++) {
        const p0 = pl[i - 1], p1 = pl[i];
        if (!p0 || !p1 || p0.len >= lim) { flush(); continue; }
        if (dash) { const ph = (p0.len % (dash[0] + dash[1])); if (ph > dash[0]) { flush(); continue; } }
        let x1 = p1.x, y1 = p1.y;
        if (p1.len > lim) { const k = (lim - p0.len) / Math.max(1e-9, p1.len - p0.len); x1 = p0.x + (p1.x - p0.x) * k; y1 = p0.y + (p1.y - p0.y) * k; }
        const vis = p0.vis && p1.vis;
        if (!open || vis !== curVis) {
          flush();
          ctx.strokeStyle = `rgba(${rgb},${(alpha * a * (vis ? 1 : hidden)).toFixed(4)})`;
          ctx.beginPath(); ctx.moveTo(p0.x, p0.y); open = true; curVis = vis;
        }
        ctx.lineTo(x1, y1);
        if (p1.len >= lim) tip = { x: x1, y: y1, vis };
      }
      flush();
    }
    return u < 1 ? tip : null;
  },

  penTip(ctx, tip, rgb, k, a = 1) {
    if (!tip) return;
    const g = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 9 * k);
    g.addColorStop(0, `rgba(${rgb},${0.9 * a * (tip.vis ? 1 : 0.3)})`);
    g.addColorStop(0.25, `rgba(${rgb},${0.25 * a * (tip.vis ? 1 : 0.3)})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(tip.x, tip.y, 9 * k, 0, Math.PI * 2); ctx.fill();
  },

  circle3(cx, cz, r, n = 180, a0 = 0, dir = -1) {
    const out = [];
    for (let i = 0; i <= n; i++) { const a = a0 + dir * (i / n) * Math.PI * 2; out.push([cx + Math.cos(a) * r, 0, cz + Math.sin(a) * r]); }
    return out;
  },

  crossMark(ctx, x, y, size, rgb, alpha, k) {
    ctx.lineCap = 'round';
    for (const [w, a] of [[4 * k, 0.12], [1.3 * k, 1]]) {
      ctx.lineWidth = w; ctx.strokeStyle = `rgba(${rgb},${alpha * a})`;
      ctx.beginPath(); ctx.moveTo(x - size, y); ctx.lineTo(x + size, y); ctx.moveTo(x, y - size); ctx.lineTo(x, y + size); ctx.stroke();
    }
  },

  label(ctx, text, x, y, px, rgb, alpha) {
    ctx.font = `italic 400 ${px.toFixed(1)}px "Cormorant Garamond"`;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = `rgba(${rgb},${alpha * 0.25})`;
    ctx.shadowColor = `rgba(${rgb},${alpha * 0.6})`; ctx.shadowBlur = px * 0.35;
    ctx.fillText(text, x, y);
    ctx.shadowBlur = 0;
    ctx.fillStyle = `rgba(${rgb},${alpha})`;
    ctx.fillText(text, x, y);
  },

  // upright 'L1' label beside the L1 mark. `off` = end of the leader in ink units from the mark (screen, y down);
  // the text sits beyond it on that side (left-aligned right of the mark, right-aligned left of it).
  // T = { px, sub, dx, dy }: type sizes and the subscript's offset, in ink units. `a` = text alpha.
  l1Label(ctx, l1, k, off, T, rgb, a, leader) {
    const ex = l1.x + off[0] * k, ey = l1.y + off[1] * k;
    if (leader) {
      const l = Math.hypot(off[0], off[1]) || 1;
      const s0 = off[0] && off[1] ? [6 * Math.sign(off[0]), 6 * Math.sign(off[1])] : [off[0] / l * 8.5, off[1] / l * 8.5];
      ctx.lineWidth = 0.9 * k; ctx.strokeStyle = `rgba(${rgb},${a * 0.45 / 0.92})`;
      ctx.beginPath(); ctx.moveTo(l1.x + s0[0] * k, l1.y + s0[1] * k); ctx.lineTo(ex, ey); ctx.stroke();
    }
    ctx.font = `italic 400 ${(T.sub * k).toFixed(1)}px "Cormorant Garamond"`;
    const wTxt = T.dx * k + ctx.measureText('1').width;
    const x = off[0] >= 0 ? ex + 3 * k : ex - 3 * k - wTxt;
    // above the leader end when it rises, below when it falls, centred on it when the leader is near horizontal
    const y = Math.abs(off[1]) < 0.35 * Math.abs(off[0]) ? ey + T.px * 0.3 * k : off[1] < 0 ? ey - 4 * k : ey + T.px * 0.62 * k;
    this.label(ctx, 'L', x, y, T.px * k, rgb, a);
    this.label(ctx, '1', x + T.dx * k, y + T.dy * k, T.sub * k, rgb, a);
  },

  // S04: orbit, Roche figure-eight, L1 — fine ice-blue lines drawn on through the shot
  drawDiagram(E, ctx, st, t, P) {
    const k = this.inkScale(E), cam = st.cam, ICE = '160,205,255';
    const G = { ...GIANT_DEF, ...(P.giant || {}) };
    const D = P.diagram || {};
    const w = 1.25 * k * (D.inkW ?? 1);
    const ramp = (a, b) => clamp((t - a) / (b - a));
    const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
    const fadeAll = D.fade ?? 1;
    // barycentre
    const bc = cam.project([0, 0, 0], E.W, E.H);
    const ub = ramp(...(D.bary || [0.07, 0.17]));
    if (bc && ub > 0) {
      const vis = !occludedByGiant(cam.pos, [0, 0, 0], G.R, G.bulge);
      this.crossMark(ctx, bc.x, bc.y, 5 * k * ease(ub), ICE, 0.7 * fadeAll * (vis ? 1 : 0.2), k);
    }
    // the dwarf's orbit about the barycentre, drawn in the orbital sense (fine, secondary)
    const oW = this.projectLine(E, cam, this.circle3(0, 0, XW, 200, 0, -1), G);
    const tipW = this.strokeLine(ctx, oW, ease(ramp(...(D.orbit || [0.05, 0.5]))), ICE, w * 0.9, 0.42 * fadeAll, { hidden: 0.1 });
    this.penTip(ctx, tipW, ICE, k, 0.7 * fadeAll);
    // Roche figure-eight: two pens leave L1 together, one around each lobe
    const uL = ease(ramp(...(D.lobes || [0.3, 0.8])));
    const lg = this.projectLine(E, cam, this.lobeG, G);
    const lw = this.projectLine(E, cam, this.lobeW, G);
    const t1 = this.strokeLine(ctx, lg, uL, ICE, w * 1.1, 0.95 * fadeAll, { hidden: 0.12 });
    const t2 = this.strokeLine(ctx, lw, uL, ICE, w * 1.1, 0.95 * fadeAll);
    this.penTip(ctx, t1, ICE, k, fadeAll); this.penTip(ctx, t2, ICE, k, fadeAll);
    // L1 mark and label
    const l1 = cam.project(L1, E.W, E.H);
    const um = ease(ramp(...(D.mark || [0.77, 0.87])));
    if (l1 && um > 0) {
      ctx.save(); ctx.translate(l1.x, l1.y); ctx.rotate(Math.PI / 4);
      this.crossMark(ctx, 0, 0, 7 * k * um, ICE, 0.95 * fadeAll, k);
      ctx.restore();
      const ul = ramp(...(D.label || [0.82, 0.95]));
      if (ul > 0) {
        const ls = D.labelScale ?? 1;
        this.l1Label(ctx, l1, k, D.labelOff || [26, -30], { px: 32 * ls, sub: 20 * ls, dx: 15 * ls, dy: 6 * ls }, ICE, 0.92 * ul * fadeAll, true);
      }
    }
  },

  // F29.4: top-down orbital diagram, fast
  drawTopDiagram(E, ctx, st, t, P) {
    const k = this.inkScale(E), cam = st.cam, ICE = '160,205,255';
    const w = 1.2 * k * (P.inkW ?? 1);
    const u = clamp(0.45 + t * 0.85);
    const ease = (x) => 1 - Math.pow(1 - x, 3);
    const lg = this.projectLine(E, cam, this.lobeG, null);
    const lw = this.projectLine(E, cam, this.lobeW, null);
    this.penTip(ctx, this.strokeLine(ctx, lg, ease(u), ICE, w, 0.75), ICE, k);
    this.penTip(ctx, this.strokeLine(ctx, lw, ease(u), ICE, w, 0.75), ICE, k);
    const orb = this.projectLine(E, cam, this.circle3(0, 0, XW, 200, 0, -1), null);
    this.strokeLine(ctx, orb, ease(clamp(u * 1.1 - 0.1)), ICE, w * 0.9, 0.45, { dash: [0.02, 0.014] });
    const disk = this.projectLine(E, cam, this.circle3(XW, 0, st.diskOut, 160, Math.PI, -1), null);
    this.strokeLine(ctx, disk, ease(clamp(u * 1.2 - 0.2)), ICE, w * 0.8, 0.4);
    const rc = this.projectLine(E, cam, this.circle3(XW, 0, R_CIRC, 120, Math.PI, -1), null);
    this.strokeLine(ctx, rc, ease(clamp(u * 1.3 - 0.3)), ICE, w * 0.8, 0.32, { dash: [0.008, 0.008] });
    // ballistic trajectory from L1 (fine dotted)
    const tr = this.path.pts.filter((p, i) => p.s >= 0 && i % 2 === 0).map((p) => [p.x, 0, p.z]);
    this.strokeLine(ctx, this.projectLine(E, cam, tr, null), ease(clamp(u * 1.2 - 0.15)), ICE, w * 0.9, 0.55, { dash: [0.006, 0.006] });
    const l1 = cam.project(L1, E.W, E.H);
    if (l1) {
      ctx.save(); ctx.translate(l1.x, l1.y); ctx.rotate(Math.PI / 4); this.crossMark(ctx, 0, 0, 6 * k, ICE, 0.9, k); ctx.restore();
      const ls = P.labelScale ?? 1;
      this.l1Label(ctx, l1, k, P.labelOff || [6, -7], { px: 26 * ls, sub: 17 * ls, dx: 12 * ls, dy: 5 * ls }, ICE, 0.85, false);
    }
  },

  // S08: gold dashed ballistic trajectory with tick marks, drawing ahead of the clump
  drawTrajectory(E, ctx, st, t, P) {
    const k = this.inkScale(E), cam = st.cam, GOLD = '255,196,110';
    const path = this.path;
    const tauC = ev(P.clump.tau, st.u);
    const tauEnd = Math.min(1.395, tauC + 0.012 + 0.16 * (1 - Math.exp(-t / 1.1)) + 0.02 * t);
    const pts = [];
    for (let tau = tauC + 0.006; tau <= tauEnd; tau += 0.0025) { const p = pathAtS(path, sAtTau(path, tau)); pts.push([p.x, 0, p.z]); }
    if (pts.length < 2) return;
    const pl = this.projectLine(E, cam, pts, null);
    // fade-in near the clump, world-anchored dashes
    this.strokeLine(ctx, pl, 1, GOLD, 1.6 * k, 1.0, { dash: [0.012, 0.008] });
    const tipP = pl[pl.length - 1];
    if (tipP) this.penTip(ctx, { x: tipP.x, y: tipP.y, vis: true }, GOLD, k * 1.2);
    // tick marks at equal ballistic time: spacing opens up as the gas accelerates
    const dT = 0.02;
    for (let tau = Math.ceil(tauC / dT) * dT; tau <= tauEnd; tau += dT) {
      const p = pathAtS(path, sAtTau(path, tau));
      const nx = -p.tz, nz = p.tx, L = 0.008;
      const a = cam.project([p.x + nx * L, 0, p.z + nz * L], E.W, E.H), b = cam.project([p.x - nx * L, 0, p.z - nz * L], E.W, E.H);
      if (!a || !b) continue;
      const fadeIn = clamp((tauEnd - tau) / 0.01);
      for (const [lw, al] of [[4 * k, 0.12], [1.3 * k, 0.9]]) {
        ctx.lineWidth = lw; ctx.strokeStyle = `rgba(${GOLD},${al * fadeIn})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
  },
};
