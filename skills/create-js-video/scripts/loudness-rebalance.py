#!/usr/bin/env python3
"""Measure a "make X% louder/quieter" note where it counts: on the NORMALISED final mix, relative to the rest of
the film, and suggest the next raw gain.

Why: a mix that ends in limiters and is normalised to a loudness target swallows raw gain changes. On "Nova" the
first try at "the explosion 15% lower, the return 20% higher" moved the balance about 1 dB instead of about 3 dB;
it took four renders. Measure each render with this script and step the raw gains by the measured efficiency.

    # one mix: the level of each section and of the rest of the film
    loudness-rebalance.py out/audio/mix.wav --section hit=115.79-118.9 --section return=118.9-131

    # a note round: before vs after, against the director's percentages, with the raw gains used in "after"
    loudness-rebalance.py --before out/audio-v3/mix.wav --after out/audio-v4/mix.wav \\
        --section hit=115.79-118.9 --section return=118.9-131 \\
        --target hit=-15% --target return=+20% --raw hit=0.75 --raw return=1.4

Method: ffmpeg's ebur128 400 ms blocks (100 ms hop) are BS.1770's own gating blocks, so the integrated loudness of
any subset of them can be computed exactly: the section (blocks inside it) and the rest of the film (blocks touching
no section), each gated at -70 LUFS absolute and -10 LU relative. The relative level of a section is
section - rest; its change is after - before. "mean" uses that gated loudness, "max" the short-term (3 s) maximum
inside the section. Percentages are amplitude by default (-15% = 20 log10 0.85 = -1.41 dB; +20% = +1.58 dB), as the
"Nova" score interpreted them; --percent loudness reads them as perceived loudness (10 log2, +20% = +2.63 dB).
Report the dB you chose next to the percentage so the director can correct the reading.

Provenance: new for the create-js-video skill; the measurement mirrors tools/render-audio.mjs of the "Nova,
Episode 1" project (ffmpeg ebur128 framelog scans), the calibration history is the v4 score commits.
"""
import argparse
import json
import math
import re
import subprocess
import sys


def scan(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-loglevel', 'verbose', '-i', path, '-map', '0:a:0', '-vn',
                        '-af', 'ebur128=peak=true:framelog=verbose', '-f', 'null', '-'], capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(f'ffmpeg {path}: {r.stderr[-300:]}')
    t, M, S = [], [], []
    for line in r.stderr.split('\n'):
        m = re.search(r'\bt:\s*([\d.]+).*?\bM:\s*(-?[\d.]+|-inf).*?\bS:\s*(-?[\d.]+|-inf)', line)
        if m:
            t.append(float(m.group(1)))
            M.append(float(m.group(2)) if m.group(2) != '-inf' else -120.0)
            S.append(float(m.group(3)) if m.group(3) != '-inf' else -120.0)
    s = r.stderr[r.stderr.rfind('Summary:'):]
    num = lambda rx: (lambda m: float(m.group(1)) if m else None)(re.search(rx, s))
    return {'t': t, 'M': M, 'S': S, 'I': num(r'I:\s+(-?[\d.]+) LUFS'), 'TP': num(r'Peak:\s+(-?[\d.]+) dBFS')}


def gated(values):
    """BS.1770 integrated loudness of a set of 400 ms block loudnesses (LUFS)."""
    v = [x for x in values if x > -70.0]
    if not v:
        return None
    rel = 10 * math.log10(sum(10 ** (x / 10) for x in v) / len(v)) - 10.0
    v = [x for x in v if x > rel]
    return 10 * math.log10(sum(10 ** (x / 10) for x in v) / len(v)) if v else None


def levels(sc, sections):
    out = {}
    inside = lambda t, a, b: t - 0.4 >= a - 1e-6 and t <= b + 1e-6
    touches = lambda t, a, b: t > a and t - 0.4 < b
    rest = [m for t, m in zip(sc['t'], sc['M']) if not any(touches(t, a, b) for a, b in sections.values())]
    L_rest = gated(rest)
    for name, (a, b) in sections.items():
        blocks = [m for t, m in zip(sc['t'], sc['M']) if inside(t, a, b)]
        smax = max((s for t, s in zip(sc['t'], sc['S']) if a <= t <= b + 1e-6), default=None)
        L = gated(blocks)
        out[name] = {'span': [a, b], 'loudness': L, 'shortTermMax': smax,
                     'relMean': None if L is None or L_rest is None else L - L_rest,
                     'relMax': None if smax is None or L_rest is None else smax - L_rest}
    return {'integrated': sc['I'], 'truePeak': sc['TP'], 'rest': L_rest, 'whole': gated(sc['M']), 'sections': out}


def pct_db(p, mode):
    return 20 * math.log10(1 + p) if mode == 'amplitude' else 10 * math.log2(1 + p)


