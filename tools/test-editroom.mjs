#!/usr/bin/env node
// Local functional test of the Edit Room (src/review/editroom.html packaged by tools/build-review.mjs).
// Generates frame-coded PORTRAIT test cards (720x1280, one per fake cut; the cuts share most 10 s clips),
// packages them as three cuts (+ a single-cut package), then checks in the local Chromium:
//   portrait layout (desktop: picture beside timeline/notes, no giant scroll; phone: full width), pins exactly
//   on the picture in both, frame-exact stepping/seeks, sync across clip boundaries, the cut switcher (same
//   frame, cut-specific picture, shared clips stored once, per-cut shot data), notes per cut (+ legacy notes
//   without `cut` under David & Goliath), and the sound UI (unmuted at 80%, mute/volume, failed soundtrack,
//   play() rejected -> "Tap for sound", never picture without sound).
//   node tools/test-editroom.mjs [--dir out/editroom-test] [--norange] [--skip-single]
// Test cards: two brightness-coded squares give the frame number mod 576 (n%24 at y=0.55, floor(n/24)%24 at
// y=0.70; level 10+10*code), a variant square at y=0.25 marks cut-specific frames (absent / 128 Sol / 224 Prometheus).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const dir = path.resolve(ROOT, opt('dir', 'out/editroom-test'));
const singleDir = dir + '-single';
const cardsDir = path.join(ROOT, 'out/editroom-cards');
const NORANGE = argv.includes('--norange');
const plan0 = JSON.parse(fs.readFileSync(path.join(ROOT, 'film-plan.json'), 'utf8'));
const FRAMES = plan0.frames, FPS = 24;
const CUTS = [
  { id: 'david', plan: 'film-plan.json', variants: [] },
  { id: 'sol', plan: 'film-plan-sol.json', level: 128, label: 'SOL', variants: [[300, 420], [2022, 2041]] },          // clips 1 and 8 differ
  { id: 'prometheus', plan: 'film-plan-prometheus.json', level: 224, label: 'PROM', variants: [[300, 420], [3400, 3450]], tone: 440 }, // clips 1 and 14 differ; its own soundtrack
];

// ---------- 1. test cards ----------
function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: ['ignore', 'inherit', 'inherit'] });
  if (r.status !== 0) throw new Error(`${cmd} failed: ${args.join(' ')}`);
}
const CARD_VERSION = 'portrait-v2';
function makeCard(cut) {
  const file = path.join(cardsDir, `${cut.id}.mp4`), stamp = file + '.v';
  if (fs.existsSync(file) && fs.existsSync(stamp) && fs.readFileSync(stamp, 'utf8') === CARD_VERSION + JSON.stringify(cut) + FRAMES) return file;
  fs.mkdirSync(cardsDir, { recursive: true });
  const font = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
  const hex = (v) => '0x' + v.toString(16).padStart(2, '0').repeat(3);
  const f = ['drawgrid=w=180:h=320:t=2:c=0x3a3a3a'];
  for (let c = 0; c < 24; c++) f.push(`drawbox=x=300:y=644:w=120:h=120:color=${hex(10 + 10 * c)}:t=fill:enable='eq(mod(n,24),${c})'`);
  for (let c = 0; c < 24; c++) f.push(`drawbox=x=300:y=836:w=120:h=120:color=${hex(10 + 10 * c)}:t=fill:enable='eq(mod(floor(n/24),24),${c})'`);
  if (cut.variants.length) {
    const en = cut.variants.map(([a, b]) => `between(n,${a},${b - 1})`).join('+');
    f.push(`drawbox=x=300:y=260:w=120:h=120:color=${hex(cut.level)}:t=fill:enable='${en}'`);
    f.push(`drawtext=fontfile=${font}:text='${cut.label}':fontsize=54:fontcolor=white:x=(w-tw)/2:y=180:enable='${en}'`);
  }
  // corner markers (the picture's edges) and crosshairs at picture (0.25, 0.75) and (0.8, 0.15)
  f.push('drawbox=x=0:y=0:w=28:h=28:color=red:t=fill', 'drawbox=x=iw-28:y=0:w=28:h=28:color=lime:t=fill',
    'drawbox=x=0:y=ih-28:w=28:h=28:color=blue:t=fill', 'drawbox=x=iw-28:y=ih-28:w=28:h=28:color=yellow:t=fill',
    'drawbox=x=150:y=958:w=60:h=4:color=white:t=fill', 'drawbox=x=178:y=930:w=4:h=60:color=white:t=fill',
    'drawbox=x=546:y=190:w=60:h=4:color=orange:t=fill', 'drawbox=x=574:y=162:w=4:h=60:color=orange:t=fill',
    `drawtext=fontfile=${font}:text='%{n}':fontsize=72:fontcolor=0xe8e8e8:x=(w-tw)/2:y=60`,
    `drawtext=fontfile=${font}:text='9\\:16 TEST CARD':fontsize=30:fontcolor=0x9a9a9a:x=(w-tw)/2:y=1180`);
  const dur = (FRAMES / FPS).toFixed(6);
  console.log(`making test card ${cut.id} (${FRAMES} frames, 720x1280)`);
  run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'color=c=0x202020:s=720x1280:r=24',
    '-f', 'lavfi', '-i', `aevalsrc=${Array(2).fill(`0.25*sin(2*PI*${cut.tone || 330}*t)*(0.6+0.4*lt(mod(t\\,1)\\,0.12))`).join('|')}:s=48000`,
    '-vf', f.join(','), '-frames:v', String(FRAMES), '-t', dur,
    // lossless picture: frames outside the variant ranges decode bit-identical in every cut
    '-c:v', 'libx264', '-preset', 'veryfast', '-qp', '0', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', file]);
  fs.writeFileSync(stamp, CARD_VERSION + JSON.stringify(cut) + FRAMES);
  return file;
}
const cards = CUTS.map(makeCard);
// ---------- 2. packages (build-review caches analysis + encodes, so this is cheap when nothing changed) ----------
run('node', [path.join(ROOT, 'tools/build-review.mjs'), '--codec', 'vp9', '--cuts', CUTS.map((c) => c.plan).join(','), '--videos', cards.join(','),
  '--out', dir, '--label', 'Test cards · 9:16', '--render', '9']);
