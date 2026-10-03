// Titles from film-plan.json `text` items. Drawn display-referred and composited after
// tonemapping so names stay crisp and calm whatever the exposure is doing.
// style "name": first line Roman capitals (Cinzel), following lines small italic (Cormorant).
// style "credit": small centred lines. style "title": large spaced capitals, centred.

export function drawTitles(ctx, items, f, fps, W, H) {
  let any = false;
  ctx.clearRect(0, 0, W, H);
  for (const it of items) {
    if (f < it.start || f >= it.end) continue;
    any = true;
    const fadeIn = it.fadeIn ?? 14, fadeOut = it.fadeOut ?? 14;
    const a = Math.min(1, (f - it.start + 1) / fadeIn, (it.end - f) / fadeOut);
    const alpha = a * a * (3 - 2 * a);
    const lines = it.content.split('\n');
    const s = H / 1080;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = it.color || 'rgba(236,226,210,1)';
    ctx.textBaseline = 'alphabetic';
    const style = it.style || 'name';
    if (style === 'name') {
      const x = (it.x ?? 0.075) * W, y = (it.y ?? 0.80) * H;
      ctx.textAlign = it.align || 'left';
      ctx.font = `400 ${Math.round(34 * s)}px Cinzel`;
      ctx.letterSpacing = `${Math.round(14 * s)}px`;
      ctx.fillText(lines[0], x, y);
      ctx.font = `italic 400 ${Math.round(25 * s)}px "Cormorant Garamond"`;
      ctx.letterSpacing = `${Math.round(1.5 * s)}px`;
      ctx.globalAlpha = alpha * 0.78;
      lines.slice(1).forEach((l, i) => ctx.fillText(l, x + 2 * s, y + (38 + i * 30) * s));
    } else if (style === 'title') {
      ctx.textAlign = 'center';
      ctx.font = `400 ${Math.round(52 * s)}px Cinzel`;
      ctx.letterSpacing = `${Math.round(26 * s)}px`;
      ctx.fillText(lines[0], W / 2 + 13 * s, (it.y ?? 0.5) * H);
      ctx.font = `italic 400 ${Math.round(28 * s)}px "Cormorant Garamond"`;
      ctx.letterSpacing = `${Math.round(2 * s)}px`;
      ctx.globalAlpha = alpha * 0.8;
      lines.slice(1).forEach((l, i) => ctx.fillText(l, W / 2, (it.y ?? 0.5) * H + (56 + i * 34) * s));
    } else { // credit
      ctx.textAlign = 'center';
      lines.forEach((l, i) => {
        const head = i === 0;
        ctx.font = head ? `400 ${Math.round(20 * s)}px Cinzel` : `italic 400 ${Math.round(23 * s)}px "Cormorant Garamond"`;
        ctx.letterSpacing = head ? `${Math.round(8 * s)}px` : `${Math.round(1 * s)}px`;
        ctx.globalAlpha = alpha * (head ? 0.9 : 0.75);
        ctx.fillText(l, W / 2, (it.y ?? 0.44) * H + i * 34 * s);
      });
    }
    ctx.restore();
  }
  return any;
}
