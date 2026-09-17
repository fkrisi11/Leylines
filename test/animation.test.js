import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Tweens, ease, formatTime, sway } from '../src/animation.js';

test('formatTime', () => {
  assert.equal(formatTime(42300), '0:42.3');
  assert.equal(formatTime(61000), '1:01.0');
  assert.equal(formatTime(0), '0:00.0');
});
test('ease endpoints', () => {
  assert.equal(ease.inOut(0), 0); assert.equal(ease.inOut(1), 1);
  assert.equal(ease.out(0), 0); assert.equal(ease.out(1), 1);
});
test('tween runs update with eased progress and calls done once', () => {
  const tw = new Tweens();
  const seen = []; let done = 0;
  tw.add({ duration: 100, update: (p) => seen.push(p), done: () => done++ }, 1000);
  tw.update(1050); tw.update(1100); tw.update(1200);
  assert.equal(seen[0], 0.5); assert.equal(seen.at(-1), 1);
  assert.equal(done, 1);
  assert.equal(tw.busy, false);
});
test('delayed tween does not start early', () => {
  const tw = new Tweens();
  const seen = [];
  tw.add({ duration: 100, delay: 50, update: (p) => seen.push(p) }, 1000);
  tw.update(1020);
  assert.equal(seen.length, 0);
  tw.update(1100);
  assert.equal(seen[0], 0.5);
});

test('sway is bounded, subtle, and differs per edge', () => {
  for (const i of [0, 1, 7, 40]) for (const t of [0, 500, 1234]) assert.ok(Math.abs(sway(i, t, 300)) <= 6);
  assert.ok(Math.abs(sway(0, 100, 40)) <= 1.2, 'short lines barely move');
  const a = sway(0, 300, 300), b = sway(1, 300, 300), c = sway(2, 300, 300);
  assert.ok(a !== b && b !== c);
});
