#!/usr/bin/env node
// Soundtrack renderer: serves the repo, runs src/audio/index.html (score.js) in headless Chromium, where every
// stem is rendered in an OfflineAudioContext(2, 48000 * plan duration, 48000) and mastered; the page POSTs the WAVs
// back. The cuts of one version share the timeline (the plan's directory holds them), so one mix serves them all.
//
//   node tools/render-audio.mjs [--plan film-plan.json] [--out out/audio] [--no-stems] [--no-measure] [--no-publish]
//                               [--only ignition,coda] [--spectra 108-130,150-end]
//   node tools/render-audio.mjs --verify dist/david-916.mp4,dist/prometheus-916.mp4 [--ref out/audio/mix.wav] [--plan ..]
//
// --plan: the timeline score.js follows (index.html?plan=...), e.g. --plan out/plan-v3/film-plan.json. The shared-
// timeline check compares every film-plan*.json in that plan's directory.
// Outputs: out/audio/mix.wav (24-bit PCM, 48 kHz stereo, exactly plan.frames / fps long),
// out/audio/stems/*.wav (32-bit float, as they enter their buses),
// out/audio/report.json (cue/level/master report, plus ffmpeg's EBU R128 measurement of the written mix: integrated
// loudness, true peak, the short-term (3 s) profile at the strikes, the build, the explosion, the return, the final
// stare and outside the climax), and spectrograms: spectrum-climax.png (from the last strike, 22 s: 108-130 s),
// spectrum-ending.png (the last 13.2 s) and spectrum-coda.png (coda cut to the end); --spectra a-b,c-d (seconds,
// 'end' allowed) replaces the first two windows.
// --only renders just the named stems, raw, with mix.wav their 32-bit float sum (development).
//
// Publishing: tools/chunk.mjs assemble and tools/encode.mjs mux out/audio/mix.wav unless given --audio, so a full
// render of the root film-plan.json into another --out also copies its mix.wav and report.json to out/audio/
// (--no-publish skips that). A render of any other --plan is never published: out/audio/ must follow the root plan.
// The default mux then always carries the current score, never an older mix of another length.
// Delivery: the film ships with an AAC track. A full render runs its mix through two encodes and checks each decoded
// track like a muxed cut (report.ffmpeg.delivered): AAC_MUX, what tools/chunk.mjs assemble and tools/encode.mjs use
// today (320 kb/s, ffmpeg's default twoloop coder), and AAC_DELIVERY, the encode the soundtrack is mastered for.
// At 320 kb/s twoloop codes the climax's dense low end at about 26 dB SNR, and its decoded true peak overshoots the
// mix by +1 to +2 dB (above 0 dBTP). At 512 kb/s with the fast coder (about 423 kb/s actual) the decoded peak equals
// the mix's, and the coding SNR is 8 to 13 dB better in every section.
// --verify runs the same checks on muxed files against the published mix: an AAC stream exists and is the film's
// length, its decoded loudness, true peak (<= -1 dBTP), climax and coda match the mix, and it is in sync at the
// ignition. Exit code 1 on any failure.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const flag = (k) => argv.includes('--' + k);
const OUT = opt('out', 'out/audio').replace(/\/+$/, '');
const PUBLISH = 'out/audio';               // the mix tools/chunk.mjs assemble and tools/encode.mjs mux by default
const ROOT_PLAN = 'film-plan.json';        // the timeline the published mix must follow
// the plan the score follows: a repo-relative .json (served to the page as index.html?plan=...)
const PLAN = path.relative(ROOT, path.resolve(ROOT, opt('plan', ROOT_PLAN))).split(path.sep).join('/');
if (PLAN.startsWith('..') || !PLAN.endsWith('.json') || !fs.existsSync(path.join(ROOT, PLAN))) {
  console.error(`--plan ${opt('plan')}: not a plan file inside the repo`); process.exit(1);
}
const TP_MAX = -1.0;                       // delivered true peak ceiling, dBTP
const AAC_MUX = ['-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-ac', '2'];                          // chunk.mjs / encode.mjs today
const AAC_DELIVERY = ['-c:a', 'aac', '-b:a', '512k', '-aac_coder', 'fast', '-ar', '48000', '-ac', '2'];  // what the mix is mastered for
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.ogg': 'audio/ogg', '.flac': 'audio/flac', '.wav': 'audio/wav' };

