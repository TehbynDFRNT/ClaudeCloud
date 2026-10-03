// DAVID up close: the white dwarf. Earth-sized, absurdly dense, smooth, ~30,000 K cold blue-white,
// a thin atmosphere, dipole magnetic filaments, and the accreted hydrogen ocean that thickens toward ignition.
// Dwarf-centric units: dwarf at the origin, radius 1. The giant lies far off along -X (uGiantDir).
//
// Preset params: numbers, arrays, or keyframe lists [[time, value, easing?], ...] where time is timing-agnostic
// (fraction of the shot, 'Nf'/'Ns' after the first frame, 'e-Nf'/'e-Ns' before the last; see resolveT).
// The scene clock (uTime, star spin) is shot-relative so framing and look survive re-timing of the plan.
//   rig: 'orbit'  -> dist (log-interpolated), az, el (deg), fov, screen [sx, sy] (where the dwarf sits), roll
//   rig: 'surface'-> lat, lon, alt (R above surface), heading, pitch (deg), fov, roll
//   magnetism: magTilt, magAz (world) or magLocal [magLat, magHeading] (relative to the camera footpoint at t = 0);
//              fil, filL, filW, filN (planes), filSpan (deg), filAt (centre the planes on the camera, offset deg),
//              filPhase (deg), filK (strands per plane), shimmer, tremolo, snapAt
//   ocean, oceanH, heat, oceanGain, turbF, turbV, cells, warp, big, detail, conv {dir, at, amp}
//   flare, flareSize, flash, flashR, flashDir, plume, columns, colL, haze, hazePx (angular, 1080p px), hazeF, crimson,
//   scorch, shell, shellR (frame heights), shellBlur, thread, threadGain, stars, atmo, dust, white, tOff, post {...}
import { frag, STARS } from '../engine/glsl.js';
import { DWARF } from './lib/dwarf.glsl.js';
import { DWARF_CLOSE } from './lib/dwarf-close.glsl.js';
import { camera, keys, v3, clamp, smoothstep, catmull } from '../engine/math.js';
import { drift } from './lib/util.js';

