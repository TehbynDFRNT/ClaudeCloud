// Content fingerprints for rendered frames. A frame's fingerprint covers everything that can change its
// pixels: the engine, the scene module(s) drawing it (plus their transitive local imports), the shot
// entries, and any plan effects/text/transitions active on that frame. A frame whose fingerprint still
// matches is final and is never re-rendered or deleted; only changed shots are redone.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
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
  const fileCache = new Map(), depCache = new Map();
  const read = (p) => { if (!fileCache.has(p)) fileCache.set(p, fs.readFileSync(p, 'utf8')); return fileCache.get(p); };
  const engine = sha(['src/main.js', 'src/index.html', ...fs.readdirSync(path.join(ROOT, 'src/engine')).map((f) => 'src/engine/' + f), ...fs.readdirSync(path.join(ROOT, 'src/fonts')).map((f) => 'src/fonts/' + f)]
    .sort().map((p) => p + '\n' + sha(fs.readFileSync(path.join(ROOT, p)))).join('\n'));
  const grid = fs.existsSync(path.join(ROOT, 'analysis/grid.json')) ? sha(read(path.join(ROOT, 'analysis/grid.json'))) : '';
  // descriptive fields never change pixels; leaving them out lets cuts that share a shot share its frames
  const DESCRIPTIVE = new Set(['purpose', 'action', 'framing', 'note']);
  const pixelShot = (s) => Object.fromEntries(Object.entries(s).filter(([k]) => !DESCRIPTIVE.has(k)));
  const shots = [...plan.shots].sort((a, b) => a.start - b.start);
  const sceneHash = (id) => moduleHash(path.join(ROOT, 'src/scenes', id + '.js'), read, depCache);
  const shotAt = (f) => shots.find((s) => f >= s.start && f < s.end) || shots[shots.length - 1];
  const global = sha(JSON.stringify({ fps: plan.fps, w: plan.width, h: plan.height, format: plan.format, defaultPost: plan.defaultPost }));
  return function fingerprint(f, W = plan.width, H = plan.height) {
    const shot = shotAt(f);
    const active = (list, a = 'start', b = 'end') => (list || []).filter((e) => {
      if (e.type === 'flash') return f >= e.frame && f < e.frame + (e.decay || 6) * 6;   // same window as engine
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
