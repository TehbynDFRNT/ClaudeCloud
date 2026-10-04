// Page entry: the page contract that tools/render.mjs drives (references/architecture.md §3).
//   window.__ready / window.__error   set once fonts, the plan and every scene's preload() are done (or boot failed)
//   window.renderFrame(f)             draws frame f; returns { f, shot, scene, ms } with ms an INTEGER
//   window.grab(type, quality)        base64 of the output canvas
//   window.planInfo()                 { fps, frames, shots: [{ id, scene, start, end }] }
//   window.renderSandbox(...)         one scene with ad-hoc params (development)
import { Film } from './engine/film.js';
import { scenes } from './scenes/index.js';

const q = new URLSearchParams(location.search);
const W = +(q.get('w') || 1080), H = +(q.get('h') || 1920);
const canvas = document.getElementById('c');   // the first canvas in the document
canvas.width = W; canvas.height = H;

async function boot() {
  // fonts: load every face explicitly before __ready (document.fonts.load('400 30px Cinzel') ...), or text is
  // measured in the fallback font; this starter uses only a system serif
  await document.fonts.ready;
  // ?plan= is a path relative to the REPOSITORY ROOT (render.mjs serves the root). This page lives in src/, so a bare
  // fetch(plan) would ask for src/film-plan.json and get a 404.
  const planPath = q.get('plan') || 'film-plan.json';
  const res = await fetch('../' + planPath);
  if (!res.ok) throw new Error(`plan ${planPath}: HTTP ${res.status}`);
  const plan = await res.json();
  // scenes with external assets (media/scenes/<id>/) load them here and THROW on failure: a frame rendered without
  // its asset would be recorded as final under a valid fingerprint
  await Promise.all(Object.values(scenes).filter((s) => s.preload).map((s) => s.preload(plan)));
  const film = new Film({ canvas, W, H, plan, scenes });
  window.film = film;
  window.renderFrame = (f) => film.renderFrame(f);
  window.renderSandbox = (id, params, local, dur, post, lb, preset) => film.renderSandbox(id, params, local, dur, preset);
  window.grab = (type = 'image/jpeg', quality = 0.95) => canvas.toDataURL(type, quality).split(',')[1];
  window.planInfo = () => ({ fps: film.fps, frames: plan.frames, shots: film.shots.map(({ id, scene, start, end }) => ({ id, scene, start, end })) });
  if (q.has('warm')) for (const id of new Set(film.shots.map((s) => s.scene))) film.scene(id);   // compile up front
  window.__ready = true;
}

boot().catch((e) => { window.__error = String((e && e.stack) || e); console.error(e); });
