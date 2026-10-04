# Delivery: from pieces to files the director can open

What "delivered" meant on Nova: a verified master per cut, a review copy that fits a chat attachment, a 1080p
download on a GitHub branch, and an Edit Room build, all sent as download cards, with early cuts while the finals
rendered. The director's existing skill covers the generic final handoff (`review.md`); this file has the
concrete pipeline and limits.

## Contents
1. The order of operations
2. The master
3. Size-capped copies
4. Publishing downloads on a branch
5. Sending files
6. Early cuts, and re-rendering only the chosen version
7. When the network blocks a site
8. The delivery message

## 1. The order of operations

```bash
node tools/chunk.mjs status --plan film-plan.json                         # every block final, no stale
node tools/chunk.mjs assemble --plan film-plan.json --audio out/audio-v4/mix.wav   # master + structural verify
node tools/render-audio.mjs --plan film-plan.json --ref out/audio-v4/mix.wav --verify dist/david-916-v4.mp4
python3 scripts/contact-sheet.py dist/david-916-v4.mp4 --plan film-plan.json --out out/sheets/final.jpg   # look at it
python3 scripts/encode-copy.py dist/david-916-v4.mp4 out/review/david-v4-chat.mp4 --target chat
python3 scripts/encode-copy.py dist/david-916-v4.mp4 out/downloads/nova-david-v4-1080x1920.mp4 --target github
scripts/publish-downloads.sh <branch>-downloads out/downloads/nova-david-v4-1080x1920.mp4 --readme out/downloads/README.md
node tools/build-review.mjs --cuts ... --videos ... --label "Render N"    # Edit Room, then publish it
```
Chain the long steps in one background script that writes a status line after each step, stops at the first
failure, and ends with one unique line. Watch for that line, not for `exit=0` or `wrote`: those match the first
step that finishes, and a watcher on them reported DONE while verify had not run.
```bash
cat > out/deliver.sh <<'EOF'
step() { n=$1; shift; echo "$n start"; "$@"; rc=$?; echo "$n exit=$rc"; [ $rc = 0 ] || { echo "CHAIN FAIL at $n"; exit $rc; }; }
step ASSEMBLE node tools/chunk.mjs assemble --plan film-plan.json --audio out/audio-v4/mix.wav
step SOUND node tools/render-audio.mjs --plan film-plan.json --ref out/audio-v4/mix.wav --verify dist/david-916-v4.mp4
step SHEET python3 scripts/contact-sheet.py dist/david-916-v4.mp4 --plan film-plan.json --out out/sheets/final.jpg
echo "ALL DONE"
EOF
nohup bash out/deliver.sh > out/deliver.log 2>&1 &
scripts/watch-log.sh out/deliver.log --pid $!          # default --done 'ALL DONE'; fails on 'exit=[1-9]', 'FAIL', ...
```
Don't edit that script while it runs.

## 2. The master

- Stream-copied pieces with AAC 512k `-aac_coder fast`, 48 kHz stereo, `-t frames/fps`, `+faststart`, and title and
  comment metadata. The comment carries the music and sample credits ("Music: Vivaldi, L'inverno I, The United States
  Air Force Band. ... Picture and sound design rendered in code.").
- `verify_video.py` (structural, shipped in `scripts/pipeline/` with the `validate_plan.py` it imports): size, fps,
  frame count by decoding, codecs, pixel format, audio present, start near 0, full decode with `-xerror`. It writes
  `<file>.verify.json`. `assemble` runs it and fails when it is missing or fails.
- `render-audio.mjs --verify` (sound): loudness, true peak, climax, coda, sync (audio.md §7).
- Then **look at it**: a contact sheet of the encoded file, the cut boundaries, and the standing rules (no hands, no
  flashes) checked on every cut.
- Masters are big: crf 17 with grain tuning on noisy HDR imagery ran at about 45 Mbps (Nova's 2:47.7 master: 944 MB).
  The master is never the file you send or push. It is the source for the copies below.

## 3. Size-capped copies

| Destination | Cap | Settings | Nova (2:45-2:48) |
|---|---|---|---|
| chat attachment | **30 MiB** | 720×1280, H.264 crf 23, maxrate 1700k (bufsize 2×), AAC 192k | about 27 MiB |
| GitHub file | **100 MB** (guard 99,000,000 bytes) | 1080×1920, crf 19, maxrate 4000k, the master's AAC copied | about 88-90 MB |
| artifact hosting | 15 MB per file | 10 s clips (review-edit-room.md) | |

`scripts/encode-copy.py --target chat|github` applies these settings, keeps within the cap for longer films, and
checks frames, decode, size and decoded true peak. A re-encoded AAC track can overshoot the master's peak. Copying the
master's 512k track avoids that where the size allows.

## 4. Publishing downloads on a branch

`scripts/publish-downloads.sh <branch> <files> [--readme README.md] [--trailer ...]`:
- An orphan branch (its own history: films and a README only), built with `hash-object`, `mktree`, `commit-tree` and
  a push. It never touches the index or the working tree, and a file still being encoded is never picked up.
- Later publishes keep the files already there. Name files by film, cut, version and size
  (`nova-david-v4-1080x1920.mp4`), so a new version never replaces a delivered one.
- The README lists each file with its length, size, version and what changed.
- Link: `https://github.com/<owner>/<repo>/raw/<branch>/<file>`.

## 5. Sending files

- Send deliverables with `SendUserFile`, `display: 'attach'` (download cards): the director wants files he can save,
  not inline previews. Use `status: 'proactive'` when he is away.
- Send the chat-size copy, not the master: chat attachments over 30 MiB fail.
- Publish the Edit Room as an Artifact. Its link is the review surface; the files are the deliverables.

## 6. Early cuts, and re-rendering only the chosen version

- While finals render, send something watchable: an interim assembly with labelled placeholders for the slow scene
  (`assemble --placeholders statue` → `*-interim.mp4`), or a preview cut (`--preview`, half size). Label it as
  interim.
- When the director picks a version or a cut, re-render and deliver **only that one**. Don't spend helper time on
  the others unless he asks.
- Each version gets its own plan id and `dist/` folder, so finishing v5 never disturbs the delivered v4.

## 7. When the network blocks a site

The session container's network can refuse a host that the WebFetch tool can still reach, and WebFetch saves binary
responses to a file. Nova got the director's signature SVG from his site this way. Record where every fetched asset
came from.

## 8. The delivery message

Short lines, facts first:
- what is attached (file, cut, version, length, size);
- what was verified, and how (structural verify, sound verify, contact sheet looked at);
- what changed since the last version, in his words where they were his notes;
- anything not verified, said plainly ("signal-derived, not checked by listening");
- the download link and the Edit Room link.
