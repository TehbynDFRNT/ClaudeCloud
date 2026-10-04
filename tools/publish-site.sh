#!/bin/bash
# Publish site/nova as a deployable static site at the root of its own branch (its own history: the site only).
#   tools/publish-site.sh <branch> [message]
# The tree is built from site/nova with a private index (git --work-tree), so the working tree and the main
# index are not touched. The film (assets/*.mp4, git-ignored on the working branch) is included: it is under
# GitHub's 100 MB file limit. Build inputs (site-data.json) stay out.
set -e
cd "$(git rev-parse --show-toplevel)"
B="$1"; MSG="${2:-Site: nova.tehbyn.com}"
[ -n "$B" ] || { echo "usage: $0 <branch> [message]" >&2; exit 2; }
for f in site/nova/assets/*.mp4; do
  sz=$(stat -c %s "$f"); [ "$sz" -lt 99000000 ] || { echo "$f is $sz bytes: over GitHub's 100 MB file limit" >&2; exit 1; }
done
IDX=$(mktemp); rm -f "$IDX"
GIT_INDEX_FILE="$IDX" git --work-tree=site/nova add -f -A .
GIT_INDEX_FILE="$IDX" git rm -q --cached --ignore-unmatch site-data.json
tree=$(GIT_INDEX_FILE="$IDX" git write-tree); rm -f "$IDX"
parent=$(git ls-remote origin "refs/heads/$B" | cut -f1)
[ -n "$parent" ] && git fetch -q origin "$B"
if [ -n "$parent" ] && [ "$(git rev-parse "$parent^{tree}")" = "$tree" ]; then echo "unchanged: $B $parent"; exit 0; fi
msg="$MSG

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016WT5HJoRqv4SsaBdm3L53R"
if [ -n "$parent" ]; then c=$(git commit-tree "$tree" -p "$parent" -m "$msg"); else c=$(git commit-tree "$tree" -m "$msg"); fi
for k in 1 2 3 4 5; do git push -q origin "$c:refs/heads/$B" && break; sleep $((2 ** k)); done
git ls-remote origin "refs/heads/$B"
git ls-tree -r --name-only "$c" | sed 's/^/  /' | head -60
