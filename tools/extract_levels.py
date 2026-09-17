"""Extract node positions and edges from solved Blingtron screenshots.

Usage: python tools/extract_levels.py tools/screenshots tools/out
Writes tools/out/levels.json and a debug overlay per level in tools/out/debug_NN.png.
Nodes: bright blue orbs (larger blobs); lines: thin bright blue. We build one blue mask,
find node centres as local maxima of the distance transform (nodes are fatter than lines),
then accept an edge between two nodes when the pixels along the segment are mostly blue and
no third node lies on the segment.
"""
import json, os, sys
import cv2
import numpy as np

NAMES = [
    "2x2 Square", "5-dot Ring", "6-dot Ring", "3x3 Square", "Two Shapes", "10-dot Ring",
    "Double Ring", "Square with Triangle", "16-dot Ring", "4x4 Square", "Two Polylines",
    "Square in Square", "Square in Star", "24-dot Ring", "5x5 Square", "Double Ring II",
    "6x6 Square", "3 Rings", "4 Rings", "5 Rings", "6 Rings", "7 Rings",
]
# Regular shapes (rings, grids, concentric rings) are built exactly by src/levels/shapes.js;
# only the irregular layouts are extracted from screenshots.
EXTRACTED = {5, 7, 8, 11, 12, 13, 16}

# Hand-verified corrections in full-resolution pixel coordinates. Where the screenshot has a
# lightning effect, glowing (thickened) edges or the cursor over a node, detection fails, so
# these levels are specified completely by hand from the screenshot.
OVERRIDES = {
    8: dict(nodes=[(1165, 258), (1097, 379), (749, 381), (865, 532), (1124, 655), (1337, 676), (869, 815)],
            edges=[(0, 1), (0, 2), (0, 3), (1, 4), (1, 5), (3, 4), (4, 5), (2, 6), (3, 6), (6, 5)]),
    11: dict(nodes=[(1070, 225), (865, 272), (1266, 311), (1101, 382), (730, 432), (1369, 505), (1198, 509),
                    (869, 535), (1129, 659), (959, 671), (1313, 728), (1115, 854), (940, 395), (728, 647), (872, 823)],
             edges=[(0, 1), (0, 2), (1, 4), (2, 5), (3, 6), (5, 7), (6, 7), (8, 9), (8, 10), (10, 11),
                    (3, 12), (12, 4), (9, 13), (13, 14), (14, 11)]),
    12: dict(nodes=[(1163, 257), (754, 384), (941, 395), (1166, 432), (895, 608), (1129, 658), (1343, 676), (872, 823)],
             edges=[(0, 1), (0, 2), (0, 6), (1, 4), (1, 7), (2, 3), (2, 4), (3, 5), (3, 6), (5, 7), (6, 7), (4, 5)]),
    13: dict(nodes=[(985, 228), (1322, 378), (940, 396), (1161, 435), (913, 516), (895, 616), (718, 475),
                    (1133, 660), (1288, 763), (883, 805)],
             edges=[(0, 1), (0, 6), (1, 3), (1, 8), (2, 3), (2, 4), (2, 6), (3, 7), (4, 5), (5, 7), (5, 9),
                    (6, 9), (7, 8), (8, 9)]),
}


def blue_mask(img):
    b, g, r = cv2.split(img.astype(np.int16))
    m = (b > 150) & (b - r > 60) & (b >= g - 10)
    return (m.astype(np.uint8) * 255)


def find_nodes(mask, min_radius):
    """Node centres. The puzzle sits in 3D so far-away nodes are smaller; we therefore use a
    low radius threshold and reject the elongated blobs that a glowing line produces."""
    dist = cv2.distanceTransform(mask, cv2.DIST_L2, 5)
    cand = (dist >= min_radius).astype(np.uint8)
    n, labels, stats, centroids = cv2.connectedComponentsWithStats(cand)
    out = []
    for i in range(1, n):
        w, h, area = stats[i, cv2.CC_STAT_WIDTH], stats[i, cv2.CC_STAT_HEIGHT], stats[i, cv2.CC_STAT_AREA]
        if max(w, h) / max(1, min(w, h)) > 2.0:
            continue
        out.append(tuple(centroids[i]))
    return out


def edge_present(mask, p, q, margin=12, thresh=0.8):
    x0, y0 = p; x1, y1 = q
    length = np.hypot(x1 - x0, y1 - y0)
    if length < 2 * margin + 4:
        return False
    n = int(length)
    ts = np.linspace(margin / length, 1 - margin / length, n)
    xs = (x0 + (x1 - x0) * ts).astype(int)
    ys = (y0 + (y1 - y0) * ts).astype(int)
    hits = mask[ys, xs] > 0
    return hits.mean() >= thresh


def point_on_segment(r, p, q, tol):
    px, py = p; qx, qy = q; rx, ry = r
    dx, dy = qx - px, qy - py
    L2 = dx * dx + dy * dy
    t = ((rx - px) * dx + (ry - py) * dy) / L2
    if t <= 0.05 or t >= 0.95:
        return False
    cx, cy = px + t * dx, py + t * dy
    return np.hypot(rx - cx, ry - cy) < tol


def in_ui(x, y, W, H):
    """Screen regions that hold WoW UI (player frame, minimap, action bars, chat)."""
    return (y > 0.86 * H) or (x < 0.14 * W and y < 0.12 * H) or (x > 0.84 * W and y < 0.22 * H)


