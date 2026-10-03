#!/usr/bin/env node
// Package a render for the Edit Room review page (src/review/editroom.html):
//   10 s picture clips + one continuous soundtrack (the page keeps them in step, frame-accurate),
//   a 1 fps thumbnail sprite for timeline hover, an audio waveform, and the plan's shots, acts,
//   cues and bar lines -- all derived from film-plan.json and analysis/grid.json.
//
//   node tools/build-review.mjs [--video dist/david-and-goliath.mp4] [--out out/editroom]
//                               [--label "Render 1"] [--render 1] [--codec h264|vp9]
// --codec vp9 is only for local tests in the open-source Chromium (no H.264); publish h264.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const video = path.resolve(ROOT, opt('video', 'dist/david-and-goliath.mp4'));
const out = path.resolve(ROOT, opt('out', 'out/editroom'));
const codec = opt('codec', 'h264');
const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'film-plan.json'), 'utf8'));
const grid = JSON.parse(fs.readFileSync(path.join(ROOT, 'analysis/grid.json'), 'utf8'));
const [num, den] = plan.fps.split('/').map(Number);
const FPS = num / (den || 1);

function run(args, opts = {}) {
  const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 1 << 30, ...opts });
  if (r.status !== 0) throw new Error('ffmpeg failed: ' + args.join(' '));
  return r.stdout;
}
if (!fs.existsSync(video)) throw new Error('missing video ' + video);
fs.rmSync(path.join(out, 'media'), { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'media'), { recursive: true });

// 1. picture: standalone 10 s clips aligned to the render's 240-frame blocks (muted; the page keeps
//    them in step with the soundtrack). Plain MP4/WebM plays everywhere, iPhone included, and each
//    clip stays far below the 15 MB per-file limit.
const CLIP = 240;
const ext = codec === 'vp9' ? 'webm' : 'mp4';
const vEnc = codec === 'vp9'
  ? ['-c:v', 'libvpx-vp9', '-b:v', '3M', '-deadline', 'realtime', '-cpu-used', '8', '-row-mt', '1']
  : ['-c:v', 'libx264', '-preset', 'medium', '-crf', opt('crf', '20'), '-maxrate', opt('maxrate', '7000k'), '-bufsize', '14000k', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.1'];
const cuts = []; for (let a = CLIP; a < plan.frames; a += CLIP) cuts.push(a);
// one encode, split at forced keyframes on the exact block boundaries
run(['-i', video, '-map', '0:v:0', '-an', ...vEnc, '-r', String(FPS), '-g', String(FPS), '-keyint_min', String(FPS), '-sc_threshold', '0',
  '-force_key_frames', `expr:eq(mod(n,${CLIP}),0)`, '-f', 'segment', '-segment_frames', cuts.join(','), '-reset_timestamps', '1',
  '-segment_format', ext, ...(ext === 'mp4' ? ['-segment_format_options', 'movflags=+faststart'] : []), path.join(out, `media/clip_%02d.${ext}`)]);
const clips = [];
for (let a = 0, k = 0; a < plan.frames; a += CLIP, k++) {
  const b = Math.min(plan.frames, a + CLIP);
  const file = `media/clip_${String(k).padStart(2, '0')}.${ext}`;
  const n = +spawnSync('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', path.join(out, file)], { encoding: 'utf8' }).stdout.trim();
  if (n !== b - a) throw new Error(`${file} has ${n} frames, expected ${b - a}`);
  clips.push({ file, start: a, end: b });
}
// 2. sound: one continuous file, the master clock
const audioFile = codec === 'vp9' ? 'media/soundtrack.webm' : 'media/soundtrack.mp4';
run(['-i', video, '-map', '0:a:0', '-vn', ...(codec === 'vp9' ? ['-c:a', 'libopus', '-b:a', '160k'] : ['-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart']), '-ac', '2', '-ar', '48000', path.join(out, audioFile)]);

// 3. thumbnail sprite: one 160x90 frame per second
const dur = plan.frames / FPS;
const count = Math.ceil(dur);
const cols = 16, rows = Math.ceil(count / cols);
run(['-i', video, '-vf', `fps=1,scale=160:90,tile=${cols}x${rows}`, '-frames:v', '1', '-q:v', '5', path.join(out, 'thumbs.jpg')]);

