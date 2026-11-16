/** Kinetic marquee step and wrap. Pure, property-tested. */
export type MarqueeState = { x: number; boost: number };
export type MarqueeParams = { base: number; minSpeed: number; k: number; maxBoost: number; tau: number };

export const MARQUEE_DEFAULTS: MarqueeParams = { base: 40, minSpeed: 14, k: 0.06, maxBoost: 140, tau: 0.6 };

/** Keeps x in (−w, 0]; congruent to x modulo w, so wrapping never changes the drawn position. */
export const wrapOffset = (x: number, w: number) => (w > 0 ? ((x % w) - w) % w : 0);

/** Row speed in px/s for a boost: never below minSpeed, so the rows never stop (2.8). */
export const marqueeSpeed = (boost: number, p: MarqueeParams) => Math.max(p.minSpeed, p.base + boost);

export function stepMarquee(
  s: MarqueeState,
  dir: 1 | -1,
  dt: number,
  scrollV: number,
  p: MarqueeParams,
  w: number,
): MarqueeState {
  const target = Math.max(-p.maxBoost, Math.min(p.maxBoost, scrollV * p.k));
  const boost = s.boost + (target - s.boost) * (1 - Math.exp(-dt / p.tau));
  const speed = marqueeSpeed(boost, p);
  return { x: wrapOffset(s.x - dir * speed * dt, w), boost };
}
