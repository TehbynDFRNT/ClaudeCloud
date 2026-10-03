#!/usr/bin/env python3
"""Signal-derived structure map for the Winter recording.

Aligns the Mutopia score MIDI (analysis reference only, CC BY-SA, not redistributed)
to the recording with chroma DTW, refines bar/beat times against onset strength,
and reports per-bar loudness and attack density. Output: analysis/music-map.json.

Everything here is a diagnostic proposal: the semantic labels come from the score,
the times come from signal alignment. Nobody has *listened* to verify them.
"""
import json
import sys
from pathlib import Path

import librosa
import numpy as np
import pretty_midi

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / 'media/source/winter-mvt1-milman.flac'
MIDI = ROOT / 'analysis/ref/mutopia-winter-score.mid'
OUT = ROOT / 'analysis/music-map.json'

SR = 22050
HOP = 512  # 23.2 ms


def main():
    y, sr = librosa.load(AUDIO, sr=SR, mono=True)
    dur = len(y) / sr
    tuning = float(librosa.estimate_tuning(y=y, sr=sr))  # fraction of a semitone

    # --- recording features
    chroma_a = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=HOP, tuning=tuning)
    onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=HOP)
    rms = librosa.feature.rms(y=y, hop_length=HOP)[0]
    times = librosa.frames_to_time(np.arange(len(onset_env)), sr=sr, hop_length=HOP)
    onsets = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr, hop_length=HOP, units='time')

    # --- score features (piano-roll chroma, synthesized for a fairer CQT comparison)
    pm = pretty_midi.PrettyMIDI(str(MIDI))
    ys = pm.synthesize(fs=SR)
    chroma_s = librosa.feature.chroma_cqt(y=ys, sr=SR, hop_length=HOP)
    score_downbeats = pm.get_downbeats()
    score_beats = pm.get_beats()
    score_end = pm.get_end_time()

    # --- DTW alignment (cosine on chroma)
    D, wp = librosa.sequence.dtw(X=chroma_s, Y=chroma_a, metric='cosine', subseq=False)
    wp = wp[::-1]
    ts = wp[:, 0] * HOP / SR  # score time
    ta = wp[:, 1] * HOP / SR  # audio time
    # monotone interpolation score->audio
    us, idx = np.unique(ts, return_index=True)
    ua = np.maximum.accumulate(ta[idx])

    def s2a(t):
        return float(np.interp(t, us, ua))

    beats_a = np.array([s2a(t) for t in score_beats])

    # --- refine each beat to the nearest strong onset within +-70 ms
    win = int(0.07 * SR / HOP)
    refined = []
    for b in beats_a:
        i = int(round(b * SR / HOP))
        lo, hi = max(0, i - win), min(len(onset_env) - 1, i + win)
        j = lo + int(np.argmax(onset_env[lo:hi + 1]))
        # only accept if the peak is meaningfully above local median
        local = onset_env[max(0, i - 40):i + 40]
        refined.append(times[j] if onset_env[j] > np.median(local) * 1.5 else b)
    refined = np.array(refined)
    # enforce monotonic
    for k in range(1, len(refined)):
        if refined[k] <= refined[k - 1] + 0.05:
            refined[k] = max(beats_a[k], refined[k - 1] + 0.05)

    beats_per_bar = 4
    nbars = len(score_downbeats)
    bars = []
    for b in range(nbars):
        k = b * beats_per_bar
        start = float(refined[k]) if k < len(refined) else s2a(score_downbeats[b])
        nk = (b + 1) * beats_per_bar
        end = float(refined[nk]) if nk < len(refined) else s2a(score_end)
        i0, i1 = int(start * SR / HOP), max(int(start * SR / HOP) + 1, int(end * SR / HOP))
        n_on = int(np.sum((onsets >= start) & (onsets < end)))
        bars.append({
            'bar': b + 1,
            'start': round(start, 3),
            'end': round(end, 3),
            'beats': [round(float(refined[k + q]), 3) for q in range(beats_per_bar) if k + q < len(refined)],
            'rms_db': round(float(20 * np.log10(np.mean(rms[i0:i1]) + 1e-9)), 2),
            'onset_strength': round(float(np.mean(onset_env[i0:i1])), 3),
            'onsets_per_sec': round(n_on / max(1e-3, end - start), 2),
            'tempo_bpm': round(60 * beats_per_bar / max(1e-3, end - start), 1),
        })

    # bass pitch class per beat from the score (lowest sounding note at each beat)
    notes = sorted((n for inst in pm.instruments for n in inst.notes), key=lambda n: n.start)
    names = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
    for bar in bars:
        bass = []
        for q in range(beats_per_bar):
            k = (bar['bar'] - 1) * beats_per_bar + q
            if k >= len(score_beats):
                break
            t = score_beats[k] + 0.01
            sounding = [n.pitch for n in notes if n.start <= t < n.end]
            bass.append(names[min(sounding) % 12] if sounding else None)
        bar['score_bass'] = bass

    path_cost = float(D[wp[-1, 0], wp[-1, 1]] / len(wp))
    out = {
        'source': str(AUDIO.relative_to(ROOT)),
        'durationSeconds': round(dur, 3),
        'tuningSemitones': round(tuning, 3),
        'tuningA4Hz': round(440 * 2 ** (tuning / 12), 2),
        'alignment': {'method': 'chroma_cqt DTW vs synthesized Mutopia MIDI, beats refined to onset peaks +-70ms',
                      'meanPathCost': round(path_cost, 4), 'scoreBars': nbars},
        'status': 'candidate (signal-derived, not verified by listening)',
        'bars': bars,
    }
    OUT.write_text(json.dumps(out, indent=1))
    print(f'duration {dur:.2f}s tuning {tuning:+.3f} st (A4={out["tuningA4Hz"]}Hz) path cost {path_cost:.4f}')
    for bar in bars:
        print(f"bar {bar['bar']:2d} {bar['start']:7.2f}-{bar['end']:7.2f} tempo {bar['tempo_bpm']:5.1f} "
              f"rms {bar['rms_db']:6.1f} on/s {bar['onsets_per_sec']:5.2f} str {bar['onset_strength']:.2f} bass {bar['score_bass']}")


if __name__ == '__main__':
    sys.exit(main())