def extract(path, level_id, min_radius=None):
    img = cv2.imread(path)
    H, W = img.shape[:2]
    raw = blue_mask(img)
    node_mask = cv2.dilate(raw, np.ones((3, 3), np.uint8))
    mask = cv2.dilate(raw, np.ones((5, 5), np.uint8))  # fatter mask so slightly-off sampling still hits thin lines
    if min_radius is None:
        min_radius = 6.0 if level_id <= 17 else 4.5
    nodes = [p for p in find_nodes(node_mask, min_radius=min_radius) if not in_ui(p[0], p[1], W, H)]
    nodes = merge_close(nodes, 20)
    edges = []
    for i in range(len(nodes)):
        for j in range(i + 1, len(nodes)):
            if not edge_present(mask, nodes[i], nodes[j]):
                continue
            if any(k not in (i, j) and point_on_segment(nodes[k], nodes[i], nodes[j], 6) for k in range(len(nodes))):
                continue
            edges.append((i, j))
    # drop isolated blobs (UI, the robot's lights, glow artefacts) and re-index
    degree = {}
    for (i, j) in edges:
        degree[i] = degree.get(i, 0) + 1; degree[j] = degree.get(j, 0) + 1
    keep = [i for i in range(len(nodes)) if degree.get(i, 0) > 0]
    remap = {old: new for new, old in enumerate(keep)}
    nodes = [nodes[i] for i in keep]
    edges = [(remap[i], remap[j]) for (i, j) in edges]
    nodes, edges = drop_pass_through(nodes, edges)
    # debug overlay
    dbg = img.copy()
    for (i, j) in edges:
        cv2.line(dbg, tuple(map(int, nodes[i])), tuple(map(int, nodes[j])), (0, 255, 0), 2)
    for k, (x, y) in enumerate(nodes):
        cv2.circle(dbg, (int(x), int(y)), 10, (0, 0, 255), 2)
        cv2.putText(dbg, str(k), (int(x) + 8, int(y) - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
    return nodes, edges, dbg


def merge_close(nodes, tol):
    """Average together detections closer than tol px (a node's glow can split into two blobs)."""
    out = []
    for p in nodes:
        for k, q in enumerate(out):
            if np.hypot(p[0] - q[0], p[1] - q[1]) < tol:
                out[k] = ((p[0] + q[0]) / 2, (p[1] + q[1]) / 2)
                break
        else:
            out.append(p)
    return out


def drop_pass_through(nodes, edges, max_dev_deg=6):
    """A glowing line can be mistaken for a node: it shows up as a degree-2 node whose two edges
    are collinear. Remove such nodes and reconnect their neighbours. Repeats until stable."""
    edges = [tuple(e) for e in edges]
    while True:
        adj = {i: [] for i in range(len(nodes))}
        for (i, j) in edges:
            adj[i].append(j); adj[j].append(i)
        victim = None
        for k, nb in adj.items():
            if len(nb) != 2:
                continue
            i, j = nb
            v1 = np.subtract(nodes[i], nodes[k]); v2 = np.subtract(nodes[j], nodes[k])
            cosang = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
            ang = np.degrees(np.arccos(np.clip(cosang, -1, 1)))
            if ang > 180 - max_dev_deg:
                victim = (k, i, j); break
        if victim is None:
            return nodes, [list(e) for e in edges]
        k, i, j = victim
        edges = [e for e in edges if k not in e]
        if (i, j) not in edges and (j, i) not in edges:
            edges.append((i, j))
        nodes = nodes[:k] + nodes[k + 1:]
        fix = lambda n: n - 1 if n > k else n
        edges = [(fix(a), fix(b)) for (a, b) in edges]


def normalize(nodes):
    xs = [p[0] for p in nodes]; ys = [p[1] for p in nodes]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    w = max(x1 - x0, 1.0); h = max(y1 - y0, 1.0)
    return [[round((x - x0) / w, 4), round((y - y0) / w, 4)] for x, y in nodes], round(h / w, 4)


def main(src, out):
    os.makedirs(out, exist_ok=True)
    levels = []
    for lid in sorted(EXTRACTED):
        path = os.path.join(src, f"{lid:02d}.png")
        if lid in OVERRIDES:
            nodes, edges = OVERRIDES[lid]["nodes"], OVERRIDES[lid]["edges"]
            dbg = cv2.imread(path)
            for (i, j) in edges:
                cv2.line(dbg, nodes[i], nodes[j], (0, 255, 0), 2)
            for k, (x, y) in enumerate(nodes):
                cv2.circle(dbg, (x, y), 10, (0, 0, 255), 2)
                cv2.putText(dbg, str(k), (x + 8, y - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
            how = "override"
        else:
            nodes, edges, dbg = extract(path, lid)
            how = "extracted"
        cv2.imwrite(os.path.join(out, f"debug_{lid:02d}.png"), dbg)
        slots, height = normalize(nodes)
        print(f"level {lid:2d} {NAMES[lid-1]:22s} nodes={len(nodes):3d} edges={len(edges):3d}  ({how})")
        levels.append({"id": lid, "name": NAMES[lid - 1], "width": 1, "height": height,
                       "slots": slots, "edges": [list(e) for e in edges]})
    with open(os.path.join(out, "levels.json"), "w") as f:
        json.dump(levels, f)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
