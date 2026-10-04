#!/usr/bin/env node
// Frame renderer: serves the project root on 127.0.0.1, drives headless Chromium (SwiftShader WebGL2) through the
// page contract and writes images.
//
// Provenance: tools/render.mjs of the "Nova, Episode 1" project (ClaudeCloud repo, Oct 2026), generalised: the root,
// page and Chromium come from config.mjs; --out may be absolute. Copy it into the project's tools/ and commit it.
//
// Page contract (the page named by config.page, default src/index.html, opened as ?w=&h=&plan=[&warm]):
//   window.__ready = true when fonts, plan, data and every scene's preload() are done (window.__error on failure)
//   window.renderFrame(f) -> { f, shot, scene, ms }        draws frame f of the plan; must be a pure function of f
//   window.grab(type, quality) -> base64 image of the canvas
//   window.planInfo() -> { fps, frames, shots: [{ id, scene, start, end }] }
//   window.renderSandbox(sceneId, params, local, dur, post, letterbox, presetId) -> { ms }   (optional, development)
//
//   node render.mjs stills  --frames 0,120,500 [--w 960] [--out out/stills] [--fmt png]
//   node render.mjs shot    <shotId> [--n 5]                     first..last frame of a plan shot -> out/shots/<id>/
//   node render.mjs sandbox <sceneId> [--preset <shotId>] [--params '{}'] [--times 0,2,4] [--dur 6] [--post '{}'] [--lb 0.128]
//   node render.mjs bench   <sceneId> [--preset <shotId>] [--params '{}'] [--t 2]
//   node render.mjs strip   --from 1200 --count 8 [--cols 4]
//   node render.mjs sheet   [--every 48 | --frames a,b,c | --shots] [--cols 6] [--w 640]
//   node render.mjs film    [--from 0] [--to N | --ranges a-b,c-d] [--out out/frames] [--q 0.95] [--force] [--adopt]
//     film keeps every frame whose content fingerprint matches <out>/manifest.json and re-renders only the others,
//     each to a temp file swapped in atomically; <out>/render-log.jsonl records {f, shot, scene, ms, fp} per frame.
// Every mode takes --plan <file> (default film-plan.json). --w defaults to half the plan width (the full width for
// film); --h follows the plan's aspect. Never point two renders of different plans at one --out at the same time.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { makeFingerprinter } from './fingerprint.mjs';
import { ROOT, config, chromePath, rel } from './config.mjs';

const argv = process.argv.slice(2);
const mode = argv[0];
const positional = argv[1] && !argv[1].startsWith('--') ? argv[1] : null;
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const flag = (k) => argv.includes('--' + k);

const PLAN = opt('plan', 'film-plan.json');
const planJson = JSON.parse(fs.readFileSync(path.resolve(ROOT, PLAN), 'utf8'));
const W = +opt('w', mode === 'film' ? planJson.width : Math.round(planJson.width / 2));
const H = +opt('h', Math.round(W * planJson.height / planJson.width));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.bin': 'application/octet-stream', '.flac': 'audio/flac', '.wav': 'audio/wav', '.css': 'text/css' };

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
    executablePath: chromePath(),
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-sandbox', '--js-flags=--max-old-space-size=4096'],
  });
  const page = await browser.newPage({ viewport: { width: Math.min(W, 1920), height: Math.min(H, 1920) }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') { errors.push(m.text()); console.error('[page]', m.text()); } });
  page.on('pageerror', (e) => { errors.push(String(e)); console.error('[pageerror]', e); });
  // the page fetches the plan relative to itself: pass the plan's path relative to the root
  const url = `http://127.0.0.1:${srv.address().port}/${config().page}?w=${W}&h=${H}&plan=${encodeURIComponent(rel(path.resolve(ROOT, PLAN)))}${flag('warm') ? '&warm' : ''}`;
  await page.goto(url);
  await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 600000 });
  const err = await page.evaluate(() => window.__error);
  if (err) throw new Error('Page failed to boot:\n' + err);
  return { srv, browser, page, errors, close: async () => { await browser.close(); srv.close(); } };
}

