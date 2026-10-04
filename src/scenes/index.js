// Scene registry. Each scene: { id, scale?, presets?, init(E), render(E, S, target), overlay?(E, S, ctx), post?(E, S) }
// presets: { [shotId]: params } — per-shot parameters live with the scene that renders them.
// preload?(plan): async, awaited before the first frame (load external assets; keep them in media/scenes/<id>/,
// which the frame fingerprint covers).
import redgiant from './redgiant.js';
import whitedwarf from './whitedwarf.js';
import binary from './binary.js';
import studies from './studies.js';
import vortex from './vortex.js';
import atoms from './atoms.js';
import plasma from './plasma.js';
import nova from './nova.js';
import voidScene from './void.js';
import earthsky from './earthsky.js';
import statue from './statue.js';

export const scenes = Object.fromEntries([redgiant, whitedwarf, binary, studies, vortex, atoms, plasma, nova, voidScene, earthsky, statue].map((s) => [s.id, s]));
