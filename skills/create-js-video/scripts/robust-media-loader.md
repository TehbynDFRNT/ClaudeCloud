# robust-media-loader.js

A browser ES module for review pages whose clips "sometimes don't load". This happens when a request never answers,
a 5xx comes back, a host serves no byte ranges (so there is no seeking), or playback stalls.

```js
import { loadMedia, watchdog, revokeAll } from './robust-media-loader.js';
const r = await loadMedia(video, 'media/clip-03.mp4', { onStatus: (s) => (banner.textContent = s) });
const stop = watchdog(video);              // reload + seek back + resume when playback stops advancing
```

- `loadMedia` loads directly first, then waits for `loadedmetadata` with a timeout (`metaTimeoutMs`, 8 s). It falls
  back to fetching the whole file into a Blob in three cases: the wait times out, the load errors, or the element is
  not seekable over its duration. The fetch has an `AbortController` timeout (`fetchTimeoutMs`, 45 s) and retries
  with exponential backoff (`retries` 4, `backoffMs` 800). Blobs are cached per URL, and failed fetches leave the
  cache.
- If every attempt fails, it rejects. Show the reason and a "tap to retry" control. Never start the picture without
  its soundtrack: in the Edit Room the soundtrack is the master clock.
- `watchdog` checks every second. If the element should be playing but its time hasn't moved for `stallMs` (6 s), it
  reloads the source as a blob, seeks back and resumes. Pass `onStall` to handle the stall yourself.
- Blob fallback holds whole files in memory. That is fine for 10 s clips and one soundtrack, but not for a 90 MB
  master.

Provenance: new for the skill. Nova's Edit Room fell back to blobs only when byte ranges were missing, and it had no
timeouts, retry loop or watchdog (checked in `src/review/editroom.html`). Tested in headless Chromium against five
host behaviours: healthy (direct), no ranges (blob), two 503s (blob after retries), two hanging requests (timeout,
then blob), and dead (rejects after 5 tries). `watchdog()` was not exercised.
