import { test } from 'node:test';
import assert from 'node:assert/strict';
import levels from '../src/levels/fixed.js';
import { Puzzle } from '../src/puzzle.js';
import { ring, grid, rings } from '../src/levels/shapes.js';

test('there are 22 fixed levels', () => assert.equal(levels.length, 22));

for (const lvl of levels) {
  test(`level ${lvl.id} ${lvl.name} is valid and solved as laid out`, () => {
    assert.ok(lvl.slots.length >= 4);
    for (const [a, b] of lvl.edges) {
      assert.ok(a !== b && a >= 0 && b >= 0 && a < lvl.slots.length && b < lvl.slots.length);
    }
    const keys = new Set(lvl.edges.map(([a, b]) => (a < b ? `${a},${b}` : `${b},${a}`)));
    assert.equal(keys.size, lvl.edges.length, `level ${lvl.id} has duplicate edges`);
    const p = new Puzzle(lvl);
    assert.equal(p.crossedEdges().size, 0, `level ${lvl.id} has crossings in solved state`);
    const used = new Set(lvl.edges.flat());
    assert.equal(used.size, lvl.slots.length, `level ${lvl.id} has orphan nodes`);
    for (const [x, y] of lvl.slots) assert.ok(x >= 0 && x <= 1 && y >= 0 && y <= lvl.height + 1e-9);
  });
}

test('level 1 is a 4-node square', () => {
  assert.equal(levels[0].slots.length, 4);
  assert.equal(levels[0].edges.length, 4);
});

test('ring(n) has n nodes and n edges', () => {
  const r = ring(7);
  assert.equal(r.slots.length, 7);
  assert.equal(r.edges.length, 7);
});

test('grid(n) has n² nodes and 2n(n-1) edges', () => {
  const g = grid(4);
  assert.equal(g.slots.length, 16);
  assert.equal(g.edges.length, 24);
});

test('rings(n) matches the Blingtron counts (n·k per ring, spokes from every inner node)', () => {
  const r = rings(3);
  assert.equal(r.slots.length, 18);
  assert.equal(r.edges.length, 27);
});
