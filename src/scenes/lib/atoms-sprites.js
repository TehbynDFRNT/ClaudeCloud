// Tiled, depth-sorted sprite renderer for the 'atoms' scene.
//
// Every nucleon, spark, trail and flash is projected on the CPU into a screen-space sprite with a
// thin-lens circle of confusion, sorted front-to-back and binned into small screen tiles. The
// fragment shader walks only its tile's list and composites translucent glowing spheres (emission +
// absorption, subsurface wrap light, internal shimmer, bokeh discs when defocused), streaks and glows.
// Cost per pixel ~ number of sprites overlapping its tile, so thousands of spheres stay cheap.
//
// Data (all RGBA32F, nearest):
//   uSpr  1024 x 32 : sprite i occupies texels ((i&255)*4 + k, i>>8), k = 0..3
//         T0 (x, y, boundR, type*1e5 + z)   x,y in full-frame pixels, y up
//         T1 (r, coc, z, seed)              sharp radius px, circle-of-confusion radius px
//         T2 (rgb emission, alpha)
//         T3 sphere: (lightDir.xy, heat, cluster)   streak: (tail.xy offset px, fadeExp, 0)
//   uIdx  1024 x 256: sprite indices, 4 per texel, -1 padded; tile lists start on texel boundaries
//   uTileTex tilesX x tilesY: (offset texel, count, 0, 0)

export const SPRITE_GLSL = `
precision highp sampler2D;
uniform sampler2D uSpr;
uniform sampler2D uIdx;
uniform sampler2D uTileTex;
uniform float uTileSize;
uniform vec2 uTileN;

vec4 sprT(int i, int k){ return texelFetch(uSpr, ivec2(((i & 255) << 2) + k, i >> 8), 0); }

void shadeSprite(int id, float type, vec4 a, vec2 d, float dd, inout vec3 col, inout float T){
  vec4 b = sprT(id, 1);
  vec4 c = sprT(id, 2);
  vec4 e = sprT(id, 3);
  if (type < 0.5){
    // ---- translucent glowing sphere (nucleon, or a whole distant nucleus when e.w = 1)
    float r = b.x, coc = b.y, R = r + coc;
    float dist = sqrt(dd);
    float bl = coc / R;                                   // 0 sharp .. 1 pure bokeh
    float aa = 0.7 + 0.04 * coc + 0.55 * min(coc, r);
    float edge = sat((R - dist) / aa + 0.5);
    if (edge <= 0.0) return;
    float rs = r + 0.8 * coc;
    vec2 sp = d / rs;
    float s2 = min(dot(sp, sp), 1.0);
    float th = sqrt(1.0 - s2);                            // chord through the sphere / normal z
    float wrap = sat(0.5 + 0.5 * dot(sp, e.xy));          // subsurface: lit from the cluster interior
    float fres = pow(1.0 - th, 3.0);
    float I = (0.18 + 0.82 * th) * (0.5 + 0.8 * wrap) + fres * (0.25 + 1.1 * wrap);
    float m = smoothstep(0.1, 0.62, bl);
    if (m < 0.9){
      // shimmering internal caustics, fast and fine (quark-sea flicker), seeded per sphere
      vec3 np = vec3(sp * 1.9, th * 1.4) + vec3(b.w * 7.13, b.w * 3.71, b.w * 1.37);
      float n = 1.0 - abs(n3(np + vec3(0.0, 0.0, uTime * 2.6)));
      float n2 = n3(np * 2.3 + vec3(uTime * 1.9, 0.0, 5.0)) * 0.5 + 0.5;
      float sh = n * n * n * 0.9 + n2 * 0.35;
      if (e.w > 0.5){                                     // distant nucleus: lumpy cluster of cores
        vec2 cl = cells3(vec3(sp * 2.1, th * 1.5) + b.w * 5.3);
        sh = 0.4 + 1.3 * (1.0 - smoothstep(0.0, 0.75, cl.x)) * (0.6 + 0.4 * n);
      }
      I *= mix(0.62 + 0.75 * sh, 1.0, m);
    }
    float u = dist / R;
    // bokeh disc: flat with a bright, slightly coloured rim and faint onion rings
    float bok = 0.78 + 0.55 * smoothstep(0.5, 0.97, u) + 0.05 * sin(u * 37.0 + b.w * 9.0);
    I = mix(I, bok, m);
    float norm = mix(1.0, (r * r) / (R * R), bl);
    vec3 em = c.rgb * I;
    em += vec3(1.0, 0.92, 0.84) * e.z * th * th * (1.0 - m) * length(c.rgb) * 0.6;   // white-hot core
    em *= mix(vec3(1.0), vec3(0.85 + 0.3 * u, 1.0, 1.12 - 0.25 * u), m * smoothstep(0.6, 1.0, u)); // bokeh fringe
    col += T * em * (norm * edge);
    T *= 1.0 - c.a * edge * norm * mix(0.25 + 0.75 * th, 0.85, m);
  } else if (type < 1.5){
    // ---- streak / trail: head at a.xy, tail at a.xy + e.xy
    vec2 tl = e.xy;
    float L2 = max(dot(tl, tl), 1e-4);
    float h = sat(dot(d, tl) / L2);
    vec2 v = d - tl * h;
    float r0 = max(b.x, 0.65);
    float w = r0 + b.y;
    float x2 = dot(v, v) / (w * w);
    if (x2 > 8.0) return;
    float prof = exp(-x2 * 1.7) + 0.06 * exp(-x2 * 0.25);
    float fade = pow(1.0 - h, e.z);
    col += T * c.rgb * (prof * fade * (r0 / w));
  } else {
    // ---- glow / flash: hot white core with a coloured falloff
    float r = b.x + b.y * 0.5;
    float x2 = dd / (r * r);
    float win = 1.0 - smoothstep(0.35, 1.0, dd / (a.z * a.z));
    float x = sqrt(x2);
    vec3 g = vec3(1.0, 0.96, 0.9) * exp(-x2 * 2.2) * 2.0 + c.rgb * (exp(-x * 1.6) * 0.9 + 0.12 / (1.0 + x2));
    col += T * g * c.a * win;
  }
}

// composite the tile list of pixel q (full-frame px, y up). Inserts 'layer' (rings) at depth zLayer.
vec3 compositeSprites(vec2 q, inout float T, vec3 layer, float zLayer){
  ivec2 tc = clamp(ivec2(q / uTileSize), ivec2(0), ivec2(uTileN) - 1);
  vec4 th = texelFetch(uTileTex, tc, 0);
  int off = int(th.x + 0.5), cnt = int(th.y + 0.5);
  int nT = (cnt + 3) >> 2;
  vec3 col = vec3(0.0);
  bool pending = zLayer < 1e8;
  for (int j = 0; j < 160; j++){
    if (j >= nT) break;
    int ti = off + j;
    vec4 ids = texelFetch(uIdx, ivec2(ti & 1023, ti >> 10), 0);
    for (int k = 0; k < 4; k++){
      float idf = ids[k];
      if (idf < 0.0) break;
      int id = int(idf + 0.5);
      vec4 a = sprT(id, 0);
      vec2 d = q - a.xy;
      float dd = dot(d, d);
      if (dd > a.z * a.z) continue;
      float type = floor(a.w * 1e-5);
      float z = a.w - type * 1e5;
      if (pending && z > zLayer){ col += T * layer; pending = false; }
      shadeSprite(id, type, a, d, dd, col, T);
    }
    if (T < 0.004) break;
  }
  if (pending) col += T * layer;
  return col;
}
`;

