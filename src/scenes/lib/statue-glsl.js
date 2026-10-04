// Shaders for the marble statue: mesh passes (G-buffer, shadow depth) and fullscreen passes (marble lighting, FXAA,
// mask downsample, blur, the Helios crown of light, final composite with the aura).
// Spaces: head space H (mesh); world W = R_y(yaw) H (camera and lights live here); light space for the key's shadow map.
import { frag, HEADER, COMMON, NOISE, COLOR } from '../../engine/glsl.js';

// the lighting pass writes two targets: radiance (+ view depth) and an aux mask (light falloff) for the aura
const fragMRT = (...chunks) => [HEADER.replace('out vec4 fragColor;', 'layout(location=0) out vec4 fragColor;\nlayout(location=1) out vec4 fragAux;'), COMMON, NOISE, COLOR, ...chunks].join('\n');

// ---------------------------------------------------------------- mesh passes
export const GBUF_VS = `#version 300 es
layout(location=0) in vec3 aP;
layout(location=1) in vec3 aN;
layout(location=2) in vec4 aB;
uniform mat4 uMVP;          // head -> clip (yaw, view, projection)
out vec3 vP; out vec3 vN; out vec4 vB;
void main(){ vP = aP; vN = aN; vB = aB; gl_Position = uMVP * vec4(aP, 1.0); }`;

export const GBUF_FS = `#version 300 es
precision highp float;
in vec3 vP; in vec3 vN; in vec4 vB;
layout(location=0) out vec4 oP;   // head-space position, w = 1 (0 = background)
layout(location=1) out vec4 oN;   // head-space normal
layout(location=2) out vec4 oB;   // ao, cavity, thickness, skin
void main(){ oP = vec4(vP, 1.0); oN = vec4(normalize(vN), 1.0); oB = vB; }`;

export const SHADOW_VS = `#version 300 es
layout(location=0) in vec3 aP;
uniform mat4 uLMat;         // head -> light clip (orthographic)
void main(){ gl_Position = uLMat * vec4(aP, 1.0); }`;

export const SHADOW_FS = `#version 300 es
precision mediump float;
void main(){}`;

