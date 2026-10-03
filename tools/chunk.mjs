#!/usr/bin/env node
// Distributed final render helpers. Every frame is a pure function of its index, so ranges rendered on
// different machines join seamlessly. Chunks are encoded with the final settings (each starts on a
// keyframe) and later concatenated without re-encoding.
//
//   node tools/chunk.mjs plan --parts 5 [--costs out/costs.json]   -> balanced contiguous ranges
//   node tools/chunk.mjs costs                                      -> measure ms/frame per shot (1 frame each)
//   node tools/chunk.mjs render --from A --to B                     -> out/frames + dist/chunks/chunk_A_B.mp4
//   node tools/chunk.mjs assemble [--audio out/audio/mix.wav]       -> dist/david-and-goliath.mp4 (+ verify)
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const mode = argv[0];
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'film-plan.json'), 'utf8'));
const pad = (n) => String(n).padStart(5, '0');
const CHUNKS = path.join(ROOT, 'dist/chunks');
// final video settings, shared by every chunk so they can be stream-copied together
const X264 = ['-c:v', 'libx264', '-preset', 'slow', '-crf', opt('crf', '17'), '-tune', 'grain', '-pix_fmt', 'yuv420p',
  '-profile:v', 'high', '-level', '4.1', '-x264-params', 'keyint=48:min-keyint=24:scenecut=40', '-r', plan.fps];

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: ROOT, ...opts });
  if (r.status !== 0) throw new Error(`${cmd} failed (${r.status})`);
}

if (mode === 'costs') {
  // one representative frame per shot at full size, timed in the real renderer
  const frames = plan.shots.map((s) => Math.round((s.start + s.end - 1) / 2));
  const out = path.join(ROOT, 'out/costs');
  const r = spawnSync('node', ['tools/render.mjs', 'stills', '--frames', frames.join(','), '--w', '1920', '--out', path.relative(ROOT, out)], { cwd: ROOT, encoding: 'utf8' });
  const costs = {};
  for (const line of (r.stdout || '').split('\n')) {
    const m = /^f(\d+) (\S+) \(\S+\) (\d+)ms/.exec(line);
    if (m) costs[m[2]] = +m[3];
  }
  fs.writeFileSync(path.join(ROOT, 'out/costs.json'), JSON.stringify(costs, null, 1));
  console.log(costs);
} else if (mode === 'plan') {
  const parts = +opt('parts', 5);
  const costFile = path.join(ROOT, opt('costs', 'out/costs.json'));
  const costs = fs.existsSync(costFile) ? JSON.parse(fs.readFileSync(costFile, 'utf8')) : {};
  const per = new Float64Array(plan.frames);
  for (const s of plan.shots) for (let f = s.start; f < s.end; f++) per[f] = (costs[s.id] || 1500) + 120; // + capture/encode
  // transitions render two shots
  for (const o of plan.overlays || []) for (let f = o.start; f < o.end; f++) per[f] *= 1.9;
  const total = per.reduce((a, b) => a + b, 0);
  const ranges = []; let acc = 0, start = 0;
  for (let f = 0; f < plan.frames; f++) {
    acc += per[f];
    if (ranges.length < parts - 1 && acc >= (total / parts) * (ranges.length + 1)) {
      // snap the boundary to the next multiple of 24 so each chunk starts on a clean GOP
      const end = Math.min(plan.frames, Math.ceil((f + 1) / 24) * 24);
      ranges.push([start, end]); start = end; f = end - 1;
    }
  }
  ranges.push([start, plan.frames]);
  const est = ranges.map(([a, b]) => { let s = 0; for (let f = a; f < b; f++) s += per[f]; return +(s / 60000).toFixed(1); });
  console.log(JSON.stringify({ totalMinutes: +(total / 60000).toFixed(1), ranges, estMinutes: est }, null, 1));
} else if (mode === 'render') {
  const from = +opt('from'), to = +opt('to');
  if (!(to > from)) throw new Error('need --from and --to');
  const frames = path.join(ROOT, opt('frames', 'out/frames'));
  run('node', ['tools/render.mjs', 'film', '--from', String(from), '--to', String(to), '--w', '1920', '--out', path.relative(ROOT, frames)]);
  for (let f = from; f < to; f++) if (!fs.existsSync(path.join(frames, `${pad(f)}.jpg`))) throw new Error(`missing frame ${f}`);
  fs.mkdirSync(CHUNKS, { recursive: true });
  const out = path.join(CHUNKS, `chunk_${pad(from)}_${pad(to)}.mp4`);
  run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'warning', '-framerate', plan.fps, '-start_number', String(from),
    '-i', path.join(frames, '%05d.jpg'), '-frames:v', String(to - from), ...X264, '-an', '-movflags', '+faststart', out]);
  const probe = spawnSync('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', out], { encoding: 'utf8' });
  const n = +probe.stdout.trim();
  if (n !== to - from) throw new Error(`chunk has ${n} frames, expected ${to - from}`);
  console.log(`wrote ${path.relative(ROOT, out)} (${n} frames, ${(fs.statSync(out).size / 1e6).toFixed(1)} MB)`);
} else if (mode === 'assemble') {
  const audio = path.join(ROOT, opt('audio', 'out/audio/mix.wav'));
  const files = fs.readdirSync(CHUNKS).filter((f) => /^chunk_\d{5}_\d{5}\.mp4$/.test(f)).sort();
  let expect = 0;
  for (const f of files) {
    const [, a, b] = /chunk_(\d+)_(\d+)/.exec(f).map(Number);
    if (a !== expect) throw new Error(`gap/overlap before ${f}: expected start ${expect}`);
    expect = b;
  }
  if (expect !== plan.frames) throw new Error(`chunks end at ${expect}, plan has ${plan.frames} frames`);
  const list = path.join(CHUNKS, 'concat.txt');
  fs.writeFileSync(list, files.map((f) => `file '${path.join(CHUNKS, f)}'`).join('\n') + '\n');
  const out = path.join(ROOT, opt('out', 'dist/david-and-goliath.mp4'));
  const [num, den] = plan.fps.split('/').map(Number);
  run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'warning', '-f', 'concat', '-safe', '0', '-i', list, '-i', audio,
    '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-ac', '2',
    '-t', (plan.frames / (num / (den || 1))).toFixed(6), '-movflags', '+faststart',
    '-metadata', `title=${plan.title}`,
    '-metadata', 'comment=Music: Vivaldi, L\'inverno I, The United States Air Force Band. Cannon: Tchaikovsky 1812 Overture, The United States Army Band. Picture and sound design rendered in code.',
    out]);
  console.log(`wrote ${path.relative(ROOT, out)} (${(fs.statSync(out).size / 1e6).toFixed(1)} MB)`);
  run('python3', [path.join(ROOT, 'tools/verify_video.py'), out, '--plan', path.join(ROOT, 'film-plan.json'), '--out', out.replace(/\.mp4$/, '.verify.json')], { cwd: path.join(ROOT, 'tools') });
} else {
  console.error('modes: costs | plan | render | assemble');
  process.exit(1);
}
