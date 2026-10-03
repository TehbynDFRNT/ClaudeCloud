// Page entry: readiness barrier (fonts, plan, grid, shaders) then expose a frame API for the renderer.
import { Film } from './engine/film.js';
import { scenes } from './scenes/index.js';

const q = new URLSearchParams(location.search);
const W = +(q.get('w') || 1920), H = +(q.get('h') || 1080);
const canvas = document.getElementById('c');
canvas.width = W; canvas.height = H;

async function boot() {
  const fonts = ['400 30px Cinzel', 'italic 400 30px "Cormorant Garamond"', '400 30px "Cormorant Garamond"', 'italic 30px "IM Fell English"', '30px "IM Fell English"'];
  await Promise.all(fonts.map((f) => document.fonts.load(f)));
  await document.fonts.ready;
  const [plan, grid] = await Promise.all([
    fetch('../film-plan.json').then((r) => r.json()),
    fetch('../analysis/grid.json').then((r) => r.json()).catch(() => null),
  ]);
  const film = new Film({ canvas, W, H, plan, grid, scenes });
  window.film = film;
  window.renderFrame = (f) => film.renderFrame(f);
  window.renderSandbox = (id, params, local, dur, post, lb, preset) => film.renderSandbox(id, params, local, dur, post, lb, preset);
  window.grab = (type = 'image/jpeg', quality = 0.95) => canvas.toDataURL(type, quality).split(',')[1];
  window.planInfo = () => ({ fps: film.fps, frames: plan.frames, shots: film.shots.map((s) => ({ id: s.id, scene: s.scene, start: s.start, end: s.end })) });
  // optional warm-up of every scene used in the plan (compiles shaders up front)
  if (q.has('warm')) for (const id of new Set(film.shots.map((s) => s.scene))) film.scene(id);
  window.__ready = true;
}

boot().catch((e) => { window.__error = String(e && e.stack || e); console.error(e); });
