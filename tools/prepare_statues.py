#!/usr/bin/env python3
"""Prepare the marble-statue meshes for the `statue` scene (media/scenes/statue/).

For each figure (david, sol, prometheus) this loads the SMK Royal Cast Collection scan (public domain,
media/statues/raw/, not committed), removes the pedestal / socle / relief slab with clean capped plane
cuts, moves the mesh into HEAD SPACE, decimates it with a triangle budget weighted toward the face,
bakes per-vertex ambient occlusion, cavity, thickness and a skin mask, measures the anchors, and writes

    media/scenes/statue/<figure>.bin    header-free little-endian blocks (offsets in the json)
    media/scenes/statue/<figure>.json   source + licence, counts, layout, bounds, frame, anchors, notes

HEAD SPACE (all three figures):
    origin  head centre: halfway between chin and crown, on the vertical turn axis, which passes
            through the neck between the ears
    +Y      up = the vertical turn axis
    +Z      the measured gaze: a camera on the +Z axis at eye height is stared at ("looking straight
            into the lens"). The cast is re-levelled about X so the gaze is horizontal; the json records
            that rotation (frame.levelPitchDeg) so the original posture can be restored.
    +X      Y x Z = the figure's own LEFT (screen right when the figure faces the camera).
            Anchor suffix L/R = the figure's own left/right.
    units   1.0 = chin-to-crown head height (vertical, in head space)

Usage:
    pip install trimesh pymeshlab embreex mapbox_earcut shapely scipy pillow
    python3 tools/prepare_statues.py                 # all figures
    python3 tools/prepare_statues.py --figure sol    # one figure
    python3 tools/prepare_statues.py --sheets        # also gridded measurement sheets (anchor hints)
Previews go to out/statue-prep/ (not committed).
"""
import argparse
import json
import math
import os
import struct
import sys
import time
from pathlib import Path

import numpy as np
import scipy.sparse as sp
from scipy.sparse.csgraph import connected_components
from scipy.spatial import cKDTree
import trimesh
from trimesh.ray.ray_pyembree import RayMeshIntersector
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / 'media/statues/raw'
OUT = ROOT / 'media/scenes/statue'
PREV = ROOT / 'out/statue-prep'

SMK_RIGHTS = 'https://creativecommons.org/publicdomain/mark/1.0/'

# ------------------------------------------------------------------------------------------------
# Per-figure configuration. Hints are approximate points in RAW SOURCE coordinates (as in the STL),
# read off gridded measurement renders; every one is snapped/refined on the mesh by measurement.
# ------------------------------------------------------------------------------------------------
FIGURES = {
    'david': dict(
        src='david/smk-KAS2232-head-of-david.stl', zup=True,
        source=dict(
            title='Head of David (plaster cast after Michelangelo, 1890)',
            object='SMK KAS2232', url='https://open.smk.dk/artwork/image/KAS2232',
            download='https://api.smk.dk/api/v1/download-3d/ht24wq097_smk55-kas2232-head-of-david.stl',
            license='Public Domain Mark 1.0', license_url=SMK_RIGHTS,
            attribution='Head of David, plaster cast after Michelangelo. 3D scan: SMK - Statens Museum for Kunst, '
                        'Royal Cast Collection (open.smk.dk), public domain.'),
        face_dir=(-0.42, -0.91, 0.0),
        hints=dict(nose=[32.14, 23.81, 107.45], eyeR=[26.76, 44.85, 126.93], eyeL=[52.05, 22.82, 128.58],
                   chin=[42.68, 38.88, 79.96], mouth=[39.39, 32.38, 95.45],
                   earR=[49.66, 90.19, 127.33]),  # right concha (visible); the left ear is buried in curls
        torso_dir=(-1.0, 0.0, 1.0),     # rough direction the chest faces, head space (sign hint only)
        pupils=True,                    # carved (heart-shaped) pupils: gaze measured from them
        gaze_pitch=None,                # None = measured
        preclip=[],
        crop_y=-0.85,                   # bottom cut, head units (chin = -0.5); the pedestal stub starts below
        target_faces=560000,
        smooth=dict(seams=True),
    ),
    'sol': dict(
        src='sol/smk_KAS283_alexander_as_helios_full.stl', zup=True,
        source=dict(
            title='Ideal portrait of Alexander the Great as Helios (plaster cast of a Hellenistic marble)',
            object='SMK KAS283', url='https://open.smk.dk/artwork/image/KAS283',
            download='https://api.smk.dk/api/v1/download-3d/4t64gs845_84-smk-alexander-as-helios-inv-283.stl',
            license='Public Domain Mark 1.0', license_url=SMK_RIGHTS,
            attribution='Alexander the Great as Helios, plaster cast after a Hellenistic marble. 3D scan: SMK - '
                        'Statens Museum for Kunst, Royal Cast Collection (open.smk.dk), public domain.'),
        face_dir=(-0.92, -0.38, 0.0),
        hints=dict(nose=[2.18, 18.27, 85.35], eyeR=[6.5, 29.98, 95.58], eyeL=[14.83, 16.09, 95.32],
                   chin=[9.37, 22.88, 69.86], mouth=[8.86, 22.4, 78.95],
                   # drilled ray-attachment holes in the diadem (fillet), front to sides, and the crown socket
                   rayHoles=[[14.27, 39.83, 125.19], [18.59, 26.65, 126.76], [24.68, 17.96, 123.94],
                             [30.28, 12.10, 118.53], [39.00, 12.48, 111.76], [16.80, 51.50, 115.65],
                             [24.35, 58.04, 105.88]],
                   crownSocket=[36.01, 35.91, 124.22]),
        torso_dir=(0.0, 0.0, 1.0),
        pupils=False,
        gaze_pitch=6.0,                 # blank eyes: upturn judged visually (see notes)
        preclip=[],
        crop_y=-0.92,
        target_faces=560000,
        smooth=dict(skin=True),
    ),
    'prometheus': dict(
        src='prometheus/smk_KAS19-6_pergamon_giant_klytios.stl', zup=False,
        source=dict(
            title='Upper body of a giant (Klytios?), Pergamon Altar Gigantomachy frieze (plaster cast) - '
                  'stand-in for Prometheus',
            object='SMK KAS19/6', url='https://open.smk.dk/artwork/image/KAS19/6',
            download='https://api.smk.dk/api/v1/download-3d/1r66j588x_kas19f-overkrop-af-giganten-klytios.stl',
            license='Public Domain Mark 1.0', license_url=SMK_RIGHTS,
            attribution='Giant from the Pergamon Altar frieze, plaster cast. 3D scan: SMK - Statens Museum for Kunst, '
                        'Royal Cast Collection (open.smk.dk), public domain.'),
        face_dir=(0.90, 0.14, 0.42),
        hints=dict(nose=[53.32, 98.43, 30.49], eyeR=[46.7, 103.93, 31.27], eyeL=[51.02, 102.46, 22.1],
                   mouth=[50.99, 93.82, 29.31], beard=[42.47, 76.97, 26.23]),
        torso_dir=(-1.0, 0.0, 0.3),
        pupils=False,
        gaze_pitch=6.0,
        # relief ground slab (z < 7) and its return on the +X edge (x > 62): keep z >= 7 and x <= 62 (raw = cast)
        preclip=[((0, 0, 1), (0, 0, 7.0)), ((-1, 0, 0), (62.0, 0, 0))],
        crop_y=-0.95,
        target_faces=560000,
        smooth=dict(),
    ),
}


def log(*a):
    print(time.strftime('%H:%M:%S'), *a, flush=True)


# ------------------------------------------------------------------------------------------------
# geometry helpers
# ------------------------------------------------------------------------------------------------
def nrm(a):
    a = np.asarray(a, float)
    return a / np.linalg.norm(a, axis=-1, keepdims=True)


def vnormals(V, F):
    fn = np.cross(V[F[:, 1]] - V[F[:, 0]], V[F[:, 2]] - V[F[:, 0]])
    N = np.zeros_like(V)
    for k in range(3):
        np.add.at(N, F[:, k], fn)
    return nrm(N + 1e-30)


def adjacency(F, nv):
    i = np.concatenate([F[:, 0], F[:, 1], F[:, 2], F[:, 1], F[:, 2], F[:, 0]])
    j = np.concatenate([F[:, 1], F[:, 2], F[:, 0], F[:, 0], F[:, 1], F[:, 2]])
    A = sp.coo_matrix((np.ones(len(i), np.float32), (i, j)), shape=(nv, nv)).tocsr()
    A.data[:] = 1.0
    return A


def component(A, mask, seed):
    idx = np.where(mask)[0]
    pos = np.searchsorted(idx, seed)
    if pos >= len(idx) or idx[pos] != seed:
        return None
    nc, lab = connected_components(A[idx][:, idx], directed=False)
    return idx[lab == lab[pos]]


def to_cast(Vraw, zup):
    """RAW source coordinates -> CAST frame (Y up). Z-up sources: (x, y, z) -> (x, z, -y)."""
    Vraw = np.asarray(Vraw, float)
    if zup:
        return np.stack([Vraw[..., 0], Vraw[..., 2], -Vraw[..., 1]], -1)
    return Vraw.copy()


def keep_largest(m):
    parts = m.split(only_watertight=False)
    if len(parts) > 1:
        parts = sorted(parts, key=lambda p: len(p.faces), reverse=True)
        log('  components', len(parts), 'keeping largest', len(parts[0].faces), 'dropping', sum(len(p.faces) for p in parts[1:]))
        return parts[0]
    return m


def slice_keep(m, normal, origin):
    """Keep the half-space (p - origin).normal >= 0; cap the cut so the mesh stays closed."""
    out = trimesh.intersections.slice_mesh_plane(m, np.asarray(normal, float), np.asarray(origin, float), cap=True)
    return keep_largest(out)