const MAXS = 8192;          // sprites
const IDXW = 1024, IDXH = 256;
const TILE_CAP = 600;       // max sprites per tile (front-most kept)

export class SpriteBatch {
  constructor(G, W, H) {
    this.G = G; this.W = W; this.H = H;
    this.k = H / 1080;
    this.ts = Math.max(8, Math.round(24 * this.k));
    this.tx = Math.ceil(W / this.ts); this.ty = Math.ceil(H / this.ts);
    this.raw = new Float32Array(MAXS * 16);
    this.sorted = new Float32Array(MAXS * 16);
    this.zs = new Float32Array(MAXS);
    this.box = new Float32Array(MAXS * 4);
    this.seg = new Uint8Array(MAXS);
    this.counts = new Int32Array(this.tx * this.ty);
    this.offs = new Int32Array(this.tx * this.ty);
    this.cur = new Int32Array(this.tx * this.ty);
    this.hdr = new Float32Array(this.tx * this.ty * 4);
    this.idx = new Float32Array(IDXW * IDXH * 4);
    this.sprTex = G.texture2D(null, 1024, MAXS / 256, null, { format: 'rgba32f', filter: 'nearest' });
    this.idxTex = G.texture2D(null, IDXW, IDXH, null, { format: 'rgba32f', filter: 'nearest' });
    this.tileTex = G.texture2D(null, this.tx, this.ty, null, { format: 'rgba32f', filter: 'nearest' });
    this.n = 0;
    this.lb = 0.11; // cull rows hidden by the scope letterbox (with margin)
  }

  // cam: engine camera; dof: {focus, K (CoC px at 1080 for z -> inf), max}
  begin(cam, dof) {
    this.n = 0;
    this.cam = cam;
    this.focus = dof.focus; this.K = dof.K * this.k; this.cmax = (dof.max ?? 160) * this.k;
    this.tanH = cam.tanH; this.asp = this.W / this.H;
  }

