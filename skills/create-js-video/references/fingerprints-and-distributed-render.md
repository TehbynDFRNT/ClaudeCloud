# Fingerprints and distributed render

How to re-render only what changed, split a final render across parallel helper sessions, collect their work, and
keep it safe when the container resets. Tools: `scripts/pipeline/` (fingerprint, render, chunk),
`scripts/helper-prompts.py`, `scripts/restore-from-branches.py`, `scripts/watch-render.sh`.

## Contents
1. Content fingerprints: what they cover
2. Consequences you plan around
3. The frame cache
4. Blocks, pieces and records
5. status, render, assemble
6. Twins: frames shared between cuts and versions
7. Helper sessions: the procedure
8. Helper-session lessons
9. Collecting: restore, status, watch
10. Surviving a container reset
11. Command reference

## 1. Content fingerprints: what they cover

`fingerprint(f, W, H)` = sha1 of a JSON object, truncated to 16 hex characters:

| Key | What it hashes |
|---|---|
| `engine` | `src/main.js`, `src/index.html`, every file in `src/engine/` and `src/fonts/` |
| `grid` | `analysis/grid.json` (the bar grid) |
| `global` | the plan's `fps, width, height, format, defaultPost` |
| `W, H` | render size |
| `shot` | the shot entry minus `purpose, action, framing, note` |
| `scene` | `src/scenes/<scene>.js` + every relative `import`/`export ... from` it pulls in, recursively, + every file under `media/scenes/<scene>/` |
| `others` | the partner shot (and its scene hash) of an active dissolve or bleed |
| `trs, effects, text` | the transitions, effects and text items active on frame `f` (same windows as the engine) |

## 2. Consequences you plan around

- **An engine or font change invalidates everything**: every frame of every cut and every version. The same goes for
  a `main.js` or `index.html` edit, a grid refit, or a change to the plan's global fields. Late in a project, put
  new work in a new scene module or in plan params instead.
- **New scenes are free.** `src/scenes/index.js` is not hashed. Registering a new scene invalidates nothing (Nova's
  sign-off was added this way).
- **The unit of invalidation is a scene's whole module tree.** One edit to any `lib/studies-*.js` drawing stales
  every studies shot in every cut and version, and also the dissolve partner of a studies shot. To localise a change:
  - give the affected shots their own scene id or module;
  - or route the change through `preset`/`params`, which are per shot.
- **Descriptive fields are free, but only on shots.** Edit a shot's `purpose/action/framing/note` without
  re-rendering anything. Prose inside the hashed global fields is not free: `format` and `defaultPost` go into every
  frame's `global` key, so editing Nova's `format.note` ("9:16. A 3:4 window ...") would re-render every frame of
  every cut. Keep notes out of `format` and `defaultPost`; put them on shots or in a top-level field the fingerprint
  doesn't read.
- **Hazards the hash cannot see:**
  - anything a scene reads from `E.plan` outside its own shot (`plan.version`, `plan.id`, `plan.cut`);
  - files fetched from outside `media/scenes/<id>/`;
  - assets that silently fail to load.

  Never gate pixels on `plan.version` inside a scene. If a scene must read a plan field, add it to
  `film.config.json` `planFieldsInGlobal`.
- **A piece can be byte-identical under a new fingerprint.** For example, a module edit that does not change a
  drawing still gives it a new fingerprint. Re-rendering then reproduces the same bytes. That is not an error.

## 3. The frame cache

`render.mjs film` keeps `out/frames-WxH/NNNNN.jpg` plus `manifest.json[f] = fingerprint rendered under`. A frame is
skipped when its file exists and its manifest entry equals the current fingerprint. New frames go to `*.tmp.jpg` and
are renamed atomically. The manifest is rewritten after every frame, and `render-log.jsonl` records
`{ f, shot, scene, ms, fp }`, which is the cost data for planning helpers.

The cache is keyed by **frame index**: the fingerprint has no `f` in it, so it is not content-addressed. Two cuts
rendered into the same folder overwrite each other's differing frames, and two renders into one folder at once race.
Give concurrent renders their own `--frames` folder.

## 4. Blocks, pieces and records

- **Blocks** are fixed, 240 frames (10 s at 24 fps), aligned to frame 0. They never move when shots move.
- **Pieces.** A block splits at every shot boundary inside it: `chunk_AAAAA_BBBBB.PPPPP_QQQQQ.mp4`. Each piece is
  encoded on its own from a keyframe with the final settings (`libx264 -preset slow -crf 17 -tune grain -pix_fmt
  yuv420p -profile:v high -level 4.1 -x264-params keyint=48:min-keyint=24:scenecut=40`). Pieces therefore
  concatenate with `-c copy`, and the frame count is checked with `ffprobe -count_frames`.
