/** Tiny particle pool used by skins for bursts. */
export class Particles {
  constructor() { this.items = []; }

  burst(x, y, { count = 12, speed = 90, life = 500, size = 2.5, color = '#fff', spread = Math.PI * 2 }) {
    const born = performance.now();
    for (let i = 0; i < count; i++) {
      const a = Math.random() * spread;
      const v = speed * (0.4 + Math.random() * 0.6);
      this.items.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, born, life, size, color });
    }
  }

  draw(ctx, now, dt) {
    const s = dt / 1000;
    this.items = this.items.filter((p) => now - p.born < p.life);
    for (const p of this.items) {
      p.x += p.vx * s; p.y += p.vy * s; p.vx *= 0.96; p.vy *= 0.96;
      const k = 1 - (now - p.born) / p.life;
      ctx.globalAlpha = k;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.5 + k), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
