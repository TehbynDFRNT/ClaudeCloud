// The coda (S31-newstar): the Milky Way from a dark-sky Earth, and a new star.
// The galactic core rises near-vertically from a dark Southern-Hemisphere horizon: the bulge, the Great Rift
// and the dust lanes, faint pink emission knots, a realistic star field, airglow and extinction near the
// horizon, a dark ridge with a few sparse eucalypts. Then, silently, a new star swells into being in a dark
// patch of the band: the cataclysm we watched up close is, from here, one more point of light.
//
// Locked-off camera with a very slow push (<= 2%) anchored on the new star. Stars are hashed in screen-space
// cells of a reference 1080x1920 frame, so the field is identical at any render size and stable frame to frame.
// Timings are in shot-local seconds (params), so a trimmed shot keeps its beats when the lead re-times it.
import { frag } from '../engine/glsl.js';
import { EARTHSKY_GLSL } from './lib/earthsky-glsl.js';
import { buildSky, buildTrees } from './lib/earthsky-sky.js';

const FS_A = frag('#define PASS_A 1', EARTHSKY_GLSL);   // cached half-res plate: diffuse sky + dust depth
const FS_C = frag('#define PASS_C 1', EARTHSKY_GLSL);   // cached half-res plate: extinction + star density
const FS_B = frag(EARTHSKY_GLSL);                       // full-res stars, silhouette, atmosphere, new star

const DEFAULT = {
  fov: 80,                 // vertical field of view, degrees (9:16 frame: ~51 deg wide)
  horizonY: 0.755,         // mathematical horizon, fraction of frame height from the top
  coreAlt: 13,             // galactic centre altitude, degrees
  coreX: 0.47,             // galactic centre frame x (fraction)
  tilt: 8,                 // band lean from vertical, degrees (leans right going up)
  nova: [0.588, 0.318],    // new star, frame fractions (x, y from top)
  anchor: null,            // push anchor (defaults to the new star)
  push: 0.02,              // zoom gain over the shot
  novaOn: 5.5 - 1 / 24,    // s local: last dark frame (3781); the first visible frame is 3782, the 'coda-star' cue
  novaFull: 7.0,           // s local: full brightness (3818)
  novaMag: -1.2,
  flickerAt: 0.62,         // fraction of the swell where the one tiny flicker falls
  expo: 1.0, starGain: 1.0, mwGain: 0.72,
  trees: [
    // a woodland gum: short trunk, three unequal leaders, an open, uneven crown of clumped foliage
    { x: -318, h: 212, bole: 0.30, trunk: 4.6, lean: -0.05, spread: 1.45, leaders: 3, branchy: 0.9, gaps: 0.15, leaf: 1.4, seed: 11 },
    { x: -236, h: 72, bole: 0.32, trunk: 2.1, lean: 0.10, spread: 1.0, leaders: 2, branchy: 0.6, leaf: 1.5, seed: 23 },   // a young gum
    { x: 404, h: 160, bole: 0.36, trunk: 5.0, lean: 0.09, spread: 1.0, leaf: 0, gnarl: 0.6, seed: 101 },   // a dead gum: uneven arms, broken stubs
  ],
};

