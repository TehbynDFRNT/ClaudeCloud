#!/usr/bin/env bash
# Publish finished films on a standalone downloads branch (its own history: the films and a README only), built
# with git plumbing so the index and the working tree are never touched and a half-written file is never published.
#
#   publish-downloads.sh <branch> <file>... [--readme README.md] [--remote origin] [--max-bytes 99000000]
#                        [--split [--part-bytes 95000000] [--batch 3]]
#                        [--message "Downloads: ..."] [--trailer "Co-Authored-By: ..."]... [--dry-run]
#
# - Each file must be under GitHub's 100 MB per-file limit (default guard 99,000,000 bytes): 1080x1920 H.264 at
#   about 4 Mbps is about 88 MB for 2:45 (encode-copy.py --target github makes one).
# - --split: a file at or over the guard (a 4K master, a 1080 upload file) is split into DECIMAL parts of
#   --part-bytes (default 95,000,000; `split -b 95m` would make 99,614,720-byte MiB parts, over the guard) named
#   <file>.part-00, -01, ... A SHA256SUMS of the WHOLE files (checked after joining; merged with one already on the
#   branch) and a JOIN.md with the join commands for macOS/Linux and Windows are published with the last batch.
#   Parts go up --batch at a time (default 3, about 285 MB a push), each batch its own commit stacked on the last:
#   one push of over 1 GB through an agent proxy is risky. Small files and the README go in the first commit.
#   Needs GNU split and sha256sum (or shasum).
# - The first publish creates the branch with no parent (an orphan: nothing else of the repo is on it). Later
#   publishes stack on the remote tip and keep the files already there; the files given are added or replace
#   their namesakes (by base name).
# - Pass the session's commit attribution lines with --trailer (one per line), as the environment asks for commits.
# - Download link afterwards: https://github.com/<owner>/<repo>/raw/<branch>/<file> (or the blob page).
#
# Provenance: tools/publish-downloads.sh of the "Nova, Episode 1" project (ClaudeCloud repo, Oct 2026),
# generalised: remote, size guard, message and trailers are arguments (the original hard-coded one session's
# trailers), --dry-run, and a check that every file exists before anything is hashed. --split is new: Nova's 4K
# deliverables (over 100 MB, and GitHub releases are refused in a Claude Code session: HTTP 403) went up as parts
# with checksums and a README, in batches of 3.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
B="${1:-}"; [ $# -gt 0 ] && shift
readme="" remote="origin" max=99000000 msg="" dry=0 split=0 partb=95000000 batch=3 files=() trailers=()
while [ $# -gt 0 ]; do
  case "$1" in
    --readme) readme="$2"; shift 2 ;;
    --remote) remote="$2"; shift 2 ;;
    --max-bytes) max="$2"; shift 2 ;;
    --split) split=1; shift ;;
    --part-bytes) partb="$2"; shift 2 ;;
    --batch) batch="$2"; shift 2 ;;
    --message) msg="$2"; shift 2 ;;
    --trailer) trailers+=("$2"); shift 2 ;;
    --dry-run) dry=1; shift ;;
    *) files+=("$1"); shift ;;
  esac