// ---------------------------------------------------------------- marble lighting (deferred, once per pixel)
export const LIGHT_FS = fragMRT(`
precision highp sampler2DShadow;
uniform sampler2D uGP; uniform sampler2D uGN; uniform sampler2D uGB;
uniform sampler2DShadow uSh; uniform sampler2D uVsm;
uniform mat4 uLMat;          // head -> key light clip
uniform float uShDepth;      // light-space depth range, head units (depth difference -> distance)
uniform float uShTexel;      // shadow texel, head units
uniform float uPenUV;        // PCF radius in shadow uv
uniform vec3 uCamH;          // camera position, head space
uniform vec3 uFwdH;          // camera forward, head space
uniform vec3 uKeyDir; uniform vec3 uKeyCol;
uniform vec3 uFillDir; uniform vec3 uFillCol;
uniform vec3 uRimDir; uniform vec3 uRimCol;
uniform vec3 uRim2Dir; uniform vec3 uRim2Col;
uniform vec3 uUnderDir; uniform vec3 uUnderCol;
uniform vec3 uFrontCol;      // soft fill from the lens axis: lifts the eye sockets just enough to read the gaze
uniform vec3 uAmb;
uniform vec3 uHoles[7]; uniform vec3 uHoleCol; uniform float uHoleR;
uniform vec4 uMarble;        // vein strength, vein scale, gloss, translucency
uniform vec3 uMfp;           // translucency length per channel (head units)
uniform vec3 uTint;          // albedo tint (stone colour)
uniform vec3 uSssTint;       // colour of light that has travelled through the stone
uniform vec4 uCut[3];        // cut planes other than the base (xyz outward normal, w = offset): the flat caps and the
                             // stone just inside them fall into black (Prometheus' relief-slab cuts)
uniform vec2 uSpot;          // head-space height where the light falls away (the bust fades into the black below the neck)
uniform vec2 uSpotR;         // ... and the radius around the head where it falls away (shoulders, the slab, the back)
uniform int uDebug;          // 0 off; 1 key visibility, 2 key thickness, 3 ao, 4 normal, 5 cavity/thick/skin, 6 veins

const vec2 POI[8] = vec2[8](
  vec2(-0.613, 0.617), vec2( 0.170,-0.040), vec2(-0.299,-0.792), vec2( 0.645, 0.493),
  vec2(-0.651,-0.205), vec2( 0.421,-0.700), vec2( 0.040, 0.947), vec2( 0.966,-0.105));

float D_GGX(float NoH, float a){ float a2 = a * a; float d = NoH * NoH * (a2 - 1.0) + 1.0; return a2 / (PI * d * d); }
float V_Smith(float NoV, float NoL, float a){
  float a2 = a * a;
  float gv = NoL * sqrt(NoV * NoV * (1.0 - a2) + a2), gl = NoV * sqrt(NoL * NoL * (1.0 - a2) + a2);
  return 0.5 / max(gv + gl, 1e-5);
}
float specGGX(vec3 N, vec3 V, vec3 L, float rough){
  vec3 H = normalize(V + L);
  float NoL = sat(dot(N, L)), NoV = max(dot(N, V), 1e-3), NoH = sat(dot(N, H)), VoH = sat(dot(V, H));
  float a = rough * rough;
  float F = 0.035 + 0.965 * pow(1.0 - VoH, 5.0);
  return D_GGX(NoH, a) * V_Smith(NoV, NoL, a) * F * NoL;
}
// polished-but-aged stone: a broad low-gloss lobe everywhere plus a tighter polish lobe on the carved skin
float specStone(vec3 N, vec3 V, vec3 L, float rough, float polish){
  vec3 H = normalize(V + L);
  float NoL = sat(dot(N, L)), NoV = max(dot(N, V), 1e-3), NoH = sat(dot(N, H)), VoH = sat(dot(V, H));
  float F = 0.035 + 0.965 * pow(1.0 - VoH, 5.0);
  float a = rough * rough, b = 0.24 * 0.24;
  float s = D_GGX(NoH, a) * V_Smith(NoV, NoL, a) + polish * 0.3 * D_GGX(NoH, b) * V_Smith(NoV, NoL, b);
  return s * F * NoL;
}
float wrapD(float nl, float w){ return sat((nl + w) / (1.0 + w)); }

// faint grey Carrara veining, locked to the stone (head space), drawn out in long tilted drifts.
// fp = pixel footprint in head units (veins soften instead of aliasing when small on screen).
float veins(vec3 P, float fp, out float cloud){
  vec3 q = vec3(P.x * 0.95 + P.y * 0.2, P.y * 0.7 - P.z * 0.15, P.z * 0.95 + P.x * 0.2) * uMarble.y + vec3(3.1, 7.7, 1.9);
  vec4 wa = n4(q * 0.55), wb = n4(q * 0.55 + 17.3);
  vec3 w = vec3(wa.r, wb.r, wa.b) * 2.0 - 1.0;
  float f = fbm3(q + w * 1.4, 3);
  float g = uMarble.y * 1.4;                       // ~|grad f| in head units
  float w1 = 0.03 + fp * g * 1.5;
  float v1 = exp(-f * f / (w1 * w1));               // soft-edged main veins
  float f2 = fbm3(q * 2.7 + w * 2.4 + 11.0, 2);
  float w2 = 0.016 + fp * g * 4.0;
  float v2 = exp(-f2 * f2 / (w2 * w2));             // fine branching threads
  cloud = smoothstep(-0.2, 0.45, wb.b * 2.0 - 1.0); // veins gather in drifts
  return (v1 * 0.55 * (0.35 + 0.65 * cloud) + v2 * 0.4 * cloud) * (0.5 + 0.5 * smoothstep(0.3, 0.7, wa.g));
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec4 gp = texture(uGP, uv);
  vec3 P = gp.xyz;
  float fp = min(max(length(dFdx(P)), length(dFdy(P))), 0.02);
  if (gp.w < 0.5) { fragColor = vec4(0.0); fragAux = vec4(0.0); return; }
  vec3 N = normalize(texture(uGN, uv).xyz);
  vec4 bk = texture(uGB, uv);
  float ao = bk.r, cav = bk.g, thick = bk.b, skin = bk.a;
  vec3 V = normalize(uCamH - P);
  vec3 Ng = N;
  // the stone's surface: fine weathered relief (pores, rasp marks, crystal grain), faded out below a pixel
  float bf1 = 1.0 - smoothstep(0.3, 0.8, fp * 120.0);
  float bf2 = 1.0 - smoothstep(0.3, 0.8, fp * 430.0);
  if (bf1 > 0.0){
    vec4 a = n4(P * 120.0), b = n4(P.zxy * 120.0 + 9.1);
    vec3 bump = (vec3(a.r, b.r, a.b) - 0.5) * 0.10 * bf1;
    if (bf2 > 0.0){
      vec4 c = n4(P.yzx * 430.0 + 3.7);
      bump += (vec3(c.r, c.b, b.b) - 0.5) * 0.07 * bf2;
    }
    bump *= mix(1.4, 0.8, skin);
    N = normalize(N + bump - N * dot(bump, N));
  }
  // interpolated normals can face slightly away at silhouettes: bend them back toward the viewer
  float nv = dot(N, V);
  if (nv < 0.02) N = normalize(N + V * (0.02 - nv));
  float NoV = sat(dot(N, V));

  // ---- stone: white Carrara, faint grey veins, a breath of warm age in the hollows, darker cavities
  float crev = smoothstep(0.48, 0.14, cav);
  float ridge = smoothstep(0.55, 0.85, cav);
  float cloud;
  float vn = veins(P, fp, cloud) * uMarble.x;
  vec4 mo = n4(P * 6.0 + 2.0);
  float mott = (mo.r - 0.5) + (mo.b - 0.5) * 0.6;
  vec3 alb = uTint * (0.82 + 0.06 * mott) * mix(vec3(1.0), vec3(0.985, 0.99, 1.0), cloud);
  alb = mix(alb, vec3(0.52, 0.54, 0.58), vn);
  alb *= mix(1.0, 0.6, crev);
  alb = mix(alb, alb * vec3(0.93, 0.86, 0.76), sat((1.0 - ao) * 1.4) * 0.7);
  alb *= 1.0 + 0.05 * ridge;
  float rough = mix(0.62, 0.42, skin) * (1.0 + 0.25 * (mo.b - 0.5)) + 0.08 * crev;
  rough = clamp(rough, 0.25, 0.9);
  float gloss = uMarble.z * mix(0.45, 1.0, skin) * (1.0 - 0.6 * crev) * (1.0 - 0.5 * vn);
  float polish = skin * (1.0 - crev);

  // ---- key: hard light, shadow-mapped (PCF), translucent shadow map for light bleeding through thin stone
  vec3 sp = (uLMat * vec4(P + Ng * uShTexel * 1.8, 1.0)).xyz * 0.5 + 0.5;
  float rot = ign(gl_FragCoord.xy) * TAU;
  mat2 R = rot2(rot);
  float vis = 0.0;
  float bias = uShTexel * 0.6 / uShDepth;
  for (int i = 0; i < 8; i++) vis += texture(uSh, vec3(sp.xy + R * POI[i] * uPenUV, sp.z - bias));
  vis *= 0.125;
  // diffusion + translucency from the pre-blurred moments map (variance shadow map, one smooth fetch):
  // visW = the key's visibility averaged over the stone's diffusion length (light that entered nearby re-emerges here:
  // marble's soft glow at every shadow edge and terminator); dth = mean stone between here and the lit surface
  vec3 mc = texture(uVsm, sp.xy).rgb;
  vec2 mm = mc.b > 1e-3 ? mc.rg / mc.b : vec2(1.0, 1.0);
  float zr = sp.z - bias * 4.0;
  float var = max(mm.y - mm.x * mm.x, 2e-7);
  float dz = zr - mm.x;
  float visW = dz <= 0.0 ? 1.0 : smoothstep(0.4, 1.0, var / (var + dz * dz));
  float dth = max(dz, 0.0) * uShDepth;
  float NoL = dot(N, uKeyDir), NgL = dot(Ng, uKeyDir);
  float kd = uMarble.w * mix(0.14, 0.28, skin);
  vec3 trans = exp(-dth / uMfp) * (1.0 - vis) * sat(0.3 - 0.7 * NgL);
  float aoK = mix(ao * ao, ao, skin);                 // the curls swallow light; the polished skin stays open
  vec3 Ed = vis * wrapD(NoL, 0.04) * (1.0 - kd) + uSssTint * (visW * wrapD(NgL, 0.3) * kd + trans * 0.6 * uMarble.w);
  vec3 E = uKeyCol * Ed * mix(1.0, aoK, 0.55);
  vec3 S = uKeyCol * vis * specStone(N, V, uKeyDir, rough, polish);

  // ---- fill (dim, broad), lens-axis fill, ambient
  E += uFillCol * wrapD(dot(N, uFillDir), 0.6) * ao;
  E += uFrontCol * (0.3 + 0.7 * NoV) * ao * ao;
  E += uAmb * ao;

  // ---- coloured rims from behind: wrapped diffuse, sheen and light through the thin edges (ears, curls, nostrils)
  float tU = thick * 0.12;
  vec3 tT = exp(-tU / (uMfp * 1.4));
  float edge = smoothstep(0.05, 0.75, 1.0 - NoV);     // rims belong to the edges of the form
  float aoR = ao * ao * edge;
  float r1 = dot(N, uRimDir), r2 = dot(N, uRim2Dir);
  E += uRimCol * (wrapD(r1, 0.12) * aoR + tT * sat(0.45 - 0.55 * r1) * 0.55 * uMarble.w * ao);
  S += uRimCol * specGGX(N, V, uRimDir, min(rough * 1.25, 0.9)) * aoR * 0.45;
  E += uRim2Col * (wrapD(r2, 0.12) * aoR + tT * sat(0.45 - 0.55 * r2) * 0.55 * uMarble.w * ao);
  S += uRim2Col * specGGX(N, V, uRim2Dir, min(rough * 1.25, 0.9)) * aoR * 0.45;
  // ---- under light (Prometheus: the stolen fire below)
  float ul = dot(N, uUnderDir);
  E += uUnderCol * (sat(ul) * ao + tT * sat(0.4 - 0.6 * ul) * 0.4 * uMarble.w);
  S += uUnderCol * specGGX(N, V, uUnderDir, rough) * ao;
  // ---- Sol: the restored rays light the curls around the diadem
  if (uHoleR > 0.0){
    for (int i = 0; i < 7; i++){
      vec3 d = uHoles[i] - P; float d2 = dot(d, d);
      vec3 Lh = d * inversesqrt(max(d2, 1e-6));
      float k = 1.0 / (1.0 + d2 / (uHoleR * uHoleR));
      E += uHoleCol * k * (wrapD(dot(N, Lh), 0.35) * ao + tT * 0.3);
    }
  }
  float spot = smoothstep(uSpot.x, uSpot.y, P.y) * (1.0 - smoothstep(uSpotR.x, uSpotR.y, length(P - vec3(0.0, -0.1, 0.05))));
  for (int i = 0; i < 3; i++){
    if (uCut[i].w > 9.0) continue;
    float dpl = uCut[i].w - dot(P, uCut[i].xyz);            // depth inside the cut (>= 0)
    float cap = smoothstep(0.85, 0.97, dot(Ng, uCut[i].xyz)) * (1.0 - smoothstep(0.004, 0.02, dpl));
    spot *= (1.0 - cap) * smoothstep(0.0, 0.16, dpl + 0.002);
  }
  vec3 col = (alb * E + S * gloss) * spot * spot;
  if (uDebug == 1) col = vec3(vis);
  else if (uDebug == 2) col = vec3(dth * 20.0, exp(-dth / uMfp.g), 0.0);
  else if (uDebug == 3) col = vec3(ao);
  else if (uDebug == 4) col = N * 0.5 + 0.5;
  else if (uDebug == 5) col = vec3(cav, thick, skin);
  else if (uDebug == 6) col = vec3(1.0 - vn);
  else if (uDebug == 7) col = vec3(visW, vis, mm.x);
  else if (uDebug == 8) col = vec3(dz * 30.0, -dz * 30.0, sqrt(var) * 30.0);
  else if (uDebug == 9) col = vec3(mm.x, sp.z, mm.y);
  else if (uDebug == 10) col = vec3(vis * wrapD(NoL, 0.04) * (1.0 - kd), visW * wrapD(NgL, 0.3) * kd * 3.0, trans.g * 0.6 * 3.0);
  else if (uDebug == 11) col = E;
  fragColor = vec4(col, max(dot(P - uCamH, uFwdH), 1e-3));
  fragAux = vec4(spot, 0.0, 0.0, 1.0);
}`);

