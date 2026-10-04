# contact-sheet.py

Makes frame-accurate contact sheets of an encoded video, the file the director actually sees, with ffmpeg. Each
still is labelled with its frame number, `MM:SS:FF` timecode and, with a plan, its shot id. Look at the sheet with
the Read tool.

```bash
python3 scripts/contact-sheet.py dist/film-v4.mp4 --plan film-plan.json --out out/sheets/shots.jpg      # one per shot
python3 scripts/contact-sheet.py dist/film-v4.mp4 --plan film-plan.json --at cuts --out out/sheets/cuts.jpg
python3 scripts/contact-sheet.py dist/film-v4.mp4 --frames 2140,2141,2142,2143 --width 360 --cols 4     # motion strip
python3 scripts/contact-sheet.py dist/film-v4.mp4 --count 36 --cols 9
python3 scripts/contact-sheet.py dist/film-v5.mp4 --before dist/film-v4.mp4 --frames 2030,2040,2144 --cols 6   # before/after
```

- `--at cuts` gives the last frame of each shot and the first frame of the next shot, which checks every cut
  boundary. Add `--shots a,b` to narrow it to a few shots.
- `--shots` takes exact ids or prefixes (`S10` matches `S10-prometheus`). An id that matches no shot stops the
  script with the list of ids, so a standing-rules audit can't skip a shot quietly. (It used to drop unknown ids and
  write a smaller sheet without a word.)
- Each still comes from an accurate seek to `(f - 0.25) / fps`, so the label names the frame you see.
- The script needs only ffmpeg and ffprobe. It finds a DejaVu font, or a font through `fc-match`. Without a font the
  stills come out unlabelled.
- `--before OTHER.mp4` makes a before/after sheet: each frame twice, side by side, labelled `before` (the other file)
  and `after` (this one). `--cols` counts stills, so keep it even.

Provenance: new for the skill. Nova made its sheets inside the renderer from source (`render.mjs sheet`). Tested on
the delivered Nova v4 file (cut boundaries, a three-frame strip, `--shots F29.1,F30.3,S10` giving 3 frames, an
unknown id refused) and on the starter's clip (`--before`).
