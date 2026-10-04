#!/usr/bin/env bash
# Freeze the plans of a delivered version as plans-vN/ and prove every frozen version still rebuilds byte for byte.
#
#   freeze-version.sh <N> [--builder 'node tools/build_plan.mjs'] [--glob 'film-plan*.json'] [--dry-run]
#   freeze-version.sh --check [--builder ...] [--glob ...]          only re-check the plans-v*/ already frozen
#
# The builder must honour two environment variables: PLAN_VERSION=<k> (which version to build) and PLAN_OUT=<dir>
# (where to write, given relative to the repository root). Freezing N:
#   1. builds version N into a temporary folder and compares it with the live plans (the --glob files at the root):
#      they must be identical, so what is frozen is exactly what the builder makes for N;
#   2. copies the live plans to plans-vN/ (or, if plans-vN/ exists, requires it to match);
#   3. rebuilds every plans-v*/ and compares each file byte for byte. Exit 1 on any difference.
# Then commit plans-vN/ and tag the commit the delivered pictures were rendered at: plans reproduce from any later
# commit, pictures only from code that renders them the same (gate later picture changes by plan params/presets).
#
# Provenance: new for the create-js-video skill; it automates the check the "Nova, Episode 1" project ran by hand
# (PLAN_VERSION=v PLAN_OUT=... node tools/build_plan.mjs, then cmp against plans-v2/, plans-v3/; ClaudeCloud, Oct 2026).
set -euo pipefail
N="" builder="node tools/build_plan.mjs" glob="film-plan*.json" dry=0 check=0
while [ $# -gt 0 ]; do
  case "$1" in
    --builder) builder="$2"; shift 2 ;;
    --glob) glob="$2"; shift 2 ;;
    --dry-run) dry=1; shift ;;
    --check) check=1; shift ;;
    -h|--help) sed -n '2,16p' "$0"; exit 0 ;;
    *) N="$1"; shift ;;
  esac
done
[ "$check" = 1 ] || [[ "$N" =~ ^[0-9]+$ ]] || { echo "usage: freeze-version.sh <N> | --check  [--builder CMD] [--glob GLOB] [--dry-run]" >&2; exit 2; }
cd "$(git rev-parse --show-toplevel)"
tmp=".freeze-check.$$"; trap 'rm -rf "$tmp"' EXIT
build() {   # build version $1 into $tmp/v$1
  mkdir -p "$tmp/v$1"
  PLAN_VERSION="$1" PLAN_OUT="$tmp/v$1" $builder > "$tmp/v$1.log" 2>&1 || { echo "builder failed for v$1:"; tail -5 "$tmp/v$1.log"; exit 1; }
}
same_set() {   # compare every file of dir $1 with its namesake in dir $2
  local ok=0 f
  for f in "$1"/$glob; do
    [ -e "$f" ] || { echo "  no $glob in $1"; return 1; }
    if cmp -s "$f" "$2/$(basename "$f")"; then echo "  same  $(basename "$f")"; else echo "  DIFF  $(basename "$f")"; ok=1; fi
  done
  return $ok
}
fail=0
if [ "$check" = 0 ]; then
  echo "v$N: builder output vs the live plans"
  build "$N"
  live=$(mktemp -d); trap 'rm -rf "$tmp" "$live"' EXIT
  cp $glob "$live"/
  same_set "$tmp/v$N" "$live" || { echo "the live plans are not what the builder makes for v$N: rebuild or fix PLAN_VERSION first"; exit 1; }
  if [ -d "plans-v$N" ]; then
    echo "plans-v$N/ exists: comparing"
    same_set "plans-v$N" "$live" || { echo "plans-v$N/ differs from the live plans: refusing to overwrite a frozen version"; exit 1; }
  elif [ "$dry" = 1 ]; then
    echo "would copy $(ls $glob | tr '\n' ' ')to plans-v$N/"
  else
    mkdir "plans-v$N"; cp $glob "plans-v$N"/; echo "froze $(ls "plans-v$N" | wc -l) plan(s) into plans-v$N/"
  fi
fi
for d in plans-v*/; do
  [ -d "$d" ] || continue
  k="${d#plans-v}"; k="${k%/}"
  [[ "$k" =~ ^[0-9]+$ ]] || continue
  echo "v$k: rebuild vs $d"
  build "$k"
  same_set "${d%/}" "$tmp/v$k" || fail=1
done
[ "$fail" = 0 ] && echo "every frozen version rebuilds byte for byte" || { echo "a frozen version no longer rebuilds: the builder changed behaviour for an old version"; exit 1; }
