// Raw WebGL2 plumbing for the statue scene. The engine (engine/gl.js) only draws fullscreen passes; the statue
// rasterises a real mesh, so it brings its own vertex programs, depth-attached render targets, a uniform binder that
// also understands shadow samplers / sampler objects, and a save/restore of every piece of GL state the engine relies
// on (framebuffer, viewport, program, VAO, depth, cull, blend, scissor, polygon offset, samplers, active texture).

function shader(gl, type, src, name) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s) || '';
    const lines = src.split('\n');
    const m = /ERROR: \d+:(\d+)/.exec(log);
    const ctx = m ? lines.slice(Math.max(0, +m[1] - 4), +m[1] + 2).map((l, i) => `${Math.max(1, +m[1] - 3) + i}: ${l}`).join('\n') : '';
    throw new Error(`Shader compile failed (${name}):\n${log}\n${ctx}`);
  }
  return s;
}

// collect active uniforms the same way engine/gl.js does (base name without [0] -> location + type)
function introspect(gl, p, name) {
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

// A mesh program: attribute locations are fixed by layout() qualifiers in the vertex source.
export function meshProgram(gl, vsSrc, fsSrc, name) {
  const p = gl.createProgram();
  gl.attachShader(p, shader(gl, gl.VERTEX_SHADER, vsSrc, name + '.vert'));
  gl.attachShader(p, shader(gl, gl.FRAGMENT_SHADER, fsSrc, name + '.frag'));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`Link failed (${name}): ${gl.getProgramInfoLog(p)}`);
  return introspect(gl, p, name);
}

// Bind uniforms (engine globals merged in: clock, frame size, the uNoise volume). Textures are {tex, sampler?}
// objects or engine render targets. Returns the texture units that got a sampler object (to unbind later).
export function bindUniforms(G, prog, uniforms) {
  const gl = G.gl;
  gl.useProgram(prog.p);
  let unit = 0;
  const samplerUnits = [];
  const all = { ...G.globalUniforms, ...uniforms };
  for (const [name, loc] of prog.loc) {
    let v = all[name];
    if (v === undefined) {
      const gt = G.globalTextures[name];
      if (gt) v = gt; else continue;
    }
    const { type } = prog.types.get(name);
    if (type === gl.SAMPLER_2D || type === gl.SAMPLER_3D || type === gl.SAMPLER_2D_SHADOW) {
      if (!v || !v.tex) continue;
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(type === gl.SAMPLER_3D ? gl.TEXTURE_3D : gl.TEXTURE_2D, v.tex);
      gl.bindSampler(unit, v.sampler || null);
      if (v.sampler) samplerUnits.push(unit);
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
  return samplerUnits;
}

// Fullscreen pass with a program from G.program() (engine fullscreen vertex shader) into {fbo, w, h}.
// scissor: [x, y, w, h] in target pixels or null.
export function drawFullscreen(G, prog, uniforms, rt, scissor = null) {
  const gl = G.gl;
  gl.bindFramebuffer(gl.FRAMEBUFFER, rt.fbo);
  gl.viewport(0, 0, rt.w, rt.h);
  if (scissor) { gl.enable(gl.SCISSOR_TEST); gl.scissor(...scissor); } else gl.disable(gl.SCISSOR_TEST);
  gl.disable(gl.BLEND);
  const su = bindUniforms(G, prog, { ...uniforms, uRes: [rt.w, rt.h] });
  gl.bindVertexArray(G.vao);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  for (const u of su) gl.bindSampler(u, null);
  gl.disable(gl.SCISSOR_TEST);
}

// Multi-attachment render target with a depth attachment (renderbuffer, or a depth texture for shadow maps).
// colors: list of 'rgba32f' | 'rgba16f' | 'rgba8'. Cached by name; recreated when the size changes.
const FMT = {
  rgba32f: (gl) => [gl.RGBA32F, gl.RGBA, gl.FLOAT],
  rgba16f: (gl) => [gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT],
  rgba8: (gl) => [gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE],
};
export function depthTarget(gl, cache, name, w, h, colors, { depthTexture = false } = {}) {
  const ex = cache.get(name);
  if (ex && ex.w === w && ex.h === h) return ex;
  if (ex) {
    gl.deleteFramebuffer(ex.fbo);
    for (const t of ex.colors) gl.deleteTexture(t.tex);
    if (ex.depthRb) gl.deleteRenderbuffer(ex.depthRb);
    if (ex.depth) gl.deleteTexture(ex.depth.tex);
  }
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  const out = { name, fbo, w, h, colors: [], depth: null, depthRb: null };
  colors.forEach((f, i) => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    const [ifmt, fmt, type] = FMT[f](gl);
    gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, w, h, 0, fmt, type, null);
    const filt = f === 'rgba32f' ? gl.NEAREST : gl.LINEAR;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filt);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filt);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, tex, 0);
    out.colors.push({ tex, w, h });
  });
  if (depthTexture) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, w, h, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, tex, 0);
    out.depth = { tex, w, h };
  } else {
    const rb = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    out.depthRb = rb;
  }
  gl.drawBuffers(colors.length ? colors.map((_, i) => gl.COLOR_ATTACHMENT0 + i) : [gl.NONE]);
  if (!colors.length) gl.readBuffer(gl.NONE);
  const st = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (st !== gl.FRAMEBUFFER_COMPLETE) throw new Error(`statue FBO incomplete ${name}: ${st}`);
  cache.set(name, out);
  return out;
}

