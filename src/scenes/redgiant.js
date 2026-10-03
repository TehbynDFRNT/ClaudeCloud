// GOLIATH close-ups and reveals: the red giant against the abyss.
// Two passes: the soft extended atmosphere (base glow, molecular veils, plumes, prominence loops, aftermath
// streamers and soot) is integrated at reduced resolution; the photosphere, stars and compositing run at full
// resolution with a hit-aware upsample so the limb stays crisp.
// params: cam keys (see lib/util.js), spin [a0, rate], boil, bulge, bulgeDir, scar, scarDir, plumes, glow, starGain,
//         relief, limbDark, atmo, giantR, giantPos, volScale, post {...}
import { frag, STARS } from '../engine/glsl.js';
import { GIANT } from './lib/giant.glsl.js';
import { camFromKeys } from './lib/util.js';
import { hash1 } from '../engine/rng.js';

const VOL = frag(GIANT, `
void main(){
  vec3 rd = cameraRay(frameUV());
  vec3 o = uCamPos - uGiantPos;
  float rB = uGiantR * (1.0 + uBulge * 1.2);
  if (sphereHit(o, rd, vec3(0.0), rB * 2.1).y < 0.0){ fragColor = vec4(0.0, 0.0, 0.0, 1.001); return; }
  vec2 hs = sphereHit(o, rd, vec3(0.0), rB * 1.5);
  float t0 = max(hs.x, 0.0);
  float th = giantTrace(o, rd);           // same silhouette as the main pass (hit-aware upsample)
  bool hit = th > 0.0;
  vec4 v = giantVolume(o, rd, t0, hit ? th : max(hs.y, t0), uTime, hash12(gl_FragCoord.xy + fract(uFrame * 0.618) * 113.0), giantVolumeSteps(o, rd, hit), false);
  float a = v.a + 0.001;
  fragColor = vec4(v.rgb, hit ? -a : a);   // sign of alpha = hit class for the upsample
}`);

const MAIN = frag(STARS, GIANT, `
uniform float uStarGain;
uniform sampler2D uVol;
// hit-aware bilinear upsample of the reduced-resolution atmosphere
vec4 fetchVol(bool hit){
  vec2 vr = vec2(textureSize(uVol, 0));
  vec2 pv = gl_FragCoord.xy / uRes * vr - 0.5;
  vec2 fl = floor(pv); vec2 f = pv - fl;
  ivec2 i0 = ivec2(fl);
  vec4 acc = vec4(0.0); float ws = 0.0;
  for (int j = 0; j < 2; j++) for (int i = 0; i < 2; i++){
    ivec2 q = clamp(i0 + ivec2(i, j), ivec2(0), ivec2(vr) - 1);
    vec4 s = texelFetch(uVol, q, 0);
    float w = (i == 0 ? 1.0 - f.x : f.x) * (j == 0 ? 1.0 - f.y : f.y) + 1e-4;
    w *= ((s.a < 0.0) == hit) ? 1.0 : 0.003;
    acc += vec4(s.rgb, abs(s.a) - 0.001) * w; ws += w;
  }
  return acc / ws;
}
void main(){
  vec2 uv = frameUV();
  vec3 rd = cameraRay(uv);
  vec3 o = uCamPos - uGiantPos;
  // sparse, fine stars (sparser than the shared field: the giant owns the frame)
  float pa = 2.0 * uTanHalfFov / uRes.y;
  vec3 bg = (starLayer(rd, 70.0, 1.0, pa, 0.12) + starLayer(rd, 150.0, 2.0, pa, 0.035) * 0.7) * uStarGain;
  float rB = uGiantR * (1.0 + uBulge * 1.2);
  if (sphereHit(o, rd, vec3(0.0), rB * 2.1).y < 0.0){ fragColor = vec4(bg, 1.0); return; }
  float th = giantTrace(o, rd);
  bool hit = th > 0.0;
  vec4 v = fetchVol(hit);
  vec4 hz = giantHaze(o, rd, th);                 // dense limb haze at full resolution
  v.rgb += v.a * hz.rgb; v.a *= hz.a;
  vec3 g = v.rgb;
  if (hit) g += v.a * giantSurface(o, rd, th, uTime);
  vec3 col = g * uGiantGlow + (hit ? vec3(0.0) : bg * v.a);
  // prominence loops at full resolution (fine threads), over the atmosphere
  if (uPlumes > 0.0){
    mat3 spin = rotY(uGiantSpin);
    float lop;
    vec4 lp = gLoops(spin * o, spin * rd, spin, hit ? th : 1e9, uTime, lop);
    col = lp.rgb * (hit ? 0.35 : 1.0) * uGiantGlow + (1.0 - lop) * col;
  }
  fragColor = vec4(col, 1.0);
}`);

