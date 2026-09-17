import { leycrystals } from './leycrystals.js';
import { blingtron } from './blingtron.js';

/**
 * A skin draws the puzzle and its effects. To add one, implement the same shape as
 * leycrystals.js and add it here (trace edges with path.js so line sway works). Edge states:
 * clear | crossed | solved.
 * Node states: idle | hover | selected | moving.
 */
export const skins = [leycrystals, blingtron];
export const getSkin = (id) => skins.find((s) => s.id === id) || skins[0];
