/**
 * Process deck timing. Pure, property-tested. Deck time t is in units; the CSS track is 100svh + UNITS × UNIT_SVH.
 * Card 01 holds briefly, then each following card enters and holds briefly. n = 5 → 4.2 units = 168svh of scroll
 * (268svh track), where the first version needed 9 units × 45svh and the second 316svh.
 */
export const UNIT_SVH = 40;
export const HOLD0 = 0.4; // card 01 alone
export const ENTER = 0.7; // one card sliding in
export const HOLD = 0.25; // a landed card, before the next one starts
export const TAIL = 0.25; // last card held at the end
export const UNITS = (n: number) => HOLD0 + Math.max(0, n - 1) * ENTER + Math.max(0, n - 2) * HOLD + TAIL;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOut = (t: number) => 1 - (1 - t) ** 3; // ProjectDeck easing

/** Deck time at which card k (k ≥ 1) starts entering. */
export const enterStart = (k: number) => HOLD0 + (k - 1) * (ENTER + HOLD);

/** Arrival of card k (0-based) at deck time t; card k ≥ 1 enters during [enterStart(k), enterStart(k) + ENTER]. */
export const arrival = (k: number, t: number) => (k === 0 ? 1 : easeOut(clamp01((t - enterStart(k)) / ENTER)));
/** The top card is the last card at least half arrived; it drives highlight, aria-hidden and inert. */
export const processTopIndex = (t: number, n: number) => {
  let top = 0;
  for (let k = 1; k < n; k++) if (arrival(k, t) >= 0.5) top = k;
  return top;
};

/** Cards lying above card i, counted smoothly and capped at 3 (ProjectDeck "above"). */
export const coverDepth = (i: number, t: number, n: number) => {
  let d = 0;
  for (let k = i + 1; k < n; k++) d += arrival(k, t);
  return Math.min(3, d);
};

/** Cards after the top card are hidden from assistive technology (and inert). */
export const cardHidden = (i: number, t: number, n: number) => i > processTopIndex(t, n);
