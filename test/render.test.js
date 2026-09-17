import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Viewport, HUD_HEIGHT } from '../src/render.js';

test('fit centres a 1x1 layout in a wide viewport with padding', () => {
  const v = new Viewport();
  v.resize(1000, 500);
  v.fit({ width: 1, height: 1, minDist: 0.5, slots: [[0, 0], [1, 1]] });
  const [x0, y0] = v.toPx([0, 0]);
  const [x1, y1] = v.toPx([1, 1]);
  assert.ok(Math.abs((x0 + x1) / 2 - 500) < 1e-6);
  assert.ok(Math.abs((y0 + y1) / 2 - (HUD_HEIGHT + 500) / 2) < 1e-6);
  assert.ok(y1 - y0 <= 500 && y1 - y0 > 300);
});

test('hit picks nearest node within radius', () => {
  const v = new Viewport();
  v.resize(1000, 1000);
  v.fit({ width: 1, height: 1, minDist: 1, slots: [[0, 0], [1, 1]] });
  const pos = [[0, 0], [1, 1]];
  const [px, py] = v.toPx([0, 0]);
  assert.equal(v.hit(px + 5, py + 5, pos), 0);
  assert.equal(v.hit(500, 500, pos), -1);
});

test('node radius shrinks for dense layouts but stays within bounds', () => {
  const v = new Viewport();
  v.resize(800, 800);
  v.fit({ width: 1, height: 1, minDist: 0.02, slots: [] });
  assert.ok(v.nodeR >= 4 && v.nodeR <= 14);
  v.fit({ width: 1, height: 1, minDist: 1, slots: [] });
  assert.equal(v.nodeR, 14);
});
