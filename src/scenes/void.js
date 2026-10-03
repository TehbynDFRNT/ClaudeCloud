// The dark at ignition: the picture is swallowed and the sound carries the climax.
// Renders black, optionally with a faint retinal afterimage of the point the light collapsed into
// (params.afterimage: { pos: [x, y] frameUV, r: radius in half short sides, col: linear RGB (ember, at onset),
//  col2: linear RGB it cools to, amount, attack s (the ghost develops), tau s (it dies), breathe 0..1 }).
import { frag } from '../engine/glsl.js';

const FS = frag(`
uniform vec2 uPos; uniform float uR; uniform vec3 uCol; uniform float uAmt; uniform float uBreathe;
void main(){
  vec2 uv = frameUV();
  vec2 d = (uv - uPos) * vec2(uFull.x, uFull.y) / min(uFull.x, uFull.y);
  float r = length(d) / max(uR, 1e-4);
  // soft retinal blob: a slightly brighter core inside a wide, faint skirt, breathing slowly
  float g = exp(-r * r * 1.6) * 0.8 + exp(-r * r * 0.35) * 0.2;
  g *= 1.0 - uBreathe * (0.5 - 0.5 * sin(uLocal * 3.1));
  fragColor = vec4(uCol * g * uAmt, 1.0);
}`);

export default {
  id: 'void',
  presets: {
    // S22-dark (the loudest sound of the film over black): the eye keeps a ghost of the point S21 collapsed into, at
    // frame centre where the ignition will appear. Ember cooling to deep crimson, dying over ~1 s: it must still read
    // as darkness (peak ~30/255 red, gone well before the shot ends).
    'S22-dark': {
      afterimage: { pos: [0, 0], r: 0.15, col: [0.40, 0.085, 0.03], col2: [0.30, 0.025, 0.02], amount: 0.13, attack: 0.12, tau: 0.75, breathe: 0.25 },
    },
    default: {},
  },
  init(E) { this.prog = E.program(FS, 'void'); },
  render(E, S, target) {
    const A = S.params.afterimage || { amount: 0 };
    const t = Math.max(S.local, 0);
    const amt = (A.amount || 0) * (A.attack ? 1 - Math.exp(-t / A.attack) : 1) * Math.exp(-t / (A.tau || 1.2));
    const c1 = A.col || [0.35, 0.06, 0.03], c2 = A.col2 || c1;
    const k = 1 - Math.exp(-t / ((A.tau || 1.2) * 0.8));
    const col = c1.map((v, i) => v + (c2[i] - v) * k);
    E.draw(this.prog, { uPos: A.pos || [0, 0], uR: A.r ?? 0.08, uCol: col, uAmt: amt, uBreathe: A.breathe ?? 0 }, target, { scissor: [0, 0, target.w, target.h] });
  },
};
