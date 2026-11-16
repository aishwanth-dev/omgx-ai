import fc from "fast-check";
import { describe, expect, test } from "vitest";
import { clampIndex, indexFromProgress, indexFromScroll, progressToY, segmentMid } from "./segments";

describe("segments", () => {
  test("p = 0, 1/n and 1", () => {
    expect(indexFromProgress(0, 4)).toBe(0);
    expect(indexFromProgress(1 / 4, 4)).toBe(1);
    expect(indexFromProgress(1, 4)).toBe(3);
  });
  test("clamping", () => {
    expect(indexFromProgress(-0.5, 4)).toBe(0);
    expect(indexFromProgress(1.7, 4)).toBe(3);
    expect(indexFromProgress(0.5, 1)).toBe(0);
    expect(clampIndex(9, 5)).toBe(4);
    expect(clampIndex(-2, 5)).toBe(0);
  });
  test("segmentMid", () => {
    expect(segmentMid(0, 4)).toBe(0.125);
    expect(segmentMid(3, 4)).toBe(0.875);
    expect(segmentMid(7, 4)).toBe(0.875);
  });
  test("indexFromScroll: clamps and never yields NaN", () => {
    expect(indexFromScroll(500, 100, 900, 4)).toBe(2);
    expect(indexFromScroll(-50, 100, 900, 4)).toBe(0);
    expect(indexFromScroll(5000, 100, 900, 4)).toBe(3);
    expect(indexFromScroll(500, 100, 100, 4)).toBe(0);
    expect(indexFromScroll(500, 900, 100, 4)).toBe(0);
    expect(indexFromScroll(NaN, 100, 900, 4)).toBe(0);
    expect(indexFromScroll(500, 100, Infinity, 4)).toBe(0);
    expect(indexFromScroll(500, 100, 900, 1)).toBe(0);
  });
  test("progressToY", () => {
    expect(progressToY(0, 100, 900)).toBe(100);
    expect(progressToY(0.5, 100, 900)).toBe(500);
    expect(progressToY(1, 100, 900)).toBe(900);
  });
});

/** **Validates: Requirements 2.7, 2.11, 2.13** (Property 4) */
describe("Property 4: scroll-driven activation", () => {
  test("in range, non-decreasing, equal segments, and segmentMid round-trips", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 12 }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        (n, a, b) => {
          const [p1, p2] = a <= b ? [a, b] : [b, a];
          const i1 = indexFromProgress(p1, n);
          const i2 = indexFromProgress(p2, n);
          expect(i1).toBeGreaterThanOrEqual(0);
          expect(i2).toBeLessThanOrEqual(n - 1);
          expect(i1).toBeLessThanOrEqual(i2);
          for (let i = 0; i < n; i++) {
            expect(indexFromProgress(segmentMid(i, n), n)).toBe(i);
            // Segment i spans [i/n, (i+1)/n): equal widths within 1e-9.
            const lo = segmentMid(i, n) - 0.5 / n;
            const hi = segmentMid(i, n) + 0.5 / n;
            expect(Math.abs(hi - lo - 1 / n)).toBeLessThan(1e-9);
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  test("case 3: the open capability row goes 0 → 3 in order as p rises", () => {
    const seen: number[] = [];
    for (let k = 0; k <= 1000; k++) {
      const i = indexFromProgress(k / 1000, 4);
      if (seen[seen.length - 1] !== i) seen.push(i);
    }
    expect(seen).toEqual([0, 1, 2, 3]);
    expect(indexFromProgress(0.25, 4)).toBe(1);
  });
});