// Sampler objects for reading one depth texture two ways: hardware-compared bilinear PCF, and raw depth.
export function depthSamplers(gl) {
  const cmp = gl.createSampler();
  gl.samplerParameteri(cmp, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.samplerParameteri(cmp, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.samplerParameteri(cmp, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.samplerParameteri(cmp, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.samplerParameteri(cmp, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
  gl.samplerParameteri(cmp, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
  const raw = gl.createSampler();
  gl.samplerParameteri(raw, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.samplerParameteri(raw, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.samplerParameteri(raw, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.samplerParameteri(raw, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.samplerParameteri(raw, gl.TEXTURE_COMPARE_MODE, gl.NONE);
  return { cmp, raw };
}

// Snapshot of the GL state the engine relies on; restore() puts it back and guarantees the engine's invariants
// (its fullscreen VAO bound, no depth test / depth writes, no culling, no blending, no scissor, no sampler objects).
export function saveState(G) {
  const gl = G.gl;
  return {
    fb: gl.getParameter(gl.FRAMEBUFFER_BINDING),
    viewport: gl.getParameter(gl.VIEWPORT),
    program: gl.getParameter(gl.CURRENT_PROGRAM),
    activeTexture: gl.getParameter(gl.ACTIVE_TEXTURE),
    arrayBuffer: gl.getParameter(gl.ARRAY_BUFFER_BINDING),
    clearColor: gl.getParameter(gl.COLOR_CLEAR_VALUE),
    clearDepth: gl.getParameter(gl.DEPTH_CLEAR_VALUE),
    colorMask: gl.getParameter(gl.COLOR_WRITEMASK),
    depthFunc: gl.getParameter(gl.DEPTH_FUNC),
    cullMode: gl.getParameter(gl.CULL_FACE_MODE),
    frontFace: gl.getParameter(gl.FRONT_FACE),
  };
}
export function restoreState(G, s, maxUnits = 16) {
  const gl = G.gl;
  for (let u = 0; u < maxUnits; u++) gl.bindSampler(u, null);
  gl.disable(gl.DEPTH_TEST);
  gl.depthMask(false);
  gl.depthFunc(s.depthFunc);
  gl.disable(gl.CULL_FACE);
  gl.cullFace(s.cullMode);
  gl.frontFace(s.frontFace);
  gl.disable(gl.BLEND);
  gl.disable(gl.SCISSOR_TEST);
  gl.disable(gl.POLYGON_OFFSET_FILL);
  gl.polygonOffset(0, 0);
  gl.colorMask(...s.colorMask);
  gl.clearColor(...s.clearColor);
  gl.clearDepth(s.clearDepth);
  gl.bindVertexArray(G.vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, s.arrayBuffer);
  gl.useProgram(s.program);
  gl.activeTexture(s.activeTexture);
  gl.bindFramebuffer(gl.FRAMEBUFFER, s.fb);
  gl.viewport(...s.viewport);
}
