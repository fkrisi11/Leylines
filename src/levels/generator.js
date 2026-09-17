import { makeRng, shuffle } from '../rng.js';
import { delaunayEdges } from './delaunay.js';

const HEIGHT = 0.75; // generated field aspect (4:3)

/**
 * Infinite-mode difficulty tiers. nodes(index) = min(cap, start + round(index·rate));
 * density is edges per node, ramping from base toward base+ramp.
 */
export const TIERS = {
  easy:   { name: 'Easy',   start: 4,  rate: 0.6, cap: 20,  base: 1.0, ramp: 0.15 },
  normal: { name: 'Normal', start: 4,  rate: 1.3, cap: 60,  base: 1.0, ramp: 0.6 },
  hard:   { name: 'Hard',   start: 12, rate: 2.0, cap: 90,  base: 1.2, ramp: 0.6 },
  brutal: { name: 'Brutal', start: 30, rate: 4.0, cap: 150, base: 1.5, ramp: 0.5 },
};

/** Node count and edge density (edges per node) for the 1-based level index in a tier. */
export function difficulty(index, tier = 'normal') {
  const t = TIERS[tier] || TIERS.normal;
  const nodes = Math.min(t.cap, t.start + Math.round(index * t.rate));
  const density = t.base + Math.min(t.ramp, index * 0.03);
  return { nodes, density };
}

/** Random points with a minimum spacing (rejection sampling). */
function spreadPoints(n, rng) {
  const pts = [];
  const minD = 0.55 / Math.sqrt(n);
  let tries = 0;
  while (pts.length < n && tries < n * 500) {
    tries++;
    const p = [round(rng()), round(rng() * HEIGHT)];
    if (pts.every((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) >= minD)) pts.push(p);
  }
  return pts;
}

function isConnected(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }
  const seen = new Uint8Array(n); seen[0] = 1;
  const stack = [0]; let count = 1;
  while (stack.length) for (const v of adj[stack.pop()]) if (!seen[v]) { seen[v] = 1; count++; stack.push(v); }
  return count === n;
}

/**
 * A solved (crossing-free, connected) level for infinite mode. Same index+seed â†’ same level.
 * Beyond the node cap the seed alone varies the shape.
 */
export function generateLevel(index, seed, tier = 'normal') {
  return generateGraph({ ...difficulty(index, tier), seed: (seed * 7919 + index * 104729) >>> 0 });
}

/** A solved random planar level with an explicit node count and edge density. */
export function generateGraph({ nodes, density, seed }) {
  const rng = makeRng(seed >>> 0);
  const slots = fillField(spreadPoints(nodes, rng));
  const edges = delaunayEdges(slots);
  const target = Math.max(slots.length - 1, Math.round(slots.length * density));
  shuffle(edges, rng);
  // drop edges, longest first, while the graph stays connected
  edges.sort((e, f) => len(slots, f) - len(slots, e));
  const keep = edges.slice();
  for (let i = 0; i < keep.length && keep.length > target;) {
    const trial = keep.slice(0, i).concat(keep.slice(i + 1));
    if (isConnected(slots.length, trial)) keep.splice(i, 1); else i++;
  }
  return { slots, edges: keep, width: 1, height: HEIGHT };
}

/** Stretch the point cloud so its bounding box spans the whole field. */
function fillField(pts) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pts) {
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  const sx = maxX > minX ? 1 / (maxX - minX) : 1;
  const sy = maxY > minY ? HEIGHT / (maxY - minY) : 1;
  return pts.map(([x, y]) => [round((x - minX) * sx), round((y - minY) * sy)]);
}

function len(slots, [a, b]) {
  return Math.hypot(slots[a][0] - slots[b][0], slots[a][1] - slots[b][1]);
}

const round = (v) => Math.round(v * 10000) / 10000;