// ---------------------------------------------------------------- variance shadow map (cached with the key's depth map)
// moments of the key's depth over 2x2 texels, then blurred to the stone's diffusion length
export const MOMENTS_FS = frag(`
uniform sampler2D uDepth;
void main(){
  ivec2 b = ivec2(gl_FragCoord.xy) * 2;
  // background texels (nothing drawn: depth 1) carry no weight, so the blurred moments describe only the stone
  float m1 = 0.0, m2 = 0.0, c = 0.0;
  for (int y = 0; y < 2; y++) for (int x = 0; x < 2; x++){
    float d = texelFetch(uDepth, b + ivec2(x, y), 0).r;
    float w = step(d, 0.99999);
    m1 += d * w; m2 += d * d * w; c += w;
  }
  fragColor = vec4(m1 * 0.25, m2 * 0.25, c * 0.25, 1.0);
}`);
export const VBLUR_FS = frag(`
uniform sampler2D uSrc; uniform vec2 uDir;
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 t = uDir / uRes;
  vec4 s = texture(uSrc, uv) * 0.2;
  for (int i = 1; i <= 4; i++){ float w = exp(-float(i * i) / 8.0) * 0.2; s += (texture(uSrc, uv + t * float(i)) + texture(uSrc, uv - t * float(i))) * w; }
  float norm = 0.2; for (int i = 1; i <= 4; i++) norm += 2.0 * exp(-float(i * i) / 8.0) * 0.2;
  fragColor = s / norm;
}`);

