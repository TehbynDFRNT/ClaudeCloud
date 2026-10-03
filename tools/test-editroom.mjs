#!/usr/bin/env node
// Local functional test of a packaged Edit Room (out/editroom*): frame-accurate seeking against a
// frame-coded test film, transport keys, note pinning (browser-local mode), and layout screenshots.
//   node tools/test-editroom.mjs [--dir out/editroom-test]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const dir = path.resolve(ROOT, argv[argv.indexOf('--dir') + 1] || 'out/editroom-test');
const page0 = fs.readFileSync(path.join(dir, 'editroom.html'), 'utf8')
  ;
// the publish skeleton, as the Artifact tool wraps the page
fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0}</style></head><body>${page0}</body></html>`);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mp4': 'video/mp4', '.webm': 'video/webm', '.jpg': 'image/jpeg' };
const srv = http.createServer((req, res) => {
  const p = path.join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(dir) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  // byte ranges, as any real static host serves media
  const size = fs.statSync(p).size, type = MIME[path.extname(p)] || 'application/octet-stream';
  const m = argv.includes('--norange') ? null : /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
  if (m) {
    const a = m[1] ? +m[1] : size - +m[2], b = m[1] && m[2] ? +m[2] : size - 1;
    res.writeHead(206, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${a}-${b}/${size}`, 'Content-Length': b - a + 1 });
    fs.createReadStream(p, { start: a, end: b }).pipe(res);
  } else { res.writeHead(200, { 'Content-Type': type, ...(argv.includes('--norange') ? {} : { 'Accept-Ranges': 'bytes' }), 'Content-Length': size }); fs.createReadStream(p).pipe(res); }
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${srv.address().port}/index.html`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
const errors = [];
let ok = true;
const check = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) ok = false; };
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });  // font CDN/favicon loads fail in this sandbox only
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url);
  await page.waitForFunction(() => document.querySelector('video.show').readyState >= 2 && document.getElementById('aud').readyState >= 1, null, { timeout: 60000 });
  const shown = async () => page.evaluate(async () => {
    const a = document.getElementById('aud');
    await new Promise((r) => (a.seeking ? a.addEventListener('seeked', r, { once: true }) : r()));
    await new Promise((r) => setTimeout(r, 50));
    const v = document.querySelector('video.show');
    for (let i = 0; i < 100 && (v.readyState < 2 || v.seeking); i++) await new Promise((r) => setTimeout(r, 30));
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const c = document.createElement('canvas'); c.width = 8; c.height = 8; const x = c.getContext('2d');
    x.drawImage(v, v.videoWidth / 2 - 4, v.videoHeight / 2 - 4, 8, 8, 0, 0, 8, 8);
    const d = x.getImageData(4, 4, 1, 1).data;
    const Y = d[0] * 219 / 255 + 16;              // undo limited-range expansion
    return { code: ((Math.round((Y - 24) / 8) % 24) + 24) % 24, tc: document.getElementById('tc').textContent, sub: document.getElementById('tcsub').textContent };
  });
  // frame-step with the page's own keys and compare the pictured frame code with the displayed frame
  await page.click('#tl', { position: { x: 400, y: 30 } });
  for (const steps of [0, 1, 1, 1, 7, 24]) {
    for (let i = 0; i < steps; i++) await page.keyboard.press('ArrowRight');
    const s = await shown();
    const f = +s.sub.match(/frame (\d+)/)[1];
    check(s.code === f % 24, `pictured frame code ${s.code} matches displayed frame ${f} (${s.tc})`);
  }
  for (const target of [0, 1, 2724, 2725, 2726, 3755]) {
    await page.evaluate((f) => { const a = document.getElementById('aud'); a.pause(); a.currentTime = (f + 0.5) / 24; }, target);
    const s = await shown();
    check(s.code === target % 24 && s.sub.startsWith(`frame ${target} `), `seek to frame ${target}: pictured ${s.code}, display "${s.sub}"`);
  }
  // playback across a clip boundary: picture must track the soundtrack clock
  await page.evaluate(() => { const a = document.getElementById('aud'); a.currentTime = 228.5 / 24; });
  await shown();
  await page.keyboard.press('Space');
  await page.waitForTimeout(1600);
  const sync = await page.evaluate(() => {
    const a = document.getElementById('aud'), v = document.querySelector('video.show');
    return { clockF: a.currentTime * 24, clip: v.dataset.k, local: v.currentTime * 24, playing: !a.paused };
  });
  await page.keyboard.press('Space');
  const drift = Math.abs((sync.clip * 240 + sync.local) - sync.clockF);
  check(sync.playing && sync.clip === '1' && drift < 3, `playback crossed into clip 1 in sync (drift ${drift.toFixed(2)} frames)`);
  const s2 = await shown();
  const f2 = +s2.sub.match(/frame (\d+)/)[1];
  check(s2.code === f2 % 24, `after pausing, pictured frame matches display (frame ${f2})`);

  // shot navigation + note pinning (browser-local mode)
  await page.evaluate(() => { const a = document.getElementById('aud'); a.pause(); a.currentTime = 1000.5 / 24; });
  await shown();
  const before = await page.textContent('#shotId');
  await page.keyboard.press('ArrowDown');
  await shown();
  const shotId = await page.textContent('#shotId');
  check(shotId !== before, `next-shot key moved from ${before} to ${shotId}`);
  const box = await page.locator('#stage').boundingBox();
  await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.4);
  await page.fill('#noteText', 'Test note: the limb is too dark here.');
  await page.keyboard.press('Control+Enter');
  await page.waitForTimeout(300);
  const notes = await page.locator('.note').count();
  check(notes === 1, `note saved and listed (${notes})`);
  const pin = await page.locator('.pin').count();
  check(pin >= 1, `pin shown on the frame (${pin})`);
  await page.screenshot({ path: path.join(dir, 'shot-desktop.png') });
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  phone.on('pageerror', (e) => errors.push(String(e)));
  await phone.goto(url);
  await phone.waitForFunction(() => document.querySelector('video.show').readyState >= 2, null, { timeout: 60000 });
  const wide = await phone.evaluate(() => document.documentElement.scrollWidth);
  check(wide <= 390, `no horizontal page scroll at phone width (${wide}px)`);
  await phone.screenshot({ path: path.join(dir, 'shot-phone.png'), fullPage: true });
  check(errors.length === 0, `no page errors (${errors.join(' | ')})`);
} finally {
  await browser.close(); srv.close();
}
process.exit(ok ? 0 : 1);
