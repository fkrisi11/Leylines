export const ease = {
  linear: (t) => t,
  inOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  out: (t) => 1 - (1 - t) * (1 - t),
};

export const lerp = (a, b, t) => a + (b - a) * t;

/** "m:ss.t" — minutes, zero-padded seconds, tenths. */
export function formatTime(ms) {
  const tenths = Math.floor(ms / 100);
  const s = Math.floor(tenths / 10);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}.${tenths % 10}`;
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/** Minimal tween scheduler. Progress passed to update() is already eased (linear by default). */
export class Tweens {
  constructor() { this.list = []; }
  get busy() { return this.list.length > 0; }
  add({ duration, update, done, easing = ease.linear, delay = 0 }, at = now()) {
    this.list.push({ start: at + delay, duration, update, done, easing });
  }
  update(t) {
    for (const tw of this.list.slice()) {
      if (t < tw.start) continue;
      const p = Math.min(1, (t - tw.start) / tw.duration);
      tw.update?.(tw.easing(p));
      if (p >= 1) {
        this.list.splice(this.list.indexOf(tw), 1);
        tw.done?.();
      }
    }
  }
  clear() { this.list.length = 0; }
}

/**
 * Sideways bow (px) of edge `i` at time `t` (ms) for the "line sway" option. Each edge gets its
 * own phase and period so neighbouring lines never move in step, which makes them easier to
 * tell apart. Amplitude scales with the line's length and is capped to stay subtle.
 */
export function sway(i, t, length) {
  const amp = Math.min(6, length * 0.03);
  const period = 2200 + ((i * 7919) % 1300);          // 2.2–3.5 s
  const phase = ((i * 2654435761) >>> 0) % 628 / 100;  // 0–2π
  return amp * Math.sin((t / period) * Math.PI * 2 + phase);
}