if (!argv.includes('--skip-single')) run('node', [path.join(ROOT, 'tools/build-review.mjs'), '--codec', 'vp9', '--video', cards[0], '--out', singleDir, '--label', 'Single cut', '--render', '9']);

let ok = true;
const check = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) ok = false; };
const dataOf = (d) => JSON.parse(/<script type="application\/json" id="film-data">([\s\S]*?)<\/script>/.exec(fs.readFileSync(path.join(d, 'editroom.html'), 'utf8'))[1]);
const D = dataOf(dir);

// ---------- 3. package checks: shared storage, per-cut data, acts with statue inserts / split shots ----------
const files = JSON.parse(fs.readFileSync(path.join(dir, 'files.json'), 'utf8'));
const clipFiles = files.filter((f) => /clip_/.test(f));
check(D.cuts.length === 3 && D.width === 720 && D.height === 1280, `3 cuts, picture ${D.width}x${D.height}`);
check(clipFiles.length === 21, `51 clip slots stored as 21 clips (17 + 2 Sol-only + 2 Prometheus-only): ${clipFiles.length}`);
check(files.filter((f) => /soundtrack/.test(f)).length === 2 && D.cuts[0].audio === D.cuts[1].audio && D.cuts[2].audio !== D.cuts[0].audio,
  'identical audio (David, Sol) -> one shared soundtrack; different audio (Prometheus) -> its own');
check(files.length === 26 && files.every((f) => fs.existsSync(path.join(dir, f))), `files.json lists 21 clips + 2 soundtracks + 3 thumb sprites, all present (${files.length})`);
const [cd, cs, cp] = D.cuts;
check(cs.clips[14].file === cd.clips[14].file && cp.clips[8].file === cd.clips[8].file && cs.clips[0].file === cd.clips[0].file, 'identical clips are referenced, not duplicated');
check(cs.clips[1].file !== cd.clips[1].file && cp.clips[1].file !== cs.clips[1].file && cs.clips[8].file !== cd.clips[8].file && cp.clips[14].file !== cd.clips[14].file, 'cut-specific clips get their own file');
// acts are derived from the live plans, so check invariants rather than frame numbers: anchored on shot NUMBERS
// (S22-dark/S22-ignition -> S22, 'S26-expansion·2' -> S26, statue inserts M.. never anchor), contiguous, and
// every shot (statue inserts and split shots included) lies in the act containing its start
const plans = CUTS.map((c) => JSON.parse(fs.readFileSync(path.join(ROOT, c.plan), 'utf8')));
const shotNo = (id) => (/^([A-Za-z]+\d+)/.exec(id.split('·')[0]) || [, id])[1];
const ANCHOR = { 'I · Attraction': 'S01', 'II · Resistance': 'S07', 'II · Compression': 'S12', 'II · Frenzy': 'F27', 'II · Ladder': 'S16', 'III · Ignition': 'S22', 'IV · Aftermath': 'S26', Coda: 'S31' };
const actBad = cd.acts.filter((a, i) => {
  const hits = plans[0].shots.filter((s) => shotNo(s.id) === ANCHOR[a.name]);
  return (i > 0 && a.start !== Math.min(...hits.map((s) => s.start))) || (i > 0 && a.start !== cd.acts[i - 1].end) || a.end <= a.start;
});
check(cd.acts.length === 8 && cd.acts[0].start === 0 && cd.acts[7].end === cd.frames && actBad.length === 0,
  `8 acts anchored on shot numbers, contiguous over the cut (${cd.acts.map((a) => `${a.short}@${a.start}`).join(' ')})`);