function save(b64, file) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, Buffer.from(b64, 'base64')); }
const pad = (n) => String(n).padStart(5, '0');
const outPath = (p) => path.resolve(ROOT, p);

async function renderTo(page, f, file, q = 0.92) {
  const info = await page.evaluate((f) => window.renderFrame(f), f);
  const type = file.endsWith('.png') ? 'image/png' : 'image/jpeg';
  save(await page.evaluate(([t, q]) => window.grab(t, q), [type, q]), file);
  return info;
}

async function sheet(page, frames, cols, file) {
  const cw = W, ch = H;
  const rows = Math.ceil(frames.length / cols);
  await page.evaluate(([cols, rows, cw, ch]) => {
    const c = document.createElement('canvas'); c.width = cols * cw; c.height = rows * (ch + 22);
    const x = c.getContext('2d'); x.fillStyle = '#111'; x.fillRect(0, 0, c.width, c.height);
    window.__sheet = { c, x, cols };
  }, [cols, rows, cw, ch]);
  for (let i = 0; i < frames.length; i++) {
    const info = await page.evaluate((f) => window.renderFrame(f), frames[i]);
    const label = `${frames[i]}  ${info.shot}`;
    await page.evaluate(([i, label, cw, ch]) => {
      const { c, x, cols } = window.__sheet; const src = document.querySelector('canvas');
      const cx = (i % cols) * cw, cy = Math.floor(i / cols) * (ch + 22);
      x.drawImage(src, cx, cy, cw, ch); x.fillStyle = '#ddd'; x.font = '14px monospace'; x.fillText(label, cx + 6, cy + ch + 16);
    }, [i, label, cw, ch]);
    process.stdout.write(`  sheet ${i + 1}/${frames.length} f${frames[i]} ${info.shot} ${info.ms}ms\n`);
  }
  save(await page.evaluate(() => window.__sheet.c.toDataURL('image/jpeg', 0.9).split(',')[1]), file);
  console.log('wrote', rel(file));
}

