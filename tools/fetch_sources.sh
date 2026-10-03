#!/usr/bin/env bash
# Verify the committed soundtrack sources and fetch the analysis-only score reference.
set -euo pipefail
cd "$(dirname "$0")/.."
sha256sum -c - <<'SUMS'
fd3e3200c1342e4da55222d6004ffb74ae3ac851c516acf3160d7c79041c206e  media/source/winter-usaf-band.ogg
abdc5a4b0054fd3d535503d738757fd72d88fc5af9c5807a42b64c6aa75f02c5  media/source/1812-us-army-band-2005.ogg
SUMS
# Mutopia RV 297 MIDI (CC BY-SA 3.0) — analysis reference only, kept out of git (analysis/ref is ignored)
mkdir -p analysis/ref
if [ ! -f analysis/ref/mutopia-winter-score.mid ]; then
  tmp=$(mktemp -d)
  curl -sSL -o "$tmp/m.zip" "https://www.mutopiaproject.org/ftp/VivaldiA/O8/winter/winter-mids.zip"
  unzip -o -q "$tmp/m.zip" -d "$tmp"
  cp "$tmp/winter-score.mid" analysis/ref/mutopia-winter-score.mid
  rm -rf "$tmp"
fi
echo "sources ready"
