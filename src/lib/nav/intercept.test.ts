import fc from "fast-check";
import { describe, expect, test, vi } from "vitest";
import { createInterceptHandler, shouldIntercept, type ClickInfo, type InterceptEvent } from "./intercept";

const here = new URL("https://omgx.ai/work");
const click = (o: Partial<ClickInfo> = {}): ClickInfo => ({
  button: 0,
  meta: false,
  ctrl: false,
  shift: false,
  alt: false,
  defaultPrevented: false,
  ...o,
});
const link = (href: string, target: string | null = null, download = false) => ({ href, target, download });

describe("shouldIntercept", () => {
  test("a plain internal link is intercepted", () => {
    expect(shouldIntercept(click(), link("/about"), here)?.pathname).toBe("/about");
  });
  test.each(["meta", "ctrl", "shift", "alt"] as const)("%s key is left alone", (k) => {
    expect(shouldIntercept(click({ [k]: true }), link("/about"), here)).toBeNull();
  });
  test("middle click is left alone", () => {
    expect(shouldIntercept(click({ button: 1 }), link("/about"), here)).toBeNull();
  });
  test("_blank and download are left alone; _self is intercepted", () => {
    expect(shouldIntercept(click(), link("/about", "_blank"), here)).toBeNull();
    expect(shouldIntercept(click(), link("/file.pdf", null, true), here)).toBeNull();
    expect(shouldIntercept(click(), link("/about", "_self"), here)).not.toBeNull();
  });
  test("mailto, tel and cross-origin are left alone", () => {
    expect(shouldIntercept(click(), link("mailto:support@omgxai.com"), here)).toBeNull();
    expect(shouldIntercept(click(), link("tel:+91000"), here)).toBeNull();
    expect(shouldIntercept(click(), link("https://example.com/about"), here)).toBeNull();
  });
  test("/api/ links are left alone", () => {
    expect(shouldIntercept(click(), link("/api/contact"), here)).toBeNull();
  });
  test("hash-only links are left alone", () => {
    expect(shouldIntercept(click(), link("#top"), here)).toBeNull();
    expect(shouldIntercept(click(), link("/work#list"), here)).toBeNull();
  });
  test("a search-only change is intercepted (case 8)", () => {
    expect(shouldIntercept(click(), link("/work?filter=ai"), here)?.search).toBe("?filter=ai");
  });
  test("an already prevented click is left alone", () => {
    expect(shouldIntercept(click({ defaultPrevented: true }), link("/about"), here)).toBeNull();
  });
});

/** **Validates: Requirements 2.19** (Property 11) */
describe("Property 11: link interception", () => {
  test("non-null exactly when the conjunction holds", () => {
    const paths = fc.constantFrom("/", "/work", "/about", "/api/contact", "/work/bosch");
    const searches = fc.constantFrom("", "?filter=ai", "?filter=xr");
    const hashes = fc.constantFrom("", "#a", "#bona-ai");
    const origins = fc.constantFrom("https://omgx.ai", "https://example.com");
    fc.assert(
      fc.property(
        fc.record({
          button: fc.integer({ min: 0, max: 2 }),
          meta: fc.boolean(),
          ctrl: fc.boolean(),
          shift: fc.boolean(),
          alt: fc.boolean(),
          defaultPrevented: fc.boolean(),
        }),
        origins,
        paths,
        searches,
        hashes,
        fc.constantFrom(null, "_self", "_blank"),
        fc.boolean(),
        paths,
        searches,
        (c, origin, p, s, h, target, download, hp, hs) => {
          const loc = new URL(`https://omgx.ai${hp}${hs}`);
          const r = shouldIntercept(c, link(`${origin}${p}${s}${h}`, target, download), loc);
          const ok =
            !c.defaultPrevented &&
            c.button === 0 &&
            !(c.meta || c.ctrl || c.shift || c.alt) &&
            target !== "_blank" &&
            !download &&
            origin === loc.origin &&
            !p.startsWith("/api/") &&
            !(p === loc.pathname && s === loc.search);
          expect(r !== null).toBe(ok);
        },
      ),
      { numRuns: 200 },
    );
  });

  test("case 8: the handler calls preventDefault() and never stopPropagation()", () => {
    const anchor = {
      getAttribute: (n: string) => (n === "href" ? "/work?filter=ai" : null),
      hasAttribute: () => false,
      closest: () => anchor,
    };
    const onIntercept = vi.fn();
    const handler = createInterceptHandler({ here: () => here, onIntercept });
    const ev = {
      button: 0,
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      defaultPrevented: false,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      target: anchor as unknown as EventTarget,
    } satisfies InterceptEvent;
    handler(ev);
    expect(ev.preventDefault).toHaveBeenCalledTimes(1);
    expect(ev.stopPropagation).not.toHaveBeenCalled();
    expect(onIntercept).toHaveBeenCalledTimes(1);
    expect((onIntercept.mock.calls[0][0] as URL).search).toBe("?filter=ai");
  });

  test("the handler ignores clicks outside links", () => {
    const onIntercept = vi.fn();
    const handler = createInterceptHandler({ here: () => here, onIntercept });
    const ev = {
      button: 0,
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      defaultPrevented: false,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      target: { closest: () => null } as unknown as EventTarget,
    } satisfies InterceptEvent;
    handler(ev);
    expect(ev.preventDefault).not.toHaveBeenCalled();
    expect(onIntercept).not.toHaveBeenCalled();
  });
});
