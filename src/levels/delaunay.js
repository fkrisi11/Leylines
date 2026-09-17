/** Bowyer–Watson Delaunay triangulation. Returns unique undirected edges as [i, j] with i < j. */
export function delaunayEdges(points) {
  const n = points.length;
  if (n < 2) return [];
  if (n === 2) return [[0, 1]];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of points) {
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  const d = Math.max(maxX - minX, maxY - minY) * 20 + 1;
  const pts = points.concat([[minX - d, minY - d], [minX + 2 * d, minY - d], [minX - d, minY + 2 * d]]);
  const S = n; // super-triangle vertices are S, S+1, S+2
  let tris = [makeTri(pts, S, S + 1, S + 2)];
  for (let i = 0; i < n; i++) {
    const [px, py] = pts[i];
    const bad = tris.filter((t) => (px - t.cx) ** 2 + (py - t.cy) ** 2 < t.r2);
    const edgeCount = new Map();
    for (const t of bad) {
      for (const [a, b] of [[t.a, t.b], [t.b, t.c], [t.c, t.a]]) {
        const key = a < b ? `${a},${b}` : `${b},${a}`;
        edgeCount.set(key, (edgeCount.get(key) || 0) + 1);
      }
    }
    tris = tris.filter((t) => !bad.includes(t));
    for (const [key, count] of edgeCount) {
      if (count !== 1) continue; // shared edges are interior to the cavity
      const [a, b] = key.split(',').map(Number);
      tris.push(makeTri(pts, a, b, i));
    }
  }
  const edges = new Set();
  for (const t of tris) {
    if (t.a >= S || t.b >= S || t.c >= S) continue;
    for (const [a, b] of [[t.a, t.b], [t.b, t.c], [t.c, t.a]]) edges.add(a < b ? `${a},${b}` : `${b},${a}`);
  }
  return [...edges].map((k) => k.split(',').map(Number));
}

function makeTri(pts, a, b, c) {
  const [ax, ay] = pts[a], [bx, by] = pts[b], [cx, cy] = pts[c];
  const D = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / D;
  const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / D;
  return { a, b, c, cx: ux, cy: uy, r2: (ax - ux) ** 2 + (ay - uy) ** 2 };
}
