#!/usr/bin/env python3
"""Contact sheet of a rendered video with ffmpeg: frame-accurate stills, each labelled with its frame number,
timecode and (with --plan) shot id, tiled into one JPEG you can look at with the Read tool.

Pick the frames one of these ways:
    --frames 0,120,2144          exact frames
    --every 48                   every N frames (from --from, to --to)
    --count 24                   N frames evenly spread over the film
    --plan film-plan.json        one frame per shot (--at mid|start|end), or --at cuts: the last frame of each shot
                                 and the first of the next (checks every cut boundary)
--shots narrows --plan to some shots: exact ids or prefixes ('S10' matches 'S10-prometheus'); an id that matches no
shot is an error, so an audit never skips a shot quietly.
--before OTHER.mp4 makes a before/after sheet: each frame appears twice, side by side, the other file's still first
(labelled 'before') and this file's second ('after'); --cols counts stills, so keep it even.
Examples:
    contact-sheet.py dist/film-v4.mp4 --plan film-plan.json --out out/sheets/shots.jpg
    contact-sheet.py dist/film-v4.mp4 --frames 2140,2141,2142,2143,2144 --width 360 --cols 5   # a motion strip
    contact-sheet.py dist/film-v4.mp4 --plan film-plan.json --at cuts --shots F30.3,S29a-ring --out out/sheets/cuts.jpg
    contact-sheet.py dist/film-v5.mp4 --before dist/film-v4.mp4 --frames 2030,2040,2144 --cols 6 --out out/sheets/n1.jpg

Requires only ffmpeg/ffprobe (a DejaVu or fc-match font for labels; without one the stills are unlabelled).
Each still is decoded by an accurate seek, so the label is the frame you see.

Provenance: new for the create-js-video skill. The "Nova, Episode 1" project made sheets inside the renderer
(tools/render.mjs sheet) from source; this one works on any encoded file, which is what the director actually sees.
"""
import argparse
import glob
import json
import os
import shutil
import subprocess
import sys
import tempfile
from fractions import Fraction


