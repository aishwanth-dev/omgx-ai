import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import fc from "fast-check";
import { describe, expect, test } from "vitest";
import { markerAngle, markerWeight, STAGES } from "./journeyOrbit";

const THREE_DIR = path.resolve("src/components/three");
const read = (f: string) => fs.readFileSync(path.join(THREE_DIR, f), "utf8");
const wrap = (a: number) => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

describe("journey ring markers", () => {
  test("the current stage's marker sits at the top (local -Z) and is fully highlighted", () => {
    for (let i = 0; i < STAGES; i++) {
      expect(markerAngle(i, i)).toBeCloseTo(-Math.PI / 2, 12);
      expect(markerWeight(i, i)).toBe(1);
    }
    expect(markerWeight(0, 1)).toBe(0);
  });

  // **Validates: Requirements 2.13**
  test("property: markers stay evenly spaced and follow the cursor continuously", () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: STAGES - 1, noNaN: true }), fc.integer({ min: 0, max: STAGES - 2 }), (c, i) => {
        const gap = wrap(markerAngle(i + 1, c) - markerAngle(i, c));
        expect(gap).toBeCloseTo((2 * Math.PI) / STAGES, 9);
        // Small cursor steps move markers by small angles (no jumps).
        expect(Math.abs(markerAngle(i, c + 1e-3) - markerAngle(i, c))).toBeLessThan(1e-2);
        const w = markerWeight(i, c);
        expect(w).toBeGreaterThanOrEqual(0);
        expect(w).toBeLessThanOrEqual(1);
      }),
      { numRuns: 200 },
    );
  });
});

describe("GLB loading stays local (3.26)", () => {
  const sources = fs.readdirSync(THREE_DIR).filter((f) => /\.tsx?$/.test(f) && !/\.test\.ts$/.test(f));

  test("every useGLTF call and preload passes the local decoder path", () => {
    const calls = sources.flatMap((f) => [...read(f).matchAll(/useGLTF(?:\.preload)?\(([^)]*)\)/g)].map((m) => m[1]));
    expect(calls.length).toBeGreaterThanOrEqual(2);
    for (const args of calls) expect(args).toContain('"/draco/gltf/"');
  });

  test("no CDN, HDRI or drei Environment in the 3D layer", () => {
    for (const f of sources) {
      const src = read(f);
      expect(src, f).not.toMatch(/gstatic|https?:\/\/|\.hdr\b|<Environment\b|\bEnvironment\b.*from "@react-three\/drei"/);
    }
  });

  test("the procedural core is retired", () => {
    expect(fs.existsSync(path.join(THREE_DIR, "NeuralCore.tsx"))).toBe(false);
    expect(fs.existsSync(path.join(THREE_DIR, "neuralGeometry.ts"))).toBe(false);
    expect(read("shaders.ts")).not.toMatch(/createCoreMaterial/);
  });

  test("scripts/check-glb.mjs passes on the committed models and decoder", () => {
    expect(() => execFileSync(process.execPath, ["scripts/check-glb.mjs"], { stdio: "pipe" })).not.toThrow();
  });
});
