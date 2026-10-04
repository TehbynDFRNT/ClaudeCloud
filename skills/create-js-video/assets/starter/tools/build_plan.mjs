#!/usr/bin/env node
// Plan builder: the storyboard in musical positions -> one film-plan*.json per cut. Never hand-edit a generated plan.
// It honours the two variables scripts/freeze-version.sh needs:
//   PLAN_VERSION=<k>   which version to build (default: the version in progress)
//   PLAN_OUT=<dir>     where to write, relative to the repository root (default: the root)
//
//   node tools/build_plan.mjs && python3 tools/validate_plan.py film-plan.json
//   PLAN_VERSION=1 PLAN_OUT=plans-v1 node tools/build_plan.mjs
//
// Grow it as in references/timeline-and-music.md §3-6: at(bar, eighth) on the fitted grid, measured onsets for hits,
// named authored frame counts, inserts with span, generated beat runs, one entry per cut in CUTS.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VERSION = +(process.env.PLAN_VERSION || 1);   // bump to N+1 when the notes on delivered vN come back
const OUT = path.resolve(ROOT, process.env.PLAN_OUT || '.');
const V2 = VERSION >= 2;                            // gate EVERY structural difference by version
const FPS = 24;

// the bar grid: analysis/grid.json once it has been fitted to the recording; until then a constant tempo
const gridFile = path.join(ROOT, 'analysis/grid.json');
const grid = fs.existsSync(gridFile) ? JSON.parse(fs.readFileSync(gridFile, 'utf8')) : null;
const BPM = 96;                                     // placeholder: 4/4 at 96 bpm = 60 frames a bar
function at(bar, eighth = 0) {                      // bar is 1-based, eighth 0..8 (fractions allowed)
  if (!grid) return Math.round(((bar - 1) * 8 + eighth) * (30 / BPM) * FPS);
  const b = grid.bars[bar - 1], i = Math.floor(eighth);
  const t0 = i >= 8 ? b.end : b.eighths[i], t1 = i + 1 >= 8 ? b.end : b.eighths[i + 1];
  return Math.round((t0 + (eighth - i) * (t1 - t0)) * FPS);   // assumes the recording starts at frame 0
}

const FRAMES = at(5);                               // four bars: 10 s, one 240-frame render block
const SB = [                                        // the storyboard; each shot runs to the next one's start
  { id: 'S01-dawn', start: 0, scene: 'hello', purpose: 'Open on the ring', action: 'A warm ring breathes on a star field; a moon starts its orbit', framing: 'Centred, locked' },
  { id: 'S02-night', start: V2 ? at(2, 4) : at(3), scene: 'hello', purpose: 'The cut on the bar', action: 'Cut to a cold ring; the moon carries on along the same orbit', framing: 'Centred, locked' },
];

const CUTS = {                                      // several cuts: same timing, different presets / text
  hello: { file: 'film-plan.json', id: 'hello-916', cut: 'hello', title: 'Hello', presets: {}, titleText: 'HELLO' },
};

fs.mkdirSync(OUT, { recursive: true });
for (const C of Object.values(CUTS)) {
  const shots = SB.map((s, i) => {
    const o = { ...s, end: i + 1 < SB.length ? SB[i + 1].start : FRAMES };
    if (C.presets[s.id]) o.preset = C.presets[s.id];
    return o;
  });
  const plan = {
    id: `${C.id}-v${VERSION}`,                      // versioned ids from v1: dist/<id>/ never overwrites a delivered version
    cut: C.cut,
    title: C.title,
    version: VERSION,
    fps: `${FPS}/1`,
    frames: FRAMES,
    width: 1080,
    height: 1920,
    backend: 'webgl2-chromium',
    timingMode: grid ? 'grid' : 'constant-tempo placeholder',
    format: { letterbox: 0 },                       // hashed into EVERY frame: keep prose out of format and defaultPost
    defaultPost: {},
    shots,
    overlays: [],
    audio: [{ id: 'tone-mix', generated: true, timelineStart: 0, timelineEnd: FRAMES, sourceInSeconds: 0 }],
    cues: [{ id: 'cut-S02', kind: 'edit', frame: shots[1].start, status: 'verified', confidence: 1,
      evidence: grid ? 'grid downbeat' : `authored: bar ${V2 ? '2.5' : '3'} of the placeholder tempo` }],
    effects: [],
    text: [{ id: 'T01-title', start: at(1, 4), end: at(2, 6), content: C.titleText, style: 'title', fadeIn: 12, fadeOut: 12, minFrames: 36 }],
    assets: [],
    checks: { audioRequired: true, videoCodec: 'h264', pixelFormat: 'yuv420p' },
  };
  fs.writeFileSync(path.join(OUT, C.file), JSON.stringify(plan, null, 1) + '\n');
  console.log(`wrote ${path.relative(ROOT, path.join(OUT, C.file)) || C.file}: ${plan.id}, ${plan.frames} frames, ${shots.length} shots`);
}