// PASS 0: single full-res pass (no ocean). PASS 1: low-res body (surface + ocean) with coverage alpha.
// PASS 2: full-res sharp pass (backdrop, detail, limb, corona, filaments, columns, thread, plume, point glow) over PASS 1.
const MAIN = `
uniform sampler2D uLow;
// implosion (S21 end): the whole view is lensed into a disc of radius uImp.x (half short sides) around frame centre that
// collapses to a point. uImp: (horizon radius, central zoom-out, swirl at the rim rad, gain);
// uImpCore: (point brightness, point width, infall streaks, collapse phase)
uniform vec4 uImp;
uniform vec4 uImpCore;
vec3 impCore(vec2 uv){
  vec2 p = uv * vec2(frameAspect(), 1.0);
  float rho = length(p) / min(frameAspect(), 1.0);
  vec3 c = vec3(0.0);
  if (uImpCore.x > 0.0){
    float q = rho / uImpCore.y;
    c += vec3(1.0, 0.86, 0.70) * uImpCore.x * (exp(-q * q) + 0.04 / (1.0 + q * q * 0.06));
  }
  if (uImpCore.z > 0.0){
    // light dragged in from outside the horizon: thin converging streaks, spiralling with the twist, running inward
    float x = rho / uImp.x;
    float a = atan(p.y, p.x) + uImp.z * 0.35 / max(x, 0.3);
    float lr = log(max(x, 1e-3));
    float s1 = n3(vec3(cos(a) * 14.0, sin(a) * 14.0, lr * 2.2 + uImpCore.w * 9.0));
    float s2 = n3(vec3(cos(a) * 31.0 + 5.0, sin(a) * 31.0, lr * 3.0 + uImpCore.w * 13.0 + 7.0));
    float st = smoothstep(0.30, 0.85, s1) * 0.7 + smoothstep(0.45, 0.9, s2) * 0.5;
    float env = smoothstep(0.92, 1.02, x) * exp(-max(x - 1.0, 0.0) * 2.2);
    vec3 sc = mix(vec3(1.0, 0.55, 0.20), vec3(0.55, 0.75, 1.0), smoothstep(0.2, 0.8, s2 * 0.5 + 0.5));
    c += sc * st * env * uImpCore.z;
  }
  return c;
}
void main(){
  vec2 uv = frameUV();
  vec3 ro = uCamPos;
  float pixA = 2.0 * uTanHalfFov / uRes.y;
  vec3 rd;
  float impW = 1.0;
  if (uImp.x > 0.0){
    // gravitational-lens style pull: radius rho maps to rho * Z / (1 - x^2), x = rho / R, so the whole forward
    // hemisphere is squeezed inside the horizon disc (its rim = rays bent to 90 deg), with a twist near the rim
    vec2 p = uv * vec2(frameAspect(), 1.0);
    float rho = length(p) / min(frameAspect(), 1.0);
    float x = rho / uImp.x;
    if (x >= 1.0){
#if PASS == 1
      fragColor = vec4(0.0, 0.0, 0.0, 1.0);
#else
      fragColor = vec4(impCore(uv), 1.0);
#endif
      return;
    }
    float om = 1.0 - x * x;
    vec2 ps = rot2(uImp.z * x * x) * p * (uImp.y / om);
    rd = normalize(uCamRot * vec3(ps * uTanHalfFov, 1.0));
    pixA *= min(uImp.y * (1.0 + x * x) / (om * om), 64.0);          // local compression: keep detail at pixel scale
    impW = smoothstep(1.0, 0.86, x) * uImp.w;
  } else rd = cameraRay(uv);
  float t = uTime;
  rd = wdHaze(ro, rd, t);
  // dwarf body with an anti-aliased limb
  float tc = max(dot(-ro, rd), 0.0);
  float bimp = length(ro + rd * tc);
  vec2 hs = sphereHit(ro, rd, vec3(0.0), 1.0);
  bool hit = hs.y > 0.0 && hs.x > 0.0;
  float tS = hit ? hs.x : 1e9;
  float edgePx = (bimp - 1.0) / max(pixA * tc, 1e-6);   // signed distance to the silhouette in pixels
  float cover = sat(0.5 - edgePx);
  vec3 n = hit ? normalize(ro + rd * tS) : normalize(ro + rd * tc);
  float mu = hit ? sat(dot(n, -rd)) : 0.0;
#if PASS == 1
  vec3 col = cover > 0.0 ? wdSurface(n, mu, t) * cover : vec3(0.0);
  float a = cover;
  vec4 oc = wdOcean(ro, rd, tS, t, pixA);
  col = col * oc.w + oc.rgb;
  a = 1.0 - (1.0 - a) * oc.w;
  fragColor = vec4(col, a);
#else
  vec3 col = vec3(0.0);
  float cw = 1.0;
#if PASS == 2
  vec4 low = texture(uLow, gl_FragCoord.xy / uRes);
  if (low.a < 0.999) col = wdBackdrop(rd, t) * (1.0 - low.a);
  col += wdDetail(ro, rd, low.rgb, t, pixA);
  cw = mix(1.0, 0.12, low.a);          // the thin atmosphere lies inside the opaque ocean: same occlusion on both sides of the limb
#else
  if (cover < 1.0) col = wdBackdrop(rd, t);
  if (cover > 0.0) col = mix(col, wdSurface(n, mu, t), cover);
#endif
  if (uFlare > 0.0 && hit) col += wdFlares(n, mu, t);
  col += wdCorona(ro, rd, tS, mu) * cw;
  col += wdColumns(ro, rd, tS, pixA, t);
  col += wdFilaments(ro, rd, tS, pixA, t);
  col += wdThread(ro, rd, tS, pixA, t);
  col += wdFlashPlume(ro, rd, tS, t, pixA);
  col += wdDust(ro, rd, tS, t);
  if (uPoint > 0.0) col += dwarfGlow(ro, rd, 1e9, pixA) * uPoint;
  if (uWhite > 0.0){
    // convergence: the frame draws in toward a blazing point at its centre; the edges fall to clean black,
    // then the blaze floods the frame (white-to-white into the ignition cut)
    float r = length(uv * vec2(frameAspect(), 1.0));
    float w = uWhite;
    float pull = exp(-r * r * mix(0.4, 7.0, w * w));
    col *= mix(1.0, pull, min(1.0, w * 1.5));
    col += vec3(1.0, 0.96, 0.90) * (45.0 * w * w * w * exp(-r * r / (0.003 + 0.09 * w * w)) + 2.5 * w * w * pull);
    col += vec3(1.0, 0.97, 0.93) * 2.0 * smoothstep(0.78, 1.0, w);
  }
  if (uImp.x > 0.0) col = col * impW + impCore(uv);
  fragColor = vec4(col, 1.0);
#endif
}`;
const FS = (pass) => frag(`#define PASS ${pass}`, STARS, DWARF, DWARF_CLOSE, MAIN);
const LOW_SCALE = 0.66;

const D2R = Math.PI / 180;

// value or keyframe list at time t
function kv(v, t, def) {
  if (v === undefined) return def;
  if (Array.isArray(v) && Array.isArray(v[0])) return keys(v, t);
  return v;
}
// keyframed positive quantity interpolated in log space (camera distance)
function kvLog(v, t) {
  if (!(Array.isArray(v) && Array.isArray(v[0]))) return v;
  return Math.exp(keys(v.map((k) => [k[0], Math.log(k[1]), k[2]]), t));
}
const sph = (latD, lonD) => {
  const la = latD * D2R, lo = lonD * D2R;
  return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
};
// local frame at a surface point: horizontal direction for a heading (deg, 0 = north toward +Y)
function horizAt(n, headingD) {
  const east = v3.norm(v3.cross([0, 1, 0], n));
  const north = v3.cross(n, east);
  const h = headingD * D2R;
  return v3.add(v3.mul(north, Math.cos(h)), v3.mul(east, Math.sin(h)));
}