  // project a world point -> [x, y(up), z, pxPerUnit, coc] or null
  proj(p) {
    const c = this.cam;
    const dx = p[0] - c.pos[0], dy = p[1] - c.pos[1], dz = p[2] - c.pos[2];
    const z = dx * c.fwd[0] + dy * c.fwd[1] + dz * c.fwd[2];
    if (z < 0.25) return null;
    const x = (dx * c.right[0] + dy * c.right[1] + dz * c.right[2]) / (z * this.tanH * this.asp);
    const y = (dx * c.up[0] + dy * c.up[1] + dz * c.up[2]) / (z * this.tanH);
    const pxs = this.H / (2 * z * this.tanH);
    const coc = Math.min(this.cmax, this.K * Math.abs(1 - this.focus / z));
    return [(x * 0.5 + 0.5) * this.W, (y * 0.5 + 0.5) * this.H, z, pxs, coc];
  }

  onScreen(x, y, R) {
    return !(x + R < 0 || x - R > this.W || y + R < this.H * this.lb || y - R > this.H * (1 - this.lb));
  }

  _push(rec, minx, miny, maxx, maxy, segFlag) {
    if (this.n >= MAXS) return false;
    const i = this.n++;
    this.raw.set(rec, i * 16);
    this.zs[i] = rec[6];
    this.box[i * 4] = minx; this.box[i * 4 + 1] = miny; this.box[i * 4 + 2] = maxx; this.box[i * 4 + 3] = maxy;
    this.seg[i] = segFlag;
    return true;
  }

  // translucent glowing sphere. lightC: world point the subsurface light comes from (or null).
  sphere(p, r, rgb, inten, alpha, lightC, heat, seed, cluster = 0, pp = null) {
    const q = pp || this.proj(p);
    if (!q) return;
    const [x, y, z, pxs, coc] = q;
    const rp = Math.max(0.6, r * pxs);
    const R = rp + coc + 1.0;
    if (!this.onScreen(x, y, R)) return;
    let lx = 0, ly = 0;
    if (lightC) {
      const l = this.proj(lightC);
      if (l) {
        const ddx = l[0] - x, ddy = l[1] - y, dl = Math.hypot(ddx, ddy);
        const s = Math.min(1, dl / (rp * 0.6 + 1e-3));
        if (dl > 1e-3) { lx = (ddx / dl) * s; ly = (ddy / dl) * s; }
      }
    }
    this._push([x, y, R, z, rp, coc, z, seed, rgb[0] * inten, rgb[1] * inten, rgb[2] * inten, alpha, lx, ly, heat, cluster],
      x - R, y - R, x + R, y + R, 0);
  }

  // streak from tail (world) to head (world); brightest at the head
  streak(head, tail, r, rgb, inten, fadeExp = 1.0, seed = 0) {
    const h = this.proj(head), t = this.proj(tail);
    if (!h || !t) return;
    const rp = Math.max(0.65, r * h[3]);
    const w = rp + h[4];
    const tx = t[0] - h[0], ty = t[1] - h[1];
    const pad = w * 2.9 + 1;
    const R = Math.hypot(tx, ty) + pad;
    const minx = Math.min(h[0], t[0]) - pad, maxx = Math.max(h[0], t[0]) + pad;
    const miny = Math.min(h[1], t[1]) - pad, maxy = Math.max(h[1], t[1]) + pad;
    if (maxx < 0 || minx > this.W || maxy < this.H * this.lb || miny > this.H * (1 - this.lb)) return;
    // energy of a defocused thin line spreads: keep the integral roughly constant
    this._push([h[0], h[1], R, 1e5 + h[2], rp, h[4], h[2], seed, rgb[0] * inten, rgb[1] * inten, rgb[2] * inten, 0, tx, ty, fadeExp, 0],
      minx, miny, maxx, maxy, 1);
  }

  // additive glow (flash) at a world point; r = core radius (world)
  glow(p, r, rgb, inten, reach = 3.5) {
    const q = this.proj(p);
    if (!q) return;
    const [x, y, z, pxs, coc] = q;
    const rp = Math.max(0.8, r * pxs);
    const R = (rp + coc * 0.5) * reach;
    if (!this.onScreen(x, y, R)) return;
    this._push([x, y, R, 2e5 + z, rp, coc, z, 0, rgb[0], rgb[1], rgb[2], inten, 0, 0, 0, 0], x - R, y - R, x + R, y + R, 0);
  }