export default {
  id: 'earthsky',
  presets: { default: {}, 'S31-newstar': {} },
  init(E) {
    this.progA = E.program(FS_A, 'earthsky.sky');
    this.progC = E.program(FS_C, 'earthsky.atm');
    this.prog = E.program(FS_B, 'earthsky');
    this.cache = new Map();
  },
  rig(E, P) {
    const key = JSON.stringify([E.W, E.H, P.fov, P.horizonY, P.coreAlt, P.coreX, P.tilt, P.nova, P.anchor, P.trees]);
    let R = this.cache.get(key);
    if (R) return R;
    const aspect = E.W / E.H;
    const sky = buildSky({ ...P, anchor: P.anchor || P.nova }, aspect);
    // trees stand on the ridge: find the ridge height under each (approximation of the shader's ridgeY base)
    // (keep in sync with ridgeY in earthsky-glsl.js)
    const ridgeBase = (x) => 14 + 10 * Math.sin(x * 0.0042 + 0.6) + 7 * Math.sin(x * 0.0091 + 2.1) + 4 * Math.sin(x * 0.019 + 1.3)
      + 26 * Math.exp(-(((x + 330) / 170) ** 2)) + 16 * Math.exp(-(((x - 380) / 220) ** 2)) - 16 * Math.exp(-(((x + 20) / 160) ** 2));
    const horizonS = (1 - 2 * P.horizonY) * 960;
    const trees = buildTrees(P.trees.map((t) => ({ ...t, y: horizonS + ridgeBase(t.x) })));
    if (trees.segs.length > 96 || trees.clumps.length > 80) console.warn(`earthsky: tree geometry over the shader caps (${trees.segs.length} limbs, ${trees.clumps.length} clumps)`);
    const flat = (arr, n) => { const out = new Float32Array(n * 4); arr.slice(0, n).forEach((a, i) => out.set(a, i * 4)); return out; };
    const bright = new Float32Array(16 * 4);
    sky.bright.slice(0, 16).forEach((b, i) => bright.set([b.s[0], b.s[1], b.mag, b.T], i * 4));
    R = {
      sky, key,
      uniforms: {
        uCR: sky.cam.r, uCU: sky.cam.u, uCF: sky.cam.f, uTan: sky.tanH, uPitch: sky.pitch,
        uAnchor: sky.anchorS, uGC: sky.G.c, uGT: sky.G.t, uGN: sky.G.n,
        uBright: bright, uNBright: Math.min(16, sky.bright.length),
        uNovaS: sky.novaS, uNovaLB: sky.novaGal, uHorizonS: horizonS,
        uSegs: flat(trees.segs, 96), uRads: flat(trees.rads, 96), uNSegs: Math.min(96, trees.segs.length),
        uClumps: flat(trees.clumps, 80), uNClumps: Math.min(80, trees.clumps.length),
        uBoxes: flat(trees.boxes, 4), uNBoxes: Math.min(4, trees.boxes.length),
      },
    };
    this.cache.set(key, R);
    return R;
  },
  // new star flux at shot-local time t (s-space integrated radiance)
  novaFlux(P, t) {
    if (t < P.novaOn) return 0;
    const full = 60 * Math.pow(10, -0.4 * (P.novaMag - 1));
    const u = Math.min(1, (t - P.novaOn) / (P.novaFull - P.novaOn));
    const e = 1 - Math.pow(1 - u, 3);                      // ease-out swell
    let f = full * Math.pow(e, 2.2);
    // one tiny flicker on the way up
    const tf = P.novaOn + P.flickerAt * (P.novaFull - P.novaOn);
    f *= 1 - 0.2 * Math.exp(-(((t - tf) / 0.055) ** 2));
    // gentle scintillation once it is there (smooth, deterministic)
    f *= 1 + Math.min(1, u * 1.5) * (0.022 * Math.sin(t * 7.3 + 1.1) + 0.014 * Math.sin(t * 15.1 + 0.4));
    return f;
  },
  render(E, S, target) {
    const P = { ...DEFAULT, ...S.params };
    const R = this.rig(E, P);
    const ease = E.math.ease.inOutSine(Math.min(1, Math.max(0, S.u)));
    const U = {
      ...R.uniforms,
      uZoom: 1 + P.push * ease,
      uNova: this.novaFlux(P, S.local),
      uExpo: P.expo, uStarGain: P.starGain, uMWGain: P.mwGain,
    };
    // the static sky plate (diffuse Milky Way + dust depth) is rendered once per size/params and cached
    const pw = Math.max(2, Math.round(target.w / 2)), ph = Math.max(2, Math.round(target.h / 2));
    const plateKey = [pw, ph, R.key, P.mwGain].join('|');
    let A = E.G.targets.get('earthskyPlate'), C = E.G.targets.get('earthskyPlateC');
    if (!A || !C || this.plateKey !== plateKey || A.w !== pw || A.h !== ph) {
      A = E.G.target('earthskyPlate', pw, ph);
      C = E.G.target('earthskyPlateC', pw, ph);
      E.draw(this.progA, { ...U, uZoom: 1 }, A, { scissor: [0, 0, A.w, A.h] });
      E.draw(this.progC, { ...U, uZoom: 1 }, C, { scissor: [0, 0, C.w, C.h] });
      this.plateKey = plateKey;
    }
    E.draw(this.prog, { ...U, uSkyA: A, uSkyC: C }, target, { scissor: [0, 0, target.w, target.h] });
  },
};
