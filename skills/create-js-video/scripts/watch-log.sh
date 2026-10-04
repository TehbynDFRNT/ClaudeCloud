#!/usr/bin/env bash
# Wait on a log file until it shows success or failure, printing the lines that matter. Made for the Monitor tool:
# the filter matches failures as well as success, so a crashed job never looks like a job still running.
#
#   watch-log.sh <logfile> [--done REGEX] [--fail REGEX] [--ignore REGEX] [--show REGEX] [--max-minutes 28] [--pid PID]
#
#   --done    success pattern (default: 'ALL DONE'). End a chain of steps with `echo "ALL DONE"` (or pass the last
#             step's own line, e.g. --done 'VERIFY exit=0'): a pattern like 'exit=0' or 'wrote ' would fire on the
#             FIRST step that finishes, while the rest of the chain is still running
#   --fail    failure pattern (default: 'FAIL|Error|error:|Traceback|exit=[1-9]|Killed|ENOSPC')
#   --ignore  lines never treated as done or fail (default: '^\[page\] ', the page console warnings render.mjs
#             copies into its log; they are not fatal)
#   --show    progress lines to pass through (default: lines with a fraction like 12/40 or 'eta')
#   --pid     also fail if this process disappears without a done line (a job that died silently)
# Exit: 0 after a done line, 1 after a fail line (or the pid vanished), 3 'REARM' at --max-minutes (Monitors stop
# after 30 min: start a new watcher, do not assume the job finished).
#
# Provenance: new for the create-js-video skill, from the "Nova, Episode 1" lessons (watchers whose filter matched
# only success sat silent on a crashed render; `pkill -f <pattern>` killed the watcher's own shell, so stop jobs by
# PID). Never edit this file while a copy of it is running.
set -u
log="${1:-}"; shift || true
done_re='ALL DONE' fail_re='FAIL|Error|error:|Traceback|exit=[1-9]|Killed|ENOSPC' ignore_re='^\[page\] ' show_re='[0-9]+/[0-9]+|eta' maxmin=28 pid=""
while [ $# -gt 0 ]; do
  case "$1" in
    --done) done_re="$2"; shift 2 ;;
    --fail) fail_re="$2"; shift 2 ;;
    --ignore) ignore_re="$2"; shift 2 ;;
    --show) show_re="$2"; shift 2 ;;
    --max-minutes) maxmin="$2"; shift 2 ;;
    --pid) pid="$2"; shift 2 ;;
    *) echo "FAIL unknown argument $1"; exit 1 ;;
  esac
done
[ -n "$log" ] || { echo "usage: watch-log.sh <logfile> [--done RE] [--fail RE] [--ignore RE] [--show RE] [--max-minutes N] [--pid PID]"; exit 1; }
start=$(date +%s) seen=0 last_show=0
while true; do
  if [ -f "$log" ]; then
    n=$(wc -l < "$log")
    if [ "$n" -gt "$seen" ]; then
      while IFS= read -r line; do
        if [ -n "$ignore_re" ] && printf '%s\n' "$line" | grep -qE -- "$ignore_re"; then continue; fi
        if printf '%s\n' "$line" | grep -qE -- "$fail_re"; then echo "FAIL $line"; exit 1; fi
        if printf '%s\n' "$line" | grep -qE -- "$done_re"; then echo "DONE $line"; exit 0; fi
        # progress: at most one line a minute
        if printf '%s\n' "$line" | grep -qE -- "$show_re" && [ $(( $(date +%s) - last_show )) -ge 60 ]; then echo "$line"; last_show=$(date +%s); fi
      done < <(sed -n "$((seen + 1)),${n}p" "$log")
      seen=$n
    fi
  fi
  if [ -n "$pid" ] && ! kill -0 "$pid" 2> /dev/null; then echo "FAIL process $pid ended without a done line"; exit 1; fi
  if [ $(( $(date +%s) - start )) -ge $(( maxmin * 60 )) ]; then echo "REARM still running (no done or fail line yet)"; exit 3; fi
  sleep 10
done
