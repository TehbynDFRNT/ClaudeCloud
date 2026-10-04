// Capture the one-pager for review: opening frames, full pages after a scroll-through, the stories and the
// lightbox at 1440, 768 and 390 wide; reports page errors, failed requests and horizontal overflow.
//   node tools/site-capture.mjs [--out tmp/site-caps] [--port 8765]
import { chromium } from 'playwright-core';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const OUT = path.resolve(ROOT, opt('out', 'tmp/site-caps'));
const SITE = path.join(ROOT, 'site/nova');
fs.mkdirSync(OUT, { recursive: true });
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.json': 'application/json' };
const srv = http.createServer((req, res) => {
  const p = path.join(SITE, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!p.startsWith(SITE) || !fs.existsSync(p)) { res.writeHead(404); res.end(); return; }
  const st = fs.statSync(p), range = req.headers.range;
  if (range && p.endsWith('.mp4')) {
    const [a, b] = range.replace('bytes=', '').split('-'); const s = +a, e = b ? +b : Math.min(st.size - 1, s + 2 ** 20);
    res.writeHead(206, { 'Content-Type': 'video/mp4', 'Content-Range': `bytes ${s}-${e}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': e - s + 1 });
    fs.createReadStream(p, { start: s, end: e }).pipe(res); return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream', 'Content-Length': st.size });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => srv.listen(+opt('port', 8765), '127.0.0.1', r));
const URL = `http://127.0.0.1:${srv.address().port}/`;
const browser = await chromium.launch();
const report = [];

async function page(w, h, tag) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const pg = await ctx.newPage();
  const errs = [], bad = [];
  pg.on('pageerror', (e) => errs.push(String(e)));
  pg.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  pg.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
  return { ctx, pg, errs, bad, tag };
}
async function scrollThrough(pg) {
  const H = await pg.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 260) { await pg.evaluate((y) => window.scrollTo(0, y), y); await pg.waitForTimeout(90); }
  await pg.waitForTimeout(1600);
}
const sizes = [[1440, 900, 'd'], [768, 1024, 't'], [390, 844, 'm']];
for (const [w, h, tag] of sizes) {
  const P = await page(w, h, tag); const { pg } = P;
  const t0 = Date.now();
  await pg.goto(URL, { waitUntil: 'commit' });
  for (const ms of (tag === 't' ? [3200] : [250, 900, 1800, 3200, 4600])) {
    await pg.waitForTimeout(Math.max(0, ms - (Date.now() - t0)));
    await pg.screenshot({ path: `${OUT}/${tag}-open-${ms}.jpg`, quality: 80 });
  }
  await pg.waitForLoadState('networkidle').catch(() => {});
  await scrollThrough(pg);
  const over = await pg.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
  await pg.evaluate(() => window.scrollTo(0, 0)); await pg.waitForTimeout(400);
  await pg.screenshot({ path: `${OUT}/${tag}-full.jpg`, quality: 72, fullPage: true });
  for (const [sel, name, wait] of [['#film', 'film', 600], ['#stills', 'stills', 900], ['.beat:nth-child(4)', 'story', 1200], ['#band', 'band', 900], ['#series', 'series', 900], ['#made', 'made', 2600], ['.card:nth-child(3)', 'cards2', 2200], ['#credits', 'credits', 700], ['#foot', 'foot', 900]]) {
    await pg.evaluate((s) => { const el = document.querySelector(s); if (el) el.scrollIntoView({ block: s === '#made' ? 'start' : 'center' }); }, sel);
    await pg.waitForTimeout(wait);
    await pg.screenshot({ path: `${OUT}/${tag}-${name}.jpg`, quality: 80 });
  }
  // the lightbox on the fifth still
  await pg.evaluate(() => document.querySelector('#stills').scrollIntoView());
  await pg.waitForTimeout(500);
  await pg.click('.still[data-i="4"]'); await pg.waitForTimeout(900);
  await pg.screenshot({ path: `${OUT}/${tag}-lightbox.jpg`, quality: 80 });
  await pg.keyboard.press('ArrowRight'); await pg.waitForTimeout(700);
  const cap = await pg.evaluate(() => document.querySelector('#lbName').textContent + ' ' + document.querySelector('#lbTc').textContent);
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(300);
  const open = await pg.evaluate(() => document.querySelector('#lb').open);
  // fixed-height cards: probe their own overflow
  const cardOver = await pg.evaluate(() => [...document.querySelectorAll('.scene,.card,.still .ph')].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.className + ' ' + e.scrollWidth + '>' + e.clientWidth));
  report.push({ size: `${w}x${h}`, overflowX: over.sw > over.iw ? `${over.sw} > ${over.iw}` : 0, cardOverflow: cardOver, lightboxNext: cap, lightboxClosedByEsc: !open, errors: P.errs, failed: P.bad });
  await P.ctx.close();
}
// reduced motion: the settled design at once
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', (e) => errs.push(String(e)));
  await pg.goto(URL, { waitUntil: 'networkidle' }); await pg.waitForTimeout(500);
  await pg.screenshot({ path: `${OUT}/rm-top.jpg`, quality: 80 });
  await pg.evaluate(() => document.querySelector('#made').scrollIntoView()); await pg.waitForTimeout(800);
  await pg.screenshot({ path: `${OUT}/rm-made.jpg`, quality: 80 });
  report.push({ size: 'reduced-motion 1440', errors: errs });
  await ctx.close();
}
await browser.close(); srv.close();
fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1));
