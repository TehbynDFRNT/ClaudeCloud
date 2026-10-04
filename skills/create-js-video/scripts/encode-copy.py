#!/usr/bin/env python3
"""Encode a delivery copy of a finished film that fits a size cap, then check it.

Targets (override any setting with the flags):
  chat    a review copy for chat attachments (30 MiB cap): long side 1280 (720x1280 for 9:16), H.264 crf 23 with
          maxrate 1700k, AAC 192k. 2:45 comes to about 27 MiB.
  github  a download for a GitHub branch (100 MB per-file cap, guard 99,000,000 bytes): source size (1080x1920),
          crf 19 with maxrate 4000k, the master's AAC track copied when it is AAC (no second lossy pass, so the
          true peak the master passed with is kept). 2:45 comes to about 88 MB.

The video maxrate is also capped by the size budget: 1.25 x ((cap x margin x 8 / duration) - audio bitrate). If the
result is still over the cap, the encode is redone with a lower maxrate (up to 3 tries). Then: frame count against the source,
a full decode, the size, and the decoded audio's integrated loudness and true peak (a re-encoded AAC track can
overshoot the master's peak: the script warns above -1 dBTP).

    encode-copy.py dist/film-v4.mp4 out/review/film-v4-chat.mp4 --target chat
    encode-copy.py dist/film-v4.mp4 out/downloads/film-v4-1080x1920.mp4 --target github

Provenance: the ad-hoc ffmpeg commands of the "Nova, Episode 1" project's finish-v4.sh (ClaudeCloud session
scratchpad, Oct 2026): 720x1280 crf 23 maxrate 1700k bufsize 3400k AAC 192k, and 1080x1920 crf 19 maxrate 4000k.
Generalised with the size budget, the retry and the checks.
"""
import argparse
import json
import os
import re
import subprocess
import sys

TARGETS = {
    'chat': dict(cap=30 * 2**20, long_side=1280, crf=23, maxrate=1700, audio='192k', preset='medium'),
    'github': dict(cap=99_000_000, long_side=0, crf=19, maxrate=4000, audio='copy', preset='medium'),
}


def probe(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', path], capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(f'ffprobe {path}: {r.stderr.strip()[-200:]}')
    return json.loads(r.stdout)


def count_frames(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames',
                        '-of', 'csv=p=0', path], capture_output=True, text=True)
    return int(r.stdout.strip() or -1)


