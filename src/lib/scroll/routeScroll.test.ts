import fc from "fast-check";
import { describe, expect, test } from "vitest";
import { decideRouteScroll, type NavType } from "./routeScroll";

const NAVS: NavType[] = ["initial", "push", "pop", "in-page"];

/** Expected truth table (design C). */
function expected(nav: NavType, hasHash: boolean, exists: boolean) {
  if (nav === "pop") return "keep";
  if (hasHash && exists) return "hash";
  if (nav === "push") return "top";
  return "keep";
}

describe("decideRouteScroll truth table", () => {
  for (const nav of NAVS) {
    for (const hasHash of [false, true]) {
      for (const exists of [false, true]) {
        test(`${nav}, hash=${hasHash}, target=${exists}`, () => {
          const d = decideRouteScroll(nav, hasHash ? "#bona-ai" : "", exists);
          expect(d.kind).toBe(expected(nav, hasHash, exists));
          if (d.kind === "hash") expect(d.id).toBe("bona-ai");
        });
      }
    }
  }

  test("decodes a non-ASCII hash", () => {
    expect(decideRouteScroll("push", "#%E0%A4%AD%E0%A4%BE%E0%A4%B0%E0%A4%A4", true)).toEqual({ kind: "hash", id: "भारत" });
  });

  test("a malformed escape does not throw", () => {
    expect(decideRouteScroll("push", "#%E0%A4", true)).toEqual({ kind: "hash", id: "%E0%A4" });
  });
});

/** **Validates: Requirements 2.22, 3.16** (Property 10, bound case 7) */
describe("Property 10: route, hash and anchor landing", () => {
  test("decision matches the table and pop always keeps", () => {
    fc.assert(
      fc.property(fc.constantFrom(...NAVS), fc.option(fc.stringMatching(/^[a-z][a-z0-9-]{0,20}$/), { nil: undefined }), fc.boolean(), (nav, id, exists) => {
        const d = decideRouteScroll(nav, id ? `#${id}` : "", exists);
        expect(d.kind).toBe(expected(nav, !!id, exists));
        if (nav === "pop") expect(d.kind).toBe("keep");
      }),
      { numRuns: 200 },
    );
  });

  test("case 7: a push with a present hash lands on the hash, and pop keeps the restored position", () => {
    expect(decideRouteScroll("push", "#bona-ai", true)).toEqual({ kind: "hash", id: "bona-ai" });
    expect(decideRouteScroll("pop", "", false)).toEqual({ kind: "keep" });
    expect(decideRouteScroll("pop", "#bona-ai", true)).toEqual({ kind: "keep" });
  });
});
