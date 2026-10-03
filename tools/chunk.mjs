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
// Blocks are made of PIECES, one per shot (a shot that crosses a block edge gives a piece on each side).
// Each piece is encoded on its own (starting on a keyframe) with its own fingerprint, so a changed shot
// re-renders only its own frames, and `--skip-scenes statue` can render everything else first; pieces
// are concatenated without re-encoding at assembly.
// --plan <file> picks the cut (default film-plan.json). A plan with an `id` keeps its blocks in
// dist/<id>/ (dist/<id>-preview/ for --preview); a block whose fingerprint already exists in another
// cut's folder is copied instead of rendered, so frames the cuts share are rendered once.
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
const PLAN = opt('plan', 'film-plan.json');
const plan = JSON.parse(fs.readFileSync(path.join(ROOT, PLAN), 'utf8'));
const pad = (n) => String(n).padStart(5, '0');
const PREVIEW = argv.includes('--preview');          // half-size work-in-progress cut, kept apart from final blocks
const W = PREVIEW ? plan.width / 2 : plan.width, H = PREVIEW ? plan.height / 2 : plan.height;
const CUT_DIR = plan.id ? `dist/${plan.id}${PREVIEW ? '-preview' : ''}` : (PREVIEW ? 'dist/preview' : 'dist/chunks');
const CHUNKS = path.join(ROOT, CUT_DIR);
const BLOCK = 240;                                   // fixed 10 s blocks aligned to frame 0
const fpOf = makeFingerprinter(plan);
const blocks = () => { const out = []; for (let a = 0; a < plan.frames; a += BLOCK) out.push([a, Math.min(plan.frames, a + BLOCK)]); return out; };
const blockName = (a, b) => `chunk_${pad(a)}_${pad(b)}`;
const shotsSorted = [...plan.shots].sort((x, y) => x.start - y.start);
// pieces of block [a, b): split at every shot boundary inside it
function piecesOf(a, b) {
  const out = []; let s = a;
  for (const sh of shotsSorted) if (sh.start > a && sh.start < b) { out.push([s, sh.start]); s = sh.start; }
  out.push([s, b]);
  return out.map(([p, q]) => ({ from: p, to: q, name: `${blockName(a, b)}.${pad(p)}_${pad(q)}`, scene: shotsSorted.find((sh) => p >= sh.start && p < sh.end)?.scene }));
}
const freshFper = () => makeFingerprinter(plan);
const rangeFp = (fp, a, b) => { const h = crypto.createHash('sha1'); for (let f = a; f < b; f++) h.update(fp(f, W, H) + ','); return h.digest('hex').slice(0, 16); };
const readMeta = (dir, a, b) => { const m = path.join(dir, blockName(a, b) + '.json'); return fs.existsSync(m) ? JSON.parse(fs.readFileSync(m, 'utf8')) : null; };
// piece states against the CURRENT sources: final (file + matching fp) / stale / missing
function pieceStates(a, b, fp = freshFper()) {
  const meta = readMeta(CHUNKS, a, b);
  return piecesOf(a, b).map((pc) => {
    const want = rangeFp(fp, pc.from, pc.to);
    const rec = meta && meta.pieces && meta.pieces.find((x) => x.from === pc.from && x.to === pc.to);
    const has = rec && fs.existsSync(path.join(CHUNKS, pc.name + '.mp4'));
    return { ...pc, want, state: has ? (rec.fp === want ? 'final' : 'stale') : 'missing' };
  });
}
function blockState(a, b) {
  const st = pieceStates(a, b).map((p) => p.state);
  if (st.every((x) => x === 'final')) return 'final';
  if (st.every((x) => x === 'missing')) return 'missing';
  return st.some((x) => x === 'final') ? 'partial' : 'stale';
}
// final video settings, shared by every chunk so they can be stream-copied together
const X264 = ['-c:v', 'libx264', '-preset', 'slow', '-crf', opt('crf', argv.includes('--preview') ? '22' : '17'), '-tune', 'grain', '-pix_fmt', 'yuv420p',
  '-profile:v', 'high', '-level', '4.1', '-x264-params', 'keyint=48:min-keyint=24:scenecut=40', '-r', plan.fps];

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: ROOT, ...opts });
  if (r.status !== 0) throw new Error(`${cmd} failed (${r.status})`);
}

