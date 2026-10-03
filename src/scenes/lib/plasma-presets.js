// Per-shot parameters for the plasma scene (keyed by exact shot id).
// cam keys: [localSeconds, pos, target, fovDeg, roll?, easing?]  (see lib/util.js)

const S14B = {
  timeU: true,
  kind: 'boil',
  rmScale: 0.9,
  cam: [
    [0.0, [0.0, 2.4, -1.3], [0.25, -0.2, 0.35], 38, 0.0],
    [1, [0.1, 2.15, -1.0], [0.33, -0.22, 0.5], 37, 0.04, 'linear'],
  ],
  vibrate: 0.004,
  boil: {
    cell: 2.8, evo: [3.2, 0.55], drift: [0, 0, 0.0, 0.0], warp: 1.0, relief: 0.06,
    heat: 0.0, heatGain: 1.0, gain: 1.0,
    plume: 3.0, plumeH: 0.1, rise: 0.35, absorb: 5.0,
    tmax: 12, fog: 0.07, haze: [0.025, 0.0018, 0.0008], detail: 1.35, flowSpin: 0.0,
    soft: 0.012, sigma: 80, skin: 0.08, flowRate: 1.6,
  },
  dof: { focus: 3.0, aperture: 22, max: 24 },
  post: { bloomStrength: 0.05, halation: 0.04, vignette: 0.6, saturation: 1.1 },
};

const S14G = {
  timeU: true,
  kind: 'filaments',
  rmScale: 0.75,
  cam: [
    [0.0, [-1.2, 0.55, -4.2], [-0.05, 0.02, 0.0], 33, -0.05],
    [1, [-0.6, 0.4, -3.6], [0.02, 0.0, 0.0], 32, 0.02, 'inOutSine'],
  ],
  vibrate: 0.003,
  core: { pos: [0.35, 0, 0], r: 0.3, heat: 0.9, glow: 0.45, evo: [2, 0.8], spin: [0, 0.6], axis: [0.96, 0.25, 0.1], haze: [0.0006, 0.003, 0.012], hazeR: 0.9 },
  fil: {
    n: 38, heroes: 3, outer: 4, outerMul: 2.8, len: 6, R0: 0.95, wrap: [1.9, 1.15], twist: [0.5, 2.0], twistLin: 0.55, twistCore: 0.9, pinch: [1.0, 0.42], spin: 1.8, braid: 0.25, coreW: 1.3, width: 1.5, gain: 1.0,
    events: [{ t: 0.33, i: 1, s: 0.9, type: 'snap' }, { t: 0.68, i: 2, j: 12, s: -0.7, type: 'reconnect' }],
  },
  dof: { focus: 4.0, aperture: 40, max: 30 },
  lines: { gain: 1, absorb: 2.5 },
  flashes: [[0.33, 0.02, 0.05], [0.68, 0.015, 0.06]],
  flashCol: [0.4, 0.65, 1.0],
  post: { bloomStrength: 0.07, halation: 0.02, vignette: 0.6, streakStrength: 0.04 },
};

// sparks shower over a glowing molten plasma floor (low camera, gravity arcs, rising to the right)
const F293 = {
  timeU: true,
  kind: 'sparks',
  rmScale: 0.6,
  cam: [
    [0.0, [-0.3, 0.32, -2.3], [0.3, 0.42, 1.5], 40, 0.03],
    [1, [-0.15, 0.36, -2.0], [0.4, 0.46, 1.5], 39, 0.05, 'linear'],
  ],
  vibrate: 0.006,
  boil: {
    cell: 2.2, evo: [7.0, 0.9], warp: 1.0, relief: 0.05, heat: -0.05, heatGain: 1.0, gain: 0.7,
    vents: [[-0.9, 0, 1.6, 0.7], [0.1, 0, 2.4, 0.7], [-0.2, 0, 0.9, 0.7], [0.9, 0, 3.2, 0.7]],
    plume: 0, tmax: 14, fog: 0.08, haze: [0.02, 0.0015, 0.0008], detail: 1.0, soft: 0.015, sigma: 70, skin: 0.08, flowRate: 1.6,
  },
  sparks: {
    n: 1500, window: [-1.6, 0.96], life: [0.5, 1.5], shutter: 0.06, width: 1.6, gain: 1.0, hot: 1.0,
    emit: { points: [[-0.9, 0.02, 1.6], [0.1, 0.02, 2.4], [-0.2, 0.02, 0.9], [0.9, 0.02, 3.2], [0.35, 0.02, -1.1]], spread: [0.18, 0.02, 0.18], dir: [0.45, 1, -0.25], cone: 0.42, speed: [2.5, 7.5] },
    gravity: [0, -5.5, 0], drag: 0.9,
  },
  dof: { focus: 2.6, aperture: 26, max: 30 },
  lines: { gain: 1, absorb: 0 },
  post: { bloomStrength: 0.08, halation: 0.05, vignette: 0.6, saturation: 1.1 },
};

