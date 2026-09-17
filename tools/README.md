# Level extraction (dev only)

The 22 fixed levels are Blingtron's Circuit Design Tutorial layouts. Regular shapes (rings,
grids, concentric rings) are built exactly by `src/levels/shapes.js`; the irregular ones
(5, 7, 8, 11, 12, 13, 16) come from solved screenshots in the album
https://imgur.com/a/twXyl (levels in album order), with hand-verified overrides where the
screenshot has a lightning effect, glowing edges or the cursor over a node.

Requires Python 3 with `opencv-python` and `numpy`. The screenshots are not committed.

```bash
# 1. download the album into tools/screenshots/01.png … 22.png (album order)
# 2. extract the irregular levels (writes tools/out/levels.json + debug overlays)
python tools/extract_levels.py tools/screenshots tools/out
# 3. assemble src/levels/fixed.js
node tools/build_fixed.mjs
npm test
```
