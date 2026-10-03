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
                   chin=[42.68, 38.88, 79.96]),
        nose_window=(95, 120),          # cast-Y window for the nose search (his forelock curls project further)
        pupils=True,                    # carved (heart-shaped) pupils: gaze measured from them
        gaze_pitch=None,                # None = measured
        preclip=[],
        crop_y=-0.92,                   # bottom cut, head units (below the chin = -0.5)
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
                   chin=[9.37, 22.88, 69.86]),
        nose_window=None,
        pupils=False,
        gaze_pitch=6.0,                 # blank eyes: upturn judged visually (see notes)
        preclip=[],
        crop_y=-0.95,
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
        nose_window=None,
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
    near = np.linalg.norm(V - hint['nose'], axis=1) < 0.1 * np.ptp(V[:, 1])
    nose = V[np.argmax(np.where(near, V @ fd_h, -1e18))]
    Hest = (V[:, 1].max() - hint[('chin' if 'chin' in hint else 'beard')][1])
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
