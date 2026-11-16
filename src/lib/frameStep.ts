/** Largest clock step a canvas may take in one ticker frame (no jumps after a pause). */
export const MAX_STEP_S = 1 / 20;

/** Next canvas clock value in seconds from the ticker's delta in milliseconds. */
export const nextSeconds = (prev: number, deltaMs: number) =>
  prev + Math.min(Math.max(0, Number.isFinite(deltaMs) ? deltaMs : 0) / 1000, MAX_STEP_S);
