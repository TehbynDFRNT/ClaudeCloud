#!/usr/bin/env bash
# Collector loop for a distributed render: every INTERVAL seconds, fetch the helper branches, restore their pieces
# into dist/ (restore-from-branches.py), run the status command, and count the pieces still missing OR stale. Prints
# one line only when that line changes, so it can run under the Monitor tool (each printed line is an event).
#
#   watch-render.sh --branches 'claude/my-film-r*' --plan film-plan.json [--dirs dist/my-film-v2]
#                   [--status 'node tools/chunk.mjs status --plan film-plan.json'] [--interval 60] [--max-minutes 28]
#
# Exit codes and last lines (match ALL of them in a Monitor filter, not just success):
#   0  DONE <summary>                    nothing missing or stale
#   1  FAIL <reason>                     restore or status failed (the reason is printed)
#   3  REARM <n> left                    --max-minutes reached: start the watcher again (Monitors die after 30 min)
#
# Provenance: generalised from watch-sd.sh of the "Nova, Episode 1" project (ClaudeCloud session scratchpad,
# Oct 2026), which counted only one scene's pieces and never stopped on its own before the Monitor did.
# Never edit this file while a copy of it is running: bash reads scripts incrementally and the run goes wrong.
set -u
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
branches="" plan="film-plan.json" dirs="" status="" interval=60 maxmin=28 want=1
while [ $# -gt 0 ]; do
  case "$1" in
    --branches) branches="$2"; shift 2 ;;
    --plan) plan="$2"; shift 2 ;;
    --dirs) dirs="$2"; shift 2 ;;
    --status) status="$2"; shift 2 ;;
    --interval) interval="$2"; shift 2 ;;
    --max-minutes) maxmin="$2"; shift 2 ;;
    --no-want) want=0; shift ;;
    -h|--help) sed -n '2,16p' "$0"; exit 0 ;;
    *) echo "FAIL unknown argument $1"; exit 1 ;;
  esac
done
[ -n "$branches" ] || { echo "FAIL --branches is required"; exit 1; }
cd "$(git rev-parse --show-toplevel)" || { echo "FAIL not in a git repository"; exit 1; }
[ -n "$status" ] || status="node tools/chunk.mjs status --plan $plan"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
start=$(date +%s) prev=""
while true; do
  # the wanted fingerprints (status --json) let the restore pick the right render when helpers disagree
  wantarg=()
  if [ "$want" = 1 ] && $status --json > "$tmp/want.json" 2> "$tmp/want.err" \
     && python3 -c 'import json,sys; json.load(open(sys.argv[1]))["blocks"]' "$tmp/want.json" 2> /dev/null; then
    wantarg=(--want "$tmp/want.json")   # a status tool without --json support is simply not used for this
  fi
  if ! python3 "$HERE/restore-from-branches.py" --branches "$branches" --fetch ${dirs:+--dirs "$dirs"} ${wantarg[@]+"${wantarg[@]}"} > "$tmp/restore.log" 2>&1; then
    echo "FAIL restore: $(tail -2 "$tmp/restore.log" | tr '\n' ' ')"; exit 1
  fi
  if ! $status > "$tmp/status.txt" 2>&1; then
    echo "FAIL status: $(tail -2 "$tmp/status.txt" | tr '\n' ' ')"; exit 1
  fi
  missing=$(grep -oE '[0-9]+-[0-9]+:[A-Za-z0-9_.-]+:missing' "$tmp/status.txt" | wc -l)
  stale=$(grep -oE '[0-9]+-[0-9]+:[A-Za-z0-9_.-]+:stale' "$tmp/status.txt" | wc -l)
  line="missing $missing, stale $stale; $(tail -1 "$tmp/status.txt"); $(tail -1 "$tmp/restore.log")"
  if [ "$line" != "$prev" ]; then echo "$(date -u +%H:%M:%S) $line"; prev="$line"; fi
  if [ "$missing" = 0 ] && [ "$stale" = 0 ]; then echo "DONE $(tail -1 "$tmp/status.txt")"; exit 0; fi
  if [ $(( $(date +%s) - start )) -ge $(( maxmin * 60 )) ]; then echo "REARM $((missing + stale)) left"; exit 3; fi
  sleep "$interval"
done
