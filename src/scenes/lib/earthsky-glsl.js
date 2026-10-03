// Earth sky (coda) shader: the Milky Way core over a dark-sky horizon, and the new star.
// Linear HDR out. Everything is deterministic in "s" space (reference pixels of a 1080x1920 frame, origin at
// the centre, y up) so the sky is identical at any render size; the slow push scales s about uAnchor.
export const EARTHSKY_GLSL = `
uniform vec3 uCR, uCU, uCF;          // camera basis (zoom 1)
uniform float uTan;                  // tan(vertical fov / 2) at zoom 1
uniform float uZoom;                 // push (>= 1)
uniform vec2 uAnchor;                // push anchor, s
uniform vec3 uGC, uGT, uGN;          // galactic frame: centre, +l tangent, +b pole
uniform vec4 uBright[16];            // catalogue stars: sx, sy, magnitude, temperature
uniform int uNBright;
uniform vec2 uNovaS;                 // new star, s
uniform vec2 uNovaLB;                // new star, galactic l, b (deg)
uniform float uNova;                 // new star flux (s-space integrated radiance), 0 = absent
uniform float uExpo;                 // overall sky exposure
uniform float uStarGain;
uniform float uMWGain;
uniform float uHorizonS;             // s.y of the mathematical horizon
uniform vec4 uSegs[96];              // tree limbs: x0,y0,x1,y1
uniform vec4 uRads[96];              // r0, r1
uniform int uNSegs;
uniform vec4 uClumps[80];            // foliage: x, y, r, seed
uniform int uNClumps;
uniform vec4 uBoxes[4];
uniform int uNBoxes;

#define D2R 0.0174532925

vec3 P3(vec2 g, float sc, float off){ return vec3(g.x * sc, g.y * sc, (0.37 * g.x - 0.23 * g.y) * sc + off); }

// ---------------------------------------------------------------- the ridge and the trees (s space)
float n1(float x, float o){ return n3(vec3(x, o, o * 0.37)); }
float ridgeY(float x){
  // gentle hills: a saddle under the core, a rise on the left, a long shoulder on the right
  float h = 14.0 + 10.0 * sin(x * 0.0042 + 0.6) + 7.0 * sin(x * 0.0091 + 2.1) + 4.0 * sin(x * 0.019 + 1.3);
  // (keep in sync with ridgeBase in earthsky.js, which plants the trees)
  h += 26.0 * exp(-pow((x + 330.0) / 170.0, 2.0)) + 16.0 * exp(-pow((x - 380.0) / 220.0, 2.0)) - 16.0 * exp(-pow((x + 20.0) / 160.0, 2.0));
  // scrub and rock along the crest: fine, small-amplitude roughness
  h += 3.2 * n1(x * 0.045, 1.3) + 1.6 * n1(x * 0.11, 5.7) + 0.9 * n1(x * 0.29, 9.1) + 0.5 * n1(x * 0.7, 13.3);
  // low bushes
  float bush = max(0.0, n1(x * 0.021, 21.0) - 0.25) * 14.0;
  h += bush * (0.7 + 0.5 * n1(x * 0.23, 33.0));
  return uHorizonS + h;
}
float sdSeg(vec2 p, vec2 a, vec2 b, float r0, float r1, out float rr){
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  rr = mix(r0, r1, h);
  return length(pa - ba * h);
}
// silhouette coverage at s (1 = solid ground / tree)
float silhouette(vec2 s, float pxs){
  float cov = 0.0;
  if (s.y < uHorizonS + 90.0){
    cov = clamp((ridgeY(s.x) - s.y) / pxs + 0.5, 0.0, 1.0);
    if (cov >= 1.0) return 1.0;
  }
  for (int k = 0; k < 4; k++){
    if (k >= uNBoxes) break;
    vec4 bx = uBoxes[k];
    if (s.x < bx.x || s.x > bx.z || s.y < bx.y || s.y > bx.w) continue;
    for (int i = 0; i < 96; i++){
      if (i >= uNSegs) break;
      float rr;
      float d = sdSeg(s, uSegs[i].xy, uSegs[i].zw, uRads[i].x, uRads[i].y, rr);
      float re = max(rr, 0.5 * pxs);
      float c = clamp((re - d) / pxs + 0.5, 0.0, 1.0) * (rr / re);
      cov = max(cov, c);
    }
    for (int i = 0; i < 80; i++){
      if (i >= uNClumps) break;
      vec4 C = uClumps[i];
      vec2 dp = (s - C.xy) / C.z;
      dp.y *= 1.25;                                   // clumps are flatter than tall
      float d = length(dp);
      if (d > 1.6) continue;
      vec3 q = vec3(s * 0.16, C.w);
      float nz = n3(q) * 0.55 + n3(q * 2.3 + 7.0) * 0.3 + n3(q * 5.1 + 3.0) * 0.18;
      float f = 1.0 - d + nz * 0.75;
      float c = smoothstep(0.30, 0.42, f);
      cov = max(cov, c);
    }
  }
  return cov;
}

// ---------------------------------------------------------------- the Milky Way (galactic l, b in degrees)
float gs2(vec2 g, vec2 c, vec2 sg){ vec2 d = (g - c) / sg; return exp(-0.5 * dot(d, d)); }

// the band's unresolved starlight components (shared by the plate and the star-density plate)
void starlight(vec2 g, float cl, float mott, out float bulgeL, out float diskL, out float cloudL, out float m1){
  float L = g.x, B = g.y;
  float diskP = 0.50 * exp(-B * B / (2.0 * 4.3 * 4.3)) + 0.36 * exp(-abs(B) / 7.0) + 0.10 * exp(-abs(B) / 16.0);
  float disk = exp(-abs(L) / 45.0) * diskP;
  float rb = length(vec2(L / 12.0, (B + 0.8) / 8.2));
  float bulge = exp(-pow(rb, 1.1) * 2.0);
  float clouds = 0.80 * gs2(g, vec2(1.8, -4.2), vec2(3.8, 2.6))       // Large Sagittarius Star Cloud
               + 0.55 * gs2(g, vec2(12.0, -0.9), vec2(1.2, 0.8))      // M24
               + 0.55 * gs2(g, vec2(27.0, -3.0), vec2(3.4, 2.3))      // Scutum Star Cloud
               + 0.25 * gs2(g, vec2(-7.0, -1.5), vec2(4.0, 2.5))      // towards Norma
               + 0.35 * gs2(g, vec2(4.5, 3.6), vec2(2.8, 1.8))        // north of the core
               + 0.30 * gs2(g, vec2(15.0, 4.6), vec2(3.5, 2.0))       // beyond the rift
               + 0.28 * gs2(g, vec2(24.0, 6.0), vec2(3.0, 1.9))
               + 0.30 * gs2(g, vec2(36.0, 3.0), vec2(4.5, 2.6))       // Aquila
               + 0.22 * gs2(g, vec2(20.0, -5.5), vec2(3.0, 2.0));
  m1 = max(0.05, (0.52 + 0.85 * cl) * (0.70 + 0.62 * mott));
  bulgeL = bulge * 1.45; diskL = disk * 0.62; cloudL = clouds * 0.95;
}
// cheaper star density (no warps): drives the faint star layers
float starDensity(vec2 g){
  float cl = fbm3(P3(g, 0.30, 11.0), 3);
  float mott = fbm3(P3(g, 1.05, 19.0), 3);
  float bulgeL, diskL, cloudL, m1;
  starlight(g, cl, mott, bulgeL, diskL, cloudL, m1);
  return (bulgeL + diskL + cloudL) * m1;
}

// returns unextincted diffuse starlight; tau = dust optical depth (V); em = emission nebulae (added after)
vec3 milkyWay(vec2 g, out float tau, out vec3 em, out float dens){
  float L = g.x, B = g.y;
  // large gentle warp + a mid-frequency one for wiggly dust edges
  vec3 pw = P3(g, 0.085, 3.0);
  vec2 w = vec2(n3(pw) + 0.5 * n3(pw * 2.13 + 5.1), n3(pw + vec3(17.1, 5.3, 9.2)) + 0.5 * n3(pw * 2.13 + 11.7)) * 2.6;
  vec3 pm = P3(g, 0.55, 40.0);
  vec2 wm = vec2(n3(pm), n3(pm + vec3(7.7, 3.1, 1.3))) * 0.45;          // (0.65 read as curly smoke)
  vec2 gw = g + w + wm;
  // ---- starlight
  float cl = fbm3(P3(g + w * 0.25, 0.30, 11.0), 3);                    // star clouds, ~3 deg
  float mott = fbm3(P3(g + wm * 0.5, 1.05, 19.0), 3);                  // clumps, ~1 deg
  float bulgeL, diskL, cloudL, m1;
  starlight(g, cl, mott, bulgeL, diskL, cloudL, m1);
  dens = (bulgeL + diskL + cloudL) * m1;
  vec3 cBulge = vec3(1.0, 0.76, 0.52), cDisk = vec3(0.84, 0.90, 1.0), cCloud = vec3(1.0, 0.88, 0.74);
  vec3 star = (bulgeL * cBulge + diskL * cDisk + cloudL * cCloud) * m1;

  // ---- dust: broad soft clouds, long thin lanes along the plane, filaments, fine wisps
  float env = exp(-pow(abs(B - 0.6) / 9.5, 1.8)) * (0.5 + 0.5 * exp(-abs(L) / 50.0));
  float lane = fbm3(P3(gw * vec2(0.6, 1.0), 0.26, 23.0), 4);
  float big = smoothstep(0.07, 0.26, lane);                            // harder-edged lanes
  float zc = fbm3(P3(gw * vec2(0.45, 1.0), 0.55, 37.0), 3);            // zero crossings -> lane network
  float net = 1.0 - smoothstep(0.02, 0.10 + 0.08 * big, abs(zc));
  float netW = smoothstep(-0.05, 0.25, lane) * smoothstep(-0.15, 0.25, n3(P3(gw, 0.42, 51.0)));
  float fil = ridged3(P3(gw, 0.85, 71.0), 3);
  float tFil = smoothstep(0.45, 0.75, fil) * (0.25 + big) * 1.0;
  float wisp = fbm3(P3(gw, 2.2, 5.0), 2);
  float tWisp = smoothstep(-0.02, 0.32, wisp) * (0.15 + 0.85 * big) * 0.5;
  tau = env * (big * 1.15 + net * netW * 1.1 + tFil + tWisp);
  // the dark lane along the plane through the bulge
  float plane = exp(-pow((B - 0.4 - 0.25 * w.y - wm.y) / 1.0, 2.0)) * (1.0 - smoothstep(10.0, 20.0, abs(L)));
  tau += plane * (0.5 + 1.0 * smoothstep(-0.2, 0.3, lane + 0.4 * fil));
  // the Great Rift: north of the plane, running up the band from the Dark Horse
  float bc = 2.4 + 1.0 * n1(L * 0.07, 3.0) + 0.3 * w.x + wm.x;
  float rw = 1.1 + 0.7 * n1(L * 0.09, 8.0);
  float rift = exp(-pow((B - bc) / rw, 2.0)) * smoothstep(4.0, 10.0, L);
  tau += rift * (0.2 + 1.1 * smoothstep(-0.05, 0.3, lane + 0.6 * fil - 0.2));
  // Dark Horse and the Pipe above the bulge on the +b side
  tau += 1.1 * gs2(gw, vec2(2.5, 6.4), vec2(1.8, 1.2)) * (0.4 + 1.2 * smoothstep(0.3, 0.7, fil));
  float stem = abs((gw.y - 4.6) - 0.5 * (gw.x + 2.0));
  tau += 1.4 * exp(-pow(stem / 0.45, 2.0)) * gs2(gw, vec2(-3.0, 3.6), vec2(3.2, 3.5));
  // a dark cloud where the new star will appear, so it reads (feathered, not a hole)
  vec2 dn = (g - uNovaLB) + (w + wm) * 0.3;
  tau += 1.0 * exp(-0.5 * dot(dn / vec2(2.3, 1.5), dn / vec2(2.3, 1.5))) * (0.6 + 0.6 * smoothstep(0.3, 0.7, fil));
  tau = max(tau, 0.0);

  // ---- emission (faint pink knots)
  vec3 ha = vec3(1.0, 0.26, 0.32);
  em = vec3(0.0);
  float near = gs2(g, vec2(10.0, -0.5), vec2(12.0, 5.0));
  if (near > 0.02){
    float nz = n3(P3(g, 2.2, 91.0)) * 0.5 + n3(P3(g, 5.0, 13.0)) * 0.3;
    float lag = gs2(g, vec2(6.0, -1.2), vec2(0.70, 0.36)) * (0.7 + 0.9 * nz) + 1.4 * gs2(g, vec2(5.95, -1.25), vec2(0.10, 0.08));
    float tri = gs2(g, vec2(7.0, -0.25), vec2(0.26, 0.26)) * (0.8 + 0.6 * nz);
    float m17 = gs2(g, vec2(15.1, -0.7), vec2(0.30, 0.18)) * 0.8;
    float m16 = gs2(g, vec2(17.0, 0.8), vec2(0.40, 0.36)) * (0.6 + nz);
    em += ha * (lag * 0.45 + tri * 0.30 + m17 * 0.35 + m16 * 0.22);
    em += vec3(0.45, 0.62, 1.0) * gs2(g, vec2(7.05, 0.12), vec2(0.22, 0.20)) * 0.10;   // Trifid's blue reflection lobe
  }
  // faint diffuse hydrogen along the plane
  float hd = smoothstep(0.1, 0.5, lane * 0.6 + mott * 0.8) * exp(-B * B / 16.0) * exp(-abs(L) / 30.0);
  em += ha * hd * 0.04;
  return star;
}

// ---------------------------------------------------------------- stars (s space)
vec3 starTint(float h){
  vec3 org = vec3(1.0, 0.70, 0.46), wht = vec3(1.0, 0.95, 0.90), blu = vec3(0.74, 0.84, 1.0);
  vec3 c = h < 0.55 ? mix(org, wht, smoothstep(0.0, 0.55, h)) : mix(wht, blu, smoothstep(0.55, 1.0, h));
  return c / dot(c, vec3(0.2126, 0.7152, 0.0722));
}
float magFlux(float m){ return 60.0 * pow(10.0, -0.4 * (m - 1.0)); }   // s-space integrated radiance
float starSigma(float F){ return 0.62 + 0.17 * max(0.0, log2(F / 0.4)); }

// one layer: cells of size cell (s px); flux distribution N(>F) ~ F^-1.1 between Fmin and Fmax
vec3 starLayer(vec2 s, float pxs, float cell, float prob, float Fmin, float Fmax, float seed, float tw){
  vec2 p = s / cell;
  vec3 acc = vec3(0.0);
  float sgMax = max(starSigma(Fmax), 0.6 * pxs);
  float rMax2 = 9.0 * sgMax * sgMax;
  // the 2x2 neighbour block is exact while 3 sigma fits in half a cell; wider splats (low-res previews,
  // landscape, where the 0.6 px floor is wider in s) search the 3x3 block so no tail is clipped at a border
  int nc = 3.0 * sgMax > 0.5 * cell ? 3 : 2;
  vec2 b0 = nc == 3 ? floor(p) - 1.0 : floor(p - 0.5);
  for (int j = 0; j < 3; j++) for (int i = 0; i < 3; i++){
    if (i >= nc || j >= nc) continue;
    vec2 c = b0 + vec2(float(i), float(j));
    vec2 hc = c + seed * 17.13;
    vec3 h3 = hash33(vec3(hc, seed));             // position (xy) and presence (z)
    vec2 d = s - (c + h3.xy) * cell;
    float r2 = dot(d, d);
    if (r2 > rMax2 || h3.z > prob) continue;
    vec3 k3 = hash33(vec3(hc + 9.1, seed + 3.0));  // flux, tint, twinkle phase
    float F = Fmin * pow(mix(pow(Fmax / Fmin, -1.125), 1.0, k3.x), -0.889);
    float sg = max(starSigma(F), 0.6 * pxs);
    float twk = 1.0;
    if (tw > 0.0) twk = 1.0 + tw * (0.6 * sin(uTime * (5.0 + 7.0 * k3.z) + k3.z * 40.0) + 0.4 * sin(uTime * (11.0 + 5.0 * k3.z) + k3.z * 91.0));
    acc += starTint(k3.y) * F * twk / (TAU * sg * sg) * exp(-0.5 * r2 / (sg * sg));
  }
  return acc;
}

// a single star with a photographic halo
vec3 pointStar(vec2 d, float F, vec3 tint, float pxs, float halo){
  float sg = max(starSigma(F), 0.6 * pxs);
  float r2 = dot(d, d);
  float core = exp(-0.5 * r2 / (sg * sg)) / (TAU * sg * sg);
  float R = sg * 5.0;
  float hl = exp(-sqrt(r2) / R) / (TAU * R * R);
  return tint * F * (core + halo * hl);
}

// atmosphere: extinction transmission and airglow at altitude alt (radians)
vec3 atmT(float alt){
  float sa = sin(max(alt, 0.004));
  float X = 1.0 / (sa + 0.50572 * pow(max(alt / D2R, 0.0) + 6.07995, -1.6364));
  return exp(-X * vec3(0.10, 0.135, 0.20) * 0.921);
}
vec3 airglow(float alt, float az){
  float ca = cos(alt);
  float vrG = 1.0 / sqrt(1.0 - 0.9722 * ca * ca);   // 95 km layer (OI 557.7 nm, green)
  float vrR = 1.0 / sqrt(1.0 - 0.9260 * ca * ca);   // 250 km layer (OI 630 nm, red)
  vec3 T = atmT(alt);
  vec4 nn = n4(vec3(az * 6.0, alt * 9.0, 2.0));
  float wave = 0.82 + 0.36 * (nn.r * 2.0 - 1.0);
  vec3 g = vec3(0.38, 1.0, 0.40) * 0.0075 * vrG * wave * exp(-alt / 0.30);
  vec3 r = vec3(1.0, 0.16, 0.12) * 0.0026 * vrR * (0.85 + 0.3 * (nn.b * 2.0 - 1.0)) * smoothstep(0.02, 0.16, alt) * exp(-alt / 0.7);
  vec3 base = vec3(0.55, 0.62, 0.85) * 0.0011;   // natural sky background (zodiacal / scattered starlight)
  return (g * smoothstep(0.0, 0.05, alt) + r + base * vrG * 0.6) * mix(vec3(1.0), T, 0.6);
}

// pixel -> s (push applied), pixel size in s
vec2 sOfPixel(out float pxs){
  vec2 uv = frameUV();
  vec2 s0 = uv * vec2(uFull.x / uFull.y, 1.0) * 960.0;
  pxs = 1920.0 / (uRes.y * uZoom);
  return uAnchor + (s0 - uAnchor) / uZoom;
}
vec3 dirOfS(vec2 s){ vec2 q = s / 960.0 * uTan; return normalize(uCR * q.x + uCU * q.y + uCF); }
vec2 galOf(vec3 d){ return vec2(atan(dot(d, uGT), dot(d, uGC)), asin(clamp(dot(d, uGN), -1.0, 1.0))) / D2R; }

#if defined(PASS_A)
// sky plate A (half resolution, zoom 1, static: rendered once and cached): the diffuse sky as seen through
// the atmosphere (dust-extincted Milky Way + emission, x extinction, + airglow) and the dust depth
void main(){
  float pxs; vec2 s = sOfPixel(pxs);
  if (s.y < uHorizonS - 40.0){ fragColor = vec4(0.0); return; }
  vec3 d = dirOfS(s);
  float alt = asin(clamp(d.y, -1.0, 1.0));
  vec2 g = galOf(d);
  float tau; vec3 em; float dens;
  vec3 mw = milkyWay(g, tau, em, dens);
  vec3 Td = exp(-tau * vec3(0.78, 1.0, 1.30));
  vec3 sky = (mw * Td + em * exp(-tau * 0.5)) * uMWGain * atmT(alt) + airglow(alt, atan(d.x, d.z));
  fragColor = vec4(sky, tau);
}
#elif defined(PASS_C)
// sky plate C (cached): atmospheric transmission (rgb) and the band's star density (a)
void main(){
  float pxs; vec2 s = sOfPixel(pxs);
  if (s.y < uHorizonS - 40.0){ fragColor = vec4(0.0); return; }
  vec3 d = dirOfS(s);
  vec2 g = galOf(d);
  fragColor = vec4(atmT(asin(clamp(d.y, -1.0, 1.0))), starDensity(g));
}
#else
uniform sampler2D uSkyA;
uniform sampler2D uSkyC;
uniform float uPitch;
void main(){
  float pxs; vec2 s = sOfPixel(pxs);
  float cov = silhouette(s, pxs);
  vec3 ground = vec3(0.00012, 0.00014, 0.00018);
  if (cov >= 1.0){ fragColor = vec4(ground, 1.0); return; }

  // the plates are rendered once at zoom 1; the push resamples them (they are half-res and upsampled anyway)
  vec2 puv = s / vec2(960.0 * uFull.x / uFull.y, 960.0) * 0.5 + 0.5;
  vec4 A = texture(uSkyA, puv);
  vec4 C = texture(uSkyC, puv);
  vec3 T = C.rgb;
  float dens = C.a;
  float tau = A.a;
  // full-resolution dust grain on top of the half-resolution lanes (sky-fixed: s space)
  vec3 pf = vec3(s * 0.2, 61.0 + s.x * 0.031);
  float fine = n3(pf) * 0.6 + n3(pf * 2.1 + 9.0) * 0.4;
  float tf = max(0.0, fine + 0.15) * 0.55 * smoothstep(0.15, 1.2, tau);
  vec3 Tf = exp(-tf * vec3(0.78, 1.0, 1.30));
  vec3 sky = A.rgb * Tf;
  vec3 Td = exp(-(tau + tf) * vec3(0.78, 1.0, 1.30));
  float alt = uPitch + atan(s.y / 960.0 * uTan);

  // stars: faint layers follow the band's density and sit behind the dust; bright ones are foreground
  float dn = clamp(dens * 1.6, 0.0, 3.0);
  float low = 1.0 - smoothstep(0.02, 0.22, alt);          // more scintillation low in the sky
  vec3 st = vec3(0.0);
  st += starLayer(s, pxs, 4.5, 0.85, 0.0022, 0.022, 1.0, 0.0) * (3.5 + 40.0 * dn) * Td;
  st += starLayer(s, pxs, 10.0, 0.80, 0.022, 0.14, 2.0, 0.0) * (1.6 + 8.0 * dn) * Td;
  float nd = length(s - uNovaS);
  float clear = smoothstep(6.0, 14.0, nd);                // keep the new star's spot empty
  vec3 Tdh = sqrt(Td);
  st += starLayer(s, pxs, 24.0, 0.80, 0.14, 0.88, 3.0, 0.02) * (0.6 + 0.6 * min(dn, 1.5)) * Tdh * clear;
  st += starLayer(s, pxs, 64.0, 0.80, 0.88, 6.9, 4.0, 0.035 + 0.05 * low) * mix(vec3(1.0), Tdh, 0.5) * clear;
  st += starLayer(s, pxs, 170.0, 0.25, 6.9, 12.0, 5.0, 0.045 + 0.06 * low) * clear;
  for (int i = 0; i < 16; i++){
    if (i >= uNBright) break;
    vec2 dd = s - uBright[i].xy;
    if (dot(dd, dd) > 2500.0) continue;
    float F = magFlux(uBright[i].z);
    float h = uBright[i].w;
    float tw = 1.0 + (0.04 + 0.07 * low) * (0.6 * sin(uTime * (6.3 + h * 0.0003) + h) + 0.4 * sin(uTime * 13.7 + h * 0.37));
    vec3 tint = mix(vec3(1.0), blackbody(h) / max(luma(blackbody(h)), 1e-3), 0.55);
    tint /= luma(tint);
    st += pointStar(dd, F * tw, tint, pxs, 0.5);
  }
  sky += st * uStarGain * T;

  // the new star: a warm-white point (it does not grow, it brightens) with a faint gold photographic halo
  if (uNova > 0.0){
    vec2 dd = s - uNovaS;
    float r2 = dot(dd, dd), r = sqrt(r2);
    float sg = max(1.25, 0.6 * pxs);
    vec3 nv = vec3(1.0, 0.96, 0.90) * uNova * exp(-0.5 * r2 / (sg * sg)) / (TAU * sg * sg);
    vec3 gold = vec3(1.0, 0.70, 0.36);
    nv += gold * uNova * (0.10 * exp(-r / 4.5) / (TAU * 20.25) + 0.06 * exp(-r / 15.0) / (TAU * 225.0) + 0.025 * exp(-r / 50.0) / (TAU * 2500.0));
    sky += nv * mix(T, vec3(luma(T)), 0.75);
  }

  sky *= uExpo;
  fragColor = vec4(mix(sky, ground, cov), 1.0);
}
#endif
`;