def umbrella(A):
    deg = np.asarray(A.sum(1)).ravel()
    return sp.diags(1.0 / np.maximum(deg, 1)) @ A


def smooth_positions(V, A, iters, lam=0.5, W=None):
    P = umbrella(A)
    X = V.copy()
    for _ in range(iters):
        d = P @ X - X
        X = X + lam * (d if W is None else d * W[:, None])
    return X


def taubin(V, A, iters, lam=0.5, mu=-0.53, W=None):
    P = umbrella(A)
    X = V.copy()
    w = 1.0 if W is None else W[:, None]
    for _ in range(iters):
        X = X + lam * w * (P @ X - X)
        X = X + mu * w * (P @ X - X)
    return X


def fit_sphere(P):
    A = np.c_[2 * P, np.ones(len(P))]
    b = (P ** 2).sum(1)
    x, *_ = np.linalg.lstsq(A, b, rcond=None)
    c = x[:3]
    return c, float(np.sqrt(max(x[3] + c @ c, 1e-12)))


class Caster:
    def __init__(self, V, F):
        self.m = trimesh.Trimesh(V, F, process=False)
        self.ri = RayMeshIntersector(self.m)

    def first(self, o, d):
        o = np.ascontiguousarray(np.broadcast_to(o, np.shape(d)), float)
        d = np.ascontiguousarray(d, float)
        loc, ir, it = self.ri.intersects_location(o, d, multiple_hits=False)
        return loc, ir, it

    def hit_point(self, o, d):
        loc, ir, it = self.first(np.asarray(o, float)[None], np.asarray(d, float)[None])
        return loc[0] if len(loc) else None

    def distances(self, o, d, maxd):
        """distance to first hit per ray (maxd where no hit)"""
        loc, ir, it = self.first(o, d)
        out = np.full(len(d), maxd)
        out[ir] = np.minimum(np.linalg.norm(loc - o[ir], axis=1), maxd)
        return out


# ------------------------------------------------------------------------------------------------
# measurement
# ------------------------------------------------------------------------------------------------
def symmetry_plane(P, n0, p0, iters=30):
    """Mirror-ICP: plane (n, d) that best maps the face points onto themselves."""
    tree = cKDTree(P)
    n = nrm(n0)
    d = float(n @ p0)
    for _ in range(iters):
        Q = P - 2 * ((P @ n) - d)[:, None] * n
        dist, idx = tree.query(Q)
        q = P[idx]
        keep = dist < np.percentile(dist, 80)
        diff = P[keep] - q[keep]
        diff = diff * np.sign(diff @ n)[:, None]
        _, _, vt = np.linalg.svd(diff, full_matrices=False)
        n = vt[0] * np.sign(vt[0] @ n)
        d = float(np.median(((P[keep] + q[keep]) / 2) @ n))
    return n, d, float(np.median(dist))


def eyeball(V, N, A, seed_pt, fwd, H, carved, rmin=0.04, rmax=0.11):
    """Fit the eyeball sphere near seed_pt (RANSAC with a radius prior, then region-grown refits).
    Returns centre, radius, the visible cap direction and, for carved eyes, the pupil (deepest pit)."""
    dist0 = np.linalg.norm(V - seed_pt, axis=1)
    m = (dist0 < 0.075 * H) & ((N @ fwd) > 0.2)
    P = V[m]
    rng = np.random.default_rng(1)
    best = (-1, None, None)
    tol = 0.0025 * H
    for _ in range(3000):
        s = P[rng.choice(len(P), 4, replace=False)]
        c, r = fit_sphere(s)
        if not (rmin * H < r < rmax * H) or not np.isfinite(r) or (c - seed_pt) @ fwd > -0.5 * r:
            continue
        sc = int((np.abs(np.linalg.norm(P - c, axis=1) - r) < tol).sum())
        if sc > best[0]:
            best = (sc, c, r)
    c, r = best[1], best[2]
    comp = None
    for _ in range(8):
        dd = np.linalg.norm(V - c, axis=1) - r
        near = (np.abs(dd) < 0.003 * H) & (dist0 < 0.09 * H) & (((V - c) @ fwd) > 0)
        cand = np.where(near)[0]
        if len(cand) < 20:
            break
        comp = component(A, near, cand[np.argmin(dist0[cand])])
        c, r = fit_sphere(V[comp])
    dd = np.linalg.norm(V - c, axis=1) - r
    g_cap = nrm(V[comp].mean(0) - c)
    out = dict(centre=c, radius=r, gaze_cap=g_cap, apex=c + g_cap * r, cap=comp)
    if carved:
        cosang = nrm(V - c) @ g_cap
        cone = (cosang > np.cos(np.radians(25))) & (np.linalg.norm(V - c, axis=1) > 0.6 * r)
        cand = np.where(cone)[0]
        k = cand[np.argmin(dd[cand])]
        pit = component(A, cone & (dd < 0.5 * dd[k]), k)
        w = 0.5 * dd[k] - dd[pit]
        pc = (V[pit] * w[:, None]).sum(0) / w.sum()
        g = nrm(pc - c)
        out.update(pupil=c + g * r, gaze_pupil=g, pupil_depth=float(-dd[k]))
    return out


# ------------------------------------------------------------------------------------------------
# stage 1: load, pre-clip, frame
# ------------------------------------------------------------------------------------------------
def load_cast(cfg):
    m = trimesh.load(RAW / cfg['src'], process=True)
    log('  loaded', len(m.faces), 'tris', len(m.vertices), 'verts, watertight', m.is_watertight)
    m = trimesh.Trimesh(to_cast(m.vertices, cfg['zup']), m.faces, process=False)
    for nrml, org in cfg['preclip']:
        m = slice_keep(m, to_cast(nrml, cfg['zup']), to_cast(org, cfg['zup']))
        log('  preclip', nrml, org, '->', len(m.faces), 'tris')
    return m


def build_frame(name, cfg, m):
    V = np.asarray(m.vertices, float)
    F = np.asarray(m.faces, np.int64)
    N = vnormals(V, F)
    A = adjacency(F, len(V))
    zup = cfg['zup']
    hint = {k: to_cast(v, zup) for k, v in cfg['hints'].items()}
    up = np.array([0.0, 1.0, 0.0])
    fd = nrm(to_cast(cfg['face_dir'], zup))
    fd_h = nrm(fd - (fd @ up) * up)
    # nose tip (cast): most forward point near the hint
    Hest = (V[:, 1].max() - hint[('chin' if 'chin' in hint else 'beard')][1])
    near = np.linalg.norm(V - hint['nose'], axis=1) < 0.05 * Hest
    nose = V[np.argmax(np.where(near, V @ fd_h, -1e18))]
    # facial symmetry plane from face points around the nose
    c0 = nose - fd_h * 0.12 * Hest
    face = (np.linalg.norm(V - c0, axis=1) < 0.30 * Hest) & ((N @ fd_h) > 0.0) & (((V - c0) @ fd_h) > -0.05 * Hest)
    n, d, resid = symmetry_plane(V[face], np.cross(up, fd_h), nose)
    Fw = nrm(np.cross(n, up))
    Fw *= np.sign(Fw @ fd_h)
    side = np.cross(up, Fw)                      # horizontal, figure's left
    log('  symmetry normal', n.round(4), 'resid %.4f H' % (resid / Hest), 'roll %.1f deg' % np.degrees(np.arcsin(n @ up)))
    # eyes
    eyes = {}
    for lab in 'LR':
        e = eyeball(V, N, A, hint['eye' + lab], Fw, Hest, cfg['pupils'])
        eyes[lab] = e
    gL = eyes['L'].get('gaze_pupil', eyes['L']['gaze_cap'])
    gR = eyes['R'].get('gaze_pupil', eyes['R']['gaze_cap'])

    def yp(g):
        return math.degrees(math.atan2(g @ side, g @ Fw)), math.degrees(math.asin(np.clip(g @ up, -1, 1)))
    gm = nrm(gL + gR)
    yaw, pitch = yp(gm)
    meas = dict(eyeL=dict(zip(('yaw', 'pitch'), np.round(yp(gL), 2))), eyeR=dict(zip(('yaw', 'pitch'), np.round(yp(gR), 2))))
    log('  gaze per eye (deg, rel. facial symmetry; +yaw = figure\'s left, +pitch = up):', meas)
    if cfg['gaze_pitch'] is not None:
        pitch = cfg['gaze_pitch']
    yr, pr = math.radians(yaw), math.radians(pitch)
    Z = nrm(math.cos(pr) * (math.cos(yr) * Fw + math.sin(yr) * side) + math.sin(pr) * up)
    Y = nrm(up - (up @ Z) * Z)
    X = np.cross(Y, Z)
    Rm = np.stack([X, Y, Z])                     # rows: head axes in cast coords
    log('  gaze yaw %.2f pitch %.2f -> head Z (cast) %s' % (yaw, pitch, Z.round(4)))
    return dict(R=Rm, n=n, d=d, Fw=Fw, side=side, nose=nose, eyes=eyes, yaw=yaw, pitch=pitch, gaze_meas=meas,
                sym_resid=resid / Hest, hint=hint, Hest=Hest)


