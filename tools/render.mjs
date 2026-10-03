#!/usr/bin/env node
// Frame renderer: serves the repo, drives headless Chromium (SwiftShader WebGL2) and writes images.
//
//   node tools/render.mjs stills  --frames 0,120,500 [--w 960] [--out out/stills]
//   node tools/render.mjs shot    <shotId> [--n 5]
//   node tools/render.mjs sandbox <sceneId> [--preset <shotId>] [--params '{}'] [--times 0,2,4] [--dur 6] [--post '{}'] [--lb 0.128]
//   node tools/render.mjs strip   --from 1200 --count 8
//   node tools/render.mjs sheet   [--every 48 | --frames a,b,c | --shots] [--cols 6] [--w 640]
//   node tools/render.mjs film    [--from 0] [--to N] [--out out/frames] [--q 0.95]
//   node tools/render.mjs bench   <sceneId> [--params '{}'] [--t 2]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const mode = argv[0];
const positional = argv[1] && !argv[1].startsWith('--') ? argv[1] : null;
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const flag = (k) => argv.includes('--' + k);

const W = +opt('w', mode === 'film' ? 1920 : 960);
const H = +opt('h', Math.round(W * 9 / 16));
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.flac': 'audio/flac', '.wav': 'audio/wav', '.css': 'text/css' };

function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const p = path.join(ROOT, u);
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(p).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

async function open() {
  const srv = await serve();
  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-sandbox', '--js-flags=--max-old-space-size=4096'],
  });
  const page = await browser.newPage({ viewport: { width: Math.min(W, 1920), height: Math.min(H, 1080) }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') { errors.push(m.text()); console.error('[page]', m.text()); } });
  page.on('pageerror', (e) => { errors.push(String(e)); console.error('[pageerror]', e); });
  const url = `http://127.0.0.1:${srv.address().port}/src/index.html?w=${W}&h=${H}${flag('warm') ? '&warm' : ''}`;
  await page.goto(url);
  await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 600000 });
  const err = await page.evaluate(() => window.__error);
  if (err) throw new Error('Page failed to boot:\n' + err);
  return { srv, browser, page, errors, close: async () => { await browser.close(); srv.close(); } };
}

function save(b64, file) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, Buffer.from(b64, 'base64')); }
const pad = (n) => String(n).padStart(5, '0');

async function renderTo(page, f, file, q = 0.92) {
  const info = await page.evaluate((f) => window.renderFrame(f), f);
  const type = file.endsWith('.png') ? 'image/png' : 'image/jpeg';
  save(await page.evaluate(([t, q]) => window.grab(t, q), [type, q]), file);
  return info;
}

async function sheet(page, frames, cols, file, labelFn) {
  const cw = W, ch = H;
  const rows = Math.ceil(frames.length / cols);
  await page.evaluate(([n, cols, rows, cw, ch]) => {
    const c = document.createElement('canvas'); c.width = cols * cw; c.height = rows * (ch + 22);
    const x = c.getContext('2d'); x.fillStyle = '#111'; x.fillRect(0, 0, c.width, c.height);
    window.__sheet = { c, x, cols };
  }, [frames.length, cols, rows, cw, ch]);
  for (let i = 0; i < frames.length; i++) {
    const info = await page.evaluate((f) => window.renderFrame(f), frames[i]);
    const label = labelFn ? labelFn(frames[i], info) : `${frames[i]}  ${info.shot}`;
    await page.evaluate(([i, label, cw, ch]) => {
      const { c, x, cols } = window.__sheet; const src = document.getElementById('c');
      const cx = (i % cols) * cw, cy = Math.floor(i / cols) * (ch + 22);
      x.drawImage(src, cx, cy, cw, ch); x.fillStyle = '#ddd'; x.font = '14px monospace'; x.fillText(label, cx + 6, cy + ch + 16);
    }, [i, label, cw, ch]);
    process.stdout.write(`  sheet ${i + 1}/${frames.length} f${frames[i]} ${info.shot} ${info.ms}ms\n`);
  }
  save(await page.evaluate(() => window.__sheet.c.toDataURL('image/jpeg', 0.9).split(',')[1]), file);
  console.log('wrote', file);
}

