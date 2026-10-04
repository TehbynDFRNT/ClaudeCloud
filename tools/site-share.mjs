// The 1080x1920 Instagram story card for nova.tehbyn.com: the graded closing frame (the marble David looking
// into the lens) full bleed, with the title and the address in the site's own face, inside Instagram's safe
// zone (clear of the top ~250 px and the bottom ~340 px, where the app draws its own controls).
//   node tools/site-share.mjs   -> site/nova/assets/share/nova-ep1-story.jpg
import { chromium } from 'playwright-core';
import fs from 'fs';
const A = 'site/nova/assets/';
const b64 = (f) => fs.readFileSync(A + f).toString('base64');
const html = `<!doctype html><style>
@font-face{font-family:"Inter Tight";font-weight:400 600;src:url(data:font/woff2;base64,${b64('fonts/InterTight.woff2')}) format("woff2")}
html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#040405}
/* the poster is the full 1080x1920 frame with the film's letterbox bars: crop to the picture (rows 244-1676) and fill */
.p{position:absolute;inset:0;background:url(data:image/jpeg;base64,${b64('poster.jpg')}) 50% 50%/auto 2575px no-repeat}
.p::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(4,4,5,.35) 0%,transparent 22%,transparent 50%,rgba(4,4,5,.78) 72%,rgba(4,4,5,.92) 100%)}
h1{position:absolute;left:84px;right:84px;top:1232px;margin:0;font:600 108px/.94 "Inter Tight";letter-spacing:-.05em;color:#f4efe6}
h1 span{display:block;color:#e6bf7a}
p{position:absolute;left:88px;right:88px;margin:0;font:400 34px/1.35 "Inter Tight";color:rgba(244,239,230,.86)}
.by{top:1466px}
.url{top:1528px;font-weight:600;color:#f4efe6;letter-spacing:-.01em}
</style><div class="p"></div><h1><span>Nova. Episode 1.</span>David &amp; Goliath.</h1>
<p class="by">A film by Tehbyn Nova, every frame rendered in code.</p><p class="url">nova.tehbyn.com</p>`;
fs.mkdirSync(A + 'share', { recursive: true });
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await pg.setContent(html); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(300);
await pg.screenshot({ path: A + 'share/nova-ep1-story.jpg', type: 'jpeg', quality: 86 }); await b.close();
console.log('wrote', A + 'share/nova-ep1-story.jpg', fs.statSync(A + 'share/nova-ep1-story.jpg').size);
