import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Puzzle } from '../src/puzzle.js';
import { makeRng } from '../src/rng.js';

const square = () => new Puzzle({
  slots: [[0, 0], [1, 0], [1, 1], [0, 1]],
  edges: [[0, 1], [1, 2], [2, 3], [3, 0]],
});

test('identity perm is solved', () => {
  assert.equal(square().isSolved(), true);
});
test('swap moves nodes to each other slots', () => {
  const p = square();
  p.swap(0, 2);
  assert.deepEqual(p.positions()[0], [1, 1]);
  assert.deepEqual(p.positions()[2], [0, 0]);
});
test('swapping adjacent corners of a square creates a bowtie', () => {
  const p = square();
  p.swap(0, 1);
  assert.equal(p.isSolved(), false);
  assert.equal(p.crossedEdges().size, 2);
});
test('rng is deterministic', () => {
  const a = makeRng(42), b = makeRng(42);
  assert.equal(a(), b());
  assert.equal(a(), b());
});