const actAt = (f) => cd.acts.find((a) => f >= a.start && f < a.end).name;
const inserts = cd.shots.filter((s) => s.scene === 'statue' || s.id.includes('·'));
check(cd.shots.every((s) => s.act === actAt(s.start)) && inserts.length > 0, `every shot sits in its act, incl. ${inserts.length} statue inserts / split shots (${inserts.slice(0, 4).map((s) => `${s.id}:${s.act.split(' ')[0]}`).join(', ')}...)`);
const shot = (c, id) => c.shots.find((s) => s.id === id) || {};
const pic = (p, id) => { const s = p.shots.find((x) => x.id === id); return s ? JSON.stringify([s.scene, s.preset || null, s.params || null, s.start, s.end, (p.text || []).filter((t) => t.start < s.end && t.end > s.start).map((t) => t.content)]) : 'none'; };
const mustFlag = cd.shots.filter((s) => new Set(plans.map((p) => pic(p, s.id))).size > 1).map((s) => s.id);
const mustNot = cd.shots.filter((s) => !mustFlag.includes(s.id)).map((s) => s.id);
check(mustFlag.length > 0 && mustFlag.every((id) => shot(cd, id).diff) && mustNot.every((id) => !shot(cd, id).diff),
  `shots that differ by cut are flagged (${mustFlag.length}: ${mustFlag.slice(0, 6).join(', ')}...), the ${mustNot.length} identical ones are not`);
check(shot(cs, 'S02-goliath').purpose !== shot(cd, 'S02-goliath').purpose && cs.text.find((t) => t.id === 'name-giant').content.startsWith('HIEMS'), 'per-cut purposes and on-screen text');
check(cd.thumbs.w === 90 && cd.thumbs.h === 160 && cd.thumbs.file !== cs.thumbs.file, 'portrait thumbnail sprite per cut');

