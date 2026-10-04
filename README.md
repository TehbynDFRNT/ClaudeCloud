# Nova, Episode 1: David & Goliath (HD)

The finished film, rendered natively at 2160 x 3840 by the film's own engine (not upscaled) and graded for deep blacks.

| File | What it is | For |
|---|---|---|
| `nova-ep1-david-4k-2160x3840-hevc10.mp4` | 4K, HEVC 10-bit (Main10), 24 fps; audio: stereo (default) and binaural for headphones | your library, YouTube Shorts and any upload that takes 4K |
| `nova-ep1-david-1080x1920-upload.mp4` | 1080p supersampled from the 4K, H.264 High, high bitrate; stereo and binaural | Instagram Reels, TikTok and other 1080p uploads |
| `nova-ep1-david-1080x1920-web.mp4` | 1080p, H.264, under 95 MB, stereo | the website and quick sharing (one file, no joining) |

The two large files are split into 95 MB parts because GitHub limits each file to 100 MB. Join them after downloading:

```sh
# macOS / Linux, in the folder with the parts
cat nova-ep1-david-4k-2160x3840-hevc10.mp4.part-* > nova-ep1-david-4k-2160x3840-hevc10.mp4
cat nova-ep1-david-1080x1920-upload.mp4.part-* > nova-ep1-david-1080x1920-upload.mp4
shasum -a 256 -c SHA256SUMS      # every line should end in OK
```

```bat
:: Windows (Command Prompt)
copy /b nova-ep1-david-4k-2160x3840-hevc10.mp4.part-00+nova-ep1-david-4k-2160x3840-hevc10.mp4.part-01+... nova-ep1-david-4k-2160x3840-hevc10.mp4
```

To fetch everything at once: `git clone --depth 1 --branch claude/cosmic-david-goliath-film-cmezxu-hd-downloads https://github.com/TehbynDFRNT/ClaudeCloud nova-hd` and run the `cat` lines inside `nova-hd`.

The binaural track is the same mix placed around the listener with HRTF filters (the guns and the fly-by around and behind you, the new star's shimmer above): pick it in your player's audio track menu and use headphones. Uploads use the first (stereo) track.
