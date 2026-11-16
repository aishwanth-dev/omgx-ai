import fs from "node:fs";
import path from "node:path";
import fc from "fast-check";
import { describe, expect, test } from "vitest";
import { MAX_STEP_S, nextSeconds } from "@/lib/frameStep";

describe("nextSeconds", () => {
  test("advances by the ticker delta in seconds", () => {
    expect(nextSeconds(1, 16)).toBeCloseTo(1.016, 9);
  });
  test("never advances more than 1/20 s, and never backwards", () => {
    expect(nextSeconds(0, 5000)).toBe(MAX_STEP_S);
    expect(nextSeconds(2, -10)).toBe(2);
    expect(nextSeconds(2, Number.NaN)).toBe(2);
  });
  test("property: bounded, monotonic step", () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 1e6, noNaN: true }), fc.double({ min: -1e5, max: 1e5, noNaN: true }), (prev, d) => {
        const next = nextSeconds(prev, d);
        expect(next).toBeGreaterThanOrEqual(prev);
        expect(next - prev).toBeLessThanOrEqual(MAX_STEP_S + 1e-9);
      }),
      { numRuns: 200 },
    );
  });
});

describe("installed R3F build", () => {
  const dist = path.resolve("node_modules/@react-three/fiber/dist");
  const files = fs.readdirSync(dist).filter((f) => /^events-.*\.(cjs\.dev|esm)\.js$/.test(f));

  test.each(files)("%s: update() sets clock.elapsedTime = timestamp when frameloop is never", (f) => {
    const src = fs.readFileSync(path.join(dist, f), "utf8");
    const i = src.indexOf("function update(timestamp, state, frame)");
    expect(i).toBeGreaterThan(-1);
    const body = src.slice(i, i + 800);
    expect(body).toMatch(/state\.frameloop === ['"]never['"] && typeof timestamp === ['"]number['"]/);
    expect(body).toContain("state.clock.elapsedTime = timestamp");
  });

  test("per-root advance(timestamp, runGlobalEffects) exists", () => {
    expect(files.length).toBeGreaterThan(0);
    const src = fs.readFileSync(path.join(dist, files[0]), "utf8");
    expect(src).toMatch(/advance: \(timestamp, runGlobalEffects\) => advance\(timestamp, runGlobalEffects, get\(\)\)/);
  });
});
