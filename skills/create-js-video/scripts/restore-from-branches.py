#!/usr/bin/env python3
"""Rebuild dist/ render pieces from the branches helper sessions pushed to (and merge their block records).

Reads git objects directly (ls-tree + cat-file): no checkout, the index and the working tree outside the
destination dist/ folders are never touched. Works with the chunk.mjs layout:

    dist/<cut>/chunk_AAAAA_BBBBB.json              {"from", "to", "crf", "pieces": [{"from", "to", "fp", "scene"}]}
    dist/<cut>/chunk_AAAAA_BBBBB.PPPPP_QQQQQ.mp4   one piece

For every piece it gathers the candidates (a record entry AND its .mp4 on the same branch, or both locally) and
keeps one. The record entry and the .mp4 always come from the same source, so a fingerprint never describes another
render's picture. Choice, in order:
  1. --want FILE (from `chunk.mjs status --json`, one file or several comma-separated): the candidate whose fp is the
     one the current sources want (local first, then the newest branch);
  2. otherwise the newest: the local piece unless a branch's tip commit is newer than the local file's mtime.
Then run `chunk.mjs status` and require every block final: stale pieces mean a helper rendered under other sources.

Examples:
    restore-from-branches.py --branches 'claude/my-film-*' --fetch --dry-run
    node tools/chunk.mjs status --plan film-plan.json --json > out/want.json
    restore-from-branches.py --branches 'claude/my-film-r*,claude/my-film-st*' --dirs dist/my-film-v2 --want out/want.json

Provenance: generalised from the "Nova, Episode 1" project's ad-hoc restore.py (ClaudeCloud session scratchpad,
Oct 2026), which kept an existing local .mp4 while merging another branch's record (a possible fp/picture mismatch);
this version pairs them and prefers the wanted fingerprint.
"""
import argparse
import fnmatch
import json
import os
import re
import subprocess
import sys

PIECE = re.compile(r'^(chunk_\d{5}_\d{5})\.(\d{5})_(\d{5})\.mp4$')
RECORD = re.compile(r'^(chunk_\d{5}_\d{5})\.json$')


def git(*args, binary=False, check=True):
    r = subprocess.run(['git', *args], capture_output=True, text=not binary)
    if check and r.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)}: {(r.stderr if not binary else r.stderr.decode())[-300:]}")
    return r.stdout


