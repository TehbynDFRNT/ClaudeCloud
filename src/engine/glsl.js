// Shared GLSL. Scenes build fragment shaders as: HEADER + chunks + their own main().
// Conventions
//  * Output linear HDR radiance (no tonemapping in scenes). 1.0 ~ "white paper" exposure;
//    stars/plasma may exceed 50. Post handles bloom, tonemap and grain.
//  * Screen coordinates: use frameUV() -> [-1,1] across the FULL 16:9 output frame (y up),
//    independent of render scale and letterbox. Letterbox crops; it never rescales.
//  * Camera: cameraRay(frameUV()) using uCamPos/uCamRot/uTanHalfFov (set via E.camera()).

export const HEADER = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler3D;
uniform vec2 uRes;          // render target size in pixels
uniform vec2 uFull;         // full output frame size in pixels (e.g. 1920x1080)
uniform float uK;           // output pixel scale: 1 at 1080p, 2 at 2160p (0 if unset: treated as 1)
uniform float uTime;        // film time, seconds
uniform float uLocal;       // seconds since shot start
uniform float uDur;         // shot duration, seconds
uniform float uU;           // shot progress 0..1
uniform float uFrame;       // film frame index
uniform float uSeed;        // per-shot seed
uniform sampler3D uNoise;   // RGBA: perlin8, worleyF1(8), perlin16, worleyF2-F1(8)
uniform vec3 uCamPos;
uniform mat3 uCamRot;       // columns: right, up, forward
uniform float uTanHalfFov;  // tan(vertical fov / 2)
out vec4 fragColor;
#define PI 3.14159265359
#define TAU 6.28318530718
`;

export const COMMON = `
float sat(float x){ return clamp(x,0.,1.); }
vec3 sat3(vec3 x){ return clamp(x,0.,1.); }
float remap(float x,float a,float b,float c,float d){ return c+(d-c)*clamp((x-a)/(b-a),0.,1.); }
float luma(vec3 c){ return dot(c, vec3(0.2126,0.7152,0.0722)); }
mat2 rot2(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
mat3 rotX(float a){ float c=cos(a),s=sin(a); return mat3(1,0,0, 0,c,s, 0,-s,c); }
mat3 rotY(float a){ float c=cos(a),s=sin(a); return mat3(c,0,-s, 0,1,0, s,0,c); }
mat3 rotZ(float a){ float c=cos(a),s=sin(a); return mat3(c,s,0, -s,c,0, 0,0,1); }
float hash11(float p){ p=fract(p*.1031); p*=p+33.33; p*=p+p; return fract(p); }
float hash12(vec2 p){ vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
float hash13(vec3 p3){ p3=fract(p3*.1031); p3+=dot(p3,p3.zyx+31.32); return fract((p3.x+p3.y)*p3.z); }
vec3 hash33(vec3 p3){ p3=fract(p3*vec3(.1031,.1030,.0973)); p3+=dot(p3,p3.yxz+33.33); return fract((p3.xxy+p3.yxx)*p3.zyx); }
vec2 hash22(vec2 p){ vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973)); p3+=dot(p3,p3.yzx+33.33); return fract((p3.xx+p3.yz)*p3.zy); }
// interleaved gradient noise, for ray jitter (stable per pixel, varies per frame)
float ign(vec2 px){ return fract(52.9829189*fract(dot(px+vec2(5.588238,5.588238)*mod(uFrame,64.), vec2(0.06711056,0.00583715)))); }
float ignStatic(vec2 px){ return fract(52.9829189*fract(dot(px, vec2(0.06711056,0.00583715)))); }

vec2 frameUV(){
  // map target pixel -> [-1,1] over the full 16:9 frame (y up), aspect not applied
  return (gl_FragCoord.xy / uRes) * 2.0 - 1.0;
}
float frameAspect(){ return uFull.x / uFull.y; }
vec3 cameraRay(vec2 uv){
  vec3 d = vec3(uv.x * uTanHalfFov * frameAspect(), uv.y * uTanHalfFov, 1.0);
  return normalize(uCamRot * d);
}
// ray/sphere: returns (tNear, tFar), tNear > tFar means miss
vec2 sphereHit(vec3 ro, vec3 rd, vec3 c, float r){
  vec3 oc = ro - c; float b = dot(oc, rd); float h = b*b - dot(oc,oc) + r*r;
  if (h < 0.0) return vec2(1e9, -1e9);
  h = sqrt(h); return vec2(-b - h, -b + h);
}
// closest approach of ray to point: returns (t, distance)
vec2 rayPoint(vec3 ro, vec3 rd, vec3 p){ float t = max(0.0, dot(p - ro, rd)); return vec2(t, length(ro + rd*t - p)); }
`;

export const NOISE = `
// Texture-based noise (cheap on SwiftShader). Coordinates in "lattice" units:
// n3(p): perlin, 1 unit = 1 lattice cell, returns ~[-1,1]
float n3(vec3 p){ return texture(uNoise, p * 0.125).r * 2.0 - 1.0; }
float n3b(vec3 p){ return texture(uNoise, p * 0.0625).b * 2.0 - 1.0; }
vec4 n4(vec3 p){ return texture(uNoise, p * 0.125); }
// worley: x = F1 distance (0 at feature point, ~1 between), y = F2-F1 (0 on cell borders)
vec2 cells3(vec3 p){ vec4 t = texture(uNoise, p * 0.125); return vec2(t.g * 1.1, t.a * 0.8); }
float fbm3(vec3 p, int oct){ float a = 0.5, s = 0.0; mat3 m = mat3(0.0,0.8,0.6,-0.8,0.36,-0.48,-0.6,-0.48,0.64);
  for (int i = 0; i < 8; i++){ if (i >= oct) break; s += a * n3(p); p = m * p * 2.03 + 1.7; a *= 0.5; } return s; }
