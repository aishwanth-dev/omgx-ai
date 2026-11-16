import fc from "fast-check";
import { describe, expect, test } from "vitest";
import { CORE_STATES, corePose, poseAtCursor } from "./coreStates";
import {
  CHAPTER_SPAN,
  CHAPTERS,
  chapterAt,
  FIELD,
  fieldFade,
  fieldRise,
  HERO_HOLD,
  REEL_START,
  reelCursor,
  reelSlot,
} from "./timeline";

describe("timeline", () => {
  test("endpoints", () => {
    expect(reelCursor(0)).toBe(0);
    expect(reelCursor(HERO_HOLD)).toBe(0);
    expect(reelCursor(1)).toBe(6);
    expect(chapterAt(0)).toBe(-1);
    expect(chapterAt(1)).toBe(4);
  });
  test("chapter order", () => {
    expect(CHAPTERS).toEqual(["intelligence", "systems", "machines", "immersion", "integration"]);
    // Each chapter is current during the hold of its own window.
    CHAPTERS.forEach((_, i) => expect(chapterAt(REEL_START + (i + 0.3) * CHAPTER_SPAN)).toBe(i));
  });
  test("continuity at window edges", () => {
    const eps = 1e-7;
    const edges = [HERO_HOLD, REEL_START, ...[1, 2, 3, 4, 5].map((k) => REEL_START + k * CHAPTER_SPAN)];
    for (const e of edges) expect(Math.abs(reelCursor(e + eps) - reelCursor(e - eps))).toBeLessThan(1e-4);
  });
  test("fieldRise", () => {
    expect(fieldRise(0)).toBe(0);
    expect(fieldRise(FIELD.start)).toBe(0);
    expect(fieldRise(FIELD.full)).toBe(1);
    expect(fieldRise(1)).toBe(1);
  });
  test("end state: field risen and faded to mist", () => {
    expect(fieldRise(1)).toBe(1);
    expect(fieldFade(1)).toBe(1);
    expect(fieldFade(0.5)).toBe(0);
  });
});

describe("coreStates", () => {
  test("chapter states are reached at cursor integers", () => {
    for (let i = 0; i < CORE_STATES.length; i++) expect(poseAtCursor(i)).toEqual(CORE_STATES[i]);
  });
  test("hero pose at p = 0 with no idle", () => {
    expect(corePose(0, 0)).toEqual(CORE_STATES[0]);
  });
  test("the pose is continuous in p", () => {
    for (let k = 0; k < 1000; k++) {
      const a = corePose(k / 1000);
      const b = corePose((k + 1) / 1000);
      expect(Math.hypot(...a.position.map((v, j) => v - b.position[j]))).toBeLessThan(0.15);
    }
  });
  test("idle spin and breathing stay small", () => {
    const a = corePose(0.3, 0);
    const b = corePose(0.3, 10);
    expect(b.rings[2][1] - a.rings[2][1]).toBeCloseTo(0.45, 9);
    expect(Math.abs(b.scale / a.scale - 1)).toBeLessThanOrEqual(0.012 + 1e-9);
  });
});

/** **Validates: Requirements 2.2, 2.3, 2.6** (Property 9) */
describe("Property 9: the story reel is a reversible function of progress", () => {
  test("cursor non-decreasing and Lipschitz; chapter non-decreasing in −1..4; slot identity", () => {
    const L = 30; // max slope: 1.5 / 0.4 / 0.13 ≈ 28.9 per unit progress
    fc.assert(
      fc.property(fc.double({ min: 0, max: 1, noNaN: true }), fc.double({ min: 0, max: 1, noNaN: true }), fc.integer({ min: 0, max: 6 }), (a, b, i) => {
        const [p1, p2] = a <= b ? [a, b] : [b, a];
        const c1 = reelCursor(p1);
        const c2 = reelCursor(p2);
        expect(c1).toBeLessThanOrEqual(c2);
        expect(c2 - c1).toBeLessThanOrEqual(L * (p2 - p1) + 1e-9);
        expect(chapterAt(p1)).toBeLessThanOrEqual(chapterAt(p2));
        expect(chapterAt(p1)).toBeGreaterThanOrEqual(-1);
        expect(chapterAt(p2)).toBeLessThanOrEqual(4);
        expect(reelSlot(i, p1)).toBe(i - c1);
        // Same p gives the same pose: scrolling back reverses the reel exactly.
        expect(corePose(p1)).toEqual(corePose(p1));
      }),
      { numRuns: 200 },
    );
  });
});
