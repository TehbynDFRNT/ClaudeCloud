// Titles from film-plan.json `text` items. Drawn display-referred and composited after
// tonemapping so names stay crisp and calm whatever the exposure is doing.
// style "name": first line Roman capitals (Cinzel), following lines small italic (Cormorant).
// style "credit": small centred lines. style "title": large spaced capitals, centred.
// style "line": one centred line; `font` 'cinzel' | 'cormorant' (italic), `size` in px at 1080 short side.
// Sizes follow the frame's SHORT side; a portrait (9:16) frame sets type 1.3x larger for phone viewing,
// and every line is shrunk to fit 86% of the frame width if it would overflow.

const FONTS = { cinzel: (px) => `400 ${px}px Cinzel`, cormorant: (px) => `italic 400 ${px}px "Cormorant Garamond"` };

function fitText(ctx, text, x, y, maxW, font, size, spacing) {
  let px = size, sp = spacing;
  ctx.font = font(Math.round(px)); ctx.letterSpacing = `${Math.round(sp)}px`;
  let w = ctx.measureText(text).width;
  if (w > maxW) { const k = maxW / w; px *= k; sp *= k; ctx.font = font(Math.round(px)); ctx.letterSpacing = `${Math.round(sp)}px`; }
  ctx.fillText(text, x, y);
  return px / size;
}

export function drawTitles(ctx, items, f, fps, W, H) {
  let any = false;
  ctx.clearRect(0, 0, W, H);
  const portrait = H > W;
  const s = (Math.min(W, H) / 1080) * (portrait ? 1.3 : 1);
  const maxW = W * 0.86;
  for (const it of items) {
    if (f < it.start || f >= it.end) continue;
    any = true;
    const fadeIn = it.fadeIn ?? 14, fadeOut = it.fadeOut ?? 14;
    const a = Math.min(1, (f - it.start + 1) / fadeIn, (it.end - f) / fadeOut);
    const alpha = a * a * (3 - 2 * a);
    const lines = it.content.split('\n');
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = it.color || 'rgba(236,226,210,1)';
    ctx.textBaseline = 'alphabetic';
    const style = it.style || 'name';
    if (style === 'name') {
      const x = (it.x ?? (portrait ? 0.09 : 0.075)) * W, y = (it.y ?? (portrait ? 0.78 : 0.80)) * H;
      ctx.textAlign = it.align || 'left';
      fitText(ctx, lines[0], x, y, W - 2 * x, FONTS.cinzel, 34 * s, 14 * s);
      ctx.globalAlpha = alpha * 0.78;
      lines.slice(1).forEach((l, i) => fitText(ctx, l, x + 2 * s, y + (38 + i * 30) * s, W - 2 * x, FONTS.cormorant, 25 * s, 1.5 * s));
    } else if (style === 'title') {
      ctx.textAlign = 'center';
      const y = (it.y ?? 0.5) * H;
      // letter-spacing adds trailing space after the last glyph; nudge right by half of it to centre the ink
      fitText(ctx, lines[0], W / 2 + 13 * s, y, maxW, FONTS.cinzel, 52 * s, 26 * s);
      ctx.globalAlpha = alpha * 0.8;
      lines.slice(1).forEach((l, i) => fitText(ctx, l, W / 2, y + (56 + i * 34) * s, maxW, FONTS.cormorant, 28 * s, 2 * s));
    } else if (style === 'line') {
      ctx.textAlign = 'center';
      const font = FONTS[it.font || 'cormorant'];
      const size = (it.size ?? 40) * s, sp = (it.spacing ?? (it.font === 'cinzel' ? 0.3 : 0.04)) * size;
      lines.forEach((l, i) => fitText(ctx, l, W / 2 + sp / 2, (it.y ?? 0.5) * H + i * size * 1.35, maxW, font, size, sp));
    } else { // credit
      ctx.textAlign = 'center';
      lines.forEach((l, i) => {
        const head = i === 0;
        ctx.globalAlpha = alpha * (head ? 0.9 : 0.75);
        fitText(ctx, l, W / 2, (it.y ?? 0.44) * H + i * 34 * s, maxW, head ? FONTS.cinzel : FONTS.cormorant, head ? 20 * s : 23 * s, head ? 8 * s : 1 * s);
      });
    }
    ctx.restore();
  }
  return any;
}
