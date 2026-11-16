import fc from "fast-check";
import { describe, expect, test } from "vitest";
import { normalise, revealStep, revealTotal, splitLines, splitWords } from "./words";

describe("words", () => {
  test("empty and whitespace-only input", () => {
    expect(splitWords("")).toEqual([]);
    expect(splitWords(" \t\n ")).toEqual([]);
    expect(revealTotal(0)).toBe(0);
  });
  test("single word", () => {
    expect(splitWords("  Think ")).toEqual(["Think"]);
    expect(revealStep(1)).toBe(0);
    expect(revealTotal(1)).toBeCloseTo(0.6, 9);
  });
  test("multiple spaces and mixed whitespace", () => {
    expect(splitWords("Think   beyond.\n\tEngineer\u00a0what's  next.")).toEqual(["Think", "beyond.", "Engineer", "what's", "next."]);
  });
  test("line arrays", () => {
    expect(splitLines(["Think beyond.", "  ", "Engineer what's next."])).toEqual([
      ["Think", "beyond."],
      ["Engineer", "what's", "next."],
    ]);
    expect(splitLines("One line")).toEqual([["One", "line"]]);
  });
  test("step and total-duration bounds", () => {
    expect(revealStep(5)).toBe(0.055);
    expect(revealStep(100)).toBeCloseTo(1 / 99, 9);
    expect(revealTotal(100)).toBeLessThanOrEqual(1.6 + 1e-9);
  });
});

/** **Validates: Requirements 2.18** (Property 12) */
describe("Property 12: heading split and reveal timing", () => {
  const ws = fc.constantFrom(" ", "  ", "\t", "\n", "\u00a0", "\u2003", "\r\n");
  const word = fc.string({ unit: "grapheme", minLength: 1, maxLength: 8 }).map((s) => s.replace(/\s/g, "") || "x");
  const text = fc.array(fc.tuple(ws, word), { maxLength: 40 }).chain((parts) =>
    ws.map((tail) => parts.map(([w, x]) => w + x).join("") + tail),
  );

  test("words joined with single spaces equal normalise(s); total ≤ 1.6 s", () => {
    fc.assert(
      fc.property(fc.oneof(text, fc.string({ unit: "binary" })), (s) => {
        const words = splitWords(s);
        expect(words.join(" ")).toBe(normalise(s));
        expect(revealTotal(words.length)).toBeLessThanOrEqual(1.6 + 1e-9);
      }),
      { numRuns: 200 },
    );
  });
});
