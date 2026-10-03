// The dark at ignition: the picture is swallowed and the sound carries the climax.
// Renders black, optionally with a faint retinal afterimage of the point the light collapsed into
// (params.afterimage: { pos: [x, y] frameUV, r: fraction of the short side, col: linear RGB, amount, tau s }).
import { frag } from '../engine/glsl.js';

const FS = frag(`
uniform vec2 uPos; uniform float uR; uniform vec3 uCol; uniform float uAmt;
void main(){
  vec2 uv = frameUV();
  vec2 d = (uv - uPos) * vec2(uFull.x, uFull.y) / min(uFull.x, uFull.y);
  float r = length(d) / max(uR, 1e-4);
  float g = exp(-r * r * 1.6) * (0.75 + 0.25 * sin(uTime * 3.1));
  fragColor = vec4(uCol * g * uAmt, 1.0);
}`);

export default {
  id: 'void',
  presets: { default: {} },
  init(E) { this.prog = E.program(FS, 'void'); },
  render(E, S, target) {
    const A = S.params.afterimage || { amount: 0 };
    const amt = (A.amount || 0) * Math.exp(-S.local / (A.tau || 1.2));
    E.draw(this.prog, { uPos: A.pos || [0, 0], uR: A.r ?? 0.08, uCol: A.col || [0.35, 0.06, 0.03], uAmt: amt }, target, { scissor: [0, 0, target.w, target.h] });
  },
};
