#!/usr/bin/env node
// Distributed final render. Every frame is a pure function of its index, so ranges rendered on different machines
// join seamlessly. The film is cut into fixed blocks (config.block, default 240 frames = 10 s at 24 fps, aligned to
// frame 0); a block splits at every shot boundary into PIECES. Each piece is encoded on its own from a keyframe with
// the final settings and records the fingerprint its frames were rendered under, so a changed shot re-renders only
// its own pieces and assembly stream-copies the pieces without re-encoding.
//
// Provenance: tools/chunk.mjs of the "Nova, Episode 1" project (ClaudeCloud repo, Oct 2026), generalised: layout and
// credits from config.mjs, `status --json` (feeds restore-from-branches.py --want), `plan --pending`, the concat list
// kept out of the cut folder, the dead per-piece push helper removed. Same block/piece/record format as the original.
// Copy it into the project's tools/ with fingerprint.mjs, render.mjs and config.mjs, and commit them.
//
//   node chunk.mjs costs    [--plan P]                       one full-size frame per shot, timed -> out/costs.json (ms per shot id)
//   node chunk.mjs plan     [--plan P] --parts 6 [--costs out/costs.json] [--pending]   balanced ranges on the block grid
//   node chunk.mjs status   [--plan P] [--json]              per block: final | partial | stale | missing (+ non-final pieces)
//   node chunk.mjs render   --plan P --from A --to B [--only-scenes a,b] [--skip-scenes c] [--push] [--crf 17] [--frames DIR]
//   node chunk.mjs assemble --plan P [--audio out/audio/mix.wav] [--out FILE] [--allow-stale] [--placeholders scene,..] [--preview]
//
// Layout: <distDir>/<plan.id>/chunk_AAAAA_BBBBB.json   = { from, to, crf, pieces: [{ from, to, fp, scene }] }
//         <distDir>/<plan.id>/chunk_AAAAA_BBBBB.PPPPP_QQQQQ.mp4   one piece (frames [P, Q))
// --preview: half size, crf 22, in <distDir>/<plan.id>-preview/ (never mixed with final pieces).
// render --push: after each block that wrote pieces, `git add -A -f <cut dir>` (dist is usually git-ignored),
// commit, and push HEAD to its namesake on origin (5 tries). On a helper session that is its own outcome branch.
// A piece identical (same name, same fp) in ANY other <distDir>/*/ folder (another cut or version) is copied, not
// rendered ("twin"). assemble refuses missing pieces, stale ones unless --allow-stale, and a silent soundtrack.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { makeFingerprinter } from './fingerprint.mjs';
import { ROOT, config, rel } from './config.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const C = config();
const argv = process.argv.slice(2);
const mode = argv[0];
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const flag = (k) => argv.includes('--' + k);
const PLAN = opt('plan', 'film-plan.json');
const plan = JSON.parse(fs.readFileSync(path.resolve(ROOT, PLAN), 'utf8'));
const pad = (n) => String(n).padStart(5, '0');
const PREVIEW = flag('preview');
const W = PREVIEW ? plan.width / 2 : plan.width, H = PREVIEW ? plan.height / 2 : plan.height;
const DIST = path.join(ROOT, C.distDir);
const CHUNKS = path.join(DIST, plan.id ? `${plan.id}${PREVIEW ? '-preview' : ''}` : (PREVIEW ? 'preview' : 'chunks'));
const BLOCK = C.block;
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
const freshFper = () => makeFingerprinter(plan);   // a new fingerprinter sees the current sources
const rangeFp = (fp, a, b) => { const h = crypto.createHash('sha1'); for (let f = a; f < b; f++) h.update(fp(f, W, H) + ','); return h.digest('hex').slice(0, 16); };
const readMeta = (dir, a, b) => { const m = path.join(dir, blockName(a, b) + '.json'); return fs.existsSync(m) ? JSON.parse(fs.readFileSync(m, 'utf8')) : null; };
// piece states against the CURRENT sources: final (file + matching fp) / stale / missing
function pieceStates(a, b, fp = freshFper()) {
  const meta = readMeta(CHUNKS, a, b);
  return piecesOf(a, b).map((pc) => {
    const want = rangeFp(fp, pc.from, pc.to);
    const rec = meta && meta.pieces && meta.pieces.find((x) => x.from === pc.from && x.to === pc.to);
    const has = rec && fs.existsSync(path.join(CHUNKS, pc.name + '.mp4'));
    return { ...pc, want, have: rec ? rec.fp : null, state: has ? (rec.fp === want ? 'final' : 'stale') : 'missing' };
  });
}
const blockStateOf = (ps) => {
  const bad = ps.filter((p) => p.state !== 'final');
  if (!bad.length) return 'final';
  if (bad.length === ps.length) return ps.every((p) => p.state === 'missing') ? 'missing' : 'stale';
  return 'partial';
};
// final video settings, shared by every piece so they can be stream-copied together
const X264 = ['-c:v', 'libx264', '-preset', 'slow', '-crf', opt('crf', PREVIEW ? '22' : '17'), '-tune', 'grain', '-pix_fmt', 'yuv420p',
  '-profile:v', 'high', '-level', '4.1', '-x264-params', 'keyint=48:min-keyint=24:scenecut=40', '-r', String(plan.fps)];

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: ROOT, ...opts });
  if (r.status !== 0) throw new Error(`${cmd} ${args.slice(0, 3).join(' ')} ... failed (${r.status})`);
}
function pushBlock(name, n) {
  run('git', ['add', '-A', '-f', rel(CHUNKS)]);
  run('git', ['commit', '-q', '-m', `Render ${rel(CHUNKS)}/${name} (${n} piece(s))`]);
  for (let k = 0, d = 2; ; k++, d *= 2) {
    const r = spawnSync('git', ['push', '-q', '-u', 'origin', 'HEAD'], { stdio: 'inherit', cwd: ROOT });
    if (r.status === 0) return;
    if (k >= 4) throw new Error('git push failed');
    spawnSync('sleep', [String(d)]);
  }
}
const fpsNum = () => { const [n, d] = String(plan.fps).split('/').map(Number); return n / (d || 1); };

