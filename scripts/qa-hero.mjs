// Hero QA: start state plus four scroll points, written to qa-output/hero-<tag>-*.png.
// Usage: node scripts/qa-hero.mjs [baseUrl] [width] [height]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3000";
const width = Number(process.argv[3] ?? 1440);
const height = Number(process.argv[4] ?? 900);
const points = (process.argv[5] ?? "0.2,0.34,0.54,0.7").split(",").map(Number);
const out = "qa-output";
mkdirSync(out, { recursive: true });
const mobile = width < 800;
const browser = await chromium.launch({ channel: "msedge", args: ["--use-angle=d3d11", "--enable-gpu"] });
const context = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile });
const page = await context.newPage();
const errors = [];
page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && errors.push(`[${m.type()}] ${m.text()}`));
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
await page.goto(base, { waitUntil: "domcontentloaded" });
await page.waitForSelector(".loader", { state: "detached", timeout: 20000 }).catch(() => {});
await page.waitForTimeout(3500);
await page.screenshot({ path: `${out}/hero-${width}-start.png` });
const info = await page.evaluate(() => {
  const r = (s) => document.querySelector(s)?.getBoundingClientRect();
  const pick = (s) => {
    const b = r(s);
    return b ? [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)] : null;
  };
  const st = document.querySelector(".story")?.getBoundingClientRect();
  return {
    top: pick(".story__top"),
    h1: pick(".story__title"),
    foot: pick(".story__foot"),
    left: pick(".story__foot-left"),
    right: pick(".story__foot-right"),
    storyH: st?.height,
    vh: innerHeight,
    cy: getComputedStyle(document.querySelector(".story__stage")).getPropertyValue("--hero-cy"),
    hh: getComputedStyle(document.querySelector(".story__stage")).getPropertyValue("--hero-h"),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
});
console.log(JSON.stringify(info));
const dist = info.storyH - info.vh;
for (const p of points) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(dist * p));
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${out}/hero-${width}-p${String(Math.round(p * 100)).padStart(2, "0")}.png` });
}
console.log("errors:", errors.length);
errors.slice(0, 15).forEach((e) => console.log("  ", e.slice(0, 250)));
await browser.close();