def loudness(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-map', '0:a:0', '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                       capture_output=True, text=True)
    s = r.stderr[r.stderr.rfind('Summary:'):]
    i = re.search(r'I:\s+(-?[\d.]+) LUFS', s)
    p = re.search(r'Peak:\s+(-?[\d.]+) dBFS', s)
    return (float(i.group(1)) if i else None, float(p.group(1)) if p else None)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('src')
    ap.add_argument('out')
    ap.add_argument('--target', choices=TARGETS, default='chat')
    ap.add_argument('--cap-bytes', type=int, help='size cap in bytes (chat: 31457280, github: 99000000)')
    ap.add_argument('--long-side', type=int, help='scale so the long side is this many pixels (0 = source size)')
    ap.add_argument('--crf', type=int)
    ap.add_argument('--maxrate', type=int, help='video maxrate cap, kb/s')
    ap.add_argument('--audio', help="'copy' or an AAC bitrate such as 192k")
    ap.add_argument('--margin', type=float, default=0.94, help='fraction of the cap to aim for (container overhead, VBV slack)')
    a = ap.parse_args()
    t = dict(TARGETS[a.target])
    for k in ('cap_bytes', 'long_side', 'crf', 'maxrate', 'audio'):
        v = getattr(a, k)
        if v is not None:
            t['cap' if k == 'cap_bytes' else k] = v

    info = probe(a.src)
    v = next(s for s in info['streams'] if s['codec_type'] == 'video')
    aud = [s for s in info['streams'] if s['codec_type'] == 'audio']
    dur = float(info['format']['duration'])
    if t['audio'] == 'copy' and (not aud or aud[0]['codec_name'] != 'aac'):
        t['audio'] = '320k'
    abr = (int(aud[0].get('bit_rate', 512000)) / 1000 if t['audio'] == 'copy' else int(t['audio'].rstrip('k'))) if aud else 0
    budget = (t['cap'] * a.margin * 8 / dur) / 1000 - abr          # kb/s left for the picture (as an average)
    # with crf the average runs well under the maxrate, so the cap may sit 25% above the average budget; the
    # size check below catches the rare overflow (on "Nova" 1700k gave ~27 MiB for 2:45 and the budget-capped
    # 1218k only 22 MiB: too cautious)
    maxrate = int(min(t['maxrate'], budget * 1.25))
    if maxrate < 300:
        raise SystemExit(f'{dur:.1f} s does not fit {t["cap"]} bytes with {abr:.0f} kb/s audio (budget {budget:.0f} kb/s for video)')
    ls = t['long_side']
    vf = (f"scale='if(gt(iw,ih),{ls},-2)':'if(gt(iw,ih),-2,{ls})':flags=lanczos" if ls else 'null')
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    for attempt in range(3):
        cmd = ['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', a.src, '-map', '0:v:0', '-map', '0:a:0?', '-vf', vf,
               '-c:v', 'libx264', '-preset', t['preset'], '-crf', str(t['crf']), '-maxrate', f'{maxrate}k', '-bufsize', f'{2 * maxrate}k',
               '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.2']
        cmd += ['-c:a', 'copy'] if t['audio'] == 'copy' else ['-c:a', 'aac', '-b:a', t['audio'], '-ar', '48000', '-ac', '2']
        cmd += ['-movflags', '+faststart', a.out]
        print(f'encode {attempt + 1}: {a.target}, long side {ls or "source"}, crf {t["crf"]}, maxrate {maxrate}k, audio {t["audio"]}')
        if subprocess.run(cmd).returncode:
            raise SystemExit('ffmpeg failed')
        size = os.path.getsize(a.out)
        if size < t['cap']:
            break
        maxrate = int(maxrate * t['cap'] * 0.95 / size)
        print(f'  {size} bytes is over the cap {t["cap"]}: retrying with maxrate {maxrate}k')
    else:
        raise SystemExit(f'{a.out} is still over the cap after 3 tries')

    problems = []
    n_src, n_out = count_frames(a.src), count_frames(a.out)
    if n_src != n_out:
        problems.append(f'frames: source {n_src}, copy {n_out}')
    dec = subprocess.run(['ffmpeg', '-v', 'error', '-xerror', '-i', a.out, '-f', 'null', '-'], capture_output=True, text=True)
    if dec.returncode:
        problems.append('full decode failed: ' + dec.stderr.strip()[-200:])
    lufs = tp = None
    if aud:
        lufs, tp = loudness(a.out)
        lufs_src, _ = loudness(a.src)
        if lufs is not None and lufs_src is not None and abs(lufs - lufs_src) > 0.5:
            problems.append(f'integrated loudness moved: source {lufs_src} LUFS, copy {lufs} LUFS')
    out_v = next(s for s in probe(a.out)['streams'] if s['codec_type'] == 'video')
    print(json.dumps({'file': a.out, 'bytes': size, 'MiB': round(size / 2**20, 2), 'MB': round(size / 1e6, 2), 'cap': t['cap'],
                      'size': f"{out_v['width']}x{out_v['height']}", 'frames': n_out, 'maxrateK': maxrate,
                      'integratedLufs': lufs, 'truePeakDbtp': tp, 'problems': problems}, indent=1))
    if tp is not None and tp > -1.0:
        print(f'warning: decoded true peak {tp} dBTP is above -1 dBTP (the AAC re-encode overshot): use --audio copy, '
              f'a higher AAC bitrate, or mux a mix mastered with more headroom', file=sys.stderr)
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main())
