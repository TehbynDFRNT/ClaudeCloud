#!/usr/bin/env python3
"""Write the prompts (and create_session arguments) for parallel render helper sessions: each helper renders one
contiguous range of the film, balanced by what its frames cost, at one FULL commit SHA, and pushes its pieces to
its own outcome branch.

    helper-prompts.py --plan film-plan.json --parts 6 \\
        --log out/frames-1080x1920/render-log.jsonl --scene-cost statue=1400 \\
        --status-json out/status.json            # optional: only what is still missing or stale
    helper-prompts.py --plan film-plan.json --parts 3 --only-scenes statue --tag-prefix st --json > out/helpers.json

Costs per frame (ms), first match wins: --costs (shot id -> ms, from `chunk.mjs costs`), --scene-cost overrides,
the median per scene of render-log.jsonl files (--log, repeatable; render.mjs writes them), --default-ms.
Frames inside a dissolve or bleed count x1.9 (two shots render). With --status-json (`chunk.mjs status --json`) the
frames of final pieces cost nothing; with --only-scenes the other scenes' frames cost nothing. The ranges are a
linear partition of the fixed block grid (--block, default 240) minimising the costliest helper.

The prompt is written for a helper that only ever follows its first message: everything it needs is in it, it
stops and reports instead of improvising, and it never edits code. Start each with create_session (source_url,
source_revision = the full SHA, outcome_branch = <base>-<tag>, the prompt), then watch with watch-render.sh.

Lessons built in ("Nova, Episode 1", ClaudeCloud, Oct 2026): short SHAs fail (ref_not_found), so the full SHA is
resolved here and must already be on the remote; a helper cannot be redirected (start a new one, interrupt and
archive the moot one); git-ignored dist/ needs `git add -f` (chunk.mjs --push does it); balance by the costly frames
(statue ~1.4 s/frame, studies ~0.7-1 s, cosmic shots vary): 6 warm helpers turned ~25 min of statue frames into ~4.
"""
import argparse
import glob
import json
import statistics
import subprocess
import sys

PROMPT = """You are render helper {tag} for "{title}" ({plan_file}, plan id {plan_id}). Follow these steps exactly and do nothing else. You cannot be redirected once you start: if anything differs from what is written here, stop and report it.

1. Put the repository on the exact commit: `git fetch origin {sha}` (an error that it is already present is fine), then `git checkout -B {branch} {sha}`. Run `git rev-parse HEAD`: it must print {sha}. If not, stop and report.
2. If `node_modules` is missing, run `npm ci` (or `npm install` when there is no lockfile).
3. Run, from the repository root:
   {cmd}
   It renders frames {start}-{end} ({minutes} min estimated{scene_note}), encodes each 10 s block's pieces, commits them with `git add -f` (dist/ is git-ignored) and pushes them to {branch}. Let it run to the end; it resumes where it stopped if you run the same command again.
4. Then run `{status_cmd}` and reply with the lines for blocks {start}-{end} and the summary line.

Rules: do not edit, create or delete any tracked file; do not merge, rebase or push to any other branch; do not change the command. If a command fails, run it once more; if it fails again, reply with the exact error text (the last 20 lines) and stop. Keep every reply to a few short lines."""


