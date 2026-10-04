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
  the next `git add -A -f`. `--plan` computes each plan's current piece names with the block size `chunk.mjs`
  uses: `plan.block`, else `film.config.json`, else 240 (`--block` overrides). Before it read `plan.block`, a dry run
  on Nova's 72-frame 4K plan skipped all 111 pieces as obsolete unless `--block 72` was passed, and `watch-render.sh`
  passes no `--block`. `--want` knows the piece names from `status --json`. Either skips the rest as obsolete, and
  without `--dirs` restricts the restore to the folders they cover. `--any-layout` restores everything.
- Choice per piece: the wanted fp (`--want`, local first, then the newest branch), else the newest of the local file
  (mtime) and the branch tips.
- **`--fetch` and globs.** A git refspec takes at most one `*` and no `?` or `[...]`. Plain globs
  (`claude/my-film-h*`) go to `git fetch` as refspecs. Any other glob (`claude/my-film-hd[0-9]*`, `...-h?`) is
  matched with fnmatch against `git ls-remote --heads <remote>`, and the hits are fetched by exact name. A
  comma-separated list of exact names also works. The prefix plus `*` would fetch unrelated branches that share the
  prefix (Nova's `-hd*` also matches the multi-GB `-hd-downloads` branch). If a fetch still fails after 3 tries
  (2 s and 4 s apart), the script exits 1 (`error: fetch from origin failed ...`) and `watch-render.sh` stops with
  `FAIL restore`. A glob that matches no remote branch yet is only a warning, because helpers may not have pushed.
- Old single-file blocks (records without `pieces`) are ignored.
- Output lists every conflict (`(local)=fp, origin/...=fp -> pick`) and restores marked `(STALE: wanted ...)`.
- `--dest DIR` writes somewhere else (testing).

Provenance: generalised from the "Nova, Episode 1" session's ad-hoc `restore.py` (Oct 2026). That version kept an
existing local `.mp4` while merging another branch's record entry, which can pair a picture with the wrong
fingerprint; this one pairs them and can prefer the wanted fingerprint. Tested against the Nova helper branches
(51 branches, 91 pieces, dry run and a real restore into a scratch root: restored files byte-identical). Without
`--want`, a dry run used to restore `dist/*-916-v4/chunk_03840_03917.03840_03917.mp4` (a v3 block) for a 4025-frame
film; with `--plan` for the three v4 plans it skips them as obsolete, and with neither option it refuses to run.

The fetch fix comes from Nova's 4K master. The finisher passed `--branches '...-hd[0-9]*'`. Git rejected that as
an invalid refspec, and the old script only printed a warning. Every 2-minute loop then restored 0 pieces from the
2 branches fetched earlier by hand, and the finisher sat at "HD 2/56 blocks final" while all 14 helper branches were
on origin. Tested after the fix with `--dest <scratch> --dry-run` and `--plan film-plan-4k.json --block 72`:
- `hd[0-9]*` found 14 branches and 104 pieces;
- `hd?` found 9 branches;
- the plain glob `hd1*` found 6 branches;
- a glob with no remote match gave a warning and exit 0;
- an unreachable remote gave exit 1 on both the refspec path and the ls-remote path.
