// Parchment for the Renaissance studies: a tileable fibre texture generated once (deterministic) and the
// GLSL that turns it into lit, aged rag paper with iron-gall ink / red chalk multiplied in from the overlay.
import { mulberry32 } from '../../engine/rng.js';

// RGBA8 1024^2, REPEAT, mipmapped:
//  R: fibre brightness (+ formation), G: surface height (tooth + fibres), B: dark inclusions, A: formation cloud
export function makePaperTexture(G, size = 1024, seed = 1517) {
  const cv = document.createElement('canvas');
  cv.width = size; cv.height = size;
  const c = cv.getContext('2d', { willReadFrequently: true });
  c.fillStyle = '#000'; c.fillRect(0, 0, size, size);
  c.globalCompositeOperation = 'lighter';
  c.lineCap = 'round';
  const rnd = mulberry32(seed);
  const drawWrapped = (fn, x, y, r) => {
    for (const dx of [-size, 0, size]) for (const dy of [-size, 0, size]) {
      if (x + dx < -r || x + dx > size + r || y + dy < -r || y + dy > size + r) continue;
      fn(x + dx, y + dy);
    }
  };
  // linen/rag fibres: many faint, a few stronger
  const NF = 26000;
  for (let i = 0; i < NF; i++) {
    const x = rnd() * size, y = rnd() * size;
    const len = 5 + Math.pow(rnd(), 2.2) * 34;
    const a = rnd() * Math.PI * 2;
    const bend = (rnd() - 0.5) * len * 0.7;
    const strong = rnd() < 0.08;
    const lum = strong ? 26 + rnd() * 30 : 7 + rnd() * 14;
    const hgt = strong ? 36 + rnd() * 40 : 10 + rnd() * 18;
    c.strokeStyle = `rgb(${lum | 0},${hgt | 0},0)`;
    c.lineWidth = strong ? 0.9 + rnd() * 0.8 : 0.5 + rnd() * 0.6;
    const ux = Math.cos(a) * len * 0.5, uy = Math.sin(a) * len * 0.5;
    drawWrapped((X, Y) => {
      c.beginPath();
      c.moveTo(X - ux, Y - uy);
      c.quadraticCurveTo(X - uy * bend / len, Y + ux * bend / len, X + ux, Y + uy);
      c.stroke();
    }, x, y, len);
  }
  // shives / dark inclusions (B): rare short dark specks and bits of bark
  for (let i = 0; i < 520; i++) {
    const x = rnd() * size, y = rnd() * size;
    const len = 1 + Math.pow(rnd(), 3) * 9;
    const a = rnd() * Math.PI * 2;
    c.strokeStyle = `rgb(0,0,${(60 + rnd() * 160) | 0})`;
    c.lineWidth = 0.8 + rnd() * 1.4;
    drawWrapped((X, Y) => { c.beginPath(); c.moveTo(X, Y); c.lineTo(X + Math.cos(a) * len, Y + Math.sin(a) * len); c.stroke(); }, x, y, len);
  }
  const img = c.getImageData(0, 0, size, size);
  const d = img.data;
  // tileable value noise octaves for tooth (fine) and formation (cloudy, mm scale)
  const lattice = (period, sd) => {
    const r = mulberry32(sd); const g = new Float32Array(period * period);
    for (let i = 0; i < g.length; i++) g[i] = r();
    return (x, y) => {
      const fx = (x / size) * period, fy = (y / size) * period;
      const ix = Math.floor(fx), iy = Math.floor(fy), u = fx - ix, v = fy - iy;
      const su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v);
      const at = (i, j) => g[((j % period + period) % period) * period + ((i % period + period) % period)];
      return (at(ix, iy) * (1 - su) + at(ix + 1, iy) * su) * (1 - sv) + (at(ix, iy + 1) * (1 - su) + at(ix + 1, iy + 1) * su) * sv;
    };
  };
  const t1 = lattice(512, seed + 1), t2 = lattice(256, seed + 2), t3 = lattice(128, seed + 3);
  const f1 = lattice(64, seed + 4), f2 = lattice(32, seed + 5), f3 = lattice(16, seed + 6), f4 = lattice(8, seed + 7);
  const out = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const tooth = t1(x, y) * 0.5 + t2(x, y) * 0.32 + t3(x, y) * 0.18;              // 0..1
    const form = f1(x, y) * 0.4 + f2(x, y) * 0.3 + f3(x, y) * 0.2 + f4(x, y) * 0.1;   // 0..1
    const fibL = d[i] / 255, fibH = d[i + 1] / 255;
    out[i] = Math.min(255, Math.round((fibL * 1.2 + 0.18) * 255 * 0.8));
    out[i + 1] = Math.min(255, Math.round(Math.min(1, tooth * 0.62 + fibH * 0.55) * 255));
    out[i + 2] = d[i + 2];
    out[i + 3] = Math.round(Math.min(1, Math.max(0, (form - 0.5) * 2.2 + 0.5)) * 255);
  }
  // page-space relief gradient of the fine surface (height + fibres), central differences on the
  // wrapped grid: sampled per pixel it is shift-invariant (no swimming under camera motion)
  const hf = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) hf[i] = out[i * 4 + 1] / 255 + 0.35 * (out[i * 4] / 255);
  const nrm = new Uint8Array(size * size * 4);
  const at = (x, y) => hf[(((y + size) % size) * size) + ((x + size) % size)];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const gx = (at(x + 1, y) - at(x - 1, y)) * 0.5, gy = (at(x, y + 1) - at(x, y - 1)) * 0.5;
    const i = (y * size + x) * 4;
    nrm[i] = Math.max(0, Math.min(255, Math.round(128 + gx * 255)));
    nrm[i + 1] = Math.max(0, Math.min(255, Math.round(128 + gy * 255)));
    nrm[i + 2] = 128; nrm[i + 3] = 255;
  }
  const gl = G.gl;
  const mk = (data) => {
    const t = G.texture2D(null, size, size, data, { wrap: 'repeat', filter: 'linear' });
    gl.bindTexture(gl.TEXTURE_2D, t.tex);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    return t;
  };
  return { tex: mk(out), nrm: mk(nrm), size };
}

