#!/usr/bin/env python3
"""Refine the bar map from analyze_music.py into an eighth-note grid.

Dynamic programming over candidate bar-line times (+-300 ms around a robust local
tempo prediction, 5.8 ms resolution). The score of a pair of consecutive bar lines
is the onset evidence at the eight equally spaced eighth notes between them, minus
a penalty for departing from the smooth local bar duration. Single eighths are then
snapped (+-30 ms) to clear attacks. Fit statistics are reported per section so the
synth pulse can be judged numerically (not a substitute for listening).

Also extracts the cello line per eighth from the score MIDI for the synth bass.
Output: analysis/grid.json
"""
import json
from pathlib import Path

import librosa
import numpy as np
import pretty_midi
from scipy.ndimage import gaussian_filter1d

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / 'media/source/winter-mvt1-milman.flac'
MIDI = ROOT / 'analysis/ref/mutopia-winter-score.mid'
MAP = ROOT / 'analysis/music-map.json'
OUT = ROOT / 'analysis/grid.json'
SR, HOP = 22050, 128
DT = HOP / SR

SECTIONS = [  # score-derived labels (bar ranges, inclusive)
    ('A ritornello: agghiacciato tremar', 1, 11),
    ('B solo: orrido vento', 12, 19),
    ('tutti repeated F', 20, 22),
    ('C correre e batter li piedi', 23, 26),
    ('solo 32nd runs', 27, 31),
    ('ladder of strikes + tremolo', 32, 37),
    ('caesura / return of opening material', 38, 43),
    ('solo arpeggios', 44, 46),
    ('D batter li denti', 47, 53),
    ('closing tutti', 54, 63),
]


def main():
    mm = json.loads(MAP.read_text())
    bars = mm['bars']
    n = len(bars)
    y, sr = librosa.load(AUDIO, sr=SR, mono=True)
    env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=HOP, aggregate=np.median, n_mels=128)
    env = env / (np.percentile(env, 99) + 1e-9)
    envs = gaussian_filter1d(env, 0.012 / DT)
    onsets = librosa.onset.onset_detect(onset_envelope=env, sr=sr, hop_length=HOP, units='time')

    def ev(t):
        i = np.clip(np.round(np.asarray(t) / DT).astype(int), 0, len(envs) - 1)
        return envs[i]

    # robust local bar duration from DTW (median over +-4 bars, excluding final fermata)
    starts = np.array([b['start'] for b in bars])
    dur = np.diff(np.append(starts, bars[-1]['end']))
    loc = np.array([np.median(dur[max(0, i - 4):min(n - 1, i + 5)]) for i in range(n)])
    # predicted bar lines: anchor on bars whose DTW duration agrees with local tempo
    pred = starts.copy()
    ok = np.abs(dur - loc) < 0.08 * loc
    first = int(np.argmax(ok))
    for i in range(first - 1, -1, -1):
        pred[i] = pred[i + 1] - loc[i]
    # bar n+1 (end of final bar) predicted from local tempo
    lines_pred = np.append(pred, pred[-1] + loc[-2])

    span = 0.30
    cands = [np.arange(max(0.0, p - span), p + span, DT) for p in lines_pred]
    lam = 60.0
    q = np.arange(8) / 8.0
    # DP over bar lines 0..n (n+1 lines); edge (i->i+1) scores bar i.
    score = np.zeros(len(cands[0]))
    back = []
    for i in range(n):
        a = cands[i][:, None]
        b = cands[i + 1][None, :]
        d = b - a
        valid = d > 0.5 * loc[i]
        pos = a[..., None] + d[..., None] * q  # (A,B,8)
        e = ev(pos).sum(-1)
        # free tempo for the final fermata bar
        pen = 0 if i == n - 1 else lam * ((d - loc[i]) / loc[i]) ** 2 * 8
        tot = score[:, None] + e - pen
        tot[~valid] = -1e9
        back.append(np.argmax(tot, axis=0))
        score = np.max(tot, axis=0)
    idx = [int(np.argmax(score))]
    for i in range(n - 1, -1, -1):
        idx.append(int(back[i][idx[-1]]))
    idx = idx[::-1]
    lines = np.array([cands[i][k] for i, k in enumerate(idx)])

    grid = np.concatenate([lines[i] + (lines[i + 1] - lines[i]) * q for i in range(n)])
    final = grid.copy()
    for k, g in enumerate(grid):  # snap single eighths only to clear nearby attacks
        i0, i1 = int((g - 0.03) / DT), int((g + 0.03) / DT) + 1
        seg = env[i0:i1]
        if len(seg) and seg.max() > 0.35:
            final[k] = (i0 + int(np.argmax(seg))) * DT

    def stats(times):
        d = np.array([np.min(np.abs(onsets - t)) for t in times]) * 1000
        return {'median_ms': round(float(np.median(d)), 1), 'p75_ms': round(float(np.percentile(d, 75)), 1),
                'within_25ms': round(float(np.mean(d < 25)), 3)}

    pm = pretty_midi.PrettyMIDI(str(MIDI))
    spb = float(np.median(np.diff(pm.get_beats())))
    by = {i.name: i.notes for i in pm.instruments}
    names = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
    cello = []
    for k in range(n * 8):
        t = k * spb / 2 + 0.005
        p = None
        for inst in ('cello', 'viola'):
            sounding = [x.pitch for x in by.get(inst, []) if x.start <= t < x.end]
            if sounding:
                p = min(sounding)
                break
        cello.append(p)

    sec_fit = []
    for name, a, b in SECTIONS:
        sl = slice((a - 1) * 8, b * 8)
        sec_fit.append({'section': name, 'bars': [a, b], 'start': round(float(lines[a - 1]), 3),
                        'end': round(float(lines[b]), 3), 'fit': stats(final[sl])})
    out = {
        'source': mm['source'], 'tuningA4Hz': mm['tuningA4Hz'],
        'status': 'candidate (signal-derived; not verified by listening)',
        'method': 'DP bar-line fit on onset evidence at eighth positions + smooth tempo prior; eighths snapped +-30ms',
        'sections': sec_fit,
        'bars': [{'bar': b + 1, 'start': round(float(lines[b]), 4), 'end': round(float(lines[b + 1]), 4),
                  'eighths': [round(float(x), 4) for x in final[b * 8:(b + 1) * 8]],
                  'bassMidi': cello[b * 8:(b + 1) * 8],
                  'bassNames': [names[p % 12] if p is not None else None for p in cello[b * 8:(b + 1) * 8]]}
                 for b in range(n)],
        'fitAll': stats(final), 'fitDtwBeats': stats(np.array([x for b in bars for x in b['beats']])),
    }
    OUT.write_text(json.dumps(out, indent=1))
    print('all', out['fitAll'], 'dtw beats', out['fitDtwBeats'])
    for s in sec_fit:
        print(f"{s['section']:40s} bars {s['bars'][0]:2d}-{s['bars'][1]:2d} {s['start']:7.2f}-{s['end']:7.2f} {s['fit']}")
    for b in out['bars']:
        d = b['end'] - b['start']
        print(f"bar {b['bar']:2d} {b['start']:8.3f} dur {d:5.2f} ({240 / d:5.1f} bpm)")


if __name__ == '__main__':
    main()
