#!/usr/bin/env node
// The Edit Room on localhost. Copied into the packaged edit room as serve.mjs (tools/build-review.mjs);
// run it from that folder:   node serve.mjs [--port 4321] [--no-open]
// No dependencies (Node 18+). Serves the page and its media (with byte ranges, so video seeks work) and
// keeps the notes in notes.json beside it, plus notes.md, a readable copy grouped by cut and ordered by time.
//   GET    /api/notes          -> [note, ...]
//   POST   /api/notes          body: note           -> [note, ...]   (the server assigns id)
//   PATCH  /api/notes/<id>     body: partial note   -> [note, ...]
//   DELETE /api/notes/<id>                          -> [note, ...]
// Binds to 127.0.0.1 only: nothing on the network can reach it.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const NOTES = path.join(DIR, 'notes.json');
const NOTES_MD = path.join(DIR, 'notes.md');
const TYPES = { '.html': 'text/html; charset=utf-8', '.mp4': 'video/mp4', '.webm': 'video/webm', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.json': 'application/json', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.md': 'text/markdown; charset=utf-8' };

const readNotes = () => { try { const v = JSON.parse(fs.readFileSync(NOTES, 'utf8')); return Array.isArray(v) ? v : []; } catch { return []; } };
function writeNotes(list) {
  const tmp = NOTES + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(list, null, 1) + '\n');
  fs.renameSync(tmp, NOTES);
  // the readable copy: by cut, then by time
  const byCut = new Map();
  for (const n of [...list].sort((a, b) => (a.frame ?? 0) - (b.frame ?? 0))) {
    const k = n.cutName || n.cut || 'Film';
    if (!byCut.has(k)) byCut.set(k, []);
    byCut.get(k).push(n);
  }
  let md = `# Edit Room notes\n\n${list.length} note(s), ${list.filter((n) => n.status !== 'done').length} open. Saved ${new Date().toISOString()}.\n`;
  for (const [cut, notes] of byCut) {
    md += `\n## ${cut}\n\n`;
    for (const n of notes) {
      const pin = typeof n.x === 'number' && typeof n.y === 'number' ? ` · pin ${(n.x * 100).toFixed(0)}% across, ${(n.y * 100).toFixed(0)}% down` : '';
      md += `- [${n.status === 'done' ? 'x' : ' '}] **${n.timecode || ''}** (frame ${n.frame ?? '?'}) · ${n.shot || ''}${pin}\n  ${String(n.text || '').replace(/\n/g, '\n  ')}\n`;
    }
  }
  fs.writeFileSync(NOTES_MD, md);
}

function body(req) {
  return new Promise((resolve, reject) => {
    let s = '';
    req.on('data', (c) => { s += c; if (s.length > 1e6) { reject(new Error('too large')); req.destroy(); } });
    req.on('end', () => { try { resolve(s ? JSON.parse(s) : {}); } catch (e) { reject(e); } });
  });
}
const json = (res, code, v) => { res.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(v)); };

async function notesApi(req, res, id) {
  let list = readNotes();
  if (req.method === 'GET' && !id) return json(res, 200, list);
  if (req.method === 'POST' && !id) {
    const n = await body(req);
    const nid = typeof n.id === 'string' && /^[\w-]{1,64}$/.test(n.id) && !list.some((x) => x.id === n.id) ? n.id : 'n' + crypto.randomBytes(6).toString('hex');
    list.push({ ...n, id: nid });
  } else if (req.method === 'PATCH' && id) {
    const patch = await body(req);
    const n = list.find((x) => x.id === id);
    if (!n) return json(res, 404, { error: 'no such note' });
    Object.assign(n, patch, { id });
  } else if (req.method === 'DELETE' && id) {
    list = list.filter((x) => x.id !== id);
  } else return json(res, 405, { error: 'method not allowed' });
  writeNotes(list);
  return json(res, 200, list);
}

function serveFile(req, res, rel) {
  const file = path.resolve(DIR, '.' + path.posix.normalize('/' + rel));
  if (!file.startsWith(DIR + path.sep) && file !== DIR) { res.writeHead(403); return res.end(); }
  let st;
  try { st = fs.statSync(file); } catch { res.writeHead(404); return res.end('not found'); }
  if (!st.isFile()) { res.writeHead(404); return res.end('not found'); }
  const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const headers = { 'content-type': type, 'accept-ranges': 'bytes', 'cache-control': rel.endsWith('.html') ? 'no-cache' : 'max-age=3600' };
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (m && (m[1] || m[2])) {
    let a = m[1] ? +m[1] : st.size - +m[2], b = m[1] && m[2] ? +m[2] : st.size - 1;
    if (a < 0) a = 0;
    b = Math.min(b, st.size - 1);
    if (a > b || a >= st.size) { res.writeHead(416, { 'content-range': `bytes */${st.size}` }); return res.end(); }
    res.writeHead(206, { ...headers, 'content-range': `bytes ${a}-${b}/${st.size}`, 'content-length': b - a + 1 });
    if (req.method === 'HEAD') return res.end();
    return fs.createReadStream(file, { start: a, end: b }).pipe(res);
  }
  res.writeHead(200, { ...headers, 'content-length': st.size });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const p = decodeURIComponent(url.pathname);
    const api = /^\/api\/notes(?:\/([^/]+))?\/?$/.exec(p);
    if (api) return await notesApi(req, res, api[1]);
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    return serveFile(req, res, p === '/' ? 'editroom.html' : p.slice(1));
  } catch (e) {
    if (!res.headersSent) json(res, 500, { error: String(e.message || e) });
  }
});

let port = +opt('port', process.env.PORT || 4321);
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE' && !argv.includes('--port')) { port++; server.listen(port, '127.0.0.1'); }
  else { console.error(e.message); process.exit(1); }
});
server.on('listening', () => {
  const url = `http://localhost:${port}/`;
  if (!fs.existsSync(NOTES)) writeNotes([]);
  console.log(`Edit Room: ${url}\nNotes: ${path.relative(process.cwd(), NOTES) || NOTES} (and notes.md)\nCtrl+C to stop.`);
  if (!argv.includes('--no-open')) {
    const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
    const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
    try { spawn(cmd, args, { stdio: 'ignore', detached: true }).on('error', () => {}).unref(); } catch { /* open it by hand */ }
  }
});
server.listen(port, '127.0.0.1');
