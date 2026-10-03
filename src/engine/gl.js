// WebGL2 plumbing: programs, HDR render targets, fullscreen draws, textures.
// Everything renders as fullscreen fragment passes; there is no geometry.

const VERT = `#version 300 es
layout(location=0) in vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

export class GL {
  constructor(canvas) {
    const gl = canvas.getContext('webgl2', {
      antialias: false, alpha: false, depth: false, stencil: false,
      preserveDrawingBuffer: true, premultipliedAlpha: false, powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('WebGL2 unavailable');
    if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('EXT_color_buffer_float unavailable');
    gl.getExtension('OES_texture_float_linear');
    this.gl = gl;
    this.canvas = canvas;
    this.vs = this._shader(gl.VERTEX_SHADER, VERT, 'fullscreen.vert');
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    this.targets = new Map();
    this.globalTextures = {}; // name -> {tex, target}
    this.globalUniforms = {}; // merged into every draw (per-frame clock, seed, frame size)
  }

  _shader(type, src, name) {
    const gl = this.gl;
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(s);
      const lines = src.split('\n');
      const m = /ERROR: \d+:(\d+)/.exec(log || '');
      const ctx = m ? lines.slice(Math.max(0, +m[1] - 4), +m[1] + 2).map((l, i) => `${Math.max(1, +m[1] - 3) + i}: ${l}`).join('\n') : '';
      throw new Error(`Shader compile failed (${name}):\n${log}\n${ctx}`);
    }
    return s;
  }

  // Compile a fragment program. Uniform locations are cached lazily.
  program(fragSrc, name = 'program') {
    const gl = this.gl;
    const fs = this._shader(gl.FRAGMENT_SHADER, fragSrc, name);
    const p = gl.createProgram();
    gl.attachShader(p, this.vs);
    gl.attachShader(p, fs);
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`Link failed (${name}): ${gl.getProgramInfoLog(p)}`);
    const info = { p, name, loc: new Map(), types: new Map() };
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const u = gl.getActiveUniform(p, i);
      const base = u.name.replace(/\[0\]$/, '');
      info.loc.set(base, gl.getUniformLocation(p, u.name));
      info.types.set(base, { type: u.type, size: u.size });
    }
    return info;
  }

  // Create or fetch a render target. format: 'rgba16f' | 'rgba8'
  target(name, w, h, format = 'rgba16f', filter = 'linear') {
    const key = name;
    const existing = this.targets.get(key);
    if (existing && existing.w === w && existing.h === h && existing.format === format) return existing;
    const gl = this.gl;
    if (existing) { gl.deleteTexture(existing.tex); gl.deleteFramebuffer(existing.fbo); }
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    const internal = format === 'rgba16f' ? gl.RGBA16F : gl.RGBA8;
    const type = format === 'rgba16f' ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE;
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, gl.RGBA, type, null);
    const f = filter === 'linear' ? gl.LINEAR : gl.NEAREST;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const st = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (st !== gl.FRAMEBUFFER_COMPLETE) throw new Error(`FBO incomplete ${name}: ${st}`);
    const t = { name, tex, fbo, w, h, format };
    this.targets.set(key, t);
    return t;
  }

  texture2D(name, w, h, data, { format = 'rgba8', filter = 'linear', wrap = 'clamp' } = {}) {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    if (format === 'rgba8') gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    else if (format === 'rgba16f') gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.FLOAT, data);
    else if (format === 'rgba32f') gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, w, h, 0, gl.RGBA, gl.FLOAT, data);
    const f = filter === 'linear' ? gl.LINEAR : gl.NEAREST;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f);
    const wr = wrap === 'repeat' ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wr);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wr);
    const t = { tex, target: gl.TEXTURE_2D, w, h };
    if (name) this.globalTextures[name] = t;
    return t;
  }

  texture3D(name, n, data) {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_3D, tex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA8, n, n, n, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    for (const p of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T, gl.TEXTURE_WRAP_R]) gl.texParameteri(gl.TEXTURE_3D, p, gl.REPEAT);
    const t = { tex, target: gl.TEXTURE_3D, w: n, h: n };
    if (name) this.globalTextures[name] = t;
    return t;
  }

  // Upload (or re-upload) a canvas into a texture.
  canvasTexture(t, canvas) {
    const gl = this.gl;
    if (!t) {
      t = { tex: gl.createTexture(), target: gl.TEXTURE_2D, w: canvas.width, h: canvas.height };
      gl.bindTexture(gl.TEXTURE_2D, t.tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    gl.bindTexture(gl.TEXTURE_2D, t.tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    t.w = canvas.width; t.h = canvas.height;
    return t;
  }

  // Draw a fullscreen pass. uniforms: {name: value}; textures are {tex,target} objects or render targets.
  // target: render target object or null for the canvas. scissor: [x,y,w,h] in target pixels.
  draw(prog, uniforms, target = null, { scissor = null, blend = null } = {}) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null);
    const w = target ? target.w : this.canvas.width;
    const h = target ? target.h : this.canvas.height;
    gl.viewport(0, 0, w, h);
    if (scissor) { gl.enable(gl.SCISSOR_TEST); gl.scissor(...scissor); } else gl.disable(gl.SCISSOR_TEST);
    if (blend === 'add') { gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); }
    else if (blend === 'over') { gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); }
    else gl.disable(gl.BLEND);
    gl.useProgram(prog.p);
    let unit = 0;
    const all = { ...this.globalUniforms, ...uniforms, uRes: [w, h] };
    for (const [name, loc] of prog.loc) {
      let v = all[name];
      if (v === undefined) {
        const gt = this.globalTextures[name];
        if (gt) v = gt; else continue;
      }
      const { type } = prog.types.get(name);
      if (type === gl.SAMPLER_2D || type === gl.SAMPLER_3D) {
        const tex = v.tex ? v : null;
        if (!tex) continue;
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(type === gl.SAMPLER_3D ? gl.TEXTURE_3D : gl.TEXTURE_2D, tex.tex);
        gl.uniform1i(loc, unit++);
        continue;
      }
      switch (type) {
        case gl.FLOAT: Array.isArray(v) || v instanceof Float32Array ? gl.uniform1fv(loc, v) : gl.uniform1f(loc, v); break;
        case gl.FLOAT_VEC2: gl.uniform2fv(loc, v); break;
        case gl.FLOAT_VEC3: gl.uniform3fv(loc, v); break;
        case gl.FLOAT_VEC4: gl.uniform4fv(loc, v); break;
        case gl.INT: case gl.BOOL: Array.isArray(v) ? gl.uniform1iv(loc, v) : gl.uniform1i(loc, v | 0); break;
        case gl.FLOAT_MAT3: gl.uniformMatrix3fv(loc, false, v); break;
        case gl.FLOAT_MAT4: gl.uniformMatrix4fv(loc, false, v); break;
        default: break;
      }
    }
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.BLEND);
  }

  clear(target, rgba = [0, 0, 0, 0]) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null);
    gl.disable(gl.SCISSOR_TEST);
    gl.viewport(0, 0, target ? target.w : this.canvas.width, target ? target.h : this.canvas.height);
    gl.clearColor(...rgba);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  finish() {
    const px = new Uint8Array(4);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.readPixels(0, 0, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, px);
  }
}
