# nova.tehbyn.com

The one-page site for Nova, Episode 1: David & Goliath. Static files, no build step: serve this folder as the
site root (index.html at the root).

- `index.html`: the page. `assets/nova.css` and `assets/nova.js`: its style and behaviour.
- `assets/nova-ep1-david-goliath.mp4`: the film, 1080 x 1920, H.264 and AAC, fast-start. Any static host
  serves it with range requests, so it streams and seeks.
- `assets/fonts/`: Inter Tight and JetBrains Mono, self-hosted (SIL Open Font License, licences beside them).
- `assets/plate-*.jpg`: the hero, band and footer sky, rendered by the film's own engine (wide and tall, with
  and without the new star). `assets/stills/`, `assets/story/`, `turn.jpg`, `pieces.jpg`, `poster.jpg`: frames
  cut from the finished film.
- `assets/og.jpg`: the 1200 x 630 social card.

To swap the film, replace the MP4 under the same name and, if the picture changed, rebuild the frames from the
repository (`python3 tools/site-assets.py && python3 tools/site-build.py`).