function serve() {
  const outRoot = path.join(ROOT, 'out');
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://x');
      if (req.method === 'POST' && url.pathname === '/__write') {
        // the page may only write below out/
        const p = path.resolve(ROOT, url.searchParams.get('path') || '');
        if (!p.startsWith(outRoot + path.sep)) { res.writeHead(403); res.end('only under out/'); return; }
        fs.mkdirSync(path.dirname(p), { recursive: true });
        const ws = fs.createWriteStream(p);
        req.pipe(ws);
        ws.on('finish', () => { res.writeHead(200); res.end('ok'); });
        ws.on('error', (e) => { res.writeHead(500); res.end(String(e)); });
        return;
      }
      const p = path.join(ROOT, decodeURIComponent(url.pathname));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(p).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

function planInfo(file = ROOT_PLAN) {
  const plan = JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
  const [a, b] = String(plan.fps).split('/').map(Number), fps = a / (b || 1);
  return { plan, fps, dur: plan.frames / fps, cue: (id) => plan.cues.find((c) => c.id === id) };
}

// ffmpeg, asynchronously (independent passes run side by side): resolves { status, stdout, stderr }
function run(cmd, args, { binary = false } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args), out = [], err = [];
    p.stdout.on('data', (d) => out.push(d)); p.stderr.on('data', (d) => err.push(d));
    p.on('error', reject);
    p.on('close', (status) => { const o = Buffer.concat(out); resolve({ status, stdout: binary ? o : o.toString('utf8'), stderr: Buffer.concat(err).toString('utf8') }); });
  });
}

// One ffmpeg EBU R128 pass over the first audio stream (video, if any, is not decoded): integrated loudness, loudness
// range, true peak (ebur128 peak=true is 4x oversampled) and the short-term loudness S (3 s window ending at t, every
// 100 ms) and the momentary loudness M (400 ms).
const SCAN_ARGS = (file) => ['-hide_banner', '-nostats', '-loglevel', 'verbose', '-i', file, '-map', '0:a:0', '-vn',
  '-af', 'ebur128=peak=true:framelog=verbose', '-f', 'null', '-'];
