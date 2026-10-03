#!/usr/bin/env node
// Distributed final render helpers. Every frame is a pure function of its index, so ranges rendered on
// different machines join seamlessly. Chunks are encoded with the final settings (each starts on a
// keyframe) and later concatenated without re-encoding.
//
//   node tools/chunk.mjs plan --parts 5 [--costs out/costs.json]   -> balanced contiguous ranges
//   node tools/chunk.mjs costs                                      -> measure ms/frame per shot (1 frame each)
//   node tools/chunk.mjs render --from A --to B [--push]            -> 240-frame blocks dist/chunks/chunk_A_B.mp4
//   node tools/chunk.mjs status                                     -> which blocks are final / stale / missing
//   node tools/chunk.mjs assemble [--audio out/audio/mix.wav]       -> dist/david-and-goliath.mp4 (+ verify)
// Nothing final is ever discarded: frames and blocks carry content fingerprints (tools/fingerprint.mjs);
// only blocks whose code/shot/effects changed are re-rendered. --push commits each finished block
// immediately so work survives a container reset.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { makeFingerprinter } from './fingerprint.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const mode = argv[0];
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'film-plan.json'), 'utf8'));
const pad = (n) => String(n).padStart(5, '0');
const CHUNKS = path.join(ROOT, 'dist/chunks');
const BLOCK = 240;                                   // fixed 10 s blocks aligned to frame 0
const fpOf = makeFingerprinter(plan);
const blockFp = (a, b) => { const h = crypto.createHash('sha1'); for (let f = a; f < b; f++) h.update(fpOf(f) + ','); return h.digest('hex').slice(0, 16); };
const blocks = () => { const out = []; for (let a = 0; a < plan.frames; a += BLOCK) out.push([a, Math.min(plan.frames, a + BLOCK)]); return out; };
const freshFp = (a, b) => { const fresh = makeFingerprinter(plan); const h = crypto.createHash('sha1'); for (let f = a; f < b; f++) h.update(fresh(f) + ','); return h.digest('hex').slice(0, 16); };
const blockName = (a, b) => `chunk_${pad(a)}_${pad(b)}`;
function blockState(a, b) {
  const mp4 = path.join(CHUNKS, blockName(a, b) + '.mp4'), meta = path.join(CHUNKS, blockName(a, b) + '.json');
  if (!fs.existsSync(mp4) || !fs.existsSync(meta)) return 'missing';
  return JSON.parse(fs.readFileSync(meta, 'utf8')).fp === freshFp(a, b) ? 'final' : 'stale';
}
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
      // snap to the fixed block grid so helpers' blocks never overlap or shift
      const end = Math.min(plan.frames, Math.round((f + 1) / BLOCK) * BLOCK);
      ranges.push([start, end]); start = end; f = end - 1;
    }
  }
  ranges.push([start, plan.frames]);
  const est = ranges.map(([a, b]) => { let s = 0; for (let f = a; f < b; f++) s += per[f]; return +(s / 60000).toFixed(1); });
  console.log(JSON.stringify({ totalMinutes: +(total / 60000).toFixed(1), ranges, estMinutes: est }, null, 1));
} else if (mode === 'status') {
  const st = blocks().map(([a, b]) => [blockName(a, b), blockState(a, b)]);
  for (const [n, v] of st) console.log(n, v);
  console.log(st.filter((x) => x[1] === 'final').length + '/' + st.length + ' blocks final');
} else if (mode === 'render') {
  const from = +opt('from', 0), to = +opt('to', plan.frames);
  if (from % BLOCK || (to % BLOCK && to !== plan.frames)) throw new Error(`--from/--to must be multiples of ${BLOCK} (or the film end)`);
  const frames = path.join(ROOT, opt('frames', 'out/frames'));
  fs.mkdirSync(CHUNKS, { recursive: true });
  for (const [a, b] of blocks().filter(([a]) => a >= from && a < to)) {
    const name = blockName(a, b), state = blockState(a, b);
    if (state === 'final') { console.log(`${name}: final, kept`); continue; }
    console.log(`${name}: ${state} -> rendering`);
    run('node', ['tools/render.mjs', 'film', '--from', String(a), '--to', String(b), '--w', '1920', '--out', path.relative(ROOT, frames)]);
    for (let f = a; f < b; f++) if (!fs.existsSync(path.join(frames, `${pad(f)}.jpg`))) throw new Error(`missing frame ${f}`);
    const out = path.join(CHUNKS, name + '.mp4');
    run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'warning', '-framerate', plan.fps, '-start_number', String(a),
      '-i', path.join(frames, '%05d.jpg'), '-frames:v', String(b - a), ...X264, '-an', '-movflags', '+faststart', '-f', 'mp4', out + '.tmp']);
    const probe = spawnSync('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', out + '.tmp'], { encoding: 'utf8' });
    const n = +probe.stdout.trim();
    if (n !== b - a) throw new Error(`${name} has ${n} frames, expected ${b - a}`);
    // the block's fingerprint is built from the fingerprints the frames were ACTUALLY rendered under
    // (recorded by render.mjs at page boot), never recomputed here: if any source changed mid-render
    // the block is written as stale and will be redone, rather than falsely marked final.
    const man = JSON.parse(fs.readFileSync(path.join(frames, 'manifest.json'), 'utf8'));
    const h = crypto.createHash('sha1'); for (let f = a; f < b; f++) h.update(man[f] + ',');
    const rendered = h.digest('hex').slice(0, 16);
    fs.renameSync(out + '.tmp', out);
    fs.writeFileSync(path.join(CHUNKS, name + '.json'), JSON.stringify({ from: a, to: b, fp: rendered, crf: opt('crf', '17'), frames: n }) + '\n');
    if (rendered !== freshFp(a, b)) { console.warn(`${name}: sources changed during render; block left stale`); continue; }
    console.log(`wrote ${path.relative(ROOT, out)} (${n} frames, ${(fs.statSync(out).size / 1e6).toFixed(1)} MB)`);
    if (argv.includes('--push')) {
      run('git', ['add', `dist/chunks/${name}.mp4`, `dist/chunks/${name}.json`]);
      run('git', ['commit', '-q', '-m', `Render block ${name}`]);
      for (let k = 0, d = 2; ; k++, d *= 2) {
        const r = spawnSync('git', ['push', '-q', '-u', 'origin', 'HEAD'], { stdio: 'inherit', cwd: ROOT });
        if (r.status === 0) break;
        if (k >= 4) throw new Error('git push failed');
        spawnSync('sleep', [String(d)]);
      }
    }
  }
} else if (mode === 'assemble') {
  const audio = path.join(ROOT, opt('audio', 'out/audio/mix.wav'));
  const files = [];
  for (const [a, b] of blocks()) {
    const st = blockState(a, b);
    if (st === 'missing' || (st === 'stale' && !argv.includes('--allow-stale'))) throw new Error(`${blockName(a, b)} is ${st}`);
    files.push(blockName(a, b) + '.mp4');
  }
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
