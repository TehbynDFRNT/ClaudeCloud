#!/usr/bin/env python3
"""Turn the director's notes (the Edit Room's "Copy notes" text, or its notes.md) into the work list of the next
version: one entry per note with its timecode, frame, shot, pin and words, a first guess at the kind of change, and
what changing it would re-render IN EVERY CUT: the plans are every film-plan*.json at the repository root unless
--plan names them, so each cut's own variant of the touched scene (cut-specific presets and params) is listed too.

    notes-to-version.py notes.txt --next 5 > docs/NOTES-v5.md            # every film-plan*.json at the root
    notes-to-version.py notes.txt --plan film-plan.json,film-plan-sol.json --json

Accepted input (several cuts may be pasted one after another):
    David (Render 4, render 4)
    1. 01:25:00 (frame 2040, F29.1) [open] {sling} @ 45%,30%
       The hands look weird
    - [ ] **01:25:00** (frame 2040) · F29.1 · pin 45% across, 30% down        (notes.md from serve.mjs)
      The hands look weird
Free text without that structure is kept as one note per paragraph, so nothing the director wrote is lost.

The kind is a keyword guess (sound / edit / text / picture / standing rule): correct it before acting. Notes that
apply to the whole film ("no hands", "never flash") are standing rules: they go into every later version and into
the skill's director preferences, not just one shot; their entry lists every cut-specific variant to audit. Pure
sound notes get the mix as their scope, with no scene re-render.

Provenance: new for the create-js-video skill; the input format is the one src/review/editroom.html "Copy notes"
and tools/editroom-serve.mjs notes.md produce in the "Nova, Episode 1" project (ClaudeCloud, Oct 2026).
"""
import argparse
import glob
import json
import os
import re
import subprocess
import sys

DESCRIPTIVE = ('purpose', 'action', 'framing', 'note')   # shot fields the fingerprint ignores

COPY = re.compile(r'^\s*(\d+)\.\s+(\S+)\s+\(frame\s+(\d+),\s*([^)]*)\)\s*(?:\[(\w+)\])?\s*(?:\{([^}]*)\})?\s*(?:@\s*(\d+)%\s*,\s*(\d+)%)?\s*$')
MD = re.compile(r'^\s*-\s*\[( |x)\]\s*\*\*([^*]*)\*\*\s*\(frame\s+(\d+|\?)\)\s*·\s*([^·]*?)\s*(?:·\s*pin\s+(\d+)%\s*across,\s*(\d+)%\s*down)?\s*$')
HEADER = re.compile(r'^(\S.*?)\s+\((.*?render.*?)\)\s*$')
KINDS = [
    ('standing rule', r'\b(never|always|no more|don\'t ever|everywhere|whole film|all cuts|just do no|no hands?)\b'),
    ('sound', r'\b(loud|louder|quiet|quieter|volume|sound|music|audio|db|bass|mix|cannon|boom|silence|hit|score|tempo)\b'),
    ('edit', r'\b(cut|shorter|longer|hold|timing|earlier|later|beat|faster|slower|pace|trim|extend|order|move)\b'),
    ('text', r'\b(text|title|font|word|words|typo|spell|caption|credit|name)\b'),
]


def kind_of(text):
    t = text.lower()
    hits = [k for k, rx in KINDS if re.search(rx, t)]
    if hits == ['standing rule']:
        hits.append('picture')   # a rule about what is drawn ("no hands") is a picture change in every shot it touches
    return hits or ['picture']


