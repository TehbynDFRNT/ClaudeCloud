#!/usr/bin/env node
// Soundtrack renderer: serves the repo, runs src/audio/index.html (score.js) in headless Chromium, where every
// stem is rendered in an OfflineAudioContext(2, 48000 * plan duration, 48000) and mastered; the page POSTs the WAVs
// back. Both 9:16 cuts share the timeline (film-plan.json), so one mix serves both.
//
//   node tools/render-audio.mjs [--out out/audio] [--no-stems] [--no-measure] [--no-publish] [--only ignition,coda]
//   node tools/render-audio.mjs --verify dist/david-916.mp4,dist/prometheus-916.mp4 [--ref out/audio/mix.wav]
//
// Outputs: out/audio/mix.wav (24-bit PCM, 48 kHz stereo, exactly plan.frames / fps long),
// out/audio/stems/{orchestra,synth,cannons,tension,ignition,coda}.wav (32-bit float, as they enter their buses),
// out/audio/report.json (cue/level/master report, plus ffmpeg's EBU R128 measurement of the written mix: integrated
// loudness, true peak, the short-term (3 s) profile at the strikes, the climax and outside it), and spectrograms
// out/audio/spectrum-climax.png (100-125 s) and out/audio/spectrum-coda.png (coda cut to the end).
// --only renders just the named stems, raw, with mix.wav their 32-bit float sum (development).
//
// Publishing: tools/chunk.mjs assemble and tools/encode.mjs mux out/audio/mix.wav unless given --audio, so a full
// render into another --out also copies its mix.wav and report.json to out/audio/ (--no-publish skips that). The
// default mux then always carries the current score, never an older mix of another length.
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
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const flag = (k) => argv.includes('--' + k);
const OUT = opt('out', 'out/audio').replace(/\/+$/, '');
const PUBLISH = 'out/audio';               // the mix tools/chunk.mjs assemble and tools/encode.mjs mux by default
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

function planInfo(file = 'film-plan.json') {
  const plan = JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
  const [a, b] = String(plan.fps).split('/').map(Number), fps = a / (b || 1);
  return { plan, fps, dur: plan.frames / fps, cue: (id) => plan.cues.find((c) => c.id === id) };
}

