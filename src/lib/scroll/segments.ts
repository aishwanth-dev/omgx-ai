/** Scroll-track segments. Pure, unit- and property-tested. */
export const clampIndex = (i: number, n: number) => Math.max(0, Math.min(n - 1, i));

/** Equal segments: [0, 1/n) → 0 … [(n−1)/n, 1] → n−1, the same in both scroll directions. */
export const indexFromProgress = (p: number, n: number) =>
  n <= 1 ? 0 : clampIndex(Math.floor(Math.min(Math.max(p, 0), 1) * n), n);

/** Progress at the middle of segment i: where a click or key selection scrolls to. */
export const segmentMid = (i: number, n: number) => (clampIndex(i, n) + 0.5) / n;

export const progressToY = (p: number, start: number, end: number) => start + p * (end - start);

/**
 * Index straight from the scroll position and the track's start/end scroll offsets.
 * Never NaN: a zero, negative or non-finite span, or a non-finite input, gives 0.
 */
export const indexFromScroll = (scrollY: number, start: number, end: number, n: number) => {
  const span = end - start;
  if (n <= 1 || !Number.isFinite(scrollY) || !Number.isFinite(span) || span <= 0) return 0;
  const p = (scrollY - start) / span;
  return Number.isFinite(p) ? indexFromProgress(p, n) : 0;
};
