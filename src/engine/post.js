// Post pipeline: composite (shake, motion blur, overlay) -> bloom pyramid -> anamorphic streak -> final grade.
import { HEADER, COMMON } from './glsl.js';

const H = HEADER + COMMON;

const COMP = H + `
uniform sampler2D uScene;
uniform sampler2D uSceneB;     // second shot for dissolves
uniform float uMixB;           // 0 = scene only, 1 = B only
uniform int uMixMode;          // 0 dissolve, 1 additive bleed
uniform sampler2D uOverlay;    // premultiplied sRGB-ish
uniform int uOverlayMode;      // 0 none, 1 add, 2 over
uniform float uOverlayGain;
uniform vec3 uShake;           // dx, dy in pixels, rotation radians
uniform vec2 uBlur;            // directional blur vector, pixels
uniform float uZoomBlur;       // radial blur strength (0..0.1)
vec3 sampleScene(vec2 uv){
  vec3 a = texture(uScene, uv).rgb;
  if (uMixB > 0.0){
    vec3 b = texture(uSceneB, uv).rgb;
    a = uMixMode == 0 ? mix(a, b, uMixB) : a * (1.0 - uMixB) + b * uMixB + a * b * uMixB;
  }
  return a;
}
void main(){
  vec2 px = gl_FragCoord.xy;
  vec2 c = uFull * 0.5;
  vec2 q = px - c;
  q = rot2(uShake.z) * q - uShake.xy;
  vec2 uv = (q + c) / uFull;
  vec3 col = vec3(0.0);
  float n = 0.0;
  bool blur = dot(uBlur, uBlur) > 0.25 || uZoomBlur > 0.0005;
  if (blur){
    float j = ignStatic(px) - 0.5;
    for (int i = 0; i < 12; i++){
      float t = (float(i) + 0.5 + j) / 12.0 - 0.5;
      vec2 o = uBlur * t / uFull + (uv - 0.5) * uZoomBlur * t * 2.0;
      col += sampleScene(uv + o); n += 1.0;
    }
    col /= n;
  } else col = sampleScene(uv);
  if (uOverlayMode > 0){
    vec4 o = texture(uOverlay, uv);
    vec3 lin = pow(max(o.rgb, 0.0), vec3(2.2)) * uOverlayGain;
    if (uOverlayMode == 1) col += lin; else col = col * (1.0 - o.a) + lin;
  }
  fragColor = vec4(col, 1.0);
}`;

const BRIGHT = H + `
uniform sampler2D uSrc; uniform float uThreshold; uniform float uKnee;
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 t = 1.0 / uRes;
  vec3 c = (texture(uSrc, uv + t*vec2(-.25,-.25)).rgb + texture(uSrc, uv + t*vec2(.25,-.25)).rgb + texture(uSrc, uv + t*vec2(-.25,.25)).rgb + texture(uSrc, uv + t*vec2(.25,.25)).rgb) * 0.25;
  float br = max(c.r, max(c.g, c.b));
  float soft = clamp(br - uThreshold + uKnee, 0.0, 2.0 * uKnee);
  soft = soft * soft / (4.0 * uKnee + 1e-4);
  float w = max(soft, br - uThreshold) / max(br, 1e-4);
  fragColor = vec4(min(c * w, vec3(4000.0)), 1.0);
}`;

const DOWN = H + `
uniform sampler2D uSrc; uniform vec2 uSrcRes;
void main(){
  vec2 uv = gl_FragCoord.xy / uRes; vec2 t = 1.0 / uSrcRes;
  vec3 a = texture(uSrc, uv + t*vec2(-2,2)).rgb, b = texture(uSrc, uv + t*vec2(0,2)).rgb, c = texture(uSrc, uv + t*vec2(2,2)).rgb;
  vec3 d = texture(uSrc, uv + t*vec2(-2,0)).rgb, e = texture(uSrc, uv).rgb, f = texture(uSrc, uv + t*vec2(2,0)).rgb;
  vec3 g = texture(uSrc, uv + t*vec2(-2,-2)).rgb, h = texture(uSrc, uv + t*vec2(0,-2)).rgb, i = texture(uSrc, uv + t*vec2(2,-2)).rgb;
  vec3 j = texture(uSrc, uv + t*vec2(-1,1)).rgb, k = texture(uSrc, uv + t*vec2(1,1)).rgb, l = texture(uSrc, uv + t*vec2(-1,-1)).rgb, m = texture(uSrc, uv + t*vec2(1,-1)).rgb;
  vec3 o = e*0.125 + (a+c+g+i)*0.03125 + (b+d+f+h)*0.0625 + (j+k+l+m)*0.125;
  fragColor = vec4(o, 1.0);
}`;

