/** Hero headline copy. Only approved phrases: the static first line plus the looping second line. */
export const HERO_STATIC = "Think beyond";

export const HERO_PHRASES = [
  "Engineer what's next.",
  "Intelligence, connected.",
  "Systems, made useful.",
  "Machines, made smarter.",
  "Experiences beyond the screen.",
  "Engineered as one.",
] as const;

/** Time each phrase is on screen, in seconds (fade in, hold, fade out). */
export const PHRASE_SECONDS = 2.4;

/** One full loop, in seconds. The CSS keyframes in hero.css give each phrase 1/HERO_PHRASES.length of it. */
export const LOOP_SECONDS = PHRASE_SECONDS * HERO_PHRASES.length;

/** The H1's accessible name, whatever the visible loop shows. */
export const HERO_ACCESSIBLE_NAME = `${HERO_STATIC}. ${HERO_PHRASES[0]}`;