def remote_refs(patterns, remote):
    refs = [l for l in git('for-each-ref', '--format=%(refname:strip=3)', f'refs/remotes/{remote}/').splitlines() if l and l != 'HEAD']
    out = []
    for p in patterns:
        hits = [r for r in refs if fnmatch.fnmatchcase(r, p)]
        if not hits:
            print(f'warning: no {remote}/ branch matches {p!r}', file=sys.stderr)
        out += [h for h in hits if h not in out]
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--branches', required=True, help="comma-separated branch names or globs (without the remote), e.g. 'claude/film-r*'")
    ap.add_argument('--remote', default='origin')
    ap.add_argument('--fetch', action='store_true', help='fetch the matching branches first (one refspec per glob)')
    ap.add_argument('--dirs', default='', help='comma-separated dist/<cut> folders to restore (default: every dist/*/ found)')
    ap.add_argument('--dist', default='dist', help='the dist folder inside the repo (default dist)')
    ap.add_argument('--want', default='', help='status --json file(s) of chunk.mjs: prefer the candidates with the wanted fp')
    ap.add_argument('--dest', default='', help='write into this root instead of the repo (testing)')
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()

    root = git('rev-parse', '--show-toplevel').strip()
    os.chdir(root)
    dest = os.path.abspath(a.dest) if a.dest else root
    patterns = [p.strip() for p in a.branches.split(',') if p.strip()]
    if a.fetch:
        for p in patterns:
            spec = f'+refs/heads/{p}:refs/remotes/{a.remote}/{p}'
            r = subprocess.run(['git', 'fetch', '-q', a.remote, spec], capture_output=True, text=True)
            if r.returncode != 0:
                print(f'warning: fetch {p}: {r.stderr.strip()[-200:]}', file=sys.stderr)
    branches = remote_refs(patterns, a.remote)
    dirs = {d.strip().rstrip('/') for d in a.dirs.split(',') if d.strip()}

    want = {}
    for wf in [w for w in a.want.split(',') if w]:
        st = json.load(open(wf))
        for b in st['blocks']:
            for p in b['pieces']:
                want[f"{st['dir']}/{p['name']}"] = p['want']

    # candidates[(cutdir, block, from, to)] = list of dicts
    cands, metas = {}, {}

    def consider(cut, rec_name, rec, mp4s, source, when, objs=None):
        if cut not in metas:
            metas[cut] = {}
        metas[cut].setdefault(rec_name, {k: v for k, v in rec.items() if k != 'pieces'})
        for p in rec.get('pieces') or []:
            name = f"{rec_name}.{p['from']:05d}_{p['to']:05d}.mp4"
            if name not in mp4s:
                continue   # a record entry without its picture on the same source is no candidate
            cands.setdefault((cut, rec_name, p['from'], p['to']), []).append(
                {'source': source, 'when': when, 'fp': p['fp'], 'scene': p.get('scene'), 'name': name, 'obj': (objs or {}).get(name)})

    # local
    dist_abs = os.path.join(dest, a.dist)
    if os.path.isdir(dist_abs):
        for cut in sorted(os.listdir(dist_abs)):
            cdir = os.path.join(dist_abs, cut)
            key = f'{a.dist}/{cut}'
            if not os.path.isdir(cdir) or (dirs and key not in dirs):
                continue
            files = set(os.listdir(cdir))
            mp4s = {f for f in files if PIECE.match(f)}
            for f in sorted(files):
                m = RECORD.match(f)
                if not m:
                    continue
                try:
                    rec = json.load(open(os.path.join(cdir, f)))
                except ValueError:
                    continue
                for p in rec.get('pieces') or []:
                    name = f"{m.group(1)}.{p['from']:05d}_{p['to']:05d}.mp4"
                    if name in mp4s:
                        consider(key, m.group(1), {**rec, 'pieces': [p]}, {name}, '(local)', os.path.getmtime(os.path.join(cdir, name)))

    # branches
    for br in branches:
        ref = f'{a.remote}/{br}'
        when = int(git('log', '-1', '--format=%ct', ref).strip() or 0)
        tree = {}
        for line in git('ls-tree', '-r', ref, '--', a.dist).splitlines():
            meta, path = line.split('\t', 1)
            tree[path] = meta.split()[2]
        bycut = {}
        for path, obj in tree.items():
            cut, _, fname = path.rpartition('/')
            if dirs and cut not in dirs:
                continue
            bycut.setdefault(cut, {})[fname] = obj
        for cut, files in bycut.items():
            mp4s = {f: o for f, o in files.items() if PIECE.match(f)}
            for f, obj in files.items():
                m = RECORD.match(f)
                if not m:
                    continue
                try:
                    rec = json.loads(git('cat-file', 'blob', obj))
                except ValueError:
                    continue
                if 'pieces' not in rec:
                    continue   # an old single-file block (pre-pieces layout): ignored
                consider(cut, m.group(1), rec, set(mp4s), ref, when, mp4s)

    restored = kept = conflicts = obsolete = 0
    changed_records = {}
    want_dirs = {k.rpartition('/')[0] for k in want}
    for (cut, block, p0, p1), cs in sorted(cands.items()):
        key = f"{cut}/{block}.{p0:05d}_{p1:05d}"
        if cut in want_dirs and key not in want:
            obsolete += 1   # a piece of an older timeline of this cut (its block or shot boundaries moved): skip it
            continue
        wanted = want.get(key)
        pool = [c for c in cs if c['fp'] == wanted] if wanted else []
        local = [c for c in cs if c['source'] == '(local)']
        if pool:
            pick = sorted(pool, key=lambda c: (c['source'] != '(local)', -c['when']))[0]
        else:
            newest = max(cs, key=lambda c: c['when'])
            pick = local[0] if local and local[0]['when'] >= newest['when'] else newest
        if len({c['fp'] for c in cs}) > 1:
            conflicts += 1
            print(f"conflict {key}: " + ', '.join(f"{c['source']}={c['fp']}" for c in cs) + f" -> {pick['source']}" + (' (wanted)' if pool else ''))
        if pick['source'] == '(local)':
            kept += 1
            continue
        restored += 1
        target = os.path.join(dest, cut, pick['name'])
        tag = '' if not wanted else (' (wanted)' if pick['fp'] == wanted else f' (STALE: wanted {wanted})')
        print(f"{'would restore' if a.dry_run else 'restore'} {cut}/{pick['name']} fp {pick['fp']} from {pick['source']}{tag}")
        changed_records.setdefault((cut, block), []).append({'from': p0, 'to': p1, 'fp': pick['fp'], 'scene': pick['scene']})
        if a.dry_run:
            continue
        os.makedirs(os.path.dirname(target), exist_ok=True)
        data = git('cat-file', 'blob', pick['obj'], binary=True)
        with open(target + '.part', 'wb') as fh:
            fh.write(data)
        os.replace(target + '.part', target)

    if not a.dry_run:
        for (cut, block), entries in changed_records.items():
            path = os.path.join(dest, cut, block + '.json')
            rec = json.load(open(path)) if os.path.exists(path) else dict(metas.get(cut, {}).get(block, {}), pieces=[])
            have = {(p['from'], p['to']): p for p in rec.get('pieces') or []}
            for e in entries:
                have[(e['from'], e['to'])] = e
            rec['pieces'] = sorted(have.values(), key=lambda p: p['from'])
            with open(path + '.part', 'w') as fh:
                fh.write(json.dumps(rec, separators=(',', ':')) + '\n')
            os.replace(path + '.part', path)

    print(f"branches {len(branches)}, pieces considered {len(cands)}, restored {restored}, kept local {kept}, "
          f"conflicts {conflicts}, obsolete skipped {obsolete}{' (dry run: nothing written)' if a.dry_run else ''}")
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except RuntimeError as e:
        print(f'error: {e}', file=sys.stderr)
        sys.exit(1)
