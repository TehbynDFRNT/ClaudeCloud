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
                   chin=[42.68, 38.88, 79.96], mouth=[39.39, 32.38, 95.45]),
        # head-space hints (head units, final frame), snapped on the mesh
        head_hints=dict(earR=[None, -0.13, -0.10], earL=[None, -0.13, 0.10]),
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
                   chin=[9.37, 22.88, 69.86], mouth=[8.86, 22.4, 78.95]),
        head_hints=dict(),
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
        head_hints=dict(),
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
K_EAR = 0.26       # ear-canal midpoint lies this far (head units) behind the eyeball centres along +Z (measured on david)


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


def snap_mouth(Ph, f, hint_y, span=0.03):
    """stomion: deepest point (along the facial forward axis) of the midline front profile near hint_y."""
    bins = np.arange(hint_y - span, hint_y + span, 0.002)
    best = None
    prof = []
    for b0 in bins:
        k = (Ph[:, 1] >= b0) & (Ph[:, 1] < b0 + 0.002)
        if k.any():
            i = np.argmax(np.where(k, f, -1e9))
            prof.append((f[i], Ph[i]))
    fs = np.array([p[0] for p in prof])
    i = int(np.argmin(fs[2:-2])) + 2 if len(fs) > 5 else int(np.argmin(fs))
    return prof[i][1]


def importance(V, an, fw):
    """Per-vertex decimation weight (pymeshlab quality): budget toward eyes, lids, lips, nose."""
    eyes = np.minimum(np.linalg.norm(V - an['eyeballL'], axis=1), np.linalg.norm(V - an['eyeballR'], axis=1))
    w_eye = 1 - smoothstep(0.075, 0.13, eyes)
    w_lip = 1 - smoothstep(0.05, 0.09, np.linalg.norm(V - an['mouth'], axis=1))
    w_nose = 1 - smoothstep(0.04, 0.08, np.linalg.norm(V - an['noseTip'], axis=1))
    pc = (an['eyeballL'] + an['eyeballR']) / 2 * 0.6 + an['mouth'] * 0.4
    dpc = V - pc
    w_face = (1 - smoothstep(0.22, 0.34, np.linalg.norm(dpc, axis=1))) * smoothstep(-0.12, 0.0, dpc @ fw)
    w_head = smoothstep(an['chin'][1] - 0.15, an['chin'][1] + 0.02, V[:, 1])
    w_neck = smoothstep(-0.85, -0.55, V[:, 1])
    w = 0.25 + 0.5 * w_neck + 1.6 * w_head + 4.0 * w_face + 3.0 * np.maximum(w_eye, np.maximum(w_lip, w_nose))
    return w


def decimate(V, F, q, target):
    import pymeshlab
    ms = pymeshlab.MeshSet()
    ms.add_mesh(pymeshlab.Mesh(vertex_matrix=V, face_matrix=F, v_scalar_array=q))
    ms.meshing_decimation_quadric_edge_collapse(targetfacenum=int(target), qualityweight=True, preservenormal=True,
                                                optimalplacement=True, planarquadric=True, qualitythr=0.4, autoclean=True)
    mm = ms.current_mesh()
    m = trimesh.Trimesh(mm.vertex_matrix().astype(float), mm.face_matrix().astype(np.int64), process=True)
    m.update_faces(m.nondegenerate_faces())
    m.update_faces(m.unique_faces())
    m.remove_unreferenced_vertices()
    return m


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
    rough = scalar_smooth(np.abs(cs[1]), A, 40)
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


def body_anchors(m, caster, an, cfg):
    V = np.asarray(m.vertices)
    up = np.array([0, 1.0, 0])
    # neck axis just under the jaw
    y_jaw = an['chin'][1] - 0.10
    nl = neck_loop(m, y_jaw)
    neck_top = nl[1]
    # torso lateral axis from the cross-section just above the cut
    y_s = cfg['crop_y'] + 0.06
    band = np.abs(V[:, 1] - y_s) < 0.01
    P = V[band][:, [0, 2]]
    c = P.mean(0)
    _, _, vt = np.linalg.svd(P - c, full_matrices=False)
    lat = np.array([vt[0][0], 0, vt[0][1]])
    fwd_t = np.cross(lat, up)
    if fwd_t @ np.asarray(cfg['torso_dir'], float) < 0:
        fwd_t = -fwd_t
    left_t = np.cross(up, fwd_t)                 # torso's own left
    out = {}
    for lab, sgn in (('shoulderL', 1), ('shoulderR', -1)):
        rel = V - neck_top
        lt = rel @ left_t
        ft = rel @ fwd_t
        sel = (sgn * lt > 0.34) & (sgn * lt < 0.42) & (np.abs(ft) < 0.18)
        if sel.any():
            out[lab] = V[np.argmax(np.where(sel, V[:, 1], -1e9))]
    ys = [out[k][1] for k in out]
    y_nb = (max(ys) if ys else an['chin'][1] - 0.25) + 0.02
    nb = neck_loop(m, y_nb, (neck_top[0], neck_top[2]))
    out['neckBase'] = nb[1] if nb else neck_top
    out['_torso'] = dict(forward=fwd_t, left=left_t)
    out['_neckTop'] = neck_top
    return out