const UP = H + `
uniform sampler2D uSrc; uniform sampler2D uBase; uniform vec2 uSrcRes; uniform float uRadius;
void main(){
  vec2 uv = gl_FragCoord.xy / uRes; vec2 t = uRadius / uSrcRes;
  vec3 s = texture(uSrc, uv).rgb * 4.0;
  s += (texture(uSrc, uv + t*vec2(-1,0)).rgb + texture(uSrc, uv + t*vec2(1,0)).rgb + texture(uSrc, uv + t*vec2(0,-1)).rgb + texture(uSrc, uv + t*vec2(0,1)).rgb) * 2.0;
  s += texture(uSrc, uv + t*vec2(-1,-1)).rgb + texture(uSrc, uv + t*vec2(1,-1)).rgb + texture(uSrc, uv + t*vec2(-1,1)).rgb + texture(uSrc, uv + t*vec2(1,1)).rgb;
  fragColor = vec4(texture(uBase, uv).rgb + s / 16.0, 1.0);
}`;

const STREAK = H + `
uniform sampler2D uSrc; uniform vec2 uSrcRes; uniform float uStep; uniform float uFalloff;
void main(){
  vec2 uv = gl_FragCoord.xy / uRes; float t = uStep / uSrcRes.x;
  vec3 s = vec3(0.0); float wsum = 0.0;
  for (int i = -4; i <= 4; i++){ float w = pow(uFalloff, abs(float(i))); s += texture(uSrc, uv + vec2(float(i) * t, 0.0)).rgb * w; wsum += w; }
  fragColor = vec4(s / wsum, 1.0);
}`;

