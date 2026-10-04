# publish-downloads.sh

Publishes finished films on a standalone downloads branch. The branch's history holds only the films and a README.
The script builds the commit with git plumbing (`hash-object`, `mktree`, `commit-tree`, push), so the checkout and
the index are never touched.

```bash
$SKILL/scripts/publish-downloads.sh claude/my-film-downloads out/downloads/film-v4-1080x1920.mp4 --readme out/downloads/README.md \
    --trailer "Co-Authored-By: ..." --trailer "Claude-Session: ..."
$SKILL/scripts/publish-downloads.sh claude/my-film-downloads out/downloads/*.mp4 --dry-run
# files over 100 MB (a 4K master, a 1080 upload file) as 95,000,000-byte parts, 3 parts a push:
$SKILL/scripts/publish-downloads.sh claude/my-film-hd-downloads out/hd/film-2160x3840.mp4 out/hd/film-web-1080.mp4 \
    --split --readme out/hd/README.md --trailer "..." [--part-bytes 95000000] [--batch 3]
```

- It refuses any file of 99,000,000 bytes or more (`--max-bytes`), because GitHub rejects files over 100 MB. Make
  the file with `encode-copy.py --target github`, or pass `--split`.
- **`--split`** publishes each oversize file as decimal parts `<file>.part-00`, `-01`, ... of `--part-bytes`
  (default 95,000,000). Not `split -b 95m`: `m` means MiB, so its parts are 99,614,720 bytes and the guard refuses
  every one. With the parts it publishes:
  - `SHA256SUMS` of the **whole** files (split and unsplit), merged with one already on the branch, so the reader
    checks after joining;
  - `JOIN.md`: per split file, `cat f.part-* > f` and `shasum -a 256 -c SHA256SUMS --ignore-missing` for
    macOS/Linux, the exact `copy /b f.part-00+f.part-01+... f` and `certutil -hashfile f SHA256` for Windows, and
    `git clone --depth 1 --branch <branch> <repo>` to fetch everything at once. Sections of files published earlier
    are kept.
  - Parts go up `--batch` at a time (default 3, about 285 MB a push), each batch its own commit on top of the last.
    One push of over 1 GB through the agent proxy is risky; a failed batch leaves the earlier ones published, and
    the error names the last pushed commit. Small files and the README go in the first commit, `SHA256SUMS` and
    `JOIN.md` in the last.
  Keep one small file (the 1080 web copy under 95 MB) unsplit, for readers who won't join parts.
- The first publish creates an orphan branch. Later publishes stack on the remote tip and keep the files already
  there. A file with the same base name is replaced.
- It prints `https://github.com/<owner>/<repo>/raw/<branch>/<file>` for each whole file, and the branch's tree page
  for split ones.
- Commit trailers come from arguments, so pass the attribution lines your environment asks for. The original script
  hard-coded one session's trailers.
- GitHub releases are not an alternative in a Claude Code session: `gh api -X POST repos/<o>/<r>/releases` returns
  HTTP 403 ("Creating, editing, or deleting releases is not permitted for this session type"), and `gh release`
  fails because gh uses GraphQL, which is not available from these sessions.

Provenance: `tools/publish-downloads.sh` of the Nova project (Oct 2026). The generalised version adds the remote,
size guard, message, trailers, `--dry-run` and a check that the files exist. `--split` is new: Nova's 4K finisher
did the same by hand (`split -b 95000000 -d -a 2`, `sha256sum > SHA256SUMS`, a README, batches of 3 parts). Tested
in `--dry-run` against the real downloads branch and against the size guard; `--split` was tested end to end against
a local bare remote (a 2.5 MB file split at 900,000 bytes, batches of 2: three commits, parts joined with `cat`,
`sha256sum -c` OK, `cmp` identical; a second publish merged `SHA256SUMS` and kept the earlier `JOIN.md` sections).
The push path to GitHub is the original's.