def git(*args):
    r = subprocess.run(['git', *args], capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(f"git {' '.join(args)}: {r.stderr.strip()}")
    return r.stdout.strip()


def kv(s, conv=float):
    out = {}
    for it in (s or '').split(','):
        if '=' in it:
            k, v = it.split('=', 1)
            out[k.strip()] = conv(v)
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--plan', default='film-plan.json')
    ap.add_argument('--parts', type=int, default=6)
    ap.add_argument('--costs', help='costs.json: shot id -> ms (chunk.mjs costs)')
    ap.add_argument('--log', action='append', default=[], help='render-log.jsonl (glob ok, repeatable): median ms per scene')
    ap.add_argument('--scene-cost', default='', help='scene=ms overrides, e.g. statue=1400,studies=1000')
    ap.add_argument('--default-ms', type=float, default=1000)
    ap.add_argument('--overhead-ms', type=float, default=120, help='capture + encode per frame')
    ap.add_argument('--status-json', help='chunk.mjs status --json output: final pieces cost nothing')
    ap.add_argument('--only-scenes', default='', help='helpers render only these scenes (adds --only-scenes to the command)')
    ap.add_argument('--block', type=int, default=240)
    ap.add_argument('--rev', default='HEAD', help='commit to render (resolved to the full SHA)')
    ap.add_argument('--allow-unpushed', action='store_true')
    ap.add_argument('--branch-base', help='outcome branch prefix (default: the current branch)')
    ap.add_argument('--tag-prefix', default='h')
    ap.add_argument('--reuse-branches', action='store_true', help='allow outcome branches that already exist on the remote')
    ap.add_argument('--cmd', default='node tools/chunk.mjs render --plan {plan} --from {start} --to {end}{scenes} --push')
    ap.add_argument('--status-cmd', default='node tools/chunk.mjs status --plan {plan}')
    ap.add_argument('--json', action='store_true', help='print create_session arguments as JSON')
    a = ap.parse_args()

    plan = json.load(open(a.plan))
    frames = plan['frames']
    sha = git('rev-parse', '--verify', f'{a.rev}^{{commit}}')
    if len(sha) != 40:
        raise SystemExit(f'not a full SHA: {sha}')
    if not a.allow_unpushed and not git('branch', '-r', '--contains', sha):
        raise SystemExit(f'{sha} is on no remote branch: push it first (helpers clone from the remote)')
    base = a.branch_base or git('rev-parse', '--abbrev-ref', 'HEAD')
    repo = git('remote', 'get-url', 'origin')

    # cost per frame
    shot_cost = json.load(open(a.costs)) if a.costs else {}
    samples = {}
    for pat in a.log:
        for f in glob.glob(pat):
            for line in open(f):
                try:
                    r = json.loads(line)
                    samples.setdefault(r['scene'], []).append(r['ms'])
                except (ValueError, KeyError):
                    pass
    scene_cost = {s: statistics.median(v) for s, v in samples.items()}
    scene_cost.update(kv(a.scene_cost))
    only = {s for s in a.only_scenes.split(',') if s}
    per = [0.0] * frames
    for s in plan['shots']:
        ms = shot_cost.get(s['id']) or scene_cost.get(s['scene']) or a.default_ms
        cost = 0.0 if only and s['scene'] not in only else ms + a.overhead_ms
        for f in range(s['start'], min(s['end'], frames)):
            per[f] = cost
    for o in plan.get('overlays') or []:
        if o.get('type') in ('dissolve', 'bleed'):
            for f in range(o['start'], min(o['end'], frames)):
                per[f] *= 1.9
    if a.status_json:
        st = json.load(open(a.status_json))
        for b in st['blocks']:
            for p in b['pieces']:
                if p['state'] == 'final':
                    for f in range(p['from'], p['to']):
                        per[f] = 0.0

    # linear partition of the blocks
    blocks = [(s, min(frames, s + a.block)) for s in range(0, frames, a.block)]
    bc = [sum(per[s:e]) for s, e in blocks]

    def groups(cap):
        g, cur, tot = [], [], 0.0
        for i, c in enumerate(bc):
            if cur and tot + c > cap:
                g.append(cur)
                cur, tot = [], 0.0
            cur.append(i)
            tot += c
        if cur:
            g.append(cur)
        return g
    lo, hi = max(bc), max(max(bc), sum(bc))
    for _ in range(60):
        mid = (lo + hi) / 2
        if len(groups(mid)) <= a.parts:
            hi = mid
        else:
            lo = mid
    ranges = []
    for g in groups(hi):
        i0, i1 = g[0], g[-1]
        while i0 < i1 and bc[i0] == 0:
            i0 += 1
        while i1 > i0 and bc[i1] == 0:
            i1 -= 1
        cost = sum(bc[i0:i1 + 1])
        if cost > 0:
            ranges.append((blocks[i0][0], blocks[i1][1], cost))
    if not ranges:
        print('nothing to render: every piece in scope is final', file=sys.stderr)
        return 0

    # an outcome branch that already exists on the remote has other history: the helper's push would be refused
    taken = {l.split('refs/heads/', 1)[1] for l in git('ls-remote', '--heads', 'origin').splitlines() if 'refs/heads/' in l}
    clash = [f'{base}-{a.tag_prefix}{k + 1}' for k in range(len(ranges)) if f'{base}-{a.tag_prefix}{k + 1}' in taken]
    if clash and not a.reuse_branches:
        raise SystemExit(f"outcome branches already on the remote: {', '.join(clash)}; pick another --tag-prefix (or --reuse-branches)")
    helpers = []
    for k, (s, e, cost) in enumerate(ranges):
        tag = f'{a.tag_prefix}{k + 1}'
        branch = f'{base}-{tag}'
        scenes = f" --only-scenes {','.join(sorted(only))}" if only else ''
        cmd = a.cmd.format(plan=a.plan, start=s, end=e, scenes=scenes)
        prompt = PROMPT.format(tag=tag, title=plan.get('title', plan.get('id', 'the film')), plan_file=a.plan, plan_id=plan.get('id'),
                               sha=sha, branch=branch, cmd=cmd, start=s, end=e, minutes=round(cost / 60000, 1),
                               scene_note=f", {', '.join(sorted(only))} only" if only else '', status_cmd=a.status_cmd.format(plan=a.plan))
        helpers.append({'tag': tag, 'range': [s, e], 'estMinutes': round(cost / 60000, 1),
                        'create_session': {'title': f'Render {tag}: {plan.get("id", "film")} {s}-{e}', 'source_url': repo,
                                           'source_revision': sha, 'outcome_branch': branch, 'prompt': prompt}})
    if a.json:
        print(json.dumps({'sha': sha, 'plan': a.plan, 'helpers': helpers}, indent=1))
        return 0
    print(f'# {len(helpers)} helpers at {sha} ({a.plan}); est. minutes: ' + ', '.join(f"{h['tag']} {h['estMinutes']}" for h in helpers))
    print(f'# watch: watch-render.sh --branches \'{base}-{a.tag_prefix}*\' --plan {a.plan}\n')
    for h in helpers:
        c = h['create_session']
        print(f"## {h['tag']}: frames {h['range'][0]}-{h['range'][1]} (~{h['estMinutes']} min) -> {c['outcome_branch']}\n")
        print(c['prompt'] + '\n')
    return 0


if __name__ == '__main__':
    sys.exit(main())
