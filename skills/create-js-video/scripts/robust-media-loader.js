// Robust loading for <video>/<audio> on review pages served from artifact hosts and CDNs, where clips "sometimes
// don't load": a request that never answers, a 5xx, a host without byte ranges (no seeking), or playback that stalls.
//
//   import { loadMedia, watchdog, revokeAll } from './robust-media-loader.js';
//   const r = await loadMedia(video, 'media/clip-03.mp4', { onStatus: (s) => banner(s) });   // { mode: 'direct'|'blob' }
//   const stop = watchdog(video);                                          // reloads and resumes a stalled element
//
// loadMedia: tries the URL directly and waits for 'loadedmetadata' with a timeout; if that times out or errors, or the
// host gives no byte ranges (the element is not seekable over its duration), it fetches the whole file into a Blob
// (AbortController timeout, retries with exponential backoff) and plays the object URL. Blobs are cached per URL; a
// failed fetch is dropped from the cache so the next call retries. Rejects only after every attempt failed: show the
// error and a "tap to retry" control, and never start picture without its sound.
// watchdog: every second, if the element should be playing but its time has not moved for stallMs, it reloads the
// source as a blob (onStall can replace that), seeks back and resumes. Returns a function that stops it.
//
// Provenance: new for the create-js-video skill. The "Nova, Episode 1" Edit Room (src/review/editroom.html) fell back
// to blobs only when byte ranges were missing and had no timeouts, retry loop or watchdog; the director still saw
// clips fail to load. This module adds the three. Plain ES module, no dependencies.

const blobs = new Map();   // url -> Promise<objectURL>

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function waitFor(el, okEvents, timeoutMs) {
  return new Promise((resolve, reject) => {
    const done = (fn, v) => { clearTimeout(timer); for (const e of okEvents) el.removeEventListener(e, onOk); el.removeEventListener('error', onErr); fn(v); };
    const onOk = () => done(resolve);
    const onErr = () => done(reject, new Error('media error ' + (el.error ? el.error.code : '?')));
    const timer = setTimeout(() => done(reject, new Error(`no ${okEvents[0]} after ${timeoutMs} ms`)), timeoutMs);
    for (const e of okEvents) el.addEventListener(e, onOk, { once: true });
    el.addEventListener('error', onErr, { once: true });
  });
}

export function blobUrl(url, { fetchTimeoutMs = 45000, retries = 4, backoffMs = 800, onStatus = () => {} } = {}) {
  if (blobs.has(url)) return blobs.get(url);
  const p = (async () => {
    let last;
    for (let k = 0; k <= retries; k++) {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), fetchTimeoutMs);
      try {
        const r = await fetch(url, { signal: ctl.signal, cache: 'no-store' });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const b = await r.blob();
        if (!b.size) throw new Error('empty response');
        return URL.createObjectURL(b);
      } catch (e) {
        last = e;
        onStatus(`retrying ${url.split('/').pop()} (${k + 1}/${retries + 1}): ${e.message || e}`);
        if (k < retries) await sleep(backoffMs * 2 ** k);
      } finally { clearTimeout(timer); }
    }
    throw last;
  })();
  p.catch(() => blobs.delete(url));   // a failed fetch is retried on the next call
  blobs.set(url, p);
  return p;
}

const seekableOk = (el) => el.seekable && el.seekable.length > 0 && el.seekable.end(el.seekable.length - 1) >= Math.min(el.duration || 0, 1) - 0.05;

export async function loadMedia(el, url, opts = {}) {
  const o = { metaTimeoutMs: 8000, preferBlob: false, onStatus: () => {}, ...opts };
  el.dataset.mediaUrl = url;
  el.preload = 'auto';
  if (!o.preferBlob) {
    try {
      el.src = url;
      el.load();
      await waitFor(el, ['loadedmetadata'], o.metaTimeoutMs);
      if (seekableOk(el)) return { mode: 'direct', src: url };
      o.onStatus('no byte ranges from the host: loading the whole file');
    } catch (e) {
      o.onStatus(`direct load failed (${e.message}): loading the whole file`);
    }
  }
  const obj = await blobUrl(url, o);
  el.src = obj;
  el.load();
  await waitFor(el, ['loadedmetadata'], Math.max(o.metaTimeoutMs, 15000));
  return { mode: 'blob', src: obj };
}

export function watchdog(el, { stallMs = 6000, onStall = null, onStatus = () => {} } = {}) {
  let lastT = -1, since = performance.now(), busy = false;
  const id = setInterval(async () => {
    if (busy || el.paused || el.ended || el.seeking) { lastT = el.currentTime; since = performance.now(); return; }
    if (el.currentTime !== lastT) { lastT = el.currentTime; since = performance.now(); return; }
    if (performance.now() - since < stallMs) return;
    busy = true;
    const t = el.currentTime;
    onStatus(`stalled at ${t.toFixed(2)} s: reloading`);
    try {
      if (onStall) await onStall(el);
      else {
        const url = el.dataset.mediaUrl;
        if (url) { blobs.delete(url); await loadMedia(el, url, { preferBlob: true, onStatus }); }
      }
      el.currentTime = t;
      await el.play().catch(() => {});
    } catch (e) { onStatus(`reload failed: ${e.message || e}`); }
    finally { busy = false; lastT = el.currentTime; since = performance.now(); }
  }, 1000);
  return () => clearInterval(id);
}

export async function revokeAll() {
  for (const p of blobs.values()) { try { URL.revokeObjectURL(await p); } catch { /* failed fetches have nothing to revoke */ } }
  blobs.clear();
}
