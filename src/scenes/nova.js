// PLACEHOLDER — to be replaced by the real 'nova' scene. Renders a dim labelled frame.
import { frag } from '../engine/glsl.js';

const FS = frag(`
uniform vec3 uTintP;
void main(){
  vec2 uv = frameUV();
  float v = 0.02 + 0.02 * smoothstep(1.0, 0.0, length(uv));
  fragColor = vec4(uTintP * v, 1.0);
}`);

export default {
  id: 'nova',
  presets: {},
  init(E) { this.prog = E.program(FS, 'nova-placeholder'); },
  render(E, S, target) { E.draw(this.prog, { uTintP: [1, 0.6, 0.4] }, target); },
  overlay(E, S, ctx) {
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = `${Math.round(E.H * 0.03)}px monospace`;
    ctx.fillText(`[${S.shot.id}] nova placeholder`, E.W * 0.08, E.H * 0.5);
    return 'over';
  },
};
