// Shared project root and layout for the pipeline templates (fingerprint.mjs, render.mjs, chunk.mjs).
//
// Provenance: generalised from the "Nova, Episode 1" project (ClaudeCloud repo, tools/*.mjs, Oct 2026), where
// these paths were hard-coded. The defaults below ARE that project's layout, so the templates work unchanged in a
// project laid out the same way, and its fingerprints stay byte-identical.
//
// Root: $FILM_ROOT, else the git top level of the current directory, else the current directory.
// Layout overrides: an optional film.config.json at the root, e.g.
//   { "engine": ["src/main.js", "src/index.html", "src/engine/", "src/fonts/"],
//     "globalInputs": ["analysis/grid.json"], "scenesDir": "src/scenes", "sceneAssetsDir": "media/scenes",
//     "descriptiveFields": ["purpose", "action", "framing", "note"], "planFieldsInGlobal": [],
//     "page": "src/index.html", "distDir": "dist", "block": 240, "audio": "out/audio/mix.wav",
//     "comment": "Music: ... Picture and sound rendered in code.", "chrome": "/path/to/chrome" }
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function findRoot() {
  if (process.env.FILM_ROOT) return path.resolve(process.env.FILM_ROOT);
  const r = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' });
  if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
  return process.cwd();
}

export const ROOT = findRoot();

export const DEFAULTS = Object.freeze({
  // everything that can change EVERY frame: hashed into every fingerprint (a trailing '/' means every file below)
  engine: ['src/main.js', 'src/index.html', 'src/engine/', 'src/fonts/'],
  // data files every frame depends on (the bar grid): also global
  globalInputs: ['analysis/grid.json'],
  scenesDir: 'src/scenes',              // scene module <id>.js lives here; its relative imports are followed
  sceneAssetsDir: 'media/scenes',       // <id>/ below this is hashed into scene <id> (meshes, SVGs, textures)
  descriptiveFields: ['purpose', 'action', 'framing', 'note'],   // shot fields that never change pixels
  planFieldsInGlobal: [],               // top-level plan fields a scene reads through E.plan (fingerprint hazard)
  page: 'src/index.html',               // the page that exposes window.renderFrame etc.
  distDir: 'dist',                      // render pieces: <distDir>/<plan.id>/
  block: 240,                           // fixed block length in frames, aligned to frame 0
  audio: 'out/audio/mix.wav',           // default soundtrack for assemble
  comment: '',                          // container comment metadata (credits)
  chrome: null,                         // Chromium executable (else $CHROME, else discovered)
});

let cached = null;
export function config() {
  if (cached) return cached;
  const file = path.join(ROOT, 'film.config.json');
  const user = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  cached = { ...DEFAULTS, ...user };
  return cached;
}

// every file named by a list of paths; entries ending in '/' expand to all files below them (sorted)
export function expandFiles(entries) {
  const out = [];
  for (const e of entries) {
    const abs = path.join(ROOT, e);
    if (e.endsWith('/')) {
      if (!fs.existsSync(abs)) continue;
      const walk = (d) => {
        for (const x of fs.readdirSync(d, { withFileTypes: true })) {
          const p = path.join(d, x.name);
          if (x.isDirectory()) walk(p); else out.push(path.relative(ROOT, p).split(path.sep).join('/'));
        }
      };
      walk(abs);
    } else if (fs.existsSync(abs)) out.push(e);
  }
  return out;
}

// Chromium for headless rendering: $CHROME, film.config.json "chrome", Playwright's own, then known install paths
export function chromePath() {
  const cands = [process.env.CHROME, config().chrome].filter(Boolean);
  for (const base of ['/opt/pw-browsers', path.join(process.env.HOME || '', '.cache/ms-playwright')]) {
    if (!fs.existsSync(base)) continue;
    for (const d of fs.readdirSync(base).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse()) {
      cands.push(path.join(base, d, 'chrome-linux/chrome'), path.join(base, d, 'chrome-linux64/chrome'));
    }
  }
  cands.push('/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome');
  const hit = cands.find((p) => fs.existsSync(p));
  if (!hit) throw new Error('No Chromium found: set CHROME=/path/to/chrome');
  return hit;
}

export const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
