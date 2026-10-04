#!/usr/bin/env node
// Placeholder soundtrack derived from the plan: a soft drone with a tick on every shot start, exactly frames / fps
// long, 48 kHz stereo 16-bit. `chunk.mjs assemble` refuses a silent or missing soundtrack, so the first assembled
// clip needs one. Replace it with the real score (references/audio.md: OfflineAudioContext stems, buses, -16 LUFS).
//
//   node tools/tone-mix.mjs [--plan film-plan.json] [--out out/audio/mix.wav]
// No dependencies. Same output on every run.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const plan = JSON.parse(fs.readFileSync(path.resolve(ROOT, opt('plan', 'film-plan.json')), 'utf8'));
const out = path.resolve(ROOT, opt('out', 'out/audio/mix.wav'));
const [n, d] = String(plan.fps).split('/').map(Number);
const fps = n / (d || 1), SR = 48000;
const N = Math.round((plan.frames / fps) * SR);
const ticks = [...new Set(plan.shots.map((s) => s.start))].map((f) => Math.round((f / fps) * SR));

const data = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const fade = Math.min(1, t / 0.5, (N - i) / SR / 0.5);
  let s = fade * (0.10 * Math.sin(2 * Math.PI * 110 * t) + 0.05 * Math.sin(2 * Math.PI * 164.8 * t));
  for (const k of ticks) if (i >= k && i < k + SR * 0.25) { const u = (i - k) / SR; s += 0.4 * Math.exp(-u / 0.04) * Math.sin(2 * Math.PI * 880 * u); }
  const v = Math.max(-32768, Math.min(32767, Math.round(s * 32767)));
  data.writeInt16LE(v, i * 4); data.writeInt16LE(v, i * 4 + 2);
}
const h = Buffer.alloc(44);
h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SR, 24);
h.writeUInt32LE(SR * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.concat([h, data]));
console.log(`wrote ${path.relative(ROOT, out)}: ${(N / SR).toFixed(3)} s, ${ticks.length} tick(s)`);
