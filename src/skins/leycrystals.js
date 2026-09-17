// Misaligned Ley Crystal look (Dragonflight, Azure Span): white glowing orbs, pale lavender
// lines, red when crossed, in a purple crystal cave.
import { Particles } from './particles.js';
import { sprite, blit } from './sprite.js';
import { edgePath } from './path.js';

const EDGE = { clear: 'rgba(236, 228, 255, 0.85)', crossed: 'rgba(255, 64, 110, 0.95)', solved: 'rgba(96, 255, 150, 0.95)' };
const GLOW = { clear: 'rgba(200, 180, 255, 0.35)', crossed: 'rgba(255, 60, 120, 0.45)', solved: 'rgba(80, 255, 140, 0.5)' };

const particles = new Particles();
let bgCache = null;

function background(ctx, w, h) {
  if (!bgCache || bgCache.w !== w || bgCache.h !== h) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#07061a'); grad.addColorStop(0.6, '#140f38'); grad.addColorStop(1, '#0a0820');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    // soft crystal glows
    const blobs = [[0.15, 0.85, 0.35, '#5a3cff'], [0.85, 0.8, 0.4, '#8a4dff'], [0.5, 1.05, 0.5, '#3a2a9a'], [0.75, 0.15, 0.25, '#2b1c6e']];
    for (const [x, y, r, col] of blobs) {
      const rg = g.createRadialGradient(x * w, y * h, 0, x * w, y * h, r * Math.max(w, h));
      rg.addColorStop(0, col + 'aa'); rg.addColorStop(1, col + '00');
      g.fillStyle = rg; g.fillRect(0, 0, w, h);
    }
    // crystal shards along the bottom
    g.globalAlpha = 0.28;
    for (const [x, y, s, tilt] of [[0.1, 1, 0.3, -0.2], [0.22, 1, 0.22, 0.1], [0.8, 1, 0.34, 0.15], [0.92, 1, 0.2, -0.1], [0.55, 1.02, 0.16, 0]]) {
      const H = s * h, W = H * 0.32;
      g.save(); g.translate(x * w, y * h); g.rotate(tilt);
      const cg = g.createLinearGradient(-W, 0, W, -H);
      cg.addColorStop(0, '#6a5cff'); cg.addColorStop(0.5, '#c9b8ff'); cg.addColorStop(1, '#5a3cff');
      g.fillStyle = cg;
      g.beginPath(); g.moveTo(-W, 0); g.lineTo(-W * 0.6, -H * 0.55); g.lineTo(0, -H); g.lineTo(W * 0.7, -H * 0.5); g.lineTo(W, 0); g.closePath(); g.fill();
      g.restore();
    }
    g.globalAlpha = 1;
    bgCache = { w, h, c };
  }
  ctx.drawImage(bgCache.c, 0, 0);
}

function drawEdge(ctx, p, q, state, t, alpha, width, bow) {
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  ctx.strokeStyle = GLOW[state]; ctx.lineWidth = width * 4;
  edgePath(ctx, p, q, bow); ctx.stroke();
  ctx.strokeStyle = EDGE[state]; ctx.lineWidth = width;
  edgePath(ctx, p, q, bow); ctx.stroke();
  ctx.globalAlpha = 1;
}

/** Orb sprite: halo + white core, cached per radius/selection (gradients are costly per frame). */
function orbSprite(R, selected) {
  const key = `lc-orb-${Math.round(R * 2) / 2}-${selected ? 1 : 0}`;
  const size = Math.ceil(R * 5.4);
  return sprite(key, size * 2, (g, s) => {
    const c = s / 2, r = R * 2;
    const halo = g.createRadialGradient(c, c, r * 0.6, c, c, r * 2.6);
    halo.addColorStop(0, selected ? 'rgba(255,255,255,0.55)' : 'rgba(210,190,255,0.35)');
    halo.addColorStop(1, 'rgba(210,190,255,0)');
    g.fillStyle = halo; g.fillRect(0, 0, s, s);
    const core = g.createRadialGradient(c - r * 0.3, c - r * 0.3, 0, c, c, r);
    core.addColorStop(0, '#ffffff'); core.addColorStop(0.6, '#efe8ff'); core.addColorStop(1, '#b9a6ff');
    g.fillStyle = core; g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.fill();
  });
}

function drawNode(ctx, p, state, t, alpha, r) {
  const pulse = state === 'selected' ? 1 + 0.12 * Math.sin(t / 120) : 1;
  const R = r * pulse * (state === 'hover' ? 1.12 : 1);
  ctx.globalAlpha = alpha;
  blit(ctx, orbSprite(r, state === 'selected'), p, Math.ceil(r * 5.4) * (R / r));
  if (state === 'selected') {
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(p[0], p[1], R * 1.5, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export const leycrystals = {
  id: 'leycrystals', name: 'Ley Crystals', nodeScale: 1.25,
  background, drawEdge, drawNode,
  onSelect: (p) => particles.burst(p[0], p[1], { count: 10, speed: 60, life: 450, size: 2, color: '#fff' }),
  onSwap: (p, q) => {
    particles.burst(p[0], p[1], { count: 14, speed: 90, life: 500, size: 2.2, color: '#e6dcff' });
    particles.burst(q[0], q[1], { count: 14, speed: 90, life: 500, size: 2.2, color: '#e6dcff' });
  },
  onSolve: (pts) => { for (const p of pts) particles.burst(p[0], p[1], { count: 18, speed: 140, life: 900, size: 2.5, color: '#bfffd4' }); },
  drawEffects: (ctx, now, dt) => particles.draw(ctx, now, dt),
};
