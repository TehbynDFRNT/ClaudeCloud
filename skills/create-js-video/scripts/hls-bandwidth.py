#!/usr/bin/env python3
"""Rewrite BANDWIDTH (peak) and AVERAGE-BANDWIDTH (mean) in an HLS master playlist from the real segments.

  python3 hls-bandwidth.py <hls-dir> [--check]

ffmpeg's hls muxer declares each variant's TARGET bitrate as BANDWIDTH. On grainy, busy film the real peak runs
about 1.5x higher (Nova's 2160p: declared 12 Mb/s, measured 20.1), and RFC 8216 4.3.4.2 wants the peak, so hls.js
in Auto picked 4K on links that then stalled in the loudest seconds. This script measures every variant from its
segments and rewrites the two attributes:
  - BANDWIDTH: the largest (video segment + the largest audio rendition's segment at the same index) / duration
  - AVERAGE-BANDWIDTH: (all video bytes + all audio bytes) / total duration
Run it after every HLS encode (encode-hls.sh runs it last). It is idempotent: a second run rewrites the same
numbers and leaves the file byte-identical. --check prints the numbers and exits 1 if the file would change,
without writing it.

Layout expected (what encode-hls.sh and ffmpeg's var_stream_map write): <hls-dir>/master.m3u8 with
#EXT-X-STREAM-INF lines followed by '<variant>/index.m3u8', and audio renditions as #EXT-X-MEDIA with
URI="<name>/index.m3u8"; each index.m3u8 lists '#EXTINF:<dur>,' then the segment file name on the next line.

Nova (Oct 2026), 42 segments of 4 s per rendition: 720p peak 3.81 / average 2.07 Mb/s, 1080p 8.25 / 4.89,
2160p 20.10 / 11.67 (the declared targets were 2, 5 and 12 Mb/s).
"""
import os, re, sys
from pathlib import Path


def rates(H, v):
    """[(bits, seconds)] of every media segment of variant/rendition v, in playlist order."""
    pl = (H / v / 'index.m3u8').read_text().splitlines()
    out = []
    for i, l in enumerate(pl):
        if l.startswith('#EXTINF:'):
            seg = pl[i + 1]
            out.append((os.path.getsize(H / v / seg) * 8, float(l[8:].split(',')[0])))
    return out


def rewrite(H):
    """Return (new master text, [(variant, peak, avg)])."""
    m = (H / 'master.m3u8').read_text()
    auds = re.findall(r'#EXT-X-MEDIA:[^\n]*TYPE=AUDIO[^\n]*URI="([^/"]+)/index\.m3u8"', m)
    # per segment index, the largest audio segment of any rendition (a player loads video + one audio rendition)
    aud = [max(x) for x in zip(*[[s for s, _ in rates(H, a)] for a in auds])] if auds else None
    found = []

    def fix(mt):
        attrs, uri = mt.group(1), mt.group(2)
        v = uri.split('/')[0]
        r = rates(H, v)
        if not r:
            raise SystemExit(f'{v}/index.m3u8 lists no segments')
        a = aud or [0] * len(r)
        if len(a) < len(r):
            raise SystemExit(f'{v} has {len(r)} segments but an audio rendition has {len(a)}: not the same encode')
        peak = max((s + a[i]) / d for i, (s, d) in enumerate(r))
        avg = (sum(s for s, _ in r) + sum(a[:len(r)])) / sum(d for _, d in r)
        attrs = re.sub(r',?AVERAGE-BANDWIDTH=\d+', '', attrs)
        if 'BANDWIDTH=' not in attrs:
            attrs = f'BANDWIDTH=0,{attrs}'
        attrs = re.sub(r'BANDWIDTH=\d+', f'BANDWIDTH={int(peak)},AVERAGE-BANDWIDTH={int(avg)}', attrs, count=1)
        found.append((v, peak, avg))
        return f'#EXT-X-STREAM-INF:{attrs}\n{uri}'

    new = re.sub(r'#EXT-X-STREAM-INF:([^\n]*)\n([^\n#]+)', fix, m)
    if not found:
        raise SystemExit(f'{H}/master.m3u8 has no #EXT-X-STREAM-INF variants')
    return m, new, found


def main(argv):
    args = [a for a in argv if not a.startswith('--')]
    check = '--check' in argv
    if not args or '--help' in argv or '-h' in argv:
        print(__doc__.strip().split('\n\n')[0] + '\n\n  python3 hls-bandwidth.py <hls-dir> [--check]', file=sys.stderr)
        return 2
    H = Path(args[0])
    if not (H / 'master.m3u8').is_file():
        print(f'{H}/master.m3u8: no such file', file=sys.stderr)
        return 1
    old, new, found = rewrite(H)
    for v, peak, avg in found:
        print(f'{v}: peak {peak / 1e6:.2f} Mb/s, average {avg / 1e6:.2f} Mb/s')
    if check:
        if old == new:
            print('master.m3u8 already carries these values')
            return 0
        print('master.m3u8 would change (run without --check to rewrite it)')
        return 1
    if old != new:
        (H / 'master.m3u8').write_text(new)
        print(f'rewrote {H}/master.m3u8')
    else:
        print('master.m3u8 unchanged')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