const FINAL = H + `
uniform sampler2D uComp; uniform sampler2D uBloom; uniform sampler2D uStreak; uniform sampler2D uTitles; uniform float uHasTitles;
uniform float uExposure, uBloomStrength, uStreakStrength, uHalation, uAberration, uVignette, uGrain;
uniform float uSaturation, uContrast, uLetterbox, uFade, uFlash, uLift;
uniform float uMGOn; uniform vec4 uMG; uniform vec4 uMG2;   // master grade: liftScale, blackPoint, toeGamma, toePivot | saturation, grainFloor0, grainFloor1, contrast
uniform vec3 uStreakTint, uTint, uFadeColor;
vec3 aces(vec3 x){ // Hill ACES fit
  const mat3 i = mat3(0.59719,0.07600,0.02840, 0.35458,0.90834,0.13383, 0.04823,0.01566,0.83777);
  const mat3 o = mat3(1.60475,-0.10208,-0.00327, -0.53108,1.10813,-0.07276, -0.07367,-0.00605,1.07602);
  vec3 v = i * x; vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
  return clamp(o * (a / b), 0.0, 1.0);
}
void main(){
  vec2 px = gl_FragCoord.xy; vec2 uv = px / uRes;
  vec2 d = uv - 0.5;
  float r2 = dot(d * vec2(uFull.x / uFull.y, 1.0), d * vec2(uFull.x / uFull.y, 1.0));
  vec3 col;
  if (uAberration > 0.0){
    vec2 o = d * uAberration * r2;
    col = vec3(texture(uComp, uv - o).r, texture(uComp, uv).g, texture(uComp, uv + o).b);
  } else col = texture(uComp, uv).rgb;
  vec3 bloom = texture(uBloom, uv).rgb;
  vec3 streak = texture(uStreak, uv).rgb;
  col += bloom * uBloomStrength;
  col += bloom * vec3(1.0, 0.28, 0.10) * uHalation;
  col += streak * uStreakTint * uStreakStrength;
  col += uFlash * vec3(1.0, 0.97, 0.92);
  col *= uExposure * uTint;
  col *= mix(1.0, smoothstep(1.25, 0.15, r2), uVignette);
  col = aces(col);
  // grade in display-ish space
  vec3 g = pow(col, vec3(1.0 / 2.2));
  float l = luma(g);
  g = mix(vec3(l), g, uSaturation);
  g = (g - 0.5) * uContrast + 0.5;
  float gf = 1.0;
  if (uMGOn > 0.5){
    // master grade: a smaller shadow lift, a black point, a smooth toe below the pivot, saturation and contrast trims,
    // and no grain in true black (deep blacks stay black; grain lives in the image)
    g = g + uLift * uMG.x * vec3(0.02, 0.035, 0.07) * (1.0 - g);
    g = max(g - uMG.y, 0.0) / (1.0 - uMG.y);
    vec3 toe = uMG.w * pow(max(g / uMG.w, 0.0), vec3(uMG.z));
    g = mix(toe, g, smoothstep(0.0, uMG.w, g));
    g = (g - 0.5) * uMG2.w + 0.5;
    float lg = luma(g); g = max(mix(vec3(lg), g, uMG2.x), 0.0);
    gf = smoothstep(uMG2.y, uMG2.z, lg);
  } else {
    g = g + uLift * vec3(0.02, 0.035, 0.07) * (1.0 - g);
  }
  if (uHasTitles > 0.5){ vec4 tt = texture(uTitles, uv); g = g * (1.0 - tt.a) + tt.rgb; }
  // grain: two-hash triangular noise, luminance weighted, changes every frame
  float n1 = hash13(vec3(px, uFrame * 1.618)), n2 = hash13(vec3(px * 1.37 + 17.0, uFrame * 2.718 + 3.0));
  float grain = (n1 + n2 - 1.0);
  g += grain * uGrain * mix(1.0, 0.45, l) * gf;
  g = mix(g, uFadeColor, uFade);
  // letterbox (fraction of full height per bar)
  float y = px.y / uRes.y;
  if (y < uLetterbox || y > 1.0 - uLetterbox) g = vec3(0.0);
  // dither to 8 bit
  g += (hash12(px + fract(uFrame * 0.123) * 91.0) - 0.5) / 255.0;
  fragColor = vec4(clamp(g, 0.0, 1.0), 1.0);
}`;

export const POST_DEFAULTS = {
  exposure: 1.0, bloomStrength: 0.08, bloomThreshold: 1.0, bloomKnee: 0.6, streakStrength: 0.0, streakTint: [0.35, 0.6, 1.0],
  halation: 0.025, aberration: 0.0035, vignette: 0.55, grain: 0.035, saturation: 1.0, contrast: 1.04, lift: 0.4,
  tint: [1, 1, 1], letterbox: 0.128, fade: 0, fadeColor: [0, 0, 0], flash: 0, shake: [0, 0, 0], blur: [0, 0], zoomBlur: 0,
  overlayMode: 0, overlayGain: 1.0, mixB: 0, mixMode: 0,
};

export class Post {
  constructor(G, W, H) {
    this.G = G; this.W = W; this.H = H;
    this.pComp = G.program(COMP, 'post.comp');
    this.pBright = G.program(BRIGHT, 'post.bright');
    this.pDown = G.program(DOWN, 'post.down');
    this.pUp = G.program(UP, 'post.up');
    this.pStreak = G.program(STREAK, 'post.streak');
    this.pFinal = G.program(FINAL, 'post.final');
    this.comp = G.target('comp', W, H);
    // bloom and streak live at the 1080p-equivalent scale, so a larger render glows exactly like the 1080p one
    this.k = Math.min(W, H) / 1080;
    const bw = Math.round(W / this.k), bh = Math.round(H / this.k);
    this.levels = [];
    let w = bw >> 1, h = bh >> 1;
    for (let i = 0; i < 7; i++) { this.levels.push(G.target('bloomD' + i, Math.max(2, w), Math.max(2, h))); w >>= 1; h >>= 1; }
    this.ups = this.levels.map((l, i) => G.target('bloomU' + i, l.w, l.h));
    this.streakA = G.target('streakA', bw >> 2, bh >> 3);
    this.streakB = G.target('streakB', bw >> 2, bh >> 3);
  }

