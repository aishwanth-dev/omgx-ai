/** Heading split and reveal timing (TextReveal adaptation). Pure, property-tested. */
export const normalise = (s: string) => s.trim().replace(/\s+/g, " ");

export const splitWords = (s: string) => (normalise(s) ? normalise(s).split(" ") : []);

/** Forced lines: a string is one line; empty lines are dropped. */
export const splitLines = (text: string | readonly string[]) =>
  (typeof text === "string" ? [text] : text).map(splitWords).filter((l) => l.length > 0);

/** TextReveal timing: 0.6 s per word, 0.055 s stagger, whole heading within 1.6 s. */
export const revealStep = (n: number, stagger = 0.055, max = 1.6, dur = 0.6) =>
  n > 1 ? Math.min(stagger, (max - dur) / (n - 1)) : 0;

/** Total reveal duration for n words. */
export const revealTotal = (n: number, dur = 0.6) => (n > 0 ? dur + (n - 1) * revealStep(n) : 0);
