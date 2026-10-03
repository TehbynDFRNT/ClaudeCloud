// GPU soft-line renderer for the plasma scene: filaments, spark streaks and flash disks are drawn as
// triangle geometry into a float HDR target with additive blending (raw WebGL2 on E.G.gl; the engine's
// own draws rebind all state they use, and we restore what we touch).
//  * strips: per-vertex screen position (px, y down), half width (px) and HDR colour; consecutive quads
//    share edges (averaged normals) so there are no join artefacts; the across-profile is a soft
//    Gaussian evaluated per pixel, so even 1 px strands are antialiased and defocus is a smooth widening.
//  * disks: radial soft blobs (flashes, spark heads).
//  * alpha accumulates per-vertex optical depth (strands silhouetted against the hot core in the composite).
// Aspect/resolution agnostic: every position and width arrives in output pixels of the target it is flushed
// to; plasma-strokes.js sizes them (landscape W/1920, portrait E.k-based scales from plasma.js).

const VS = `#version 300 es
layout(location=0) in vec2 aPos;    // pixels, origin top-left
layout(location=1) in vec3 aUV;     // u across (-1..1), v (disk), mode (0 line, 1 disk)
layout(location=2) in vec3 aCol;    // HDR radiance at the profile peak
layout(location=3) in float aAbs;   // optical depth at the profile peak
uniform vec2 uSize;                 // output frame size the pixel coordinates refer to
out vec3 vUV; out vec3 vCol; out float vAbs;
void main(){
  vUV = aUV; vCol = aCol; vAbs = aAbs;
  gl_Position = vec4(aPos.x / uSize.x * 2.0 - 1.0, 1.0 - aPos.y / uSize.y * 2.0, 0.0, 1.0);
}`;

const FS = `#version 300 es
precision highp float;
in vec3 vUV; in vec3 vCol; in float vAbs;
out vec4 fragColor;
void main(){
  float r2 = vUV.z > 0.5 ? dot(vUV.xy, vUV.xy) : vUV.x * vUV.x;
  float p = vUV.z > 0.5 ? (exp(-r2 * 6.0) * 0.8 + exp(-r2 * 2.5) * 0.2) * (1.0 - r2) * (1.0 - r2) * step(r2, 1.0)
                        : exp(-r2 * 6.0) * 0.82 + exp(-r2 * 1.8) * 0.18;
  fragColor = vec4(vCol * p, vAbs * p);
}`;

function compile(gl, type, src, name) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`plasma-lines ${name}: ${gl.getShaderInfoLog(s)}`);
  return s;
}

const STRIDE = 9; // floats per vertex: x y | u v mode | r g b | optical depth

