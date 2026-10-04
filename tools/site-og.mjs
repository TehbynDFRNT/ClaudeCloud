// The 1200x630 social card for nova.tehbyn.com: the coda plate with the title in the site's own face.
//   node tools/site-og.mjs   -> site/nova/assets/og.jpg
import { chromium } from 'playwright-core';
import fs from 'fs';
const A = 'site/nova/assets/';
const b64 = (f) => fs.readFileSync(A + f).toString('base64');
const html = `<!doctype html><style>
@font-face{font-family:"Inter Tight";font-weight:400 600;src:url(data:font/woff2;base64,${b64('fonts/InterTight.woff2')}) format("woff2")}
html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:#040405}
.p{position:absolute;inset:0;background:url(data:image/jpeg;base64,${b64('plate-wide.jpg')}) 64% 92%/cover}
.p::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(4,4,5,.7),rgba(4,4,5,.3) 45%,transparent 70%)}
h1{position:absolute;left:72px;top:190px;margin:0;font:600 88px/.94 "Inter Tight";letter-spacing:-.05em;color:#f4efe6}
h1 span{display:block;color:#e6bf7a}
p{position:absolute;left:76px;top:404px;margin:0;font:400 26px/1.4 "Inter Tight";color:rgba(244,239,230,.82)}
</style><div class="p"></div><h1><span>Nova. Episode 1.</span>David &amp; Goliath.</h1><p>A film by Tehbyn Nova. 2 min 48 s, rendered in code.</p>`;
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1200, height: 630 } });
await pg.setContent(html); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(300);
await pg.screenshot({ path: A + 'og.jpg', type: 'jpeg', quality: 86 }); await b.close();
console.log('wrote', A + 'og.jpg', fs.statSync(A + 'og.jpg').size);