def head_transform(name, cfg, m, fr):
    """Rotate into head axes, find chin/crown -> scale and origin. Returns (O_cast, H, info)."""
    Rm = fr['R']
    V = np.asarray(m.vertices, float)
    Vh = V @ Rm.T                                 # rotated, cast units, origin at cast origin
    hint = {k: v @ Rm.T for k, v in fr['hint'].items()}
    eyeC = {k: e['centre'] @ Rm.T for k, e in fr['eyes'].items()}
    x_mid = 0.5 * (eyeC['L'][0] + eyeC['R'][0])
    nose = fr['nose'] @ Rm.T
    crown_i = np.argmax(Vh[:, 1])
    crown = Vh[crown_i]
    Hest = fr['Hest']
    info = {}
    if 'chin' in hint:
        # gnathion: most anterior-inferior point of the chin, on the midline strip near the hint
        sel = (np.linalg.norm(Vh - hint['chin'], axis=1) < 0.08 * Hest) & (np.abs(Vh[:, 0] - x_mid) < 0.015 * Hest)
        chin = Vh[np.argmax(np.where(sel, Vh[:, 2] - Vh[:, 1], -1e18))]
        info['chin'] = 'measured: most anterior-inferior point of the chin on the midline (gnathion)'
    else:
        # chin hidden in the beard: estimate from the mouth and nose (ratio measured on david & sol)
        mouth = hint['mouth']
        k = CHIN_RATIO
        chin = np.array([x_mid, mouth[1] - k * (nose[1] - mouth[1]), mouth[2] - 0.35 * (nose[1] - mouth[1])])
        info['chin'] = 'ESTIMATED (under the beard): stomion-to-chin = %.2f x nose-tip-to-stomion, the ratio measured on david and sol' % k
    H = crown[1] - chin[1]
    y0 = 0.5 * (crown[1] + chin[1])
    return dict(Vh=Vh, H=H, y0=y0, x_mid=x_mid, chin=chin, crown=crown, nose=nose, eyeC=eyeC, info=info)


CHIN_RATIO = 1.35  # stomion->gnathion / nose-tip->stomion, measured: david 1.29, sol 1.42
K_EAR = 0.26       # provisional origin depth only; the origin is then moved to the ear midpoint (ear_anchors)
K_EAR_FW = 0.318   # ear midpoint behind the eyeball midpoint along the horizontal facial axis, head units (measured on david)
EAR_DROP = 0.08    # concha below the eyeball centres, head units (measured on david)


