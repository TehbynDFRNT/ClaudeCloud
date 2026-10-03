// DAVID: shared white-dwarf appearance at distance (point-like) so every scene draws it the same way.
// Close-up surface rendering lives in scenes/whitedwarf.js (it may add functions, keep these stable).
// Display temperature ~30,000 K: cold blue-white. Intensity is HDR (core can reach several hundred).
export const DWARF = `
uniform vec3 uDwarfPos;
uniform float uDwarfR;       // physical radius in scene units (often sub-pixel at system scale)
uniform float uDwarfLum;     // overall brightness multiplier (1 = nominal)

vec3 dwarfColor(){ return vec3(0.62, 0.80, 1.0); }

// Glow of the dwarf seen along a ray: tight core + soft halo, size-independent of distance
// (a point source), occluded if the ray is blocked before reaching it (pass maxT).
// pixAngle: angular size of one pixel. Returns linear radiance.
vec3 dwarfGlow(vec3 ro, vec3 rd, float maxT, float pixAngle){
  vec3 d = uDwarfPos - ro;
  float t = dot(d, rd);
  if (t <= 0.0 || t > maxT) return vec3(0.0);
  float dist = length(d);
  float ang = length(cross(rd, d / dist));                 // angular separation (radians, small-angle)
  float angR = max(uDwarfR / dist, pixAngle * 0.8);        // physical disk or at least ~1 pixel
  float core = exp(-pow(ang / angR, 2.0)) * 220.0;
  float halo = 1.0 / (1.0 + pow(ang / (pixAngle * 6.0), 2.0)) * 2.2;
  float wide = 1.0 / (1.0 + pow(ang / (pixAngle * 60.0), 2.0)) * 0.12;
  return dwarfColor() * (core + halo + wide) * uDwarfLum;
}
`;