// aspect: the frame aspect the `screen` offset is measured in. 16/9 in landscape and whenever a portrait `framing`
// reframes the shot (framing works on the 16:9 composition); the real frame aspect in an unframed portrait render.
export function rig(P, t, aspect = 16 / 9) {
  if (P.rig === 'surface') {
    const n = sph(kv(P.lat, t, 0), kv(P.lon, t, 0));
    const alt = kvLog(P.alt, t);
    const p = kv(P.pitch, t, -10) * D2R;
    const horiz = horizAt(n, kv(P.heading, t, 0));
    const fwd = v3.add(v3.mul(horiz, Math.cos(p)), v3.mul(n, Math.sin(p)));
    let pos = v3.mul(n, 1 + alt);
    if (P.shake) { const d = drift(t, P.shake * alt, 2.2, 3); pos = v3.add(pos, d); }
    return camera(pos, v3.add(pos, fwd), kv(P.fov, t, 40), kv(P.roll, t, 0) * D2R, n);
  }
  // orbit around the dwarf, distance log-interpolated, dwarf placed at screen offset
  const d = kvLog(P.dist, t);
  const az = kv(P.az, t, 0) * D2R, el = kv(P.el, t, 0) * D2R;
  const fov = kv(P.fov, t, 35);
  const pos = [d * Math.cos(el) * Math.sin(az), d * Math.sin(el), d * Math.cos(el) * Math.cos(az)];
  const [sx, sy] = kv(P.screen, t, [0, 0]);
  const tanH = Math.tan(fov * D2R / 2);
  // aim so that the origin lands at (sx, sy) in frame coordinates
  const f0 = v3.norm(v3.mul(pos, -1));
  const yaw = Math.atan(sx * tanH * aspect), pitch = Math.atan(sy * tanH);
  const r0 = v3.norm(v3.cross(f0, [0, 1, 0])), u0 = v3.cross(r0, f0);
  let f = v3.add(v3.mul(f0, Math.cos(yaw)), v3.mul(r0, -Math.sin(yaw)));
  f = v3.norm(v3.add(v3.mul(f, Math.cos(pitch)), v3.mul(u0, -Math.sin(pitch))));
  let tgt = v3.add(pos, f);
  if (P.drift) { const dd = drift(t, P.drift * 0.004, 0.6, 1); tgt = v3.add(tgt, dd); }   // small angular handheld drift
  return camera(pos, tgt, fov, kv(P.roll, t, 0) * D2R);
}

// rotate v about +Y by angle a
const rotY = (v, a) => [v[0] * Math.cos(a) + v[2] * Math.sin(a), v[1], -v[0] * Math.sin(a) + v[2] * Math.cos(a)];

// magnetic frame. World: axis tilted from +Y by magTilt toward azimuth magAz, precessing with the star's spin.
// Local (surface shots): the camera footpoint at t = 0 sits at magnetic latitude magLat, magnetic north along magHeading.
export function magFrame(P, t, spinA) {
  let ax;
  if (P.magLocal) {
    const [mlat, mhead] = P.magLocal;
    const n0 = sph(kv(P.lat, 0, 0), kv(P.lon, 0, 0));
    const la = mlat * D2R;
    ax = v3.norm(v3.add(v3.mul(n0, Math.sin(la)), v3.mul(horizAt(n0, mhead), Math.cos(la))));
    ax = rotY(ax, spinA - (P.spin ? P.spin[0] : 0));
  } else {
    ax = sph(90 - kv(P.magTilt, t, 25), kv(P.magAz, t, 0) + spinA / D2R);
  }
  const ref = v3.norm(v3.cross(ax, Math.abs(ax[1]) < 0.95 ? [0, 1, 0] : [1, 0, 0]));
  return { ax, ref };
}

// new stream thread centreline in the orbital plane: from the giant side, bowing to +Z, curling CCW (seen from +Y),
// Catmull-Rom smoothed to 40 points
function threadPts() {
  const ctrl = [];
  for (let i = 0; i < 14; i++) {
    const s = i / 13;
    const phi = (176 - 150 * Math.pow(s, 1.15)) * D2R;
    const r = 26 * Math.pow(1.9 / 26, Math.pow(s, 0.75));
    ctrl.push([r * Math.cos(phi), r * Math.sin(phi)]);
  }
  const out = [];
  for (let i = 0; i < 40; i++) out.push(...catmull(ctrl, i / 39));
  return out;
}

