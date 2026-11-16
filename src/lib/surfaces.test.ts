import fs from "node:fs";
import path from "node:path";
import fc from "fast-check";
import { describe, expect, test } from "vitest";
import { blendBetween, blendsFor, headerToneAt, SURFACE_HEX, surfaceAttrs, type Surface } from "./surfaces";

const SURFACES = Object.keys(SURFACE_HEX) as Surface[];

describe("surfaces", () => {
  test("token values", () => {
    expect(SURFACE_HEX.ink).toBe("#05070f");
    expect(SURFACE_HEX.mist).toBe("#f3f5fa");
    expect(SURFACE_HEX.matcha).toBe("#17389f");
    expect(SURFACE_HEX.showcase).toBe("#0b1020");
    expect(SURFACE_HEX.footer).toBe(SURFACE_HEX.ink);
  });
  test("surfaceAttrs returns data-theme, data-surface and data-edge", () => {
    expect(surfaceAttrs("ink", "mist")).toEqual({ "data-theme": "dark", "data-surface": "ink", "data-edge": "mist" });
    expect(surfaceAttrs("mist")).toEqual({ "data-theme": "light", "data-surface": "mist", "data-edge": "mist" });
    expect(surfaceAttrs("showcase")["data-theme"]).toBe("dark");
  });
  test("headerToneAt switches at half the blend height", () => {
    expect(headerToneAt(0, 120, "light", "dark")).toBe("light");
    expect(headerToneAt(59.9, 120, "light", "dark")).toBe("light");
    expect(headerToneAt(60, 120, "light", "dark")).toBe("dark");
    expect(headerToneAt(-5, 120, "light", "dark")).toBe("dark");
    expect(headerToneAt(10, 0, "light", "dark")).toBe("dark");
  });
});

/** **Validates: Requirements 2.15, 3.9** (Property 13) */
describe("Property 13: section blends use real colours", () => {
  test("blend endpoints are (previous edge, next surface), none when equal", () => {
    const tok = fc.constantFrom(...SURFACES);
    fc.assert(
      fc.property(fc.array(fc.record({ surface: tok, edge: tok }), { minLength: 1, maxLength: 12 }), (secs) => {
        const blends = blendsFor(secs);
        expect(blends[0]).toBeNull();
        for (let i = 1; i < secs.length; i++) {
          const from = SURFACE_HEX[secs[i - 1].edge];
          const to = SURFACE_HEX[secs[i].surface];
          expect(blends[i]).toEqual(from === to ? null : { from, to });
        }
      }),
      { numRuns: 200 },
    );
  });

  test("globals.css tokens, backgrounds, edge rules and footer rules match surfaces.ts", () => {
    const css = fs.readFileSync(path.resolve("src/app/globals.css"), "utf8");
    const count = (re: RegExp) => (css.match(new RegExp(re.source, "g")) ?? []).length;
    expect(css).not.toMatch(/has-blend|--bg-prev/);
    for (const t of SURFACES) {
      const tok = css.match(new RegExp(`--s-${t}:\\s*(#[0-9a-fA-F]{6})\\s*;`));
      expect(tok?.[1].toLowerCase(), `--s-${t}`).toBe(SURFACE_HEX[t]);
      expect(count(new RegExp(`\\[data-surface="${t}"\\]\\s*\\{\\s*--surface-hex:\\s*var\\(--s-${t}\\)`)), `background ${t}`).toBe(1);
      expect(count(new RegExp(`\\[data-edge="${t}"\\]\\s*\\+\\s*\\[data-surface\\][^{]*\\{[^}]*--blend-from:\\s*var\\(--s-${t}\\)`)), `edge ${t}`).toBe(1);
      const footerRules = count(
        new RegExp(`main:has\\([^{]*data-edge="${t}"[^{]*\\)\\s*\\+\\s*\\.hwf-root\\s*\\{[^}]*--blend-from:\\s*var\\(--s-${t}\\)`),
      );
      // One footer rule per edge colour; none where the colour already matches the footer.
      expect(footerRules, `footer ${t}`).toBe(SURFACE_HEX[t] === SURFACE_HEX.footer ? 0 : 1);
    }
  });

  test("case 9: the showcase blends from and to its real colour", () => {
    expect(blendBetween("matcha", "showcase")).toEqual({ from: "#17389f", to: "#0b1020" });
    expect(blendBetween("showcase", "ink")).toEqual({ from: "#0b1020", to: "#05070f" });
    expect(blendBetween("ink", "footer")).toBeNull();
  });
});
