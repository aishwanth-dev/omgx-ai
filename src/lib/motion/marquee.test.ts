import fc from "fast-check";
import { describe, expect, test } from "vitest";
import { MARQUEE_DEFAULTS as P, marqueeSpeed, stepMarquee, wrapOffset } from "./marquee";

const W = 800;
/** Congruence modulo w, tolerant of floating-point error. */
const congruent = (a: number, b: number, w: number) => {
  const r = Math.abs((((a - b) % w) + w) % w);
  return Math.min(r, w - r) < 1e-6 * Math.max(1, Math.abs(a), Math.abs(b));
};

describe("wrapOffset", () => {
  test("at −w, 0, w and a large x", () => {
    expect(wrapOffset(-W, W) === 0).toBe(true);
    expect(wrapOffset(0, W) === 0).toBe(true);
    expect(wrapOffset(W, W) === 0).toBe(true);
    expect(wrapOffset(-W / 2, W)).toBe(-W / 2);
    expect(wrapOffset(W / 4, W)).toBe(-(3 * W) / 4);
    const big = wrapOffset(1e7 + 123, W);
    expect(big).toBeLessThanOrEqual(0);
    expect(big).toBeGreaterThan(-W);
    expect(congruent(big, 1e7 + 123, W)).toBe(true);
  });
  test("a zero width returns 0", () => {
    expect(wrapOffset(37, 0)).toBe(0);
  });
});

describe("stepMarquee", () => {
  test("v = 0 moves at base speed", () => {
    const s = stepMarquee({ x: -100, boost: 0 }, 1, 0.1, 0, P, W);
    expect(s.x).toBeCloseTo(-100 - P.base * 0.1, 9);
  });
  test("a large positive v pushes forward, capped at maxBoost", () => {
    let s = { x: -10, boost: 0 };
    for (let i = 0; i < 600; i++) s = stepMarquee(s, 1, 1 / 60, 1e6, P, W);
    expect(s.boost).toBeLessThanOrEqual(P.maxBoost);
    expect(s.boost).toBeGreaterThan(P.maxBoost * 0.99);
  });
  test("a large negative v holds back to the speed floor, never stopping", () => {
    let s = { x: -10, boost: 0 };
    for (let i = 0; i < 600; i++) s = stepMarquee(s, 1, 1 / 60, -1e6, P, W);
    expect(marqueeSpeed(s.boost, P)).toBe(P.minSpeed);
  });
});

/** **Validates: Requirements 2.8** (Property 6) */
describe("Property 6: the marquee never stops and wraps without a jump", () => {
  test("speed floor, decaying boost at rest, and congruent wrap", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            dt: fc.double({ min: 1e-4, max: 0.05, noNaN: true }),
            v: fc.oneof(fc.constant(0), fc.double({ min: -2e4, max: 2e4, noNaN: true })),
          }),
          { minLength: 1, maxLength: 60 },
        ),
        fc.constantFrom<1 | -1>(1, -1),
        (steps, dir) => {
          let s = { x: 0, boost: 0 };
          for (const { dt, v } of steps) {
            const next = stepMarquee(s, dir, dt, v, P, W);
            const speed = marqueeSpeed(next.boost, P);
            expect(speed).toBeGreaterThanOrEqual(P.minSpeed);
            if (v === 0) expect(Math.abs(next.boost)).toBeLessThanOrEqual(Math.abs(s.boost) + 1e-12);
            expect(next.x).toBeLessThanOrEqual(0);
            expect(next.x).toBeGreaterThan(-W);
            expect(congruent(next.x, s.x - dir * speed * dt, W)).toBe(true);
            s = next;
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  test("case 4: with the scroll held for 2 s, both rows still travel", () => {
    for (const dir of [1, -1] as const) {
      let s = { x: -1, boost: 0 };
      let travel = 0;
      for (let i = 0; i < 120; i++) {
        s = stepMarquee(s, dir, 1 / 60, 0, P, 1e9);
        travel += marqueeSpeed(s.boost, P) / 60;
      }
      expect(travel).toBeGreaterThanOrEqual(P.minSpeed * 2 - 1e-9);
      expect(s.x).not.toBe(-1);
    }
  });
});
