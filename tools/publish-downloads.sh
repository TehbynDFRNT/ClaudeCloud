#!/bin/bash
# Publish finished film files on a standalone downloads branch (its own history: the films and a README only).
#   tools/publish-downloads.sh <branch> <file.mp4>... [--readme README.md]
# Each file must be under GitHub's 100 MB limit (1080x1920 at ~4 Mbps is ~88 MB for 2:45). The branch is built with
# git plumbing (hash-object, mktree, commit-tree) from the files named on the command line, so a file still being
# encoded is never published, and the working tree and index are not touched. Files already on the branch stay;
# the files given are added or replace their namesakes.
set -e
cd "$(git rev-parse --show-toplevel)"
B="$1"; shift
readme=""; files=()
while [ $# -gt 0 ]; do
  if [ "$1" = "--readme" ]; then readme="$2"; shift 2; else files+=("$1"); shift; fi
done
[ -n "$B" ] && [ ${#files[@]} -gt 0 ] || { echo "usage: $0 <branch> <file>... [--readme README.md]" >&2; exit 2; }
parent=$(git ls-remote origin "refs/heads/$B" | cut -f1)
declare -A E
if [ -n "$parent" ]; then
  git fetch -q origin "$B"
  while IFS= read -r line; do E["${line#*	}"]="$line"; done < <(git ls-tree "$parent")
fi
for f in "${files[@]}" ${readme:+"$readme"}; do
  sz=$(stat -c %s "$f")
  [ "$sz" -lt 99000000 ] || { echo "$f is $sz bytes: over GitHub's 100 MB file limit" >&2; exit 1; }
  h=$(git hash-object -w "$f")
  name=$(basename "$f"); [ "$f" = "$readme" ] && name=README.md
  E["$name"]="100644 blob $h	$name"
done
tree=$(for k in "${!E[@]}"; do printf "%s\n" "${E[$k]}"; done | git mktree)
msg="Downloads: $(for f in "${files[@]}"; do basename "$f"; done | tr '\n' ' ')

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016WT5HJoRqv4SsaBdm3L53R"
if [ -n "$parent" ]; then c=$(git commit-tree "$tree" -p "$parent" -m "$msg"); else c=$(git commit-tree "$tree" -m "$msg"); fi
for k in 1 2 3 4 5; do git push -q origin "$c:refs/heads/$B" && break; sleep $((2 ** k)); done
git ls-remote origin "refs/heads/$B"