float ridged3(vec3 p, int oct){ float a = 0.5, s = 0.0, w = 1.0; mat3 m = mat3(0.0,0.8,0.6,-0.8,0.36,-0.48,-0.6,-0.48,0.64);
  for (int i = 0; i < 8; i++){ if (i >= oct) break; float r = 1.0 - abs(n3(p)); r *= r; s += a * r * w; w = clamp(r * 2.0, 0.0, 1.0); p = m * p * 2.07 + 3.1; a *= 0.5; } return s; }
vec3 curlish(vec3 p){ // cheap divergence-free-looking warp vector
  return vec3(n3(p + vec3(31.3,0,0)), n3(p + vec3(0,57.1,0)), n3(p + vec3(0,0,91.7)));
}
`;

export const COLOR = `
// Approximate blackbody chromaticity (linear sRGB, normalized to max channel = 1).
// T in Kelvin, valid ~1000..40000.
vec3 blackbody(float T){
  T = clamp(T, 1000.0, 40000.0) / 100.0;
  float r, g, b;
  if (T <= 66.0){ r = 1.0; g = clamp(0.39008157876901960784 * log(T) - 0.63184144378862745098, 0.0, 1.0); }
  else { r = clamp(1.29293618606274509804 * pow(T - 60.0, -0.1332047592), 0.0, 1.0); g = clamp(1.12989086089529411765 * pow(T - 60.0, -0.0755148492), 0.0, 1.0); }
  if (T >= 66.0) b = 1.0; else if (T <= 19.0) b = 0.0; else b = clamp(0.54320678911019607843 * log(T - 10.0) - 1.19625408914, 0.0, 1.0);
  vec3 c = vec3(r, g, b);
  return pow(c, vec3(2.2)); // to linear
}
// Film palette anchors (linear)
const vec3 C_CRIMSON = vec3(0.42, 0.018, 0.012);
const vec3 C_EMBER   = vec3(1.0, 0.22, 0.05);
const vec3 C_GOLD    = vec3(1.0, 0.62, 0.22);
const vec3 C_WHITE   = vec3(1.0, 0.96, 0.92);
const vec3 C_ICE     = vec3(0.36, 0.62, 1.0);
const vec3 C_DEEPBLUE= vec3(0.03, 0.08, 0.22);
`;

export const STARS = `
// Procedural star field in direction space. density: cells per unit sphere radius (e.g. 180).
// Returns linear radiance. Stars are pixel-ish points with a soft core; sized for 1080p.
vec3 starLayer(vec3 rd, float density, float seed, float pixAngle, float prob){
  vec3 p = rd * density;
  vec3 c = floor(p);
  if (hash13(c * 0.913 + seed * 5.3) > prob) return vec3(0.0);   // most cells are empty
  vec3 h = hash33(c + seed);
  vec3 sp = c + 0.2 + 0.6 * h;            // star kept away from cell borders
  vec3 sd = normalize(sp);
  float ang = length(cross(rd, sd));       // ~angle for small separations
  float b = hash13(c * 1.37 + seed + 7.0);
  float mag = pow(b, 22.0);                // few bright, many faint
  float r = pixAngle * (0.62 + 1.1 * mag);
  float core = exp(-ang * ang / (r * r));
  float temp = mix(3200.0, 14000.0, pow(hash13(c + seed * 3.1), 1.3));
  return blackbody(temp) * core * (0.006 + 0.02 * b * b + 5.0 * mag);
}
// pixAngle argument kept for API stability; the render-target pixel angle is used so
// stars stay ~1px whatever the render scale (a 1080p pixel: uK scales it for larger output).
vec3 starField(vec3 rd, float pixAngleUnused){
  float pa = 2.0 * uTanHalfFov / uRes.y * max(uK, 1.0);
  return starLayer(rd, 70.0, 1.0, pa, 0.22) + starLayer(rd, 150.0, 2.0, pa, 0.07) * 0.7 + starLayer(rd, 300.0, 3.0, pa, 0.025) * 0.5;
}
// very restrained interstellar dust/glow: abyssal, mostly black
vec3 deepSky(vec3 rd){
  float band = exp(-pow(dot(rd, normalize(vec3(0.25, 0.92, -0.3))) * 3.2, 2.0));
  float d = fbm3(rd * 3.0 + 11.0, 4) * 0.5 + 0.5;
  float dust = smoothstep(0.35, 0.75, fbm3(rd * 6.0 + 3.0, 4) * 0.5 + 0.5);
  vec3 glow = mix(vec3(0.004, 0.002, 0.003), vec3(0.010, 0.006, 0.009), d) * band * (1.0 - 0.8 * dust);
  return glow;
}
`;

// Assemble a fragment shader from chunks.
export function frag(...chunks) { return [HEADER, COMMON, NOISE, COLOR, ...chunks].join('\n'); }