def smoothstep(a, b, x):
    t = np.clip((np.asarray(x, float) - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def scalar_smooth(s, A, iters):
    P = umbrella(A)
    for _ in range(iters):
        s = 0.5 * s + 0.5 * (P @ s)
    return s


# ------------------------------------------------------------------------------------------------
# stage 2: head space, crop, smoothing, decimation
# ------------------------------------------------------------------------------------------------
def to_head_fn(Rm, O_rot, H):
    return lambda P: (np.asarray(P, float) @ Rm.T - O_rot) / H


def midline_front_profile(Vc, n, d, fw, ylo, yhi, tol, Rm, O_rot, H):
    """Front profile of the facial symmetry section, in head units: returns (y, f, points)."""
    on = np.abs(Vc @ n - d) < tol
    P = (Vc[on] @ Rm.T - O_rot) / H
    f = P @ fw
    k = (P[:, 1] > ylo) & (P[:, 1] < yhi)
    return P[k], f[k]


def snap_mouth(Ph, f, hint_y, f_nose, span=0.035, step=0.002):
    """stomion on the midline front profile near hint_y. Only the front of the face counts (f > f_nose - 0.2).
    Closed lips: the deepest point of the profile between the lips. Parted lips (bins with no front surface,
    or a sudden deep notch): the centre of the opening, at the depth of the lip fronts."""
    front = f > f_nose - 0.20
    bins = np.arange(hint_y - span, hint_y + span, step)
    prof = []
    for b0 in bins:
        k = front & (Ph[:, 1] >= b0) & (Ph[:, 1] < b0 + step)
        if k.any():
            i = np.argmax(np.where(k, f, -1e9))
            prof.append((b0 + step / 2, f[i], Ph[i]))
        else:
            prof.append((b0 + step / 2, None, None))
    fs = np.array([np.nan if q[1] is None else q[1] for q in prof])
    lip = np.nanpercentile(fs, 80)
    gap = np.isnan(fs) | (fs < lip - 0.045)
    if gap.any():
        gi = np.where(gap)[0]
        runs = np.split(gi, np.where(np.diff(gi) > 1)[0] + 1)
        run = min(runs, key=lambda r_: abs(prof[int(r_.mean())][0] - hint_y))
        y = float(np.mean([prof[i][0] for i in run]))
        nb = [prof[i] for i in (run[0] - 1, run[-1] + 1) if 0 <= i < len(prof) and prof[i][1] is not None]
        pt = np.mean([q[2] for q in nb], axis=0)
        pt[1] = y
        return pt, 'parted lips: centre of the opening at the depth of the lip fronts'
    i = int(np.nanargmin(fs[2:-2])) + 2
    return prof[i][2], 'closed lips: deepest point of the midline profile between the lips'


def region_weights(V, an, fw):
    """Smooth membership weights for the decimation budget regions (head space)."""
    eyes = np.minimum(np.linalg.norm(V - an['eyeballL'], axis=1), np.linalg.norm(V - an['eyeballR'], axis=1))
    w_eye = 1 - smoothstep(0.075, 0.13, eyes)
    w_lip = 1 - smoothstep(0.06, 0.10, np.linalg.norm(V - an['mouth'], axis=1))
    w_nose = 1 - smoothstep(0.05, 0.09, np.linalg.norm(V - an['noseTip'], axis=1))
    pc = (an['eyeballL'] + an['eyeballR']) / 2 * 0.6 + an['mouth'] * 0.4
    dpc = V - pc
    w_face = (1 - smoothstep(0.24, 0.34, np.linalg.norm(dpc, axis=1))) * smoothstep(-0.14, -0.02, dpc @ fw)
    w_head = smoothstep(an['chin'][1] - 0.15, an['chin'][1] + 0.02, V[:, 1])
    return dict(core=np.maximum(w_eye, np.maximum(w_lip, w_nose)), face=w_face, head=w_head)


REGION_NAMES = ('body', 'head', 'face', 'core')     # 0 neck/chest/caps, 1 hair/ears/skull, 2 face skin, 3 eyes/lids/lips/nose


def region_labels(V, F, an, fw):
    w = region_weights(V, an, fw)
    lv = np.zeros(len(V), int)
    lv[w['head'] >= 0.5] = 1
    lv[w['face'] >= 0.5] = 2
    lv[w['core'] >= 0.5] = 3
    return lv[F].max(1)                          # a face takes the most important label of its vertices


def region_budget(counts, target, face_keep=0.92, body_share=0.14):
    c0, c1, c2, c3 = counts
    r3 = c3
    r2 = int(c2 * face_keep)
    B = target - r3 - r2
    if B < 0.25 * (c0 + c1):                     # not enough room: thin the face skin first
        r2 = max(int(0.5 * c2), r2 + B - int(0.25 * (c0 + c1)))
        B = target - r3 - r2
    r0 = min(c0, int(body_share * B))
    r1 = B - r0
    if r1 > c1:
        spill = r1 - c1
        r1 = c1
        r2 = min(c2, r2 + spill)
    return [r0, r1, r2, r3]


def decimate_regions(V, F, labels, target):
    """Split into regions, decimate each to its budget with its border frozen (preserveboundary makes
    border vertices non-writable in vcg), then weld the untouched borders back together: no cracks."""
    import pymeshlab
    counts = [int((labels == L).sum()) for L in range(4)]
    budget = region_budget(counts, target)
    parts, final = [], []
    for L in range(4):
        sub = trimesh.Trimesh(V, F[labels == L], process=False)
        sub.remove_unreferenced_vertices()
        if len(sub.faces) == 0:
            final.append(0)
            continue
        if budget[L] < len(sub.faces) * 0.995:
            ms = pymeshlab.MeshSet()
            ms.add_mesh(pymeshlab.Mesh(vertex_matrix=np.asarray(sub.vertices), face_matrix=np.asarray(sub.faces)))
            ms.meshing_decimation_quadric_edge_collapse(targetfacenum=int(budget[L]), preserveboundary=True,
                                                        boundaryweight=1.0, preservenormal=True, preservetopology=True,
                                                        optimalplacement=True, planarquadric=True, qualitythr=0.4,
                                                        autoclean=False)
            mm = ms.current_mesh()
            sub = trimesh.Trimesh(mm.vertex_matrix().astype(float), mm.face_matrix().astype(np.int64), process=False)
        log('  region %-4s %7d -> %7d tris' % (REGION_NAMES[L], counts[L], len(sub.faces)))
        parts.append(sub)
        final.append(len(sub.faces))
    m = trimesh.util.concatenate(parts)
    m.merge_vertices(digits_vertex=9)
    m.update_faces(m.nondegenerate_faces())
    m.update_faces(m.unique_faces())
    m.remove_unreferenced_vertices()
    return m, dict(zip(REGION_NAMES, counts)), dict(zip(REGION_NAMES, final))


def curvature_fields(V, F, N, A, H_edge):
    """Signed multi-scale curvature (positive = convex ridge, negative = crevice), in MAD units, plus a
    roughness field (local energy of fine-scale curvature) used for the skin mask."""
    cs = []
    for it in (4, 16, 48):
        Vs = smooth_positions(V, A, it)
        c = ((V - Vs) * N).sum(1)
        mad = np.median(np.abs(c - np.median(c))) + 1e-12
        cs.append(c / (1.4826 * mad))
    cav = 0.5 * cs[0] + 0.3 * cs[1] + 0.2 * cs[2]
    rough = dict(r16=scalar_smooth(np.abs(cs[1]), A, 40), r48=scalar_smooth(np.abs(cs[2]), A, 60),
                 neg48=scalar_smooth(np.clip(-cs[2], 0, None), A, 60))
    return cav, rough


def fib_hemisphere(n, cosine=True):
    i = np.arange(n) + 0.5
    phi = i * math.pi * (3 - math.sqrt(5))
    u = i / n
    z = np.sqrt(1 - u) if cosine else 1 - u
    r = np.sqrt(np.maximum(0, 1 - z * z))
    return np.stack([r * np.cos(phi), r * np.sin(phi), z], 1)


def tangent_frames(N, rng):
    a = np.where(np.abs(N[:, :1]) < 0.9, np.array([[1.0, 0, 0]]), np.array([[0, 1.0, 0]]))
    T = nrm(np.cross(N, a))
    B = np.cross(N, T)
    th = rng.uniform(0, 2 * math.pi, len(N))[:, None]
    return np.cos(th) * T + np.sin(th) * B, -np.sin(th) * T + np.cos(th) * B


def bake_rays(V, N, caster, dirs_local, maxd, inward=False, chunk=400000, seed=7):
    """Mean normalised hit distance (0 = immediately occluded, 1 = clear up to maxd) per vertex."""
    rng = np.random.default_rng(seed)
    T, B = tangent_frames(N, rng)
    nv, nr = len(V), len(dirs_local)
    out = np.zeros(nv)
    sgn = -1.0 if inward else 1.0
    per = max(1, chunk // nr)
    for s in range(0, nv, per):
        e = min(nv, s + per)
        n_ = N[s:e] * sgn
        D = (T[s:e, None, :] * dirs_local[None, :, 0:1] + B[s:e, None, :] * dirs_local[None, :, 1:2]
             + n_[:, None, :] * dirs_local[None, :, 2:3]).reshape(-1, 3)
        O = np.repeat(V[s:e] + n_ * 2e-4, nr, axis=0)
        d = caster.distances(O, D, maxd)
        out[s:e] = (d / maxd).reshape(-1, nr).mean(1)
    return out


# ------------------------------------------------------------------------------------------------
# anchors on the final head-space surface
# ------------------------------------------------------------------------------------------------
def section_polygons(m, y):
    sec = m.section(plane_origin=[0, y, 0], plane_normal=[0, 1, 0])
    if sec is None:
        return []
    pts = []
    for ent in sec.entities:
        P = sec.vertices[ent.points]
        pts.append(P)
    # group discrete loops
    loops = sec.discrete
    return [np.asarray(L) for L in loops]


def loop_centroid(L):
    x, z = L[:, 0], L[:, 2]
    a = x * np.roll(z, -1) - np.roll(x, -1) * z
    A = a.sum() / 2
    if abs(A) < 1e-12:
        return L.mean(0), 0.0
    cx = ((x + np.roll(x, -1)) * a).sum() / (6 * A)
    cz = ((z + np.roll(z, -1)) * a).sum() / (6 * A)
    return np.array([cx, L[:, 1].mean(), cz]), abs(A)


def neck_loop(m, y, near_xz=(0.0, 0.0)):
    best = None
    for L in section_polygons(m, y):
        c, A = loop_centroid(L)
        dist = math.hypot(c[0] - near_xz[0], c[2] - near_xz[1])
        if A > 1e-4 and (best is None or dist < best[0]):
            best = (dist, c, A)
    return best


def side_ray_point(caster, y, z, side, spread=0.0, medial=False):
    """Cast rays from the figure's side (side=+1 left/+X, -1 right/-X) toward the axis at (y, z)."""
    pts = []
    offs = [(0, 0)] if spread == 0 else [(dy, dz) for dy in np.linspace(-spread, spread, 9) for dz in np.linspace(-spread, spread, 9)]
    O = np.array([[side * 3.0, y + dy, z + dz] for dy, dz in offs])
    D = np.tile([-side * 1.0, 0, 0], (len(O), 1))
    loc, ir, it = caster.first(O, D)
    if not len(loc):
        return None
    if medial:
        return loc[np.argmin(np.abs(loc[:, 0]))]
    return loc[0]


def hull_centroid(P2):
    from scipy.spatial import ConvexHull
    h = ConvexHull(P2)
    poly = P2[h.vertices]
    x, z = poly[:, 0], poly[:, 1]
    a = x * np.roll(z, -1) - np.roll(x, -1) * z
    A = a.sum() / 2
    return np.array([((x + np.roll(x, -1)) * a).sum() / (6 * A), ((z + np.roll(z, -1)) * a).sum() / (6 * A)])


SHOULDER_BAND = (0.40, 0.46)   # lateral distance from the turn axis along torso.left (head units)


def body_anchors(m, caster, an, cfg, rough16):
    """Shoulders, neck axis and neck base on the dense head-space surface (approximate, for framing).
    Torso axes: principal axis of the cross-section just above the cut.
    Shoulders: top of the shoulder slope at a fixed lateral distance: highest SMOOTH (carved skin, not hair/beard)
    vertex outside the head ball (0.55 around the head centre) in a band SHOULDER_BAND to either side of the turn
    axis along the torso's lateral axis. (The casts are cut well inside the real acromion.)
    Neck: convex-hull centroids of thin horizontal slabs of smooth vertices within 0.30 of the turn axis, under the
    jaw (neckTop) and at the mean shoulder height (neckBase); neckAxisUp joins them."""
    V = np.asarray(m.vertices)
    up = np.array([0, 1.0, 0])
    y_s = cfg['crop_y'] + 0.06
    band = np.abs(V[:, 1] - y_s) < 0.01
    P = V[band][:, [0, 2]]
    c = P.mean(0)
    _, _, vt = np.linalg.svd(P - c, full_matrices=False)
    lat = np.array([vt[0][0], 0, vt[0][1]])
    fwd_t = np.cross(lat, up)
    if fwd_t @ np.asarray(cfg['torso_dir'], float) < 0:
        fwd_t = -fwd_t
    left_t = np.cross(up, fwd_t)
    smooth = rough16 < 0.9
    head_c = np.array([0.0, -0.05, 0.05])
    outside = np.linalg.norm(V - head_c, axis=1) > 0.55
    lt, ft = V @ left_t, V @ fwd_t
    out = {}
    for lab, sgn in (('shoulderL', 1), ('shoulderR', -1)):
        sel = (smooth & outside & (sgn * lt > SHOULDER_BAND[0]) & (sgn * lt < SHOULDER_BAND[1]) & (np.abs(ft) < 0.25)
               & (V[:, 1] > cfg['crop_y'] + 0.03) & (V[:, 1] < an['chin'][1] + 0.12))
        if sel.any():
            out[lab] = V[np.argmax(np.where(sel, V[:, 1], -1e9))]

    def slab_centre(y):
        k = smooth & (np.abs(V[:, 1] - y) < 0.01) & (np.hypot(V[:, 0], V[:, 2]) < 0.30)
        if k.sum() < 30:
            return None
        cxz = hull_centroid(V[k][:, [0, 2]])
        return np.array([cxz[0], y, cxz[1]])
    ys = [out[k][1] for k in ('shoulderL', 'shoulderR') if k in out]
    y_nb = float(np.mean(ys)) if ys else an['chin'][1] - 0.25
    y_nb = min(y_nb, an['chin'][1] - 0.12)
    cen = [c_ for c_ in (slab_centre(y) for y in np.linspace(an['chin'][1] - 0.06, an['chin'][1] - 0.30, 7)) if c_ is not None]
    cen = np.array(cen)
    A_ = np.c_[cen[:, 1], np.ones(len(cen))]
    kx = np.linalg.lstsq(A_, cen[:, 0], rcond=None)[0]
    kz = np.linalg.lstsq(A_, cen[:, 2], rcond=None)[0]
    axis = nrm(np.array([kx[0], 1.0, kz[0]]))
    if axis[1] < math.cos(math.radians(40)):         # unreliable (hidden throat): fall back to the slab centroid
        nb = slab_centre(y_nb)
        out['_neckAxisNote'] = 'fit unreliable (tilt > 40 deg), vertical used'
        axis = up
    else:
        nb = np.array([kx[0] * y_nb + kx[1], y_nb, kz[0] * y_nb + kz[1]])
    out['neckBase'] = nb
    out['_neckAxis'] = axis
    nt = cen[0]
    out['_torso'] = dict(forward=fwd_t, left=left_t)
    out['_neckTop'] = nt
    return out


def ear_anchors(caster, an, cfg, th, Rm, sym_n):
    """Ear anchors + the ear midpoint (the turn axis passes through it).
    A visible concha (hint) is snapped to the most medial surface point seen from the side; the other ear
    is its mirror image across the facial symmetry plane. Without a visible ear the midpoint is placed
    K_EAR_FW behind the eyeball midpoint along the horizontal facial forward axis (measured on david)."""
    e = 0.5 * (an['eyeballL'] + an['eyeballR'])
    nh = nrm(Rm @ sym_n)
    nh = nh * np.sign(nh[0])                       # facial symmetry normal, toward the figure's left
    fwh = nrm(np.cross(nh, [0, 1.0, 0]))
    fwh = fwh * np.sign(fwh[2])
    fwh = nrm(fwh - fwh[1] * np.array([0, 1.0, 0]))
    out, notes = {}, {}
    if 'earR' in cfg['hints']:
        h = th(to_cast(cfg['hints']['earR'], cfg['zup']))
        q = side_ray_point(caster, h[1], h[2], -1, spread=0.025, medial=True)
        qm = q - 2 * ((q - e) @ nh) * nh
        out['earR'], out['earL'] = q, qm
        notes['earR'] = 'measured: most medial point of the right concha seen from the side'
        notes['earL'] = 'mirror image of earR across the facial symmetry plane (the left ear is buried in curls)'
        mid = 0.5 * (q + qm)
        k = float((e - mid) @ fwh)
        log('  ears: concha depth behind the eyeball midpoint along the facial axis %.3f, drop %.3f' % (k, e[1] - q[1]))
    else:
        mid = e - fwh * K_EAR_FW
        mid[1] = e[1] - EAR_DROP
        for lab, sgn in (('earL', 1), ('earR', -1)):
            out[lab] = side_ray_point(caster, mid[1], mid[2], sgn)
            notes[lab] = ('ESTIMATED: ear hidden by hair/beard; outer surface point beside the ear position estimated '
                          '%.3f behind the eyeball midpoint along the facial axis (ratio measured on david)' % K_EAR_FW)
    return out, notes, mid


# ------------------------------------------------------------------------------------------------
# per-figure pipeline
# ------------------------------------------------------------------------------------------------
def smooth_skin(V, F, N, A, mode, H_edge, crop_y):
    """Selective Taubin smoothing of broad, low-curvature skin only (scanner orange-peel, thin plaster
    mould-seam ridges). Carving (lids, lips, nostrils, curls) has high medium-scale curvature and is
    masked out, so it stays crisp."""
    n_med = int(np.clip(round(2 * (mode.get('sigma', 0.010) / H_edge) ** 2), 4, 60))   # ~physical sigma
    Vs = smooth_positions(V, A, n_med)
    cm = np.abs(((V - Vs) * N).sum(1))
    cm = scalar_smooth(cm, A, 6)
    t0, t1 = mode['t']
    w = 1 - smoothstep(t0, t1, cm)
    w = scalar_smooth(w, A, 4) * mode.get('strength', 1.0)
    w *= smoothstep(crop_y + 0.02, crop_y + 0.06, V[:, 1])   # leave the cut rim and its cap alone
    V2 = taubin(V, A, mode['iters'], W=w)
    V2 = V + ((V2 - V) * N).sum(1, keepdims=True) * N      # keep only the normal component (no tangential drift)
    moved = np.abs(((V2 - V) * N).sum(1))
    log('  smoothing (%d mask its, %d taubin its): mask mean %.2f, normal move mean %.5f max %.5f (head units)'
        % (n_med, mode['iters'], w.mean(), moved.mean(), moved.max()))
    return V2, w


SMOOTH_MODES = {
    'skin': dict(t=(0.0007, 0.0018), iters=30, strength=1.0, sigma=0.010),   # sol: scanner orange-peel on cheeks/brow/neck
    'seams': dict(t=(0.0007, 0.0018), iters=10, strength=0.9, sigma=0.010),  # david: thin mould-seam ridges on cheek/neck/nose
}


def process(name, args):
    cfg = FIGURES[name]
    t_start = time.time()
    log('=== %s' % name)
    m = load_cast(cfg)
    fr = build_frame(name, cfg, m)
    ht = head_transform(name, cfg, m, fr)
    H, Rm = ht['H'], fr['R']
    ez = 0.5 * (ht['eyeC']['L'][2] + ht['eyeC']['R'][2])
    O_rot = np.array([ht['x_mid'], ht['y0'], ez - K_EAR * H])
    th = to_head_fn(Rm, O_rot, H)
    Vc_full = np.asarray(m.vertices, float)
    fw = nrm(Rm @ fr['Fw'])                         # facial-symmetry forward, head space
    an = dict(noseTip=th(fr['nose']), chin=(ht['chin'] - O_rot) / H, crown=(ht['crown'] - O_rot) / H)
    eyes_json = {}
    for lab in 'LR':
        e = fr['eyes'][lab]
        an['eyeball' + lab] = th(e['centre'])
        g = e.get('gaze_pupil', e['gaze_cap'])
        # eye anchor: centre of the exposed eyeball (direction of the visible cap's centroid, on the sphere)
        an['eye' + lab] = th(e['apex'])
        eyes_json[lab] = dict(centre=th(e['centre']), radius=e['radius'] / H, gaze=nrm(Rm @ g))
        if 'pupil' in e:
            an['pupil' + lab] = th(e['pupil'])
            eyes_json[lab]['pupilDepth'] = e['pupil_depth'] / H
    Ph, f = midline_front_profile(Vc_full, fr['n'], fr['d'], fw, an['chin'][1] - 0.02, an['noseTip'][1], 0.006 * H, Rm, O_rot, H)
    an['mouth'], mouth_note = snap_mouth(Ph, f, th(fr['hint']['mouth'])[1], float(an['noseTip'] @ fw))
    if 'beard' in fr['hint']:
        bh = th(fr['hint']['beard'])
        Vh0 = th(Vc_full)
        sel = (np.linalg.norm(Vh0 - bh, axis=1) < 0.12) & (Vh0[:, 2] > bh[2] - 0.08)
        an['beardTip'] = Vh0[np.argmin(np.where(sel, Vh0[:, 1], 1e9))]
    # ---- head space + crop
    mh = trimesh.Trimesh(th(Vc_full), np.asarray(m.faces), process=False)
    n_src = len(mh.faces)
    mh = slice_keep(mh, (0, 1, 0), (0, cfg['crop_y'], 0))
    log('  crop y >= %.2f: %d -> %d tris' % (cfg['crop_y'], n_src, len(mh.faces)))
    V = np.asarray(mh.vertices, float)
    F = np.asarray(mh.faces, np.int64)
    A = adjacency(F, len(V))
    N = vnormals(V, F)
    edge = float(np.median(mh.edges_unique_length))
    for key, on in cfg['smooth'].items():
        if on:
            V, _ = smooth_skin(V, F, N, A, SMOOTH_MODES[key], edge, cfg['crop_y'])
            N = vnormals(V, F)
    # ears -> the turn axis passes through the ear midpoint: shift the origin there (x, z)
    ears, ear_notes, ear_mid = ear_anchors(Caster(V, F), an, cfg, th, Rm, fr['n'])
    an.update(ears)
    shift = np.array([ear_mid[0], 0.0, ear_mid[2]])
    V = V - shift
    for k_ in list(an):
        if an[k_] is not None:
            an[k_] = an[k_] - shift
    for e_ in eyes_json.values():
        e_['centre'] = e_['centre'] - shift
    O_rot = O_rot + shift * H
    th = to_head_fn(Rm, O_rot, H)
    log('  origin moved to the ear midpoint: shift (%.3f, %.3f) head units' % (shift[0], shift[2]))
    mh = trimesh.Trimesh(V, F, process=False)
    # curvature fields on the dense surface (transferred to the decimated mesh below)
    cav_full, rough_full = curvature_fields(V, F, N, A, edge)
    _lab = region_labels(V, F, an, fw)
    _lv = np.zeros(len(V), int)
    np.maximum.at(_lv, F.ravel(), np.repeat(_lab, 3))
    for key in rough_full:
        log('  %s percentiles 10/50/90  face-core %s  face %s  head/hair %s  body %s' % ((key,) + tuple(
            str(np.percentile(rough_full[key][_lv == L], [10, 50, 90]).round(2)) if (_lv == L).any() else '-' for L in (3, 2, 1, 0))))
    # ---- decimation (budget toward the face)
    labels = region_labels(V, F, an, fw)
    if len(F) > cfg['target_faces'] * 1.02:
        md, reg_counts, reg_final = decimate_regions(V, F, labels, cfg['target_faces'])
        log('  decimated %d -> %d tris' % (len(F), len(md.faces)))
    else:
        md = mh
        reg_counts = reg_final = dict(zip(REGION_NAMES, [int((labels == L).sum()) for L in range(4)]))
        log('  no decimation needed (%d tris)' % len(F))
    md = keep_largest(md)
    Vd = np.asarray(md.vertices, float)
    Fd = np.asarray(md.faces, np.int64)
    Nd = vnormals(Vd, Fd)
    log('  final %d tris, %d verts, watertight %s' % (len(Fd), len(Vd), md.is_watertight))
    # ---- bakes
    caster = Caster(Vd, Fd)
    t0 = time.time()
    ao = bake_rays(Vd, Nd, caster, fib_hemisphere(48, cosine=True), BAKE['ao_maxd'])
    log('  AO baked (%.0fs), mean %.3f' % (time.time() - t0, ao.mean()))
    cone = np.vstack([[0, 0, 1.0]] + [[math.sin(math.radians(22)) * math.cos(a), math.sin(math.radians(22)) * math.sin(a),
                                        math.cos(math.radians(22))] for a in np.linspace(0, 2 * math.pi, 7)[:-1]])
    t0 = time.time()
    thick = bake_rays(Vd, Nd, caster, cone, BAKE['thick_maxd'], inward=True)
    log('  thickness baked (%.0fs), mean %.3f' % (time.time() - t0, thick.mean()))
    tree = cKDTree(V)
    _, nn = tree.query(Vd, k=4)
    cav = cav_full[nn].mean(1)
    rough = {k: v[nn].mean(1) for k, v in rough_full.items()}
    skin = 1 - smoothstep(BAKE['skin_rough'][0], BAKE['skin_rough'][1], rough['r16'])
    wr = region_weights(Vd, an, fw)
    w_face = np.maximum(wr['face'], wr['core'])
    skin = np.maximum(skin, w_face * (1 - smoothstep(1.2, 1.8, rough['r16'])))   # the whole face is skin unless curls
    skin = scalar_smooth(skin, adjacency(Fd, len(Vd)), 8)
    bake = np.stack([np.clip(ao, 0, 1) * 255,
                     128 + 127 * np.tanh(cav / BAKE['cav_scale']),
                     np.clip(thick, 0, 1) * 255,
                     skin * 255], 1).round().clip(0, 255).astype(np.uint8)
    # ---- anchors (dense surface)
    caster_full = Caster(V, F)
    body = body_anchors(mh, caster_full, an, cfg, rough_full['r16'])
    torso = body.pop('_torso')
    neck_top = body.pop('_neckTop')
    torso['neckAxis'] = body.pop('_neckAxis')
    torso['neckAxisNote'] = body.pop('_neckAxisNote', 'line fitted through 7 smooth-skin slab centroids under the jaw')
    an.update(body)
    extra = {}
    if name == 'sol':
        extra = sol_diadem(cfg, th, Vd, Fd, bake[:, 0] / 255.0, V, F)
    cuts = [dict(what='bottom crop', normal=[0.0, -1.0, 0.0], point=[0.0, cfg['crop_y'], 0.0])]
    for (nr, org), what in zip(cfg['preclip'], ('relief ground slab (source z = 7)', 'slab return on the +X edge (source x = 62)')):
        n_out = nrm(Rm @ -nrm(to_cast(nr, cfg['zup'])))
        cuts.append(dict(what=what, normal=r5(n_out), point=r5(th(to_cast(org, cfg['zup'])))))
    res = dict(cuts=cuts, mouth_note=mouth_note, name=name, cfg=cfg, V=Vd, F=Fd, N=Nd, bake=bake, an=an, eyes=eyes_json, fr=fr, ht=ht, H=H, O_rot=O_rot,
               Rm=Rm, fw=fw, ear_notes=ear_notes, torso=torso, neck_top=neck_top, extra=extra, n_src=n_src,
               rough=rough, dense=(V, F), edge_src=edge, regions=dict(source=reg_counts, final=reg_final), t=time.time() - t_start)
    return res


BAKE = dict(ao_maxd=0.25, thick_maxd=0.12, cav_scale=2.5, skin_rough=(0.5, 1.0))


def hole_mouth(Vd, ao, tree_d, Vdense, tree_dense, hint, r_find, r_in, r_out):
    """Snap a hole: bottom = most enclosed vertex (lowest AO) near the hint; the surrounding surface
    (annulus r_in..r_out around the bottom, dense mesh) gives the mouth plane; mouth = bottom projected on it."""
    ii = tree_d.query_ball_point(hint, r_find)
    b = Vd[ii[int(np.argmin(ao[ii]))]]
    jj = np.array(tree_dense.query_ball_point(b, r_out))
    ann = Vdense[jj[np.linalg.norm(Vdense[jj] - b, axis=1) > r_in]]
    c = ann.mean(0)
    _, _, vt = np.linalg.svd(ann - c, full_matrices=False)
    n = vt[2] * np.sign(vt[2] @ (c - b))
    depth = float((c - b) @ n)
    return b + n * depth, nrm(n), depth


def fit_ring(P):
    c0 = P.mean(0)
    _, sv, vt = np.linalg.svd(P - c0, full_matrices=False)
    n = vt[2] * np.sign(vt[2][1])
    e1 = vt[0]
    e2 = np.cross(n, e1)
    xy = np.c_[(P - c0) @ e1, (P - c0) @ e2]
    sol = np.linalg.lstsq(np.c_[2 * xy, np.ones(len(xy))], (xy ** 2).sum(1), rcond=None)[0]
    cc = sol[:2]
    R = math.sqrt(sol[2] + cc @ cc)
    centre = c0 + cc[0] * e1 + cc[1] * e2
    rad_res = np.linalg.norm(xy - cc, axis=1) - R
    plane_res = (P - centre) @ n
    return centre, n, R, rad_res, plane_res


def sol_diadem(cfg, th, Vd, Fd, ao, Vdense, Fdense):
    """Diadem (fillet) ring and the drilled holes where the bronze sun-rays were attached, measured on the mesh."""
    zup = cfg['zup']
    td, tD = cKDTree(Vd), cKDTree(Vdense)
    holes = []
    for h in cfg['hints']['rayHoles']:
        m, n, dep = hole_mouth(Vd, ao, td, Vdense, tD, th(to_cast(h, zup)), 0.015, 0.018, 0.035)
        holes.append((m, n, dep))
    P = np.array([h[0] for h in holes])
    centre, n, R, rad_res, plane_res = fit_ring(P)
    fwd = nrm(np.array([0, 0, 1.0]) - n * n[2])
    side = np.cross(n, fwd)
    az = [math.degrees(math.atan2((p - centre) @ side, (p - centre) @ fwd)) for p in P]
    order = np.argsort(az)
    holes = [holes[i] for i in order]
    az = [az[i] for i in order]
    sock, sock_n, sock_d = hole_mouth(Vd, ao, td, Vdense, tD, th(to_cast(cfg['hints']['crownSocket'], zup)), 0.04, 0.05, 0.085)
    log('  diadem ring: centre %s normal %s radius %.3f; radial residual max %.4f, plane residual max %.4f'
        % (centre.round(3), n.round(3), R, np.abs(rad_res).max(), np.abs(plane_res).max()))
    log('  ray holes (azimuth on the ring, + = figure\'s left): %s' % ', '.join('%.0f' % a for a in az))
    anchors = dict(
        diademRing=[r5(centre), r5(n), round(float(R), 5)],
        rayHoles=[r5(h[0]) for h in holes],
        rayHoleNormals=[r5(h[1]) for h in holes],
        rayHoleAzimuthDeg=[round(float(a), 2) for a in az],
        crownSocket=r5(sock),
    )
    info = dict(
        diadem=dict(
            ring='anchors.diademRing = [centre, unit normal (up/back), radius]: circle fitted through the %d ray-hole '
                 'mouths (radial residual max %.4f, out-of-plane max %.4f head units). The fillet runs high over the '
                 'brow and drops toward the nape.' % (len(holes), float(np.abs(rad_res).max()), float(np.abs(plane_res).max())),
            holes='anchors.rayHoles: mouths of the drilled attachment holes along the lower edge of the fillet, ordered '
                  'from the figure\'s right (-) to left (+); rayHoleNormals = local surface normal of the band at each hole '
                  '(the drill axis, roughly); rayHoleAzimuthDeg measured on the ring from the front (+Z), + = figure\'s '
                  'left. Depths (head units): %s. None at the back (the cast is unfinished there).' % ', '.join('%.4f' % h[2] for h in holes),
            socket='anchors.crownSocket: mouth of the larger rectangular socket on top of the skull (depth %.3f), '
                   'centre of the original radiate crown / nimbus fixing.' % sock_d,
        ))
    return dict(anchors=anchors, json=info, preview=sol_preview)


def sol_preview(pv, res):
    an = res['an']
    ex = res['extra']['anchors']
    c, n, R = (np.array(ex['diademRing'][0]), np.array(ex['diademRing'][1]), ex['diademRing'][2])
    e1 = nrm(np.cross(n, [1.0, 0, 0]))
    e2 = np.cross(n, e1)
    mk = {'h%d' % i: np.array(p) for i, p in enumerate(ex['rayHoles'])}
    for k in range(0, 360, 10):
        a = math.radians(k)
        mk['.%d' % k] = c + R * (math.cos(a) * e1 + math.sin(a) * e2)
    mk['socket'] = np.array(ex['crownSocket'])
    top = np.array([0, 0.22, 0.0])
    ims = []
    cav = res['bake'][:, 1] / 255.0
    for el, az in ((55, 0), (40, 55), (40, -55), (35, -110)):
        a, e = math.radians(az), math.radians(el)
        eye = top + 6 * np.array([math.sin(a) * math.cos(e), math.sin(e), math.cos(a) * math.cos(e)])
        ims.append(pv.render(eye, top, fov=10.5, W=560, H=560, mode='attr', attr=np.clip((cav - 0.2) / 0.6, 0, 1),
                             markers=mk, label='sol diadem: ray holes h*, ring (dots), socket  el %d az %d' % (el, az)))
    for el, az in ((10, 0), (10, -60)):
        a, e = math.radians(az), math.radians(el)
        eye = np.array([0, 0.1, 0]) + 4.2 * np.array([math.sin(a) * math.cos(e), math.sin(e), math.cos(a) * math.cos(e)])
        ims.append(pv.render(eye, np.array([0, 0.1, 0]), fov=24, W=560, H=560, rim_col=RIM['sol'], markers=mk,
                             label='ring anchors at eye level, az %d' % az))
    grid(ims, 3).save(PREV / 'sol-diadem.png')


# ------------------------------------------------------------------------------------------------
# output
# ------------------------------------------------------------------------------------------------
def r5(v):
    return [round(float(x), 5) for x in np.asarray(v).ravel()]


def write_outputs(res):
    name, cfg = res['name'], res['cfg']
    V = res['V'].astype('<f4')
    Ni = np.round(res['N'] * 32767).clip(-32767, 32767).astype('<i2')
    B = res['bake'].astype('u1')
    I = res['F'].astype('<u4')
    blobs, layout, off = [], {}, 0

    def add(key, arr, meta):
        nonlocal off
        b = arr.tobytes()
        layout[key] = dict(offset=off, byteLength=len(b), **meta)
        blobs.append(b)
        off += len(b)
        pad = (-off) % 4
        if pad:
            blobs.append(b'\0' * pad)
            off += pad
    add('position', V, dict(type='float32', components=3, stride=12, normalized=False))
    add('normal', Ni, dict(type='int16', components=3, stride=6, normalized=True))
    add('bake', B, dict(type='uint8', components=4, stride=4, normalized=True,
                        channels=['ao', 'cavity', 'thickness', 'skin']))
    add('index', I, dict(type='uint32', components=1, count=int(I.size)))
    OUT.mkdir(parents=True, exist_ok=True)
    with open(OUT / (name + '.bin'), 'wb') as fh:
        for b in blobs:
            fh.write(b)
    an = res['an']
    H, Rm, O_rot, fr = res['H'], res['Rm'], res['O_rot'], res['fr']
    C = np.array([[1, 0, 0], [0, 0, 1], [0, -1, 0]], float) if cfg['zup'] else np.eye(3)
    M = np.eye(4)
    M[:3, :3] = Rm @ C / H
    M[:3, 3] = -O_rot / H
    p = math.radians(fr['pitch'])
    anchors = {k: r5(v) for k, v in an.items() if v is not None}
    anchors.update(res['extra'].get('anchors', {}))
    j = dict(
        figure=name,
        source=cfg['source'],
        counts=dict(vertices=int(len(V)), triangles=int(len(I)), sourceTriangles=int(res['n_src'])),
        layout=dict(file=name + '.bin', byteLength=off, littleEndian=True, interleaved=False, attributes={
            k: v for k, v in layout.items() if k != 'index'}, index=layout['index']),
        bounds=dict(min=r5(V.min(0)), max=r5(V.max(0))),
        frame=dict(
            units='1.0 = chin-to-crown head height (vertical); source units per head = %.4f' % H,
            axes='+Y up = vertical turn axis; +Z = measured gaze (a camera on +Z at eye height is stared at); '
                 '+X = Y x Z = the figure\'s own left. L/R in anchor names = the figure\'s own left/right.',
            origin='head centre: halfway between chin and crown, on the turn axis through the neck between the ears',
            sourceToHead=[r5(row) for row in M],
            sourceUnitsPerHead=round(float(H), 5),
            levelPitchDeg=round(float(fr['pitch']), 3),
            castUpInHead=r5([0, math.cos(p), math.sin(p)]),
            restoreCastPosture='rotate head-space geometry about +X by %.3f deg to restore the cast\'s own vertical '
                               '(the gaze then rises %.2f deg above horizontal)' % (-fr['pitch'], fr['pitch']),
            gazeYawFromFaceDeg=round(float(fr['yaw']), 3),
            facialForward=r5(res['fw']),
            profileSide='-X',
            cropY=cfg['crop_y'],
            cuts=res['cuts'],
            cutsNote='capped plane cuts: normal = outward normal of the flat cap (head space), point = a point on the '
                     'plane. A cap is seen only from cameras on its outward side.',
        ),
        eyes={k: dict(centre=r5(e['centre']), radius=round(float(e['radius']), 5), gaze=r5(e['gaze']),
                      **({'pupilDepth': round(float(e['pupilDepth']), 5)} if 'pupilDepth' in e else {}))
              for k, e in res['eyes'].items()},
        anchors=anchors,
        torso=dict(forward=r5(res['torso']['forward']), left=r5(res['torso']['left']),
                   neckAxisUp=r5(res['torso']['neckAxis']), neckAxisFit=res['torso']['neckAxisNote'],
                   note='forward/left: horizontal directions the chest faces / its own left (principal axis of the '
                        'cross-section above the cut); neckAxisUp: line through the neck\'s smooth-skin cross-section '
                        'centroids under the jaw (see neckAxisFit). shoulderL/R: top of the shoulder slope 0.40-0.46 to '
                        'either side of the turn axis along torso.left (highest smooth-skin vertex there, outside the '
                        'head, below chin + 0.12; the casts are cut well inside the real acromion). neckBase: the neck '
                        'axis at the mean shoulder height, at most chin - 0.12 (approximate, +-0.05; on the bearded giant '
                        'the throat is hidden by the beard).'),
        bake=dict(
            ao='channel 0: ambient visibility, 48 cosine-weighted rays per vertex, mean normalised free distance '
               'up to %.2f head units (1 = open, 0 = enclosed)' % BAKE['ao_maxd'],
            cavity='channel 1: signed multi-scale curvature, 0.5 = flat, < 0.5 crevice (curl undercuts, eye corners, '
                   'lid creases, nostrils), > 0.5 ridge/edge; value = 0.5 + 0.5*tanh(c/%.1f), c in robust-sigma units' % BAKE['cav_scale'],
            thickness='channel 2: inward free distance along -normal (7-ray 22 deg cone) / %.2f head units; low = thin '
                      '(nose wings, ears, lids, curl tips, lips): use for subsurface translucency' % BAKE['thick_maxd'],
            skin='channel 3: 1 = broad smooth carved skin (face, neck, chest), 0 = hair/beard/deep carving; '
                 'use for polish/gloss and SSS strength',
        ),
        **res['extra'].get('json', {}),
        notes=res['notes'],
    )
    with open(OUT / (name + '.json'), 'w') as fh:
        json.dump(j, fh, indent=1)
    log('  wrote %s.bin (%.2f MB) and %s.json' % (name, off / 1e6, name))
    return j


# ------------------------------------------------------------------------------------------------
# previews (embree ray casting, black background)
# ------------------------------------------------------------------------------------------------
class Preview:
    def __init__(self, V, F, N, bake=None):
        self.V, self.F, self.N, self.bake = V, F, N, bake
        self.c = Caster(V, F)

    def render(self, eye, target, fov=20.0, W=480, H=640, key=(-0.6, 0.7, 0.5), rim=(0.8, 0.3, -0.7),
               mode='marble', attr=None, markers=None, label=None, rim_col=(0.6, 0.75, 1.0), markers_hidden=True):
        eye = np.asarray(eye, float)
        f = nrm(np.asarray(target, float) - eye)
        r = nrm(np.cross(f, [0, 1, 0]))
        u = np.cross(r, f)
        ys, xs = np.mgrid[0:H, 0:W]
        t = math.tan(math.radians(fov) / 2)
        sx = ((xs + 0.5) / W * 2 - 1) * t * W / H
        sy = (1 - (ys + 0.5) / H * 2) * t
        d = nrm(f + sx[..., None] * r + sy[..., None] * u).reshape(-1, 3)
        loc, ir, it = self.c.first(np.broadcast_to(eye, d.shape), d)
        img = np.zeros((W * H, 3))
        bc = trimesh.triangles.points_to_barycentric(self.V[self.F[it]], loc)
        n = nrm((self.N[self.F[it]] * bc[..., None]).sum(1))
        # lights are given in camera space (x right, y up, z toward camera)
        Lk = nrm(np.asarray(key)[0] * r + np.asarray(key)[1] * u - np.asarray(key)[2] * f)
        Lr = nrm(np.asarray(rim)[0] * r + np.asarray(rim)[1] * u - np.asarray(rim)[2] * f)
        if mode == 'attr':
            a = (attr[self.F[it]] * bc).sum(1)
            col = np.stack([a, a, a], 1)
        else:
            lam = np.clip(n @ Lk, 0, 1)
            lit = lam > 0
            so = loc[lit] + n[lit] * 1e-4
            hit = self.c.ri.intersects_any(so, np.ascontiguousarray(np.broadcast_to(Lk, so.shape)))
            sh = np.ones(len(loc))
            sh[np.where(lit)[0][hit]] = 0.0
            if self.bake is not None:
                b = (self.bake[self.F[it]].astype(float) / 255 * bc[..., None]).sum(1)
                ao, cav, thick = b[:, 0], b[:, 1], b[:, 2]
            else:
                ao = np.ones(len(loc)); cav = np.full(len(loc), 0.5); thick = np.ones(len(loc))
            cavf = np.clip(0.55 + 0.9 * (cav - 0.5), 0.2, 1.15)
            base = np.array([0.93, 0.91, 0.88])
            V_ = -d[ir]
            hv = nrm(Lk + V_)
            spec = 0.12 * np.clip((n * hv).sum(1), 0, 1) ** 40 * sh
            trans = (1 - thick) ** 2 * np.clip(-(n @ Lk) * 0.5 + 0.5, 0, 1) * 0.35   # light bleeding through thin parts
            rimv = np.clip(n @ Lr, 0, 1) ** 2.5 * 0.9
            key_c = (lam * sh * 1.35)[:, None] * base * cavf[:, None]
            fill = (0.06 * (0.5 + 0.5 * n[:, 1]) * ao * cavf)[:, None] * base
            col = key_c + fill + (trans[:, None] * np.array([1.0, 0.85, 0.7])) + rimv[:, None] * np.asarray(rim_col) * ao[:, None] + spec[:, None]
        img[ir] = np.clip(col, 0, 1) ** (1 / 2.2)
        im = Image.fromarray((img.reshape(H, W, 3) * 255).astype(np.uint8))
        self.cam = (eye, f, r, u, t, W, H)
        dr = ImageDraw.Draw(im)
        if markers:
            cols = [(255, 70, 70), (70, 255, 90), (90, 170, 255), (255, 220, 40), (255, 90, 255), (40, 255, 255), (255, 150, 40)]
            names = [k for k, v in markers.items() if v is not None]
            P_ = np.array([markers[k] for k in names], float)
            dd = nrm(P_ - eye)
            dist = np.linalg.norm(P_ - eye, axis=1)
            hit = self.c.distances(np.repeat(eye[None], len(P_), 0), dd, 1e9)
            visible = hit > dist - 0.012
            for i, nm in enumerate(names):
                q_ = P_[i] - eye
                z = q_ @ f
                if z <= 0:
                    continue
                px = (q_ @ r / z / (t * W / H) + 1) / 2 * W
                py = (1 - q_ @ u / z / t) / 2 * H
                cc = cols[i % len(cols)]
                if visible[i]:
                    dr.ellipse([px - 4, py - 4, px + 4, py + 4], outline=cc, width=2)
                    if not nm.startswith('.'):
                        dr.text((px + 6, py - 6), nm, fill=cc)
                elif markers_hidden:
                    dr.ellipse([px - 1.5, py - 1.5, px + 1.5, py + 1.5], fill=tuple(int(c_ * 0.5) for c_ in cc))
        if label:
            dr.text((6, 6), label, fill=(255, 200, 60))
        return im


def ring_eye(yaw_deg, dist, y=0.0, side=-1):
    """camera position on the turn ring: yaw 0 = on +Z (stared at), yaw 90 = profile, seen from `side` X."""
    a = math.radians(yaw_deg)
    return np.array([side * math.sin(a) * dist, y, math.cos(a) * dist])


def grid(ims, cols):
    w, h = ims[0].size
    rows = (len(ims) + cols - 1) // cols
    out = Image.new('RGB', (w * cols, h * rows))
    for i, im in enumerate(ims):
        out.paste(im, ((i % cols) * w, (i // cols) * h))
    return out


RIM = dict(david=(0.55, 0.72, 1.0), sol=(1.0, 0.78, 0.38), prometheus=(1.0, 0.45, 0.22))


def previews(res):
    name, an = res['name'], res['an']
    PREV.mkdir(parents=True, exist_ok=True)
    pv = Preview(res['V'], res['F'], res['N'], res['bake'])
    rc = RIM[name]
    mk = {k: v for k, v in an.items() if not k.startswith('eyeball')}
    eyes_mid = 0.5 * (an['eyeL'] + an['eyeR'])
    tgt = np.array([0, -0.2, 0.05])
    ims = []
    for yaw in (90, 45, 0):
        ims.append(pv.render(ring_eye(yaw, 4.6, tgt[1]), tgt, fov=26, W=480, H=720, markers=mk, rim_col=rc,
                             label='%s yaw %d (head space)' % (name, yaw)))
    for yaw in (90, 45, 0):
        ims.append(pv.render(ring_eye(yaw, 2.6, -0.05), np.array([0, -0.05, 0.1]), fov=26, W=480, H=720, rim_col=rc,
                             label='yaw %d' % yaw))
    grid(ims, 3).save(PREV / ('%s-turn.png' % name))
    # ECU of the eyes, straight down the lens
    ecu = [pv.render(eyes_mid + np.array([0, 0, 1.6]), eyes_mid, fov=14, W=900, H=420, rim_col=rc,
                     markers={k: an.get(k) for k in ('eyeL', 'eyeR', 'pupilL', 'pupilR', 'eyeballL', 'eyeballR') if an.get(k) is not None},
                     label='%s ECU eyes, yaw 0 (markers)' % name),
           pv.render(eyes_mid + np.array([0, 0, 1.6]), eyes_mid, fov=14, W=900, H=420, rim_col=rc, key=(-0.3, 0.6, 0.75),
                     label='yaw 0: the stare')]
    grid(ecu, 1).save(PREV / ('%s-eyes.png' % name))
    # bakes
    b = res['bake'].astype(float) / 255
    e3 = ring_eye(30, 3.0, -0.1)
    bk = [pv.render(e3, tgt, fov=28, W=400, H=560, mode='attr', attr=b[:, i], label=lab)
          for i, lab in enumerate(('ao', 'cavity', 'thickness', 'skin'))]
    # triangle density (edge length) map
    el = np.zeros(len(res['V']))
    E = res['F']
    ln = np.linalg.norm(res['V'][E[:, [1, 2, 0]]] - res['V'][E], axis=2).mean(1)
    cnt = np.zeros(len(res['V']))
    for k in range(3):
        np.add.at(el, E[:, k], ln)
        np.add.at(cnt, E[:, k], 1)
    el /= np.maximum(cnt, 1)
    dens = 1 - np.clip((np.log(el) - np.log(np.percentile(el, 2))) / (np.log(np.percentile(el, 98)) - np.log(np.percentile(el, 2))), 0, 1)
    bk.append(pv.render(e3, tgt, fov=28, W=400, H=560, mode='attr', attr=dens, label='triangle density'))
    grid(bk, 5).save(PREV / ('%s-bakes.png' % name))
    if res['extra'].get('preview'):
        res['extra']['preview'](pv, res)


# ------------------------------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--figure', default='all', choices=['all'] + list(FIGURES))
    ap.add_argument('--no-previews', action='store_true')
    args = ap.parse_args()
    names = list(FIGURES) if args.figure == 'all' else [args.figure]
    summary = []
    for name in names:
        res = process(name, args)
        res['notes'] = NOTES[name](res)
        j = write_outputs(res)
        if not args.no_previews:
            previews(res)
        summary.append((name, j['counts']['triangles'], j['counts']['vertices'], os.path.getsize(OUT / (name + '.bin'))))
        log('  %s done in %.0fs' % (name, time.time() - (time.time() - res['t'])))
    tot = 0
    for name, t, v, sz in summary:
        print('%-11s %8d tris %8d verts %7.2f MB' % (name, t, v, sz / 1e6))
        tot += sz + os.path.getsize(OUT / (name + '.json'))
    print('total media/scenes/statue: %.2f MB' % (tot / 1e6))


# ------------------------------------------------------------------------------------------------
# notes written into each json (measurements filled in at run time)
# ------------------------------------------------------------------------------------------------
def _common_notes(res):
    fr = res['fr']
    return [
        'Gaze per eye measured relative to the facial symmetry plane (deg, +yaw = figure\'s left, +pitch = up): %s.'
        % json.dumps({k: {kk: float(vv) for kk, vv in v.items()} for k, v in fr['gaze_meas'].items()}),
        'Facial symmetry plane residual %.4f head units (mirror-ICP on the face).' % fr['sym_resid'],
        'Crop: one horizontal plane at y = %.2f, capped (flat cap facing -Y); keep it out of frame or in shadow.'
        % res['cfg']['crop_y'],
        'Turn: yaw about +Y through the origin. The 90-degree turn starts with the camera on the figure\'s RIGHT '
        '(-X side, face pointing screen-right) and ends on +Z (stared at).',
        'Ears: %s' % '; '.join('%s %s' % kv for kv in res['ear_notes'].items()),
        'Head units: 1.0 = %.3f source units (raw STL units).' % res['H'],
        'Mouth anchor (stomion): %s.' % res['mouth_note'],
    ]


def _notes_david(res):
    fr = res['fr']
    return _common_notes(res) + [
        'Carved heart-shaped pupils: each eye\'s gaze = eyeball sphere centre -> pupil pit centroid. Michelangelo\'s eyes '
        'diverge (the left eye looks further to his left); +Z is the mean of the two, %.1f deg to the figure\'s left of the '
        'facial symmetry axis, so at yaw 0 the face is seen slightly turned while the eyes look into the lens.' % fr['yaw'],
        'The cast\'s gaze runs %.1f deg below horizontal; head space is levelled (head tipped back by that amount) so the '
        'stare is horizontal. frame.restoreCastPosture undoes it (then place the camera below eye level).' % -fr['pitch'],
        'Thin plaster mould-seam ridges (cheek, neck, nose bridge) softened with a masked Taubin smooth on broad skin only.',
        'Profile side: the right (-X) side shows the broad chest frontally with the head in profile (the classic view '
        'of the SMK photograph). The bust back is hollow (visible from behind and from the far +X side).',
    ]


def _notes_sol(res):
    fr = res['fr']
    return _common_notes(res) + [
        'Blank (uncarved) eyes. Yaw = mean of the two eyeball caps (%.1f deg). The Hellenistic upturned gaze measured %.1f '
        'deg above horizontal by visual judgement (renders at camera pitch 0..20 deg; the lid-aperture geometry is biased '
        'by the overhanging upper lid). CHOICE: levelled, so the blank eyes meet the lens at eye height for the final '
        'stare; the upward pathos remains in the face and the tilt of the head. frame.restoreCastPosture gives the '
        'original upturn back.' % (fr['yaw'], fr['pitch']),
        'Scanner orange-peel removed from broad, low-curvature skin (cheeks, brow, neck) by a masked Taubin smooth; '
        'lids, lips, nostrils and curls are masked out and stay crisp.',
        'The bust and nose tip are restorations (SMK). The bust back is hollow with a support post inside (only seen '
        'from behind).',
    ]


def cap_visibility(cuts):
    """turn yaws (camera on the arc yaw 90 = -X profile .. 0 = +Z, at eye level) from which each cap faces the camera"""
    out = []
    for c in cuts[1:]:
        n = np.array(c['normal'])
        vis = [y for y in range(0, 91) if n @ np.array([-math.sin(math.radians(y)), 0, math.cos(math.radians(y))]) > 0]
        rng = ('yaw %d-%d' % (min(vis), max(vis))) if vis else 'never'
        out.append('%s cap (outward normal %s) faces the camera on the turn arc: %s' % (c['what'], c['normal'], rng))
    return out


def _notes_prometheus(res):
    fr = res['fr']
    return _common_notes(res) + cap_visibility(res['cuts']) + [
        'STAND-IN: the giant (Klytios?) from the Pergamon Altar Gigantomachy; no freely licensed scan of a marble '
        'Prometheus exists. Same Hellenistic pathos face family as Laocoon and Adam\'s Prometheus.',
        'Relief slab removed: cut at source z = 7 (relief ground, a big flat cap behind the head and back) and x = 62 '
        '(its return, which cuts through the figure\'s left shoulder: a slanted flat face beside the beard, lower right '
        'of frame at yaw 0). Approach the profile ONLY from the -X side (see the cap visibility notes and frame.cuts); '
        'keep the shoulder cap out of frame or in shadow in the last, frontal inserts. The arms are broken off (no hands).',
        'Blank eyes. Yaw = mean of the two eyeball caps (%.1f deg); pitch %.1f deg chosen visually (renders at camera '
        'pitch -15..+25); head space is levelled.' % (fr['yaw'], fr['pitch']),
        'The chin is hidden in the beard: anchors.chin is an ESTIMATE (see frame); anchors.beardTip is the lowest point '
        'of the beard. Head units therefore use an anatomical chin, not the beard.',
    ]


NOTES = dict(david=_notes_david, sol=_notes_sol, prometheus=_notes_prometheus)


if __name__ == '__main__':
    main()
