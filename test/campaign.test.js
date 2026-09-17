import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SECTIONS, LEVELS_PER_SECTION, getLevel, getSection } from '../src/levels/campaign.js';
import { nested, star, spiral } from '../src/levels/shapes.js';
import { Puzzle } from '../src/puzzle.js';

test('four sections of twenty levels', () => {
  assert.deepEqual(SECTIONS.map((s) => s.id), ['apprentice', 'journeyman', 'expert', 'master']);
  for (const s of SECTIONS) assert.equal(s.levels.length, LEVELS_PER_SECTION);
});

test('unknown section falls back to the first', () => {
  assert.equal(getSection('nope').id, 'apprentice');
});

for (const section of SECTIONS) {
  for (let i = 1; i <= LEVELS_PER_SECTION; i++) {
    test(`${section.name} ${i} is a valid solved layout within the section's size band`, () => {
      const lvl = getLevel(section.id, i);
      assert.ok(lvl.name);
      const n = lvl.slots.length;
      assert.ok(n >= section.range[0] && n <= section.range[1], `${lvl.name}: ${n} nodes outside ${section.range}`);
      for (const [a, b] of lvl.edges) assert.ok(a !== b && a >= 0 && b >= 0 && a < n && b < n);
      const keys = new Set(lvl.edges.map(([a, b]) => (a < b ? `${a},${b}` : `${b},${a}`)));
      assert.equal(keys.size, lvl.edges.length, `${lvl.name} has duplicate edges`);
      assert.equal(new Set(lvl.edges.flat()).size, n, `${lvl.name} has orphan nodes`);
      assert.equal(new Puzzle(lvl).crossedEdges().size, 0, `${lvl.name} has crossings when solved`);
      assert.equal(getLevel(section.id, i), lvl, 'levels are cached');
    });
  }
}

test('level names are unique within a section', () => {
  for (const s of SECTIONS) {
    const names = s.levels.map(([name]) => name);
    assert.equal(new Set(names).size, names.length, s.id);
  }
});

test('nested rings: counts, spokes and separate-shape mode', () => {
  const withSpokes = nested([3, 6]);
  assert.equal(withSpokes.slots.length, 9);
  assert.equal(withSpokes.edges.length, 9 + 3);
  const separate = nested([4, 5], { spokes: false });
  assert.equal(separate.edges.length, 9);
});

test('star and spiral sizes', () => {
  assert.equal(star(5).slots.length, 10);
  assert.equal(star(5).edges.length, 10);
  assert.equal(spiral(20).slots.length, 20);
  assert.equal(spiral(20).edges.length, 19);
});
