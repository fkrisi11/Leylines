import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Puzzle } from '../src/puzzle.js';
import { scramble } from '../src/levels/scramble.js';

const square = () => new Puzzle({
  slots: [[0, 0], [1, 0], [1, 1], [0, 1]],
  edges: [[0, 1], [1, 2], [2, 3], [3, 0]],
});

test('scramble produces a crossing', () => {
  assert.equal(scramble(square(), 1).isSolved(), false);
});
test('scramble is deterministic per seed', () => {
  assert.deepEqual(scramble(square(), 7).perm, scramble(square(), 7).perm);
});
test('scramble does not mutate the input', () => {
  const p = square();
  scramble(p, 3);
  assert.deepEqual(p.perm, [0, 1, 2, 3]);
});
