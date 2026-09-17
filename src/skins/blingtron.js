// Blingtron's Circuit Design Tutorial look (Legion): small deep-blue orbs with a crackling
// ring, thin cyan-blue lines, red when crossed, over a moonlit night sky.
import { Particles } from './particles.js';
import { sprite, blit } from './sprite.js';
import { edgePath } from './path.js';

const EDGE = { clear: '#46b4ff', crossed: '#ff2f6e', solved: '#4cff7a' };
const particles = new Particles();
let bgCache = null;

function background(ctx, w, h) {
  if (!bgCache || bgCache.w !== w || bgCache.h !== h) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1b2233'); grad.addColorStop(0.55, '#2c3a52'); grad.addColorStop(1, '#4a5a74');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    const moon = g.createRadialGradient(w * 0.7, h * 0.2, 0, w * 0.7, h * 0.2, Math.max(w, h) * 0.5);
    moon.addColorStop(0, 'rgba(180,200,230,0.28)'); moon.addColorStop(1, 'rgba(180,200,230,0)');
    g.fillStyle = moon; g.fillRect(0, 0, w, h);
    // ground band
    g.fillStyle = '#5b6a85';
    g.beginPath(); g.moveTo(0, h * 0.9); g.lineTo(w, h * 0.78); g.lineTo(w, h); g.lineTo(0, h); g.closePath(); g.fill();
    bgCache = { w, h, c };
  }
  ctx.drawImage(bgCache.c, 0, 0);
}

// No ctx.shadowBlur anywhere in here: it forces a blur pass per stroke and is very slow in
// Firefox. Glows are layered translucent strokes; orbs are cached sprites.
function drawEdge(ctx, p, q, state, t, alpha, width, bow) {
  ctx.globalAlpha = alpha * 0.28; ctx.lineCap = 'round';
  ctx.strokeStyle = EDGE[state]; ctx.lineWidth = width * 3;
  edgePath(ctx, p, q, bow); ctx.stroke();
  ctx.globalAlpha = alpha; ctx.lineWidth = width * 0.9;
  edgePath(ctx, p, q, bow); ctx.stroke();
  ctx.globalAlpha = 1;
}

/** Orb sprite: soft glow + deep blue core. Drawn at 2× for crispness on high-DPI screens. */
function orbSprite(R, selected) {
  const key = `bt-orb-${Math.round(R * 2) / 2}-${selected ? 1 : 0}`;
  const size = Math.ceil(R * 6);
  return sprite(key, size * 2, (g, s) => {
    const c = s / 2, r = R * 2;
    const glow = g.createRadialGradient(c, c, r * 0.8, c, c, r * (selected ? 3 : 2.2));
    glow.addColorStop(0, selected ? 'rgba(127,208,255,0.6)' : 'rgba(127,208,255,0.4)');
    glow.addColorStop(1, 'rgba(127,208,255,0)');
    g.fillStyle = glow; g.fillRect(0, 0, s, s);
    const core = g.createRadialGradient(c, c, 0, c, c, r);
    core.addColorStop(0, '#1f4dff'); core.addColorStop(0.7, '#1836d6'); core.addColorStop(1, '#6fd6ff');
    g.fillStyle = core; g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.fill();
  });
}

function drawNode(ctx, p, state, t, alpha, r) {
  const R = r * (state === 'selected' ? 1.25 : state === 'hover' ? 1.1 : 1);
  ctx.globalAlpha = alpha;
  blit(ctx, orbSprite(r, state === 'selected'), p, Math.ceil(r * 6) * (R / r));
  // crackle ring
  ctx.strokeStyle = 'rgba(160,225,255,0.9)'; ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + t / 300;
    const j = R * (1.05 + 0.18 * Math.sin(t / 90 + i * 1.7));
    ctx[i ? 'lineTo' : 'moveTo'](p[0] + Math.cos(a) * j, p[1] + Math.sin(a) * j);
  }
  ctx.closePath(); ctx.stroke();
  if (state === 'selected') {
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(p[0], p[1], R * 1.6, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export const blingtron = {
  id: 'blingtron', name: "Blingtron's Circuit Tutorial", nodeScale: 0.85,
  background, drawEdge, drawNode,
  onSelect: (p) => particles.burst(p[0], p[1], { count: 6, speed: 50, life: 300, size: 1.5, color: '#9fe0ff' }),
  onSwap: (p, q) => {
    particles.burst(p[0], p[1], { count: 8, speed: 70, life: 350, size: 1.5, color: '#9fe0ff' });
    particles.burst(q[0], q[1], { count: 8, speed: 70, life: 350, size: 1.5, color: '#9fe0ff' });
  },
  onSolve: (pts) => { for (const p of pts) particles.burst(p[0], p[1], { count: 10, speed: 110, life: 700, size: 2, color: '#8fffb0' }); },
  drawEffects: (ctx, now, dt) => particles.draw(ctx, now, dt),
};