// One ffmpeg EBU R128 pass over the first audio stream (video, if any, is not decoded): integrated loudness, loudness
// range, true peak (ebur128 peak=true is 4x oversampled) and the short-term loudness S (3 s window ending at t, every
// 100 ms).
export function loudnessScan(file) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-loglevel', 'verbose', '-i', file, '-map', '0:a:0', '-vn',
    '-af', 'ebur128=peak=true:framelog=verbose', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 29 });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(r.stderr.slice(-400));
  const t = [], S = [];
  for (const line of r.stderr.split('\n')) { const m = /\bt:\s*([\d.]+).*?\bS:\s*(-?[\d.]+)/.exec(line); if (m) { t.push(+m[1]); S.push(+m[2]); } }
  const s = r.stderr.slice(r.stderr.lastIndexOf('Summary:'));
  const num = (re) => { const m = re.exec(s); return m ? +m[1] : null; };
  return { integratedLufs: num(/I:\s+(-?[\d.]+) LUFS/), lra: num(/LRA:\s+(-?[\d.]+) LU/), truePeakDbtp: num(/Peak:\s+(-?[\d.]+) dBFS/), series: { t, S } };
}
export function ebur128(file) { const { series, ...m } = loudnessScan(file); return m; }
export function shortTermSeries(file) { return loudnessScan(file).series; }
function stMax({ t, S }, t0 = 0, t1 = Infinity) {
  let m = -Infinity, at = null;
  for (let i = 0; i < t.length; i++) if (t[i] >= t0 - 1e-6 && t[i] <= t1 + 1e-6 && S[i] > m) { m = S[i]; at = t[i]; }
  return { lufs: m, t: at };
}
// the measured profile against the plan: strikes, the climax window (ignition + 75 frames), outside the climax
function profile(ser, P) {
  const { fps, cue } = P;
  const ign = cue('ignition').frame / fps, ret = cue('return-bar56').frame / fps, end = P.dur;
  const strikes = P.plan.cues.filter((c) => c.kind === 'orchestral-strike').map((c) => c.frame / fps).sort((x, y) => x - y);
  const win = stMax(ser, ign, ign + 75 / fps), pre = stMax(ser, 0, ign), after = stMax(ser, ret + 3, end);
  const outside = pre.lufs >= after.lufs ? pre : after;
  return {
    overall: stMax(ser), strikes: stMax(ser, strikes[0], ign),
    perStrike: strikes.map((s, k) => stMax(ser, s, k + 1 < strikes.length ? strikes[k + 1] : ign)),
    climaxWindow: { ...win, frames: [Math.round(ign * fps), Math.round(ign * fps) + 75] }, climax: stMax(ser, ign, ret),
    preIgnition: pre, aftermath: after, outsideClimax: outside, marginLu: +(win.lufs - outside.lufs).toFixed(1),
    coda: cue('coda') ? stMax(ser, cue('coda').frame / fps, end) : null,
  };
}
// both 9:16 cuts must share the sound's timeline (fps, length, audio placements, cues, effects, shot timing)
function sharedTimeline() {
  const files = fs.readdirSync(ROOT).filter((f) => /^film-plan.*\.json$/.test(f)).sort();
  const key = (p) => JSON.stringify([p.fps, p.frames, p.audio, p.cues, p.effects, p.shots.map((s) => [s.id, s.start, s.end])]);
  const keys = files.map((f) => key(JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'))));
  return { plans: files, identical: keys.every((k) => k === keys[0]) };
}
function spectrum(file, out, t0, dur) {
  const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-ss', String(t0), '-t', String(dur), '-i', file,
    '-lavfi', 'showspectrumpic=s=1600x700:legend=1:fscale=log:start=20:stop=16000:drange=110', out], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr.slice(-300));
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
// ref: { file, ...loudnessScan(file) } of the mix the file should carry
function deliveryCheck(file, ref, P) {
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
  const m = loudnessScan(file);
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
  try {
    sync = syncAt(ref.file, file, P.cue('ignition').frame / P.fps);
    add('sync at the ignition', Math.abs(sync.lagMs) <= 1 && sync.corr >= 0.95, `${sync.lagMs.toFixed(2)} ms, r = ${sync.corr.toFixed(3)}`, '|lag| <= 1 ms, r >= 0.95 (the same mix, in place)');
  } catch (e) { add('sync at the ignition', false, e.message, 'decodable audio at the ignition'); }
  return done({ integratedLufs: m.integratedLufs, lra: m.lra, truePeakDbtp: m.truePeakDbtp, shortTermMax: pk, coda, sync, audioSeconds: aDur });
}
function printCheck(r) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.file}`);
  for (const c of r.checks) console.log(`  ${c.ok ? 'ok  ' : 'FAIL'} ${c.name}: ${c.got}   (want ${c.want})`);
}

// --verify: delivery checks of muxed files against the published (or --ref) mix; no render
function verify() {
  const P = planInfo(opt('plan', 'film-plan.json'));
  const refFile = path.resolve(ROOT, opt('ref', `${PUBLISH}/mix.wav`));
  const refDur = +probe(refFile).streams.find((s) => s.codec_type === 'audio').duration;
  if (Math.abs(refDur - P.dur) > 1e-3) {
    console.error(`${path.relative(ROOT, refFile)} is ${refDur.toFixed(3)} s but the film is ${P.dur.toFixed(3)} s: it is an older mix. Render the soundtrack (node tools/render-audio.mjs --out out/audio-916) first.`);
    process.exit(1);
  }
  const st = sharedTimeline();
  console.log(`reference ${path.relative(ROOT, refFile)} (${refDur.toFixed(3)} s); timeline shared by ${st.plans.join(', ')}: ${st.identical ? 'identical' : 'DIFFERENT'}`);
  const ref = { file: refFile, ...loudnessScan(refFile) };
  let ok = st.identical;
  for (const f of opt('verify').split(',').filter(Boolean)) { const r = deliveryCheck(path.resolve(ROOT, f), ref, P); printCheck(r); ok = ok && r.ok; }
  process.exit(ok ? 0 : 1);
}

async function main() {
  const srv = await serve();
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--autoplay-policy=no-user-gesture-required', '--js-flags=--max-old-space-size=6144'] });
  const t0 = Date.now();
  const only = opt('only', null);
  let report;
  try {
    const page = await browser.newPage();
    page.on('console', (m) => console.log('[page]', m.text()));
    page.on('pageerror', (e) => console.error('[pageerror]', e));
    await page.goto(`http://127.0.0.1:${srv.address().port}/src/audio/index.html`);
    await page.waitForFunction(() => window.__audioReady, null, { timeout: 60000 });
    page.setDefaultTimeout(0);
    report = await page.evaluate((o) => window.renderAudio(o), { outDir: OUT, stems: !flag('no-stems'), only: only ? only.split(',') : null });
  } finally {
    await browser.close();
    srv.close();
  }
  report.wallSeconds = (Date.now() - t0) / 1000;
  report.sharedTimeline = sharedTimeline();
  console.log(`timeline shared by ${report.sharedTimeline.plans.join(', ')}: ${report.sharedTimeline.identical ? 'identical (one mix serves every cut)' : 'DIFFERENT: this mix follows film-plan.json only'}`);
  const mixFile = path.join(ROOT, OUT, 'mix.wav');
  if (!flag('no-measure')) {
    try {
      const P = planInfo();
      const scan = loudnessScan(mixFile), { series, ...m } = scan;
      report.ffmpeg = { mix: m };
      console.log(`ffmpeg ebur128 mix: I = ${m.integratedLufs} LUFS, LRA = ${m.lra} LU, true peak = ${m.truePeakDbtp} dBTP`);
      const p = report.ffmpeg.shortTerm = profile(series, P);
      console.log(`ffmpeg short-term (3 s): max ${p.overall.lufs} LUFS at ${p.overall.t} s; climax window ${p.climaxWindow.lufs} at ${p.climaxWindow.t} s; strikes ${p.strikes.lufs} at ${p.strikes.t} s; outside the climax ${p.outsideClimax.lufs} at ${p.outsideClimax.t} s; margin ${p.marginLu} LU`);
      const coda = P.cue('coda');
      spectrum(mixFile, path.join(ROOT, OUT, 'spectrum-climax.png'), 100, 25);
      if (coda) spectrum(mixFile, path.join(ROOT, OUT, 'spectrum-coda.png'), coda.frame / P.fps, P.dur - coda.frame / P.fps);
      report.ffmpeg.spectrograms = { climax: { file: `${OUT}/spectrum-climax.png`, start: 100, seconds: 25 }, coda: coda ? { file: `${OUT}/spectrum-coda.png`, start: +(coda.frame / P.fps).toFixed(3) } : null };
      if (!only) {
        // the AAC round trips a delivered cut goes through, each checked like a muxed cut
        report.ffmpeg.delivered = {};
        for (const [name, args] of [['mastered-for', AAC_DELIVERY], ['mux-today', AAC_MUX]]) {
          const m4a = path.join(ROOT, OUT, `delivery-${name}.m4a`);
          const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', mixFile, ...args, '-t', P.dur.toFixed(6), m4a], { encoding: 'utf8' });
          if (r.status !== 0) throw new Error(r.stderr.slice(-300));
          const d = deliveryCheck(m4a, { file: mixFile, ...scan }, P);
          fs.rmSync(m4a, { force: true });
          report.ffmpeg.delivered[name] = { encode: args.join(' '), ...d };
          console.log(`delivered, AAC round trip "${args.slice(2, -4).join(' ')}" (${name}):`); printCheck(d);
        }
      }
    } catch (e) { console.warn('ffmpeg measurement skipped:', e.message); }
  }
  // publish: the default mux input becomes this mix (a dev render with --only is never published)
  const pubDir = path.join(ROOT, PUBLISH);
  if (!only && !flag('no-publish') && path.resolve(ROOT, OUT) !== pubDir) {
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
