import { Puzzle } from './puzzle.js';
import { scramble } from './levels/scramble.js';
import { generateLevel } from './levels/generator.js';
import { getLevel, getSection, LEVELS_PER_SECTION } from './levels/campaign.js';
import { Tweens, ease, lerp, formatTime, sway } from './animation.js';
import { storage } from './storage.js';
import { Viewport } from './render.js';
import { getSkin, skins } from './skins/index.js';

/** Small string hash so each campaign section gets its own scramble seeds. */
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return (h >>> 0) % 100000;
}

const SWAP_MS = 350;
const SOLVED_MS = 800;
const FADE_OUT_MS = 500;
const FADE_IN_MS = 500;

/**
 * Owns the state machine, animation and input. The HTML overlay is driven through the `ui`
 * callbacks supplied by main.js, so this file knows nothing about the DOM beyond the canvas.
 *
 * ui = { showToast(text), setHud({level, mode, tier, section, name}), showSummary(times, section) }
 *
 * States: idle → fadeIn → playing ⇄ swapping → solved → fadeOut → fadeIn …
 */
export class Game {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = ui;
    this.viewport = new Viewport();
    this.tweens = new Tweens();
    this.skin = getSkin(storage.get('skin', skins[0].id));
    this.state = 'idle';
    this.mode = null;             // 'campaign' | 'infinite'
    this.section = null;          // campaign section id
    this.debug = false;           // unlocks everything, enables jump()/peek()
    this.sway = storage.get('sway', true); // individual line movement (menu checkbox)
    this.peeking = false;
    this.levelIndex = 0;          // 1-based
    this.puzzle = null;
    this.visual = [];             // drawn position per node (layout units), animated during swaps
    this.moving = new Set();
    this.crossed = new Set();
    this.selected = -1;
    this.hover = -1;
    this.alphaNodes = 0;
    this.alphaLines = 0;
    this.edgeState = 'clear';     // 'solved' overrides per-edge state during the green flash
    this.startedAt = 0;
    this.times = [];
    this.seed = 1;
    this.lastFrame = performance.now();
    this._bind();
    requestAnimationFrame((t) => this._frame(t));
  }

  // ---- public API ---------------------------------------------------------

  setSkin(id) { this.skin = getSkin(id); storage.set('skin', this.skin.id); }

  setSway(on) { this.sway = !!on; storage.set('sway', this.sway); }

  startCampaign(sectionId, index) {
    this.mode = 'campaign';
    this.section = getSection(sectionId).id;
    this.times = [];
    this._load(index);
  }

  startInfinite(tier = 'normal') {
    this.mode = 'infinite';
    this.tier = tier;
    this.times = [];
    this.seed = (Date.now() & 0xffff) || 1;
    this._load(1);
  }

  stop() {
    this.state = 'idle';
    this.puzzle = null;
    this.tweens.clear();
  }

  /** Debug: move to another level of the current mode without solving. */
  jump(delta) {
    if (!this.debug || !this.puzzle) return;
    const max = this.mode === 'campaign' ? LEVELS_PER_SECTION : Infinity;
    const next = Math.min(max, Math.max(1, this.levelIndex + delta));
    if (next !== this.levelIndex) { this.tweens.clear(); this.peeking = false; this._load(next); }
  }

  /** Debug: show the solved layout (true) or the current scramble (false). */
  peek(on) {
    if (!this.debug || !this.puzzle) return;
    this.peeking = on;
    this.selected = -1;
    this.visual = on ? this.puzzle.slots.map((p) => p.slice()) : this.puzzle.positions().map((p) => p.slice());
    this.crossed = on ? new Set() : this.puzzle.crossedEdges();
  }

  // ---- level flow ---------------------------------------------------------

  _load(index) {
    this.levelIndex = index;
    const campaign = this.mode === 'campaign';
    const def = campaign ? getLevel(this.section, index) : generateLevel(index, this.seed, this.tier);
    const seed = campaign ? hash(this.section) + index : this.seed * 31 + index;
    this.puzzle = scramble(new Puzzle(def), seed);
    this.visual = this.puzzle.positions().map((p) => p.slice());
    this.crossed = this.puzzle.crossedEdges();
    this.selected = -1; this.hover = -1; this.moving.clear(); this.peeking = false;
    this.edgeState = 'clear';
    this.viewport.fit(this.puzzle);
    this.ui.setHud({ level: index, mode: this.mode, tier: this.tier, section: this.section, name: def.name });
    // fade in: nodes first, then lines
    this.state = 'fadeIn';
    this.alphaNodes = 0; this.alphaLines = 0;
    this.tweens.add({ duration: FADE_IN_MS, easing: ease.out, update: (p) => { this.alphaNodes = p; } });
    this.tweens.add({
      duration: FADE_IN_MS, delay: FADE_IN_MS * 0.6, easing: ease.out,
      update: (p) => { this.alphaLines = p; },
      done: () => { this.state = 'playing'; this.startedAt = performance.now(); },
    });
  }

  _onSolved() {
    const elapsed = performance.now() - this.startedAt;
    this.times.push(elapsed);
    if (this.mode === 'campaign' && !this.debug) {
      const best = storage.get('best', {});
      const mine = best[this.section] || (best[this.section] = {});
      if (!mine[this.levelIndex] || elapsed < mine[this.levelIndex]) {
        mine[this.levelIndex] = elapsed;
        storage.set('best', best);
      }
      const unlocked = storage.get('unlocked', {});
      unlocked[this.section] = Math.max(unlocked[this.section] || 1, this.levelIndex + 1);
      storage.set('unlocked', unlocked);
    }
    this.state = 'solved';
    this.edgeState = 'solved';
    this.selected = -1;
    this.skin.onSolve(this.visual.map((p) => this.viewport.toPx(p)), this.viewport.nodeR);
    this.ui.showToast(`Level ${this.levelIndex} — ${formatTime(elapsed)}`);
    this.tweens.add({
      duration: SOLVED_MS,
      done: () => {
        this.state = 'fadeOut';
        this.tweens.add({
          duration: FADE_OUT_MS,
          update: (p) => { this.alphaNodes = 1 - p; this.alphaLines = 1 - p; },
          done: () => this._next(),
        });
      },
    });
  }

  _next() {
    if (this.mode === 'campaign' && this.levelIndex >= LEVELS_PER_SECTION) {
      const times = this.times;
      this.stop();
      this.ui.showSummary(times, this.section);
      return;
    }
    this._load(this.levelIndex + 1);
  }

  // ---- input --------------------------------------------------------------

  _bind() {
    this.canvas.addEventListener('pointerdown', (e) => this._onPointer(e));
    this.canvas.addEventListener('pointermove', (e) => {
      if (this.puzzle) this.hover = this.viewport.hit(e.offsetX, e.offsetY, this.visual);
    });
    this.canvas.addEventListener('pointerleave', () => { this.hover = -1; });
  }

  _onPointer(e) {
    if (this.state !== 'playing' || this.peeking) return;
    const n = this.viewport.hit(e.offsetX, e.offsetY, this.visual);
    if (n === -1 || n === this.selected) { this.selected = -1; return; }
    if (this.selected === -1) {
      this.selected = n;
      this.skin.onSelect(this.viewport.toPx(this.visual[n]), this.viewport.nodeR);
      return;
    }
    this._swap(this.selected, n);
  }

  _swap(a, b) {
    this.state = 'swapping';
    const from = [this.visual[a].slice(), this.visual[b].slice()];
    this.puzzle.swap(a, b);
    const pos = this.puzzle.positions();
    const to = [pos[a], pos[b]];
    this.moving = new Set([a, b]);
    this.skin.onSwap(this.viewport.toPx(from[0]), this.viewport.toPx(from[1]), this.viewport.nodeR);
    this.selected = -1;
    this.tweens.add({
      duration: SWAP_MS, easing: ease.inOut,
      update: (p) => {
        this.visual[a] = [lerp(from[0][0], to[0][0], p), lerp(from[0][1], to[0][1], p)];
        this.visual[b] = [lerp(from[1][0], to[1][0], p), lerp(from[1][1], to[1][1], p)];
      },
      done: () => {
        this.moving.clear();
        this.crossed = this.puzzle.crossedEdges();
        if (this.crossed.size === 0) this._onSolved();
        else this.state = 'playing';
      },
    });
  }

  // ---- render -------------------------------------------------------------

  _frame(now) {
    const dt = Math.min(50, now - this.lastFrame);
    this.lastFrame = now;
    this._resizeIfNeeded();
    this.tweens.update(now);
    const { ctx, viewport: v } = this;
    if (v.w === 0 || v.h === 0) { requestAnimationFrame((t) => this._frame(t)); return; } // hidden / not laid out yet
    ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
    this.skin.background(ctx, v.w, v.h, now);
    if (this.puzzle) {
      const pos = this.visual;
      this.puzzle.edges.forEach(([a, b], i) => {
        const state = this.edgeState === 'solved' ? 'solved' : this.crossed.has(i) ? 'crossed' : 'clear';
        const p = v.toPx(pos[a]), q = v.toPx(pos[b]);
        const bow = this.sway ? sway(i, now, Math.hypot(q[0] - p[0], q[1] - p[1])) : 0;
        this.skin.drawEdge(ctx, p, q, state, now, this.alphaLines, v.lineW, bow);
      });
      const r = v.nodeR * this.skin.nodeScale;
      pos.forEach((p, i) => {
        const state = this.moving.has(i) ? 'moving'
          : i === this.selected ? 'selected'
          : i === this.hover && this.state === 'playing' ? 'hover'
          : 'idle';
        this.skin.drawNode(ctx, v.toPx(p), state, now, this.alphaNodes, r);
      });
    }
    this.skin.drawEffects(ctx, now, dt);
    requestAnimationFrame((t) => this._frame(t));
  }

  _resizeIfNeeded() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (this.canvas.width !== Math.round(w * dpr) || this.canvas.height !== Math.round(h * dpr)) {
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.viewport.resize(w, h, dpr);
      if (this.puzzle) this.viewport.fit(this.puzzle);
    }
  }
}
