/** Story timeline shared by HomeStory (DOM) and StoryScene (3D). Pure and tested. */
export const HERO_HOLD = 0.06;
export const REEL_START = 0.12;
export const CHAPTER_SPAN = 0.13; // 5 chapters: 0.12–0.77
export const FIELD = { start: 0.74, full: 0.9 } as const;
export const MANIFESTO = { start: 0.86, done: 0.97 } as const;
/**
 * The camera journey (journey.ts) hangs off the same progress: the dive through the
 * rings and core ends at PASS_CORE, the object is behind the camera until REAPPEAR,
 * settles by SETTLE, then leaves the frame and is gone from GONE onward.
 */
export const JOURNEY = { passCore: 0.5, behind: 0.56, reappear: 0.62, settle: 0.77, exitFrom: 0.8, gone: 0.9 } as const;
export const CHAPTERS = ["intelligence", "systems", "machines", "immersion", "integration"] as const;
export type Chapter = (typeof CHAPTERS)[number];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const smooth = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
/** Each chapter holds for 60% of its span, then hands over during the last 40%. */
const stepped = (x: number) => Math.floor(x) + smooth((x - Math.floor(x) - 0.6) / 0.4);

/** 0 = headline current, 1..5 = chapter current, 6 = chapter 5 has moved up as the field rises. */
export const reelCursor = (p: number) =>
  p <= HERO_HOLD
    ? 0
    : p < REEL_START
      ? smooth((p - HERO_HOLD) / (REEL_START - HERO_HOLD))
      : Math.min(6, 1 + stepped((p - REEL_START) / CHAPTER_SPAN));

/** Progress window [start, end] of chapter i (its full span, hold plus hand-over). */
export const chapterWindow = (i: number): [number, number] => [REEL_START + i * CHAPTER_SPAN, REEL_START + (i + 1) * CHAPTER_SPAN];

/** 0 current, −1 previous, +1 next. */
export const reelSlot = (i: number, p: number) => i - reelCursor(p);

/** Current chapter index 0..4, or −1 before the reel starts. */
export const chapterAt = (p: number) => {
  const c = reelCursor(p);
  return c < 0.5 ? -1 : Math.min(4, Math.round(c) - 1);
};

export const fieldRise = (p: number) => smooth((p - FIELD.start) / (FIELD.full - FIELD.start));

/** The field's lower part turns to mist over the manifesto window (the story ends on #f3f5fa). */
export const fieldFade = (p: number) => smooth((p - MANIFESTO.start) / (MANIFESTO.done - MANIFESTO.start));
