#!/bin/bash
# Phone wallpapers for nova.tehbyn.com, rendered natively from the film's engine at 2160x4680 (19.5:9, larger than
# any phone screen) with the HD master grade, no letterbox and no titles. Writes the downloads (JPEG q95, 4:4:4)
# and the page thumbnails into site/nova/assets/wallpapers/.
#   tools/site-wallpapers.sh
set -e
cd "$(git rev-parse --show-toplevel)"
node tools/make-hd-plan.mjs --out tmp/plan-hd-base.json >/dev/null
node -e 'const p=require("./tmp/plan-hd-base.json");require("fs").writeFileSync("tmp/plan-wallpaper.json",JSON.stringify({...p,id:"david-wallpapers",width:2160,height:4680,format:{...p.format,letterbox:0},effects:(p.effects||[]).filter(e=>e.type!=="letterbox"),text:[]}))'
node tools/render.mjs stills --plan tmp/plan-wallpaper.json --frames 1820,2400,2850,3600,3790 --w 2160 --h 4680 --fmt png --out tmp/wallpapers
python3 - <<'PY'
from PIL import Image
names = {1820: 'filaments', 2400: 'the-eye', 2850: 'eruption', 3600: 'a-new-star', 3790: 'david'}
for f, n in names.items():
    im = Image.open(f'tmp/wallpapers/f{f:05d}.png').convert('RGB')
    im.save(f'site/nova/assets/wallpapers/nova-ep1-{n}-2160x4680.jpg', 'JPEG', quality=95, optimize=True, progressive=True, subsampling=0)
    im.resize((540, 1170), Image.LANCZOS).save(f'site/nova/assets/wallpapers/{n}-t.jpg', 'JPEG', quality=82, optimize=True, progressive=True)
    # the phone-frame preview: enough for a 3x phone, a tenth of the full file
    im.resize((1080, 2340), Image.LANCZOS).save(f'site/nova/assets/wallpapers/{n}-p.jpg', 'JPEG', quality=84, optimize=True, progressive=True)
print('wallpapers written')
PY
