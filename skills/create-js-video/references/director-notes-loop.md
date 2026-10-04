# The director's notes loop: versions, standing rules, working together

A code-rendered film improves in rounds: deliver a version, receive numbered notes, make the next version, and keep
the delivered one reproducible. This file covers how to run a round, and how this director likes to work.

## Contents
1. The shape of a round
2. Reading the notes
3. Where each kind of change goes
4. Versioning rules
5. Verifying a note is done
6. Judge panels and department workflows: a recipe
7. The notes-round checklist
8. Working with the director
9. A worked example: Nova v3 → v4

## 1. The shape of a round

```
delivered vN (frozen plans-vN/, tagged commit, dist/<cut>-vN/, downloads branch)
   │  director's notes: numbered list with timecode, frame, shot, pin (Edit Room "Copy notes")
   ▼
work list (notes-to-version.py) → classify → plan/preset/score changes gated by v(N+1)
   ▼
render only what changed (fingerprints) → helpers if big → collect → assemble → verify
   ▼
before/after sheets, measured audio → early cut → final → deliver v(N+1) → freeze it
```

## 2. Reading the notes

- The notes arrive as `N. <timecode> (frame F, <shot>) [open] {tags} @ x%,y%` plus his words. Treat that list as
  the main input of the next version. Run `scripts/notes-to-version.py notes.txt --next N+1` at the repository
  root. It reads every `film-plan*.json` (or the plans `--plan` names), so each entry lists the scene the note
  touches, what editing that scene re-renders in every cut, and **every cut's own variant** of that scene (Nova's
  F29.1 is `F29.1-sling`, `F29.1-sol` and `F29.1-eagle`; F30.3 is `F30.3-chains` in the Prometheus cut). Reading
  only the cut the note was written on is how the Prometheus fist survived the "no hands" note. Pure sound notes
  get the mix as their scope, with no scene re-render.
- Keep his exact words next to each change, in the work list, in code comments, and in commit messages (Nova:
  `// v4 (the director's note on v3): the explosion 15% lower ...`).
- **Standing rules** are notes about the whole film or about taste: "just do no hands", "no white flash", "the same
  angle every time". They apply to every cut and every later version. Record them where the next session will read
  them: the plan builder's comments, the art bible, and the skill's director preferences.
- When a note is ambiguous, pick the reading that matches his earlier taste, act on it, and say in one line which
  reading you took ("read 20% louder as +1.6 dB amplitude, measured on the final mix"). Ask only when two readings
  would make different films.
- Notes queued during a render are applied after the current finals ship (Nova kept them in
  `docs/NEXT-VERSION.md`). Don't change the sources under a running final render: every frame rendered after the
  change would be stale.

## 3. Where each kind of change goes

| Note | Change in | Re-renders |
|---|---|---|
| retime, reorder, new or removed shot | the builder's storyboard (musical positions), gated by version | the shots whose entries change, plus their neighbours if boundaries move |
| one shot's look, framing, light | that shot's `preset` or `params` (a new preset id per version or cut) | that shot only |
| a drawing or element used by many shots | a new scene module, or a new lib file only those shots import | only the shots of that module |
| a whole-film look | the engine or shared post | **everything**: plan it, use helpers, and tell him first |
| text, titles | plan `text` (timing, content, style) | the frames the text covers |
| level, balance, sound | the score: `DESIGN.vN`, then measure (audio.md §6) | the mix (about 3 minutes), then a re-mux; no pictures |
| an ending, a sign-off | a new scene + new shots at the end | the new frames only |

Late in a project, the cheapest change that does the job is the right one. Changing the engine is the last resort.

## 4. Versioning rules

- `PLAN_VERSION` in the builder; `const V5 = VERSION >= 5` gates every structural difference.
- New plan id per version (`<cut>-916-v5`), so pieces land in a new `dist/` folder, and pieces shared with v4 are
  copied as twins instead of rendered.
- On delivery: `scripts/freeze-version.sh N` (copies `plans-vN/` and proves every frozen version rebuilds), commit,
  tag the render commit.
