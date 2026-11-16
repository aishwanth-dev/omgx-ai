/**
 * Proof section timing. Pure, property-tested. One scrubbed timeline of progress 0..1 on a ~230svh track:
 *   phase 1 (0 - DRAW_END): the lines draw and the cards reveal one by one, each as a line passes its row;
 *   phase 2 (DRAW_END - HOLD_END): everything is drawn and revealed (the field has risen), a short settle;
 *   phase 3 (HOLD_END - 1): the section releases to the next one.
 */
export const DRAW_END = 0.55;
export const HOLD_END = 0.8;

export const PROOF_LINES = [
  { y: 0.3, amp: 0.1, dir: 1, draw: [0.0, 0.25] }, // lead line (brightest)
  { y: 0.48, amp: 0.12, dir: -1, draw: [0.1, 0.35] },
  { y: 0.64, amp: 0.09, dir: 1, draw: [0.2, 0.45] },
  { y: 0.8, amp: 0.11, dir: -1, draw: [0.3, DRAW_END] },
] as const;

/** Cards reveal in a stagger; the first three sit on the upper rows (lines 0-1), the rest on the lower rows (lines 2-3). */
export const CARD_COUNT = 6;
export const CARD_DUR = 0.17;
export const cardStart = (i: number) => 0.02 + i * 0.07;
/** Reveal fraction (0..1) of card i at progress p, linear; the component eases it. */
export const cardReveal = (i: number, p: number) => Math.min(1, Math.max(0, (p - cardStart(i)) / CARD_DUR));

/** A full-width wave from beyond one edge to beyond the other, in stage pixels. */
export function buildProofPath(i: number, w: number, h: number, pad = 40): string {
  const { y, amp, dir } = PROOF_LINES[i];
  const [x0, x1] = dir === 1 ? [-pad, w + pad] : [w + pad, -pad];
  // Swing is capped by the stage width so a tall, narrow (mobile) stage gets gentle waves, not near-vertical ones.
  const swing = Math.min(h, w * 1.2);
  const yAt = (k: number) => (y * h + amp * swing * Math.sin(k * Math.PI + i)).toFixed(1);
  const dx = (x1 - x0) / 4;
  // Horizontal tangents at the start, the middle and the end keep the wave smooth under a thick stroke.
  return (
    `M${x0} ${yAt(0)} C${x0 + dx} ${yAt(0)} ${x0 + dx} ${yAt(1)} ${x0 + 2 * dx} ${yAt(1)}` +
    ` S${x1 - dx} ${yAt(2.5)} ${x1} ${yAt(2.5)}`
  );
}

/** Drawn fraction (0..1 of the path) of line i at scroll progress p: eased inside its own window, so scrolling back un-draws it. */
export function lineLength(i: number, p: number): number {
  const [a, b] = PROOF_LINES[i].draw;
  const t = Math.min(1, Math.max(0, (p - a) / (b - a)));
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2; // quad in-out
}