def parse(lines):
    notes, cut, cur = [], None, None
    para = []

    def flush_para():
        if para and any(x.strip() for x in para):
            notes.append({'cut': cut, 'n': len(notes) + 1, 'timecode': None, 'frame': None, 'shot': None, 'status': 'open',
                          'tags': [], 'pin': None, 'text': ' '.join(x.strip() for x in para).strip(), 'structured': False})
        para.clear()
    for raw in lines:
        line = raw.rstrip('\n')
        m = COPY.match(line) or MD.match(line)
        h = HEADER.match(line) if not m else None
        if m and COPY.match(line):
            flush_para()
            g = m.groups()
            cur = {'cut': cut, 'n': int(g[0]), 'timecode': g[1], 'frame': int(g[2]), 'shot': g[3].strip(), 'status': g[4] or 'open',
                   'tags': [x.strip() for x in (g[5] or '').split(',') if x.strip()], 'pin': [int(g[6]), int(g[7])] if g[6] else None,
                   'text': '', 'structured': True}
            notes.append(cur)
        elif m:
            flush_para()
            g = m.groups()
            cur = {'cut': cut, 'n': len(notes) + 1, 'timecode': g[1].strip(), 'frame': None if g[2] == '?' else int(g[2]),
                   'shot': g[3].strip(), 'status': 'resolved' if g[0] == 'x' else 'open', 'tags': [],
                   'pin': [int(g[4]), int(g[5])] if g[4] else None, 'text': '', 'structured': True}
            notes.append(cur)
        elif h and not line.startswith(' '):
            flush_para()
            cut, cur = h.group(1), None
        elif line.startswith('## '):
            flush_para()
            cut, cur = line[3:].strip(), None
        elif cur is not None and (line.startswith(' ') or line.startswith('\t')) and line.strip():
            cur['text'] = (cur['text'] + '\n' + line.strip()).strip()
        elif not line.strip():
            flush_para()
            cur = None if cur is not None and cur['text'] else cur
        elif cur is None and not line.startswith('#') and not re.match(r'^\d+ note\(s\)', line):
            para.append(line)
    flush_para()
    for i, n in enumerate(notes):
        n['id'] = i + 1
        n['kind'] = kind_of(n['text'])
    return notes


def find_plans(given):
    files = [f for g in given for f in g.split(',') if f.strip()]
    if not files:
        r = subprocess.run(['git', 'rev-parse', '--show-toplevel'], capture_output=True, text=True)
        root = r.stdout.strip() if r.returncode == 0 and r.stdout.strip() else os.getcwd()
        files = sorted(glob.glob(os.path.join(root, 'film-plan*.json')), key=lambda f: (os.path.basename(f) != 'film-plan.json', f))
    return [(f, json.load(open(f))) for f in files]


def label(path, plan):
    return plan.get('id') or os.path.basename(path)


def plan_for(note, plans):
    """the plan of the cut the note was written on (its header names the cut); else the first plan"""
    cut = (note.get('cut') or '').lower().split()
    if cut:
        for path, plan in plans:
            names = ' '.join(str(plan.get(k, '')) for k in ('cut', 'id', 'title')).lower() + ' ' + os.path.basename(path).lower()
            if cut[0] in names:
                return path, plan
    return plans[0]


def pixel(shot):
    return json.dumps({k: v for k, v in (shot or {}).items() if k not in DESCRIPTIVE}, sort_keys=True)


def variants(plans, ids):
    """for each shot id whose pixel entry differs between the plans: {plan label: how that cut draws it}"""
    out = {}
    for sid in ids:
        per = [(label(p, pl), next((x for x in pl['shots'] if x['id'] == sid), None)) for p, pl in plans]
        if len({pixel(s) for _, s in per}) < 2:
            continue
        params = [(s or {}).get('params') or {} for _, s in per]
        keys = sorted({k for pr in params for k in pr if len({json.dumps(q.get(k), sort_keys=True) for q in params}) > 1})
        out[sid] = {lab: ('(absent)' if s is None else (s.get('preset') or s['id']) +
                          (' ' + ','.join(f"{k}={json.dumps((s.get('params') or {}).get(k))}" for k in keys) if keys else ''))
                    for lab, s in per}
    return out


