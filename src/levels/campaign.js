// The Campaign: four sections of twenty fixed levels, ordered roughly by size. Levels come
// from three sources: the 22 Blingtron layouts (`b`), exact shape constructors, and seeded
// generated graphs (`gen`) — the seed is fixed, so they are the same every time.
import blingtron from './fixed.js';
import { ring, grid, rings, nested, star, spiral } from './shapes.js';
import { generateGraph } from './generator.js';

const b = (id) => () => blingtron[id - 1];
const gen = (nodes, density, seed) => () => generateGraph({ nodes, density, seed });

export const SECTIONS = [
  {
    id: 'apprentice', name: 'Apprentice', range: [4, 10],
    levels: [
      ['2×2 Square', b(1)],
      ['5-dot Ring', b(2)],
      ['Triangle in Triangle', () => nested([3, 3])],
      ['6-dot Ring', b(3)],
      ['Tangle I', gen(6, 1.0, 101)],
      ['Square with Triangle', b(8)],
      ['7-dot Ring', () => ring(7)],
      ['Tangle II', gen(7, 1.1, 102)],
      ['Square in Square', b(12)],
      ['4-point Star', () => star(4)],
      ['8-dot Ring', () => ring(8)],
      ['Tangle III', gen(8, 1.2, 103)],
      ['3×3 Square', b(4)],
      ['Square in Pentagon', () => nested([4, 5], { spokes: false })],
      ['Two Shapes', b(5)],
      ['10-dot Ring', b(6)],
      ['Square in Star', b(13)],
      ['Tangle IV', gen(10, 1.3, 104)],
      ['5-point Star', () => star(5)],
      ['Pentagon in Pentagon', () => nested([5, 5])],
    ],
  },
  {
    id: 'journeyman', name: 'Journeyman', range: [10, 24],
    levels: [
      ['Tangle V', gen(11, 1.2, 201)],
      ['Double Ring', b(7)],
      ['Square in Octagon', () => nested([4, 8])],
      ['6-point Star', () => star(6)],
      ['Tangle VI', gen(12, 1.3, 202)],
      ['Two Polylines', b(11)],
      ['16-dot Ring', b(9)],
      ['4×4 Square', b(10)],
      ['Tangle VII', gen(14, 1.3, 203)],
      ['Hexagon in Decagon', () => nested([6, 10])],
      ['3 Rings', b(18)],
      ['9-point Star', () => star(9)],
      ['Tangle VIII', gen(16, 1.4, 204)],
      ['Triple Ring', () => nested([5, 7, 9])],
      ['Spiral', () => spiral(20)],
      ['Tangle IX', gen(18, 1.4, 205)],
      ['24-dot Ring', b(14)],
      ['Double Ring II', b(16)],
      ['Octagon in 16-gon', () => nested([8, 16])],
      ['Tangle X', gen(20, 1.5, 206)],
    ],
  },
  {
    id: 'expert', name: 'Expert', range: [24, 64],
    levels: [
      ['5×5 Square', b(15)],
      ['Tangle XI', gen(24, 1.3, 301)],
      ['13-point Star', () => star(13)],
      ['Tangle XII', gen(28, 1.4, 302)],
      ['Triple Ring II', () => nested([5, 10, 15])],
      ['Three Shapes', () => nested([8, 10, 12], { spokes: false })],
      ['Tangle XIII', gen(30, 1.4, 303)],
      ['6×6 Square', b(17)],
      ['Triple Ring III', () => nested([6, 12, 18])],
      ['Tangle XIV', gen(34, 1.4, 304)],
      ['4 Rings', b(19)],
      ['Long Spiral', () => spiral(40)],
      ['Tangle XV', gen(38, 1.5, 305)],
      ['7×7 Square', () => grid(7)],
      ['Tangle XVI', gen(44, 1.5, 306)],
      ['Triple Ring IV', () => nested([8, 16, 24])],
      ['Tangle XVII', gen(50, 1.5, 307)],
      ['25-point Star', () => star(25)],
      ['Tangle XVIII', gen(56, 1.5, 308)],
      ['Triple Ring V', () => nested([12, 18, 24])],
    ],
  },
  {
    id: 'master', name: 'Master', range: [60, 300],
    levels: [
      ['Triple Ring VI', () => nested([10, 20, 30])],
      ['8×8 Square', () => grid(8)],
      ['Tangle XIX', gen(64, 1.4, 401)],
      ['Quadruple Ring', () => nested([12, 24, 36])],
      ['5 Rings', b(20)],
      ['Tangle XX', gen(72, 1.4, 402)],
      ['Great Spiral', () => spiral(80)],
      ['40-point Star', () => star(40)],
      ['Tangle XXI', gen(80, 1.4, 403)],
      ['9×9 Square', () => grid(9)],
      ['Tangle XXII', gen(90, 1.5, 404)],
      ['10×10 Square', () => grid(10)],
      ['Quadruple Ring II', () => nested([10, 20, 30, 40])],
      ['Tangle XXIII', gen(100, 1.5, 405)],
      ['6 Rings', b(21)],
      ['Tangle XXIV', gen(120, 1.5, 406)],
      ['12×12 Square', () => grid(12)],
      ['Tangle XXV', gen(140, 1.5, 407)],
      ['7 Rings', b(22)],
      ['8 Rings', () => rings(8)],
    ],
  },
];

export const LEVELS_PER_SECTION = 20;

export const getSection = (id) => SECTIONS.find((s) => s.id === id) || SECTIONS[0];

const cache = new Map();

/** Level `index` (1-based) of a section: `{name, slots, edges, width, height}`. Built once. */
export function getLevel(sectionId, index) {
  const key = `${sectionId}/${index}`;
  if (!cache.has(key)) {
    const [name, build] = getSection(sectionId).levels[index - 1];
    cache.set(key, { name, ...build() });
  }
  return cache.get(key);
}
