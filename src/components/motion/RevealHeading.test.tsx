import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { normalise } from "@/lib/text/words";
import { RevealHeading } from "./RevealHeading";

const render = (props: Parameters<typeof RevealHeading>[0]) => renderToStaticMarkup(createElement(RevealHeading, props));
const strip = (html: string) => html.replace(/<[^>]+>/g, "").replace(/&#x27;/g, "'").replace(/&amp;/g, "&");

describe("RevealHeading server markup (case 10)", () => {
  test("nothing is hidden in the markup, the sr-only copy is normalised and the words are aria-hidden", () => {
    const text = "  Engineering   beyond\tborders. ";
    const html = render({ as: "h2", id: "t", className: "t-display", text });
    expect(html.replace(/\s/g, "")).not.toMatch(/opacity:0|visibility:hidden|filter:blur/);
    expect(html).toMatch(/^<h2 id="t" class="t-display" data-reveal="view"/);
    const sr = html.match(/<span class="sr-only">([^<]*)<\/span>/);
    expect(sr?.[1]).toBe(normalise(text));
    const hidden = html.match(/<span aria-hidden="true">([\s\S]*)<\/span><\/h2>$/);
    expect(hidden).not.toBeNull();
    const words = [...html.matchAll(/<span class="rw__in" style="--i:(\d+)">([^<]*)<\/span>/g)];
    expect(words.map((w) => w[2])).toEqual(["Engineering", "beyond", "borders."]);
    expect(words.map((w) => Number(w[1]))).toEqual([0, 1, 2]);
    // Every word span sits inside the aria-hidden wrapper; the visible text equals the normalised text.
    expect(hidden![1]).toContain('class="rw__in"');
    expect(strip(hidden![1])).toBe(normalise(text));
    expect(html).toMatch(/--rt-step:0\.055s/);
  });

  test("forced lines, the intro trigger and the heading level", () => {
    const html = render({ as: "h1", text: ["Think beyond.", "Engineer what's next."], trigger: "intro" });
    expect(html.startsWith("<h1")).toBe(true);
    expect(html).toContain('data-reveal="intro"');
    expect((html.match(/class="rw-line"/g) ?? []).length).toBe(2);
    expect(html).toContain(`<span class="sr-only">Think beyond. Engineer what&#x27;s next.</span>`);
  });
});