// ---------------------------------------------------------------- FXAA (in a tonemapped space, alpha passes through),
// folded into the composite pass
const FXAA = `
vec3 fxTm(vec3 c){ return c / (1.0 + max(c.r, max(c.g, c.b))); }
vec3 fxItm(vec3 c){ return c / max(1.0 - max(c.r, max(c.g, c.b)), 1e-3); }
float fxL(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
vec4 fxaa(sampler2D src, vec2 uv, vec2 px){
  vec4 cM = texture(src, uv);
  vec3 nw = fxTm(texture(src, uv + vec2(-1.0, 1.0) * px).rgb), ne = fxTm(texture(src, uv + vec2(1.0, 1.0) * px).rgb);
  vec3 sw = fxTm(texture(src, uv + vec2(-1.0, -1.0) * px).rgb), se = fxTm(texture(src, uv + vec2(1.0, -1.0) * px).rgb);
  vec3 m = fxTm(cM.rgb);
  float lNW = fxL(nw), lNE = fxL(ne), lSW = fxL(sw), lSE = fxL(se), lM = fxL(m);
  float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE)));
  float lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
  if (lMax - lMin < max(0.02, lMax * 0.08)) return cM;
  vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), (lNW + lSW) - (lNE + lSE));
  float red = max((lNW + lNE + lSW + lSE) * 0.25 * 0.125, 1.0 / 128.0);
  float rcp = 1.0 / (min(abs(dir.x), abs(dir.y)) + red);
  dir = clamp(dir * rcp, vec2(-8.0), vec2(8.0)) * px;
  vec3 a = 0.5 * (fxTm(texture(src, uv + dir * (1.0 / 3.0 - 0.5)).rgb) + fxTm(texture(src, uv + dir * (2.0 / 3.0 - 0.5)).rgb));
  vec3 b = a * 0.5 + 0.25 * (fxTm(texture(src, uv - dir * 0.5).rgb) + fxTm(texture(src, uv + dir * 0.5).rgb));
  float lB = fxL(b);
  return vec4(fxItm((lB < lMin || lB > lMax) ? a : b), cM.a);
}`;

