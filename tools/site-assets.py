#!/usr/bin/env python3
"""Build the image and data assets for the nova.tehbyn.com one-pager from the finished film.

  python3 tools/site-assets.py [--master dist/david-916-v4.mp4] [--plates tmp/plates] [--out site/nova/assets]

Stills are cut from the master at exact frame centres ((f + 0.5) / 24 s) and cropped to the active picture
(the film carries 12.7% letterbox bars top and bottom). Plates are wide and tall renders of the coda sky
from the film's own engine (tools/render.mjs sandbox earthsky ... --lb 0), with and without the new star.
Writes site/nova/assets/{stills,story}/, poster.jpg, turn.jpg, pieces.jpg, plate-*.jpg and site-data.json
(waveform, cue marks, statue angles) that tools/site-build.py inlines into index.html.
"""
import argparse, json, math, os, subprocess, sys, wave
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser()
ap.add_argument('--master', default='dist/david-916-v4.mp4')
ap.add_argument('--plates', default='tmp/plates')
ap.add_argument('--out', default='site/nova/assets')
ap.add_argument('--mix', default='out/audio-v4/mix.wav')
a = ap.parse_args()
OUT = ROOT / a.out
MASTER = ROOT / a.master
plan = json.load(open(ROOT / 'film-plan.json'))
FPS = 24
TOP, BOT = 244, 1676                      # active picture rows in the 1080x1920 master

GALLERY = [(360, 'Goliath'), (412, 'David'), (600, 'Two stars'), (1000, 'The stream'), (1180, 'Hot spot'),
           (1550, 'Nuclei'), (1820, 'Filaments'), (2265, 'The ladder'), (2850, 'Eruption'), (2950, 'The shell'),
           (3180, 'Survival'), (3600, 'A new star')]
STORY = [720, 1290, 1710, 2030, 2145, 3380, 3790]
TURN_FRAMES = [521, 808, 1097, 1313, 1501, 2012, 2163, 2231, 2299, 2456, 2601, 3790]   # one per locked insert


def frame(f):
    """Decode frame f of the master as an RGB PIL image."""
    t = (f + 0.5) / FPS
    raw = subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-ss', f'{t:.4f}', '-i', str(MASTER),
                          '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
    return Image.frombytes('RGB', (1080, 1920), raw)


def save(im, path, q=82):
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, 'JPEG', quality=q, optimize=True, progressive=True)


def tc(f):
    s = f // FPS
    return f'{s // 60}:{s % 60:02d}'


cache = {}
def active(f):
    if f not in cache:
        cache[f] = frame(f).crop((0, TOP, 1080, BOT))
    return cache[f]


data = {'gallery': [], 'story': STORY, 'turn': []}
for f, name in GALLERY:
    im = active(f)
    save(im, OUT / 'stills' / f'{f}.jpg', 82)
    save(im.resize((540, 716), Image.LANCZOS), OUT / 'stills' / f'{f}-t.jpg', 80)
    data['gallery'].append({'f': f, 'name': name, 'tc': tc(f), 't': round((f + 0.5) / FPS, 3)})
for f in STORY:
    save(active(f).resize((720, 955), Image.LANCZOS), OUT / 'story' / f'{f}.jpg', 82)
save(frame(3790), OUT / 'poster.jpg', 84)

# the turn: one square per locked statue insert, head and shoulders, in a horizontal sprite
sys.path.insert(0, str(ROOT))
_r = (subprocess.run(['node', '-e', 'import("./src/scenes/lib/statue-rig.js").then(m=>console.log(JSON.stringify('
                                    + json.dumps(TURN_FRAMES) + '.map(f=>m.turnYaw([508,3801,90,0],f)))))'],
                                   cwd=ROOT, capture_output=True, text=True))
if _r.returncode: sys.exit('statue angles: node failed: ' + _r.stderr[-800:])
angles = json.loads(_r.stdout)
S = 400
sprite = Image.new('RGB', (S * len(TURN_FRAMES), S))
for i, f in enumerate(TURN_FRAMES):
    sq = frame(f).crop((0, 300, 1080, 1380)).resize((S, S), Image.LANCZOS)
    sprite.paste(sq, (i * S, 0))
    data['turn'].append({'f': f, 'tc': tc(f), 'deg': round(angles[i])})
save(sprite, OUT / 'turn.jpg', 80)

# the pieces: the film rendered as 17 blocks of 240 frames; one thumbnail per block (its middle frame, or the
# nearest frame that is not near-black: the ignition and the sign-off are dark), at 2x the 48x64 tile drawn
blocks = list(range(0, plan['frames'], 240))
TW, TH = 96, 128
def lum(f):
    g = active(f).convert('L').resize((27, 36)); return sum(g.getdata()) / (27 * 36)
pieces = Image.new('RGB', (TW * len(blocks), TH))
for i, b in enumerate(blocks):
    e = min(b + 240, plan['frames']); mid = (b + e) // 2
    order = sorted(range(b + 4, e - 4, 12), key=lambda f: abs(f - mid))
    pick = next((f for f in order if lum(f) > 20), mid)
    pieces.paste(active(pick).resize((TW, TH), Image.LANCZOS), (i * TW, 0))
save(pieces, OUT / 'pieces.jpg', 80)
data['pieces'] = len(blocks)

# plates: wide for landscape viewports, tall for portrait, each with and without the new star
P = ROOT / a.plates
for kind in ('wide', 'tall'):
    for t, suffix in (('8.00', ''), ('3.00', '-dark')):
        im = Image.open(P / f'{kind}{t}.jpg').convert('RGB')
        save(im, OUT / f'plate-{kind}{suffix}.jpg', 80)

# the score: a peak envelope of the final mix, 0 to 1, in 300 bins
# decode through ffmpeg to 16-bit mono at 8 kHz (the mix is 24-bit stereo)
import array
pcm = subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-i', str(ROOT / a.mix), '-ac', '1', '-ar', '8000',
                      '-f', 's16le', '-'], capture_output=True, check=True).stdout
s = array.array('h', pcm); scale = 32768.0; ch = 1; n = len(s); sr = 8000
BINS = 300
dur = n / sr
env = []
step = n // BINS
for i in range(BINS):
    lo, hi = i * step * ch, (i + 1) * step * ch
    seg = s[lo:hi]
    rms = math.sqrt(sum(x * x for x in seg) / max(1, len(seg))) / scale
    env.append(rms)
peak = max(env) or 1
data['wave'] = [round(min(1, v / peak), 3) for v in env]
data['dur'] = round(dur, 3)
marks = []
for c in plan['cues']:
    if 'cannon' in c.get('kind', ''):
        marks.append({'kind': 'salvo' if 'salvo' in c['kind'] else 'gun', 't': round(c['frame'] / FPS, 3)})
strikes = [s_['start'] for s_ in plan['shots'] if s_['id'].startswith(('S17', 'S18', 'S19', 'S20', 'S21'))]
data['strikes'] = [round(f / FPS, 3) for f in strikes]
dark = next(s_ for s_ in plan['shots'] if s_['id'] == 'S22-dark')
data['dark'] = [round(dark['start'] / FPS, 3), round(next(s_ for s_ in plan['shots'] if s_['id'] == 'S23-eruption')['start'] / FPS, 3)]
data['guns'] = marks
data['frames'] = plan['frames']
json.dump(data, open(OUT.parent / 'site-data.json', 'w'), indent=1)
print('ok', len(data['gallery']), 'stills,', len(STORY), 'story,', len(TURN_FRAMES), 'turn,', len(blocks), 'pieces,', len(marks), 'gun marks')
