import fc from "fast-check";
import { describe, expect, test } from "vitest";
import { HERO_CAM_Z, journeyAt, screenWeights } from "./journey";
import { DEFAULT_LAYOUT, distanceScale, heroDistance, stageShift } from "./layout";
import { chapterWindow, CHAPTERS, JOURNEY } from "./timeline";

describe("journey", () => {
  test("starts on the small, centred object, outside the field", () => {
    const f = journeyAt(0);
    expect(f.camera.position).toEqual([0, 0, HERO_CAM_Z]);
    expect(f.object.visible).toBe(true);
    expect(f.object.opacity).toBe(1);
    expect(f.object.coreOpacity).toBe(1);
    expect(f.universe).toBe(0);
  });
  test("the camera passes the core, which clears for the pass", () => {
    const f = journeyAt(JOURNEY.passCore);
    expect(f.camera.position[2]).toBeCloseTo(0, 6);
    expect(f.object.coreOpacity).toBe(0);
  });
  test("the next universe is up after the pass and the object is behind the camera", () => {
    const f = journeyAt(0.58);
    expect(f.universe).toBe(1);
    expect(f.object.visible).toBe(false);
  });
  test("the object returns ahead of the camera and settles", () => {
    const f = journeyAt(JOURNEY.settle);
    expect(f.object.visible).toBe(true);
    expect(f.object.opacity).toBe(1);
    expect(f.object.position[2]).toBeLessThan(f.camera.position[2] - 5);
    expect(Math.abs(f.object.position[0])).toBeLessThan(1e-9);
  });
  test("the object is gone for the rest of the page", () => {
    for (const p of [JOURNEY.gone, 0.95, 1]) expect(journeyAt(p).object.visible).toBe(false);
    for (const p of [0.93, 0.95, 1]) expect(journeyAt(p).universe).toBe(0);
  });
  test("five chapters in order, each window inside the journey", () => {
    expect(CHAPTERS).toHaveLength(5);
    CHAPTERS.forEach((_, i) => {
      const [a, b] = chapterWindow(i);
      expect(a).toBeLessThan(b);
      if (i) expect(a).toBeCloseTo(chapterWindow(i - 1)[1], 9);
    });
    expect(chapterWindow(4)[1]).toBeCloseTo(JOURNEY.settle, 9);
  });
});

/** **Validates: Requirements 2.2, 2.3, 2.6** (Property 9) */
describe("Property 9: the camera journey is a reversible, smooth function of progress", () => {
  test("pure, bounded, camera never reverses and moves at a bounded rate", () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 1, noNaN: true }), fc.double({ min: 0, max: 1, noNaN: true }), (a, b) => {
        const [p1, p2] = a <= b ? [a, b] : [b, a];
        const f1 = journeyAt(p1);
        const f2 = journeyAt(p2);
        expect(journeyAt(p1)).toEqual(f1);
        // The camera only ever travels forward (z decreases) and never faster than ~120 units per unit progress.
        expect(f2.camera.position[2]).toBeLessThanOrEqual(f1.camera.position[2] + 1e-9);
        expect(f1.camera.position[2] - f2.camera.position[2]).toBeLessThanOrEqual(120 * (p2 - p1) + 1e-9);
        for (const f of [f1, f2]) {
          expect(f.object.opacity).toBeGreaterThanOrEqual(-1e-9);
          expect(f.object.opacity).toBeLessThanOrEqual(1 + 1e-9);
          expect(f.universe).toBeGreaterThanOrEqual(0);
          expect(f.universe).toBeLessThanOrEqual(1 + 1e-9);
        }
      }),
      { numRuns: 300 },
    );
  });
  test("camera and opacity have no jumps", () => {
    for (let k = 0; k < 2000; k++) {
      const a = journeyAt(k / 2000);
      const b = journeyAt((k + 1) / 2000);
      expect(Math.abs(a.camera.position[2] - b.camera.position[2])).toBeLessThan(0.07);
      expect(Math.abs(a.camera.fov - b.camera.fov)).toBeLessThan(0.6);
      expect(Math.abs(a.object.opacity - b.object.opacity)).toBeLessThan(0.03);
      expect(Math.abs(a.object.coreOpacity - b.object.coreOpacity)).toBeLessThan(0.03);
    }
  });
});

describe("stage layout", () => {
  test("the hero sits under the headline, then yields to the reel layout and finally to the centred dive", () => {
    expect(screenWeights(0)).toEqual({ hero: 1, reel: 0 });
    const mid = screenWeights(0.25);
    expect(mid.hero).toBe(0);
    expect(mid.reel).toBe(1);
    expect(screenWeights(0.5)).toEqual({ hero: 0, reel: 0 });
    expect(stageShift(0, DEFAULT_LAYOUT).y).toBeCloseTo(DEFAULT_LAYOUT.heroY, 9);
    expect(stageShift(0.25, DEFAULT_LAYOUT).x).toBeCloseTo(DEFAULT_LAYOUT.reelX, 9);
  });
  test("the hero camera distance frames the object at the requested size", () => {
    const d = heroDistance(0.33, 38);
    // The object spans 2.6 units: its projected height is the requested share of the viewport.
    const share = 2.6 / (2 * d * Math.tan((38 * Math.PI) / 360));
    expect(share).toBeCloseTo(0.33, 9);
    expect(distanceScale(0, DEFAULT_LAYOUT, 38) * HERO_CAM_Z).toBeCloseTo(heroDistance(DEFAULT_LAYOUT.heroSize, 38), 9);
    expect(distanceScale(0.5, DEFAULT_LAYOUT, 38)).toBe(1);
  });
});