// ---------------------------------------------------------------- quarter-res mask: coverage, mean radiance, depth
export const DOWN4_FS = frag(`
uniform sampler2D uSrc; uniform sampler2D uAux; uniform vec2 uSrcRes;
void main(){
  ivec2 b = ivec2(gl_FragCoord.xy) * 4;
  ivec2 mx = ivec2(uSrcRes) - 1;
  float cov = 0.0, w = 0.0, zs = 0.0;
  for (int y = 0; y < 4; y++) for (int x = 0; x < 4; x++){
    ivec2 q = min(b + ivec2(x, y), mx);
    float a = texelFetch(uSrc, q, 0).a;
    float c = step(1e-4, a);
    cov += c; w += texelFetch(uAux, q, 0).r * c; zs += a * c;
  }
  // r: coverage, g: coverage weighted by the light falloff (the aura rises only from the lit head),
  // b: coverage-weighted depth (b / r stays a true mean depth under bilinear filtering)
  fragColor = vec4(cov / 16.0, w / 16.0, zs / 16.0, 1.0);
}`);

// separable gaussian (9 bilinear taps ~ 17 texels), radius scale uStep in source texels
export const BLUR_FS = frag(`
uniform sampler2D uSrc; uniform vec2 uDir; uniform vec2 uSrcRes;
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 t = uDir / uSrcRes;
  vec4 s = texture(uSrc, uv) * 0.16;
  s += (texture(uSrc, uv + t * 1.4) + texture(uSrc, uv - t * 1.4)) * 0.15;
  s += (texture(uSrc, uv + t * 3.3) + texture(uSrc, uv - t * 3.3)) * 0.12;
  s += (texture(uSrc, uv + t * 5.2) + texture(uSrc, uv - t * 5.2)) * 0.085;
  s += (texture(uSrc, uv + t * 7.1) + texture(uSrc, uv - t * 7.1)) * 0.065;
  fragColor = s;
}`);