- **Records.** `dist/<plan.id>/chunk_AAAAA_BBBBB.json` = `{ from, to, crf, pieces: [{ from, to, fp, scene }] }`. A
  piece's `fp` is the sha1 of its frames' fingerprints as rendered, read from the manifest. If a source changed while
  the piece was rendering, the piece is recorded stale and redone.
- Piece files whose shot boundaries moved are deleted by the next `render` of that block.

## 5. status, render, assemble

- `status` reports each block as final, partial, stale or missing, listing every non-final piece as
  `from-to:scene:state`. `status --json` adds each piece's wanted and recorded fp (input to `restore --want`).
- `render --from A --to B` takes A as a multiple of 240 and B as a multiple of 240 or the film end. Options:
  - `--only-scenes statue` renders only those scenes' pieces; the record lists only what this machine wrote.
  - `--skip-scenes statue` renders everything else first.
  - `--push` commits each finished block (`git add -A -f`, because `dist/` is git-ignored) and pushes HEAD to its
    namesake on origin, with 5 tries. Without `--push` nothing is committed.
- `assemble`:
  - refuses missing pieces, and stale pieces unless `--allow-stale` is given;
  - `--placeholders statue` turns unfinished statue pieces into labelled grey cards in an `*-interim.mp4` (an early
    cut while finals render);
  - stream-copies the pieces and muxes AAC 512k with `-aac_coder fast` (the decoded true peak stays at the mix's;
    320k with the default coder overshot it by 1-2 dB);
  - fails on a silent or missing soundtrack (volumedetect mean below -40 dB);
  - runs `verify_video.py`: size, fps, frame count, codecs, audio present, a full decode with `-xerror`.

  It does **not** measure loudness or true peak: run the audio delivery check on the muxed file (audio.md).

## 6. Twins: frames shared between cuts and versions

Before rendering a piece, `render` looks in every other `dist/*/` folder for the same piece name with the same fp
and copies it. This is how three cuts cost little more than one, and how v3 reused v2's frames up to the explosion.
To keep twins plentiful, put cut and version differences in a few presets, and keep the shot boundaries of shared
material where they were.

## 7. Helper sessions: the procedure

1. Commit and push everything the render needs. Helpers clone from the remote.
2. Measure costs: `chunk.mjs costs` (one full-size frame per shot) or existing `render-log.jsonl` files.
3. Generate prompts:
   ```bash
   node tools/chunk.mjs status --plan film-plan.json --json > out/status.json
   python3 scripts/helper-prompts.py --plan film-plan.json --parts 6 --log 'out/frames-*/render-log.jsonl' \
       --scene-cost statue=1400 --status-json out/status.json --json > out/helpers.json
   ```
4. Start each helper with `create_session` (load it with ToolSearch if deferred), passing:
   - `source_url`: the repository;
   - `source_revision`: the full 40-character SHA;
   - `outcome_branch`: `<base>-<tag>`;
   - `prompt`: the generated prompt.

   A helper starts in the calling session's environment (`create_session` inherits it). Its prompt runs `npm ci`
   when `node_modules` is missing. Leave `permission_mode` out so the helper inherits your mode (it can't be more
   permissive than yours). The helper has to run Bash unattended: if your session prompts before Bash, so will the
   helper, and nobody will answer. Never pass `plan`, which blocks until someone approves a plan.
5. Watch: `tools/watch-render.sh --branches '<base>-h*' --plan film-plan.json` under the Monitor tool. When it says
   REARM, start it again.
6. Verify, and only then assemble: `status` must report every block final, with no stale pieces.

## 8. Helper-session lessons

- **Pass the full commit SHA.** Short SHAs failed with `ref_not_found`.
- **A helper only follows its initial prompt.** You cannot redirect it. If the plan changes, interrupt and archive
  the helpers whose work became moot, then start new ones with new prompts.
- **Fresh outcome branches.** Reusing an existing branch name means the push is rejected, because the branch has
  other history.
- **Git-ignored output needs `git add -f`.** `chunk.mjs --push` does this.
- **Balance by the costly frames, not by frame count.** Statue frames cost about 1.4 s each, studies 0.7-1 s, and
  cosmic shots vary. Partition the block grid by measured cost. Where one scene dominates, give it its own helpers
  with `--only-scenes`, and render the rest elsewhere with `--skip-scenes`.
- **Helpers are fast.** A fresh helper container is warm and has the CPU to itself: 6 helpers turned about 25 minutes
  of statue frames into about 4. Parallelise early; don't wait on the local machine.
