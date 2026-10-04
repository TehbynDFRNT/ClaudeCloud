# Nova Edit Room (localhost)

- David & Goliath · v2
- Sol Invictus · v2
- Prometheus · v2
- David & Goliath · v3
- Sol Invictus · v3
- Prometheus · v3

## Run it
1. You need Node 18 or newer (https://nodejs.org). Check with `node -v`.
2. In this folder run:

       node serve.mjs

   On a Mac you can instead double-click **Start Edit Room.command**. The first time, right-click it and choose Open.
3. It opens http://localhost:4321/ in your browser. If that port is busy it takes the next free one. Ctrl+C stops it.

## Notes
- Click the paused picture to pin a note on it. Notes save straight away to **notes.json** in this folder.
- **notes.md** is a readable copy, grouped by cut and ordered by time.
- Each note records the cut, the frame, the timecode, the shot, where the pin sits on the picture, and its text.
- To hand notes back, commit and push `notes.json` (or paste `notes.md`).

Render 3 · Render 3 · finals · built 2026-10-04 from commit b84b9b6.