export class SoftLines {
  constructor(gl) {
    this.gl = gl;
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VS, 'vs'));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, FS, 'fs'));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('plasma-lines link: ' + gl.getProgramInfoLog(p));
    this.prog = p;
    this.uSize = gl.getUniformLocation(p, 'uSize');
    this.vao = gl.createVertexArray();
    this.buf = gl.createBuffer();
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, STRIDE * 4, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, STRIDE * 4, 8);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 3, gl.FLOAT, false, STRIDE * 4, 20);
    gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, STRIDE * 4, 32);
    gl.bindVertexArray(null);
    this.data = new Float32Array(STRIDE * 6 * 20000);
    this.n = 0;
  }

  begin(W, H) { this.n = 0; this.W = W; this.H = H; }

  _grow(extra) {
    if ((this.n + extra) * STRIDE <= this.data.length) return;
    const d = new Float32Array(Math.max(this.data.length * 2, (this.n + extra) * STRIDE * 1.5));
    d.set(this.data.subarray(0, this.n * STRIDE));
    this.data = d;
  }

  _v(x, y, u, v, m, r, g, b, a = 0) {
    const o = this.n * STRIDE, d = this.data;
    d[o] = x; d[o + 1] = y; d[o + 2] = u; d[o + 3] = v; d[o + 4] = m; d[o + 5] = r; d[o + 6] = g; d[o + 7] = b; d[o + 8] = a;
    this.n++;
  }

  // pts: [{x, y, w (half width px), c:[r,g,b], a?: optical depth}] (>= 2). capEnds: soft tapered ends.
  strip(pts, capEnds = true) {
    // drop vertices much closer together than the strip width (wide defocused strands would fold over
    // themselves and add up into striations)
    if (pts.length > 2) {
      const out = [pts[0]];
      for (let i = 1; i < pts.length - 1; i++) {
        const a = out[out.length - 1], p = pts[i];
        if (Math.hypot(p.x - a.x, p.y - a.y) >= 0.45 * Math.max(a.w, p.w)) out.push(p);
      }
      out.push(pts[pts.length - 1]);
      pts = out;
    }
    const n = pts.length;
    if (n < 2) return;
    this._grow((n + 1) * 6);
    const nx = new Float32Array(n), ny = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      const dx = b.x - a.x, dy = b.y - a.y;
      const l = Math.hypot(dx, dy) || 1;
      nx[i] = -dy / l; ny[i] = dx / l;
    }
    const quad = (A, B, ax, ay, bx, by, ca, cb, ta = A.a || 0, tb = B.a || 0) => {
      const wa = A.w, wb = B.w;
      const a0x = A.x + ax * wa, a0y = A.y + ay * wa, a1x = A.x - ax * wa, a1y = A.y - ay * wa;
      const b0x = B.x + bx * wb, b0y = B.y + by * wb, b1x = B.x - bx * wb, b1y = B.y - by * wb;
      this._v(a0x, a0y, 1, 0, 0, ca[0], ca[1], ca[2], ta);
      this._v(b0x, b0y, 1, 0, 0, cb[0], cb[1], cb[2], tb);
      this._v(b1x, b1y, -1, 0, 0, cb[0], cb[1], cb[2], tb);
      this._v(a0x, a0y, 1, 0, 0, ca[0], ca[1], ca[2], ta);
      this._v(b1x, b1y, -1, 0, 0, cb[0], cb[1], cb[2], tb);
      this._v(a1x, a1y, -1, 0, 0, ca[0], ca[1], ca[2], ta);
    };
    for (let i = 0; i < n - 1; i++) quad(pts[i], pts[i + 1], nx[i], ny[i], nx[i + 1], ny[i + 1], pts[i].c, pts[i + 1].c);
    if (capEnds) {
      const Z = [0, 0, 0];
      for (const [i, j] of [[0, 1], [n - 1, n - 2]]) {
        const A = pts[i], B = pts[j];
        let dx = A.x - B.x, dy = A.y - B.y;
        const l = Math.hypot(dx, dy) || 1;
        const E = { x: A.x + (dx / l) * A.w, y: A.y + (dy / l) * A.w, w: A.w };
        quad(E, A, nx[i], ny[i], nx[i], ny[i], Z, A.c, 0, A.a || 0);
      }
    }
  }

  disk(x, y, r, c) {
    this._grow(6);
    const v = (sx, sy) => this._v(x + sx * r, y + sy * r, sx, sy, 1, c[0], c[1], c[2]);
    v(-1, -1); v(1, -1); v(1, 1); v(-1, -1); v(1, 1); v(-1, 1);
  }

  // draw everything into target (a frame-shaped render target), cleared first
  flush(target) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    gl.viewport(0, 0, target.w, target.h);
    gl.disable(gl.SCISSOR_TEST);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (this.n > 0) {
      gl.useProgram(this.prog);
      gl.uniform2f(this.uSize, this.W, this.H);
      gl.bindVertexArray(this.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
      gl.bufferData(gl.ARRAY_BUFFER, this.data.subarray(0, this.n * STRIDE), gl.DYNAMIC_DRAW);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.drawArrays(gl.TRIANGLES, 0, this.n);
      gl.disable(gl.BLEND);
      gl.bindVertexArray(null);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
}
