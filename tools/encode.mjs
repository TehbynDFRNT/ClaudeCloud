#!/usr/bin/env node
// Mux the rendered frame sequence with the soundtrack into the final MP4, then verify it.
//   node tools/encode.mjs [--frames out/frames] [--audio out/audio/mix.wav] [--out dist/david-and-goliath.mp4]
//                         [--crf 17] [--preset slow] [--maxrate 0 (kbps cap, 0 = none)] [--preview]
// --preview encodes whatever frames exist (missing frames are filled by repeating the previous one).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const flag = (k) => argv.includes('--' + k);

const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'film-plan.json'), 'utf8'));
const [num, den] = plan.fps.split('/').map(Number);
const fps = num / (den || 1);
const framesDir = path.resolve(ROOT, opt('frames', 'out/frames'));
const audio = path.resolve(ROOT, opt('audio', 'out/audio/mix.wav'));
const out = path.resolve(ROOT, opt('out', 'dist/david-and-goliath.mp4'));
const crf = opt('crf', '17');
const preset = opt('preset', 'slow');
const maxrate = +opt('maxrate', '0');
const pad = (n) => String(n).padStart(5, '0');

// completeness check (and preview gap filling through a concat list)
const missing = [];
for (let f = 0; f < plan.frames; f++) if (!fs.existsSync(path.join(framesDir, `${pad(f)}.jpg`))) missing.push(f);
if (missing.length && !flag('preview')) {
  console.error(`${missing.length} frames missing (first: ${missing.slice(0, 10).join(', ')}). Render them or pass --preview.`);
  process.exit(1);
}
let input;
if (missing.length) {
  const list = path.join(framesDir, 'concat.txt');
  let last = null; const lines = [];
  for (let f = 0; f < plan.frames; f++) {
    const p = path.join(framesDir, `${pad(f)}.jpg`);
    if (fs.existsSync(p)) last = p;
    if (last) lines.push(`file '${last}'`, `duration ${1 / fps}`);
  }
  fs.writeFileSync(list, lines.join('\n') + '\n');
  input = ['-f', 'concat', '-safe', '0', '-i', list];
  console.log(`preview: ${missing.length} missing frames filled by holds`);
} else {
  input = ['-framerate', plan.fps, '-start_number', '0', '-i', path.join(framesDir, '%05d.jpg')];
}
if (!fs.existsSync(audio)) { console.error('missing audio ' + audio); process.exit(1); }
fs.mkdirSync(path.dirname(out), { recursive: true });

const dur = (plan.frames / fps).toFixed(6);
const v = ['-c:v', 'libx264', '-preset', preset, '-crf', crf, '-tune', 'grain', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.1',
  '-x264-params', `keyint=${Math.round(fps * 2)}:min-keyint=${Math.round(fps)}`, '-r', plan.fps, '-vsync', 'cfr'];
if (maxrate > 0) v.push('-maxrate', `${maxrate}k`, '-bufsize', `${maxrate * 2}k`);
const args = ['-y', '-hide_banner', '-loglevel', 'warning', '-stats', ...input, '-i', audio,
  '-map', '0:v:0', '-map', '1:a:0', ...v,
  '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-ac', '2',
  '-t', dur, '-movflags', '+faststart',
  '-metadata', `title=${plan.title}`,
  '-metadata', 'comment=Music: Vivaldi, L\'inverno I (cond. Philip Milman, Lud and Schlatt\'s Musical Emporium, CC BY 3.0). Picture and sound design rendered in code.',
  out];
console.log('ffmpeg', args.join(' '));
const r = spawnSync('ffmpeg', args, { stdio: 'inherit' });
if (r.status !== 0) process.exit(r.status || 1);
const size = fs.statSync(out).size;
console.log(`wrote ${path.relative(ROOT, out)} (${(size / 1e6).toFixed(1)} MB)`);
if (!flag('preview')) {
  const vr = spawnSync('python3', [path.join(ROOT, 'tools/verify_video.py'), out, '--plan', path.join(ROOT, 'film-plan.json'), '--out', out.replace(/\.mp4$/, '.verify.json')], { stdio: 'inherit', cwd: path.join(ROOT, 'tools') });
  process.exit(vr.status || 0);
}
