#!/usr/bin/env python3
"""Turn the director's notes (the Edit Room's "Copy notes" text, or its notes.md) into the work list of the next
version: one entry per note with its timecode, frame, shot, pin and words, plus a first guess at the kind of change
and, with --plan, what a change to that shot's scene would re-render.

    notes-to-version.py notes.txt --plan film-plan.json --next 5 > docs/NOTES-v5.md
    pbpaste | notes-to-version.py - --plan film-plan.json --json

Accepted input (several cuts may be pasted one after another):
    David (Render 4, render 4)
    1. 01:25:00 (frame 2040, F29.1) [open] {sling} @ 45%,30%
       The hands look weird
    - [ ] **01:25:00** (frame 2040) · F29.1 · pin 45% across, 30% down        (notes.md from serve.mjs)
      The hands look weird
Free text without that structure is kept as one note per paragraph, so nothing the director wrote is lost.

The kind is a keyword guess (sound / edit / text / picture / standing rule): correct it before acting. Notes that
apply to the whole film ("no hands", "never flash") are standing rules: they go into every later version and into
the skill's director preferences, not just one shot.

Provenance: new for the create-js-video skill; the input format is the one src/review/editroom.html "Copy notes"
and tools/editroom-serve.mjs notes.md produce in the "Nova, Episode 1" project (ClaudeCloud, Oct 2026).
"""
import argparse
import json
import re
import sys

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


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('notes', help="the notes text file, or - for stdin")
    ap.add_argument('--plan', help='film-plan.json: map each shot to its scene and the shots sharing it')
    ap.add_argument('--next', help='the version these notes become (for the heading)')
    ap.add_argument('--json', action='store_true')
    a = ap.parse_args()
    text = sys.stdin.read() if a.notes == '-' else open(a.notes).read()
    notes = parse(text.splitlines())
    plan = json.load(open(a.plan)) if a.plan else None
    if plan:
        by_id = {s['id']: s for s in plan['shots']}
        for n in notes:
            s = by_id.get(n['shot'] or '') or (next((x for x in plan['shots'] if n['frame'] is not None and x['start'] <= n['frame'] < x['end']), None))
            if s:
                n['scene'] = s['scene']
                n['shotSpan'] = [s['start'], s['end']]
                n['sceneShots'] = [x['id'] for x in plan['shots'] if x['scene'] == s['scene']]
    if a.json:
        print(json.dumps(notes, indent=1, ensure_ascii=False))
        return 0
    cuts = sorted({n['cut'] or 'Film' for n in notes})
    print(f"# Director's notes{' → v' + a.next if a.next else ''}: {', '.join(cuts)}\n")
    print(f"{len(notes)} note(s), {sum(1 for n in notes if n['status'] != 'resolved')} open. Kinds are guesses: correct them. "
          f"Standing rules apply to every later version.\n")
    for n in notes:
        head = ' · '.join(x for x in [n['timecode'], f"frame {n['frame']}" if n['frame'] is not None else None, n['shot'],
                                      f"pin {n['pin'][0]}%,{n['pin'][1]}%" if n['pin'] else None, n['cut']] if x)
        print(f"## {n['id']}. {head or 'unplaced note'}  [{n['status']}]\n")
        for line in (n['text'] or '(no text)').split('\n'):
            print(f'> {line}')
        print()
        print(f"- Kind: {', '.join(n['kind'])}")
        if n.get('scene'):
            others = [x for x in n['sceneShots'] if x != n['shot']]
            print(f"- Scene: `{n['scene']}` (frames {n['shotSpan'][0]}-{n['shotSpan'][1]}). Editing this scene's module re-renders "
                  f"{len(n['sceneShots'])} shot(s){': ' + ', '.join(others[:12]) + (' ...' if len(others) > 12 else '') if others else ''}; "
                  f"a preset/params change re-renders only this shot.")
        print('- Change: ')
        print('- Where: plan (gated by version) / preset or params / new scene module / score DESIGN.v<N> / engine (re-renders everything)')
        print('- Verify: frames to look at, or the measurement (loudness-rebalance.py) that shows it is done')
        print('- Status: todo\n')
    return 0


if __name__ == '__main__':
    sys.exit(main())