  finish() {
    const n = this.n, ts = this.ts, tx = this.tx, ty = this.ty;
    const ord = new Array(n);
    for (let i = 0; i < n; i++) ord[i] = i;
    const zs = this.zs;
    ord.sort((a, b) => zs[a] - zs[b] || a - b);
    this.counts.fill(0);
    const ranges = new Int32Array(n * 4);
    for (let r = 0; r < n; r++) {
      const i = ord[r];
      this.sorted.set(this.raw.subarray(i * 16, i * 16 + 16), r * 16);
      const x0 = Math.max(0, Math.floor(this.box[i * 4] / ts)), y0 = Math.max(0, Math.floor(this.box[i * 4 + 1] / ts));
      const x1 = Math.min(tx - 1, Math.floor(this.box[i * 4 + 2] / ts)), y1 = Math.min(ty - 1, Math.floor(this.box[i * 4 + 3] / ts));
      ranges[r * 4] = x0; ranges[r * 4 + 1] = y0; ranges[r * 4 + 2] = x1; ranges[r * 4 + 3] = y1;
    }
    const S = this.sorted;
    const hit = (r, gx, gy) => {
      const o = r * 16;
      const ax = gx * ts, ay = gy * ts, bx = ax + ts, by = ay + ts;
      if (S[o + 3] >= 1e5 && S[o + 3] < 2e5) {
        // streak: distance from tile centre to segment vs. half diagonal + width
        const hx = S[o], hy = S[o + 1], vx = S[o + 12], vy = S[o + 13];
        const cx = (ax + bx) * 0.5 - hx, cy = (ay + by) * 0.5 - hy;
        const L2 = vx * vx + vy * vy;
        const h = L2 > 1e-6 ? Math.min(1, Math.max(0, (cx * vx + cy * vy) / L2)) : 0;
        const ex = cx - vx * h, ey = cy - vy * h;
        const w = (Math.max(S[o + 4], 0.65) + S[o + 5]) * 2.9 + 1 + ts * 0.7072;
        return ex * ex + ey * ey <= w * w;
      }
      const px = S[o], py = S[o + 1], R = S[o + 2];
      const dx = Math.max(ax - px, 0, px - bx), dy = Math.max(ay - py, 0, py - by);
      return dx * dx + dy * dy <= R * R;
    };
    const ylo = Math.floor((this.H * this.lb) / ts), yhi = Math.ceil((this.H * (1 - this.lb)) / ts);
    for (let r = 0; r < n; r++) {
      const y0 = Math.max(ranges[r * 4 + 1], ylo), y1 = Math.min(ranges[r * 4 + 3], yhi);
      for (let gy = y0; gy <= y1; gy++) for (let gx = ranges[r * 4]; gx <= ranges[r * 4 + 2]; gx++) {
        if (hit(r, gx, gy)) this.counts[gy * tx + gx]++;
      }
    }
    let off = 0;
    const capTex = IDXW * IDXH;
    for (let t = 0; t < tx * ty; t++) {
      const c = Math.min(this.counts[t], TILE_CAP);
      const need = (c + 3) >> 2;
      if (off + need > capTex) { this.counts[t] = 0; this.offs[t] = 0; continue; }
      this.offs[t] = off; this.counts[t] = c; off += need;
    }
    const rows = Math.max(1, Math.ceil(off / IDXW));
    this.idx.fill(-1, 0, rows * IDXW * 4);
    this.cur.fill(0);
    for (let r = 0; r < n; r++) {
      const y0 = Math.max(ranges[r * 4 + 1], ylo), y1 = Math.min(ranges[r * 4 + 3], yhi);
      for (let gy = y0; gy <= y1; gy++) for (let gx = ranges[r * 4]; gx <= ranges[r * 4 + 2]; gx++) {
        const t = gy * tx + gx;
        if (this.cur[t] >= this.counts[t]) continue;
        if (!hit(r, gx, gy)) continue;
        this.idx[this.offs[t] * 4 + this.cur[t]] = r;
        this.cur[t]++;
      }
    }
    for (let t = 0; t < tx * ty; t++) { this.hdr[t * 4] = this.offs[t]; this.hdr[t * 4 + 1] = this.cur[t]; }
    const gl = this.G.gl;
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.bindTexture(gl.TEXTURE_2D, this.sprTex.tex);
    const srows = Math.max(1, Math.ceil(n / 256));
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 1024, srows, gl.RGBA, gl.FLOAT, this.sorted.subarray(0, srows * 1024 * 4));
    gl.bindTexture(gl.TEXTURE_2D, this.idxTex.tex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, IDXW, rows, gl.RGBA, gl.FLOAT, this.idx.subarray(0, rows * IDXW * 4));
    gl.bindTexture(gl.TEXTURE_2D, this.tileTex.tex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, tx, ty, gl.RGBA, gl.FLOAT, this.hdr);
    this.stats = { sprites: n, entries: off * 4, rows };
  }

  uniforms() {
    return { uSpr: this.sprTex, uIdx: this.idxTex, uTileTex: this.tileTex, uTileSize: this.ts, uTileN: [this.tx, this.ty] };
  }
}