// ---------- 4. browser ----------
for (const d of [dir, singleDir]) {
  if (!fs.existsSync(path.join(d, 'editroom.html'))) continue;
  const page0 = fs.readFileSync(path.join(d, 'editroom.html'), 'utf8');
  // the publish skeleton, as the Artifact tool wraps the page
  fs.writeFileSync(path.join(d, 'index.html'), `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0}</style></head><body>${page0}</body></html>`);
}
const SERVE = path.join(ROOT, 'out');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mp4': 'video/mp4', '.webm': 'video/webm', '.jpg': 'image/jpeg' };
const srv = http.createServer((req, res) => {
  const p = path.join(SERVE, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(SERVE) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  // byte ranges, as any real static host serves media
  const size = fs.statSync(p).size, type = MIME[path.extname(p)] || 'application/octet-stream';
  const m = NORANGE ? null : /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
  if (m) {
    const a = m[1] ? +m[1] : size - +m[2], b = m[1] && m[2] ? +m[2] : size - 1;
    res.writeHead(206, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${a}-${b}/${size}`, 'Content-Length': b - a + 1 });
    fs.createReadStream(p, { start: a, end: b }).pipe(res);
  } else { res.writeHead(200, { 'Content-Type': type, ...(NORANGE ? {} : { 'Accept-Ranges': 'bytes' }), 'Content-Length': size }); fs.createReadStream(p).pipe(res); }
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${srv.address().port}/`;
const url = base + path.relative(SERVE, dir) + '/index.html';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
const errors = [];
const watch = (pg) => {
  pg.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });  // font CDN/favicon loads fail in this sandbox only
  pg.on('pageerror', (e) => errors.push(String(e)));
};
const ready = (pg) => pg.waitForFunction(() => document.querySelector('video.show').readyState >= 2 && document.getElementById('aud').readyState >= 1, null, { timeout: 60000 });
// what the visible picture shows: full frame code (mod 576) and the cut variant square
const shown = (pg) => pg.evaluate(async () => {
  const a = document.getElementById('aud');
  await new Promise((r) => (a.seeking ? a.addEventListener('seeked', r, { once: true }) : r()));
  await new Promise((r) => setTimeout(r, 60));
  let v = document.querySelector('video.show');
  for (let i = 0; i < 150 && (v.readyState < 2 || v.seeking); i++) { await new Promise((r) => setTimeout(r, 30)); v = document.querySelector('video.show'); }
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const c = document.createElement('canvas'); c.width = 8; c.height = 8; const x = c.getContext('2d', { willReadFrequently: true });
  const at = (fx, fy) => { x.drawImage(v, v.videoWidth * fx - 4, v.videoHeight * fy - 4, 8, 8, 0, 0, 8, 8); const d = x.getImageData(0, 0, 8, 8).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i]; return s / (d.length / 4); };
  const lvl = (r) => Math.max(0, Math.min(23, Math.round((r - 10) / 10)));
  const V = at(0.5, 0.25);
  return { code: lvl(at(0.5, 0.70)) * 24 + lvl(at(0.5, 0.55)), variant: V < 70 ? 'base' : V < 180 ? 'sol' : 'prometheus', tc: document.getElementById('tc').textContent,
    sub: document.getElementById('tcsub').textContent, src: v.dataset.file || v.currentSrc, k: v.dataset.k };
});
const frameOfSub = (s) => +s.sub.match(/frame (\d+)/)[1];
const seek = (pg, f) => pg.evaluate((fr) => { const a = document.getElementById('aud'); a.pause(); a.currentTime = (fr + 0.5) / 24; }, f);
// a pin's centre against the picture: must sit at exactly (x, y) of the video's box
const pinGeom = (pg, noteId) => pg.evaluate((id) => {
  const v = document.querySelector('video.show').getBoundingClientRect(), st = document.getElementById('stage').getBoundingClientRect();
  const p = document.querySelector(`.pin[data-note="${id}"]`); if (!p) return null;
  const r = p.getBoundingClientRect();
  return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, v: { left: v.left, top: v.top, width: v.width, height: v.height }, st: { left: st.left, top: st.top, width: st.width, height: st.height }, iw: innerWidth };
}, noteId);
const legacy = { id: 'legacy1', frame: 1500, x: 0.8, y: 0.15, text: 'Legacy note from render 1 (saved before cuts existed).', shot: 'S12-engulf', status: 'open', createdAt: '2026-10-03T12:00:00.000Z', render: 1, tags: [] };
const shots = path.join(dir, 'shots'); fs.mkdirSync(shots, { recursive: true });

try {
  // ===== desktop, three cuts =====
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript((n) => { if (localStorage.getItem('editroom-notes-v1') === null) localStorage.setItem('editroom-notes-v1', JSON.stringify([n])); }, legacy);
  const page = await ctx.newPage(); watch(page);
  await page.goto(url);
  await ready(page);
  const L = await page.evaluate(() => {
    const r = (el) => el.getBoundingClientRect();
    const st = r(document.getElementById('stage')), tl = r(document.getElementById('tl')), v = document.querySelector('video.show'), vr = r(v);
    return { st: { l: st.left, t: st.top, w: st.width, h: st.height, r: st.right, b: st.bottom }, tlLeft: tl.left, vr: { l: vr.left, t: vr.top, w: vr.width, h: vr.height }, vw: v.videoWidth, vh: v.videoHeight, sh: document.documentElement.scrollHeight, ih: innerHeight };
  });
  check(Math.abs(L.st.w / L.st.h - 9 / 16) < 0.004 && L.vw === 720 && L.vh === 1280, `desktop: picture box is 9:16 (${L.st.w.toFixed(1)}x${L.st.h.toFixed(1)}), media 720x1280`);
  check(Math.abs(L.vr.w - L.st.w) < 0.5 && Math.abs(L.vr.h - L.st.h) < 0.5 && Math.abs(L.vr.l - L.st.l) < 0.5 && Math.abs(L.vr.t - L.st.t) < 0.5, 'desktop: video fills the picture box exactly (no letterbox, pins share its coordinates)');
  check(L.st.t >= 0 && L.st.b <= L.ih && L.st.h >= 0.8 * L.ih, `desktop: whole picture on screen at ${(100 * L.st.h / L.ih).toFixed(0)}% of the window height`);
  check(L.tlLeft >= L.st.r, 'desktop: timeline sits beside the picture');
  check(L.sh <= L.ih + 40, `desktop: no giant scroll (page ${L.sh}px in a ${L.ih}px window)`);

  // frame-step with the page's own keys and compare the pictured frame code with the displayed frame
  await page.click('#tl', { position: { x: 300, y: 30 } });
  for (const steps of [0, 1, 1, 1, 7, 24]) {
    for (let i = 0; i < steps; i++) await page.keyboard.press('ArrowRight');
    const s = await shown(page);
    const f = frameOfSub(s);
    check(s.code === f % 576, `pictured frame code ${s.code} matches displayed frame ${f} (${s.tc})`);
  }
  for (const target of [0, 1, 239, 240, 2724, 2725, 2726, 3755, FRAMES - 1]) {
    await seek(page, target);
    const s = await shown(page);
    check(s.code === target % 576 && s.sub.startsWith(`frame ${target} `), `seek to frame ${target}: pictured ${s.code}, display "${s.sub}"`);
  }
  // playback across a clip boundary: picture must track the soundtrack clock; the level meter moves
  await seek(page, 228); await shown(page);
  await page.keyboard.press('Space');
  await page.waitForTimeout(1600);
  const sync = await page.evaluate(() => {
    const a = document.getElementById('aud'), v = document.querySelector('video.show');
    return { clockF: a.currentTime * 24, clip: v.dataset.k, local: v.currentTime * 24, playing: !a.paused, lit: document.querySelectorAll('#meter i.on').length, state: document.getElementById('sound').dataset.state };
  });
  await page.keyboard.press('Space');
  const drift = Math.abs((sync.clip * 240 + sync.local) - sync.clockF);
  check(sync.playing && sync.clip === '1' && drift < 3, `playback crossed into clip 1 in sync (drift ${drift.toFixed(2)} frames)`);
  check(sync.state === 'on' && sync.lit > 0, `while playing: sound state "${sync.state}", level meter lit (${sync.lit}/5)`);
  const s2 = await shown(page);
  check(s2.code === frameOfSub(s2) % 576, `after pausing, pictured frame matches display (frame ${frameOfSub(s2)})`);

  // ----- sound control -----
  const snd = () => page.evaluate(() => { const a = document.getElementById('aud'); return { muted: a.muted, vol: a.volume, label: document.getElementById('soundLabel').textContent, state: document.getElementById('sound').dataset.state, badge: document.getElementById('soundBadge').hidden ? null : document.getElementById('soundBadge').textContent, gate: !document.getElementById('soundGate').hidden }; });
  let sd = await snd();
  check(!sd.muted && Math.abs(sd.vol - 0.8) < 0.01 && sd.label === 'Sound on · 80%' && sd.badge === null, `starts unmuted at 80% ("${sd.label}")`);
  await page.click('#kMute');
  sd = await snd();
  check(sd.muted && sd.label === 'Muted' && sd.state === 'muted' && /Sound off/.test(sd.badge || ''), `mute button: muted, label "${sd.label}", badge on the picture "${sd.badge}"`);
  await page.click('#soundBadge');
  sd = await snd();
  check(!sd.muted && sd.badge === null && sd.label === 'Sound on · 80%', 'tapping the badge unmutes');
  await page.evaluate(() => { const r = document.getElementById('vol'); r.value = '0.4'; r.dispatchEvent(new Event('input', { bubbles: true })); r.dispatchEvent(new Event('change', { bubbles: true })); });
  sd = await snd();
  check(Math.abs(sd.vol - 0.4) < 0.01 && sd.label === 'Sound on · 40%', `volume slider sets the level ("${sd.label}")`);
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  await page.keyboard.press('m'); const m1 = (await snd()).muted; await page.keyboard.press('m'); const m2 = (await snd()).muted;
  check(m1 && !m2, 'M key toggles mute');
  await page.evaluate(() => { const r = document.getElementById('vol'); r.value = '0.8'; r.dispatchEvent(new Event('input', { bubbles: true })); });

  // ----- cut switcher: same frame, cut-specific picture where it differs, shared clips elsewhere -----
  const pressed = () => page.evaluate(() => [...document.querySelectorAll('#cuts button')].map((b) => `${b.dataset.cut}:${b.getAttribute('aria-pressed')}`).join(' '));
  await seek(page, 360);
  let s = await shown(page);
  check(s.variant === 'base' && s.code === 360, `David & Goliath at frame 360: base picture (${s.variant})`);
  await page.click('#cuts button[data-cut="sol"]');
  s = await shown(page);
  check(s.variant === 'sol' && s.code === 360 && frameOfSub(s) === 360, `switch to Sol Invictus keeps frame 360 and shows the Sol picture (${s.variant}, code ${s.code})`);
  check(/sol:true/.test(await pressed()), 'switcher shows Sol Invictus pressed');
  const purpose = await page.textContent('#shotPurpose');
  check(purpose === shot(cs, 'S02-goliath').purpose, `shot card shows the Sol plan's purpose ("${purpose.slice(0, 40)}...")`);
  await seek(page, 300); await shown(page);
  check((await page.textContent('#shotText')).startsWith('HIEMS'), `on-screen words come from the Sol plan ("${(await page.textContent('#shotText')).split('\n')[0]}")`);
  for (const [f, want] of [[2030, 'sol'], [3420, 'base'], [3600, 'base'], [239, 'base'], [240, 'base']]) {
    await seek(page, f); s = await shown(page);
    check(s.variant === want && s.code === f % 576, `Sol frame ${f}: ${s.variant} picture, code ${s.code}`);
  }
  await seek(page, 3420); s = await shown(page);
  check(s.src.endsWith(cd.clips[14].file), `Sol plays David's stored clip 14 (${s.src.split('/').pop()})`);
  await page.keyboard.press('3');
  s = await shown(page);
  check(s.variant === 'prometheus' && s.code === 3420 % 576 && /prometheus:true/.test(await pressed()), `key 3 -> Prometheus at frame 3420: ${s.variant}`);
  for (const [f, want] of [[2030, 'base'], [3600, 'base'], [360, 'prometheus']]) {
    await seek(page, f); s = await shown(page);
    check(s.variant === want && s.code === f % 576, `Prometheus frame ${f}: ${s.variant} picture`);
  }
  // switching while playing keeps playing, in sync, on the shared soundtrack
  await seek(page, 1890); await shown(page);
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);
  await page.keyboard.press('2');
  await page.waitForTimeout(900);
  const ps = await page.evaluate(() => { const a = document.getElementById('aud'), v = document.querySelector('video.show'); return { playing: !a.paused, d: Math.abs(+v.dataset.k * 240 + v.currentTime * 24 - a.currentTime * 24) }; });
  await page.keyboard.press('Space');
  check(ps.playing && ps.d < 3, `switching cut during playback keeps playing in sync (drift ${ps.d.toFixed(2)} frames)`);
  // onto a cut with a different soundtrack: the sound reloads, then picture and sound resume together
  await page.keyboard.press('Space');
  await page.waitForTimeout(400);
  const fBefore = await page.evaluate(() => Math.floor(document.getElementById('aud').currentTime * 24));
  await page.keyboard.press('3');
  await page.waitForFunction(() => !document.getElementById('aud').paused && (document.getElementById('aud').dataset.file || '').includes('prometheus'), null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(700);
  const pq = await page.evaluate(() => { const a = document.getElementById('aud'), v = document.querySelector('video.show'); return { playing: !a.paused, src: (a.dataset.file || '').split('/').pop(), f: a.currentTime * 24, d: Math.abs(+v.dataset.k * 240 + v.currentTime * 24 - a.currentTime * 24) }; });
  await page.keyboard.press('Space');
  check(pq.playing && /prometheus/.test(pq.src) && pq.d < 3 && pq.f >= fBefore && pq.f < fBefore + 60, `switching to a cut with its own soundtrack during playback: ${pq.src} resumes at the same point (frame ${fBefore} -> ${pq.f.toFixed(1)}), in sync (drift ${pq.d.toFixed(2)} frames)`);
  await page.keyboard.press('1');
  await seek(page, 360); s = await shown(page);
  check(s.variant === 'base' && /david:true/.test(await pressed()), 'key 1 -> back to David & Goliath');

  // ----- notes per cut -----
  const listCount = () => page.locator('#notelist .note').count();
  await page.click('[data-filter="all"]');
  check(await listCount() === 1 && (await page.textContent('#notelist')).includes('Legacy note'), 'legacy note without `cut` shows under David & Goliath');
  await seek(page, 1000); await shown(page);
  let box = await page.locator('#stage').boundingBox();
  await page.mouse.click(box.x + box.width * 0.25, box.y + box.height * 0.75);   // the test card's white crosshair
  await page.fill('#noteText', 'Test note: the limb is too dark here.');
  await page.keyboard.press('Control+Enter');
  await page.waitForTimeout(300);
  let notes = await page.evaluate(() => JSON.parse(localStorage.getItem('editroom-notes-v1')));
  const nd = notes.find((n) => n.text.startsWith('Test note'));
  check(nd && nd.cut === 'david' && nd.frame === 1000 && Math.abs(nd.x - 0.25) < 0.004 && Math.abs(nd.y - 0.75) < 0.004, `note saved with cut "${nd && nd.cut}", frame ${nd && nd.frame}, at ${nd && nd.x},${nd && nd.y}`);
  check(await listCount() === 2, `David & Goliath lists 2 notes (${await listCount()})`);
  let g = await pinGeom(page, nd.id);
  const pinErr = (q, n) => Math.hypot(q.cx - (q.v.left + n.x * q.v.width), q.cy - (q.v.top + n.y * q.v.height));
  check(g && pinErr(g, nd) < 1, `desktop: pin sits on the picture at the note's point (error ${g ? pinErr(g, nd).toFixed(2) : '-'} px)`);
  await page.click(`.note[data-note="${nd.id}"]`);
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(shots, 'desktop-david.png') });
  await page.click('#cuts button[data-cut="sol"]');
  await shown(page);
  check(await listCount() === 0 && await page.locator('.pin').count() === 0, 'Sol Invictus: David notes and pins are not shown');
  box = await page.locator('#stage').boundingBox();
  await page.mouse.click(box.x + box.width * 0.8, box.y + box.height * 0.15);   // the orange crosshair
  await page.fill('#noteText', 'Sol note: warmer rim on the dwarf.');
  await page.keyboard.press('Control+Enter');
  await page.waitForTimeout(300);
  notes = await page.evaluate(() => JSON.parse(localStorage.getItem('editroom-notes-v1')));
  const ns = notes.find((n) => n.text.startsWith('Sol note'));
  check(ns && ns.cut === 'sol' && await listCount() === 1, `Sol note saved with cut "${ns && ns.cut}" and listed alone`);
  g = await pinGeom(page, ns.id);
  check(g && pinErr(g, ns) < 1, `desktop: Sol pin on the picture (error ${g ? pinErr(g, ns).toFixed(2) : '-'} px)`);
  const badges = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('#cuts button')].map((b) => [b.dataset.cut, (b.querySelector('.cb') || {}).textContent || '0'])));
  check(badges.david === '2' && badges.sol === '1' && badges.prometheus === '0', `cut switcher counts open notes per cut (${JSON.stringify(badges)})`);
  await page.screenshot({ path: path.join(shots, 'desktop-sol.png') });
  await page.click('#cuts button[data-cut="david"]');
  await shown(page);
  check(await listCount() === 2 && !(await page.textContent('#notelist')).includes('Sol note'), 'back on David & Goliath: its 2 notes, not the Sol note');
  const allNotes = notes;

  // ===== phone =====
  const pctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await pctx.addInitScript((n) => { if (localStorage.getItem('editroom-notes-v1') === null) localStorage.setItem('editroom-notes-v1', JSON.stringify(n)); localStorage.setItem('editroom-cut', 'david'); }, allNotes);
  const phone = await pctx.newPage(); watch(phone);
  await phone.goto(url);
  await ready(phone);
  const P = await phone.evaluate(() => { const st = document.getElementById('stage').getBoundingClientRect(); return { l: st.left, w: st.width, h: st.height, sw: document.documentElement.scrollWidth, iw: innerWidth }; });
  check(Math.abs(P.w - P.iw) < 1 && Math.abs(P.l) < 0.5 && Math.abs(P.w / P.h - 9 / 16) < 0.004, `phone: picture full width (${P.w.toFixed(1)} of ${P.iw}px), 9:16`);
  check(P.sw <= 390, `no horizontal page scroll at phone width (${P.sw}px)`);
  await phone.click('[data-filter="all"]');
  await phone.click(`.note[data-note="${nd.id}"]`);
  await shown(phone);
  g = await pinGeom(phone, nd.id);
  check(g && pinErr(g, nd) < 1, `phone: same note's pin on the same picture point (error ${g ? pinErr(g, nd).toFixed(2) : '-'} px)`);
  const ph = await shown(phone);
  check(ph.code === 1000 % 576, `phone: note click seeks to its frame (code ${ph.code})`);
  await phone.screenshot({ path: path.join(shots, 'phone.png'), fullPage: true });
  await phone.screenshot({ path: path.join(shots, 'phone-viewport.png') });

  // ===== soundtrack fails to load =====
  const fctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await fctx.route('**/media/soundtrack*', (r) => r.fulfill({ status: 404, body: '' }));
  const fp = await fctx.newPage(); watch(fp);
  await fp.goto(url);
  await fp.waitForFunction(() => document.querySelector('video.show').readyState >= 2 && document.getElementById('sound').dataset.state === 'error', null, { timeout: 30000 });
  sd = await fp.evaluate(() => ({ label: document.getElementById('soundLabel').textContent, badge: document.getElementById('soundBadge').hidden ? null : document.getElementById('soundBadge').textContent }));
  check(/No sound/.test(sd.label) && /failed to load/.test(sd.badge || ''), `failed soundtrack shown plainly ("${sd.label}"; badge "${sd.badge}")`);
  const t0 = await fp.evaluate(() => document.querySelector('video.show').currentTime);
  await fp.click('#kPlay');
  await fp.waitForTimeout(700);
  const fs1 = await fp.evaluate(() => ({ t: document.querySelector('video.show').currentTime, paused: document.querySelector('video.show').paused, gate: !document.getElementById('soundGate').hidden, gt: document.getElementById('gateTitle').textContent }));
  check(fs1.paused && Math.abs(fs1.t - t0) < 0.05 && fs1.gate && /retry/.test(fs1.gt), `play with no soundtrack: picture held (not played silently), gate "${fs1.gt}"`);
  await fp.screenshot({ path: path.join(shots, 'sound-failed.png') });
  // the connection comes back: tapping retries and plays with sound
  await fctx.unroute('**/media/soundtrack*');
  await fp.click('#soundGate');
  await fp.waitForFunction(() => !document.getElementById('aud').paused, null, { timeout: 15000 }).catch(() => {});
  const fs2 = await fp.evaluate(() => ({ playing: !document.getElementById('aud').paused, state: document.getElementById('sound').dataset.state }));
  check(fs2.playing && ['on', 'buffering'].includes(fs2.state), `after retry the soundtrack loads and plays (${fs2.state})`);
  await fp.evaluate(() => document.getElementById('aud').pause());

  // ===== play() rejected by the browser's autoplay policy =====
  const bctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await bctx.addInitScript(() => {
    const orig = HTMLMediaElement.prototype.play; window.__block = true;
    HTMLMediaElement.prototype.play = function () { if (window.__block && this.tagName === 'AUDIO') return Promise.reject(new DOMException("play() failed because the user didn't interact with the document first.", 'NotAllowedError')); return orig.call(this); };
  });
  const bp = await bctx.newPage(); watch(bp);
  await bp.goto(url);
  await ready(bp);
  await bp.keyboard.press('Space');
  await bp.waitForTimeout(500);
  const b1 = await bp.evaluate(() => ({ gate: !document.getElementById('soundGate').hidden, title: document.getElementById('gateTitle').textContent, label: document.getElementById('soundLabel').textContent, vp: document.querySelector('video.show').paused, ap: document.getElementById('aud').paused }));
  check(b1.gate && b1.title === 'Tap for sound' && /blocked/.test(b1.label) && b1.vp && b1.ap, `play() rejected: "${b1.title}" over the picture, label "${b1.label}", picture not playing`);
  await bp.screenshot({ path: path.join(shots, 'tap-for-sound.png') });
  await bp.evaluate(() => { window.__block = false; });
  await bp.click('#soundGate');
  await bp.waitForTimeout(700);
  const b2 = await bp.evaluate(() => ({ gate: !document.getElementById('soundGate').hidden, ap: document.getElementById('aud').paused, vp: document.querySelector('video.show').paused, label: document.getElementById('soundLabel').textContent }));
  check(!b2.gate && !b2.ap && !b2.vp && /Sound on/.test(b2.label), `tap for sound: picture and sound play together ("${b2.label}")`);

  // ===== single-cut package still works =====
  if (fs.existsSync(path.join(singleDir, 'index.html'))) {
    const S1 = dataOf(singleDir);
    const sctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const sp = await sctx.newPage(); watch(sp);
    await sp.goto(base + path.relative(SERVE, singleDir) + '/index.html');
    await ready(sp);
    await seek(sp, 2725);
    const ss = await shown(sp);
    const nb = await sp.locator('#cuts button').count();
    check(S1.cuts.length === 1 && nb === 1 && ss.code === 2725 % 576 && JSON.parse(fs.readFileSync(path.join(singleDir, 'files.json'), 'utf8')).length === 19,
      `single-cut package: one cut, 17 clips + soundtrack + thumbs, frame-exact seek (code ${ss.code})`);
  }
  check(errors.length === 0, `no page errors (${errors.join(' | ')})`);
} finally {
  await browser.close(); srv.close();
}
process.exit(ok ? 0 : 1);
