import { makeRng, shuffle } from '../rng.js';

/**
 * Returns a copy of `puzzle` with a random permutation that has at least one crossing.
 * Deterministic for a given seed. Gives up after 200 attempts (returns the last attempt).
 */
export function scramble(puzzle, seed) {
  const rng = makeRng(seed);
  let out = puzzle.clone();
  for (let attempt = 0; attempt < 200; attempt++) {
    out = puzzle.clone();
    shuffle(out.perm, rng);
    if (!out.isSolved()) return out;
  }
  return out;
}