  run(scene, sceneB, overlayTex, p, titlesTex = null) {
    const G = this.G;
    const full = [this.W, this.H];
    G.draw(this.pComp, {
      uScene: scene, uSceneB: sceneB || scene, uMixB: sceneB ? p.mixB : 0, uMixMode: p.mixMode, uOverlay: overlayTex || scene,
      uOverlayMode: overlayTex ? p.overlayMode : 0, uOverlayGain: p.overlayGain, uZoomBlur: p.zoomBlur, uFull: full,
      // shake and blur are authored in 1080p pixels
      uShake: this.k === 1 ? p.shake : [p.shake[0] * this.k, p.shake[1] * this.k, p.shake[2]], uBlur: this.k === 1 ? p.blur : [p.blur[0] * this.k, p.blur[1] * this.k],
    }, this.comp);
    // bloom pyramid
    G.draw(this.pBright, { uSrc: this.comp, uThreshold: p.bloomThreshold, uKnee: p.bloomKnee, uFull: full }, this.levels[0]);
    for (let i = 1; i < this.levels.length; i++) G.draw(this.pDown, { uSrc: this.levels[i - 1], uSrcRes: [this.levels[i - 1].w, this.levels[i - 1].h], uFull: full }, this.levels[i]);
    const n = this.levels.length;
    G.draw(this.pUp, { uSrc: this.levels[n - 1], uBase: this.levels[n - 2], uSrcRes: [this.levels[n - 1].w, this.levels[n - 1].h], uRadius: 1.0, uFull: full }, this.ups[n - 2]);
    for (let i = n - 3; i >= 0; i--) G.draw(this.pUp, { uSrc: this.ups[i + 1], uBase: this.levels[i], uSrcRes: [this.ups[i + 1].w, this.ups[i + 1].h], uRadius: 1.0, uFull: full }, this.ups[i]);
    // anamorphic streak from the 1/4 level
    if (p.streakStrength > 0) {
      const src = this.levels[1];
      G.draw(this.pStreak, { uSrc: src, uSrcRes: [src.w, src.h], uStep: 1.5, uFalloff: 0.85, uFull: full }, this.streakA);
      G.draw(this.pStreak, { uSrc: this.streakA, uSrcRes: [this.streakA.w, this.streakA.h], uStep: 6.0, uFalloff: 0.9, uFull: full }, this.streakB);
      G.draw(this.pStreak, { uSrc: this.streakB, uSrcRes: [this.streakB.w, this.streakB.h], uStep: 24.0, uFalloff: 0.92, uFull: full }, this.streakA);
    }
    G.draw(this.pFinal, {
      uComp: this.comp, uBloom: this.ups[0], uStreak: this.streakA, uFull: full, uTitles: titlesTex || this.comp, uHasTitles: titlesTex ? 1 : 0,
      uExposure: p.exposure, uBloomStrength: p.bloomStrength, uStreakStrength: p.streakStrength, uStreakTint: p.streakTint,
      uHalation: p.halation, uAberration: p.aberration, uVignette: p.vignette, uGrain: p.grain, uSaturation: p.saturation,
      uContrast: p.contrast, uLift: p.lift, uTint: p.tint, uLetterbox: p.letterbox, uFade: p.fade, uFadeColor: p.fadeColor, uFlash: p.flash,
      uMGOn: p.mg ? 1 : 0,
      uMG: p.mg ? [p.mg.liftScale ?? 1, p.mg.blackPoint ?? 0, p.mg.toeGamma ?? 1, p.mg.toePivot ?? 0.25] : [1, 0, 1, 0.25],
      uMG2: p.mg ? [p.mg.saturation ?? 1, p.mg.grainFloor?.[0] ?? 0, p.mg.grainFloor?.[1] ?? 0, p.mg.contrast ?? 1] : [1, 0, 0, 1],
    }, null);
  }
}
