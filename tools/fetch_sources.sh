#!/usr/bin/env bash
# Fetch the soundtrack (if missing) and the analysis-only score reference.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p media/source analysis/ref
if [ ! -f media/source/winter-mvt1-milman.flac ]; then
  curl -sSL -o media/source/winter-mvt1-milman.flac \
    "https://archive.org/download/lud-and-schlatts-musical-emporium/PMM-Vivaldi-Winter-MASTER_V1.flac"
fi
echo "23ac2a6e955dad40c36d3ed0e911f9ac05ae037d7086db2de276507573209a03  media/source/winter-mvt1-milman.flac" | sha256sum -c -
# Mutopia RV 297 MIDI (CC BY-SA 3.0) — analysis reference only, kept out of git (analysis/ref is ignored)
if [ ! -f analysis/ref/mutopia-winter-score.mid ]; then
  tmp=$(mktemp -d)
  curl -sSL -o "$tmp/m.zip" "https://www.mutopiaproject.org/ftp/VivaldiA/O8/winter/winter-mids.zip"
  unzip -o -q "$tmp/m.zip" -d "$tmp"
  cp "$tmp/winter-score.mid" analysis/ref/mutopia-winter-score.mid
  rm -rf "$tmp"
fi
echo "sources ready"
