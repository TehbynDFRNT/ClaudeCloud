// THE SIGN-OFF: Tehbyn Nova's signature writes itself on black (the film's last 3 s, after the stare).
// The signature is the vector from tehbyn.com's footer (media/scenes/signoff/tehbyn-signature.svg: one filled path).
// It is filled once into a canvas at the target's size and revealed by a soft front sweeping left to right, the way
// the pen travels; the freshly written ink glows faintly gold and cools to warm white behind the front.
// The words under it (TEHBYN NOVA, SEE MORE, nova.tehbyn.com) are plan text, set by the titles overlay.
// params: width (signature width as a fraction of the frame width), y (centre, fraction of frame height from the
// top), at (s, the pen starts), dur (s, the stroke), soft (front softness, fraction of the signature width),
// ink (linear RGB), glow (linear RGB of the wet ink at the front), glowW (front glow width, fraction of the width).
import { frag } from '../engine/glsl.js';

const FS = frag(`
uniform sampler2D uSig;
uniform vec4 uBox;        // signature box in target pixels: x0, x1, softness px, glow width px
uniform float uFront;     // x of the pen front in target pixels
uniform vec3 uInk; uniform vec3 uGlow;
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float a = texture(uSig, uv).a;
  float x = gl_FragCoord.x;
  float shown = 1.0 - smoothstep(uFront - uBox.z, uFront, x);
  float wet = exp(-pow((uFront - x) / max(uBox.w, 1.0), 2.0)) * shown;
  vec3 c = uInk * a * shown + uGlow * a * wet;
  fragColor = vec4(c, 1.0);
}`);

let pathD = null;
async function loadPath() {
  if (pathD) return pathD;
  try {
    const r = await fetch('../media/scenes/signoff/tehbyn-signature.svg');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const svg = await r.text();
    const vb = /viewBox="([-\d.\s]+)"/.exec(svg)[1].trim().split(/\s+/).map(Number);
    pathD = { d: /\sd="([^"]+)"/.exec(svg)[1], vb };
  } catch (e) { console.warn('signoff: signature not loaded (' + e.message + ')'); }   // never blocks the other scenes
  return pathD;
}

export default {
  id: 'signoff',
  presets: {
    'S32-signoff': {},
    default: {},
  },
  async preload() { await loadPath(); },
  init(E) { this.prog = E.program(FS, 'signoff'); this.black = E.program(frag(`void main(){ fragColor = vec4(0.0, 0.0, 0.0, 1.0); }`), 'signoff.black'); },

  // the signature filled once per target size (white, alpha = coverage), and its box in target pixels
  sheet(E, P, w, h) {
    const key = `${w}x${h}|${P.width}|${P.y}`;
    if (this.cache && this.cache.key === key) return this.cache;
    const { d, vb } = pathD;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    const sw = P.width * w, k = sw / vb[2], sh = vb[3] * k;
    const x0 = (w - sw) / 2, y0 = P.y * h - sh / 2;
    ctx.setTransform(k, 0, 0, k, x0 - vb[0] * k, y0 - vb[1] * k);
    ctx.fillStyle = '#ffffff';
    ctx.fill(new Path2D(d), 'evenodd');
    this.cache = { key, tex: E.G.canvasTexture(this.cache && this.cache.tex, c), x0, x1: x0 + sw };
    return this.cache;
  },

  render(E, S, target) {
    const P = { width: 0.6, y: 0.4, at: 0.15, dur: 1.25, soft: 0.06, ink: [0.86, 0.82, 0.75], glow: [0.95, 0.66, 0.30], glowW: 0.05, ...S.params };
    const w = target.w, h = target.h;
    E.draw(this.black, {}, target, { scissor: [0, 0, w, h] });
    if (!pathD) return;
    const sh = this.sheet(E, P, w, h);
    const sw = sh.x1 - sh.x0, soft = P.soft * sw;
    // the pen: an ease in and out over dur, from just before the dot to just past the tail
    const u = Math.min(1, Math.max(0, (S.local - P.at) / P.dur));
    const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
    const front = sh.x0 - soft + (sw + 2 * soft) * e;
    // the wet glow fades out over the half second after the pen lifts
    const lift = Math.max(0, S.local - P.at - P.dur);
    const glow = P.glow.map((v) => v * Math.exp(-lift / 0.45));
    E.draw(this.prog, { uSig: sh.tex, uBox: [sh.x0, sh.x1, soft, P.glowW * sw], uFront: front, uInk: P.ink, uGlow: glow }, target, { scissor: [0, 0, w, h] });
  },

  // crisp ink: a whisper of bloom, no streak, almost no grain
  post() { return { bloomStrength: 0.12, halation: 0, grain: 0.004, lift: 0 }; },
};