async function main() {
  const ctx = await open();
  const { page } = ctx;
  const out = opt('out', null);
  try {
    if (mode === 'stills') {
      const frames = opt('frames', '0').split(',').map(Number);
      for (const f of frames) {
        const file = path.join(outPath(out || 'out/stills'), `f${pad(f)}.${opt('fmt', 'jpg')}`);
        const info = await renderTo(page, f, file);
        console.log(`f${f} ${info.shot} (${info.scene}) ${info.ms}ms -> ${rel(file)}`);   // chunk.mjs costs parses this line
      }
    } else if (mode === 'shot') {
      const pi = await page.evaluate(() => window.planInfo());
      const s = pi.shots.find((x) => x.id === positional);
      if (!s) throw new Error('No shot ' + positional);
      const n = +opt('n', 5);
      for (let i = 0; i < n; i++) {
        const f = Math.min(s.end - 1, Math.round(s.start + (s.end - 1 - s.start) * (n === 1 ? 0.5 : i / (n - 1))));
        const file = path.join(outPath(out || `out/shots/${s.id}`), `f${pad(f)}.jpg`);
        const info = await renderTo(page, f, file);
        console.log(`${s.id} f${f} ${info.ms}ms -> ${rel(file)}`);
      }
    } else if (mode === 'sandbox' || mode === 'bench') {
      const params = JSON.parse(opt('params', '{}'));
      const post = JSON.parse(opt('post', '{}'));
      const dur = +opt('dur', 6), lb = +opt('lb', 0.128);
      const times = mode === 'bench' ? [+opt('t', 2), +opt('t', 2), +opt('t', 2)] : opt('times', '0,2,4').split(',').map(Number);
      for (const t of times) {
        const info = await page.evaluate(([id, p, t, d, post, lb, pr]) => window.renderSandbox(id, p, t, d, post, lb, pr), [positional, params, t, dur, post, lb, opt('preset', null)]);
        if (mode === 'bench') { console.log(`bench ${positional} t=${t} ${W}x${H}: ${info.ms}ms`); continue; }
        const file = path.join(outPath(out || `out/sandbox/${positional}`), `${opt('tag', 't')}${t.toFixed(2)}.jpg`);
        save(await page.evaluate(() => window.grab('image/jpeg', 0.92)), file);
        console.log(`${positional} t=${t} ${info.ms}ms -> ${rel(file)}`);
      }
    } else if (mode === 'strip') {
      const from = +opt('from', 0), count = +opt('count', 8);
      await sheet(page, Array.from({ length: count }, (_, i) => from + i), +opt('cols', 4), outPath(out || `out/strips/strip_${pad(from)}.jpg`));
    } else if (mode === 'sheet') {
      const pi = await page.evaluate(() => window.planInfo());
      let frames;
      if (opt('frames')) frames = opt('frames').split(',').map(Number);
      else if (flag('shots')) frames = pi.shots.map((s) => Math.round((s.start + s.end - 1) / 2));
      else { const every = +opt('every', 48); frames = []; for (let f = +opt('from', 0); f < +opt('to', pi.frames); f += every) frames.push(f); }
      await sheet(page, frames, +opt('cols', 6), outPath(out || 'out/sheets/sheet.jpg'));
    } else if (mode === 'film') {
      const pi = await page.evaluate(() => window.planInfo());
      const from = +opt('from', 0), to = +opt('to', pi.frames);
      const dir = outPath(out || 'out/frames');
      fs.mkdirSync(dir, { recursive: true });
      const q = +opt('q', 0.95);
      const fp = makeFingerprinter(planJson);
      const manPath = path.join(dir, 'manifest.json');
      const manifest = fs.existsSync(manPath) ? JSON.parse(fs.readFileSync(manPath, 'utf8')) : {};
      const saveManifest = () => { fs.writeFileSync(manPath + '.tmp', JSON.stringify(manifest)); fs.renameSync(manPath + '.tmp', manPath); };
      const log = fs.createWriteStream(path.join(dir, 'render-log.jsonl'), { flags: 'a' });
      const t0 = Date.now(); let done = 0; const todo = []; let kept = 0, adopted = 0;
      const ranges = opt('ranges') ? opt('ranges').split(',').map((r) => r.split('-').map(Number)) : [[from, to]];
      const wanted = []; for (const [a, b] of ranges) for (let f = a; f < b; f++) wanted.push(f);
      for (const f of wanted) {
        const file = path.join(dir, `${pad(f)}.jpg`);
        const want = fp(f, W, H);
        const exists = fs.existsSync(file);
        if (exists && !flag('force') && manifest[f] === want) { kept++; continue; }
        if (exists && !flag('force') && flag('adopt') && manifest[f] === undefined) { manifest[f] = want; adopted++; continue; }
        todo.push([f, want]);
      }
      if (adopted) saveManifest();
      console.log(`frames ${ranges.map(([a, b]) => `${a}..${b - 1}`).join(',')}: ${kept} final kept, ${adopted} adopted, ${todo.length} to render at ${W}x${H}`);
      for (const [f, want] of todo) {
        const file = path.join(dir, `${pad(f)}.jpg`);
        const info = await renderTo(page, f, file + '.tmp.jpg', q);
        fs.renameSync(file + '.tmp.jpg', file);
        manifest[f] = want;   // the fingerprint the frame was rendered UNDER (chunk.mjs derives piece fps from it)
        saveManifest();
        log.write(JSON.stringify({ ...info, fp: want }) + '\n');
        done++;
        if (done % 10 === 0 || done === todo.length) {
          const el = (Date.now() - t0) / 1000, eta = (el / done) * (todo.length - done);
          console.log(`  ${done}/${todo.length} f${f} ${info.shot} ${info.ms}ms  elapsed ${(el / 60).toFixed(1)}m  eta ${(eta / 60).toFixed(1)}m`);
        }
      }
      log.end();
    } else {
      throw new Error('unknown mode ' + mode + ' (stills | shot | sandbox | bench | strip | sheet | film)');
    }
    if (ctx.errors.length) console.error(`${ctx.errors.length} console errors/warnings`);
  } finally {
    await ctx.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