async function main() {
  const ctx = await open();
  const { page } = ctx;
  const out = opt('out', null);
  try {
    if (mode === 'stills') {
      const frames = opt('frames', '0').split(',').map(Number);
      for (const f of frames) {
        const file = path.join(ROOT, out || 'out/stills', `f${pad(f)}.${opt('fmt', 'jpg')}`);
        const info = await renderTo(page, f, file);
        console.log(`f${f} ${info.shot} (${info.scene}) ${info.ms}ms -> ${path.relative(ROOT, file)}`);
      }
    } else if (mode === 'shot') {
      const pi = await page.evaluate(() => window.planInfo());
      const s = pi.shots.find((x) => x.id === positional);
      if (!s) throw new Error('No shot ' + positional);
      const n = +opt('n', 5);
      for (let i = 0; i < n; i++) {
        const f = Math.min(s.end - 1, Math.round(s.start + (s.end - 1 - s.start) * (n === 1 ? 0.5 : i / (n - 1))));
        const file = path.join(ROOT, out || `out/shots/${s.id}`, `f${pad(f)}.jpg`);
        const info = await renderTo(page, f, file);
        console.log(`${s.id} f${f} ${info.ms}ms -> ${path.relative(ROOT, file)}`);
      }
    } else if (mode === 'sandbox' || mode === 'bench') {
      const params = JSON.parse(opt('params', '{}'));
      const post = JSON.parse(opt('post', '{}'));
      const dur = +opt('dur', 6), lb = +opt('lb', 0.128);
      const times = mode === 'bench' ? [+opt('t', 2), +opt('t', 2), +opt('t', 2)] : opt('times', '0,2,4').split(',').map(Number);
      for (const [i, t] of times.entries()) {
        const info = await page.evaluate(([id, p, t, d, post, lb, pr]) => window.renderSandbox(id, p, t, d, post, lb, pr), [positional, params, t, dur, post, lb, opt('preset', null)]);
        if (mode === 'bench') { console.log(`bench ${positional} t=${t} ${W}x${H}: ${info.ms}ms`); continue; }
        const file = path.join(ROOT, out || `out/sandbox/${positional}`, `${opt('tag', 't')}${t.toFixed(2)}.jpg`);
        save(await page.evaluate(() => window.grab('image/jpeg', 0.92)), file);
        console.log(`${positional} t=${t} ${info.ms}ms -> ${path.relative(ROOT, file)}`);
      }
    } else if (mode === 'strip') {
      const from = +opt('from', 0), count = +opt('count', 8);
      const frames = Array.from({ length: count }, (_, i) => from + i);
      await sheet(page, frames, +opt('cols', 4), path.join(ROOT, out || `out/strips/strip_${pad(from)}.jpg`));
    } else if (mode === 'sheet') {
      const pi = await page.evaluate(() => window.planInfo());
      let frames;
      if (opt('frames')) frames = opt('frames').split(',').map(Number);
      else if (flag('shots')) frames = pi.shots.map((s) => Math.round((s.start + s.end - 1) / 2));
      else { const every = +opt('every', 48); frames = []; for (let f = +opt('from', 0); f < +opt('to', pi.frames); f += every) frames.push(f); }
      await sheet(page, frames, +opt('cols', 6), path.join(ROOT, out || 'out/sheets/sheet.jpg'));
    } else if (mode === 'film') {
      const pi = await page.evaluate(() => window.planInfo());
      const from = +opt('from', 0), to = +opt('to', pi.frames);
      const dir = path.join(ROOT, out || 'out/frames');
      fs.mkdirSync(dir, { recursive: true });
      const q = +opt('q', 0.95);
      const log = fs.createWriteStream(path.join(dir, 'render-log.jsonl'), { flags: 'a' });
      const t0 = Date.now(); let done = 0; const todo = [];
      for (let f = from; f < to; f++) if (flag('force') || !fs.existsSync(path.join(dir, `${pad(f)}.jpg`))) todo.push(f);
      console.log(`rendering ${todo.length} frames (${from}..${to - 1}) at ${W}x${H}`);
      for (const f of todo) {
        const info = await renderTo(page, f, path.join(dir, `${pad(f)}.jpg`), q);
        log.write(JSON.stringify(info) + '\n');
        done++;
        if (done % 10 === 0 || done === todo.length) {
          const el = (Date.now() - t0) / 1000, eta = (el / done) * (todo.length - done);
          console.log(`  ${done}/${todo.length} f${f} ${info.shot} ${info.ms}ms  elapsed ${(el / 60).toFixed(1)}m  eta ${(eta / 60).toFixed(1)}m`);
        }
      }
      log.end();
    } else {
      throw new Error('unknown mode ' + mode);
    }
    if (ctx.errors.length) console.error(`${ctx.errors.length} console errors/warnings`);
  } finally {
    await ctx.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
