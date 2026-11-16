import fc from "fast-check";
import { describe, expect, test } from "vitest";
import { buildProofPath, CARD_COUNT, CARD_DUR, cardReveal, cardStart, DRAW_END, HOLD_END, lineLength, PROOF_LINES } from "./proofPaths";

const endpoints = (d: string) => {
  const nums = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
  return { x0: nums[0], y0: nums[1], x1: nums[nums.length - 2], y1: nums[nums.length - 1] };
};

describe("buildProofPath", () => {
  test("path endpoints for each line at 1440 × 900", () => {
    const e = PROOF_LINES.map((_, i) => endpoints(buildProofPath(i, 1440, 900)));
    expect(e.map((p) => [p.x0, p.x1])).toEqual([
      [-40, 1480],
      [1480, -40],
      [-40, 1480],
      [1480, -40],
    ]);
    e.forEach((p) => {
      expect(p.y0).toBeGreaterThan(0);
      expect(p.y0).toBeLessThan(900);
    });
  });
});

/** **Validates: Requirements 2.9** (Property 7) */
describe("Property 7: proof lines cross the full width", () => {
  test("each path starts beyond one edge and ends beyond the other", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 3840 }),
        fc.integer({ min: 480, max: 2160 }),
        fc.integer({ min: 0, max: PROOF_LINES.length - 1 }),
        (W, H, i) => {
          const { x0, x1 } = endpoints(buildProofPath(i, W, H));
          const [a, b] = PROOF_LINES[i].dir === 1 ? [x0, x1] : [x1, x0];
          expect(a).toBeLessThan(0);
          expect(b).toBeGreaterThan(W);
        },
      ),
      { numRuns: 200 },
    );
  });

  test("case 5: directions alternate and the draw windows interleave", () => {
    for (let i = 1; i < PROOF_LINES.length; i++) {
      expect(PROOF_LINES[i].dir).toBe(-PROOF_LINES[i - 1].dir);
      expect(PROOF_LINES[i].draw[0]).toBeLessThan(PROOF_LINES[i - 1].draw[1]);
      expect(PROOF_LINES[i].draw[0]).toBeGreaterThan(PROOF_LINES[i - 1].draw[0]);
    }
    expect(PROOF_LINES.some((l) => l.dir === -1)).toBe(true);
    expect(PROOF_LINES.map((l) => l.draw[0])).not.toEqual([0, 0.05, 0.1]);
  });

  test("phase contract: lines and cards finish by DRAW_END, then a short hold, then release", () => {
    expect(Math.max(...PROOF_LINES.map((l) => l.draw[1]))).toBeCloseTo(DRAW_END, 10);
    expect(cardStart(CARD_COUNT - 1) + CARD_DUR).toBeLessThanOrEqual(DRAW_END + 1e-9);
    expect(HOLD_END).toBeGreaterThan(DRAW_END);
    expect(1 - DRAW_END).toBeLessThanOrEqual(0.5);
    for (let i = 0; i < CARD_COUNT; i++) {
      expect(cardReveal(i, 0)).toBe(0);
      expect(cardReveal(i, DRAW_END)).toBe(1);
      if (i) expect(cardStart(i)).toBeGreaterThan(cardStart(i - 1));
    }
    PROOF_LINES.forEach((_, i) => expect(lineLength(i, DRAW_END)).toBe(1));
  });
});

describe("lineLength", () => {
  test("is 0 before and 1 after each draw window, and partial in between", () => {
    PROOF_LINES.forEach((l, i) => {
      expect(lineLength(i, l.draw[0])).toBe(0);
      expect(lineLength(i, l.draw[1])).toBe(1);
      const mid = lineLength(i, (l.draw[0] + l.draw[1]) / 2);
      expect(mid).toBeGreaterThan(0.3);
      expect(mid).toBeLessThan(0.7);
    });
    expect(lineLength(0, 0)).toBe(0);
    expect(lineLength(3, 0.2)).toBe(0);
    expect(lineLength(3, 1)).toBe(1);
  });

  test("is monotonic in progress", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 3 }), fc.double({ min: 0, max: 1, noNaN: true }), fc.double({ min: 0, max: 1, noNaN: true }), (i, a, b) => {
        const [x, y] = a <= b ? [a, b] : [b, a];
        expect(lineLength(i, x)).toBeLessThanOrEqual(lineLength(i, y));
      }),
      { numRuns: 200 },
    );
  });
});