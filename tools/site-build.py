#!/usr/bin/env python3
"""Inline generated parts into site/nova/index.html (idempotent; run after tools/site-assets.py).

  python3 tools/site-build.py

- the signature path (assets/signature.svg) into <path id="sigp" d="...">
- download sizes, measured from the files, into <span class="sz" data-size="<path under assets/>">
- the score card: the final mix's envelope as bars from zero, with cannon, strike and ignition marks,
  between <!--WAVE--> and <!--/WAVE--> (labels are HTML, so they keep the type ramp at any card width)
"""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / 'site' / 'nova'
page = SITE / 'index.html'
html = page.read_text()
data = json.loads((SITE / 'site-data.json').read_text())

sig = (SITE / 'assets' / 'signature.svg').read_text()
d = re.search(r'<path[^>]*\sd="([^"]+)"', sig).group(1)
html = re.sub(r'(<path id="sigp" d=")[^"]*(")', lambda m: m.group(1) + d + m.group(2), html, count=1)

W, H, BASE, AMP = 1000, 200, 168, 140
dur, env = data['dur'], data['wave']
x = lambda t: t / dur * W
boom = data['dark'][1]
salvo_end = max(g['t'] for g in data['guns'] if g['kind'] == 'salvo') + 1.5
bw = W / len(env)
bars_lo, bars_hi = [], []
for i, v in enumerate(env):
    t = (i + 0.5) / len(env) * dur
    h = max(0.0, v) * AMP
    if h < 0.4:
        continue
    r = f'<rect x="{i * bw + bw * 0.18:.2f}" y="{BASE - h:.2f}" width="{bw * 0.64:.2f}" height="{h:.2f}"/>'
    (bars_hi if boom <= t <= salvo_end else bars_lo).append(r)
guns = ''.join(f'<line x1="{x(g["t"]):.1f}" x2="{x(g["t"]):.1f}" y1="6" y2="{14 if g["kind"] == "gun" else 18}"/>' for g in data['guns'])
strikes = ''.join(f'<line x1="{x(t):.1f}" x2="{x(t):.1f}" y1="{BASE + 6}" y2="{BASE + 16}"/>' for t in data['strikes'])
gap = data['dark']
first_gun = min(g['t'] for g in data['guns'] if g['kind'] == 'gun')
first_salvo = min(g['t'] for g in data['guns'] if g['kind'] == 'salvo')
pct = lambda t: f'{t / dur * 100:.2f}%'
wave = f'''<!--WAVE-->
    <div class="wv" role="img" aria-label="The soundtrack's loudness over 2 min 48 s: distant guns, five strikes, a roar in the dark at the ignition, then the closing tutti under cannon salvos">
     <svg class="reveal" viewBox="0 0 {W} {H}" preserveAspectRatio="none" aria-hidden="true">
      <line class="base" x1="0" x2="{W}" y1="{BASE + .5}" y2="{BASE + .5}"/>
      <g class="env">{''.join(bars_lo)}</g>
      <g class="env-hi">{''.join(bars_hi)}</g>
      <g class="gun">{guns}</g>
      <g class="tick">{strikes}</g>
     </svg>
     <span class="wl lab" style="left:{pct(first_gun)};top:-18px">GUNS</span>
     <span class="wl lab" style="left:{pct(first_salvo)};top:-18px">SALVOS</span>
     <span class="wl lab end" style="left:{pct(data['strikes'][-1])};bottom:-20px">STRIKES</span>
     <span class="wl lab" style="left:{pct(gap[0])};bottom:-20px">IGNITION</span>
    </div>
<!--/WAVE-->'''
html = re.sub(r'<!--WAVE-->.*?(<!--/WAVE-->|$)', lambda m: wave, html, count=1, flags=re.S) if '<!--/WAVE-->' in html \
    else html.replace('<!--WAVE-->', wave, 1)
def size(m):
    n = (SITE / 'assets' / m.group(2)).stat().st_size
    return f'{m.group(1)} · {n / 1e6:.1f} MB{m.group(3)}' if n >= 1e6 else f'{m.group(1)} · {n // 1000} KB{m.group(3)}'
html = re.sub(r'(<span class="sz" data-size="([^"]+)">)[^<]*(</span>)', size, html)
page.write_text(html)
print('built', page.relative_to(ROOT), f'{len(html) // 1024} KB', len(bars_lo) + len(bars_hi), 'bars')