function parseScan(stderr) {
  const t = [], S = [], M = [];
  for (const line of stderr.split('\n')) { const m = /\bt:\s*([\d.]+).*?\bM:\s*(-?[\d.]+).*?\bS:\s*(-?[\d.]+)/.exec(line); if (m) { t.push(+m[1]); M.push(+m[2]); S.push(+m[3]); } }
  const s = stderr.slice(stderr.lastIndexOf('Summary:'));
  const num = (re) => { const m = re.exec(s); return m ? +m[1] : null; };
  return { integratedLufs: num(/I:\s+(-?[\d.]+) LUFS/), lra: num(/LRA:\s+(-?[\d.]+) LU/), truePeakDbtp: num(/Peak:\s+(-?[\d.]+) dBFS/), series: { t, S, M } };
}
export function loudnessScan(file) {
  const r = spawnSync('ffmpeg', SCAN_ARGS(file), { encoding: 'utf8', maxBuffer: 1 << 29 });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(r.stderr.slice(-400));
  return parseScan(r.stderr);
}
async function loudnessScanAsync(file) {
  const r = await run('ffmpeg', SCAN_ARGS(file));
  if (r.status !== 0) throw new Error(r.stderr.slice(-400));
  return parseScan(r.stderr);
}
export function ebur128(file) { const { series, ...m } = loudnessScan(file); return m; }
export function shortTermSeries(file) { return loudnessScan(file).series; }
function stMax({ t, S }, t0 = 0, t1 = Infinity) {
  let m = -Infinity, at = null;
  for (let i = 0; i < t.length; i++) if (t[i] >= t0 - 1e-6 && t[i] <= t1 + 1e-6 && S[i] > m) { m = S[i]; at = t[i]; }
  return { lufs: m, t: at };
}
// value of a series at the sample nearest t (the 3 s / 400 ms window ending there)
function at(ser, key, t) {
  let best = 0; for (let i = 0; i < ser.t.length; i++) if (Math.abs(ser.t[i] - t) < Math.abs(ser.t[best] - t)) best = i;
  return ser[key][best];
}
// energy mean of the short-term values of windows ending in [t0, t1]
function stMean({ t, S }, t0, t1) {
  let e = 0, n = 0; for (let i = 0; i < t.length; i++) if (t[i] >= t0 - 1e-6 && t[i] <= t1 + 1e-6) { e += Math.pow(10, S[i] / 10); n++; }
  return n ? +(10 * Math.log10(e / n)).toFixed(2) : null;
}
// the measured profile against the plan: strikes, the climax window (ignition, or the explosion when the plan has
// one, + 75 frames), outside the climax. With an explosion cue (v3): the build (implosion -> explosion), the
// explosion, bars 56-59 of the return, the aftermath (bar 60 to the end of the music), the final stare.
function profile(ser, P) {
  const { fps, cue } = P;
  const ign = cue('ignition').frame / fps, ret = cue('return-bar56').frame / fps, end = P.dur;
  const xc = cue('explosion'), tx = xc ? xc.frame / fps : ign;
  const strikes = P.plan.cues.filter((c) => c.kind === 'orchestral-strike').map((c) => c.frame / fps).sort((x, y) => x - y);
  const win = stMax(ser, tx, tx + 75 / fps), pre = stMax(ser, 0, ign);
  const bar60 = cue('bar-60') ? cue('bar-60').frame / fps : ret + 12;
  const winterB = P.plan.audio.find((a) => a.id === 'winter-b'), musicEnd = winterB ? winterB.timelineEnd / fps : end;
  const after = xc ? stMax(ser, bar60, musicEnd) : stMax(ser, ret + 3, end);
  const outside = pre.lufs >= after.lufs ? pre : after;
  const r = {
    overall: stMax(ser), strikes: stMax(ser, strikes[0], ign),
    perStrike: strikes.map((s, k) => stMax(ser, s, k + 1 < strikes.length ? strikes[k + 1] : ign)),
    climaxWindow: { ...win, frames: [Math.round(tx * fps), Math.round(tx * fps) + 75] }, climax: stMax(ser, ign, xc ? bar60 : ret),
    preIgnition: pre, aftermath: after, outsideClimax: outside, marginLu: +(win.lufs - outside.lufs).toFixed(1),
    coda: cue('coda') ? stMax(ser, cue('coda').frame / fps, end) : null,
  };
  if (xc) {
    // the build: S21's implosion (32 frames before the ignition cut) to the frame before the explosion
    const b0 = (cue('ignition').frame - 32) / fps, b1 = (xc.frame - 1) / fps;
    const shots = P.plan.shots, last = shots[shots.length - 1], coda = cue('coda');
    const stare = coda && last.start > coda.frame ? last : null;
    const title = (P.plan.text || []).find((x) => x.id === 'end-title');
    r.build = { frames: [Math.round(b0 * fps), Math.round(b1 * fps)], max: stMax(ser, b0, b1), mean: stMean(ser, b0, b1),
      atCut: at(ser, 'S', ign), atEnd: at(ser, 'S', b1), momentaryAtCut: at(ser, 'M', ign), momentaryAtEnd: at(ser, 'M', b1 - 0.05),
      momentaryMax: stMax({ t: ser.t, S: ser.M }, b0, b1) };
    r.explosion = { frame: xc.frame, ...win, momentaryMax: stMax({ t: ser.t, S: ser.M }, tx, tx + 1) };
    r.bars56to59 = { span: [+tx.toFixed(3), +bar60.toFixed(3)], max: stMax(ser, tx, bar60), mean: stMean(ser, tx, bar60), from58: stMax(ser, (cue('bar-58') || { frame: xc.frame }).frame / fps, bar60) };
    r.buildToExplosionLu = +(win.lufs - r.build.max.lufs).toFixed(1);
    if (stare) {
      const s0 = stare.start / fps, tt = title ? title.start / fps : null;
      r.stare = { frames: [stare.start, stare.end], max: stMax(ser, s0, end), mean: stMean(ser, s0 + 1, end - 1.3),
        beforeTitle: tt ? stMax(ser, s0, tt) : null, withTitle: tt ? stMax(ser, tt, end) : null, lastSecond: stMax({ t: ser.t, S: ser.M }, end - 0.45, end) };
    }
  }
  return r;
}
// the cuts of one version must share the sound's timeline (fps, length, audio placements, cues, effects, shot
// timing): every film-plan*.json next to the plan being rendered
function sharedTimeline(plan = ROOT_PLAN) {
  const dir = path.dirname(path.join(ROOT, plan));
  const files = fs.readdirSync(dir).filter((f) => /^film-plan.*\.json$/.test(f)).sort();
  const key = (p) => JSON.stringify([p.fps, p.frames, p.audio, p.cues, p.effects, p.shots.map((s) => [s.id, s.start, s.end])]);
  const keys = files.map((f) => key(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))));
  return { plans: files.map((f) => path.relative(ROOT, path.join(dir, f)).split(path.sep).join('/')), identical: keys.every((k) => k === keys[0]) };
}
// No start/stop: with fscale=log, ffmpeg 6.1's showspectrumpic mislabels its frequency legend when they are set (a
// pure 87 Hz tone was drawn at the "220-300 Hz" labels, 1047 Hz at "1355"); without them the legend is right. The
// FFT size follows the image height, so a taller picture resolves the low end better.
const SPECTRUM_ARGS = (file, out, t0, dur) => ['-y', '-hide_banner', '-loglevel', 'error', '-ss', String(t0), '-t', String(dur), '-i', file,
  '-lavfi', 'showspectrumpic=s=1600x900:legend=1:fscale=log:drange=110', out];
