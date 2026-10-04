#!/usr/bin/env node
// Package renders for the Edit Room review page (src/review/editroom.html).
//
// Per cut: 10 s picture clips aligned to the render's 240-frame blocks + one continuous soundtrack (the
// page keeps them in step, frame-accurate), a 1 fps thumbnail sprite for timeline hover, an audio
// waveform, and the plan's shots, acts, cues, bar lines and on-screen text -- all derived from the
// film-plan*.json files and analysis/grid.json.
// Cuts share storage: a clip whose DECODED picture is identical in several cuts (md5 of every one of its
// frames) is encoded and stored once, and one soundtrack serves every cut whose decoded audio is identical.
//
//   node tools/build-review.mjs --cuts film-plan.json,film-plan-sol.json,film-plan-prometheus.json \
//        --videos dist/david-916-interim.mp4,dist/sol-916-interim.mp4,dist/prometheus-916-interim.mp4 \
//        [--out out/editroom] [--label "Render 2"] [--render 2] [--note "..."] [--names "A,B,C"]
//        [--codec h264|vp9] [--size 720x1280] [--crf 23] [--maxrate 3000k] [--abr 192k] [--allow-trim]
//   node tools/build-review.mjs --video dist/david-916.mp4 [--plan film-plan.json]          (one cut)
// --codec vp9 is only for local tests in the open-source Chromium (no H.264); publish h264.
// Each video must have exactly its plan's frame count (a render of another plan version would put the wrong
// timeline over the picture); --allow-trim accepts a longer video and uses its first plan.frames frames.
// Re-runs reuse the frame analysis and any media already encoded with identical settings
// (cache: out/.editroom-cache/<out dir name>/), so a page-only change rebuilds in seconds.
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const list = (s) => String(s).split(',').map((x) => x.trim()).filter(Boolean);
const out = path.resolve(ROOT, opt('out', 'out/editroom'));
const cacheDir = path.join(ROOT, 'out/.editroom-cache', path.basename(out));
const codec = opt('codec', 'h264');
const ext = codec === 'vp9' ? 'webm' : 'mp4';
const CLIP = 240;
const grid = JSON.parse(fs.readFileSync(path.join(ROOT, 'analysis/grid.json'), 'utf8'));
const sha1 = (s) => crypto.createHash('sha1').update(s).digest('hex');
const pad2 = (n) => String(n).padStart(2, '0');
const MB = (b) => (b / 1e6).toFixed(1);

function ff(args, opts = {}) {
  const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 1 << 30, ...opts });
  if (r.status !== 0) throw new Error('ffmpeg failed: ' + args.join(' '));
  return r.stdout;
}
const probe = (args) => spawnSync('ffprobe', ['-v', 'error', ...args], { encoding: 'utf8' }).stdout.trim();

// ---------- the cuts ----------
const planFiles = opt('cuts') ? list(opt('cuts')) : [opt('plan', 'film-plan.json')];
const plans = planFiles.map((f) => JSON.parse(fs.readFileSync(path.resolve(ROOT, f), 'utf8')));
const videoArgs = opt('videos') ? list(opt('videos')) : opt('video') ? [opt('video')] : plans.map((p) => (p.id ? `dist/${p.id}.mp4` : 'dist/david-and-goliath.mp4'));
if (videoArgs.length !== plans.length) throw new Error(`${plans.length} plan(s) but ${videoArgs.length} video(s)`);
const names = opt('names') ? list(opt('names')) : [];
const fpsOf = (p) => { const [n, d] = String(p.fps).split('/').map(Number); return n / (d || 1); };
const FPS = fpsOf(plans[0]);
if (plans.some((p) => fpsOf(p) !== FPS)) throw new Error('all cuts must share one frame rate');
const used = new Set();
const cuts = plans.map((plan, i) => {
  let id = String(plan.cut || String(plan.id || 'film').replace(/-\d+$/, '')).toLowerCase().replace(/[^a-z0-9-]+/g, '-') || 'film';
  while (used.has(id)) id += '-' + (i + 1);
  used.add(id);
  const video = path.resolve(ROOT, videoArgs[i]);
  if (!fs.existsSync(video)) throw new Error('missing video ' + video);
  const line = (tid) => { const t = (plan.text || []).find((x) => x.id === tid); return t ? String(t.content).split('\n')[0] : ''; };
  const sub = [line('name-giant'), line('name-dwarf')].filter(Boolean).join(' / ');
  return { id, plan, video, frames: plan.frames, name: names[i] || String(plan.title || 'Film').split(/\s+[—–]\s+/)[0], sub };
});