if (mode === 'costs') {
  // one representative frame per shot at full size, timed in the real renderer
  const frames = plan.shots.map((s) => Math.round((s.start + s.end - 1) / 2));
  const out = path.join(ROOT, 'out/costs');
  const r = spawnSync('node', ['tools/render.mjs', 'stills', '--plan', PLAN, '--frames', frames.join(','), '--w', String(plan.width), '--h', String(plan.height), '--out', path.relative(ROOT, out)], { cwd: ROOT, encoding: 'utf8' });
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
  const fp = freshFper();
  const st = blocks().map(([a, b]) => {
    const ps = pieceStates(a, b, fp);
    const bad = ps.filter((p) => p.state !== 'final');
    const v = !bad.length ? 'final' : bad.length === ps.length ? (ps.every((p) => p.state === 'missing') ? 'missing' : 'stale') : 'partial';
    return [blockName(a, b), v, bad.map((p) => `${p.from}-${p.to}:${p.scene}:${p.state}`).join(' ')];
  });
  for (const [n, v, d] of st) console.log(n, v, d);
  console.log(st.filter((x) => x[1] === 'final').length + '/' + st.length + ' blocks final');
} else if (mode === 'render') {
  const from = +opt('from', 0), to = +opt('to', plan.frames);
  if (from % BLOCK || (to % BLOCK && to !== plan.frames)) throw new Error(`--from/--to must be multiples of ${BLOCK} (or the film end)`);
  // frames are shared by every cut at this size (the manifest keeps only frames whose fingerprint still
  // matches), so rendering the second cut re-renders only the frames where the cuts differ
  const frames = path.join(ROOT, opt('frames', `out/frames-${W}x${H}`));
  fs.mkdirSync(CHUNKS, { recursive: true });
  const push = (name) => {
    if (!argv.includes('--push')) return;
    run('git', ['add', path.relative(ROOT, path.join(CHUNKS, name + '.mp4')), path.relative(ROOT, path.join(CHUNKS, name + '.json'))]);
    run('git', ['commit', '-q', '-m', `Render block ${path.relative(ROOT, CHUNKS)}/${name}`]);
    for (let k = 0, d = 2; ; k++, d *= 2) {
      const r = spawnSync('git', ['push', '-q', '-u', 'origin', 'HEAD'], { stdio: 'inherit', cwd: ROOT });
      if (r.status === 0) break;
      if (k >= 4) throw new Error('git push failed');
      spawnSync('sleep', [String(d)]);
    }
  };
  const skip = new Set((opt('skip-scenes', '') || '').split(',').filter(Boolean));
  const others = () => (fs.existsSync(path.join(ROOT, 'dist')) ? fs.readdirSync(path.join(ROOT, 'dist'), { withFileTypes: true }) : [])
    .filter((d) => d.isDirectory() && path.join(ROOT, 'dist', d.name) !== CHUNKS).map((d) => path.join(ROOT, 'dist', d.name));
  for (const [a, b] of blocks().filter(([a]) => a >= from && a < to)) {
    const name = blockName(a, b);
    const meta = readMeta(CHUNKS, a, b) || { from: a, to: b, crf: opt('crf', PREVIEW ? '22' : '17'), pieces: [] };
    if (!meta.pieces) meta.pieces = [];   // an old single-file block: start over as pieces
    const record = (pc, fp) => { meta.pieces = meta.pieces.filter((x) => !(x.from === pc.from && x.to === pc.to)); meta.pieces.push({ from: pc.from, to: pc.to, fp, scene: pc.scene }); meta.pieces.sort((x, y) => x.from - y.from);
      fs.writeFileSync(path.join(CHUNKS, name + '.json'), JSON.stringify(meta) + '\n'); };
    const touched = [];
    const todo = [];
    for (const pc of pieceStates(a, b)) {
      if (pc.state === 'final') continue;
      if (skip.has(pc.scene)) { console.log(`${pc.name}: ${pc.scene} skipped (--skip-scenes)`); continue; }
      // the same picture already encoded for another cut -> copy it
      const twin = others().find((dir) => { const m = readMeta(dir, a, b); const r = m && m.pieces && m.pieces.find((x) => x.from === pc.from && x.to === pc.to); return r && r.fp === pc.want && fs.existsSync(path.join(dir, pc.name + '.mp4')); });
      if (twin) {
        fs.copyFileSync(path.join(twin, pc.name + '.mp4'), path.join(CHUNKS, pc.name + '.mp4'));
        record(pc, pc.want); touched.push(pc.name);
        console.log(`${pc.name}: identical piece in ${path.relative(ROOT, twin)} -> copied`);
        continue;
      }
      todo.push(pc);
    }
    if (todo.length) {
      // one renderer session for every piece of the block that needs frames (frames whose fingerprint is
      // already in the shared frame cache are kept, so a second cut renders only what differs)
      console.log(`${name}: rendering ${todo.length} piece(s): ${todo.map((p) => `${p.from}-${p.to} ${p.scene}`).join(', ')}`);
      run('node', ['tools/render.mjs', 'film', '--plan', PLAN, '--ranges', todo.map((p) => `${p.from}-${p.to}`).join(','), '--w', String(W), '--h', String(H), '--out', path.relative(ROOT, frames)]);
      const man = JSON.parse(fs.readFileSync(path.join(frames, 'manifest.json'), 'utf8'));
      for (const pc of todo) {
        for (let f = pc.from; f < pc.to; f++) if (!fs.existsSync(path.join(frames, `${pad(f)}.jpg`))) throw new Error(`missing frame ${f}`);
        const out = path.join(CHUNKS, pc.name + '.mp4');
        run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'warning', '-framerate', plan.fps, '-start_number', String(pc.from),
          '-i', path.join(frames, '%05d.jpg'), '-frames:v', String(pc.to - pc.from), ...X264, '-an', '-movflags', '+faststart', '-f', 'mp4', out + '.tmp']);
        const n = +spawnSync('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', out + '.tmp'], { encoding: 'utf8' }).stdout.trim();
        if (n !== pc.to - pc.from) throw new Error(`${pc.name} has ${n} frames, expected ${pc.to - pc.from}`);
        // the piece's fingerprint comes from the fingerprints its frames were ACTUALLY rendered under (recorded
        // by render.mjs); if any source changed mid-render the piece is recorded stale and will be redone
        const h = crypto.createHash('sha1'); for (let f = pc.from; f < pc.to; f++) h.update(man[f] + ',');
        const rendered = h.digest('hex').slice(0, 16);
        fs.renameSync(out + '.tmp', out);
        record(pc, rendered); touched.push(pc.name);
        if (rendered !== pc.want) console.warn(`${pc.name}: sources changed during render; piece left stale`);
      }
    }
    // drop piece files that no longer belong to this block (the plan's shot boundaries moved)
    const valid = new Set(piecesOf(a, b).map((p) => p.name));
    for (const f of fs.readdirSync(CHUNKS)) if (f.startsWith(name + '.') && f.endsWith('.mp4') && !valid.has(f.slice(0, -4))) fs.rmSync(path.join(CHUNKS, f));
    meta.pieces = meta.pieces.filter((x) => valid.has(`${name}.${pad(x.from)}_${pad(x.to)}`));
    fs.writeFileSync(path.join(CHUNKS, name + '.json'), JSON.stringify(meta) + '\n');
    console.log(`${name}: ${blockState(a, b)} (${touched.length} piece(s) written)`);
    if (touched.length && argv.includes('--push')) {
      run('git', ['add', '-A', path.relative(ROOT, CHUNKS)]);
      run('git', ['commit', '-q', '-m', `Render ${path.relative(ROOT, CHUNKS)}/${name} (${touched.length} piece(s))`]);
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
  const fp = freshFper();
  for (const [a, b] of blocks()) for (const pc of pieceStates(a, b, fp)) {
    if (pc.state === 'missing' || (pc.state === 'stale' && !argv.includes('--allow-stale'))) throw new Error(`${pc.name} (${pc.scene}) is ${pc.state}`);
    files.push(pc.name + '.mp4');
  }
  const list = path.join(CHUNKS, 'concat.txt');
  fs.writeFileSync(list, files.map((f) => `file '${path.join(CHUNKS, f)}'`).join('\n') + '\n');
  const out = path.join(ROOT, opt('out', plan.id ? `dist/${plan.id}${PREVIEW ? '-preview' : ''}.mp4` : (PREVIEW ? 'dist/preview-cut.mp4' : 'dist/david-and-goliath.mp4')));
  const [num, den] = plan.fps.split('/').map(Number);
  run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'warning', '-f', 'concat', '-safe', '0', '-i', list, '-i', audio,
    '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '512k', '-aac_coder', 'fast',   // keeps the climax's true peak under -1 dBTP after coding
     '-ar', '48000', '-ac', '2',
    '-t', (plan.frames / (num / (den || 1))).toFixed(6), '-movflags', '+faststart',
    '-metadata', `title=${plan.title}`,
    '-metadata', 'comment=Music: Vivaldi, L\'inverno I, The United States Air Force Band. Cannon: Tchaikovsky 1812 Overture, The United States Army Band. Picture and sound design rendered in code.',
    out]);
  // the soundtrack must be there and audible: a silent or missing audio stream fails the assembly
  const vd = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', out, '-map', '0:a:0', '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' });
  const mean = /mean_volume: (-?[\d.]+) dB/.exec(vd.stderr || '');
  if (!mean || +mean[1] < -40) throw new Error(`${path.relative(ROOT, out)}: soundtrack missing or silent (${mean ? mean[1] + ' dB' : 'no audio stream'})`);
  console.log(`soundtrack ok: mean ${mean[1]} dB`);
  console.log(`wrote ${path.relative(ROOT, out)} (${(fs.statSync(out).size / 1e6).toFixed(1)} MB)`);
  if (!PREVIEW) run('python3', [path.join(ROOT, 'tools/verify_video.py'), out, '--plan', path.join(ROOT, PLAN), '--out', out.replace(/\.mp4$/, '.verify.json')], { cwd: path.join(ROOT, 'tools') });
} else {
  console.error('modes: costs | plan | render | assemble');
  process.exit(1);
}
