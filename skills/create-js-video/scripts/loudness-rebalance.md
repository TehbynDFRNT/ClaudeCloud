# loudness-rebalance.py

Measures a level note ("the explosion 15% lower, the return 20% higher") the only way that predicts what the
director will hear. It works on the normalised final mix and compares each section with the rest of the film,
before and after. It then suggests the next raw gain from how much of the last change survived.

```bash
python3 scripts/loudness-rebalance.py out/audio/mix.wav --section hit=115.79-118.9 --section return=118.9-127.75
python3 scripts/loudness-rebalance.py --before out/audio-v3/mix.wav --after out/audio-v4/mix.wav \
    --section hit=115.79-118.9 --section return=118.9-127.75 \
    --target hit=-15% --target return=+20% --raw hit=0.75 --raw return=1.4 [--stat max] [--json]
```

- **Method.** ffmpeg's ebur128 400 ms blocks are BS.1770's own gating blocks. The script computes the integrated
  loudness of the section's blocks and of the blocks that touch no section, each with the -70 LUFS absolute and
  -10 LU relative gates. Its whole-file recomputation matches ffmpeg's integrated value to within 0.01 LU.
- **`--stat mean`** compares gated section loudness with the rest of the film. **`--stat max`** compares the
  short-term (3 s) maximum. A limiter-bound peak barely moves on `max`. In a test, +3 dB raw came out as +1.66 dB
  mean but +0.25 dB max, so say which statistic you used.
- **Percentages are read as amplitude by default:** -15% = -1.41 dB, +20% = +1.58 dB. This is how the Nova score
  read them. `--percent loudness` reads them as perceived loudness (10 log2; +20% = +2.63 dB). Tell the director the
  dB you used.
- **Calibration.** With `--raw`, efficiency = measured dB / raw dB, and the next raw gain = target / efficiency.
  Below an efficiency of 0.3 the section is limiter-bound: raise that limiter's ceiling or lower the competing bus.
  More raw gain won't get there.

Provenance: new for the skill. The measurement mirrors Nova's `tools/render-audio.mjs` scans. Nova's v4 note took
four renders (x0.85/x1.2, then x0.75/x1.4 with the music ceiling at -1.6 dBTP, then x0.6/x1.3, then x0.62/x1.19)
because the first try moved the balance about 1 dB instead of about 3. Tested on the Nova v4 mix and on synthetic
after-mixes (raw +3 dB through a limiter and renormalisation).