// Paper shading. Page coordinates: frame-height units, y down, from uView (cx, cy, zoom, rot).
// The low-frequency paper (tone, ageing, stains, foxing, cockle) is static per page: it is baked once
// into a page-space texture (PAPER_BAKE) and the per-frame shader adds only fibres, tooth and media.
export const BAKE_RECT = [-1.2, -0.75, 1.2, 0.75];
export const BAKE_DENSITY = 0.8;            // texels per output pixel of frame height
// portrait (9:16): the page is seen through a tall frame at zoom ~0.5-0.9, so the baked sheet must reach
// further up and down; a page unit spans zoom x H pixels there, hence the lower density per H
export const BAKE_RECT_P = [-1.0, -1.2, 1.0, 1.2];
export const BAKE_DENSITY_P = 0.5;

const PAPER_COMMON = `
uniform vec4 uAge;            // x: umber ageing, y: stains, z: foxing, w: relief strength
uniform float uPaperSeed;
const mat3 OBL = mat3(0.788, 0.429, -0.442, -0.316, 0.890, 0.329, 0.528, -0.152, 0.836);
float pn(vec2 p, float z){ return n3(OBL * vec3(p, z)); }
float pfbm(vec2 p, float z, int oct){ float a = 0.5, s = 0.0; for (int i = 0; i < 6; i++){ if (i >= oct) break; s += a * pn(p, z); p = mat2(0.8, -0.6, 0.6, 0.8) * p * 2.07 + 3.1; a *= 0.5; } return s; }
float cockle(vec2 p){ return pfbm(p * 1.7 + uPaperSeed, 3.7, 3); }
`;

export const PAPER_BAKE = PAPER_COMMON + `
uniform vec4 uBakeRect;
void main(){
  vec2 p = mix(uBakeRect.xy, uBakeRect.zw, gl_FragCoord.xy / uRes);
  // tone: warm ivory -> aged umber, with large irregular ageing
  float big = pfbm(p * 1.25 + 7.0 + uPaperSeed, 1.3, 4);
  float mid = pfbm(p * 6.0 + 2.0 + uPaperSeed * 0.3, 5.1, 3);
  vec3 ivory = vec3(0.90, 0.77, 0.53);
  vec3 aged  = vec3(0.70, 0.48, 0.23);
  vec3 umber = vec3(0.36, 0.19, 0.07);
  float ag = sat(0.32 + big * 1.7 + mid * 0.4) * uAge.x;
  vec3 alb = mix(ivory, aged, ag);
  // tide-line stains: a pale interior with a darker umber rim
  float st = pfbm(p * 1.05 + 19.0 + uPaperSeed * 0.7, 8.2, 4);
  float inside = smoothstep(0.16, 0.24, st);
  float rim = exp(-pow((st - 0.2) / 0.016, 2.0)) * (0.6 + 0.4 * pn(p * 30.0, 2.0));
  alb = mix(alb, alb * vec3(0.88, 0.79, 0.64), inside * 0.6 * uAge.y);
  alb = mix(alb, umber * 1.5, rim * 0.5 * uAge.y);
  // foxing: clustered rusty spots of varied size
  vec2 cf = cells3(OBL * vec3(p * 22.0, 4.4 + uPaperSeed));
  vec2 cf2 = cells3(OBL * vec3(p * 61.0, 9.9 + uPaperSeed));
  float cluster = smoothstep(0.08, 0.45, pfbm(p * 3.1 + 40.0 + uPaperSeed, 6.6, 3));
  float spot = (1.0 - smoothstep(0.04, 0.2, cf.x)) * smoothstep(0.35, 0.8, pn(p * 22.0 + 3.0, 7.7) * 0.5 + 0.5);
  float speck = (1.0 - smoothstep(0.03, 0.12, cf2.x)) * smoothstep(0.55, 0.9, pn(p * 61.0, 1.9) * 0.5 + 0.5);
  float fox = (spot * 0.8 + speck * 0.6) * cluster * uAge.z;
  alb = mix(alb, vec3(0.50, 0.24, 0.09), sat(fox) * 0.55);
  fragColor = vec4(alb, cockle(p));
}`;