// dense radial burst of white-gold sparks rushing at the lens over blown-out plasma
const F316 = {
  timeU: true,
  kind: 'sparks',
  rmScale: 0.5,
  cam: [
    [0.0, [0, 0, -1.0], [0.05, 0.02, 3], 44, 0.0],
    [1, [0, 0, -0.75], [0.05, 0.02, 3], 44, -0.06, 'linear'],
  ],
  vibrate: 0.012,
  volume: { cell: 3.5, evo: [9, 2.5], warp: 1.0, rise: 1.5, riseDir: [0, 0, -1], tmax: 5, near: 1.2, sigma: 5, emis: 5, gain: 0.22, heat: 0.0, detail: 1, haze: [0.02, 0.006, 0.002] },
  sparks: {
    n: 2600, window: [-0.45, 0.46], life: [0.3, 0.8], shutter: 0.045, width: 1.8, gain: 1.0, hot: 1.0,
    emit: { pos: [0.05, 0.0, 3.2], spread: [0.25, 0.25, 0.25], dir: [0, 0, -1], cone: 1.1, speed: [4, 13] },
    gravity: [0, -1.0, 0], drag: 0.6,
  },
  dof: { focus: 2.5, aperture: 30, max: 34 },
  lines: { gain: 1, absorb: 0 },
  post: { bloomStrength: 0.09, halation: 0.05, vignette: 0.5, zoomBlur: 0.02 },
};

// crimson boil at a vast scale: a grazing view across a sea of small cells to a hazy horizon, tracking left
const F272 = {
  timeU: true,
  kind: 'boil',
  rmScale: 0.6,
  cam: [
    [0.0, [0.6, 0.6, -2.0], [0.2, -0.32, 2.5], 36, -0.04],
    [1, [-0.15, 0.55, -1.9], [-0.55, -0.34, 2.6], 36, -0.06, 'linear'],
  ],
  vibrate: 0.004,
  boil: {
    cell: 4.2, evo: [11.0, 0.9], drift: [0, 0, 0.0, 0.0], warp: 1.1, relief: 0.03,
    heat: -0.12, heatGain: 1.0, gain: 1.4,
    plume: 7.0, plumeH: 0.06, rise: 0.5, absorb: 3.0,
    tmax: 16, fog: 0.1, haze: [0.09, 0.0045, 0.0018], detail: 1.0, flowSpin: 0.0,
    soft: 0.012, sigma: 70, skin: 0.08, flowRate: 1.6,
  },
  dof: { focus: 3.2, aperture: 16, max: 24 },
  post: { bloomStrength: 0.07, halation: 0.05, vignette: 0.6, saturation: 1.15, blur: [10, 0] },
};

// gold boil, hotter and faster: close over big cells, the camera corkscrews down into them
const F302 = {
  timeU: true,
  kind: 'boil',
  rmScale: 0.75,
  cam: [
    [0.0, [0.0, 1.9, -0.6], [0.1, 0.0, 0.25], 40, 0.0],
    [1, [0.05, 1.35, -0.35], [0.12, 0.0, 0.3], 40, 0.35, 'inQuad'],
  ],
  vibrate: 0.008,
  boil: {
    cell: 2.0, evo: [17.0, 2.4], drift: [0, 0, 0.3, -0.5], warp: 1.2, relief: 0.05,
    heat: 0.06, heatGain: 1.0, gain: 1.0,
    plume: 0, tmax: 8, fog: 0.05, haze: [0.03, 0.006, 0.001], detail: 1.2, flowSpin: 1.5,
    soft: 0.012, sigma: 70, skin: 0.06, flowRate: 1.4,
  },
  dof: { track: 1.0, aperture: 18, max: 22 },
  post: { bloomStrength: 0.05, halation: 0.04, vignette: 0.55, saturation: 1.05, zoomBlur: 0.012 },
};

