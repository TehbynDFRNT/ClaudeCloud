#!/usr/bin/env python3
"""Check film timeline structure and explicitly declared sync, not creative quality."""
import argparse
from fractions import Fraction
import json
import math
from pathlib import Path
import sys


def validate(plan, base, allow_missing=False):
    errors, warnings = [], []
    def err(message): errors.append(message)
    def warn(message): warnings.append(message)
    def integer(x): return type(x) is int
    def number(x): return type(x) in (int, float) and math.isfinite(x)
    if not isinstance(plan, dict):
        return {'ok': False, 'errors': ['Plan must be a JSON object'], 'warnings': []}
    try:
        fps = Fraction(str(plan.get('fps', '0')))
        if fps <= 0: raise ValueError()
    except (ValueError, ZeroDivisionError):
        return {'ok': False, 'errors': ['fps must be a positive rational number/string'], 'warnings': []}
    frames = plan.get('frames')
    if not integer(frames) or frames <= 0:
        return {'ok': False, 'errors': ['frames must be a positive integer'], 'warnings': []}
    for key in ('width', 'height'):
        value = plan.get(key)
        if not integer(value) or value <= 0: err(key + ' must be a positive integer')
        elif value % 2: warn(key + ' is odd; check codec pixel-format requirements')
    groups = {}
    for key in ('shots', 'overlays', 'audio', 'cues', 'text', 'assets'):
        rows = plan.get(key, [])
        if not isinstance(rows, list) or any(not isinstance(x, dict) for x in rows):
            err(key + ' must be a list of objects'); rows = []
        groups[key] = rows
    def identified(rows, kind):
        result = {}
        for i, row in enumerate(rows):
            name = row.get('id')
            if not isinstance(name, str) or not name:
                err(f'{kind}[{i}] needs a nonempty id'); continue
            if name in result: err(f'Duplicate {kind} id: {name}')
            result[name] = row
        return result
    shots = identified(groups['shots'] + groups['overlays'], 'visual')
    audios = identified(groups['audio'], 'audio')
    cues = identified(groups['cues'], 'cue')
    identified(groups['text'], 'text')
    def interval(row, kind, start='start', end='end'):
        a, b = row.get(start), row.get(end)
        if not integer(a) or not integer(b) or not 0 <= a < b <= frames:
            err(f"{kind} {row.get('id', '?')}: require 0 <= {start} < {end} <= frames, integers")
            return False
        return True
    valid_shots = [x for x in groups['shots'] if interval(x, 'shot')]
    if not groups['shots']: err('At least one primary shot is required')
    expected = 0
    for shot in sorted(valid_shots, key=lambda x: x['start']):
        if shot['start'] != expected: err(f"Primary coverage gap/overlap before {shot.get('id', '?')}: expected {expected}, got {shot['start']}")
        expected = shot['end']
        for key in ('purpose', 'action', 'framing'):
            if not isinstance(shot.get(key), str) or not shot[key].strip(): warn(f"Shot {shot.get('id', '?')} lacks {key}")
    if expected != frames: err(f'Primary shots end at {expected}, expected {frames}')
    for row in groups['overlays']: interval(row, 'overlay')
    def local_file(row, kind):
        path = row.get('path')
        if not isinstance(path, str) or not path:
            if not row.get('generated'): err(f"{kind} {row.get('id', '?')} needs a path or generated:true")
        elif '://' in path:
            warn(f'{kind} remote path is not verified locally: {path}')
        elif not (base / path).is_file():
            (warn if allow_missing else err)(f'{kind} missing file: {path}')
    for audio in groups['audio']:
        interval(audio, 'audio', 'timelineStart', 'timelineEnd')
        local_file(audio, 'audio')
        for key, default, positive in [('sourceInSeconds', 0, False), ('playbackRate', 1, True)]:
            value = audio.get(key, default)
            if not number(value) or (value <= 0 if positive else value < 0): err(f"Audio {audio.get('id', '?')}: invalid {key}")
    for asset in groups['assets']: local_file(asset, 'asset')
    for name, cue in cues.items():
        frame = cue.get('frame')
        if not integer(frame) or not 0 <= frame <= frames: err(f'Cue {name}: invalid frame'); continue
        if cue.get('status') not in ('candidate', 'verified'): warn(f'Cue {name}: mark status candidate or verified')
        if not cue.get('evidence'): warn(f'Cue {name}: missing evidence')
        if 'sourceAudioId' in cue:
            audio = audios.get(cue['sourceAudioId'])
            sec = cue.get('sourceSeconds')
            if not audio: err(f'Cue {name}: unknown sourceAudioId'); continue
            if not number(sec) or sec < 0: err(f'Cue {name}: sourceSeconds must be nonnegative'); continue
            start, end = audio.get('timelineStart'), audio.get('timelineEnd')
            trim, rate = audio.get('sourceInSeconds', 0), audio.get('playbackRate', 1)
            if not integer(start) or not integer(end) or not number(trim) or not number(rate) or rate <= 0: continue
            mapped = Fraction(start) + (Fraction(str(sec)) - Fraction(str(trim))) * fps / Fraction(str(rate))
            if not start <= mapped <= end: err(f'Cue {name}: source cue lies outside audio placement')
            if abs(float(mapped) - frame) > 0.500001: err(f'Cue {name}: expected nearest frame to {float(mapped):.6f}, got {frame}')
    for name, row in shots.items():
        a, b = row.get('start'), row.get('end')
        if not integer(a) or not integer(b): continue
        events = row.get('events', [])
        if not isinstance(events, list): err(f'{name}: events must be a list'); events = []
        event_ids = set()
        for event in events:
            if not isinstance(event, dict): err(f'{name}: invalid event'); continue
            eid, ef = event.get('id'), event.get('frame')
            if not isinstance(eid, str) or not eid or eid in event_ids: err(f'{name}: missing/duplicate event id')
            else: event_ids.add(eid)
            if not integer(ef) or not a <= ef < b: err(f'{name}: event frame outside half-open shot interval')
        sync = row.get('sync')
        if sync is None: continue
        if not isinstance(sync, dict): err(f'{name}: sync must be an object'); continue
        cue = cues.get(sync.get('cueId'))
        if not cue or not integer(cue.get('frame')): err(f'{name}: sync needs a valid cueId'); continue
        point = sync.get('point', 'start')
        target = a if point == 'start' else b if point == 'end' else point
        offset, tolerance = sync.get('offsetFrames', 0), sync.get('toleranceFrames', 1)
        if not integer(target) or not a <= target <= b: err(f'{name}: invalid sync point'); continue
        if not integer(offset) or not number(tolerance) or tolerance < 0: err(f'{name}: invalid sync offset/tolerance'); continue
        deviation = target - cue['frame'] - offset
        if abs(deviation) > tolerance: err(f'{name}: sync deviates {deviation} frames from intended anchor')
        if cue.get('status') != 'verified': warn(f'{name}: sync uses an unverified cue')
    for item in groups['text']:
        if not interval(item, 'text'): continue
        if not isinstance(item.get('content'), str): err('Text content must be a string'); continue
        seconds = float(Fraction(item['end'] - item['start']) / fps)
        max_cps, min_frames = item.get('maxCps'), item.get('minFrames')
        if max_cps is not None:
            if not number(max_cps) or max_cps <= 0: err('Text maxCps must be positive')
            elif len(item['content']) / seconds > max_cps: warn(f"Text {item.get('id', '?')} exceeds declared reading budget")
        if min_frames is not None:
            if not integer(min_frames) or min_frames < 0: err('Text minFrames must be nonnegative integer')
            elif item['end'] - item['start'] < min_frames: warn(f"Text {item.get('id', '?')} is shorter than minFrames")
    return {'ok': not errors, 'fps': str(fps), 'frames': frames, 'durationSeconds': float(frames / fps), 'errors': errors, 'warnings': warnings}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('plan', type=Path)
    p.add_argument('--allow-missing', action='store_true')
    args = p.parse_args()
    try: report = validate(json.loads(args.plan.read_text()), args.plan.resolve().parent, args.allow_missing)
    except (OSError, ValueError, TypeError) as e: report = {'ok': False, 'errors': [str(e)], 'warnings': []}
    print(json.dumps(report, indent=2))
    return 0 if report['ok'] else 1


if __name__ == '__main__': sys.exit(main())
