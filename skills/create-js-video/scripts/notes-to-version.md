# notes-to-version.py

Turns the director's notes into the next version's work list. The input is the Edit Room's "Copy notes" text, its
`notes.md`, or free text. The output has one entry per note:

- timecode, frame, shot, pin and the note in his exact words
- a guessed kind: picture, sound, edit, text or standing rule
- the note's scene, what editing that scene module re-renders **in every cut**, and each cut's own variant of the
  scene's shots (cut-specific presets and params, such as `F30.3-chains` in the Prometheus cut)
- for a standing rule, every cut-specific variant in the film to audit
- for a pure sound note, the mix as its scope and no scene re-render

```bash
python3 scripts/notes-to-version.py notes.txt --next 5 > docs/NOTES-v5.md       # every film-plan*.json at the root
python3 scripts/notes-to-version.py notes.txt --plan film-plan.json,film-plan-sol.json --json
python3 scripts/notes-to-version.py notes.txt --no-plans                          # notes only
```

Input lines it understands:
```
David (Render 4, render 4)
1. 01:25:00 (frame 2040, F29.1) [open] {sling} @ 45%,30%
   The hands look weird just do no hands
```
Free paragraphs become notes of their own, so nothing the director wrote is dropped.

- Kinds come from keywords. Correct them before acting.
- "Standing rule" means the note applies to the whole film and every later version, for example "just do no hands".
  Record it with the director's preferences, not only on one shot.
- The plans default to every `film-plan*.json` at the repository root, `film-plan.json` first. A note is placed in
  the plan of the cut its header names ("David (Render 4 ...)" → the plan whose cut, id or title says david), else
  in the first plan.
- The scene lines show what a scene-module edit would re-render, counting the note's own shot. Prefer a preset or
  params change when only one shot should change, especially late in a project.

Provenance: new for the skill. The format is what Nova's `src/review/editroom.html` "Copy notes" and
`tools/editroom-serve.mjs` produce. Tested on a sample containing the "no hands" note, a loudness note, a resolved
edit note and a free-text line, and, after the multi-plan change, on the three Nova v4 plans: the "no hands" note
lists F29.1, F30.3 (`F30.3-chains`) and S29b-drawing as studies variants and the statue inserts as params variants;
the loudness note gets the mix as its scope. An earlier version read one plan, so it never showed the Prometheus
chains study, and it said "re-renders 8 shot(s)" while listing 7.
