#!/usr/bin/env node
// Soundtrack renderer: serves the repo, runs src/audio/index.html (score.js) in headless Chromium, where every
// stem is rendered in an OfflineAudioContext(2, 48000 * 156.5, 48000) and mastered; the page POSTs the WAVs back.
//
//   node tools/render-audio.mjs [--out out/audio] [--no-stems] [--no-measure]
//
// Outputs: out/audio/mix.wav (24-bit PCM, 48 kHz stereo), out/audio/stems/{orchestra,synth,cannons,ignition}.wav
// (32-bit float, scaled exactly as they enter the master bus), out/audio/report.json (cue/level/master report,
// plus ffmpeg ebur128 loudness + true peak of the written mix when ffmpeg is available).
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

// ffmpeg EBU R128 summary: integrated loudness, loudness range, true peak (ebur128 peak=true is 4x oversampled)
export function ebur128(file) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(r.stderr.slice(-400));
  const s = r.stderr.slice(r.stderr.lastIndexOf('Summary:'));
  const num = (re) => { const m = re.exec(s); return m ? +m[1] : null; };
  return { integratedLufs: num(/I:\s+(-?[\d.]+) LUFS/), lra: num(/LRA:\s+(-?[\d.]+) LU/), truePeakDbtp: num(/Peak:\s+(-?[\d.]+) dBFS/) };
}

async function main() {
  const srv = await serve();
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--autoplay-policy=no-user-gesture-required', '--js-flags=--max-old-space-size=6144'] });
  const t0 = Date.now();
  try {
    const page = await browser.newPage();
    page.on('console', (m) => console.log('[page]', m.text()));
    page.on('pageerror', (e) => console.error('[pageerror]', e));
    await page.goto(`http://127.0.0.1:${srv.address().port}/src/audio/index.html`);
    await page.waitForFunction(() => window.__audioReady, null, { timeout: 60000 });
    page.setDefaultTimeout(0);
    const report = await page.evaluate((o) => window.renderAudio(o), { outDir: OUT, stems: !flag('no-stems') });
    report.wallSeconds = (Date.now() - t0) / 1000;
    if (!flag('no-measure')) {
      try {
        report.ffmpeg = { mix: ebur128(path.join(ROOT, OUT, 'mix.wav')) };
        const m = report.ffmpeg.mix;
        console.log(`ffmpeg ebur128 mix: I = ${m.integratedLufs} LUFS, LRA = ${m.lra} LU, true peak = ${m.truePeakDbtp} dBTP`);
      } catch (e) { console.warn('ffmpeg measurement skipped:', e.message); }
    }
    fs.writeFileSync(path.join(ROOT, OUT, 'report.json'), JSON.stringify(report, null, 1));
    console.log(`done in ${report.wallSeconds.toFixed(1)} s -> ${OUT}/mix.wav, ${OUT}/stems/, ${OUT}/report.json`);
  } finally {
    await browser.close();
    srv.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