- Gate sound in `DESIGN.vN` (applied when `plan.version >= N`).
- Gate pictures through presets and params. A scene must never read `plan.version` (the fingerprint can't see it).
  When a shared scene module must change (a standing rule such as no hands), accept that older versions' pictures
  reproduce only from their tagged commit. Their stale pieces will show up in `status`; that is expected.
- Keep each delivered version's audio reproducible:
  `render-audio.mjs --plan plans-vN/film-plan.json --out out/audio-vN --no-publish`.

## 5. Verifying a note is done

- **Picture**: before/after contact sheets of the same frames (`contact-sheet.py new.mp4 --before old.mp4 --frames
  ...`), looked at, in every cut that has the shot. For creative changes, use a small judge panel, then an
  art-director pass that signs off or sends it back (§6).
- **Sound**: the measurement on the normalised mix, relative to the rest of the film, against the note's target
  (`loudness-rebalance.py`), plus `--verify` on the muxed file.
- **Edit**: frames at the new cut points (`--at cuts`), and the music position each cut lands on.
- **Standing rules**: grep plus sheets of every affected shot in every cut (picture-craft.md §1).
- Mark each note resolved only with that evidence. In the delivery message, say which notes you verified and how.

## 6. Judge panels and department workflows: a recipe

**Tools.** For several agents at once, use the Workflow tool: load the `workflow-authoring` skill before writing a
workflow script, and run one only when the user has opted in (this director asked to "parallelise aggressively").
Without it, run the judges as parallel subagents, or as `create_session` helpers for long jobs. Each judge gets
only its prompt and the sheet paths: never the other judges' answers.

**The sheet.** One before/after sheet per note, the same frames from both encodes, pairs side by side:
```bash
python3 scripts/contact-sheet.py dist/<cut>-v5.mp4 --before dist/<cut>-v4.mp4 --frames 2030,2036,2040,2144 \
    --cols 4 --width 360 --out out/sheets/n1-<cut>.jpg      # 2 pairs a row: "2040 ... before" | "2040 ... after"
```
Make one per cut that has the shot, plus `--at cuts --shots <ids>` for its boundaries.

**Judge prompt** (3 judges; fill the braces):
```
You are judge {k} of 3 for "{film}", note {id}, in the director's words: "{words}".
Look at the sheets with the Read tool: {sheet paths}. Each pair shows the same frame, before (left) and after (right).
Score the AFTER frames from 1 to 5 on each criterion:
  note      the change does what his words ask, read literally
  rules     no hands, fists, fingers or forearms; no white flash; locked framing on a recurring motif;
            approved photography not restyled (any violation scores 1)
  phone     one bold composition, readable at phone size in the frames it has
  continuity matches the neighbouring shots and the other cuts' variants of the same shot
  craft     no artefacts, swimming, pops, banding or clipped text
Reply with JSON only: {"scores": {"note": n, "rules": n, "phone": n, "continuity": n, "craft": n},
 "verdict": "pass" | "fail", "worst_frame": <frame>, "why": "<two sentences at most>"}.
Judge only what the sheets show. If you can't tell, say so in "why" and score 3.
```
**Rubric.** A note passes the panel when the median of every criterion is 4 or more and no judge scored `rules`
below 5. Otherwise fix the worst frame the judges named and make new sheets.

**Art-director prompt** (one agent, after the panel passes):
```
You are the art director of "{film}". Note {id}: "{words}". The judges' JSON: {answers}.
Look at the before/after sheets of every cut that has this shot: {paths}, and its cut boundaries: {paths}.
Reply "SIGN OFF: <frames you looked at>" only if the note is met in every cut and no standing rule is broken in any
frame. Otherwise reply "SEND BACK: <frame>: <what to change>".
```
Mark the note resolved only on a sign-off, and quote the frames it names in the delivery message.

**Department workflows** (one agent per scene): give each agent the brief, its scene id, the standing rules, its
files (`src/scenes/<id>.js`, `src/scenes/lib/<id>-*.js`, `media/scenes/<id>/`) and "touch no other file: never the
engine, the builder or another scene". Its deliverable is stills at 540 wide of the first, middle and last frame of
each of its shots (`render.mjs shot <id> --n 3 --w 540`) and the `render.mjs bench` time. Judge those stills with
the panel above before rendering anything at full size.

## 7. The notes-round checklist

1. [ ] Freeze the delivered version if not done: `freeze-version.sh N`, commit, tag the render commit.
2. [ ] Paste the notes into `docs/NOTES-v<N+1>.md` via `notes-to-version.py` (at the root, so it reads every
       cut's plan); keep his words.
3. [ ] Mark standing rules; copy them into the builder's comments, the art bible and the skill's director
       preferences.
4. [ ] For each note, choose the cheapest place to change it (§3), and note what it re-renders.
5. [ ] Bump `PLAN_VERSION` to N+1 (new plan ids); gate every change by version.
6. [ ] Make the changes; rebuild the plans; `validate_plan.py` each; `freeze-version.sh --check`.
7. [ ] Render small first: sandbox and shot stills of every changed shot, in every cut; look at them.
8. [ ] Sound notes: render the mix, measure on the normalised mix, recalibrate (2-3 renders), keep `DESIGN.v<N+1>`.
9. [ ] `chunk.mjs status`: confirm that only the expected pieces are stale or missing. A surprise means something
       global changed (engine, font, grid): find it before rendering.
10. [ ] Render the changed pieces (helpers for anything over about 10 minutes: `helper-prompts.py`, `watch-render.sh`).
11. [ ] Send an early cut as soon as it is watchable (interim or preview), labelled as such.
12. [ ] Assemble, `verify_video.py`, `render-audio.mjs --verify`, contact sheet, standing-rules audit.
13. [ ] Before/after sheets and measurements for each note; mark notes resolved with evidence.
14. [ ] Copies (`encode-copy.py chat|github`), downloads branch, Edit Room build for the new render.
15. [ ] Deliver: download cards plus a short message (delivery.md §8); then freeze v<N+1>.

## 8. Working with the director

- **Act without asking when he has told you to.** Resolve ordinary production decisions yourself; state the
  assumption in one line and carry on.
- **Parallelise aggressively.** Use helper sessions for renders, multi-agent workflows for departments (one agent
  per scene, with a brief and a rule not to touch others' files), and judge panels for creative choices with
  before/after art-director verification (§6).
- **Verify by looking.** Contact sheets (ffmpeg tile) of the encoded file, never the code alone.
- **Keep him posted in short lines.** For example: "v4 statue pieces: 13/17 blocks final, 4 helpers running, ETA
  6 min". No essays mid-render.
- **Separate confirmed facts from guesses.** "Verified by full decode and loudness check" versus "signal-derived,
  not checked by listening". Never claim to have watched or heard something you only measured.
- **Give him files he can keep:** download cards, versions side by side, early cuts while finals render, and only
  the version he chose re-rendered.
- **His taste so far:**
  - no hands; prefer objects and diagrams;
  - no white flashes; the climax is dark and loud;
  - locked, repeated framing for a recurring motif;
  - big Roman-capital titles in an excellent font;
  - his real signature on a sign-off card;
  - the approved photography is not to be restyled when the format changes;
  - phone-first composition.

## 9. A worked example: Nova v3 → v4

His notes on v3 (paraphrased from the plan builder's comments, except the last, which is verbatim), and what each
became:
- One locked statue shot where only the figure turns: `STATUE_LOCK` in the builder (one preset, `drift: 0`,
  per-figure height), gated `V4`. Statue pieces re-rendered on 6 helpers.
- The rotation timed to the length of the film: the turn stayed on the film's clock (`turn` param), so inside each
  insert it barely moves and lands in eye contact in the last shot.
- The explosion 15% lower, the returning music and cannons 20% higher: `DESIGN.v4`. Four renders to land the
  measured change (audio.md §6).
- His 3 s sign-off after the stare: a new `signoff` scene and an `S32-signoff` shot. No engine change, so no other
  piece re-rendered.
- "The hands look weird just do no hands": the studies module was edited. That staled every studies shot in all cuts
  and versions, and the Prometheus chains study still needs the same fix: it is open at the pinned commit
  (picture-craft.md §1). The lessons: audit every cut's variant, and isolate late drawing changes.
