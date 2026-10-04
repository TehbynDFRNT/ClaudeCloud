#!/usr/bin/env bash
# Publish finished films on a standalone downloads branch (its own history: the films and a README only), built
# with git plumbing so the index and the working tree are never touched and a half-written file is never published.
#
#   publish-downloads.sh <branch> <file>... [--readme README.md] [--remote origin] [--max-bytes 99000000]
#                        [--message "Downloads: ..."] [--trailer "Co-Authored-By: ..."]... [--dry-run]
#
# - Each file must be under GitHub's 100 MB per-file limit (default guard 99,000,000 bytes): 1080x1920 H.264 at
#   about 4 Mbps is about 88 MB for 2:45 (encode-copy.py --target github makes one).
# - The first publish creates the branch with no parent (an orphan: nothing else of the repo is on it). Later
#   publishes stack on the remote tip and keep the files already there; the files given are added or replace
#   their namesakes (by base name).
# - Pass the session's commit attribution lines with --trailer (one per line), as the environment asks for commits.
# - Download link afterwards: https://github.com/<owner>/<repo>/raw/<branch>/<file> (or the blob page).
#
# Provenance: tools/publish-downloads.sh of the "Nova, Episode 1" project (ClaudeCloud repo, Oct 2026),
# generalised: remote, size guard, message and trailers are arguments (the original hard-coded one session's
# trailers), --dry-run, and a check that every file exists before anything is hashed.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
B="${1:-}"; [ $# -gt 0 ] && shift
readme="" remote="origin" max=99000000 msg="" dry=0 files=() trailers=()
while [ $# -gt 0 ]; do
  case "$1" in
    --readme) readme="$2"; shift 2 ;;
    --remote) remote="$2"; shift 2 ;;
    --max-bytes) max="$2"; shift 2 ;;
    --message) msg="$2"; shift 2 ;;
    --trailer) trailers+=("$2"); shift 2 ;;
    --dry-run) dry=1; shift ;;
    *) files+=("$1"); shift ;;
  esac
done
[ -n "$B" ] && [ ${#files[@]} -gt 0 ] || { echo "usage: $0 <branch> <file>... [--readme README.md] [--remote origin] [--max-bytes N] [--message M] [--trailer T]... [--dry-run]" >&2; exit 2; }
for f in "${files[@]}" ${readme:+"$readme"}; do
  [ -f "$f" ] || { echo "$f: no such file" >&2; exit 1; }
  sz=$(stat -c %s "$f" 2> /dev/null || stat -f %z "$f")
  [ "$sz" -lt "$max" ] || { echo "$f is $sz bytes: over the $max-byte guard (GitHub refuses files over 100 MB)" >&2; exit 1; }
done
parent=$(git ls-remote "$remote" "refs/heads/$B" | cut -f1)
declare -A E
if [ -n "$parent" ]; then
  git fetch -q "$remote" "refs/heads/$B"
  while IFS= read -r line; do E["${line#*	}"]="$line"; done < <(git ls-tree "$parent")
fi
for f in "${files[@]}" ${readme:+"$readme"}; do
  name=$(basename "$f"); [ -n "$readme" ] && [ "$f" = "$readme" ] && name=README.md
  if [ "$dry" = 1 ]; then h=$(git hash-object "$f"); else h=$(git hash-object -w "$f"); fi
  E["$name"]="100644 blob $h	$name"
done
if [ "$dry" = 1 ]; then
  echo "would publish to $remote/$B (${parent:-new orphan branch}):"
  for k in "${!E[@]}"; do echo "  $k"; done
  exit 0
fi
tree=$(for k in "${!E[@]}"; do printf "%s\n" "${E[$k]}"; done | git mktree)
[ -n "$msg" ] || msg="Downloads: $(for f in "${files[@]}"; do basename "$f"; done | tr '\n' ' ')"
if [ ${#trailers[@]} -gt 0 ]; then msg="$msg"$'\n'; for t in "${trailers[@]}"; do msg="$msg"$'\n'"$t"; done; fi
if [ -n "$parent" ]; then c=$(git commit-tree "$tree" -p "$parent" -m "$msg"); else c=$(git commit-tree "$tree" -m "$msg"); fi
ok=0
for k in 1 2 3 4 5; do if git push -q "$remote" "$c:refs/heads/$B"; then ok=1; break; fi; sleep $((2 ** k)); done
[ "$ok" = 1 ] || { echo "push to $remote/$B failed" >&2; exit 1; }
git ls-remote "$remote" "refs/heads/$B"
url=$(git remote get-url "$remote" 2> /dev/null | sed -E 's#\.git$##; s#.*[/:]([^/:]+/[^/:]+)$#\1#')   # owner/repo
for f in "${files[@]}"; do echo "https://github.com/$url/raw/$B/$(basename "$f")"; done
