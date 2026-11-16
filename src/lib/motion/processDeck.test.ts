import fc from "fast-check";
import { describe, expect, test } from "vitest";
import { arrival, cardHidden, coverDepth, ENTER, enterStart, HOLD0, processTopIndex, UNITS, UNIT_SVH } from "./processDeck";

const N = 5;
const T = UNITS(N);

describe("processDeck", () => {
  test("UNITS(5) keeps the track near 268svh", () => {
    expect(UNITS(5)).toBeCloseTo(4.2, 10);
    expect(100 + UNITS(5) * UNIT_SVH).toBeGreaterThanOrEqual(250);
    expect(100 + UNITS(5) * UNIT_SVH).toBeLessThanOrEqual(300);
    expect(UNITS(1)).toBeGreaterThan(0);
  });
  test("arrival at unit edges", () => {
    expect(arrival(0, 0)).toBe(1);
    expect(arrival(1, enterStart(1))).toBe(0);
    expect(arrival(1, enterStart(1) + ENTER)).toBe(1);
    expect(arrival(2, enterStart(2))).toBe(0);
    expect(arrival(4, enterStart(4) + ENTER)).toBe(1);
    expect(enterStart(4) + ENTER).toBeLessThan(T);
  });
  test("top index before, during and after the entries", () => {
    expect(processTopIndex(0, N)).toBe(0);
    expect(processTopIndex(enterStart(1) + ENTER * 0.3, N)).toBe(1); // easeOut(0.3) ≈ 0.66
    expect(processTopIndex(T, N)).toBe(4);
  });
  test("coverDepth is capped at 3", () => {
    expect(coverDepth(0, T, N)).toBe(3);
    expect(coverDepth(3, T, N)).toBe(1);
    expect(coverDepth(4, T, N)).toBe(0);
    expect(coverDepth(0, 0, N)).toBe(0);
  });
});
/** **Validates: Requirements 2.12** (Property 5) */
describe("Property 5: process deck agreement", () => {
  const t = fc.double({ min: 0, max: T, noNaN: true });

  test("top index is non-decreasing and is the last card at least half arrived", () => {
    fc.assert(
      fc.property(t, t, (a, b) => {
        const [t1, t2] = a <= b ? [a, b] : [b, a];
        expect(processTopIndex(t1, N)).toBeLessThanOrEqual(processTopIndex(t2, N));
        const top = processTopIndex(t1, N);
        let last = 0;
        for (let k = 1; k < N; k++) if (arrival(k, t1) >= 0.5) last = k;
        expect(top).toBe(last);
        for (let i = 0; i < N; i++) expect(cardHidden(i, t1, N)).toBe(i > top);
      }),
      { numRuns: 200 },
    );
  });

  test("hold windows: card k is fully landed and k + 1 not started between its landing and the next start", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: N - 1 }), fc.double({ min: 0, max: 1, noNaN: true }), (k, f) => {
        const land = enterStart(k) + ENTER;
        const tt = k + 1 < N ? land + f * (enterStart(k + 1) - land) : land + f;
        expect(arrival(k, tt)).toBe(1);
        if (k + 1 < N) expect(arrival(k + 1, tt)).toBe(0);
      }),
      { numRuns: 200 },
    );
  });

  test("case 1: the highlight equals the visible top card for every raw progress", () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 1, noNaN: true }), (p) => {
        const tt = p * T;
        const top = processTopIndex(tt, N);
        if (top > 0) expect(arrival(top, tt)).toBeGreaterThanOrEqual(0.5);
        for (let k = top + 1; k < N; k++) expect(arrival(k, tt)).toBeLessThan(0.5);
      }),
      { numRuns: 200 },
    );
    // Just after card 02 starts moving, the highlight is still on 01 until it is half arrived.
    expect(processTopIndex(enterStart(1) + 0.01, N)).toBe(0);
  });

  test("case 2: only card 01 is visible before the first entry", () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: HOLD0 / T, maxExcluded: true, noNaN: true }), (p) => {
        for (let k = 1; k < N; k++) expect(arrival(k, p * T)).toBe(0);
        expect(processTopIndex(p * T, N)).toBe(0);
      }),
      { numRuns: 200 },
    );
  });
});
