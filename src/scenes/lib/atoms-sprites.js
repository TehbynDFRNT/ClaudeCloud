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
//         T3 sphere: (lightDir.xy, heat, kind 0 nucleon | 1 whole nucleus | 2 shutter ghost)
//            streak: (tail.xy offset px, fadeExp, seam)   glow: (coreTint, 0, 0, 0)
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

// Nucleon look (kind = e.w): 0 nucleon, 1 whole distant nucleus (one lumpy sphere), 2 shutter ghost.
//  * in focus: a dense, self-luminous ball of nuclear matter. Limb-darkened like a tiny star (white-hot
//    centre -> saturated body -> deep ember / deep blue limb), boiling multi-scale granulation, three hot
//    quark cores jittering inside, a wide soft subsurface rim on the side facing its neighbours, nearly
//    opaque, and an absorbing contact skirt just outside the silhouette so pressed clusters separate.
//  * defocused: a flat, uniform, energy-conserving disc of the sphere's mean colour, no texture, no
//    limb, clipped to a cat's-eye toward the frame edges (mechanical vignetting).
void shadeSprite(int id, float type, vec4 a, vec2 d, float dd, inout vec3 col, inout float T){
  vec4 b = sprT(id, 1);
  vec4 c = sprT(id, 2);
  vec4 e = sprT(id, 3);
  if (type < 0.5){
    float r = b.x, coc = b.y, R = r + coc;
    float dist = sqrt(dd);
    float kind = e.w;
    float bl = coc / R;                                   // 0 sharp .. 1 pure bokeh
    float m = kind > 1.5 ? 1.0 : smoothstep(0.1, 0.4, bl);
    float aa = kind > 1.5 ? 0.35 * r + 1.0 : 0.75 + 0.1 * coc;   // shutter ghosts: soft smear, never a second limb
    float edge = sat((R - dist) / aa + 0.5);
    float skW = kind < 0.5 ? (0.16 * r + 1.0) * (1.0 - smoothstep(0.03, 0.15, bl)) : 0.0;   // only on (nearly) sharp spheres
    if (edge <= 0.0){
      if (skW > 0.0){ float x = sat((dist - R - 0.5 * aa) / skW); T *= 1.0 - c.a * 0.62 * (1.0 - x) * (1.0 - x); }
      return;
    }
    if (m > 0.0){                                         // cat's-eye: second aperture shifted toward the centre
      vec2 fp = (a.xy - 0.5 * uFull) / (0.5 * min(uFull.x, uFull.y));   // short side: same lens in 9:16
      float dc = length(d + fp * 0.2 * R);
      edge *= mix(1.0, sat((R - dc) / aa + 0.5), m);
      if (edge <= 0.0) return;
    }
    float rs = r + 0.5 * coc;
    vec2 sp = d / rs;
    float rr2 = min(dot(sp, sp), 1.0);
    float rr = sqrt(rr2);
    float nz = sqrt(1.0 - rr2);
    vec3 cc = c.rgb;
    float mx = max(cc.r, max(cc.g, cc.b)) + 1e-6;
    vec3 tint = cc / mx;
    float heat = e.z;
    vec3 t2 = tint * tint;
    vec3 sat1 = tint * sqrt(tint);                         // saturated body colour (tint^1.5)
    vec3 hotC = mix(tint, vec3(1.0, 0.95, 0.88), sat(0.25 + 0.17 * heat));
    vec3 edgeC = t2 * tint * 0.2;                          // deep limb (tint^3)
    float coreG = 2.4 + 2.4 * heat;
    float coreP = mix(16.0, 5.0, sat(heat * 0.28));        // hotter = the white core swells
    vec3 meanC = sat1 * 0.62 + hotC * (coreG * 2.0 / (coreP + 2.0));   // mean radiance of the sharp profile
    vec3 em;
    if (m < 0.97){
      float wrap = sat(0.5 + 0.5 * dot(sp, e.xy));
      float body = smoothstep(0.0, 0.85, nz);
      float core = pow(nz, coreP);
      float gm = 1.0, qs = 0.0, gn = 0.6;
      if (kind < 0.5){
        float s = b.w, ta = uTime;
        vec3 P = vec3(sp, nz);
        float det = smoothstep(14.0, 60.0, r);              // fine detail only where it is resolved
        // granulation: boiling multi-scale plasma cells (hot cells, cooler ember lanes); the finer octaves only
        // where the sphere is large enough to resolve them
        float g1 = n3(P * 3.1 + vec3(s * 7.13, s * 3.71, ta * 2.7));
        float g2 = n3(P.yzx * 6.4 + vec3(ta * 3.3, s * 1.37, -ta * 2.3));
        float g3 = det > 0.35 ? n3(vec3(sp * 13.0, s * 5.3 + ta * 8.0)) : 0.0;
        float gr = 0.55 * g1 + (0.3 * g2 + 0.15 * g3 * nz) * det;
        gn = mix(0.6, smoothstep(-0.5, 0.5, gr), 0.4 + 0.6 * det);
        gm = 0.8 + 0.4 * gn;
        for (int k = 0; k < 3; k++){                      // quark cores: orbiting + per-frame jitter
          float ph = s * 2.39 + float(k) * 2.0944 + ta * (4.0 + 3.0 * fract(s * 0.618));
          vec3 qp = vec3(cos(ph), sin(ph) * cos(s * 1.9), sin(ph) * sin(s * 1.9)) * 0.36;
          qp += (hash33(vec3(s * 13.7, float(k) * 7.1, uFrame)) - 0.5) * 0.15;
          float w = 0.12 + 0.1 * (0.4 - qp.z);
          vec2 dq = sp - qp.xy;
          qs += exp(-dot(dq, dq) / (w * w)) * (0.7 + 0.8 * qp.z);
        }
      } else if (kind < 1.5){                             // distant nucleus: lumpy cluster of cores
        vec2 cl = cells3(vec3(sp * 2.1, nz * 1.5) + b.w * 5.3);
        gm = 0.4 + 1.2 * (1.0 - smoothstep(0.0, 0.75, cl.x));
      }
      float lit = 0.7 + 0.6 * wrap;
      float rim = smoothstep(0.72, 0.97, rr) * (1.0 - 0.6 * smoothstep(0.96, 1.0, rr)) * wrap;
      // granulation: cool lanes sink toward the deep limb colour, hot cells are saturated body colour
      vec3 bodyC = mix(t2 * 0.6, sat1, gn);                // lanes: luminous ember, never brown
      vec3 base = mix(edgeC, bodyC, body);
      vec3 se = base * gm * lit
              + hotC * (core * coreG * (0.6 + 0.4 * gm) + qs * (0.4 + 0.5 * heat) * nz * nz)
              + mix(sat1, hotC, 0.3) * rim * 0.34;
      em = mix(se, meanC, m);
    } else em = meanC;
    float norm = mix(1.0, (r * r) / (R * R), bl);         // energy-conserving spread
    col += T * mx * em * (norm * edge);
    float op = c.a * mix(0.86 + 0.14 * nz, 0.9, m);
    T *= 1.0 - op * edge * norm;
    if (skW > 0.0 && edge < 1.0) T *= 1.0 - c.a * 0.62 * (1.0 - edge);   // skirt continues under the AA edge
  } else if (type < 1.5){
    // ---- streak / trail: head at a.xy, tail at a.xy + e.xy.  e.w = 1: seamless ends (abutting segments
    // of a path sum to a uniform line instead of beading at the joints)
    vec2 tl = e.xy;
    float L2 = max(dot(tl, tl), 1e-4);
    float hr = dot(d, tl) / L2;
    float h = sat(hr);
    float r0 = max(b.x, 0.65);
    float w = r0 + b.y;
    float endW = 1.0;
    vec2 v = d - tl * h;
    if (e.w > 0.5){
      float L = sqrt(L2);
      v = d - tl * hr;
      float s = hr * L;
      endW = sat(0.5 + s / w) * sat(0.5 + (L - s) / w);
    }
    float x2 = dot(v, v) / (w * w);
    if (x2 > 8.0) return;
    float prof = exp(-x2 * 1.7) + 0.06 * exp(-x2 * 0.25);
    float fade = e.z > 0.0 ? pow(1.0 - h, e.z) : 1.0;
    col += T * c.rgb * (prof * fade * endW * (r0 / w));
  } else {
    // ---- glow / flash: hot white core with a coloured falloff
    float r = b.x + b.y * 0.5;
    float x2 = dd / (r * r);
    float win = 1.0 - smoothstep(0.35, 1.0, dd / (a.z * a.z));
    float x = sqrt(x2);
    // e.x: tint of the hot core (0 = white-hot, 1 = the glow's own colour, e.g. a cold-blue positron flash)
    vec3 cn = c.rgb / (max(c.r, max(c.g, c.b)) + 1e-6);
    vec3 g = mix(vec3(1.0, 0.96, 0.9), cn, e.x) * exp(-x2 * 2.5) * 2.0 + c.rgb * (exp(-x * 2.2) * 0.7 + 0.008 / (1.0 + x2));
    float en = b.x / r; en *= en;                          // defocused glows spread their energy
    col += T * g * c.a * win * en;
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
    if (T < 0.01) break;
  }
  if (pending) col += T * layer;
  return col;
}
`;

const MAXS = 8192;          // sprites
const IDXW = 1024, IDXH = 256;
const TILE_CAP = 600;       // max sprites per tile (front-most kept)

export class SpriteBatch {
  // k: pixel scale for widths, thresholds and tiles (E.k: 1.0 at 1080 px on the frame's SHORT side)
  constructor(G, W, H, k = Math.min(W, H) / 1080) {
    this.G = G; this.W = W; this.H = H;
    this.k = k;
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

  // cam: engine camera; dof: {focus, K (CoC px at 1080 for z -> inf), max, scale (optical px scale of the
  // CoC: defaults to k; a portrait reframing that magnifies the image passes the magnification here)}
  begin(cam, dof) {
    this.n = 0;
    this.cam = cam;
    const os = dof.scale ?? this.k;
    this.focus = dof.focus; this.K = dof.K * os; this.cmax = (dof.max ?? 160) * os;
    this.tanH = cam.tanH; this.asp = this.W / this.H;
    this.fogN = dof.fog ? dof.fog[0] : 1e9; this.fogL = dof.fog ? dof.fog[1] : 1e9;
  }
  // extinction of the dense plasma with depth (aerial perspective)
  fog(z) { return z > this.fogN ? Math.exp(-(z - this.fogN) / this.fogL) : 1; }

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

  // glowing sphere. lightC: world point the subsurface light comes from (or null).
  // kind: 0 nucleon (contact skirt when sharp), 1 whole distant nucleus, 2 shutter ghost (flat smear)
  sphere(p, r, rgb, inten, alpha, lightC, heat, seed, kind = 0, pp = null) {
    const q = pp || this.proj(p);
    if (!q) return;
    const [x, y, z, pxs, coc] = q;
    const rp = Math.max(0.6, r * pxs);
    const skirt = kind === 0 && coc < 0.18 * rp ? 0.16 * rp + 1.0 : 0;
    const R = rp + coc * 1.06 + 1.5 + skirt + (kind === 2 ? 0.2 * rp : 0);
    if (!this.onScreen(x, y, R)) return;
    const cluster = kind;
    let lx = 0, ly = 0;
    if (lightC) {
      const l = this.proj(lightC);
      if (l) {
        const ddx = l[0] - x, ddy = l[1] - y, dl = Math.hypot(ddx, ddy);
        const s = Math.min(1, dl / (rp * 0.6 + 1e-3));
        if (dl > 1e-3) { lx = (ddx / dl) * s; ly = (ddy / dl) * s; }
      }
    }
    inten *= this.fog(z);
    this._push([x, y, R, z, rp, coc, z, seed, rgb[0] * inten, rgb[1] * inten, rgb[2] * inten, alpha, lx, ly, heat, cluster],
      x - R, y - R, x + R, y + R, 0);
  }

  // streak from tail (world) to head (world); brightest at the head
  streak(head, tail, r, rgb, inten, fadeExp = 1.0, seed = 0, seam = 0) {
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
    inten *= this.fog(h[2]);
    this._push([h[0], h[1], R, 1e5 + h[2], rp, h[4], h[2], seed, rgb[0] * inten, rgb[1] * inten, rgb[2] * inten, 0, tx, ty, fadeExp, seam],
      minx, miny, maxx, maxy, 1);
  }

  // additive glow (flash) at a world point; r = core radius (world). zBias moves it forward in the
  // depth sort (a flash bursting out between nuclei is not hidden by the ones in front of it).
  glow(p, r, rgb, inten, reach = 3.5, zBias = 0, coreTint = 0) {
    const q = this.proj(p);
    if (!q) return;
    const [x, y, z, pxs, coc] = q;
    const rp = Math.max(0.8, r * pxs);
    const R = (rp + coc * 0.5) * reach;
    if (!this.onScreen(x, y, R)) return;
    inten *= this.fog(z);
    const zs = Math.max(0.3, z - zBias);
    this._push([x, y, R, 2e5 + zs, rp, coc, zs, 0, rgb[0], rgb[1], rgb[2], inten, coreTint, 0, 0, 0], x - R, y - R, x + R, y + R, 0);
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
