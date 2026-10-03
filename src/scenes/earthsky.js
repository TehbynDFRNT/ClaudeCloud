// PLACEHOLDER for the coda: the Milky Way over a dark-sky Earth and a new star appearing.
// The coda department replaces this module (see film-plan.json shot S31-newstar).
import { frag } from '../engine/glsl.js';

const FS = frag(`void main(){ vec2 uv = frameUV(); fragColor = vec4(vec3(0.004, 0.006, 0.012) * (1.0 + uv.y), 1.0); }`);

export default {
  id: 'earthsky',
  presets: { default: {} },
  init(E) { this.prog = E.program(FS, 'earthsky'); },
  render(E, S, target) { E.draw(this.prog, {}, target, { scissor: [0, 0, target.w, target.h] }); },
};
