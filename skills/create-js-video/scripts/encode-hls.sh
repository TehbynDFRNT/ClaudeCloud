#!/usr/bin/env bash
# Package a finished master as an HLS stream for the website: one ffmpeg pass that splits the picture into several
# sizes (720p / 1080p / 2160p by default), two audio renditions (the stereo mix as default, the binaural mix for
# headphones), 4 s fMP4 segments, a master playlist with the renditions named for the player's pickers, a structure
# check, then hls-bandwidth.py so BANDWIDTH is the measured peak rather than ffmpeg's target rate.
#
#   encode-hls.sh --in dist/film-2160x3840.mp4 --stereo out/audio/mix.wav [--binaural out/audio-binaural/mix.wav]
#                 --plan film-plan.json --out site/<film>/assets/hls
#                 [--sizes 720x1280,1080x1920,2160x3840] [--rates 2000k:3000k,5000k:7500k,12000k:18000k]
#                 [--levels 4.0,4.2,5.1] [--codec h264|vp9] [--preset medium] [--segment 4] [--audio-bitrate 256k]
#                 [--names 'Stereo,Binaural (headphones)'] [--max-segment-mb 50] [--tolerance 0.6]
#                 [--bandwidth path/to/hls-bandwidth.py]
#
# - The length is the plan's frames / fps, passed as -t to every output. Never -shortest: a mix a few ms longer
#   than the picture would otherwise end the film early, and a shorter one would freeze its last frame.
# - --sizes are WIDTHxHEIGHT in ascending order; a size equal to the source is passed through unscaled, the others
#   are Lanczos-scaled from the master in the same pass. Each variant's folder is named by its SHORT side
#   (720p, 1080p, 2160p): a vertical film's level.height is 1920, and the player keys its quality list the same way.
# - --rates are bitrate:maxrate per size (bufsize is twice the maxrate). Without --rates a size takes the bucket of
#   its short side: up to 720 -> 2000k:3000k, up to 1080 -> 5000k:7500k, larger -> 12000k:18000k (Nova's values).
#   --levels are the H.264 levels per size (default by the same buckets: 4.0, 4.2, 5.1); ignored for vp9.
# - The GOP is one segment (segment seconds x fps, 96 frames for 4 s at 24), closed, with scene cuts off, so every
#   segment starts on its own keyframe (independent segments) and quality switches land on segment edges.
# - Audio: AAC 256k (vp9: Opus) at 48 kHz; both renditions in one group so a quality switch keeps the sound.
#   ffmpeg names them audio_0 and audio_1; the script renames them to --names (what the sound picker shows) and
#   marks them English. Without --binaural there is one rendition.
# - The check (python3): the expected number of audio renditions with the expected names, the RESOLUTION list in
#   order, every listed segment and init file present and non-empty, no segment at or over --max-segment-mb, and
#   every rendition's playlist within --tolerance seconds of the plan's length. Then hls-bandwidth.py rewrites
#   BANDWIDTH and AVERAGE-BANDWIDTH from the segments (beside this script, or tools/hls-bandwidth.py, or --bandwidth).
# - --out is emptied first, but only when it is empty or already holds a master.m3u8.
# Prints "ENC HLS <MB> MB, <n> qualities x <m> sounds" on success, "FAIL <step>" and exits 1 otherwise.
#
# Provenance: step 3b of the Nova finisher (Oct 2026): 2160x3840 master, 3 qualities x 2 sounds, 42 segments
# each, 368 MB, served by Vercel to hls.js. The structure check and the bandwidth rewrite ran there as separate
# steps; here they are part of the encode.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
in="" stereo="" binaural="" plan="" out="" sizes="720x1280,1080x1920,2160x3840" rates="" levels="" codec="h264"
preset="medium" segment=4 abr="256k" names="Stereo,Binaural (headphones)" maxmb=50 tol=0.6 bw=""
while [ $# -gt 0 ]; do
  case "$1" in
    --in) in="$2"; shift 2 ;;
    --stereo) stereo="$2"; shift 2 ;;
    --binaural) binaural="$2"; shift 2 ;;
    --plan) plan="$2"; shift 2 ;;
    --out) out="$2"; shift 2 ;;
    --sizes) sizes="$2"; shift 2 ;;
    --rates) rates="$2"; shift 2 ;;
    --levels) levels="$2"; shift 2 ;;
    --codec) codec="$2"; shift 2 ;;
    --preset) preset="$2"; shift 2 ;;
    --segment) segment="$2"; shift 2 ;;
    --audio-bitrate) abr="$2"; shift 2 ;;
    --names) names="$2"; shift 2 ;;
    --max-segment-mb) maxmb="$2"; shift 2 ;;
    --tolerance) tol="$2"; shift 2 ;;
    --bandwidth) bw="$2"; shift 2 ;;
    -h|--help) sed -n '2,36p' "$0"; exit 0 ;;
    *) echo "FAIL unknown argument $1"; exit 1 ;;
  esac
