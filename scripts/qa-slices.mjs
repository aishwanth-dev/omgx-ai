// Visual helper: full-height slices of routes at one viewport -> qa-output/slices/
// Usage: node scripts/qa-slices.mjs 390 /work,/contact [sliceHeight]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const w = Number(process.argv[2] ?? 390);
const routes = (process.argv[3] ?? "/work").split(",");
const sliceH = Number(process.argv[4] ?? 1500);
const base = "http://localhost:3000";
mkdirSync("qa-output/slices", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", args: ["--use-gl=angle", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const mobile = w <= 1024;
const ctx = await browser.newContext({ viewport: { width: w, height: 844 }, hasTouch: mobile, isMobile: mobile });
for (const route of routes) {
  const page = await ctx.newPage();
  await page.goto(base + route, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += 600) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(120); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  const full = await page.evaluate(() => document.documentElement.scrollHeight);
  const name = route === "/" ? "home" : route.slice(1).replace(/\//g, "_");
  for (let i = 0, y = 0; y < full; i++, y += sliceH) {
    await page.screenshot({ path: `qa-output/slices/${name}-${w}-${i}.png`, fullPage: true, clip: { x: 0, y, width: w, height: Math.min(sliceH, full - y) } });
  }
  console.log(route, full);
  await page.close();
}
await browser.close();
