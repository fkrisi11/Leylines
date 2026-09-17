export const EPS = 1e-9;

function orient(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function onSegment(p, a, b) {
  return (
    Math.min(a[0], b[0]) - EPS <= p[0] && p[0] <= Math.max(a[0], b[0]) + EPS &&
    Math.min(a[1], b[1]) - EPS <= p[1] && p[1] <= Math.max(a[1], b[1]) + EPS
  );
}

/** True if segment a-b intersects segment c-d, including touching and collinear overlap. */
export function segmentsIntersect(a, b, c, d) {
  const d1 = orient(c, d, a);
  const d2 = orient(c, d, b);
  const d3 = orient(a, b, c);
  const d4 = orient(a, b, d);
  if (((d1 > EPS && d2 < -EPS) || (d1 < -EPS && d2 > EPS)) &&
      ((d3 > EPS && d4 < -EPS) || (d3 < -EPS && d4 > EPS))) return true;
  if (Math.abs(d1) <= EPS && onSegment(a, c, d)) return true;
  if (Math.abs(d2) <= EPS && onSegment(b, c, d)) return true;
  if (Math.abs(d3) <= EPS && onSegment(c, a, b)) return true;
  if (Math.abs(d4) <= EPS && onSegment(d, a, b)) return true;
  return false;
}

/** Set of indices of edges that cross some other edge. Edges sharing an endpoint never cross. */
export function findCrossings(points, edges) {
  const crossed = new Set();
  for (let i = 0; i < edges.length; i++) {
    const [a, b] = edges[i];
    for (let j = i + 1; j < edges.length; j++) {
      const [c, d] = edges[j];
      if (a === c || a === d || b === c || b === d) continue;
      if (segmentsIntersect(points[a], points[b], points[c], points[d])) {
        crossed.add(i);
        crossed.add(j);
      }
    }
  }
  return crossed;
}
