// Browser QA for the homepage: loader, hero, scroll story checkpoints and sections.
// Usage: node scripts/qa-home.mjs [baseUrl] [width] [height] [tag]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3100";
const width = Number(process.argv[3] ?? 1440);
const height = Number(process.argv[4] ?? 900);
const tag = process.argv[5] ?? `${width}`;
const out = "qa-output";
mkdirSync(out, { recursive: true });

const noWebGL = process.env.QA_NOWEBGL === "1";
const reduced = process.env.QA_REDUCED === "1";
const mobile = width < 800;
const browser = await chromium.launch({
  channel: "msedge",
  args: noWebGL ? ["--disable-webgl", "--disable-webgl2", "--disable-3d-apis"] : ["--use-angle=d3d11", "--enable-gpu"],
});
const context = await browser.newContext({
  viewport: { width, height },
  isMobile: mobile,
  hasTouch: mobile,
  reducedMotion: reduced ? "reduce" : "no-preference",
});
const page = await context.newPage();
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") errors.push(`[${m.type()}] ${m.text()}`);
});
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));

const t0 = Date.now();
await page.goto(base, { waitUntil: "domcontentloaded" });
await page.screenshot({ path: `${out}/${tag}-00-loader.png` });
await page.waitForSelector(".loader", { state: "detached", timeout: 15000 });
console.log(`loader dismissed after ${Date.now() - t0} ms`);
await page.waitForTimeout(1400);
await page.screenshot({ path: `${out}/${tag}-01-hero.png` });

const pin = await page.evaluate(() => {
  const st = document.querySelector(".story")?.getBoundingClientRect();
  return { storyHeight: st?.height ?? 0, vh: innerHeight };
});
console.log("story", pin);
const dist = pin.storyHeight - pin.vh;
for (const p of [0.14, 0.28, 0.44, 0.6, 0.64, 0.75, 0.86, 0.97]) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(dist * p));
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${out}/${tag}-story-${String(Math.round(p * 100)).padStart(3, "0")}.png` });
}
// Reverse scroll check
await page.evaluate((y) => window.scrollTo(0, y), Math.round(dist * 0.3));
await page.waitForTimeout(1600);
await page.screenshot({ path: `${out}/${tag}-story-reverse-030.png` });

const sections = [".caps", ".marquee", ".work-intro", ".proof", ".showcase", ".globe", ".products", ".process", ".about-home", ".final-cta", ".site-footer"];
for (const sel of sections) {
  const y = await page.evaluate((s) => {
    const el = document.querySelector(s);
    return el ? el.getBoundingClientRect().top + scrollY : null;
  }, sel);
  if (y === null) {
    console.log("missing section", sel);
    continue;
  }
  const extra = sel === ".proof" || sel === ".process" ? Math.round(height * 1.2) : 0;
  await page.evaluate((yy) => window.scrollTo(0, yy), y + extra);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/${tag}-sec-${sel.replace(".", "")}.png` });
}

const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
console.log("horizontal overflow px:", overflow);
console.log("console errors/warnings:", errors.length);
errors.slice(0, 30).forEach((e) => console.log("  ", e.slice(0, 300)));
await browser.close();
