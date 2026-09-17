import { test } from 'node:test';
import assert from 'node:assert/strict';
import { segmentsIntersect, findCrossings } from '../src/geometry.js';

test('proper crossing', () => {
  assert.equal(segmentsIntersect([0, 0], [1, 1], [0, 1], [1, 0]), true);
});
test('parallel non-touching', () => {
  assert.equal(segmentsIntersect([0, 0], [1, 0], [0, 1], [1, 1]), false);
});
test('separated segments', () => {
  assert.equal(segmentsIntersect([0, 0], [1, 1], [2, 0], [3, 1]), false);
});
test('T-touch counts as crossing', () => {
  assert.equal(segmentsIntersect([0, 0], [2, 0], [1, 0], [1, 1]), true);
});
test('collinear overlap counts as crossing', () => {
  assert.equal(segmentsIntersect([0, 0], [2, 0], [1, 0], [3, 0]), true);
});
test('collinear disjoint does not', () => {
  assert.equal(segmentsIntersect([0, 0], [1, 0], [2, 0], [3, 0]), false);
});
test('findCrossings ignores edges sharing an endpoint', () => {
  const pts = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const square = [[0, 1], [1, 2], [2, 3], [3, 0]];
  assert.equal(findCrossings(pts, square).size, 0);
});
test('findCrossings reports both edges of a bowtie', () => {
  const pts = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const bowtie = [[0, 2], [1, 3], [0, 1], [2, 3]];
  assert.deepEqual([...findCrossings(pts, bowtie)].sort(), [0, 1]);
});