async function spectrum(file, out, t0, dur) {
  const r = await run('ffmpeg', SPECTRUM_ARGS(file, out, t0, dur));
  if (r.status !== 0) throw new Error(r.stderr.slice(-300));
}
// spectrogram windows: --spectra a-b,c-d (s; 'end' = the film's end) or the defaults: the climax from the last
// strike (22 s) and the ending (the last 13.2 s)
function spectraWindows(P) {
  const strikes = P.plan.cues.filter((c) => c.kind === 'orchestral-strike').map((c) => c.frame / P.fps);
  const t0 = strikes.length ? Math.floor(Math.max(...strikes)) : 100;
  const parse = (s) => s.split('-').map((x) => (x === 'end' ? P.dur : +x));
  const ending = [Math.max(0, Math.floor(P.dur - 13.2)), P.dur];
  const w = opt('spectra', null) ? opt('spectra').split(',').map(parse) : [[t0, t0 + 22], ending];
  return [['climax', ...w[0]], ['ending', ...(w[1] || ending)]].map(([name, a, b]) => ({ name, start: +(+a).toFixed(3), end: +Math.min(P.dur, b).toFixed(3) }));
}

// ---------------------------------------------------------------------------------------------------------------
// Delivery checks: the decoded audio of a muxed file (or of the AAC round trip of a fresh mix) against the mix
// ---------------------------------------------------------------------------------------------------------------
// mono 48 kHz float PCM of [t0, t0 + dur) of the first audio stream (decoded from the start: sample-accurate)
function pcm(file, t0, dur) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', file, '-map', '0:a:0', '-ss', t0.toFixed(6), '-t', dur.toFixed(6),
    '-ac', '1', '-ar', '48000', '-f', 'f32le', '-'], { maxBuffer: 1 << 28 });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(String(r.stderr).slice(-300));
  const b = r.stdout, n = Math.floor(b.byteLength / 4), out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = b.readFloatLE(i * 4);
  return out;
}
// lag of `file` against the reference mix around time t (positive: the file is late) and the normalised correlation
function syncAt(refFile, file, t, winS = 0.6, maxS = 0.05) {
  const SR = 48000, M = Math.round(maxS * SR);
  const a = pcm(refFile, t - winS / 2, winS), x = pcm(file, t - winS / 2 - maxS, winS + 2 * maxS), N = a.length;
  let ea = 0; for (let i = 0; i < N; i++) ea += a[i] * a[i];
  let best = -Infinity, bestL = 0;
  for (let l = 0; l + N <= x.length; l++) {
    let c = 0, ex = 0;
    for (let i = 0; i < N; i++) { const v = x[l + i]; c += a[i] * v; ex += v * v; }
    const r = c / Math.sqrt(ea * ex + 1e-30);
    if (r > best) { best = r; bestL = l; }
  }
  return { lagMs: ((bestL - M) / SR) * 1000, corr: best };
}
function probe(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error((r.stderr || 'ffprobe failed').trim().slice(-200));
  return JSON.parse(r.stdout);
}
// ref: { file, ...loudnessScan(file) } of the mix the file should carry; scan: the file's loudnessScan, if already made
function deliveryCheck(file, ref, P, scan = null) {
  const checks = [], add = (name, ok, got, want) => checks.push({ name, ok: !!ok, got, want });
  const rel = path.relative(ROOT, file), name = rel.startsWith('..') ? file : rel;
  const done = (measured = null) => ({ file: name, ok: checks.every((c) => c.ok), checks, measured });
  let info;
  try { info = probe(file); } catch (e) { add('readable', false, e.message, 'a media file'); return done(); }
  const A = info.streams.filter((s) => s.codec_type === 'audio'), V = info.streams.filter((s) => s.codec_type === 'video');
  add('audio stream', A.length >= 1, `${A.length} audio stream(s)`, '>= 1 (a video-only file plays silent)');
  if (!A.length) return done();
  const a = A[0], tol = 1 / P.fps + 1024 / 48000;              // one frame + one AAC frame
  add('audio format', a.codec_name === 'aac' && +a.sample_rate === 48000 && +a.channels === 2, `${a.codec_name} ${a.sample_rate} Hz ${a.channels} ch`, 'aac 48000 Hz 2 ch');
  const aDur = +(a.duration ?? info.format.duration);
  add('audio length', Math.abs(aDur - P.dur) <= tol, `${aDur.toFixed(3)} s`, `${P.dur.toFixed(3)} s +- ${tol.toFixed(3)}`);
  if (V.length) { const vDur = +(V[0].duration ?? info.format.duration); add('video length', Math.abs(vDur - P.dur) <= tol, `${vDur.toFixed(3)} s`, `${P.dur.toFixed(3)} s +- ${tol.toFixed(3)}`); }
  const m = scan || loudnessScan(file);
  add('integrated loudness', Math.abs(m.integratedLufs - ref.integratedLufs) <= 0.5, `${m.integratedLufs} LUFS`, `${ref.integratedLufs} +- 0.5 (the mix)`);
  add('true peak', m.truePeakDbtp <= TP_MAX, `${m.truePeakDbtp} dBTP`, `<= ${TP_MAX} (mix: ${ref.truePeakDbtp}; if over, mux with ${AAC_DELIVERY.slice(2, 6).join(' ')})`);
  const pk = stMax(m.series), rpk = stMax(ref.series);
  add('climax (short-term max)', Math.abs(pk.t - rpk.t) <= 0.3 && Math.abs(pk.lufs - rpk.lufs) <= 0.5, `${pk.lufs} LUFS at ${pk.t} s`, `${rpk.lufs} at ${rpk.t} s (the mix)`);
  const star = P.cue('coda-star');
  let coda = null;
  if (star) {
    const t0 = star.frame / P.fps, rc = stMax(ref.series, t0, P.dur); coda = stMax(m.series, t0, P.dur);
    add('coda (star to the end)', Math.abs(coda.lufs - rc.lufs) <= 1.5, `short-term max ${coda.lufs} LUFS`, `${rc.lufs} +- 1.5 (the mix; silent means the mix is too short)`);
  }
  let sync = null;
  // checked at the film's main hit: the explosion when the plan has one, else the ignition
  const hit = P.cue('explosion') || P.cue('ignition'), hitName = `sync at the ${hit.id}`;
  try {
    sync = syncAt(ref.file, file, hit.frame / P.fps);
    add(hitName, Math.abs(sync.lagMs) <= 1 && sync.corr >= 0.95, `${sync.lagMs.toFixed(2)} ms, r = ${sync.corr.toFixed(3)}`, '|lag| <= 1 ms, r >= 0.95 (the same mix, in place)');
  } catch (e) { add(hitName, false, e.message, `decodable audio at the ${hit.id}`); }
  return done({ integratedLufs: m.integratedLufs, lra: m.lra, truePeakDbtp: m.truePeakDbtp, shortTermMax: pk, coda, sync, audioSeconds: aDur });
}
function printCheck(r) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.file}`);
  for (const c of r.checks) console.log(`  ${c.ok ? 'ok  ' : 'FAIL'} ${c.name}: ${c.got}   (want ${c.want})`);
}

// --verify: delivery checks of muxed files against the published (or --ref) mix; no render
function verify() {
  const P = planInfo(PLAN);
  const refFile = path.resolve(ROOT, opt('ref', `${PUBLISH}/mix.wav`));
  const refDur = +probe(refFile).streams.find((s) => s.codec_type === 'audio').duration;
  if (Math.abs(refDur - P.dur) > 1e-3) {
    console.error(`${path.relative(ROOT, refFile)} is ${refDur.toFixed(3)} s but the film is ${P.dur.toFixed(3)} s: it is an older mix. Render the soundtrack (node tools/render-audio.mjs --out out/audio-916) first.`);
    process.exit(1);
  }
  const st = sharedTimeline(PLAN);
  console.log(`reference ${path.relative(ROOT, refFile)} (${refDur.toFixed(3)} s); timeline shared by ${st.plans.join(', ')}: ${st.identical ? 'identical' : 'DIFFERENT'}`);
  const ref = { file: refFile, ...loudnessScan(refFile) };
  let ok = st.identical;
  for (const f of opt('verify').split(',').filter(Boolean)) { const r = deliveryCheck(path.resolve(ROOT, f), ref, P); printCheck(r); ok = ok && r.ok; }
  process.exit(ok ? 0 : 1);
}

async function main() {
  const pubDir = path.join(ROOT, PUBLISH);
  if (PLAN !== ROOT_PLAN && path.resolve(ROOT, OUT) === pubDir) {
    console.error(`--plan ${PLAN} would render into ${PUBLISH}/, which must follow ${ROOT_PLAN}: pass --out (e.g. --out out/audio-v3)`); process.exit(1);
  }
  const srv = await serve();
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--autoplay-policy=no-user-gesture-required', '--js-flags=--max-old-space-size=6144'] });
  const t0 = Date.now();
  const only = opt('only', null);
  let report;
  try {
    const page = await browser.newPage();
    page.on('console', (m) => console.log('[page]', m.text()));
    page.on('pageerror', (e) => console.error('[pageerror]', e));
    await page.goto(`http://127.0.0.1:${srv.address().port}/src/audio/index.html?plan=${encodeURIComponent(PLAN)}`);
    await page.waitForFunction(() => window.__audioReady, null, { timeout: 60000 });
    page.setDefaultTimeout(0);
    report = await page.evaluate((o) => window.renderAudio(o), { outDir: OUT, stems: !flag('no-stems'), only: only ? only.split(',') : null });
  } finally {
    await browser.close();
    srv.close();
  }
  report.wallSeconds = (Date.now() - t0) / 1000;
  report.sharedTimeline = sharedTimeline(PLAN);
  console.log(`timeline shared by ${report.sharedTimeline.plans.join(', ')}: ${report.sharedTimeline.identical ? 'identical (one mix serves every cut)' : `DIFFERENT: this mix follows ${PLAN} only`}`);
  const mixFile = path.join(ROOT, OUT, 'mix.wav');
  if (!flag('no-measure')) {
    const tm = Date.now();
    try {
      const P = planInfo(PLAN);
      // independent ffmpeg passes run side by side: the mix's R128 scan, the spectrograms, the two AAC encodes
      const coda = P.cue('coda'), wins = spectraWindows(P);
      const spectra = [...wins.map((w) => ({ ...w, file: `${OUT}/spectrum-${w.name}.png` })),
        ...(coda ? [{ name: 'coda', start: +(coda.frame / P.fps).toFixed(3), end: +P.dur.toFixed(3), file: `${OUT}/spectrum-coda.png` }] : [])];
      const encodes = only ? [] : [['mastered-for', AAC_DELIVERY], ['mux-today', AAC_MUX]].map(([name, args]) => ({ name, args, m4a: path.join(ROOT, OUT, `delivery-${name}.m4a`) }));
      const [scan] = await Promise.all([
        loudnessScanAsync(mixFile),
        ...spectra.map((s) => spectrum(mixFile, path.join(ROOT, s.file), s.start, s.end - s.start)),
        ...encodes.map(async (e) => {
          const r = await run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', mixFile, ...e.args, '-t', P.dur.toFixed(6), e.m4a]);
          if (r.status !== 0) throw new Error(r.stderr.slice(-300));
        }),
      ]);
      const { series, ...m } = scan;
      report.ffmpeg = { mix: m };
      console.log(`ffmpeg ebur128 mix: I = ${m.integratedLufs} LUFS, LRA = ${m.lra} LU, true peak = ${m.truePeakDbtp} dBTP`);
      const p = report.ffmpeg.shortTerm = profile(series, P);
      console.log(`ffmpeg short-term (3 s): max ${p.overall.lufs} LUFS at ${p.overall.t} s; climax window ${p.climaxWindow.lufs} at ${p.climaxWindow.t} s; strikes ${p.strikes.lufs} at ${p.strikes.t} s; outside the climax ${p.outsideClimax.lufs} at ${p.outsideClimax.t} s; margin ${p.marginLu} LU`);
      if (p.build) console.log(`ffmpeg build ${p.build.frames.join('-')}: short-term max ${p.build.max.lufs} at ${p.build.max.t} s (at the cut ${p.build.atCut}, at the end ${p.build.atEnd}; momentary at the cut ${p.build.momentaryAtCut}, at the end ${p.build.momentaryAtEnd}); explosion ${p.explosion.lufs} at ${p.explosion.t} s (momentary max ${p.explosion.momentaryMax.lufs}); bars 56-59 max ${p.bars56to59.max.lufs} mean ${p.bars56to59.mean}; aftermath ${p.aftermath.lufs}${p.stare ? `; final stare max ${p.stare.max.lufs} at ${p.stare.max.t} s, mean ${p.stare.mean}, before the title ${p.stare.beforeTitle?.lufs}, with it ${p.stare.withTitle?.lufs}, last 0.45 s momentary ${p.stare.lastSecond.lufs}` : ''}`);
      report.ffmpeg.spectrograms = Object.fromEntries(spectra.map((s) => [s.name, { file: s.file, start: s.start, seconds: +(s.end - s.start).toFixed(3) }]));
      if (encodes.length) {
        // the AAC round trips a delivered cut goes through, each checked like a muxed cut (their scans in parallel)
        report.ffmpeg.delivered = {};
        const scans = await Promise.all(encodes.map((e) => loudnessScanAsync(e.m4a)));
        encodes.forEach((e, k) => {
          const d = deliveryCheck(e.m4a, { file: mixFile, ...scan }, P, scans[k]);
          fs.rmSync(e.m4a, { force: true });
          report.ffmpeg.delivered[e.name] = { encode: e.args.join(' '), ...d };
          console.log(`delivered, AAC round trip "${e.args.slice(2, -4).join(' ')}" (${e.name}):`); printCheck(d);
        });
      }
    } catch (e) { console.warn('ffmpeg measurement skipped:', e.message); }
    report.measureSeconds = (Date.now() - tm) / 1000;
  }
  // publish: the default mux input becomes this mix (a dev render with --only, or a render of another plan, is never
  // published)
  if (PLAN !== ROOT_PLAN && !flag('no-publish') && !only) console.log(`not published: ${PLAN} is not the root ${ROOT_PLAN} (${PUBLISH}/ must follow it)`);
  if (!only && !flag('no-publish') && PLAN === ROOT_PLAN && path.resolve(ROOT, OUT) !== pubDir) {
    report.publishedTo = `${PUBLISH}/mix.wav`;
    fs.mkdirSync(pubDir, { recursive: true });
    fs.copyFileSync(mixFile, path.join(pubDir, 'mix.wav'));
    fs.writeFileSync(path.join(pubDir, 'report.json'), JSON.stringify({ ...report, publishedFrom: `${OUT}/mix.wav` }, null, 1));
    console.log(`published ${OUT}/mix.wav -> ${PUBLISH}/mix.wav (the default --audio of tools/chunk.mjs assemble and tools/encode.mjs)`);
  }
  fs.writeFileSync(path.join(ROOT, OUT, 'report.json'), JSON.stringify(report, null, 1));
  console.log(`done in ${report.wallSeconds.toFixed(1)} s -> ${OUT}/mix.wav, ${OUT}/stems/, ${OUT}/report.json`);
}

if (opt('verify')) verify();
else main().catch((e) => { console.error(e); process.exit(1); });
