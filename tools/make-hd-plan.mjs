// Derive the HD master plan from the live plan: the same film at a larger size with the master grade.
//   node tools/make-hd-plan.mjs [--in film-plan.json] [--out film-plan-4k.json] [--w 2160] [--h 3840]
// The engine renders resolution-independently (stars, glows, bloom, streaks, shake and blur are authored in
// 1080p units and scaled by uK), so only the size and the grade change. The plan id gains a size suffix, so the
// master's pieces live in their own dist/<id>/ folder and never mix with the delivered 1080p cut.
import fs from 'fs';
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const src = JSON.parse(fs.readFileSync(opt('in', 'film-plan.json'), 'utf8'));
const W = +opt('w', 2160), H = +opt('h', 3840);
// deep blacks: a smaller shadow lift, a black point, a smooth toe, a touch of saturation and contrast, and no
// grain in true black (chosen on stills: the Milky Way keeps its faint stars, the statue its shadow detail)
const masterGrade = { liftScale: 0.12, blackPoint: 0.016, toeGamma: 1.22, toePivot: 0.22, saturation: 1.04, grainFloor: [0.0, 0.07], contrast: 1.02 };
// 3 s blocks: a 4K piece of grainy plasma runs ~133 Mbps at crf 17, so 72 frames stay near 50 MB (GitHub's limit is 100)
const out = { ...src, id: `${src.id}-${W}x${H}`, width: W, height: H, block: +opt('block', 72), masterGrade };
fs.writeFileSync(opt('out', 'film-plan-4k.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`wrote ${opt('out', 'film-plan-4k.json')}: ${out.id}, ${W}x${H}, ${out.frames} frames, master grade`);
