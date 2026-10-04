// Derive the binaural (headphone spatial) plan from the live plan: the same film and score with plan.spatial set, so
// score.js turns the sound design's panners into HRTF panners (guns and fly-by around and behind the listener, the
// new star's shimmer above; the music stays a stereo image in front).
//   node tools/make-spatial-plan.mjs [--in film-plan.json] [--out tmp/film-plan-binaural.json]
//   node tools/render-audio.mjs --plan tmp/film-plan-binaural.json --out out/audio-v4-binaural --no-publish
import fs from 'fs';
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const p = JSON.parse(fs.readFileSync(opt('in', 'film-plan.json'), 'utf8'));
fs.writeFileSync(opt('out', 'tmp/film-plan-binaural.json'), JSON.stringify({ ...p, spatial: { mode: 'binaural' } }));
console.log('wrote', opt('out', 'tmp/film-plan-binaural.json'));
