// One WebGL2 scene: a ring of light on a seeded star field, with a moon that orbits on the FILM's clock (S.t), so its
// motion runs straight across the cut while the ring breathes on each shot's own clock (S.u).
// The fingerprint hashes this file and every relative module it imports: edit it and every shot of this scene
// re-renders. Per-shot looks go in presets (a cut is another preset id); see references/architecture.md §4-5.
const VS = `#version 300 es
in vec2 p;
out vec2 v;
void main() { v = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

const FS = `#version 300 es
precision highp float;
in vec2 v;
out vec4 o;
uniform vec2 uRes;
uniform float uU, uT, uK, uSeed, uRadius;
uniform vec3 uCol;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed * 17.0) * 43758.5453); }
void main() {
  vec2 px = v * uRes;
  vec2 c = (px - 0.5 * uRes) / min(uRes.x, uRes.y);
  vec2 cell = floor(px / (5.0 * uK));
  float star = step(0.996, hash(cell)) * hash(cell + 3.1);
  float R = uRadius * (0.92 + 0.08 * uU);                         // the ring breathes on the shot clock
  float d = abs(length(c) - R);
  float ring = exp(-pow(d / 0.010, 2.0)) * 2.0 + 0.004 / (d + 0.008);
  float a = 6.2831853 * uT / 10.0;                                 // the moon: one turn per 10 s of FILM time
  vec2 m = R * vec2(cos(a), sin(a));
  float moon = 0.004 / (dot(c - m, c - m) + 0.0004);
  vec3 col = vec3(star) + uCol * ring + vec3(1.0, 0.95, 0.85) * moon;   // linear light; can exceed 1
  col = col / (1.0 + col);                                          // Reinhard (the real engine: bloom + ACES)
  o = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

export default {
  id: 'hello',
  presets: {
    'S01-dawn': { color: [1.0, 0.5, 0.18], radius: 0.26, seed: 1 },
    'S02-night': { color: [0.3, 0.55, 1.0], radius: 0.34, seed: 2, portrait: { radius: 0.3 } },
    default: { color: [1, 1, 1], radius: 0.3, seed: 0 },
  },
  init(E) {
    const gl = E.gl;
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = {};
    for (const n of ['uRes', 'uU', 'uT', 'uK', 'uSeed', 'uRadius', 'uCol']) u[n] = gl.getUniformLocation(prog, n);
    this.gpu = { prog, vao, u };
  },
  render(E, S) {
    const gl = E.gl, { prog, vao, u } = this.gpu, P = S.params;
    gl.viewport(0, 0, S.W, S.H);
    gl.useProgram(prog);
    gl.bindVertexArray(vao);
    gl.uniform2f(u.uRes, S.W, S.H);
    gl.uniform1f(u.uU, Math.min(1, Math.max(0, S.u)));
    gl.uniform1f(u.uT, S.t);
    gl.uniform1f(u.uK, E.k);
    gl.uniform1f(u.uSeed, P.seed);
    gl.uniform1f(u.uRadius, P.radius);
    gl.uniform3fv(u.uCol, P.color);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  },
};