const D2R = Math.PI / 180;
// camera skimming the giant (R = 1 at origin): altitude above the north pole, looking along +Z, pitched down
function horizonCam(alt, pitchDeg, yawDeg = 0, x = 0) {
  const p = [x, 1 + alt, 0];
  const pt = pitchDeg * D2R, yw = yawDeg * D2R;
  const d = [Math.sin(yw) * Math.cos(pt), -Math.sin(pt), Math.cos(yw) * Math.cos(pt)];
  return [p, [p[0] + d[0], p[1] + d[1], p[2] + d[2]]];
}
// orbit camera that puts the giant centre at frame position (sx, sy) in [-1,1] (frameUV, y up).
// returns [pos, target]; azimuth 0 = camera on -Z (screen right = -X).
function aimCam(dist, azDeg, elDeg, sx, sy, fov, center = [0, 0, 0]) {
  const az = azDeg * D2R, el = elDeg * D2R;
  const p = [center[0] + Math.sin(az) * Math.cos(el) * dist, center[1] + Math.sin(el) * dist, center[2] - Math.cos(az) * Math.cos(el) * dist];
  const nrm = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const tanH = Math.tan((fov * D2R) / 2), X = sx * tanH * (16 / 9), Y = sy * tanH;
  const g = nrm([center[0] - p[0], center[1] - p[1], center[2] - p[2]]);
  let f = g;
  for (let i = 0; i < 4; i++) {                       // solve for the forward vector that maps g to (X, Y)
    const r = nrm(cross(f, [0, 1, 0])), u = cross(r, f);
    const want = nrm([r[0] * X + u[0] * Y + f[0], r[1] * X + u[1] * Y + f[1], r[2] * X + u[2] * Y + f[2]]);
    f = nrm([f[0] + g[0] - want[0], f[1] + g[1] - want[1], f[2] + g[2] - want[2]]);
  }
  return [p, [p[0] + f[0], p[1] + f[1], p[2] + f[2]]];
}

// optional hero prominence loops (object space) -> uniform arrays (zero = unused)
function heroUniforms(list = [], plumes = []) {
  const C = new Array(6).fill(0), A = new Array(6).fill(0), Pm = new Array(8).fill(0);
  list.slice(0, 2).forEach((h, i) => {
    C.splice(i * 3, 3, ...h.c); A.splice(i * 3, 3, ...h.a);
    Pm.splice(i * 4, 4, h.span, h.height, h.width, h.phase ?? 0);
  });
  const PC = new Array(12).fill(0), PL = new Array(12).fill(0), PP = new Array(16).fill(0);
  plumes.slice(0, 4).forEach((h, i) => {
    PC.splice(i * 3, 3, ...h.c); PL.splice(i * 3, 3, ...h.l);
    PP.splice(i * 4, 4, h.height, h.width, h.lean ?? 0.6, h.phase ?? 0);
  });
  return { uHeroC: C, uHeroA: A, uHeroP: Pm, uHeroPlC: PC, uHeroPlL: PL, uHeroPlP: PP };
}

