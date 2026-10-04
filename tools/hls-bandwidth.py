#!/usr/bin/env python3
"""Rewrite BANDWIDTH (peak) and AVERAGE-BANDWIDTH (mean) in an HLS master playlist from the real segments.

  python3 tools/hls-bandwidth.py [site/nova/assets/hls]

ffmpeg's hls muxer declares the target bitrate, which for grainy, busy film runs ~1.5x under the real peak
(RFC 8216 4.3.4.2 wants the peak), so hls.js Auto would pick 4K on a link that stalls in the busiest seconds.
Each variant's rate is its video segment plus the larger of the audio renditions' segment at the same index.
Run after every HLS encode.
"""
import os, re, sys
from pathlib import Path
H = Path(sys.argv[1] if len(sys.argv) > 1 else 'site/nova/assets/hls')
m = (H / 'master.m3u8').read_text()
def rates(v):
    pl = (H / v / 'index.m3u8').read_text().splitlines(); out = []
    for i, l in enumerate(pl):
        if l.startswith('#EXTINF:'):
            out.append((os.path.getsize(H / v / pl[i + 1]) * 8, float(l[8:].split(',')[0])))
    return out
auds = re.findall(r'TYPE=AUDIO[^\n]*URI="([^/"]+)/index\.m3u8"', m)
aud = [max(x) for x in zip(*[[s for s, _ in rates(a)] for a in auds])] if auds else None
def fix(mt):
    attrs, uri = mt.group(1), mt.group(2); v = uri.split('/')[0]; r = rates(v)
    a = aud or [0] * len(r)
    peak = max((s + a[i]) / d for i, (s, d) in enumerate(r)); avg = (sum(s for s, _ in r) + sum(a)) / sum(d for _, d in r)
    attrs = re.sub(r',?AVERAGE-BANDWIDTH=\d+', '', attrs)
    attrs = re.sub(r'BANDWIDTH=\d+', f'BANDWIDTH={int(peak)},AVERAGE-BANDWIDTH={int(avg)}', attrs, count=1)
    print(f'{v}: peak {peak / 1e6:.2f} Mb/s, average {avg / 1e6:.2f} Mb/s')
    return f'#EXT-X-STREAM-INF:{attrs}\n{uri}'
m = re.sub(r'#EXT-X-STREAM-INF:([^\n]*)\n([^\n#]+)', fix, m)
(H / 'master.m3u8').write_text(m)