done
fail() { echo "FAIL $*"; exit 1; }
[ -n "$in" ] && [ -n "$stereo" ] && [ -n "$plan" ] && [ -n "$out" ] || fail "usage: --in <master.mp4> --stereo <mix.wav> [--binaural <mix.wav>] --plan <plan.json> --out <dir>"
for f in "$in" "$stereo" ${binaural:+"$binaural"} "$plan"; do [ -f "$f" ] || fail "$f: no such file"; done
case "$codec" in h264|vp9) ;; *) fail "--codec must be h264 or vp9" ;; esac
[ -n "$bw" ] || { for c in "$HERE/hls-bandwidth.py" tools/hls-bandwidth.py; do [ -f "$c" ] && { bw="$c"; break; }; done; }
[ -n "$bw" ] && [ -f "$bw" ] || fail "hls-bandwidth.py not found (beside this script or in tools/): pass --bandwidth"

# the film's length and frame rate from the plan: fps may be a number or a "24/1" string
read -r DUR FPS < <(python3 - "$plan" <<'PY'
import json, sys
p = json.load(open(sys.argv[1]))
f = p['fps']; fps = (lambda n, d=1: n / d)(*map(float, str(f).split('/')))
print(f"{p['frames'] / fps:.3f} {fps:g}")
PY
) || fail "plan: could not read frames and fps from $plan"
G=$(python3 -c "print(round($segment * $FPS))")
read -r SW SH < <(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=' ' "$in") || fail "ffprobe $in"

IFS=',' read -r -a SZ <<< "$sizes"
IFS=',' read -r -a RT <<< "${rates:-}"
IFS=',' read -r -a LV <<< "${levels:-}"
n=${#SZ[@]}
[ "$n" -ge 1 ] || fail "--sizes is empty"
bucket() {   # bucket <short side> -> "bitrate:maxrate level"
  if [ "$1" -le 720 ]; then echo "2000k:3000k 4.0"; elif [ "$1" -le 1080 ]; then echo "5000k:7500k 4.2"; else echo "12000k:18000k 5.1"; fi
}
to_bits() { local v="${1,,}"; case "$v" in *k) echo $(( ${v%k} * 1000 )) ;; *m) echo $(( ${v%m} * 1000000 )) ;; *) echo "$v" ;; esac; }

# the audio inputs and renditions
A_IN=(-i "$stereo"); A_MAP=(-map 1:a); A_SM="a:0,agroup:aud,name:stereo,default:yes"; nA=1; VIDX=2
if [ -n "$binaural" ]; then A_IN+=(-i "$binaural"); A_MAP+=(-map 2:a); A_SM="$A_SM a:1,agroup:aud,name:binaural"; nA=2; VIDX=3; fi