done
[ -n "$B" ] && [ ${#files[@]} -gt 0 ] || { echo "usage: $0 <branch> <file>... [--readme README.md] [--remote origin] [--max-bytes N] [--split [--part-bytes N] [--batch N]] [--message M] [--trailer T]... [--dry-run]" >&2; exit 2; }
[ "$partb" -lt "$max" ] || { echo "--part-bytes $partb must be under the $max-byte guard" >&2; exit 2; }
[ "$batch" -ge 1 ] || { echo "--batch must be at least 1" >&2; exit 2; }
size() { stat -c %s "$1" 2> /dev/null || stat -f %z "$1"; }
sha256() { if command -v sha256sum > /dev/null; then sha256sum "$1" | cut -d' ' -f1; else shasum -a 256 "$1" | cut -d' ' -f1; fi; }
small=() big=()
for f in "${files[@]}" ${readme:+"$readme"}; do
  [ -f "$f" ] || { echo "$f: no such file" >&2; exit 1; }
  sz=$(size "$f")
  if [ "$sz" -lt "$max" ]; then [ "$f" = "$readme" ] || small+=("$f"); continue; fi
  [ "$split" = 1 ] && [ "$f" != "$readme" ] || { echo "$f is $sz bytes: over the $max-byte guard (GitHub refuses files over 100 MB; --split publishes it as parts)" >&2; exit 1; }
  big+=("$f")
done
parent=$(git ls-remote "$remote" "refs/heads/$B" | cut -f1)
declare -A E
if [ -n "$parent" ]; then
  git fetch -q "$remote" "refs/heads/$B"
  while IFS= read -r line; do E["${line#*	}"]="$line"; done < <(git ls-tree "$parent")
fi
put() {   # put <file> [<name on the branch>]
  local h; if [ "$dry" = 1 ]; then h=$(git hash-object "$1"); else h=$(git hash-object -w "$1"); fi
  E["${2:-$(basename "$1")}"]="100644 blob $h	${2:-$(basename "$1")}"
}
url=$(git remote get-url "$remote" 2> /dev/null | sed -E 's#\.git$##; s#.*[/:]([^/:]+/[^/:]+)$#\1#')   # owner/repo
commit_push() {   # commit_push <message>: commit the current tree on the branch tip and push it (5 tries)
  local tree c m="$1" ok=0
  tree=$(for k in "${!E[@]}"; do printf "%s\n" "${E[$k]}"; done | git mktree)
  if [ ${#trailers[@]} -gt 0 ]; then m="$m"$'\n'; for t in "${trailers[@]}"; do m="$m"$'\n'"$t"; done; fi
  if [ -n "$parent" ]; then c=$(git commit-tree "$tree" -p "$parent" -m "$m"); else c=$(git commit-tree "$tree" -m "$m"); fi
  for k in 1 2 3 4 5; do if git push -q "$remote" "$c:refs/heads/$B"; then ok=1; break; fi; sleep $((2 ** k)); done
  [ "$ok" = 1 ] || { echo "push to $remote/$B failed (published so far: ${parent:-nothing})" >&2; exit 1; }
  parent=$c
  echo "pushed $c: ${1%%$'\n'*}"
}
for f in ${small[@]+"${small[@]}"}; do put "$f"; done
[ -n "$readme" ] && put "$readme" README.md
[ -n "$msg" ] || msg="Downloads: $(for f in "${files[@]}"; do basename "$f"; done | tr '\n' ' ')"
if [ ${#big[@]} -eq 0 ]; then
  if [ "$dry" = 1 ]; then
    echo "would publish to $remote/$B (${parent:-new orphan branch}):"
    for k in "${!E[@]}"; do echo "  $k"; done
    exit 0
  fi
  commit_push "$msg"
else
  # split the big files into decimal parts; checksums are of the whole files, so they are checked after joining
  work=$(mktemp -d); trap 'rm -rf "$work"' EXIT
  sums="$work/SHA256SUMS" join="$work/JOIN.md" parts=()
  if [ -n "$parent" ] && git cat-file -e "$parent:SHA256SUMS" 2> /dev/null; then git cat-file blob "$parent:SHA256SUMS" > "$sums"; else : > "$sums"; fi
  {
    echo "# Joining the parts"
    echo
    echo "Files over GitHub's 100 MB limit are split into ${partb}-byte parts (\`<file>.part-00\`, \`-01\`, ...)."
    echo "Download every part of a file into one folder with \`SHA256SUMS\`, then join and check:"
    echo
    echo "Everything at once: \`git clone --depth 1 --branch $B https://github.com/$url.git\`"
  } > "$join"
  # keep the join sections of files published earlier (a section per file: '## <name> (...)'), minus the re-published
  if [ -n "$parent" ] && git cat-file -e "$parent:JOIN.md" 2> /dev/null; then
    git cat-file blob "$parent:JOIN.md" | awk -v skip="$(for f in "${big[@]}"; do basename "$f"; done)" \
      'BEGIN { n = split(skip, a, "\n"); for (i = 1; i <= n; i++) s[a[i]] = 1 }
       /^## / { sec = 1; keep = !($2 in s); if (keep) print "" } sec && keep && NF { print } sec && keep && !NF { print }' \
      | cat -s >> "$join"
  fi
  for f in "${big[@]}" ${small[@]+"${small[@]}"}; do
    n=$(basename "$f")
    { grep -v "  $n\$" "$sums" || true; printf '%s  %s\n' "$(sha256 "$f")" "$n"; } > "$sums.new"; mv "$sums.new" "$sums"
  done
  for f in "${big[@]}"; do
    n=$(basename "$f") sz=$(size "$f")
    count=$(( (sz + partb - 1) / partb ))
    if [ "$dry" = 1 ]; then
      for ((i = 0; i < count; i++)); do parts+=("$(printf '%s.part-%02d' "$n" "$i")"); done
    else
      split -b "$partb" -d -a 2 "$f" "$work/$n.part-"
      for p in "$work/$n".part-*; do parts+=("$(basename "$p")"); done
    fi
    win=$(for ((i = 0; i < count; i++)); do printf '%s.part-%02d+' "$n" "$i"; done); win=${win%+}
    {
      echo
      echo "## $n ($sz bytes, $count parts)"
      echo
      echo "macOS / Linux:"
      echo
      echo "    cat $n.part-* > $n"
      echo "    shasum -a 256 -c SHA256SUMS --ignore-missing"
      echo
      echo "Windows (Command Prompt), then compare with SHA256SUMS:"
      echo
      echo "    copy /b $win $n"
      echo "    certutil -hashfile $n SHA256"
    } >> "$join"
  done
  if [ "$dry" = 1 ]; then
    echo "would publish to $remote/$B (${parent:-new orphan branch}): ${#small[@]} file(s)${readme:+ + README.md}, then ${#parts[@]} part(s) in batches of $batch, SHA256SUMS and JOIN.md with the last batch:"
    for k in "${!E[@]}"; do echo "  $k"; done
    for p in ${parts[@]+"${parts[@]}"}; do echo "  $p"; done
    echo "  SHA256SUMS"; sed 's/^/    /' "$sums"
    echo "  JOIN.md"
    exit 0
  fi
  if [ ${#small[@]} -gt 0 ] || [ -n "$readme" ]; then commit_push "$msg"; fi
  total=${#parts[@]}
  for ((i = 0; i < total; i += batch)); do
    for p in "${parts[@]:i:batch}"; do put "$work/$p"; rm -f "$work/$p"; done
    last=$(( i + batch >= total ? 1 : 0 ))
    if [ "$last" = 1 ]; then put "$sums" SHA256SUMS; put "$join" JOIN.md; fi
    commit_push "$msg (parts $((i + 1))-$(( i + batch < total ? i + batch : total )) of $total)"
  done
fi
git ls-remote "$remote" "refs/heads/$B"
for f in ${small[@]+"${small[@]}"}; do echo "https://github.com/$url/raw/$B/$(basename "$f")"; done
for f in ${big[@]+"${big[@]}"}; do echo "https://github.com/$url/tree/$B (parts of $(basename "$f"); see JOIN.md)"; done