// ---------------------------------------------------------------- the Helios crown: shafts of light from the diadem
// Each ray is a volumetric beam springing from a drilled hole: closest approach of the view ray to the beam axis,
// a gaussian cross-section widening along its length, soft falloff, slow breathing, fine filaments drifting outward;
// hidden where it passes behind the marble (scene depth from the lit pass).
export const RAYS_FS = frag(`
uniform sampler2D uLit;          // alpha = view depth (0 = background)
uniform vec3 uRayP[7]; uniform vec3 uRayD[7]; uniform float uRayI[7];
uniform vec4 uRayShape;          // length, start width, end width, falloff
uniform vec3 uRayCol; uniform vec3 uRayCore;
uniform float uRayT;             // animation clock, seconds
void main(){
  vec2 uv = frameUV();
  vec3 ro = uCamPos, rd = cameraRay(uv);
  float cosF = dot(rd, uCamRot[2]);
  float sz = texture(uLit, gl_FragCoord.xy / uRes).a;
  vec3 acc = vec3(0.0);
  float Lr = uRayShape.x;
  for (int i = 0; i < 7; i++){
    vec3 P = uRayP[i], D = uRayD[i];
    vec3 w0 = ro - P;
    float b = dot(rd, D), d = dot(rd, w0), e = dot(D, w0);
    float den = max(1.0 - b * b, 1e-4);
    float s = clamp((e - b * d) / den, 0.0, Lr * 1.4);
    vec3 X = P + D * s;
    float t = max(dot(X - ro, rd), 0.0);
    float dist = length(ro + rd * t - X);
    float sl = s / Lr;
    float w = mix(uRayShape.y, uRayShape.z, sat(sl));
    if (dist > 8.0 * w) continue;
    float prof = exp(-dist * dist / (w * w));
    float halo = exp(-dist * dist / (12.0 * w * w)) * 0.3;
    float along = smoothstep(0.0, 0.05, sl) * exp(-sl * uRayShape.w) * (1.0 - smoothstep(0.75, 1.4, sl));
    // filaments: streaks running along the beam, drifting outward
    vec3 ax = normalize(cross(D, vec3(0.0, 0.0, 1.0)) + 1e-4);
    float ang = dot(ro + rd * t - X, ax) / w;
    float fil = 0.72 + 0.28 * n3(vec3(ang * 2.2 + float(i) * 7.3, sl * 3.0 - uRayT * 0.35, float(i) * 3.1));
    float I = uRayI[i] * along * (uRayShape.y / w) * (prof * fil + halo);
    float vz = t * cosF;
    float occ = sz > 0.0 ? smoothstep(-0.004, 0.012, sz - vz) : 1.0;
    acc += mix(uRayCol, uRayCore, prof * prof * (1.0 - sl)) * I * occ;
  }
  fragColor = vec4(acc, 1.0);
}`);