// output picture size: portrait masters -> 720x1280, landscape -> within 1280x720 (never upscaled)
const [sw, sh] = probe(['-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', cuts[0].video]).split(',').map(Number);
let W, H;
if (opt('size')) [W, H] = opt('size').split('x').map(Number);
else { const [bw, bh] = sh > sw ? [720, 1280] : [1280, 720]; const s = Math.min(1, bw / sw, bh / sh); W = 2 * Math.round((sw * s) / 2); H = 2 * Math.round((sh * s) / 2); }
const [TW, TH] = H > W ? [90, 2 * Math.round((90 * H) / W / 2)] : [2 * Math.round((90 * W) / H / 2), 90];
const maxrate = opt('maxrate', '3000k');
const vEnc = codec === 'vp9'
  ? ['-c:v', 'libvpx-vp9', '-b:v', opt('vbr', '1M'), '-deadline', 'realtime', '-cpu-used', '8', '-row-mt', '1', '-pix_fmt', 'yuv420p']
  : ['-c:v', 'libx264', '-preset', 'medium', '-crf', opt('crf', '23'), '-maxrate', maxrate, '-bufsize', `${2 * parseInt(maxrate, 10)}k`, '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.1'];
const aext = codec === 'vp9' ? 'webm' : 'mp4';
const aEnc = codec === 'vp9' ? ['-c:a', 'libopus', '-b:a', opt('abr', '160k')] : ['-c:a', 'aac', '-b:a', opt('abr', '192k'), '-movflags', '+faststart'];

fs.mkdirSync(path.join(out, 'media'), { recursive: true });
fs.mkdirSync(cacheDir, { recursive: true });