def font():
    for p in ['/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
              '/usr/share/fonts/TTF/DejaVuSans.ttf', '/Library/Fonts/Arial.ttf', '/System/Library/Fonts/Helvetica.ttc']:
        if os.path.exists(p):
            return p
    try:
        r = subprocess.run(['fc-match', '-f', '%{file}', 'monospace'], capture_output=True, text=True)
        return r.stdout.strip() or None
    except OSError:
        return None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('video')
    ap.add_argument('--out', default='out/sheets/contact.jpg')
    ap.add_argument('--frames')
    ap.add_argument('--every', type=int)
    ap.add_argument('--count', type=int)
    ap.add_argument('--from', dest='start', type=int, default=0)
    ap.add_argument('--to', type=int)
    ap.add_argument('--plan')
    ap.add_argument('--at', choices=['mid', 'start', 'end', 'cuts'], default='mid')
    ap.add_argument('--shots', help='with --plan: only these shots (comma-separated ids or id prefixes)')
    ap.add_argument('--before', help='another encode of the same film: before/after pairs, side by side')
    ap.add_argument('--cols', type=int, default=6)
    ap.add_argument('--width', type=int, default=270, help='width of each still in pixels')
    ap.add_argument('--quality', type=int, default=3, help='JPEG qscale, 2 (best) to 31')
    a = ap.parse_args()

    info = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-count_packets', '-show_entries',
                                      'stream=r_frame_rate,avg_frame_rate,nb_read_packets,width,height', '-of', 'json', a.video],
                                     capture_output=True, text=True, check=True).stdout)['streams'][0]
    fps = Fraction(info.get('avg_frame_rate') or info['r_frame_rate'])
    total = int(info.get('nb_read_packets') or 0)
    end = min(a.to or total, total) if total else (a.to or 0)
    labels = {}
    if a.frames:
        frames = [int(x) for x in a.frames.split(',') if x.strip()]
    elif a.plan:
        plan = json.load(open(a.plan))
        shots = sorted(plan['shots'], key=lambda s: s['start'])
        want = None
        if a.shots:
            asked = [x.strip() for x in a.shots.split(',') if x.strip()]
            match = lambda w, sid: sid.startswith(w)   # an exact id is its own prefix
            missing = [w for w in asked if not any(match(w, s['id']) for s in shots)]
            if missing:
                raise SystemExit(f"--shots: no shot in {a.plan} matches {', '.join(missing)} (ids: "
                                 f"{', '.join(s['id'] for s in shots[:40])}{' ...' if len(shots) > 40 else ''})")
            want = {s['id'] for s in shots if any(match(w, s['id']) for w in asked)}
        frames = []
        for i, s in enumerate(shots):
            if want and s['id'] not in want:
                continue
            if a.at == 'cuts':
                if i + 1 < len(shots):
                    frames += [s['end'] - 1, shots[i + 1]['start']]
                    labels[s['end'] - 1], labels[shots[i + 1]['start']] = s['id'], shots[i + 1]['id']
                continue
            f = {'start': s['start'], 'end': s['end'] - 1, 'mid': (s['start'] + s['end'] - 1) // 2}[a.at]
            frames.append(f)
            labels[f] = s['id']
    elif a.every:
        frames = list(range(a.start, end, a.every))
    else:
        n = a.count or 24
        frames = [a.start + round(i * (end - 1 - a.start) / max(1, n - 1)) for i in range(n)]
    frames = [f for f in dict.fromkeys(frames) if f >= 0 and (not total or f < total)]
    if not frames:
        raise SystemExit('no frames selected')
    fnt = font()
    stills = [x for f in frames for x in ([(a.before, f, 'before'), (a.video, f, 'after')] if a.before else [(a.video, f, '')])]
    tmp = tempfile.mkdtemp(prefix='sheet-')
    try:
        for k, (src, f, tag) in enumerate(stills):
            t = max(0.0, (f - 0.25) / float(fps))          # accurate seek: the first frame at or after t is frame f
            sec = f / float(fps)
            tc = f"{int(sec // 60):02d}:{int(sec % 60):02d}:{int(round(f % float(fps))):02d}"
            label = f"{f}  {tc}" + (f"  {labels[f]}" if f in labels else '') + (f"  {tag}" if tag else '')
            lf = os.path.join(tmp, f'l{k:04d}.txt')
            open(lf, 'w').write(label)
            vf = f"scale={a.width}:-2:flags=lanczos,pad=iw:ih+22:0:0:color=0x111111"
            if fnt:
                vf += f",drawtext=fontfile={fnt}:textfile={lf}:x=6:y=h-17:fontsize=13:fontcolor=0xdddddd"
            r = subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.6f}', '-i', src, '-frames:v', '1', '-vf', vf,
                                os.path.join(tmp, f's{k:04d}.png')], capture_output=True, text=True)
            if r.returncode:
                raise SystemExit(f'frame {f} of {src}: {r.stderr.strip()[-200:]}')
        cols = min(a.cols, len(stills))
        rows = -(-len(stills) // cols)
        os.makedirs(os.path.dirname(os.path.abspath(a.out)) or '.', exist_ok=True)
        r = subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '1', '-i', os.path.join(tmp, 's%04d.png'),
                            '-vf', f'tile={cols}x{rows}:padding=4:margin=4:color=0x111111', '-frames:v', '1', '-q:v', str(a.quality), a.out],
                           capture_output=True, text=True)
        if r.returncode:
            raise SystemExit(r.stderr.strip()[-300:])
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    print(f"wrote {a.out}: {len(frames)} frames{' x 2 (before, after)' if a.before else ''}, {cols}x{rows}")
    return 0


if __name__ == '__main__':
    sys.exit(main())
