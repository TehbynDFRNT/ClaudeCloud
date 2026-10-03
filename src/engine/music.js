// Map score positions (bar/eighth from analysis/grid.json, in source seconds) to film time,
// using the audio placements in film-plan.json. One clock for picture and sound.

export class Music {
  constructor(plan, grid) {
    this.fps = evalFps(plan.fps);
    this.placements = plan.audio.filter((a) => a.path && a.path.includes('winter'));
    this.grid = grid;
    // flat list of eighths with film times (only those that land inside a placement)
    this.eighths = [];
    for (const b of grid.bars) {
      b.eighths.forEach((s, k) => {
        const t = this.sourceToFilm(s);
        if (t !== null) this.eighths.push({ bar: b.bar, k, src: s, t, bass: b.bassMidi[k] });
      });
    }
  }
  sourceToFilm(s) {
    for (const a of this.placements) {
      const t0 = a.timelineStart / this.fps, t1 = a.timelineEnd / this.fps;
      const t = t0 + (s - a.sourceInSeconds) / (a.playbackRate || 1);
      if (t >= t0 - 1e-6 && t < t1) return t;
    }
    return null;
  }
  // film time of bar (1-based) + eighth offset (may be fractional); null if not in the film
  at(bar, eighth = 0) {
    const b = this.grid.bars[bar - 1];
    if (!b) return null;
    const k = Math.floor(eighth), fr = eighth - k;
    const next = k + 1 < 8 ? b.eighths[k + 1] : (this.grid.bars[bar] ? this.grid.bars[bar].eighths[0] : b.end);
    const s = b.eighths[Math.min(7, k)] + (next - b.eighths[Math.min(7, k)]) * fr;
    return this.sourceToFilm(s);
  }
  // most recent eighth at film time t: {bar,k,t,since,period}
  pulse(t) {
    const E = this.eighths;
    let lo = 0, hi = E.length - 1;
    if (!E.length || t < E[0].t) return null;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (E[m].t <= t) lo = m; else hi = m - 1; }
    const e = E[lo], n = E[lo + 1];
    const period = n && n.t - e.t < 1.0 ? n.t - e.t : 0.45;
    return { ...e, since: t - e.t, period };
  }
}

export function evalFps(s) {
  if (typeof s === 'number') return s;
  const [a, b] = String(s).split('/').map(Number);
  return b ? a / b : a;
}