export default {
  id: 'redgiant',
  scale: 1,
  presets: {
    'S01-abyss': {
      cam: [
        [0, ...horizonCam(0.033, -7, 0), 55],
        [1, ...horizonCam(0.038, 2.5, 3), 55, 0, 'inOutSine'],
      ],
      heroes: [
        { c: [-0.24, 0.86, 0.48], a: [1, 0, 0.15], span: 0.085, height: 0.11, width: 0.010, phase: 0.3 },
        { c: [0.30, 0.82, 0.52], a: [0.8, 0, -0.6], span: 0.06, height: 0.07, width: 0.008, phase: 0.7 },
      ],
      heroPlumes: [
        { c: [0.22, 0.88, 0.42], l: [1, 0, 0], height: 0.09, width: 0.014, lean: 1.6, phase: 0.2 },
        { c: [0.05, 0.84, 0.54], l: [-1, 0, 0.3], height: 0.13, width: 0.018, lean: 0.9, phase: 0.6 },
        { c: [0.42, 0.78, 0.47], l: [0.6, 0.2, -0.8], height: 0.10, width: 0.016, lean: 2.0, phase: 0.85 },
        { c: [-0.08, 0.80, 0.60], l: [1, 0, 0], height: 0.07, width: 0.012, lean: 0.4, phase: 0.45 },
      ],
      heroOnly: 1,
      spin: [0.0, 0.006], boil: 1.0, plumes: 1.0, relief: 0.008, limbDark: 0.28, atmo: -0.5, glow: 1.05, starGain: 0.5,
    },
    'S02-goliath': {
      cam: [
        [0, ...aimCam(2.35, -22, 4, -0.02, 0.06, 40), 40],
        [0.42, ...aimCam(3.4, -12, 7, -0.22, 0.07, 40), 40, 0, 'outCubic'],
        [1, ...aimCam(3.9, -6, 9, -0.26, 0.07, 40), 40, 0, 'inOutSine'],
      ],
      heroes: [
        { c: [-0.97, 0.12, -0.2], a: [0, 1, 0.1], span: 0.22, height: 0.22, width: 0.012, phase: 1.15 },
      ],
      heroPlumes: [
        { c: [-0.80, 0.55, -0.2], l: [-0.5, 0.8, 0], height: 0.12, width: 0.03, lean: 1.2, phase: 0.4 },
        { c: [-0.85, -0.45, -0.25], l: [0.3, -1, 0], height: 0.09, width: 0.025, lean: 0.8, phase: 0.75 },
      ],
      spin: [2.6, 0.012], boil: 1.3, plumes: 0.9, relief: 0.004, limbDark: 0.62, glow: 1.3, starGain: 0.6,
    },
    'F28.2': {
      cam: [
        [0, ...horizonCam(0.30, 24, -6, 0.02), 50, -0.05],
        [1, ...horizonCam(0.25, 27, -2, -0.02), 46, 0.03, 'outQuad'],
      ],
      heroPlumes: [
        { c: [0.02, 0.70, 0.72], l: [0.4, 0.3, -0.6], height: 0.12, width: 0.045, lean: 0.8, phase: 0.3 },
        { c: [-0.18, 0.72, 0.66], l: [-1, 0.2, 0], height: 0.10, width: 0.03, lean: 1.6, phase: 0.7 },
        { c: [0.22, 0.70, 0.68], l: [1, 0.1, -0.2], height: 0.08, width: 0.025, lean: 1.2, phase: 0.1 },
      ],
      heroes: [
        { c: [0.05, 0.70, 0.71], a: [1, 0, -0.1], span: 0.11, height: 0.16, width: 0.012, phase: 2.6 },
      ],
      heroOnly: 1, scarDir: [0.02, 0.74, 0.67], embers: { count: 900, gain: 5.0, size: 2.0, speed: 2.5, streak: 0.06 },
      spin: [1.3, 0.02], boil: 4.0, plumes: 2.0, relief: 0.01, limbDark: 0.35, glow: 1.5, atmo: -0.3, starGain: 0.4,
      post: { bloomStrength: 0.11 },
    },
    'S27-devastation': {
      cam: [
        [0, ...aimCam(2.75, 158, 7, -0.30, 0.02, 45), 45],
        [1, ...aimCam(2.65, 168, 9, -0.20, 0.03, 45), 45, 0, 'linear'],
      ],
      spin: [2.0, 0.006], boil: 1.2, plumes: 0.7, scar: 1.0, scarDir: [1, 0, 0], relief: 0.0035, limbDark: 0.55, starGain: 0.6,
      embers: { count: 2200, gain: 4.0, size: 2.2 }, volScale: 0.4,
      heroPlumes: [
        { c: [0.98, 0.22, -0.02], l: [0.2, 1, 0.1], height: 0.16, width: 0.045, lean: 1.4, phase: 0.1 },
        { c: [0.95, -0.30, 0.05], l: [0.1, -1, 0.2], height: 0.13, width: 0.04, lean: 1.2, phase: 0.55 },
        { c: [0.85, 0.55, 0.10], l: [-0.2, 1, 0], height: 0.11, width: 0.035, lean: 1.8, phase: 0.8 },
        { c: [0.99, -0.02, 0.12], l: [0.3, 0.2, -1], height: 0.20, width: 0.05, lean: 0.8, phase: 0.33 },
      ],
    },
    default: { cam: [[0, [0, 0, -3.2], [0, 0, 0], 40]] },   // cam key times are fractions of the shot (camAbs: seconds)
  },
  init(E) {
    this.vol = E.program(VOL, 'redgiant.vol');
    this.prog = E.program(MAIN, 'redgiant');
  },
  uniforms(E, S) {
    const P = S.params;
    const local = Math.max(0, Math.min(S.dur, S.local));
    // camera keys are in shot-normalised time (0..1) so presets survive timeline rebuilds
    const keys = (P.cam || [[0, [0, 0, -3.2], [0, 0, 0], 40]]).map((k) => [k[0] * (P.camAbs ? 1 : S.dur), ...k.slice(1)]);
    const cam = camFromKeys(keys, local);
    const spin = P.spin || [0, 0.004];
    return {
      cam,
      u: {
        ...cam.uniforms,
        uGiantPos: P.giantPos || [0, 0, 0], uGiantR: P.giantR ?? 1, uGiantSpin: spin[0] + spin[1] * S.t,
        uBoil: P.boil ?? 1, uBulge: P.bulge ?? 0, uBulgeDir: P.bulgeDir || [1, 0, 0],
        uScar: P.scar ?? 0, uScarDir: P.scarDir || [1, 0, 0], uGiantGlow: P.glow ?? 1, uPlumes: P.plumes ?? 0.6,
        uRelief: P.relief ?? 0, uLimbDark: P.limbDark ?? 0.62, uGiantAtmo: P.atmo ?? 0, uGiantHeroOnly: P.heroOnly ?? 0,
        uStarGain: P.starGain ?? 1,
        ...heroUniforms(P.heroes, P.heroPlumes),
      },
    };
  },
  render(E, S, target) {
    const { u } = this.uniforms(E, S);
    const vs = S.params.volScale ?? 0.5;
    const vt = E.target('redgiant.vol', (target.w / E.W) * vs);
    E.draw(this.vol, u, vt);
    E.draw(this.prog, { ...u, uVol: vt }, target);
  },
  // Embers: deterministic particles shed by the scarred hemisphere (pure function of shot time).
  // Drawn additively in output pixels; post overlayGain lifts them into HDR so they bloom.
  overlay(E, S, ctx) {
    const P = S.params;
    const em = P.embers;
    if (!em) return null;
    const { cam } = this.uniforms(E, S);
    const W = E.W, H = E.H;
    const R = P.giantR ?? 1, C = P.giantPos || [0, 0, 0];
    const sd = P.scarDir || [1, 0, 0];
    const t = S.local + 20;                       // pre-roll so the field is already full at the cut
    const N = em.count ?? 900;
    const cp = cam.pos;
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const nrm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
    // ray-sphere occlusion: is the giant between the camera and p?
    const occluded = (p) => {
      const d = sub(p, cp), L = Math.hypot(d[0], d[1], d[2]);
      const rd = [d[0] / L, d[1] / L, d[2] / L], oc = sub(cp, C);
      const b = dot(oc, rd), c = dot(oc, oc) - R * R * 0.995, hh = b * b - c;
      if (hh < 0) return false;
      const t0 = -b - Math.sqrt(hh);
      return t0 > 0 && t0 < L;
    };
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    const pos = (i, age, dir, spd, sweep, ph) => {
      const r = R * (1.004 + spd * age);
      const tw = age * 0.9 + ph;
      return [
        C[0] + dir[0] * r - sd[0] * sweep * age * age + Math.sin(tw * 1.7) * 0.012 * age,
        C[1] + dir[1] * r - sd[1] * sweep * age * age + Math.sin(tw * 1.3 + 2.0) * 0.012 * age,
        C[2] + dir[2] * r - sd[2] * sweep * age * age + Math.cos(tw * 1.1 + 1.0) * 0.012 * age,
      ];
    };
    for (let i = 0; i < N; i++) {
      const h = (k) => hash1(i, 9100 + k);
      // birth direction: on the hemisphere facing the nova, densest near the burning front
      let dir = nrm([sd[0] + (h(1) * 2 - 1) * 1.6, sd[1] + (h(2) * 2 - 1) * 1.6, sd[2] + (h(3) * 2 - 1) * 1.6]);
      if (dot(dir, sd) < 0.0) continue;
      const life = 2.5 + 4.5 * h(4);
      const period = life * (1.2 + h(5));
      const age = (t + h(6) * period) % period;
      if (age > life) continue;
      const spd = (0.02 + 0.07 * h(7) * h(7)) * (em.speed ?? 1);
      const sweep = 0.004 + 0.01 * h(8);
      const p1 = pos(i, age, dir, spd, sweep, h(9) * 6.28);
      const p0 = pos(i, Math.max(0, age - (em.streak ?? 0.12)), dir, spd, sweep, h(9) * 6.28);
      if (occluded(p1)) continue;
      const a = cam.project(p1, W, H), b = cam.project(p0, W, H);
      if (!a || !b) continue;
      if (a.x < -20 || a.x > W + 20 || a.y < -20 || a.y > H + 20) continue;
      const u = age / life;
      const heat = Math.pow(1 - u, 1.4) * (0.35 + 0.65 * h(10)) * Math.min(1, age * 3);
      const flick = 0.75 + 0.25 * Math.sin(t * (9 + 7 * h(11)) + i);
      const I = heat * flick;
      if (I < 0.02) continue;
      const size = Math.min(5.0, Math.max(1.0, ((em.size ?? 2.0) * 2.6 / a.z) * (0.5 + h(12) * h(12) * 2.0))) * (H / 1080);
      // colour cools from molten gold to crimson
      const g = Math.round(40 + 150 * Math.pow(1 - u, 2)), bl = Math.round(10 + 50 * Math.pow(1 - u, 3));
      ctx.strokeStyle = `rgba(255,${g},${bl},${Math.min(1, I).toFixed(3)})`;
      ctx.lineWidth = size;
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(a.x, a.y); ctx.stroke();
      ctx.fillStyle = `rgba(255,${g},${bl},${(Math.min(1, I) * 0.10).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(a.x, a.y, size * 2.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    return 'add';
  },
  post(E, S) {
    const P = S.params;
    const out = { ...(P.post || {}) };
    if (P.embers) out.overlayGain = P.embers.gain ?? 3.0;
    return out;
  },
};
