// Favicons for nova.tehbyn.com from the logo mark (the four-point nova star in gold on the film's black).
//   node tools/site-icons.mjs  -> site/nova/assets/{apple-touch-icon.png,favicon-32.png,favicon.ico}
import { chromium } from 'playwright-core';
import { execFileSync } from 'child_process';
const A = 'site/nova/assets/';
const svg = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${24 + 2 * pad} ${24 + 2 * pad}"><rect x="${-pad}" y="${-pad}" width="${24 + 2 * pad}" height="${24 + 2 * pad}" fill="#040405"/><path d="M12 1.5c.5 5.6 4.9 10 10.5 10.5-5.6.5-10 4.9-10.5 10.5C11.5 16.9 7.1 12.5 1.5 12 7.1 11.5 11.5 7.1 12 1.5z" fill="#e6bf7a"/></svg>`;
const b = await chromium.launch(); const pg = await b.newPage();
for (const [size, pad, file] of [[180, 5, 'apple-touch-icon.png'], [32, 1.5, 'favicon-32.png'], [48, 1.5, 'tmp-48.png'], [16, 1, 'tmp-16.png']]) {
  await pg.setViewportSize({ width: size, height: size });
  await pg.setContent(`<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg(pad)}`);
  await pg.screenshot({ path: A + file, omitBackground: false });
}
await b.close();
execFileSync('python3', ['-c', `from PIL import Image
im=Image.open('${A}tmp-48.png');im.save('${A}favicon.ico',sizes=[(16,16),(32,32),(48,48)])`]);
execFileSync('rm', [A + 'tmp-48.png', A + 'tmp-16.png']);
console.log('icons written');