// 4. waveform peaks (from the video's own soundtrack, so it matches what plays)
const pcm = run(['-i', video, '-map', '0:a:0', '-ac', '1', '-ar', '4000', '-f', 's16le', '-'], {});
const samples = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.length / 2));
const N = 3200, peaks = new Float64Array(N);
for (let i = 0; i < samples.length; i++) { const b = Math.min(N - 1, Math.floor((i / samples.length) * N)); const v = Math.abs(samples[i]); if (v > peaks[b]) peaks[b] = v; }
const mx = Math.max(1, ...peaks);
const wave = Buffer.from(Uint8Array.from(peaks, (p) => Math.round(255 * Math.sqrt(p / mx)))).toString('base64');

// 5. timeline data from the plan + grid (single source of truth)
const shots = [...plan.shots].sort((a, b) => a.start - b.start);
const startOf = (id) => shots.find((s) => s.id === id).start;
const actDefs = [
  ['I · Attraction', 'I', 'S01-abyss'], ['II · Resistance', 'II-A', 'S07-stream'], ['II · Compression', 'II-B', 'S12-engulf'],
  ['II · Frenzy', 'II-C', 'F27.1'], ['II · Ladder', 'II-D', 'S16-ladder'], ['III · Ignition', 'III', 'S22-ignition'], ['IV · Aftermath', 'IV', 'S26-expansion'],
];
const acts = actDefs.map(([name, short, id], i) => ({ name, short, start: startOf(id), end: i + 1 < actDefs.length ? startOf(actDefs[i + 1][2]) : plan.frames }));
const actOf = (f) => acts.find((a) => f >= a.start && f < a.end) || acts[acts.length - 1];
const music = plan.audio.filter((a) => a.path && /winter/.test(a.path));
const toFrame = (s) => {
  for (const a of music) { const f = (a.timelineStart / FPS + (s - a.sourceInSeconds) / (a.playbackRate || 1)) * FPS; if (f >= a.timelineStart && f < a.timelineEnd) return Math.round(f); }
  return null;
};
const bars = grid.bars.map((b) => ({ bar: b.bar, frame: toFrame(b.start) })).filter((b) => b.frame !== null);
const cues = plan.cues.filter((c) => ['orchestral-strike', 'edit-cut', 'music-reentry', 'cannon'].includes(c.kind)).map((c) => ({ id: c.id, kind: c.kind, frame: c.frame }));
const git = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).stdout.trim();
const data = {
  fps: FPS, frames: plan.frames,
  shots: shots.map((s) => ({ id: s.id, start: s.start, end: s.end, scene: s.scene, purpose: s.purpose, action: s.action, framing: s.framing, act: actOf(s.start).name })),
  acts, cues, bars, wave,
  thumbs: { file: 'thumbs.jpg', cols, rows, count, every: 1 },
  media: { clips, audio: audioFile },
  build: { label: opt('label', 'Render 1'), render: +opt('render', 1), commit: git, note: opt('note', '') },
};
const json = JSON.stringify(data).replace(/</g, '\\u003c');
const tpl = fs.readFileSync(path.join(ROOT, 'src/review/editroom.html'), 'utf8');
fs.writeFileSync(path.join(out, 'editroom.html'), tpl.replace('__FILM_DATA__', json));

const files = fs.readdirSync(path.join(out, 'media')).map((f) => 'media/' + f).concat('thumbs.jpg');
const total = files.reduce((s, f) => s + fs.statSync(path.join(out, f)).size, 0);
fs.writeFileSync(path.join(out, 'files.json'), JSON.stringify(files, null, 1));
const biggest = Math.max(...files.map((f) => fs.statSync(path.join(out, f)).size));
console.log(`editroom: ${files.length} files, ${(total / 1e6).toFixed(1)} MB media, largest ${(biggest / 1e6).toFixed(1)} MB, page ${(fs.statSync(path.join(out, 'editroom.html')).size / 1e3).toFixed(0)} KB`);