def only_sound(kinds):
    return 'sound' in kinds and not ({'picture', 'edit', 'text', 'standing rule'} & set(kinds))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('notes', help="the notes text file, or - for stdin")
    ap.add_argument('--plan', action='append', default=[],
                    help='plan file(s), repeatable or comma-separated (default: every film-plan*.json at the repository root)')
    ap.add_argument('--no-plans', action='store_true', help='notes only, no scene scope')
    ap.add_argument('--next', help='the version these notes become (for the heading)')
    ap.add_argument('--json', action='store_true')
    a = ap.parse_args()
    text = sys.stdin.read() if a.notes == '-' else open(a.notes).read()
    notes = parse(text.splitlines())
    plans = [] if a.no_plans else find_plans(a.plan)
    every_id = list(dict.fromkeys(s['id'] for _, pl in plans for s in pl['shots']))
    all_variants = variants(plans, every_id) if len(plans) > 1 else {}
    for n in notes:
        if not plans:
            continue
        if only_sound(n['kind']):
            n['scope'] = 'mix'
            continue
        path, plan = plan_for(n, plans)
        s = next((x for x in plan['shots'] if x['id'] == (n['shot'] or '')), None) or \
            next((x for x in plan['shots'] if n['frame'] is not None and x['start'] <= n['frame'] < x['end']), None)
        if not s:
            n['scope'] = 'unplaced'
            continue
        n['scope'] = 'scene'
        n['plan'] = label(path, plan)
        n['scene'] = s['scene']
        n['shotId'] = s['id']
        n['shotSpan'] = [s['start'], s['end']]
        n['sceneShots'] = {label(p, pl): [x['id'] for x in pl['shots'] if x['scene'] == s['scene']] for p, pl in plans}
        n['variants'] = {k: v for k, v in all_variants.items()
                         if any(x['id'] == k and x['scene'] == s['scene'] for _, pl in plans for x in pl['shots'])}
    if a.json:
        print(json.dumps({'plans': [label(p, pl) for p, pl in plans], 'notes': notes}, indent=1, ensure_ascii=False))
        return 0
    cuts = sorted({n['cut'] or 'Film' for n in notes})
    print(f"# Director's notes{' → v' + a.next if a.next else ''}: {', '.join(cuts)}\n")
    print(f"{len(notes)} note(s), {sum(1 for n in notes if n['status'] != 'resolved')} open. Kinds are guesses: correct them. "
          f"Standing rules apply to every later version.")
    if plans:
        print(f"Plans read (one per cut): {', '.join(label(p, pl) for p, pl in plans)}.")
    print()
    by_scene = {}
    for sid, v in all_variants.items():
        sc = next(x['scene'] for _, pl in plans for x in pl['shots'] if x['id'] == sid)
        by_scene.setdefault(sc, []).append(sid)
    for n in notes:
        head = ' · '.join(x for x in [n['timecode'], f"frame {n['frame']}" if n['frame'] is not None else None, n['shot'],
                                      f"pin {n['pin'][0]}%,{n['pin'][1]}%" if n['pin'] else None, n['cut']] if x)
        print(f"## {n['id']}. {head or 'unplaced note'}  [{n['status']}]\n")
        for line in (n['text'] or '(no text)').split('\n'):
            print(f'> {line}')
        print()
        print(f"- Kind: {', '.join(n['kind'])}")
        if n.get('scope') == 'mix':
            print('- Scope: the mix (score `DESIGN.v<N>`): re-render the audio, re-mux, measure with loudness-rebalance.py. '
                  'No picture re-renders.')
        elif n.get('scope') == 'unplaced':
            print('- Scope: no shot found for this frame or shot id in the plans read: place it by hand.')
        elif n.get('scope') == 'scene':
            counts = ', '.join(f'{k} {len(v)}' for k, v in n['sceneShots'].items())
            mine = n['sceneShots'].get(n['plan'], [])
            others = [x for x in mine if x != n['shotId']]
            print(f"- Scene: `{n['scene']}` ({n['shotId']}, frames {n['shotSpan'][0]}-{n['shotSpan'][1]} of {n['plan']}). "
                  f"A preset/params change re-renders only this shot.")
            print(f"- Editing the `{n['scene']}` module (or any file it imports) re-renders every `{n['scene']}` shot of every cut "
                  f"and version, plus their dissolve partners: {counts} shot(s). In {n['plan']}: {n['shotId']}"
                  f"{' and ' + ', '.join(others[:12]) + (' ...' if len(others) > 12 else '') if others else ''}.")
            if n['variants']:
                print(f"- Each cut draws its own variant of these `{n['scene']}` shots (cut-specific presets/params): check every one.")
                for sid, v in n['variants'].items():
                    print(f"  - {sid}: " + ' · '.join(f'{k} {d}' for k, d in v.items()))
        if 'standing rule' in n['kind']:
            print('- Standing rule: it applies to every shot of every cut and every later version, not only this one. Before '
                  'delivery, grep the scene code and look at contact sheets of every cut (contact-sheet.py --plan <each plan> --shots ...).')
            if by_scene:
                print('  Cut-specific variants to audit in every cut: ' + '; '.join(
                    f"{sc}: {', '.join(ids[:12])}{' ...' if len(ids) > 12 else ''}" for sc, ids in by_scene.items()) + '.')
            elif len(plans) < 2:
                print('  Only one plan was read: pass every cut\'s plan (or run at the repository root) to list the variants.')
        print('- Change: ')
        print('- Where: plan (gated by version) / preset or params / new scene module / score DESIGN.v<N> / engine (re-renders everything)')
        print('- Verify: frames to look at, or the measurement (loudness-rebalance.py) that shows it is done')
        print('- Status: todo\n')
    return 0


if __name__ == '__main__':
    sys.exit(main())
