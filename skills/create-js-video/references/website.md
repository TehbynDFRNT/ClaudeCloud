# A one-page website for the film

How Nova's page (nova.tehbyn.com) was built from the finished film and its engine, checked, and published, and what
the director asked of it. Nova's tools are at the pinned commit (reference-implementation.md): `tools/site-assets.py`,
`site-build.py`, `site-capture.mjs`, `site-og.mjs`, `site-icons.mjs`, `site-wallpapers.sh`, `publish-site.sh`, and
the page in `site/nova/` (`index.html`, `assets/nova.css`, `assets/nova.js`, `README.md`).

## Contents
1. Assets from the film, not screenshots
2. Plates, the social card and icons from the engine
3. Checking the page: captures, the design gate, the finish reviewer, audits
4. Playing a 9:16 film on a page
5. A Downloadables section
6. Publishing, and finding out what is live

## 1. Assets from the film, not screenshots

Build every image from the finished master and the engine. Re-run the asset and build steps whenever the master
changes, so the page's frames match the film (Nova re-ran them for v4.2's "A king is crowned" line).
```bash
python3 tools/site-assets.py [--master dist/david-916-v4.mp4] [--plates tmp/plates] [--out site/nova/assets] [--mix out/audio-v4/mix.wav]
python3 tools/site-build.py      # idempotent: inlines generated parts into index.html
```
- **Stills at exact frame centres.** Seek to `(f + 0.5) / 24` and read rawvideo rgb24, then crop to the active
  picture (rows 244-1676 of 1080x1920: the letterbox is 12.7%). The gallery gets full size at q82 plus 540x716
  thumbnails, the story frames 720x955.
- **A sprite of the statue's turn**, one square per locked insert. Compute the angles by importing the scene rig
  (`node -e 'import("./src/scenes/lib/statue-rig.js").then(m => ... m.turnYaw(...))'`). Capture node's stderr and
  exit on failure: an earlier version swallowed the error.
- **A "pieces" sprite**, one thumbnail per 240-frame block: each block's middle frame, stepping to the nearest frame
  with mean luma above 20. "Brightest frame" over-picked parchment and repeated shots; the plain middle frame was
  black at the ignition and the sign-off.
- **The score's envelope.** Decode the 24-bit mix through ffmpeg to s16le mono 8 kHz (Python's `array('h')` can't
  take 24-bit), take the RMS in 300 bins, add cue marks from `plan.cues`, and write `site-data.json`.
  `site-build.py` inlines the signature path and the waveform SVG between `<!--WAVE-->` markers, idempotently,
  with the labels as HTML so they keep the type ramp at any card width.

## 2. Plates, the social card and icons from the engine

- **Plates** (hero, band, footer sky) come from the engine's sandbox, not from crops of the 9:16 film. Test the
  composition at 960x540 first:
  ```bash
  node tools/render.mjs sandbox earthsky --preset S31-newstar --params '{"horizonY":0.83,"fov":56}' \
      --times 3,8 --dur 9 --w 2400 --h 1350 --lb 0 --tag wide --out tmp/plates
  ```
  Render a tall 1080x1920 one too, each with and without the new star.
- **The 1200x630 social card**: `tools/site-og.mjs` renders it in Playwright with the site font and the plate
  inlined as base64 data URLs, after `await document.fonts.ready`.
- **Favicons**: `tools/site-icons.mjs` renders the logo SVG at 180, 32, 48 and 16 px and packs `favicon.ico` with PIL
  (`sizes=[(16, 16), (32, 32), (48, 48)]`).
- Wallpapers for download are native engine renders too (hd-master.md §7).

## 3. Checking the page: captures, the design gate, the finish reviewer, audits

**Captures.** `node tools/site-capture.mjs [--out tmp/site-caps] [--port 8765]` serves `site/nova` itself, with
byte ranges for the MP4, and captures at 1440x900, 768x1024 and 390x844, plus reduced motion:
- the opening at 250, 900, 1800, 3200 and 4600 ms;
- a scroll-through in 260 px steps (so reveal animations fire), then the full page, each section and the lightbox;
- a report of page errors, failed requests (status 400 or more), horizontal overflow (`scrollWidth > innerWidth`)
  and per-card overflow.

Treat any overflow or error as a blocker. Look at crops of anything odd before "fixing" it: a "stray gold mark" on
Nova was a descender cut by the capture edge.

**When the user supplies a design system** (Nova: an uploaded `cmo-design` zip, unpacked to the scratchpad),
follow its process: pin the brief, pin an exemplar, splice from its landing exemplar's fenced components, run its
gate, look, then a finish review.
```bash
python3 <ds>/scripts/design_review.py --selftest                                       # check its detectors first
python3 <ds>/scripts/design_review.py site/nova/index.html --tokens site/nova/assets/nova.css
```
Iterate until it prints `PASS: design gate clean (surface=landing, ...)`. Sanctioned NOTEs are fine.

**The finish-reviewer loop.**
1. Write a brief, `tmp/review/PRODUCT.md`: the user's words, the build path, the thesis, the page's own world, type
   and accent. Save the captures as PNG in `tmp/review/`.
2. Run a fresh-eyes subagent that adopts the system's `finish-reviewer.md` role, craft floor and house rules, edits
   nothing, and returns material fixes.
