# restore-from-branches.py

Rebuilds `dist/<cut>/` render pieces from the branches helper sessions pushed to, and merges their block records.
Use it as the collector after a distributed render, and after a container restart wiped untracked `dist/`.

Copy it into the film repository's `tools/` with `watch-render.sh` (which calls it from its own folder) and commit
both.

```bash
node tools/chunk.mjs status --plan film-plan.json --json > out/want.json
python3 tools/restore-from-branches.py --branches 'claude/my-film-*' --fetch --want out/want.json --dry-run
python3 tools/restore-from-branches.py --branches 'claude/my-film-*' --fetch --want out/want.json --plan film-plan.json
python3 tools/restore-from-branches.py --branches 'claude/my-film-r*' --plan film-plan.json,film-plan-sol.json
node tools/chunk.mjs status --plan film-plan.json        # must end "N/N blocks final"
```

- Reads git objects (`ls-tree`, `cat-file`): no checkout; nothing outside the destination `dist/` folders changes.
- A record entry and its `.mp4` always come from the same source, so a fingerprint never describes another render.
- **`--want` or `--plan` is required.** Helper branches keep pieces of older block layouts; without the current grid
  they would be restored, never cleaned by `chunk.mjs render` (it cleans only current block names), and committed by
  the next `git add -A -f`. `--plan` computes each plan's current piece names (block size from `film.config.json`,
  else 240; `--block` overrides); `--want` knows them from `status --json`. Either skips the rest as obsolete, and
  without `--dirs` restricts the restore to the folders they cover. `--any-layout` restores everything.
- Choice per piece: the wanted fp (`--want`, local first, then the newest branch), else the newest of the local file
  (mtime) and the branch tips.
- Old single-file blocks (records without `pieces`) are ignored.
- Output lists every conflict (`(local)=fp, origin/...=fp -> pick`) and restores marked `(STALE: wanted ...)`.
- `--dest DIR` writes somewhere else (testing).

Provenance: generalised from the "Nova, Episode 1" session's ad-hoc `restore.py` (Oct 2026). That version kept an
existing local `.mp4` while merging another branch's record entry, which can pair a picture with the wrong
fingerprint; this one pairs them and can prefer the wanted fingerprint. Tested against the Nova helper branches
(51 branches, 91 pieces, dry run and a real restore into a scratch root: restored files byte-identical). Without
`--want`, a dry run used to restore `dist/*-916-v4/chunk_03840_03917.03840_03917.mp4` (a v3 block) for a 4025-frame
film; with `--plan` for the three v4 plans it skips them as obsolete, and with neither option it refuses to run.
