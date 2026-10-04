# encode-copy.py

Makes delivery copies of a finished master that fit a size cap, then checks them: frame count against the source, a
full decode, size, integrated loudness and decoded true peak.

```bash
python3 scripts/encode-copy.py dist/film-v4.mp4 out/review/film-v4-chat.mp4 --target chat       # chat attachment
python3 scripts/encode-copy.py dist/film-v4.mp4 out/downloads/film-v4-1080x1920.mp4 --target github
```

| Target | Cap | Picture | Audio | Nova v4 (2:47.7) result |
|---|---|---|---|---|
| `chat` | 30 MiB | long side 1280 (720x1280), crf 23, maxrate ≤1700k | AAC 192k | 22-27 MiB, -1.0 dBTP |
| `github` | 99,000,000 B | source size, crf 19, maxrate 4000k | master's AAC copied | 90.3 MB, -1.3 dBTP |

- The maxrate is also limited by the size budget: 1.25 × (cap × 0.94 × 8 / duration − audio bitrate). This lets
  long films fit too. An encode that still comes out over the cap is redone at a lower maxrate (3 tries).
- `github` copies the master's AAC track, which already passed the delivery check (512k fast coder), so there is no
  second lossy pass. A re-encoded AAC track can overshoot the true peak. The script warns above -1 dBTP.
- Send the chat copy as a download card early, while the full-size finals are still rendering.

Provenance: the ad-hoc ffmpeg lines of the Nova session's `finish-v4.sh` (Oct 2026), generalised with the budget,
the retry and the checks. Both targets were tested on `dist/david-916-v4.mp4`.
