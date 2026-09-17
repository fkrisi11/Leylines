import { findCrossings } from './geometry.js';

/** Smallest distance between any two slots (used for node sizing). */
export function minSlotDistance(slots) {
  let best = Infinity;
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const dx = slots[i][0] - slots[j][0], dy = slots[i][1] - slots[j][1];
      best = Math.min(best, Math.hypot(dx, dy));
    }
  }
  return best === Infinity ? 1 : best;
}

export class Puzzle {
  /**
   * @param {{slots: number[][], edges: number[][], perm?: number[], width?: number, height?: number}} def
   * slots: fixed positions; edges: pairs of node ids; perm[node] = slot index.
   */
  constructor({ slots, edges, perm, width = 1, height = 1 }) {
    this.slots = slots;
    this.edges = edges;
    this.perm = perm ? perm.slice() : slots.map((_, i) => i);
    this.width = width;
    this.height = height;
    this.minDist = minSlotDistance(slots);
  }

  get size() { return this.slots.length; }

  positions() {
    return this.perm.map((s) => this.slots[s]);
  }

  swap(a, b) {
    [this.perm[a], this.perm[b]] = [this.perm[b], this.perm[a]];
  }

  crossedEdges() {
    return findCrossings(this.positions(), this.edges);
  }

  isSolved() {
    return this.crossedEdges().size === 0;
  }

  clone() {
    return new Puzzle({ slots: this.slots, edges: this.edges, perm: this.perm, width: this.width, height: this.height });
  }
}