- **Count stale pieces as well as missing ones** when deciding whether helpers are done. A helper that started from
  an older commit renders stale pieces.
- **Run the render in the background.** A range is 25-30 minutes of work and a foreground command is cut off at
  10 minutes. The generated prompt starts it as
  `nohup sh -c '<render command>; echo "RENDER exit=$?"' > out/render-<tag>.log 2>&1 &`, has the helper check
  `tail -n 3` of the log every few minutes (or watch it with Monitor), says that its own tool timeouts are not
  failures, and re-runs the same command (it resumes) until `status` shows the range final, at most 3 runs. An
  earlier prompt ran it in the foreground with "if a command fails, run it once more, then stop": taken literally,
  that is two timeouts and an unfinished range you can't redirect.
- **Keep the prompt short and literal**: commands, the checkout check, the rules, and "stop and report" on any
  surprise.

## 9. Collecting: restore, status, watch

`restore-from-branches.py` reads each helper branch's `dist/` straight from git objects. It merges the block records
by `(from, to)` and writes each chosen `.mp4` together with its own record entry. With `--want` (from
`status --json`) it prefers the render whose fp the current sources want. It requires `--want` or `--plan`: helper
branches keep pieces of older block layouts (a v3 `chunk_03840_03917` beside a v4 film whose last block is
`03840_04025`), and without the current grid those would come back, survive `render` (it cleans only current block
names) and be committed by the next `git add -A -f`. Both options skip them as obsolete, and without `--dirs` they
restrict the restore to the folders of the plans they cover. Run `status` afterwards. A stale piece after a restore
means no helper rendered it under the current sources: render it again.

`--fetch` and branch globs: a git refspec takes at most one `*` and no `?` or `[...]`.
- Plain globs (`'<base>-h*'`) are passed to git as refspecs.
- Other globs (`'<base>-hd[0-9]*'`) are resolved with `git ls-remote --heads` plus fnmatch and fetched by exact
  name. A comma list of exact names also works.
- A failed fetch is an error (exit 1), so the watcher stops with `FAIL restore` instead of quietly restoring
  nothing.

On Nova's 4K master the old script only warned about the invalid refspec `hd[0-9]*`. The finisher then reported
"2/56 blocks final" for 20 minutes while all 14 helper branches were on origin. If a collector's count stops moving,
compare `git ls-remote origin 'refs/heads/<base>-*'` with `git branch -r`.

`watch-render.sh` loops fetch → restore (with `--plan` and, when the status tool supports `--json`, `--want`) →
status, and exits `DONE`, `FAIL ...` or `REARM`. Give the Monitor a filter that matches failures as well as success.
It runs `restore-from-branches.py` from its own folder: copy both into `tools/` and commit them.

## 10. Surviving a container reset

The session container can restart from an old snapshot. When it does, untracked files are gone: frame caches, dist
pieces, masters, mixes, review builds, scratchpad scripts.
- Push every rendered piece to a branch as it finishes (`--push`), on helpers and locally. Locally, render from a
  worktree on a dedicated `<base>-local` branch (`git worktree add ../render-local -b <base>-local`, then `npm ci`
  there): `--push` commits about 1 GB per cut and version to whatever branch is checked out.
- Keep every tool and script in the repository, committed (`tools/`). A tool that exists only in a scratchpad, or
  only in the skill folder, is lost on reset or missing on a helper.
- After a reset: `chunk.mjs status --json > out/want.json`, then
  `restore-from-branches.py --branches '<base>-*' --fetch --want out/want.json --plan film-plan.json`, then
  `status`; re-render only what is missing or stale, re-render the mix (`render-audio.mjs`, about 3 minutes for
  Nova), and re-assemble.
- Publish finished films on the downloads branch as soon as they pass the checks, before doing anything else.

## 11. Command reference

```bash
node tools/fingerprint.mjs film-plan.json 0 2144            # fingerprints of chosen frames
node tools/chunk.mjs costs --plan film-plan.json            # -> out/costs.json
node tools/chunk.mjs plan --plan film-plan.json --parts 6 [--pending]
node tools/chunk.mjs status --plan film-plan.json [--json]
node tools/chunk.mjs render --plan film-plan.json --from 2640 --to 3360 [--only-scenes statue] [--push]
node tools/chunk.mjs assemble --plan film-plan.json --audio out/audio-v4/mix.wav [--placeholders statue]
python3 tools/restore-from-branches.py --branches 'claude/film-*' --fetch --want out/status.json --plan film-plan.json
tools/watch-render.sh --branches 'claude/film-h*' --plan film-plan.json
```