// ---------------------------------------------------------------- composite: marble + aura + crown into the scene target
export const COMP_FS = frag(FXAA, `
uniform sampler2D uLit;          // lit marble (antialiased here), alpha = view depth
uniform sampler2D uM4;           // quarter-res: coverage, lit-weighted coverage, coverage x depth
uniform sampler2D uG1; uniform sampler2D uG2;   // blurred coverage (two radii)
uniform sampler2D uRays; uniform float uHasRays;
uniform vec3 uAuraCol; uniform vec3 uAuraCol2;
uniform vec4 uAura;              // glow near, glow wide, corona, streaks
uniform vec2 uCorona;            // corona centre (frameUV)
uniform float uCoronaR;          // corona radius (half frame heights)
uniform float uGain;             // overall exposure envelope
uniform vec4 uGrad;              // darken toward the bottom: none above y0, full below y1 (frameUV, y1 < y0), amount
uniform float uAuraT;
uniform vec2 uDof;               // CoC scale (1080-px units x head units), focus distance; x = 0: no depth of field
uniform sampler2D uDofA; uniform sampler2D uDofB;   // the lit marble blurred (~6 px and ~16 px at 1080)
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 fu = frameUV();
  vec4 s = fxaa(uLit, uv, 1.0 / uRes);
  vec3 col = s.rgb;
  if (uDof.x > 0.0){
    // gather depth of field: the stone's own depth, or for the black around it the nearest stone's (so an in-focus
    // silhouette stays crisp and an out-of-focus one spreads softly into the black)
    vec4 mq = texture(uG1, uv);                       // blurred quarter-res coverage / coverage x depth
    float d = s.a > 0.0 ? s.a : (mq.r > 0.02 ? mq.b / mq.r : 0.0);
    float coc = d > 0.0 ? uDof.x * abs(d - uDof.y) / (d * uDof.y) : 0.0;
    col = mix(col, texture(uDofA, uv).rgb, smoothstep(1.6, 7.0, coc));
    col = mix(col, texture(uDofB, uv).rgb, smoothstep(7.0, 18.0, coc));
  }
  float m = texture(uM4, uv).r;
  float g1 = texture(uG1, uv).g, g2 = texture(uG2, uv).g;
  vec2 q = (fu - uCorona) * vec2(frameAspect(), 1.0);
  float r = length(q) / max(uCoronaR, 1e-3);
  vec3 aura = uAuraCol * (uAura.x * g1 * g1 + uAura.y * g2 * g2);
  if (uAura.z > 0.0 && r < 2.5){
    // corona: a soft radiance centred behind the head, with slow streamers
    vec2 dq = q / max(length(q), 1e-4);
    float streak = 0.62 + 0.38 * (0.6 * n3(vec3(dq * 9.0, r * 0.7 - uAuraT * 0.05)) + 0.4 * n3(vec3(dq * 23.0 + 3.0, r * 1.3 - uAuraT * 0.09)));
    streak = mix(1.0, streak, uAura.w);
    aura += mix(uAuraCol2, uAuraCol, sat(r)) * uAura.z * exp(-r * r * 3.0) * streak;
  }
  float outside = 1.0 - smoothstep(0.0, 1.0, m) * 0.97;
  col += aura * outside;
  if (uHasRays > 0.5) col += texture(uRays, uv).rgb;
  col *= uGain;
  if (uGrad.z > 0.0) col *= 1.0 - uGrad.z * (1.0 - smoothstep(uGrad.y, uGrad.x, fu.y));
  fragColor = vec4(max(col, 0.0), 1.0);
}`);
