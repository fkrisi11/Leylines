const cache = new Map();

/**
 * Pre-rendered sprite: `painter(ctx, size)` draws once into a size×size offscreen canvas
 * (centre at size/2) and the result is reused. Key must include everything the painter
 * depends on. Skins use this so per-frame node drawing is a single drawImage instead of
 * gradients and blurs.
 */
export function sprite(key, size, painter) {
  let c = cache.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = c.height = Math.ceil(size);
    painter(c.getContext('2d'), c.width);
    cache.set(key, c);
  }
  return c;
}

/** Draw a cached sprite centred on p, scaled so the sprite's size maps to `drawSize` px. */
export function blit(ctx, spr, p, drawSize) {
  ctx.drawImage(spr, p[0] - drawSize / 2, p[1] - drawSize / 2, drawSize, drawSize);
}