// white-hot plasma: rushing straight down into tiny compressed cells; everything clips but the lanes
const F312 = {
  timeU: true,
  kind: 'boil',
  rmScale: 0.75,
  cam: [
    [0.0, [0.0, 1.6, -0.02], [0.0, 0.0, 0.0], 44, 0.2],
    [1, [0.0, 0.9, -0.01], [0.0, 0.0, 0.0], 44, -0.25, 'linear'],
  ],
  vibrate: 0.01,
  boil: {
    cell: 4.5, evo: [23.0, 5.0], drift: [0, 0, 0.0, 0.0], warp: 1.2, relief: 0.03,
    heat: 0.26, heatGain: 0.95, gain: 1.0,
    plume: 0, tmax: 6, fog: 0.0, haze: [0.1, 0.06, 0.03], detail: 1.3, flowSpin: 2.0,
    soft: 0.01, sigma: 80, skin: 0.05, flowRate: 1.2,
  },
  dof: { track: 1.0, aperture: 10, max: 16 },
  post: { bloomStrength: 0.06, halation: 0.05, vignette: 0.45, zoomBlur: 0.035 },
};

// blue filaments end-on: flying down the axis of a twisting flux rope toward a hot core at the vanishing point
const F283 = {
  timeU: true,
  kind: 'filaments',
  rmScale: 0.75,
  cam: [
    [0.0, [0.25, 0.15, -2.6], [0.0, 0.0, 8.0], 52, 0.0],
    [1, [0.12, 0.05, -1.3], [0.0, 0.0, 8.0], 52, -0.3, 'linear'],
  ],
  vibrate: 0.004,
  core: { pos: [0, 0, 7.0], r: 0.32, heat: 0.95, glow: 1.0, evo: [5, 1.2], spin: [0, 1.0], axis: [0, 0, 1], haze: [0.0004, 0.002, 0.009], hazeR: 0.9 },
  fil: {
    n: 56, heroes: 6, len: 9.5, R0: 2.4, wrap: [1.3, 1.1], twist: [0.22, 0.42], twistLin: 1.0, twistCore: 0.5, pinch: [1.0, 0.72], spin: 3.6, braid: 0.15, coreW: 2.2,
    width: 1.6, gain: 1.2, bBase: 0.75, bCore: 0.6, endFade: 0.92, chunk: 1, samples: 150,
    events: [],
  },
  dof: { focus: 3.0, aperture: 34, max: 34 },
  lines: { gain: 1, absorb: 1.5 },
  post: { bloomStrength: 0.07, halation: 0.02, vignette: 0.65, streakStrength: 0.04, zoomBlur: 0.015 },
};

// filaments snapping: a tight macro on taut lines under tension that break one after another
const F315 = {
  timeU: true,
  kind: 'filaments',
  rmScale: 0.75,
  cam: [
    [0.0, [-0.2, 0.25, -2.3], [0.15, 0.0, 0.0], 30, 0.12],
    [1, [-0.12, 0.2, -2.05], [0.15, 0.0, 0.0], 30, 0.16, 'linear'],
  ],
  vibrate: 0.01,
  core: { pos: [0.35, -0.05, 1.2], r: 0.16, heat: 0.98, glow: 1.2, evo: [9, 2.0], spin: [0, 2.0], axis: [0.92, 0.38, 0.1], haze: [0.0003, 0.0015, 0.006], hazeR: 0.5 },
  fil: {
    axis: [0.92, 0.38, 0.1], n: 14, heroes: 6, len: 3.5, R0: 0.42, wrap: [1.6, 1.4], twist: [0.25, 0.32], twistLin: 0.3, twistCore: 0.4, pinch: [0.9, 0.8], spin: 0.4, braid: 0.06, coreW: 0.8,
    width: 2.6, gain: 1.6, tension: 0.012, occlude: false,
    events: [
      { t: 0.04, i: 0, s: 0.25, type: 'snap', recoil: 0.35, gap: 0.3, sparks: 40 },
      { t: 0.28, i: 2, s: -0.55, type: 'snap', recoil: 0.35, gap: 0.3, sparks: 40 },
      { t: 0.52, i: 4, s: 0.75, type: 'snap', recoil: 0.35, gap: 0.3, sparks: 40 },
      { t: 0.74, i: 1, s: -0.15, type: 'snap', recoil: 0.35, gap: 0.3, sparks: 40 },
    ],
  },
  dof: { focus: 2.4, aperture: 30, max: 30 },
  lines: { gain: 1, absorb: 0.5 },
  flashes: [[0.04, 0.025, 0.035], [0.28, 0.025, 0.035], [0.52, 0.03, 0.035], [0.74, 0.035, 0.035]],
  flashCol: [0.5, 0.75, 1.0],
  post: { bloomStrength: 0.09, halation: 0.02, vignette: 0.55, streakStrength: 0.06 },
};

export const PRESETS = {
  'F27.2': F272,
  'F28.3': F283,
  'F30.2': F302,
  'F31.2': F312,
  'F31.5': F315,
  'F29.3': F293,
  'F31.6': F316,
  'S14b-boil': S14B,
  'S14g-filaments': S14G,
  default: S14B,
};