def ear_anchors(caster, an, cfg):
    out, notes = {}, {}
    hh = cfg.get('head_hints', {})
    for lab, sgn in (('earL', 1), ('earR', -1)):
        if lab in hh:
            _, y, z = hh[lab]
            p = side_ray_point(caster, y, z, sgn, spread=0.03, medial=True)
            out[lab] = p
            notes[lab] = 'measured: most medial point of the ear bowl (concha) seen from the side'
        else:
            y = 0.5 * (an['eyeballL'][1] + an['eyeballR'][1]) - 0.07
            p = side_ray_point(caster, y, 0.0, sgn)
            out[lab] = p
            notes[lab] = 'ESTIMATED: ear covered by hair; surface point beside the turn axis, 0.07 below eye height'
    return out, notes


# ------------------------------------------------------------------------------------------------
# per-figure pipeline
# ------------------------------------------------------------------------------------------------
def smooth_skin(V, F, N, A, mode, H_edge):
    """Selective Taubin smoothing of broad, low-curvature skin only (scanner orange-peel, thin plaster
    mould-seam ridges). Carving (lids, lips, nostrils, curls) has high medium-scale curvature and is
    masked out, so it stays crisp."""
    Vs = smooth_positions(V, A, 12)
    cm = np.abs(((V - Vs) * N).sum(1))
    cm = scalar_smooth(cm, A, 6)
    t0, t1 = mode['t']
    w = 1 - smoothstep(t0, t1, cm)
    w = scalar_smooth(w, A, 4) * mode.get('strength', 1.0)
    V2 = taubin(V, A, mode['iters'], W=w)
    moved = np.linalg.norm(V2 - V, axis=1)
    log('  smoothing: mask mean %.2f, moved mean %.5f max %.5f (head units)' % (w.mean(), moved.mean(), moved.max()))
    return V2, w


SMOOTH_MODES = {
    'skin': dict(t=(0.0006, 0.0020), iters=10, strength=1.0),     # sol: scanner orange-peel on cheeks/brow/neck
    'seams': dict(t=(0.0005, 0.0016), iters=8, strength=0.9),     # david: thin mould-seam ridges on cheek/neck/nose
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
        an['eye' + lab] = th(e['apex'])
        g = e.get('gaze_pupil', e['gaze_cap'])
        eyes_json[lab] = dict(centre=th(e['centre']), radius=e['radius'] / H, gaze=nrm(Rm @ g))
        if 'pupil' in e:
            an['pupil' + lab] = th(e['pupil'])
            eyes_json[lab]['pupilDepth'] = e['pupil_depth'] / H
    Ph, f = midline_front_profile(Vc_full, fr['n'], fr['d'], fw, an['chin'][1] - 0.02, an['noseTip'][1], 0.006 * H, Rm, O_rot, H)
    an['mouth'] = snap_mouth(Ph, f, th(fr['hint']['mouth'])[1])
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
            V, _ = smooth_skin(V, F, N, A, SMOOTH_MODES[key], edge)
            N = vnormals(V, F)
    mh = trimesh.Trimesh(V, F, process=False)
    # curvature fields on the dense surface (transferred to the decimated mesh below)
    cav_full, rough_full = curvature_fields(V, F, N, A, edge)
    # ---- decimation (budget toward the face)
    q = importance(V, an, fw)
    if len(F) > cfg['target_faces'] * 1.02:
        md = decimate(V, F, q, cfg['target_faces'])
        log('  decimated %d -> %d tris' % (len(F), len(md.faces)))
    else:
        md = mh
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
    rough = rough_full[nn].mean(1)
    skin = 1 - smoothstep(BAKE['skin_rough'][0], BAKE['skin_rough'][1], rough)
    bake = np.stack([np.clip(ao, 0, 1) * 255,
                     128 + 127 * np.tanh(cav / BAKE['cav_scale']),
                     np.clip(thick, 0, 1) * 255,
                     skin * 255], 1).round().clip(0, 255).astype(np.uint8)
    # ---- anchors (dense surface)
    caster_full = Caster(V, F)
    ears, ear_notes = ear_anchors(caster_full, an, cfg)
    an.update(ears)
    body = body_anchors(mh, caster_full, an, cfg)
    torso = body.pop('_torso')
    neck_top = body.pop('_neckTop')
    an.update(body)
    extra = {}
    if name == 'sol':
        extra = sol_diadem(mh, caster_full, an)
    res = dict(name=name, cfg=cfg, V=Vd, F=Fd, N=Nd, bake=bake, an=an, eyes=eyes_json, fr=fr, ht=ht, H=H, O_rot=O_rot,
               Rm=Rm, fw=fw, ear_notes=ear_notes, torso=torso, neck_top=neck_top, extra=extra, n_src=n_src,
               edge_src=edge, q_stats=None, t=time.time() - t_start)
    return res


BAKE = dict(ao_maxd=0.25, thick_maxd=0.12, cav_scale=2.5, skin_rough=(0.9, 1.8))


def sol_diadem(m, caster, an):
    """Placeholder until the diadem is measured (filled in below)."""
    return {}
