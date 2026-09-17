import { test } from 'node:test';
import assert from 'node:assert/strict';
import { delaunayEdges } from '../src/levels/delaunay.js';
import { generateLevel, difficulty, TIERS } from '../src/levels/generator.js';
import { Puzzle } from '../src/puzzle.js';

function connected(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }
  const seen = new Set([0]); const stack = [0];
  while (stack.length) for (const v of adj[stack.pop()]) if (!seen.has(v)) { seen.add(v); stack.push(v); }
  return seen.size === n;
}

test('delaunay of a square gives 5 edges', () => {
  const e = delaunayEdges([[0, 0], [1, 0], [1, 1], [0, 1]]);
  assert.equal(e.length, 5);
});

test('difficulty ramps and caps (normal is the default tier)', () => {
  assert.ok(difficulty(1).nodes >= 4 && difficulty(1).nodes <= 6);
  assert.ok(difficulty(200).nodes <= 60);
  assert.deepEqual(difficulty(5), difficulty(5, 'normal'));
});

test('tiers are ordered easy < normal < hard < brutal and respect their caps', () => {
  assert.deepEqual(Object.keys(TIERS), ['easy', 'normal', 'hard', 'brutal']);
  for (const index of [1, 10, 500]) {
    const n = Object.keys(TIERS).map((t) => difficulty(index, t).nodes);
    for (let i = 1; i < n.length; i++) assert.ok(n[i] >= n[i - 1], `index ${index}: ${n}`);
  }
  assert.equal(difficulty(500, 'easy').nodes, TIERS.easy.cap);
  assert.equal(difficulty(500, 'brutal').nodes, TIERS.brutal.cap);
  assert.equal(difficulty(1, 'brutal').nodes, TIERS.brutal.start + Math.round(TIERS.brutal.rate));
});

test('unknown tier falls back to normal', () => {
  assert.deepEqual(difficulty(3, 'nope'), difficulty(3, 'normal'));
});

for (const tier of ['easy', 'hard', 'brutal']) {
  test(`generated ${tier} level is solved and connected`, () => {
    const lvl = generateLevel(20, 4, tier);
    assert.equal(new Puzzle(lvl).crossedEdges().size, 0);
    assert.ok(connected(lvl.slots.length, lvl.edges));
    assert.equal(lvl.slots.length, difficulty(20, tier).nodes);
  });
}

for (const index of [1, 2, 5, 10, 25, 60, 120]) {
  for (const seed of [1, 2, 3]) {
    test(`generated level ${index}/${seed} is solved, connected and in bounds`, () => {
      const lvl = generateLevel(index, seed);
      const p = new Puzzle(lvl);
      assert.equal(p.crossedEdges().size, 0);
      assert.ok(connected(lvl.slots.length, lvl.edges));
      for (const [x, y] of lvl.slots) assert.ok(x >= 0 && x <= 1 && y >= 0 && y <= lvl.height);
      assert.ok(lvl.edges.length >= lvl.slots.length - 1);
    });
  }
}

test('same index and seed give the same level', () => {
  assert.deepEqual(generateLevel(7, 99), generateLevel(7, 99));
});
