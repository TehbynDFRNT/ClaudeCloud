# publish-downloads.sh

Publishes finished films on a standalone downloads branch. The branch's history holds only the films and a README.
The script builds the commit with git plumbing (`hash-object`, `mktree`, `commit-tree`, push), so the checkout and
the index are never touched.

```bash
scripts/publish-downloads.sh claude/my-film-downloads out/downloads/film-v4-1080x1920.mp4 --readme out/downloads/README.md \
    --trailer "Co-Authored-By: ..." --trailer "Claude-Session: ..."
scripts/publish-downloads.sh claude/my-film-downloads out/downloads/*.mp4 --dry-run
```

- It refuses any file of 99,000,000 bytes or more (`--max-bytes`), because GitHub rejects files over 100 MB. Make
  the file with `encode-copy.py --target github`.
- The first publish creates an orphan branch. Later publishes stack on the remote tip and keep the files already
  there. A file with the same base name is replaced.
- It prints `https://github.com/<owner>/<repo>/raw/<branch>/<file>` for each file.
- Commit trailers come from arguments, so pass the attribution lines your environment asks for. The original script
  hard-coded one session's trailers.

Provenance: `tools/publish-downloads.sh` of the Nova project (Oct 2026). The generalised version adds the remote,
size guard, message, trailers, `--dry-run` and a check that the files exist. Tested in `--dry-run` against the real
downloads branch and against the size guard. The push path is the original's.
