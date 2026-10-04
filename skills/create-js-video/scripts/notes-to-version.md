# notes-to-version.py

Turns the director's notes into the next version's work list. The input is the Edit Room's "Copy notes" text, its
`notes.md`, or free text. The output has one entry per note:

- timecode, frame, shot, pin and the note in his exact words
- its kind: from the note's Edit Room tag (`{Sound}`, `{Picture}`, `{Edit}`, `{Text}`), else a keyword guess;
  "standing rule" is added whenever the words apply to the whole film
- the note's scene, what editing that scene module re-renders **in every cut**, and each cut's own variant of the
  scene's shots (cut-specific presets and params, such as `F30.3-chains` in the Prometheus cut)
- for a standing rule, every cut-specific variant in the film to audit
- for a sound note, the mix as its scope and no scene re-render

```bash
python3 $SKILL/scripts/notes-to-version.py notes.txt --next 5 > docs/NOTES-v5.md       # every film-plan*.json at the root
python3 $SKILL/scripts/notes-to-version.py notes.txt --plan film-plan.json,film-plan-sol.json --json
python3 $SKILL/scripts/notes-to-version.py notes.txt --no-plans                          # notes only
```

Input lines it understands (the real "Copy notes" format, timecode `HH:MM:SS:FF`):
```
David (Render 4.2, render 4)
1. 00:01:25:00 (frame 2040, F29.1) [open] {Picture} @ 45%,30%
   The hands look weird just do no hands
2. 00:01:55:00 (frame 2790, S22-ignition) [open] {Sound} @ 50%,50%
   Explosion 15% lower
```
Free paragraphs become notes of their own, so nothing the director wrote is dropped.

- Kinds come from the tags first: they are the director's own classification. A note without a known tag gets a
  keyword guess; sound words include "explosion", "stem", "cue", "cannons" and "<n>% lower/higher/louder/quieter".
  Correct the kinds before acting.
- "Standing rule" means the note applies to the whole film and every later version, for example "just do no hands".
  Record it with the director's preferences, not only on one shot.
- The plans default to every `film-plan*.json` at the repository root, `film-plan.json` first, **one per cut**.
  Size or master variants are skipped with a note on stderr: a plan with a `masterGrade`, or an id ending in
  `-<W>x<H>` (`david-916-v4-2160x3840`, from `film-plan-4k.json`). They share the cut's shots and would list every
  David entry twice. Two plans of the same cut (`plan.cut`, or the id minus the size suffix) keep the first. Name a
  variant with `--plan` to include it. A note is placed in the plan of the cut its header names ("David (Render 4
  ...)" → the plan whose cut, id or title says david), else in the first plan.
- The scene lines show what a scene-module edit would re-render, counting the note's own shot. Prefer a preset or
  params change when only one shot should change, especially late in a project.

Provenance: new for the skill. The format is what Nova's `src/review/editroom.html` "Copy notes" and
`tools/editroom-serve.mjs` produce. Tested at the repository root of Nova at commit e8fe683 (four plans there:
David, Prometheus and Sol v4, plus the David 4K master plan):
- `{Picture}` "The hands look weird just do no hands": kind standing rule + picture; lists F29.1, F30.3
  (`F30.3-chains` in Prometheus) and S29b-drawing as studies variants and the statue inserts as params variants.
- `{Sound}` "Explosion 15% lower": kind sound, scope the mix.
- The same words with no tag: sound (the "15% lower" pattern). `{Edit}` "Hold this two beats longer": edit.
- `film-plan-4k.json` skipped by default (three cuts read), included with `--plan film-plan.json,film-plan-4k.json`.

An earlier version ignored the tags: "{Sound} Explosion 15% lower" came out as "Kind: picture" with the `nova`
scene's 6 shots per cut as its re-render scope, and the 4K plan was read as a fourth cut, so every count and
variant list held a duplicate David entry. Before that, a version read one plan, so it never showed the Prometheus
chains study, and it said "re-renders 8 shot(s)" while listing 7.
