// GOLIATH close-ups and reveals: the red giant against the abyss.
// params: cam keys (see lib/util.js), spin [a0, rate], boil, bulge, bulgeDir, scar, scarDir, plumes, glow, starGain
import { frag, STARS } from '../engine/glsl.js';
import { GIANT } from './lib/giant.glsl.js';
import { camFromKeys } from './lib/util.js';

const FS = frag(STARS, GIANT, `
uniform float uStarGain;
void main(){
  vec2 uv = frameUV();
  vec3 rd = cameraRay(uv);
  vec3 ro = uCamPos;
  float pixAngle = 2.0 * uTanHalfFov / uFull.y;
  float dist;
  vec4 g = giantShade(ro, rd, uTime, dist);
  vec3 bg = (starField(rd, pixAngle) + deepSky(rd)) * uStarGain;
  vec3 col = bg * (1.0 - g.a) + g.rgb;
  fragColor = vec4(col, 1.0);
}`);

export default {
  id: 'redgiant',
  scale: 1,
  init(E) { this.prog = E.program(FS, 'redgiant'); },
  render(E, S, target) {
    const P = S.params;
    const cam = camFromKeys(P.cam || [[0, [0, 0, -3.2], [0, 0, 0], 40]], S.local);
    const spin = P.spin || [0, 0.004];
    E.draw(this.prog, {
      ...cam.uniforms,
      uGiantPos: [0, 0, 0], uGiantR: 1, uGiantSpin: spin[0] + spin[1] * S.t,
      uBoil: P.boil ?? 1, uBulge: P.bulge ?? 0, uBulgeDir: P.bulgeDir || [1, 0, 0],
      uScar: P.scar ?? 0, uScarDir: P.scarDir || [1, 0, 0], uGiantGlow: P.glow ?? 1, uPlumes: P.plumes ?? 0.6,
      uRelief: P.relief ?? 0, uLimbDark: P.limbDark ?? 0.62,
      uStarGain: P.starGain ?? 1,
    }, target);
  },
};
