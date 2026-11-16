import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

const SRC = path.resolve("src");
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), "utf8");
const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : [p];
  });
const sources = () => walk(SRC).filter((f) => /\.(tsx?|css)$/.test(f) && !/\.test\.tsx?$/.test(f));

describe("bug patterns", () => {
  // Turned into a plain test by 8.3.
  test("no numeric scrub on any ScrollTrigger", () => {
    const hits = sources()
      .filter((f) => /\.tsx?$/.test(f))
      .filter((f) => /scrub\s*:\s*\d/.test(fs.readFileSync(f, "utf8")))
      .map((f) => path.relative(SRC, f));
    expect(hits).toEqual([]);
  });

  // Turned into a plain test by 8.5: damp() only for pointer parallax.
  test("no damp( on keyframe values in StoryScene.tsx", () => {
    const lines = read("components/three/StoryScene.tsx")
      .split(/\r?\n/)
      .filter((l) => /damp\(/.test(l) && !/^\s*import\b/.test(l))
      .filter((l) => !/\bps\.[xy]\s*=/.test(l)); // pointer parallax lines
    expect(lines).toEqual([]);
  });

  // Turned into a plain test by 7.6.
  test("no stopPropagation in PageTransition.tsx", () => {
    expect(read("components/layout/PageTransition.tsx")).not.toMatch(/stopPropagation/);
  });

  // Turned into a plain test by 16.4.
  test("no pointer activation in CapabilitiesSection.tsx or ProjectShowcaseSection.tsx", () => {
    const src = read("components/sections/CapabilitiesSection.tsx") + read("components/sections/ProjectShowcaseSection.tsx");
    expect(src).not.toMatch(/onPointer(Move|Enter)/);
  });
});

describe("route transition", () => {
  test("the template fade is gone and nothing mentions page-transition", () => {
    expect(fs.existsSync(path.join(SRC, "app/template.tsx"))).toBe(false);
    const hits = sources().filter((f) => fs.readFileSync(f, "utf8").includes("page-transition"));
    expect(hits).toEqual([]);
  });

  test("SmoothScroll does not scroll on route changes and leaves anchors to ScrollRouter", () => {
    const s = read("components/layout/SmoothScroll.tsx");
    expect(s).not.toMatch(/usePathname/);
    expect(s).not.toMatch(/scrollTo\(/);
    expect(s).toMatch(/anchors:\s*false/);
  });
});
