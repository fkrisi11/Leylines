/**
 * Trace the path of an edge from p to q. `bow` is the sideways offset of the line's midpoint in
 * px (0 = straight); a bowed edge is a quadratic curve. Used by every skin so the "line sway"
 * option works everywhere.
 */
export function edgePath(ctx, p, q, bow = 0) {
  ctx.beginPath();
  ctx.moveTo(p[0], p[1]);
  if (!bow) { ctx.lineTo(q[0], q[1]); return; }
  const dx = q[0] - p[0], dy = q[1] - p[1];
  const len = Math.hypot(dx, dy) || 1;
  // a quadratic's midpoint sits halfway to the control point, so offset the control by 2·bow
  const cx = (p[0] + q[0]) / 2 - (dy / len) * bow * 2;
  const cy = (p[1] + q[1]) / 2 + (dx / len) * bow * 2;
  ctx.quadraticCurveTo(cx, cy, q[0], q[1]);
}
