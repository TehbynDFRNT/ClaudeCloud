// Content fingerprints for rendered frames: a frame's fingerprint covers everything that can change its pixels, so
// a frame (or a piece of video) whose fingerprint still matches is final and is never re-rendered.
//
// Provenance: tools/fingerprint.mjs of the "Nova, Episode 1" project (ClaudeCloud repo, Oct 2026), generalised:
// paths come from config.mjs (film.config.json), the global inputs are a list, and extra plan fields can be made
// global. With the default config the fingerprints are byte-identical to the original's.
//
// A fingerprint is sha1(JSON) truncated to 16 hex characters, over:
//   engine  every file in config.engine (main.js, index.html, src/engine/*, fonts): one change invalidates EVERY frame
//   grid    the config.globalInputs files (the bar grid): also global (the key name is kept for cache compatibility)
//   global  the plan's fps, width, height, format, defaultPost (+ config.planFieldsInGlobal, if any): keep prose
//           (a format.note) out of these, or editing a sentence re-renders every frame
//   W, H    the render size
//   shot    the shot entry minus its descriptive fields (purpose, action, framing, note), so cuts can share frames
//   scene   the scene module <scenesDir>/<scene>.js + every relative import/export-from it pulls in, recursively,
//           + every file under <sceneAssetsDir>/<scene>/
//   others  the partner shot (and its scene hash) of an active dissolve/bleed
//   trs, effects, text   the transitions, effects and text items active on this frame
// NOT covered (keep pixels away from these): anything a scene reads from E.plan outside its own shot, files a scene
// fetch()es from outside <sceneAssetsDir>/<id>/, the scene registry (index.js; deliberately: adding a scene
// invalidates nothing), and the frame index f itself (all frames of a shot with the same active effects share a
// fingerprint, so the frame cache must be keyed by frame index + fingerprint, not by fingerprint alone).
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, config, expandFiles } from './config.mjs';

const sha = (s) => crypto.createHash('sha1').update(s).digest('hex');

// a source file plus every relative module it imports (recursively), as one hash
function moduleHash(file, read, depCache) {
  if (depCache.has(file)) return depCache.get(file);
  const seen = new Set();
  const parts = [];
  const walk = (f) => {
    if (seen.has(f) || !fs.existsSync(f)) return;
    seen.add(f);
    const src = read(f);
    parts.push(path.relative(ROOT, f) + '\n' + src);
    for (const m of src.matchAll(/(?:import|export)[^'"`]*?from\s+['"](\.{1,2}\/[^'"]+)['"]/g)) walk(path.resolve(path.dirname(f), m[1]));
  };
  walk(file);
  const h = sha(parts.sort().join('\n\0'));
  depCache.set(file, h);
  return h;
}

export function makeFingerprinter(plan) {
  // caches live per fingerprinter: create a new one to see the current sources
  const C = config();
  const fileCache = new Map(), depCache = new Map();
  const read = (p) => { if (!fileCache.has(p)) fileCache.set(p, fs.readFileSync(p, 'utf8')); return fileCache.get(p); };
  const engine = sha(expandFiles(C.engine).sort().map((p) => p + '\n' + sha(fs.readFileSync(path.join(ROOT, p)))).join('\n'));
  const grid = C.globalInputs.map((p) => { const a = path.join(ROOT, p); return fs.existsSync(a) ? sha(read(a)) : ''; }).join('');
  // descriptive fields never change pixels; leaving them out lets cuts that share a shot share its frames
  const DESCRIPTIVE = new Set(C.descriptiveFields);
  const pixelShot = (s) => Object.fromEntries(Object.entries(s).filter(([k]) => !DESCRIPTIVE.has(k)));
  const shots = [...plan.shots].sort((a, b) => a.start - b.start);
  // a scene's external assets live in <sceneAssetsDir>/<id>/ and are part of its hash
  const assetHash = (id) => {
    const dir = path.join(ROOT, C.sceneAssetsDir, id);
    if (!fs.existsSync(dir)) return '';
    const files = []; const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else files.push(p); } };
    walk(dir);
    return sha(files.sort().map((p) => path.relative(ROOT, p) + ':' + sha(fs.readFileSync(p))).join('\n'));
  };
  const sceneHashes = new Map();
  const sceneHash = (id) => {
    if (!sceneHashes.has(id)) sceneHashes.set(id, moduleHash(path.join(ROOT, C.scenesDir, id + '.js'), read, depCache) + assetHash(id));
    return sceneHashes.get(id);
  };
  const shotAt = (f) => shots.find((s) => f >= s.start && f < s.end) || shots[shots.length - 1];
  const g = { fps: plan.fps, w: plan.width, h: plan.height, format: plan.format, defaultPost: plan.defaultPost };
  if (C.planFieldsInGlobal.length) g.extra = Object.fromEntries(C.planFieldsInGlobal.map((k) => [k, plan[k]]));
  const global = sha(JSON.stringify(g));
  return function fingerprint(f, W = plan.width, H = plan.height) {
    const shot = shotAt(f);
    // the same activity windows as the engine (keep these in step with film.js effects())
    const active = (list, a = 'start', b = 'end') => (list || []).filter((e) => {
      if (e.type === 'flash') return f >= e.frame && f < e.frame + (e.decay || 6) * 6;
      if (e.type === 'dip') return f >= e.frame && f < e.frame + (e.attack ?? 1) + (e.decay || 6) * 6;
      if (e.frame !== undefined) return f >= e.frame;                                       // letterbox etc. persist
      return f >= e[a] && f < e[b];
    });
    const trs = active(plan.overlays).filter((o) => o.type === 'dissolve' || o.type === 'bleed');
    const others = trs.map((o) => shots.find((s) => s.id === (shot.id === o.from ? o.to : o.from))).filter(Boolean);
    return sha(JSON.stringify({
      engine, grid, global, W, H,
      shot: pixelShot(shot), scene: sceneHash(shot.scene),
      others: others.map((s) => ({ s: pixelShot(s), h: sceneHash(s.scene) })),
      trs, effects: active(plan.effects), text: active(plan.text),
    })).slice(0, 16);
  };
}

// CLI: node fingerprint.mjs <plan.json> [frame ...]   prints "frame fingerprint shot" lines (all frames by default)
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const [planFile, ...frames] = process.argv.slice(2);
  if (!planFile) { console.error('usage: node fingerprint.mjs <plan.json> [frame ...]'); process.exit(2); }
  const plan = JSON.parse(fs.readFileSync(path.resolve(ROOT, planFile), 'utf8'));
  const fp = makeFingerprinter(plan);
  const list = frames.length ? frames.map(Number) : Array.from({ length: plan.frames }, (_, i) => i);
  const shots = [...plan.shots].sort((a, b) => a.start - b.start);
  for (const f of list) console.log(f, fp(f), (shots.find((s) => f >= s.start && f < s.end) || {}).id || '');
}
