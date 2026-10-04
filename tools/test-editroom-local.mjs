#!/usr/bin/env node
// Test of the LOCALHOST edit room: the packaged serve.mjs plus the page in local Chromium.
//   node tools/test-editroom-local.mjs [--dir out/editroom-test]
// Notes made on the page land in notes.json/notes.md and survive a reload, a change made by another
// writer reaches the open page, video byte ranges are served, and nothing outside the folder is.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const dir = path.resolve(ROOT, opt('dir', 'out/editroom-test'));
const PORT = 4987;
let fails = 0;
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`); if (!ok) fails++; };

if (!fs.existsSync(path.join(dir, 'serve.mjs'))) { console.error(`no serve.mjs in ${dir}: build the package first`); process.exit(1); }
for (const f of ['notes.json', 'notes.md']) fs.rmSync(path.join(dir, f), { force: true });
const srv = spawn(process.execPath, ['serve.mjs', '--port', String(PORT), '--no-open'], { cwd: dir, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve, reject) => {
  let out = '';
  srv.stdout.on('data', (c) => { out += c; if (out.includes('Edit Room:')) resolve(); });
  srv.on('exit', (code) => reject(new Error('serve.mjs exited ' + code)));
  setTimeout(() => reject(new Error('serve.mjs did not start')), 10000);
});
const base = `http://localhost:${PORT}/`;
check(fs.existsSync(path.join(dir, 'notes.json')), 'serve.mjs creates an empty notes.json on start');

// static + ranges + containment
const files = JSON.parse(fs.readFileSync(path.join(dir, 'files.json'), 'utf8'));
const clip = files.find((f) => /\.(mp4|webm)$/.test(f));
let r = await fetch(base + clip, { headers: { range: 'bytes=0-99' } });
check(r.status === 206 && (await r.arrayBuffer()).byteLength === 100 && /^bytes 0-99\//.test(r.headers.get('content-range')), `video byte ranges: ${clip} -> 206, 100 bytes`);
r = await fetch(base + clip, { headers: { range: 'bytes=-50' } });
check(r.status === 206 && (await r.arrayBuffer()).byteLength === 50, 'suffix range (last 50 bytes) -> 206');
r = await fetch(base);
check(r.status === 200 && (await r.text()).includes('__FILM_DATA__') === false, '/ serves the edit room page');
r = await fetch(base + '..%2f..%2f..%2fetc%2fpasswd');
const r2 = await fetch(base + '%2e%2e/%2e%2e/package.json');
check(r.status >= 400 && r2.status >= 400, `nothing outside the folder is served (${r.status}, ${r2.status})`);

// the page
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(base);
await page.waitForSelector('#stage');
await page.waitForTimeout(1500);
check(await page.locator('#storeBanner').isHidden(), 'served by serve.mjs: no "browser only" banner');
const box = await page.locator('#stage').boundingBox();
await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.6);
await page.fill('#noteText', 'Local note: the statue should hold still here.');
await page.keyboard.press('Control+Enter');
await page.waitForTimeout(600);
let saved = JSON.parse(fs.readFileSync(path.join(dir, 'notes.json'), 'utf8'));
const n = saved.find((x) => String(x.text).startsWith('Local note'));
check(n && n.id && typeof n.frame === 'number' && Math.abs(n.x - 0.3) < 0.01 && Math.abs(n.y - 0.6) < 0.01 && n.cut && n.cutName && n.shot && n.timecode,
  `the note is in notes.json (id ${n && n.id}, cut ${n && n.cut} "${n && n.cutName}", frame ${n && n.frame}, shot ${n && n.shot}, pin ${n && n.x.toFixed(3)},${n && n.y.toFixed(3)})`);
const md = fs.readFileSync(path.join(dir, 'notes.md'), 'utf8');
check(md.includes('Local note: the statue should hold still here.') && md.includes(`## ${n && n.cutName}`), 'notes.md has the note under its cut');
await page.reload();
await page.waitForSelector('#stage');
await page.waitForTimeout(1500);
await page.click('[data-filter="all"]');
check((await page.textContent('#notelist')).includes('Local note'), 'the note survives a reload');
// another writer (e.g. a second tab) marks it done; the open page follows within a few seconds
await fetch(base + 'api/notes/' + encodeURIComponent(n.id), { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: 'Local note (edited elsewhere)' }) });
await page.waitForTimeout(5500);
check((await page.textContent('#notelist')).includes('edited elsewhere'), 'a change from another writer reaches the open page (poll)');
r = await fetch(base + 'api/notes/' + encodeURIComponent(n.id), { method: 'DELETE' });
saved = await r.json();
check(Array.isArray(saved) && !saved.some((x) => x.id === n.id), 'DELETE removes the note');
check(errors.length === 0, `no page errors (${errors.join(' | ')})`);
await browser.close();
srv.kill();
console.log(fails ? `${fails} FAILED` : 'ALL PASS');
process.exit(fails ? 1 : 0);
