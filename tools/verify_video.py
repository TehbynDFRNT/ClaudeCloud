#!/usr/bin/env python3
"""Full decode + container checks against a film plan; does not assess perceived quality."""
import argparse
from fractions import Fraction
import json
from pathlib import Path
import subprocess
import sys


def run(argv):
    return subprocess.run(argv, capture_output=True, text=True, check=True).stdout


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('video', type=Path)
    p.add_argument('--plan', type=Path, required=True)
    p.add_argument('--out', type=Path)
    args = p.parse_args()
    errors, warnings = [], []
    plan = json.loads(args.plan.read_text())
    from validate_plan import validate
    structure = validate(plan, args.plan.resolve().parent, allow_missing=True)
    if not structure['ok']: raise ValueError('Invalid plan: ' + '; '.join(structure['errors']))
    info = json.loads(run(['ffprobe', '-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', str(args.video)]))
    videos = [s for s in info['streams'] if s['codec_type'] == 'video']
    audios = [s for s in info['streams'] if s['codec_type'] == 'audio']
    if not videos: raise ValueError('No video stream')
    v = videos[0]
    for field in ('width', 'height'):
        if v.get(field) != plan[field]: errors.append(f'{field}: expected {plan[field]}, got {v.get(field)}')
    actual_rate = Fraction(v.get('avg_frame_rate', '0'))
    if actual_rate != Fraction(str(plan['fps'])): errors.append(f"fps: expected {plan['fps']}, got {actual_rate}")
    actual_frames = int(v.get('nb_read_frames', v.get('nb_frames', -1)))
    if actual_frames != plan['frames']: errors.append(f"frames: expected {plan['frames']}, got {actual_frames}")
    checks = plan.get('checks', {})
    if not isinstance(checks, dict): raise ValueError('checks must be an object')
    if checks.get('audioRequired', bool(plan.get('audio'))) and not audios: errors.append('Required audio stream is missing')
    for key, field in [('videoCodec', 'codec_name'), ('pixelFormat', 'pix_fmt')]:
        if key in checks and v.get(field) != checks[key]: errors.append(f'{key}: expected {checks[key]}, got {v.get(field)}')
    if len(videos) > 1: warnings.append('Multiple video streams; contract comparisons use the first')
    if abs(float(v.get('start_time', 0))) > 1 / float(Fraction(str(plan['fps']))): warnings.append('Video does not begin near timestamp zero; inspect mux timing')
    run(['ffmpeg', '-v', 'error', '-xerror', '-i', str(args.video), '-map', '0:v:0', '-map', '0:a?', '-f', 'null', '-'])
    report = {'ok': not errors, 'video': str(args.video.resolve()), 'fullDecode': True,
              'width': v['width'], 'height': v['height'], 'fps': str(actual_rate), 'frames': actual_frames,
              'audioStreams': len(audios), 'errors': errors, 'warnings': warnings,
              'scope': 'Structural and decode checks only; inspect actual picture, pacing and encoded sound.'}
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))
    return 0 if report['ok'] else 1


if __name__ == '__main__':
    try: sys.exit(main())
    except (OSError, ValueError, KeyError, TypeError, ZeroDivisionError, subprocess.CalledProcessError) as e:
        detail = e.stderr if isinstance(e, subprocess.CalledProcessError) else str(e)
        print(json.dumps({'ok': False, 'errors': [detail]}), file=sys.stderr)
        sys.exit(1)
