/**
 * Exact constructors for the regular Blingtron layouts. Coordinates are normalized with
 * width 1; `height` is the layout's aspect ratio.
 */

/** Regular n-gon ring: node i at angle -90° + i·360°/n, consecutive nodes joined. */
export function ring(n, { radius = 0.5, cx = 0.5, cy = 0.5, rotate = 0 } = {}) {
  const slots = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + rotate + (i / n) * Math.PI * 2;
    slots.push([round(cx + radius * Math.cos(a)), round(cy + radius * Math.sin(a))]);
  }
  const edges = slots.map((_, i) => [i, (i + 1) % n]);
  return { slots, edges, width: 1, height: 1 };
}

/** n×n lattice: nodes joined to their horizontal and vertical neighbours. */
export function grid(n) {
  const slots = [];
  const edges = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      slots.push([round(c / (n - 1)), round(r / (n - 1))]);
      const i = r * n + c;
      if (c > 0) edges.push([i - 1, i]);
      if (r > 0) edges.push([i - n, i]);
    }
  }
  return { slots, edges, width: 1, height: 1 };
}

/**
 * Concentric rings joined by spokes, like Blingtron levels 18–22 ("N rings"): ring k (from the
 * centre, 1-based) has n·k nodes; every node connects outward to the nearest node by angle on
 * the next ring. Each ring is offset by half a step of the next ring so the spokes slant and the
 * whole thing reads as a spiral, as in the game.
 */
export function rings(n) {
  const slots = [];
  const edges = [];
  const start = [];
  for (let k = 1; k <= n; k++) {
    const count = n * k;
    const r = (0.5 * k) / n;
    const offset = k < n ? Math.PI / (n * (k + 1)) : 0;
    start.push(slots.length);
    for (let i = 0; i < count; i++) {
      const a = -Math.PI / 2 + offset + (i / count) * Math.PI * 2;
      slots.push([round(0.5 + r * Math.cos(a)), round(0.5 + r * Math.sin(a))]);
      edges.push([start[k - 1] + i, start[k - 1] + ((i + 1) % count)]);
    }
  }
  for (let k = 1; k < n; k++) {
    const count = n * k, next = n * (k + 1);
    for (let i = 0; i < count; i++) {
      const p = slots[start[k - 1] + i];
      const a = Math.atan2(p[1] - 0.5, p[0] - 0.5);
      let best = 0, bestD = Infinity;
      for (let j = 0; j < next; j++) {
        const q = slots[start[k] + j];
        let d = Math.abs(Math.atan2(q[1] - 0.5, q[0] - 0.5) - a);
        d = Math.min(d, Math.PI * 2 - d);
        if (d < bestD) { bestD = d; best = j; }
      }
      edges.push([start[k - 1] + i, start[k] + best]);
    }
  }
  return { slots, edges, width: 1, height: 1 };
}

const round = (v) => Math.round(v * 10000) / 10000;

/**
 * Concentric regular polygons with the given node counts (innermost first). With `spokes`,
 * every node connects outward to the nearest node by angle on the next ring; without, the
 * rings are separate shapes (like Blingtron's "double ring" levels). Rings are staggered so
 * spokes slant and never tie.
 */
export function nested(counts, { spokes = true } = {}) {
  const slots = [];
  const edges = [];
  const start = [];
  const R = counts.length;
  counts.forEach((count, k) => {
    const r = (0.5 * (k + 1)) / R;
    const offset = 0.37 * k * ((Math.PI * 2) / count);
    start.push(slots.length);
    for (let i = 0; i < count; i++) {
      const a = -Math.PI / 2 + offset + (i / count) * Math.PI * 2;
      slots.push([round(0.5 + r * Math.cos(a)), round(0.5 + r * Math.sin(a))]);
      edges.push([start[k] + i, start[k] + ((i + 1) % count)]);
    }
  });
  if (spokes) {
    for (let k = 0; k < R - 1; k++) {
      for (let i = 0; i < counts[k]; i++) {
        const p = slots[start[k] + i];
        const a = Math.atan2(p[1] - 0.5, p[0] - 0.5);
        let best = 0, bestD = Infinity;
        for (let j = 0; j < counts[k + 1]; j++) {
          const q = slots[start[k + 1] + j];
          let d = Math.abs(Math.atan2(q[1] - 0.5, q[0] - 0.5) - a);
          d = Math.min(d, Math.PI * 2 - d);
          if (d < bestD) { bestD = d; best = j; }
        }
        edges.push([start[k] + i, start[k + 1] + best]);
      }
    }
  }
  return { slots, edges, width: 1, height: 1 };
}

/** n-pointed star outline: 2n vertices alternating outer/inner radius, joined in a ring. */
export function star(n, inner = 0.45) {
  const slots = [];
  for (let i = 0; i < 2 * n; i++) {
    const r = 0.5 * (i % 2 === 0 ? 1 : inner);
    const a = -Math.PI / 2 + (i / (2 * n)) * Math.PI * 2;
    slots.push([round(0.5 + r * Math.cos(a)), round(0.5 + r * Math.sin(a))]);
  }
  const edges = slots.map((_, i) => [i, (i + 1) % slots.length]);
  return { slots, edges, width: 1, height: 1 };
}

/** Open polyline of n nodes along a four-turn spiral. */
export function spiral(n) {
  const perTurn = n / 4;
  const slots = [];
  for (let i = 0; i < n; i++) {
    const r = 0.08 + 0.42 * (i / (n - 1));
    const a = (i / perTurn) * Math.PI * 2;
    slots.push([round(0.5 + r * Math.cos(a)), round(0.5 + r * Math.sin(a))]);
  }
  const edges = [];
  for (let i = 0; i + 1 < n; i++) edges.push([i, i + 1]);
  return { slots, edges, width: 1, height: 1 };
}
