const PAD = 0.10;       // fraction of the shorter side kept clear around the puzzle
export const HUD_HEIGHT = 48; // px reserved at the top for the HUD

/** Maps normalized layout coordinates to canvas pixels and hit-tests nodes. */
export class Viewport {
  constructor() {
    this.w = 0; this.h = 0; this.dpr = 1;
    this.scale = 1; this.ox = 0; this.oy = 0;
    this.nodeR = 8; this.lineW = 2.5; this.hitR = 22;
  }

  resize(w, h, dpr = 1) { this.w = w; this.h = h; this.dpr = dpr; }

  /** Compute scale/offset so the puzzle's [0,width]×[0,height] box is centred with padding. */
  fit(puzzle) {
    const pad = Math.min(this.w, this.h) * PAD;
    const availW = this.w - pad * 2;
    const availH = this.h - pad * 2 - HUD_HEIGHT;
    this.scale = Math.min(availW / puzzle.width, availH / puzzle.height);
    this.ox = (this.w - puzzle.width * this.scale) / 2;
    this.oy = HUD_HEIGHT + (this.h - HUD_HEIGHT - puzzle.height * this.scale) / 2;
    const spacing = puzzle.minDist * this.scale;
    this.nodeR = Math.max(4, Math.min(14, spacing * 0.28));
    this.lineW = Math.max(1.5, Math.min(3, this.nodeR * 0.3));
    this.hitR = Math.max(this.nodeR * 1.8, Math.min(24, spacing * 0.45));
    return this;
  }

  toPx([x, y]) { return [this.ox + x * this.scale, this.oy + y * this.scale]; }

  /** Nearest node (by current position) within hitR, or -1. */
  hit(px, py, positions) {
    let best = -1, bestD = this.hitR;
    positions.forEach((p, i) => {
      const [x, y] = this.toPx(p);
      const d = Math.hypot(x - px, y - py);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }
}