def kv(items, conv):
    out = {}
    for it in items or []:
        k, _, v = it.partition('=')
        out[k.strip()] = conv(v.strip())
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('mix', nargs='?', help='one mix to measure (or use --before/--after)')
    ap.add_argument('--before')
    ap.add_argument('--after')
    ap.add_argument('--section', action='append', required=True, help='name=start-end in seconds (repeatable)')
    ap.add_argument('--target', action='append', help='name=+20%% or name=-1.4dB (repeatable)')
    ap.add_argument('--raw', action='append', help="name=gain multiplier applied in 'after' relative to 'before' (repeatable)")
    ap.add_argument('--stat', choices=['mean', 'max'], default='mean')
    ap.add_argument('--percent', choices=['amplitude', 'loudness'], default='amplitude')
    ap.add_argument('--json', action='store_true')
    a = ap.parse_args()
    sections = kv(a.section, lambda v: tuple(float(x) for x in v.split('-', 1)))
    after = a.after or a.mix
    if not after:
        ap.error('give a mix, or --before and --after')
    res = {'after': levels(scan(after), sections)}
    if a.before:
        res['before'] = levels(scan(a.before), sections)
    key = 'relMean' if a.stat == 'mean' else 'relMax'

    def parse_target(v):
        if v.endswith('%'):
            p = float(v[:-1]) / 100
            return {'percent': p, 'db': pct_db(p, a.percent)}
        return {'percent': None, 'db': float(v.lower().replace('db', ''))}
    targets = kv(a.target, parse_target)
    raws = kv(a.raw, float)
    report = []
    for name in sections:
        A = res['after']['sections'][name]
        row = {'section': name, 'span': A['span'], 'after': {k: A[k] for k in ('loudness', 'shortTermMax', 'relMean', 'relMax')}}
        if 'before' in res:
            B = res['before']['sections'][name]
            row['before'] = {k: B[k] for k in ('loudness', 'shortTermMax', 'relMean', 'relMax')}
            if A[key] is not None and B[key] is not None:
                row['measuredDb'] = A[key] - B[key]
        if name in targets:
            row['targetDb'] = targets[name]['db']
            row['targetPercent'] = targets[name]['percent']
            if 'measuredDb' in row:
                row['residualDb'] = row['targetDb'] - row['measuredDb']
        if name in raws and 'measuredDb' in row and raws[name] > 0:
            raw_db = 20 * math.log10(raws[name])
            row['rawDb'] = raw_db
            if abs(raw_db) > 0.05 and 'targetDb' in row:
                eff = row['measuredDb'] / raw_db            # how much of the raw change survived the master
                row['efficiency'] = eff
                if eff >= 0.3:   # below that the section is limiter-bound: more raw gain mostly feeds the limiter
                    nxt = row['targetDb'] / eff
                    row['suggestRawDb'] = nxt
                    row['suggestRawGain'] = 10 ** (nxt / 20)
        report.append(row)
    res['report'] = report
    if a.json:
        print(json.dumps(res, indent=1))
        return 0
    f = lambda x, d=2: '   n/a' if x is None else f'{x:+.{d}f}'
    for side in [s for s in ('before', 'after') if s in res]:
        R = res[side]
        print(f"{side:6s}: integrated {R['integrated']} LUFS (recomputed {R['whole']:.2f}), true peak {R['truePeak']} dBTP, rest of film {R['rest']:.2f} LUFS")
    print(f"stat: {a.stat} (section {'gated loudness' if a.stat == 'mean' else 'short-term max'} minus the rest of the film); percent as {a.percent}")
    for r in report:
        line = f"  {r['section']:10s} {r['span'][0]:.2f}-{r['span'][1]:.2f}s  after rel {f(r['after'][key])} dB"
        if 'before' in r:
            line += f"  before rel {f(r['before'][key])} dB  measured {f(r.get('measuredDb'))} dB"
        if 'targetDb' in r:
            pc = f" ({r['targetPercent'] * 100:+.0f}%)" if r['targetPercent'] is not None else ''
            line += f"  target {f(r['targetDb'])} dB{pc}  residual {f(r.get('residualDb'))} dB"
        print(line)
        if 'suggestRawGain' in r:
            print(f"             raw {f(r['rawDb'])} dB survived as {f(r['measuredDb'])} dB (efficiency {r['efficiency']:.2f}); "
                  f"next raw gain x{r['suggestRawGain']:.3f} ({f(r['suggestRawDb'])} dB) relative to 'before'")
        elif 'efficiency' in r:
            print(f"             raw {f(r['rawDb'])} dB came out as {f(r['measuredDb'])} dB (efficiency {r['efficiency']:.2f}): the master "
                  f"(limiters, compressors, normalisation) swallowed most of it or inverted it: raise that limiter's ceiling, lower the competing bus, or measure with the other --stat; more raw gain will not get there")
    return 0


if __name__ == '__main__':
    sys.exit(main())