// ---------- 1. analysis: one decode per cut -> per-frame picture md5, decoded-audio md5, thumbs, peaks ----------
function analyse(cut) {
  const st = fs.statSync(cut.video);
  const frames = cut.frames, dur = frames / FPS;
  const thumbFile = cuts.length > 1 ? `thumbs.${cut.id}.jpg` : 'thumbs.jpg';
  const key = JSON.stringify({ v: 4, trim: argv.includes('--allow-trim'), video: cut.video, size: st.size, mtime: st.mtimeMs, frames, FPS, TW, TH });
  const cf = path.join(cacheDir, cut.id + '.analysis.json');
  if (fs.existsSync(cf) && fs.existsSync(path.join(out, thumbFile))) {
    const c = JSON.parse(fs.readFileSync(cf, 'utf8'));
    if (c.key === key) { console.log(`${cut.id}: analysis cached`); return c; }
  }
  const t0 = Date.now();
  const count = Math.ceil(dur), cols = 16, rows = Math.ceil(count / cols);
  const vh = path.join(cacheDir, cut.id + '.framemd5'), ah = path.join(cacheDir, cut.id + '.audiomd5');
  const hasAudio = probe(['-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', cut.video]) !== '';
  if (!hasAudio) throw new Error(`${cut.video} has no soundtrack (the Edit Room plays picture only against sound)`);
  const pcm = ff(['-i', cut.video,
    '-map', '0:v:0', '-f', 'framehash', '-hash', 'md5', vh,
    '-map', '0:v:0', '-vf', `fps=1,scale=${TW}:${TH}:flags=bicubic,tile=${cols}x${rows}`, '-frames:v', '1', '-q:v', '5', path.join(out, thumbFile),
    '-map', '0:a:0', '-t', dur.toFixed(6), '-ac', '2', '-ar', '48000', '-c:a', 'pcm_s16le', '-f', 'hash', '-hash', 'md5', ah,
    '-map', '0:a:0', '-t', dur.toFixed(6), '-ac', '1', '-ar', '4000', '-f', 's16le', 'pipe:1']);
  const fh = fs.readFileSync(vh, 'utf8').split('\n').filter((l) => l && l[0] !== '#').map((l) => l.split(',').pop().trim());
  if (fh.length < frames || (fh.length > frames && !argv.includes('--allow-trim'))) {
    throw new Error(`${path.relative(ROOT, cut.video)} has ${fh.length} frames but its plan has ${frames}: it was not rendered from this plan version (pass the matching plan, or --allow-trim to cut a longer video)`);
  }
  const clipHashes = [];
  for (let a = 0; a < frames; a += CLIP) clipHashes.push(sha1(fh.slice(a, Math.min(frames, a + CLIP)).join('')) + ':' + (Math.min(frames, a + CLIP) - a));
  const audioHash = fs.readFileSync(ah, 'utf8').trim();
  // waveform peaks from the cut's own soundtrack, so the timeline matches what plays
  const samples = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.length / 2));
  const N = 3200, peaks = new Float64Array(N);
  for (let i = 0; i < samples.length; i++) { const b = Math.min(N - 1, Math.floor((i / samples.length) * N)); const v = Math.abs(samples[i]); if (v > peaks[b]) peaks[b] = v; }
  const mx = Math.max(1, ...peaks);
  const wave = Buffer.from(Uint8Array.from(peaks, (p) => Math.round(255 * Math.sqrt(p / mx)))).toString('base64');
  const res = { key, clipHashes, audioHash, wave, thumbs: { file: thumbFile, cols, rows, count, every: 1, w: TW, h: TH } };
  fs.writeFileSync(cf, JSON.stringify(res));
  fs.rmSync(vh, { force: true });
  console.log(`${cut.id}: analysed ${frames} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  return res;
}
for (const cut of cuts) cut.an = analyse(cut);

// ---------- 2. picture: one stored clip per distinct 240-frame picture ----------
const manifestFile = path.join(cacheDir, 'media.json');
const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : {};
const encSig = (h) => sha1(JSON.stringify([h, codec, W, H, vEnc, FPS]));
const unique = new Map();   // clip picture hash -> { file, cut, a, b, hash, users }
for (const cut of cuts) {
  cut.clips = [];
  for (let k = 0, a = 0; a < cut.frames; k++, a += CLIP) {
    const b = Math.min(cut.frames, a + CLIP), h = cut.an.clipHashes[k];
    let u = unique.get(h);
    if (!u) { u = { file: `media/clip_${pad2(k)}${cut === cuts[0] ? '' : '.' + cut.id}.${ext}`, cut, a, b, hash: h, users: [] }; unique.set(h, u); }
    u.users.push(`${cut.id}#${k}`);
    cut.clips.push({ file: u.file, start: a, end: b });
  }
}
for (const cut of cuts) {
  const own = [...unique.values()].filter((u) => u.cut === cut).sort((x, y) => x.a - y.a);
  const todo = own.filter((u) => !(manifest[u.file] === encSig(u.hash) && fs.existsSync(path.join(out, u.file))));
  if (!todo.length) { if (own.length) console.log(`${cut.id}: ${own.length} clip(s) cached`); continue; }
  const t0 = Date.now();
  const total = todo.reduce((s, u) => s + u.b - u.a, 0);
  const everything = todo.length === cut.clips.length;
  // frame-exact by construction: sequential decode from frame 0, select by decoded frame index n
  const sel = everything ? '' : `select='${todo.map((u) => `between(n,${u.a},${u.b - 1})`).join('+')}',setpts=N/(${FPS}*TB),`;
  const tmp = (i) => path.join(out, 'media', `.part_${cut.id}_${String(i).padStart(3, '0')}.${ext}`);
  const args = ['-i', cut.video, '-map', '0:v:0', '-an', '-vf', `${sel}scale=${W}:${H}:flags=lanczos,setsar=1`, '-frames:v', String(total),
    ...vEnc, '-r', String(FPS), '-g', String(FPS), '-keyint_min', String(FPS), '-sc_threshold', '0', '-force_key_frames', `expr:eq(mod(n,${CLIP}),0)`];
  if (todo.length === 1) ff([...args, ...(ext === 'mp4' ? ['-movflags', '+faststart'] : []), '-f', ext, tmp(0)]);
  else {
    // every selected clip but the film's last is 240 frames, so the splits fall on multiples of 240
    const splits = todo.slice(1).map((_, i) => (i + 1) * CLIP);
    ff([...args, '-f', 'segment', '-segment_frames', splits.join(','), '-reset_timestamps', '1', '-segment_format', ext,
      ...(ext === 'mp4' ? ['-segment_format_options', 'movflags=+faststart'] : []), path.join(out, 'media', `.part_${cut.id}_%03d.${ext}`)]);
  }
  todo.forEach((u, i) => {
    const dst = path.join(out, u.file);
    fs.renameSync(tmp(i), dst);
    const n = +probe(['-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', dst]);
    if (n !== u.b - u.a) throw new Error(`${u.file} has ${n} frames, expected ${u.b - u.a}`);
    manifest[u.file] = encSig(u.hash);
  });
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 1));
  console.log(`${cut.id}: encoded ${todo.length} clip(s) (${total} frames) in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}

// ---------- 3. sound: one continuous file per distinct decoded soundtrack (the page's master clock) ----------
const sounds = new Map();   // decoded-audio md5 -> file
for (const cut of cuts) {
  let f = sounds.get(cut.an.audioHash);
  if (!f) {
    f = `media/soundtrack${sounds.size ? '.' + cut.id : ''}.${aext}`;
    sounds.set(cut.an.audioHash, f);
    const sig = sha1(JSON.stringify([cut.an.audioHash, aEnc, cut.frames]));
    if (!(manifest[f] === sig && fs.existsSync(path.join(out, f)))) {
      ff(['-i', cut.video, '-map', '0:a:0', '-vn', '-t', (cut.frames / FPS).toFixed(6), ...aEnc, '-ac', '2', '-ar', '48000', path.join(out, f)]);
      manifest[f] = sig; fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 1));
    }
  }
  cut.audio = f;
}

// ---------- 4. timeline data per cut, from its plan + the grid (single source of truth) ----------
// Acts are anchored on shot NUMBERS (S22, F27...), so new ids, split shots ('S26-expansion·2') and the
// statue inserts (M01..M16, never anchors) all resolve; a missing anchor simply drops that act.
const ACTS = [
  ['I · Attraction', 'I', ['S01']], ['II · Resistance', 'II-A', ['S07']], ['II · Compression', 'II-B', ['S12']],
  ['II · Frenzy', 'II-C', ['F27']], ['II · Ladder', 'II-D', ['S16']], ['III · Ignition', 'III', ['S22']],
  ['IV · Aftermath', 'IV', ['S26']], ['Coda', 'Coda', ['S31']],
];
const shotNo = (id) => { const m = /^([A-Za-z]+\d+)/.exec(String(id).split('·')[0].trim()); return m ? m[1].toUpperCase() : String(id); };
function timeline(cut) {
  const plan = cut.plan;
  const shots = [...plan.shots].sort((a, b) => a.start - b.start);
  const acts = [];
  for (const [name, short, keys] of ACTS) {
    for (const k of keys) {
      const hit = shots.filter((s) => shotNo(s.id) === k);
      if (hit.length) { acts.push({ name, short, start: Math.min(...hit.map((s) => s.start)) }); break; }
    }
  }
  acts.sort((a, b) => a.start - b.start);
  if (acts.length) acts[0].start = 0;
  acts.forEach((a, i) => { a.end = i + 1 < acts.length ? acts[i + 1].start : plan.frames; });
  const actOf = (f) => acts.find((a) => f >= a.start && f < a.end) || acts[acts.length - 1] || { name: '' };
  const music = (plan.audio || []).filter((a) => a.path && /winter/.test(a.path));
  const toFrame = (s) => {
    for (const a of music) { const f = (a.timelineStart / FPS + (s - a.sourceInSeconds) / (a.playbackRate || 1)) * FPS; if (f >= a.timelineStart && f < a.timelineEnd) return Math.round(f); }
    return null;
  };
  const bars = grid.bars.map((b) => ({ bar: b.bar, frame: toFrame(b.start) })).filter((b) => b.frame !== null);
  const cues = (plan.cues || []).filter((c) => ['orchestral-strike', 'edit-cut', 'music-reentry', 'cannon'].includes(c.kind)).map((c) => ({ id: c.id, kind: c.kind, frame: c.frame }));
  const text = (plan.text || []).map((t) => ({ id: t.id, start: t.start, end: t.end, content: String(t.content), style: t.style || '' }));
  return { shots, acts, actOf, bars, cues, text };
}
// what makes a shot's picture: its scene, preset, params and the words over it
const pictureKey = (cut, s) => JSON.stringify([s.scene, s.preset || null, s.params || null, s.start, s.end,
  (cut.plan.text || []).filter((t) => t.start < s.end && t.end > s.start).map((t) => t.content)]);
const git = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).stdout.trim();
const waves = {};
for (const cut of cuts) if (!waves[cut.audio]) waves[cut.audio] = cut.an.wave;
const data = {
  v: 2, fps: FPS, width: W, height: H,
  noteCut: cuts.some((c) => c.id === 'david') ? 'david' : cuts[0].id,   // notes saved before cuts existed belong here
  cuts: cuts.map((cut) => {
    const T = timeline(cut);
    return {
      id: cut.id, key: cut.plan.id || cut.id, name: cut.name, sub: cut.sub, title: cut.plan.title || cut.name, frames: cut.frames,
      shots: T.shots.map((s) => {
        const mine = pictureKey(cut, s);
        // compared only with the cuts of the same plan version (v2 and v3 differ by design after the climax)
        const peers = cuts.filter((o) => (o.plan.version ?? null) === (cut.plan.version ?? null));
        const diff = peers.length > 1 && peers.some((o) => { const t = o.plan.shots.find((x) => x.id === s.id && x.start === s.start); return !t || pictureKey(o, t) !== mine; });
        return {
          id: s.id, start: s.start, end: s.end, scene: s.scene, purpose: s.purpose || '', action: s.action || '', framing: s.framing || '', act: T.actOf(s.start).name,
          ...(s.preset ? { preset: s.preset } : {}), ...(s.params && s.params.figure ? { figure: s.params.figure } : {}), ...(diff ? { diff: true } : {}),
        };
      }),
      acts: T.acts, cues: T.cues, bars: T.bars, text: T.text,
      thumbs: cut.an.thumbs, clips: cut.clips, audio: cut.audio,
    };
  }),
  waves,
  build: { label: opt('label', 'Render 1'), render: +opt('render', 1), commit: git, note: opt('note', ''), built: new Date().toISOString().slice(0, 10) },
};
const json = JSON.stringify(data).replace(/</g, '\\u003c');
const tpl = fs.readFileSync(path.join(ROOT, 'src/review/editroom.html'), 'utf8');
fs.writeFileSync(path.join(out, 'editroom.html'), tpl.replace('__FILM_DATA__', () => json));

// ---------- 5. file list, stale cleanup, size math ----------
const files = [...new Set([...cuts.flatMap((c) => c.clips.map((x) => x.file)), ...sounds.values(), ...cuts.map((c) => c.an.thumbs.file)])];
const keep = new Set(files);
for (const f of fs.readdirSync(path.join(out, 'media'))) if (!keep.has('media/' + f)) fs.rmSync(path.join(out, 'media', f), { force: true });
for (const f of fs.readdirSync(out)) if (/^thumbs.*\.jpg$/.test(f) && !keep.has(f)) fs.rmSync(path.join(out, f), { force: true });
const size = (f) => fs.statSync(path.join(out, f)).size;
const total = files.reduce((s, f) => s + size(f), 0);
fs.writeFileSync(path.join(out, 'files.json'), JSON.stringify(files, null, 1));
const biggest = files.reduce((m, f) => (size(f) > size(m) ? f : m), files[0]);
const clipFiles = files.filter((f) => /\/clip_/.test(f));
const sum = (fs_) => fs_.reduce((s, f) => s + size(f), 0);
const page = fs.statSync(path.join(out, 'editroom.html')).size;
console.log(`picture ${W}x${H} ${codec}; ${cuts.length} cut(s), ${cuts.reduce((s, c) => s + c.clips.length, 0)} clip slots -> ${clipFiles.length} stored clips`);
for (const c of cuts) {
  const own = c.clips.filter((x) => [...unique.values()].find((u) => u.file === x.file).cut === c).length;
  console.log(`  ${c.id.padEnd(11)} ${c.clips.length} clips: ${own} stored for this cut, ${c.clips.length - own} shared; sound ${c.audio}`);
}
console.log(`  clips ${MB(sum(clipFiles))} MB + sound ${MB(sum([...sounds.values()]))} MB (${sounds.size} file) + thumbs ${MB(sum(cuts.map((c) => c.an.thumbs.file)))} MB`);
// publish batches of at most 64 MB (page + files), filled in order
const LIMIT = 64e6 - page - 1e6;
const batches = [[]]; let acc = 0;
for (const f of files) { if (acc + size(f) > LIMIT && batches[batches.length - 1].length) { batches.push([]); acc = 0; } batches[batches.length - 1].push(f); acc += size(f); }
console.log(`editroom: ${files.length} files, ${MB(total)} MB media, largest ${biggest} ${MB(size(biggest))} MB, page ${(page / 1e3).toFixed(0)} KB; ` +
  `publish batches: ${batches.map((b) => `${b.length} files ${MB(sum(b))} MB`).join(' + ')}`);
const over = files.filter((f) => size(f) > 15e6);
if (over.length) throw new Error('over the 15 MB per-file limit: ' + over.join(', '));