// Keyframe times in presets are timing-agnostic so the shot survives re-timing of the plan:
//   number u in [0,1]   -> fraction of the rendered span (0 = first frame, 1 = last frame)
//   'Nf' / 'Ns'         -> N frames / seconds after the first frame
//   'e-Nf' / 'e-Ns'     -> N frames / seconds before the last frame
function resolveT(k, dur, fps) {
  const span = Math.max(dur - 1 / fps, 1e-3);
  if (typeof k === 'number') return k * span;
  const m = /^(e-)?([\d.]+)([fs])$/.exec(k);
  if (!m) return 0;
  const sec = m[3] === 'f' ? +m[2] / fps : +m[2];
  return m[1] ? span - sec : sec;
}
const isKeys = (v) => Array.isArray(v) && Array.isArray(v[0]) && v[0].length >= 2 && (typeof v[0][0] === 'number' || typeof v[0][0] === 'string') && !Array.isArray(v[0][0]);
export function resolveParams(P, dur, fps) {
  const out = {};
  for (const [k, v] of Object.entries(P)) {
    if (isKeys(v)) out[k] = v.map((e) => [resolveT(e[0], dur, fps), ...e.slice(1)]);
    else if (v && typeof v === 'object' && !Array.isArray(v)) out[k] = resolveParams(v, dur, fps);
    else out[k] = v;
  }
  return out;
}

// The implosion (S21 end) from its progress s in [0, 1]. The lens horizon (radius in half short sides, around the frame
// centre) closes with collapse-like acceleration and is a point at s = end; on the way in the light is concentrated
// (gain), gathers in a small hot point, and is extinguished between killA and killB (black after that, no flash).
// shape (preset implodeShape): r0, pow, end, zoom (central zoom-out), swirl (rad at the rim), gain, core, streaks, killA, killB.
function implosion(s, sh, minPx) {
  if (!(s > 0)) return { imp: [0, 1, 0, 1], core: [0, 1, 0, 0] };
  const end = sh.end ?? 0.9;
  const u = clamp(s / end);
  const R = (sh.r0 ?? 5.0) * Math.pow(1 - u, sh.pow ?? 2.2) + 0.004;
  const kill = 1 - smoothstep(sh.killA ?? 0.8, sh.killB ?? 0.93, s);
  const Z = 1 + (sh.zoom ?? 1.5) * u * u;
  const swirl = (sh.swirl ?? 1.4) * Math.pow(u, 1.5);
  const gain = (1 + (sh.gain ?? 0.8) * u * u) * kill;
  const px = 2 / minPx;                                   // one output pixel in half-short-side units
  const coreW = Math.max(R * 0.18, px * 1.2);
  const core = (sh.core ?? 30) * smoothstep(0.55, 0.9, u) * kill;
  const streaks = (sh.streaks ?? 0.6) * smoothstep(0.08, 0.35, u) * (1 - smoothstep(0.7, 0.95, u)) * kill;
  return { imp: [R, Z, swirl, gain], core: [core, coreW, streaks, u] };
}