if (mode === 'costs') {
  // one representative frame per shot at full size, timed in the real renderer
  const frames = plan.shots.map((s) => Math.round((s.start + s.end - 1) / 2));
  const r = spawnSync('node', [path.join(HERE, 'render.mjs'), 'stills', '--plan', PLAN, '--frames', frames.join(','), '--w', String(plan.width), '--h', String(plan.height), '--out', 'out/costs'], { cwd: ROOT, encoding: 'utf8' });
  const costs = {};
  for (const line of (r.stdout || '').split('\n')) { const m = /^f(\d+) (\S+) \(\S+\) (\d+)ms/.exec(line); if (m) costs[m[2]] = +m[3]; }
  fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'out/costs.json'), JSON.stringify(costs, null, 1));
  console.log(costs);
} else if (mode === 'plan') {
  // contiguous ranges on the block grid with about equal estimated render time (helpers never overlap)
  const parts = +opt('parts', 5);
  const costFile = path.resolve(ROOT, opt('costs', 'out/costs.json'));
  const costs = fs.existsSync(costFile) ? JSON.parse(fs.readFileSync(costFile, 'utf8')) : {};
  const per = new Float64Array(plan.frames);
  for (const s of plan.shots) for (let f = s.start; f < s.end; f++) per[f] = (costs[s.id] || 1500) + 120;   // + capture/encode
  for (const o of plan.overlays || []) for (let f = o.start; f < o.end; f++) per[f] *= 1.9;               // transitions render two shots
  if (flag('pending')) {   // only what still needs rendering: final pieces cost nothing
    const fp = freshFper();
    for (const [a, b] of blocks()) for (const pc of pieceStates(a, b, fp)) if (pc.state === 'final') for (let f = pc.from; f < pc.to; f++) per[f] = 0;
  }
  const total = per.reduce((a, b) => a + b, 0);
  // linear partition of the blocks into at most `parts` contiguous groups minimising the costliest group
  // (binary search on the capacity + greedy fill); the original split at cumulative thirds and snapped, which
  // could leave one helper with twice another's work
  const bl = blocks(), bc = bl.map(([a, b]) => { let s = 0; for (let f = a; f < b; f++) s += per[f]; return s; });
  const groupsFor = (cap) => { const g = []; let cur = [], s = 0; bc.forEach((c, i) => { if (cur.length && s + c > cap) { g.push(cur); cur = []; s = 0; } cur.push(i); s += c; }); if (cur.length) g.push(cur); return g; };
  let lo = Math.max(...bc), hi = Math.max(lo, bc.reduce((a, b) => a + b, 0));
  for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if (groupsFor(mid).length <= parts) hi = mid; else lo = mid; }
  let ranges = groupsFor(hi).map((g) => {
    let i0 = g[0], i1 = g[g.length - 1];
    if (flag('pending')) { while (i0 < i1 && bc[i0] === 0) i0++; while (i1 > i0 && bc[i1] === 0) i1--; }   // trim free ends
    return [bl[i0][0], bl[i1][1]];
  });
  const est = (a, b) => { let s = 0; for (let f = a; f < b; f++) s += per[f]; return +(s / 60000).toFixed(1); };
  if (flag('pending')) ranges = ranges.filter(([a, b]) => est(a, b) > 0);
  console.log(JSON.stringify({ totalMinutes: +(total / 60000).toFixed(1), ranges, estMinutes: ranges.map(([a, b]) => est(a, b)) }, null, 1));
} else if (mode === 'status') {
  const fp = freshFper();
  const st = blocks().map(([a, b]) => { const ps = pieceStates(a, b, fp); return { name: blockName(a, b), from: a, to: b, state: blockStateOf(ps), pieces: ps }; });
  const nFinal = st.filter((x) => x.state === 'final').length;
  if (flag('json')) {
    console.log(JSON.stringify({ plan: PLAN, dir: rel(CHUNKS), final: nFinal, total: st.length,
      blocks: st.map((b) => ({ ...b, pieces: b.pieces.map(({ name, from, to, scene, state, want, have }) => ({ name, from, to, scene, state, want, have })) })) }, null, 1));
  } else {
    for (const b of st) console.log(b.name, b.state, b.pieces.filter((p) => p.state !== 'final').map((p) => `${p.from}-${p.to}:${p.scene}:${p.state}`).join(' '));
    console.log(`${nFinal}/${st.length} blocks final`);
  }
} else if (mode === 'render') {
  const from = +opt('from', 0), to = +opt('to', plan.frames);
  if (from % BLOCK || (to % BLOCK && to !== plan.frames)) throw new Error(`--from/--to must be multiples of ${BLOCK} (or the film end)`);
  // the frame cache is shared by every cut at this size (keyed by frame index; the manifest keeps the fingerprint
  // each frame was rendered under), so a second cut re-renders only the frames where the cuts differ.
  // Never run two renders of different plans into one frames folder at the same time.
  const frames = path.resolve(ROOT, opt('frames', `out/frames-${W}x${H}`));
  fs.mkdirSync(CHUNKS, { recursive: true });
  const skip = new Set((opt('skip-scenes', '') || '').split(',').filter(Boolean));
  // --only-scenes statue: render just those scenes' pieces; the block record then lists only the pieces this machine
  // wrote, and restore-from-branches.py merges the records of several helpers
  const only = new Set((opt('only-scenes', '') || '').split(',').filter(Boolean));
  const others = () => (fs.existsSync(DIST) ? fs.readdirSync(DIST, { withFileTypes: true }) : [])
    .filter((d) => d.isDirectory() && path.join(DIST, d.name) !== CHUNKS).map((d) => path.join(DIST, d.name));
  for (const [a, b] of blocks().filter(([a]) => a >= from && a < to)) {
    const name = blockName(a, b);
    const meta = readMeta(CHUNKS, a, b) || { from: a, to: b, crf: opt('crf', PREVIEW ? '22' : '17'), pieces: [] };
    if (!meta.pieces) meta.pieces = [];   // an old single-file block: start over as pieces
    const record = (pc, fp) => {
      meta.pieces = meta.pieces.filter((x) => !(x.from === pc.from && x.to === pc.to));
      meta.pieces.push({ from: pc.from, to: pc.to, fp, scene: pc.scene });
      meta.pieces.sort((x, y) => x.from - y.from);
      fs.writeFileSync(path.join(CHUNKS, name + '.json'), JSON.stringify(meta) + '\n');
    };
    const touched = [], todo = [];
    for (const pc of pieceStates(a, b)) {
      if (pc.state === 'final') continue;
      if (skip.has(pc.scene)) { console.log(`${pc.name}: ${pc.scene} skipped (--skip-scenes)`); continue; }
      if (only.size && !only.has(pc.scene)) continue;
      // the same picture already encoded for another cut or version -> copy it
      const twin = others().find((dir) => { const m = readMeta(dir, a, b); const r = m && m.pieces && m.pieces.find((x) => x.from === pc.from && x.to === pc.to); return r && r.fp === pc.want && fs.existsSync(path.join(dir, pc.name + '.mp4')); });
      if (twin) {
        fs.copyFileSync(path.join(twin, pc.name + '.mp4'), path.join(CHUNKS, pc.name + '.mp4'));
        record(pc, pc.want); touched.push(pc.name);
        console.log(`${pc.name}: identical piece in ${rel(twin)} -> copied`);
        continue;
      }
      todo.push(pc);
    }
    if (todo.length) {
      // one renderer session for every piece of the block that needs frames
      console.log(`${name}: rendering ${todo.length} piece(s): ${todo.map((p) => `${p.from}-${p.to} ${p.scene}`).join(', ')}`);
      run('node', [path.join(HERE, 'render.mjs'), 'film', '--plan', PLAN, '--ranges', todo.map((p) => `${p.from}-${p.to}`).join(','), '--w', String(W), '--h', String(H), '--out', frames]);
      const man = JSON.parse(fs.readFileSync(path.join(frames, 'manifest.json'), 'utf8'));
      for (const pc of todo) {
        for (let f = pc.from; f < pc.to; f++) if (!fs.existsSync(path.join(frames, `${pad(f)}.jpg`))) throw new Error(`missing frame ${f}`);
        const out = path.join(CHUNKS, pc.name + '.mp4');
        run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'warning', '-framerate', String(plan.fps), '-start_number', String(pc.from),
          '-i', path.join(frames, '%05d.jpg'), '-frames:v', String(pc.to - pc.from), ...X264, '-an', '-movflags', '+faststart', '-f', 'mp4', out + '.tmp']);
        const n = +spawnSync('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', out + '.tmp'], { encoding: 'utf8' }).stdout.trim();
        if (n !== pc.to - pc.from) throw new Error(`${pc.name} has ${n} frames, expected ${pc.to - pc.from}`);
        // the piece's fingerprint comes from the fingerprints its frames were ACTUALLY rendered under (render.mjs
        // manifest); if a source changed mid-render the piece is recorded stale and will be redone
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
    console.log(`${name}: ${blockStateOf(pieceStates(a, b))} (${touched.length} piece(s) written)`);
    if (touched.length && flag('push')) pushBlock(name, touched.length);
  }
} else if (mode === 'assemble') {
  const audio = path.resolve(ROOT, opt('audio', C.audio));
  if (!fs.existsSync(audio)) throw new Error(`no soundtrack at ${rel(audio)} (pass --audio)`);
  const files = [];
  const fp = freshFper();
  // --placeholders statue: an INTERIM review cut; unfinished pieces of those scenes become a labelled grey card
  // (cached in out/placeholders/, never written into the cut folder), and the output is named *-interim.mp4
  const holders = new Set((opt('placeholders', '') || '').split(',').filter(Boolean));
  const holdDir = path.join(ROOT, 'out/placeholders', plan.id || 'film');
  const font = ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/TTF/DejaVuSans.ttf', '/System/Library/Fonts/Helvetica.ttc'].find((p) => fs.existsSync(p));
  for (const [a, b] of blocks()) for (const pc of pieceStates(a, b, fp)) {
    if (pc.state !== 'final' && holders.has(pc.scene)) {
      fs.mkdirSync(holdDir, { recursive: true });
      const ph = path.join(holdDir, pc.name + '.mp4');
      if (!fs.existsSync(ph)) {
        const shot = shotsSorted.find((sh) => pc.from >= sh.start && pc.from < sh.end);
        const label = String(shot ? shot.id : pc.scene).replace(/[':\\]/g, ' ');
        const vf = font ? `drawtext=fontfile=${font}:text='${label}  rendering':fontcolor=0x8a8070:fontsize=${Math.round(W / 24)}:x=(w-text_w)/2:y=h*0.48` : 'null';
        run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', `color=c=0x141414:s=${W}x${H}:r=${plan.fps}`,
          '-vf', vf, '-frames:v', String(pc.to - pc.from), ...X264, '-an', '-movflags', '+faststart', '-f', 'mp4', ph]);
      }
      files.push(ph);
      continue;
    }
    if (pc.state === 'missing' || (pc.state === 'stale' && !flag('allow-stale'))) throw new Error(`${pc.name} (${pc.scene}) is ${pc.state}`);
    files.push(path.join(CHUNKS, pc.name + '.mp4'));
  }
  // the concat list lives in out/, never in the cut folder (a later render --push would commit it)
  fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });
  const list = path.join(ROOT, 'out', `concat-${path.basename(CHUNKS)}.txt`);
  fs.writeFileSync(list, files.map((f) => `file '${f}'`).join('\n') + '\n');
  const out = path.resolve(ROOT, opt('out', path.join(C.distDir, `${path.basename(CHUNKS)}${holders.size ? '-interim' : ''}.mp4`)));
  const comment = C.comment || plan.credits || '';
  run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'warning', '-f', 'concat', '-safe', '0', '-i', list, '-i', audio,
    '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy',
    // 512k with the fast coder: the decoded true peak stays at the mix's (320k twoloop overshoots by +1 to +2 dB)
    '-c:a', 'aac', '-b:a', '512k', '-aac_coder', 'fast', '-ar', '48000', '-ac', '2',
    '-t', (plan.frames / fpsNum()).toFixed(6), '-movflags', '+faststart',
    '-metadata', `title=${plan.title || plan.id || 'film'}`, ...(comment ? ['-metadata', `comment=${comment}`] : []), out]);
  // the soundtrack must be there and audible: a silent or missing audio stream fails the assembly
  const vd = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', out, '-map', '0:a:0', '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' });
  const mean = /mean_volume: (-?[\d.]+) dB/.exec(vd.stderr || '');
  if (!mean || +mean[1] < -40) throw new Error(`${rel(out)}: soundtrack missing or silent (${mean ? mean[1] + ' dB' : 'no audio stream'})`);
  console.log(`soundtrack ok: mean ${mean[1]} dB`);
  console.log(`wrote ${rel(out)} (${(fs.statSync(out).size / 1e6).toFixed(1)} MB)`);
  // structural verify (full decode, frame count, size, fps, codecs): the project's tools/verify_video.py, else the
  // skill's scripts/verify_video.py. It does NOT measure loudness or true peak: run the audio --verify afterwards.
  const verify = [path.join(ROOT, 'tools/verify_video.py'), path.resolve(HERE, '../verify_video.py')].find((p) => fs.existsSync(p));
  if (PREVIEW) { /* previews are not verified */ }
  else if (verify) run('python3', [verify, out, '--plan', path.resolve(ROOT, PLAN), '--out', out.replace(/\.mp4$/, '.verify.json')], { cwd: path.dirname(verify) });
  else console.warn('no verify_video.py found: run a full-decode check before delivering');
} else {
  console.error('modes: costs | plan | status | render | assemble');
  process.exit(1);
}
