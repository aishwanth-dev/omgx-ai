import fs from "node:fs";
import path from "node:path";
import fc from "fast-check";
import { describe, expect, test } from "vitest";

const css = fs.readFileSync(path.resolve("src/app/home.css"), "utf8");

/** Every declaration block whose selector list mentions .proof__field. */
const FIELD_BLOCKS = css
  .split("}")
  .map((chunk) => chunk.split("{"))
  .filter((parts) => parts.length >= 2 && parts[parts.length - 2].includes(".proof__field"))
  .map((parts) => parts[parts.length - 1]);
const fieldBlocks = () => FIELD_BLOCKS;

/** The base rule's inset at a given --rise, as [top, right, bottom, left] fractions (negative = outside). */
function fieldInsets(rise: number): [number, number, number, number] {
  const decl = fieldBlocks()
    .map((b) => b.match(/(?:^|;|\s)inset\s*:\s*([^;]+);/))
    .find(Boolean);
  if (!decl) throw new Error("no inset on .proof__field");
  const parts = decl[1].replace(/var\(--rise\)/g, String(rise)).trim().split(/\s+/).map((p) => {
    const m = p.match(/^(-?\d+(?:\.\d+)?)%$/);
    if (!m) throw new Error(`inset part is not a constant percentage: ${p}`);
    return Number(m[1]) / 100;
  });
  const [t, r = t, b = t, l = r] = parts;
  return [t, r, b, l];
}

/** The field box in stage pixels at a given --rise. */
function fieldBox(w: number, h: number, rise: number) {
  const [t, r, b, l] = fieldInsets(rise);
  return { left: l * w, top: t * h, right: w - r * w, bottom: h - b * h };
}

/** **Validates: Requirements 2.10** (Property 8) */
describe("Property 8: light fields have no visible edges", () => {
  test("the field box contains the stage with margin and does not depend on --rise", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 3840 }),
        fc.integer({ min: 480, max: 2160 }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        (w, h, rise) => {
          const box = fieldBox(w, h, rise);
          const mx = 0.1 * w;
          const my = 0.1 * h;
          expect(box.left).toBeLessThanOrEqual(-mx);
          expect(box.top).toBeLessThanOrEqual(-my);
          expect(box.right).toBeGreaterThanOrEqual(w + mx);
          expect(box.bottom).toBeGreaterThanOrEqual(h + my);
          expect(fieldBox(w, h, 0)).toEqual(fieldBox(w, h, 1));
        },
      ),
    );
  });

  test("no rule scales, moves or resizes the field box", () => {
    for (const block of fieldBlocks()) {
      expect(block).not.toMatch(/\b(transform|scale|translate|width|height)\s*:/);
      expect(block).not.toMatch(/inset\s*:[^;]*var\(/);
    }
  });

  test("GSAP tweens only --rise on the field", () => {
    const src = fs.readFileSync(path.resolve("src/components/sections/ProofCardsSection.tsx"), "utf8");
    const tweens = [...src.matchAll(/\(\s*"\.proof__field"[^)]*\)/g)].map((m) => m[0]);
    expect(tweens.length).toBeGreaterThan(0);
    for (const t of tweens) expect(t.replace(/"--rise"/g, "")).not.toMatch(/\b(scale|opacity|x|y|width|height)\s*:/);
  });
});