export default {
  id: 'whitedwarf',
  scale: 1,
  presets: {
    // Introduce DAVID: a piercing point at centre-right; the push resolves an Earth-sized sphere. Title bottom-left stays calm.
    // As the disc resolves its radiance eases into the tonemap shoulder so the limb darkening, the thin atmospheric rim and
    // the faint magnetic sculpting read; the halo and bloom keep it blinding. Heat haze is set in screen pixels.
    'S03-david': {
      rig: 'orbit', dist: [[0, 1100], [1, 7.6, 'inOutSine']], az: [[0, -9], [1, 5]], el: [[0, 9], [1, 6]],
      fov: [[0, 30], [1, 28]], screen: [[0, [0.25, 0.05]], [1, [0.25, 0.08]]], drift: 0.4,
      spin: [0.2, 0.05], magTilt: 24, magAz: 35, surf: [[0, 1.9], [0.5, 1.7], [1, 1.0]], fil: 1.5, filL: [1.25, 2.1], filW: 0.0045, shimmer: 0.015,
      ocean: 0, haze: 0.0, hazePx: [[0, 0], [0.5, 1.0], [1, 3.2]], hazeF: 4.0, crimson: 0.5, atmo: [[0, 1.0], [1, 0.55]], stars: 0.75, dust: 2.5,
      post: { exposure: [[0, 1.15], [1, 1.0]], bloomStrength: [[0, 0.2], [1, 0.22]], bloomThreshold: 1.1, streakStrength: [[0, 0.28], [0.5, 0.10], [1, 0.04]], vignette: 0.6 },
      // 9:16: the point upper centre-right; the push ends with the disc ~0.6W wide in the upper half of the 3:4 window,
      // leaving the bottom-left name card (x >= 0.09W, 0.72H-0.84H) on black
      portrait: { fov: [[0, 45], [1, 43]], screen: [[0, [0.3, 0.3]], [1, [0.14, 0.24]]] },
    },
    // Compression: the hydrogen ocean piles up. Skimming the horizon; smooth swirling layer, convection not yet set in.
    // The layer visibly thickens against the horizon over the shot.
    'S14a-ocean': {
      rig: 'surface', lat: 6, lon: [[0, -24], [1, -22.6]], alt: [[0, 0.05], [1, 0.056]], heading: [[0, 78], [1, 84]], pitch: [[0, -15], [1, -13]], fov: 35, roll: [[0, -3], [1, -1]],
      spin: [0.2, 0.05], magTilt: 62, magAz: 160, surf: 1.4, fil: 1.4, filL: [1.03, 1.2], filW: 0.0014, shimmer: 0.02,
      ocean: [[0, 0.32], [1, 0.95]], oceanH: 0.009, heat: [[0, 0.0], [1, 0.2]], oceanGain: [[0, 0.85], [1, 1.25]], turbF: 62, turbV: 0.9, cells: 0.12,
      detail: 0.6, haze: 0.0006, hazeF: 60, crimson: 0.25, atmo: 1.0, stars: 0.8,
      post: { bloomStrength: 0.12, exposure: 1.0 },
      // 9:16: the horizon high in the 3:4 window (sky ~30%), the thickening ocean below
      portrait: { fov: 40, pitch: [[0, -21], [1, -19]] },
    },
    // First flickers: the surface brightens, small flares; oblique view with the limb against black
    'S14h-flare': {
      rig: 'surface', lat: [[0, -14], [1, -12.5]], lon: 40, alt: 0.22, heading: [[0, 20], [1, 26]], pitch: [[0, -34], [1, -38]], fov: 38, roll: 22,
      spin: [0.2, 0.01], magLocal: [-6, 113], surf: [[0, 1.2], [1, 1.9]], fil: 2.6, filL: [1.025, 1.10], filW: 0.0022, filN: 6, filSpan: 30, filAt: -30, shimmer: 0.03,
      ocean: 0.66, oceanH: 0.008, heat: [[0, 0.0], [1, 0.22]], oceanGain: [[0, 0.8], [1, 1.25]], turbF: 40, cells: 0.45, turbV: 1.1,
      flare: [[0, 0.35], [1, 1.0]], flareSize: 2.4, detail: 0.5,
      haze: 0.0015, hazeF: 25, crimson: 0.2, atmo: 1.0, stars: 0.7,
      post: { bloomStrength: 0.16 },
    },
    // Frenzy: magnetic poles with accretion curtains falling onto them; fast orbit
    'F28.4': {
      rig: 'orbit', dist: [[0, 4.6], [1, 4.1]], az: [[0, 18], [1, 34]], el: [[0, 26], [1, 22]], fov: 40, screen: [-0.12, -0.02], roll: [[0, 6], [1, 2]],
      spin: [0.2, 0.05], magTilt: 38, magAz: 30, surf: 2.2, fil: 0.8, filL: [1.6, 4.2], filW: 0.004, shimmer: 0.02,
      ocean: 0.6, oceanH: 0.014, heat: 0.15, oceanGain: 1.0, turbF: 55, turbV: 1.2, cells: 0.7, warp: 0.45, big: 1.0,
      columns: 1.0, colL: [3.0, 4.6], haze: 0.004, hazeF: 6, crimson: 0.25, atmo: 1.0, stars: 0.9,
      post: { bloomStrength: 0.15, streakStrength: 0.05 },
      // 9:16: the whole sphere ~0.76W, rolled so the magnetic axis stands upright: curtains fall down the height
      portrait: { dist: [[0, 5.2], [1, 4.6]], fov: 52, screen: [0, 0.02], roll: [[0, -49], [1, -53]] },
    },
    // Frenzy: the surface ocean, hotter (top-down, rushing)
    'F30.4': {
      rig: 'surface', lat: 30, lon: [[0, 62], [1, 63.6]], alt: 0.045, heading: 110, pitch: -58, fov: 44, roll: 0,
      spin: [0.2, 0.05], magTilt: 20, magAz: 10, surf: 1.5, fil: 1.0, filL: [1.01, 1.05], filW: 0.0006, shimmer: 0.03,
      ocean: 0.86, oceanH: 0.0045, heat: 0.3, oceanGain: 1.0, turbF: 160, turbV: 2.4, flare: 0.6, cells: 0.85, detail: 0.7,
      haze: 0.0008, hazeF: 160, crimson: 0, atmo: 1.0, stars: 0.6,
      post: { bloomStrength: 0.15 },
    },
    // Frenzy: a violent bright flash of the surface. High oblique view across the curved surface: the flash erupts
    // mid-frame, its front races across the visible surface, white-hot fingers and sparks shoot up past the limb.
    'F31.7': {
      rig: 'orbit', dist: [[0, 1.75], [1, 1.68]], az: [[0, -32], [1, -30]], el: [[0, 34], [1, 35]], fov: 40, screen: [[0, [0.35, -1.25]], [1, [0.35, -1.27]]], roll: -18,
      spin: [0.2, 0.05], magTilt: 30, magAz: 200, surf: 1.8, fil: 1.6, filL: [1.15, 1.6], filW: 0.003, shimmer: 0.03,
      ocean: 0.9, oceanH: 0.012, heat: 0.3, oceanGain: 1.0, turbF: 34, turbV: 2.0, cells: 0.75, warp: 0.6, big: 0.5,
      flash: [[0, 1.0], ['1f', 5.0, 'outQuad'], ['3f', 2.2], [1, 0.9, 'outQuad']], flashR: [[0, 0.03], [1, 0.75, 'outCubic']], flashDir: [-0.45, 0.88, 0.15],
      plume: [[0, 0.05], [1, 0.9, 'outCubic']],
      haze: 0.004, hazeF: 8, crimson: 0.2, atmo: 1.2, stars: 0.6,
      post: { bloomStrength: [[0, 0.12], ['1f', 0.2], [1, 0.12]], streakStrength: [[0, 0.08], ['1f', 0.6], ['3f', 0.22], [1, 0.08]], streakTint: [0.3, 0.55, 1.0], halation: 0.008, exposure: 1.0 },
      // 9:16: recentred on the flash; the limb crosses the frame above it, the fingers shoot up into the black
      portrait: { framing: { pan: [-0.22, 0.3], zoom: 0.8 } },
    },
    // Strike 3 (cut on the strike): the surface layer convulses, blue filaments snap at local = 0. The biggest whip and
    // recoil land 6-24 frames in, after the plan's strike flash has decayed; torn ends drag hot plasma and fade over ~2.5 s,
    // the intact loops ring and re-tension; a compression ring sweeps the visible surface and the limb heaves.
    'S19-strike3': {
      rig: 'orbit', dist: [[0, 2.05], [1, 1.85]], az: [[0, 12], [1, 16]], el: [[0, 4], [1, 6]], fov: 40, screen: [[0, [-0.62, -0.78]], [1, [-0.6, -0.74]]], roll: 24,
      spin: [0.2, 0.05], magTilt: 75, magAz: 200, surf: 1.6, fil: 3.2, filL: [1.15, 2.4], filW: 0.0065, filN: 10, filK: 3, shimmer: 0.02, snapAt: 0,
      ocean: 0.9, oceanH: 0.010, heat: 0.2, oceanGain: 1.0, turbF: 85, turbV: 1.4, cells: 0.8, warp: 0.9, big: 1.0, detail: 0.5,
      conv: { dir: [0.05, 0.25, 0.97], at: 0.0, amp: 1.4 },
      haze: 0.003, hazeF: 10, crimson: 0.2, atmo: 1.2, stars: 0.8,
      post: { bloomStrength: 0.16 },
      // 9:16: the landscape composition turned a quarter: the star below, the limb across, the filaments rising above
      portrait: { framing: { roll: 90, zoom: 0.5625 } },
    },
    // Strike 5 + final tremolo: extreme close; the curved horizon and black sky across the top of the scope band, a
    // corridor of blue magnetic arches over the convecting ocean, vibrating in tremolo; the heat haze bends limb, stars
    // and arches more and more; in the last 12 frames the camera pitches down into a point of white.
    'S21-strike5': {
      rig: 'surface', lat: [[0, 18], [1, 18.4]], lon: [[0, -8], [1, -7.2]], alt: [[0, 0.076], ['e-12f', 0.064], [1, 0.016, 'inQuad']],
      heading: [[0, 92], [1, 99]], pitch: [[0, -28], [0.45, -27.5], ['e-12f', -25.5], [1, -75, 'inQuad']], fov: [[0, 44], ['e-12f', 41], [1, 28, 'inQuad']], roll: [[0, 5], ['e-12f', 11], [1, 22]],
      spin: [0.2, 0.0], magLocal: [-6, 0], surf: [[0, 1.7], [0.6, 1.9], ['e-12f', 1.9], [1, 2.6, 'inQuad']],
      fil: [[0, 3.0], [1, 5.0]], filL: [1.03, 1.10], filW: 0.0025, filN: 10, filSpan: 22, filAt: 31, filK: 2,
      shimmer: 0.03, tremolo: [[0, 0.02], [1, 0.08, 'inQuad']],
      ocean: 1.0, oceanH: 0.0055, heat: [[0, 0.12], ['e-12f', 0.3], [1, 0.6, 'inQuad']], oceanGain: [[0, 1.0], ['e-12f', 1.2], [1, 1.8, 'inQuad']], turbF: 95, turbV: [[0, 1.4], [1, 2.8]],
      cells: 1.0, detail: 0.9, flare: [[0, 0.4], [1, 1.0]], flareSize: 1.4,
      haze: [[0, 0.0008], [0.4, 0.0014], ['e-12f', 0.0045], [1, 0.007, 'inQuad']], hazeF: 45, crimson: 0, atmo: 1.0, stars: 0.7,
      white: [[0, 0], ['e-12f', 0], [1, 1.0, 'linear']],
      post: {
        bloomStrength: [[0, 0.16], ['e-12f', 0.22], [1, 0.5, 'inQuad']],
        exposure: [[0, 1.0], ['e-12f', 1.0], ['e-4f', 1.15, 'inQuad'], [1, 9.0, 'inExpo']],
        zoomBlur: [[0, 0], ['e-12f', 0.0], [1, 0.45, 'inQuad']],
        vignette: [[0, 0.55], ['e-12f', 0.6], ['e-4f', 0.9], [1, 0.4]],
        saturation: 1.08,
      },
      // 9:16: no white-out. The glow and the tremolo climb to e-26f; then, in the last second, the camera tips down
      // into the ocean while the whole view is lensed inward into a disc at frame centre that collapses to a hot point
      // and goes out: the last 3 frames are black (the held breath before the ignition, which is dark).
      portrait: {
        fov: [[0, 50], ['e-26f', 47], [1, 42, 'inQuad']],
        alt: [[0, 0.076], ['e-26f', 0.066], [1, 0.03, 'inQuad']],
        pitch: [[0, -28], [0.45, -27.5], ['e-26f', -25.5], [1, -62, 'inOutSine']],
        roll: [[0, 5], ['e-26f', 11], [1, 26, 'inQuad']],
        surf: [[0, 1.7], ['e-26f', 2.2], [1, 2.6, 'inQuad']],
        heat: [[0, 0.12], ['e-26f', 0.38], [1, 0.6, 'inQuad']],
        oceanGain: [[0, 1.0], ['e-26f', 1.4], [1, 1.8, 'inQuad']],
        haze: [[0, 0.0008], [0.4, 0.0014], ['e-26f', 0.0045], [1, 0.008, 'inQuad']],
        white: 0,
        implode: [[0, 0], ['e-26f', 0], [1, 1, 'linear']],
        implodeShape: { r0: 4.2, pow: 1.6, end: 0.92, zoom: 1.2, swirl: 4.0, gain: 0.5, core: 10, streaks: 0.8, killA: 0.82, killB: 0.93 },
        post: {
          bloomStrength: [[0, 0.16], ['e-26f', 0.2], ['e-14f', 0.15], [1, 0.12]],
          exposure: 1.0,
          zoomBlur: [[0, 0], ['e-26f', 0], ['e-8f', 0.07, 'inQuad'], [1, 0.04]],
          vignette: [[0, 0.55], ['e-26f', 0.62], [1, 0.62]],
          saturation: 1.08,
        },
      },
    },
    // Aftermath: survival. Full 16:9. Ocean blown away (scorched, quieter surface); the shell recedes as a soft ring of
    // knots around the dwarf (rhymes with S29a); a new thread of matter enters from the left within the first second.
    'S28-survival': {
      rig: 'orbit', dist: [[0, 10.5], [1, 8.6, 'inOutSine']], az: [[0, 9], [1, 3]], el: [[0, 13], [1, 11]], fov: 34, screen: [[0, [0.16, 0.08]], [1, [0.15, 0.07]]], drift: 0.2,
      spin: [0.2, 0.05], magTilt: 24, magAz: 35, surf: 1.6, fil: [[0, 0.25], [1, 0.7]], filL: [1.3, 2.6], filW: 0.004, shimmer: 0.02,
      ocean: 0, scorch: 1.0,
      shell: [[0, 2.0], [1, 1.1]], shellR: [[0, 0.64], [1, 0.76]], shellBlur: [[0, 0.12], [1, 0.30]],
      thread: [[0, 0.30], ['1s', 0.42], [1, 0.66, 'inOutSine']], threadGain: 1.0,
      haze: 0.0, hazePx: 1.2, hazeF: 4.5, crimson: 0.35, atmo: 1.2, stars: 1.0,
      post: { bloomStrength: 0.14, exposure: 1.0, vignette: 0.5 },
      // 9:16: the survivor centred (ring centred like S29a's, radius ~0.44W-0.52W), disc ~0.36W growing to ~0.44W
      portrait: { fov: 50, screen: [[0, [0, 0.05]], [1, [0, 0.04]]], shellR: [[0, 0.25], [1, 0.29]] },
    },
    default: {
      rig: 'orbit', dist: 6, az: 0, el: 8, fov: 32, screen: [0.2, 0.05],
      surf: 1.6, fil: 1.2, filL: [1.25, 2.4], filW: 0.0045, ocean: 0, haze: 0.008, hazeF: 5, crimson: 0.4, atmo: 1, stars: 1,
    },
  },

  init(E) {
    this.prog0 = E.program(FS(0), 'whitedwarf');
    this.prog1 = E.program(FS(1), 'whitedwarf.body');
    this.prog2 = E.program(FS(2), 'whitedwarf.sharp');
    this.thread = new Float32Array(threadPts());
  },

  _p(S) {
    const P = resolveParams(S.params, S.dur, S.fps);   // timing-agnostic keyframes -> seconds (cheap)
    const t = clamp(S.local, 0, Math.max(S.dur - 1 / S.fps, 0));
    return { P, t };
  },

  render(E, S, target) {
    const { P, t } = this._p(S);
    const aspect = S.portrait && !S.framing ? S.W / S.H : 16 / 9;
    const cam = rig(P, t, aspect);
    // reference pixel: one pixel of the frame's long-axis-independent 1080 scale (1080p in landscape, 1080 wide in portrait)
    const refH = S.H / E.k;
    const spin = P.spin || [0, 0.05];
    // shot-relative clock: framing (magnetic geometry) and the look stay stable if the plan is re-timed
    const tl = clamp(S.local, -1, S.dur + 1) + (P.tOff || 0);
    const spinA = spin[0] + spin[1] * tl;
    const mf = magFrame(P, t, spinA);
    // filament planes: span and phase; filAt centres them on the camera's magnetic azimuth (+ offset deg)
    const span = kv(P.filSpan, t, 180) * D2R;
    let phase = kv(P.filPhase, t, 0) * D2R;
    if (P.filAt !== undefined) {
      const b = v3.cross(mf.ax, mf.ref);
      const c = v3.norm(cam.pos);
      phase = Math.atan2(v3.dot(c, b), v3.dot(c, mf.ref)) - span / 2 + P.filAt * D2R;
    }
    const conv = P.conv;
    const flashDir = v3.norm(P.flashDir || [0, 0, 1]);
    // point-source weight: fade the glow out as the disk resolves (apparent radius in 1080p pixels)
    const dist = v3.len(cam.pos);
    const rpx = (1 / dist) / (2 * cam.tanH / refH);
    const point = P.rig === 'surface' ? 0 : smoothstep(9, 1.6, rpx);
    const snapAt = P.snapAt;
    // heat haze: R units, plus an angular part given in 1080p pixels (constant on screen whatever the distance)
    const haze = kv(P.haze, t, 0) + kv(P.hazePx, t, 0) * (2 * cam.tanH / refH) * dist;
    const shellR = kv(P.shellR, t, 0.7) * 2 * cam.tanH;
    const imp = implosion(kv(P.implode, t, 0), P.implodeShape || {}, Math.min(S.W, S.H));
    const U = {
      uImp: imp.imp, uImpCore: imp.core,
      ...cam.uniforms, uTime: tl,
      uDwarfPos: [0, 0, 0], uDwarfR: 1, uDwarfLum: 0.9,
      uSurfGain: kv(P.surf, t, 6), uSpin: spinA, uMagAxis: mf.ax, uMagRef: mf.ref,
      uFil: kv(P.fil, t, 1), uFilL: kv(P.filL, t, [1.2, 2.4]), uFilW: kv(P.filW, t, 0.004),
      uFilN: kv(P.filN, t, 7), uFilPhase: phase, uFilK: kv(P.filK, t, 2), uFilSpan: span,
      uFilShimmer: kv(P.shimmer, t, 0.02), uTremolo: kv(P.tremolo, t, 0),
      uSnap: snapAt === undefined ? -1 : S.local - snapAt,
      uOcean: kv(P.ocean, t, 0), uOceanH: kv(P.oceanH, t, 0.02), uOceanHeat: kv(P.heat, t, 0), uOceanGain: kv(P.oceanGain, t, 1),
      uTurbF: kv(P.turbF, t, 40), uTurbV: kv(P.turbV, t, 1), uCells: kv(P.cells, t, 1),
      uWarp: kv(P.warp, t, 1), uBig: kv(P.big, t, 0), uDetail: kv(P.detail, t, 0),
      uConv: conv ? [...v3.norm(conv.dir), S.local - conv.at] : [0, 1, 0, -1], uConvAmp: conv ? conv.amp : 0,
      uFlare: kv(P.flare, t, 0), uFlareSize: kv(P.flareSize, t, 1),
      uFlash: [...flashDir, kv(P.flash, t, 0)], uFlashR: kv(P.flashR, t, 0.3), uPlume: kv(P.plume, t, 0),
      uColumns: kv(P.columns, t, 0), uColL: kv(P.colL, t, [3, 4.3]),
      uHaze: haze, uHazeF: kv(P.hazeF, t, 5),
      uGiantDir: [-1, 0, 0], uCrimson: kv(P.crimson, t, 0),
      uScorch: kv(P.scorch, t, 0), uShell: kv(P.shell, t, 0), uShellR: shellR, uShellBlur: kv(P.shellBlur, t, 0.08),
      uShellAxis: v3.norm(v3.mul(cam.pos, -1)),
      uThread: kv(P.thread, t, 0), uThreadPts: this.thread, uThreadGain: kv(P.threadGain, t, 1),
      uStarGain: kv(P.stars, t, 1), uAtmo: kv(P.atmo, t, 1), uPoint: point, uWhite: kv(P.white, t, 0), uDust: kv(P.dust, t, 0),
    };
    if (U.uOcean > 0) {
      const low = E.target('wdLow', LOW_SCALE);
      E.draw(this.prog1, U, low);
      E.draw(this.prog2, { ...U, uLow: low }, target);
    } else {
      E.draw(this.prog0, U, target);
    }
  },

  post(E, S) {
    const { P, t } = this._p(S);
    const out = {};
    for (const [k, v] of Object.entries(P.post || {})) out[k] = kv(v, t);
    return out;
  },
};