3. Apply them, recapture, then resume the **same** reviewer (SendMessage) for a verdict pass on the new captures:
   list what changed and ask it to verify from the captures and files, not from the list. Nova's verdict pass caught
   a real regression (sprite tiles stepping 30 px, so seams showed).
4. Run a two-lens audit workflow, one lens for accessibility, performance and mobile, one for copy truth against the
   film, with each finding adversarially verified before it counts.

The same panel-then-verifier shape as the film's judge panels (director-notes-loop.md §6).

## 4. Playing a 9:16 film on a page

- **Never `object-fit: cover` on the film.** It zoomed and cropped the film to fill a 16:9 screen in fullscreen,
  and trimmed its sides on phones where the frame's width was clamped. The director: "on full screen the video loses
  its aspect ratio". Keep the frame 9:16 at every width:
  ```css
  .film{--sh:min(86vh,940px)}
  .screen{width:min(calc(var(--sh)*9/16), calc(100vw - 32px)); aspect-ratio:9/16}
  .screen video{width:100%; height:100%; object-fit:contain; background:var(--nv-0)}
  .screen video:fullscreen, .screen video:-webkit-full-screen{object-fit:contain; background:var(--nv-0)}
  ```
- **Ambient light.** A tiny canvas (24x42) painted from the playing video every 180 ms (110 ms in the viewer), only
  while the section is on screen (IntersectionObserver), drawn blurred behind the frame: `filter: blur(60px)
  saturate(1.35)`, opacity .3 rising to .55 while playing, a radial mask. The director loved it, and preferred it to
  the browser's fullscreen: "Im also happy to have no full screen as I love the background blur".
- **A viewer instead of fullscreen.** `controlslist="nofullscreen"` on the video (only a hint, some browsers ignore
  it) plus a viewer button: "I want the viewer to be the blurred background".
  - The button calls `film.requestFullscreen || film.webkitRequestFullscreen` on the whole film **section**, so the
    light fills the screen around the film at full height.
  - Where elements can't go fullscreen, it falls back to a fixed layer:
    `.film.viewer{position:fixed; inset:0; --sh:calc(100dvh - 32px)}`, ambient blur 90px, scale 1.3.
  - On `fullscreenchange`, if `document.fullscreenElement === video` (the browser's own fullscreen on the bare
    video), exit it and open the viewer instead.
  - Esc (when not in native fullscreen), the same button or a double-click closes it. Respect reduced motion.
- **Sprite tiles**: set `background-position` in percent (`k/(n-1)*100% 0`), not pixels, so tiles stay whole when
  the tile size changes at a breakpoint.

## 5. A Downloadables section

When the director asks for free downloads:
- A third, outlined hero button, "Downloadables (Free)" (`btn line` with a download icon), linking to `#downloads`.
- Each card is an `<a download="nova-ep1-<name>-2160x4680.jpg">` around a 540x1170 thumbnail (`aspect-ratio:
  540/1170`, lazy, alt text naming the moment and its timecode), with the size in mono.
- Below the cards, the film MP4 as its own outlined button with a download file name.
- Grid: 5 columns, 3 at 1024 px or less, 2 at 640 px or less. Add the new grid to the reveal-stagger code
  (`classList.contains('dls')`).
- Run the gate and the captures again, and check that every download link resolves on a local server.

## 6. Publishing, and finding out what is live

`tools/publish-site.sh <branch> [message]` publishes `site/nova` as the **root** of its own orphan-history branch:
- a private index (`GIT_INDEX_FILE=$tmp git --work-tree=site/nova add -f -A .`, then `git write-tree`) leaves the
  working tree and the main index alone;
- it includes the git-ignored MP4 after checking it is under 99,000,000 bytes, so the film stays out of git on the
  working branch;
- it drops build inputs (`site-data.json`), skips the commit when the tree is unchanged, and pushes with retries.

**A push is not a deploy**, even when the user says "Pretty sure if you push it goes live". Check:
```bash
curl -sS -D - -o /dev/null https://<host>/ | grep -i -E 'server:|x-vercel'           # which host serves it
curl -sS https://api.github.com/repos/<o>/<r>/deployments                             # empty: no git integration
curl -sS https://api.github.com/repos/<o>/<r>/commits/<sha>/statuses                 # (and /check-runs)
curl -sS https://<host>/ -o /tmp/live.html; for c in $(git log --format=%h -10 -- site/nova/index.html); do
  git show $c:site/nova/index.html | cmp -s - /tmp/live.html && echo "live = $c"; done
curl -sS -r 0-0 -D - -o /dev/null https://<host>/assets/<film>.mp4 | grep -i content-range   # total size vs local files
```
A Vercel git integration creates deployments and commit statuses; all empty means none. On Nova, nova.tehbyn.com
was a direct Vercel upload (`server: Vercel`). The live page matched older commits byte for byte (`c69dd1c`, later
`186c2bd`; the video's `content-range: bytes 0-0/87420586`), while fixes pushed to both branches were not live. Tell
the user exactly which build is live, hand over the deploy-ready branch (or a zip), and say that pointing the Vercel
project at that branch would make each push go live. The proxy blocks the `/environments` API path.