# the picture: one split, one scale per size, folder names by the short side
FC="[0:v]split=$n"; for ((i = 0; i < n; i++)); do FC="$FC[s$i]"; done; FC="$FC;"
V_MAP=() V_OPT=() V_SM="" FOLDERS=()
for ((i = 0; i < n; i++)); do
  w=${SZ[$i]%x*}; h=${SZ[$i]#*x}; short=$(( w < h ? w : h )); FOLDERS+=("${short}p")
  if [ "$w" = "$SW" ] && [ "$h" = "$SH" ]; then FC="$FC[s$i]null[v$i];"; else FC="$FC[s$i]scale=$w:$h:flags=lanczos[v$i];"; fi
  read -r rate level <<< "$(bucket "$short")"
  [ -n "${RT[$i]:-}" ] && rate="${RT[$i]}"
  [ -n "${LV[$i]:-}" ] && level="${LV[$i]}"
  b=${rate%%:*}; mx=${rate#*:}; buf=$(( $(to_bits "$mx") * 2 ))
  V_MAP+=(-map "[v$i]")
  V_OPT+=("-b:v:$i" "$b" "-maxrate:v:$i" "$mx" "-bufsize:v:$i" "$buf")
  [ "$codec" = h264 ] && V_OPT+=("-level:v:$i" "$level")
  V_SM="$V_SM v:$i,agroup:aud,name:${short}p"
done
FC="${FC%;}"
COL=(-color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv)
if [ "$codec" = h264 ]; then
  VC=(-c:v libx264 -preset "$preset" -pix_fmt yuv420p -profile:v high -g "$G" -keyint_min "$G" -sc_threshold 0)
  AC=(-c:a aac -aac_coder fast -b:a "$abr" -ar 48000)
else
  VC=(-c:v libvpx-vp9 -pix_fmt yuv420p -g "$G" -keyint_min "$G" -row-mt 1 -deadline good -cpu-used 4)
  AC=(-c:a libopus -b:a "$abr" -ar 48000)
fi

# the output folder: only ever empty one that is empty or an HLS folder already
if [ -d "$out" ] && [ -n "$(ls -A "$out")" ] && [ ! -f "$out/master.m3u8" ]; then fail "$out is not empty and holds no master.m3u8: refusing to empty it"; fi
rm -rf "$out"; mkdir -p "$out" || fail "mkdir $out"

ffmpeg -v error -y -i "$in" "${A_IN[@]}" -filter_complex "$FC" "${A_MAP[@]}" "${V_MAP[@]}" "${AC[@]}" "${VC[@]}" "${COL[@]}" "${V_OPT[@]}" -t "$DUR" \
  -f hls -hls_time "$segment" -hls_playlist_type vod -hls_segment_type fmp4 -hls_flags independent_segments -hls_fmp4_init_filename init.mp4 \
  -master_pl_name master.m3u8 -hls_segment_filename "$out/%v/seg_%03d.m4s" -var_stream_map "$A_SM$V_SM" "$out/%v/index.m3u8" || fail "enc HLS (ffmpeg)"

# name the sound renditions for the picker (ffmpeg calls them audio_0, audio_1)
IFS=',' read -r -a NM <<< "$names"
n0="${NM[0]:-Stereo}"; n1="${NM[1]:-Binaural (headphones)}"
sed -i "s/NAME=\"audio_0\"/NAME=\"$n0\",LANGUAGE=\"en\"/; s/NAME=\"audio_1\"/NAME=\"$n1\",LANGUAGE=\"en\"/" "$out/master.m3u8" || fail "rename renditions"

# the structure check
python3 - "$out" "$nA" "$n0" "$n1" "$sizes" "$DUR" "$maxmb" "$tol" "${FOLDERS[*]}" <<'PY' || fail "HLS check"
import os, re, sys
H, nA, n0, n1, sizes, dur, maxmb, tol, folders = sys.argv[1:]
nA, dur, maxmb, tol = int(nA), float(dur), float(maxmb), float(tol)
m = open(f'{H}/master.m3u8').read()
assert m.count('TYPE=AUDIO') == nA, f'{m.count("TYPE=AUDIO")} audio renditions, expected {nA}'
assert f'NAME="{n0}"' in m, f'rendition {n0!r} missing'
assert nA < 2 or f'NAME="{n1}"' in m, f'rendition {n1!r} missing'
res = re.findall(r'RESOLUTION=(\d+x\d+)', m); assert res == sizes.split(','), f'resolutions {res}, expected {sizes}'
rend = (['stereo', 'binaural'][:nA]) + folders.split()
for v in rend:
    pl = open(f'{H}/{v}/index.m3u8').read()
    init = re.search(r'#EXT-X-MAP:URI="([^"]+)"', pl); assert init and os.path.getsize(f'{H}/{v}/{init.group(1)}') > 0, f'{v}: init segment'
    segs = re.findall(r'^(seg_\d+\.m4s)$', pl, re.M); assert segs, f'{v}: no segments'
    sizes_b = [os.path.getsize(f'{H}/{v}/{s}') for s in segs]
    assert all(sizes_b), f'{v}: an empty segment'
    assert max(sizes_b) < maxmb * 1e6, f'{v}: a segment of {max(sizes_b)} bytes is over {maxmb} MB'
    d = sum(float(x) for x in re.findall(r'#EXTINF:([\d.]+)', pl)); assert abs(d - dur) < tol, f'{v}: {d:.3f} s, the film is {dur:.3f} s'
    assert 'EXT-X-ENDLIST' in pl, f'{v}: no ENDLIST (not a finished VOD playlist)'
print(f'check ok: {len(segs)} segments per rendition, {len(rend)} renditions')
PY

python3 "$bw" "$out" || fail "hls-bandwidth"
echo "ENC HLS $(du -sm "$out" | cut -f1) MB, $n qualities x $nA sounds"