export const PAPER = PAPER_COMMON + `
uniform sampler2D uOverlay;   // R iron-gall, G red chalk, B relief (premultiplied, additive)
uniform sampler2D uPaper;     // fibre texture (repeat)
uniform sampler2D uPaperN;    // its relief gradient (rg, 0.5 = flat), per texel
uniform float uPaperSize;
uniform sampler2D uBake;      // baked page: albedo rgb, cockle height a
uniform vec4 uBakeRect;
uniform vec4 uView;           // page centre x,y ; zoom ; rotation
uniform vec4 uKey;            // light pool centre xy (page), radius, falloff power
uniform vec3 uKeyDir;         // raking light direction (page space, z out of paper)
uniform vec3 uKeyCol;         // key light colour*intensity
uniform vec3 uFillCol;        // cool ambient
uniform vec4 uFlame;          // flame xy, radius, strength
uniform vec4 uFlameB;         // flame flicker
uniform float uInk;           // overlay validity (0 = no ink)
uniform float uLevel;         // global light level (dissolves from darkness)
uniform float uCockle;        // cockle (large undulation) relief gain

vec2 pagePos(){
  vec2 sp = vec2(gl_FragCoord.x * uFull.x / uRes.x, uFull.y - gl_FragCoord.y * uFull.y / uRes.y);
  vec2 q = (sp - 0.5 * uFull) / (uView.z * uFull.y);
  float c = cos(uView.w), s = sin(uView.w);
  return uView.xy + vec2(c * q.x + s * q.y, -s * q.x + c * q.y);
}

struct Paper { vec3 alb; float h; float tooth; vec2 grad; float fib; };

Paper paper(vec2 p){
  Paper P;
  vec2 bs = uBakeRect.zw - uBakeRect.xy;
  vec2 ub = (p - uBakeRect.xy) / bs;
  vec4 bk = texture(uBake, ub);
  // two incommensurate samples of the fibre texture (hides tiling)
  vec2 q1 = p * 1.28 + vec2(0.17, 0.61) + uPaperSeed * 0.13;
  vec2 q2 = mat2(0.866, -0.5, 0.5, 0.866) * p * 0.97 + vec2(0.53, 0.29);
  vec4 a = texture(uPaper, q1), b = texture(uPaper, q2);
  float fib = max(a.r, b.r * 0.9);
  float hgt = a.g * 0.6 + b.g * 0.4;
  float form = a.a * 0.55 + b.a * 0.45;
  float shive = max(a.b, b.b * 0.7);
  vec3 alb = bk.rgb;
  alb *= 0.93 + 0.06 * (form - 0.5) * 2.0 + 0.10 * (fib - 0.25);
  alb *= 1.0 - shive * 0.45;
  P.alb = alb;
  P.tooth = hgt;
  P.fib = fib;
  // relief: cockle from the bake (finite differences) + fine tooth (screen derivatives)
  float e = 0.004;
  float hx = texture(uBake, ub + vec2(e / bs.x, 0.0)).a, hy = texture(uBake, ub + vec2(0.0, e / bs.y)).a;
  vec2 gc = vec2(hx - bk.a, hy - bk.a) / e;
  // fine relief gradient in page units: layer 1 is axis aligned, layer 2 is rotated (rotate back)
  vec2 n1 = texture(uPaperN, q1).rg * 2.0 - 1.0, n2 = texture(uPaperN, q2).rg * 2.0 - 1.0;
  n1 *= uPaperSize * 1.28 * (255.0 / 256.0); n2 *= uPaperSize * 0.97;
  vec2 n2p = vec2(0.866 * n2.x - 0.5 * n2.y, 0.5 * n2.x + 0.866 * n2.y);
  vec2 gf = (n1 * 0.6 + n2p * 0.4) * 0.5;      // texel rows run with page y
  P.grad = gc * 0.012 * uAge.w * uCockle + gf * 0.00055 * uAge.w;
  P.h = bk.a;
  return P;
}
`;
