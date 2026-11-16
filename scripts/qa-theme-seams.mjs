// Seam QA: the largest row-to-row luminance step in a narrow gutter column around each section boundary,
// plus the Next dev issue count and the mobile menu screenshot. Usage: node scripts/qa-theme-seams.mjs [baseUrl]
import { chromium } from "playwright";
import sharp from "sharp";
const base = process.argv[2] ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "msedge", args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 240)); });
await page.goto(base + "/", { waitUntil: "load" });
await page.waitForFunction(() => !document.querySelector(".omx-loader__badge"), null, { timeout: 90000 }).catch(() => {});
await page.waitForTimeout(2500);
const bounds = await page.evaluate(() => {
  const els = [...document.querySelectorAll("main [data-surface], footer[data-surface]")];
  return els.slice(1).map((el, i) => ({ name: (el.className || el.tagName).toString().split(" ")[0], prev: els[i].className.toString().split(" ")[0], y: el.getBoundingClientRect().top + scrollY }));
});
const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
for (const b of bounds) {
  await page.evaluate((y) => window.scrollTo(0, y - 450), b.y);
  await page.waitForTimeout(1300);
  const buf = await page.screenshot({ clip: { x: 2, y: 0, width: 6, height: 900 } });
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  let max = 0, at = 0;
  let prev = null;
  for (let y = 0; y < info.height; y++) {
    const o = (y * info.width + 2) * info.channels;
    const l = lum(data[o], data[o + 1], data[o + 2]);
    if (prev !== null && Math.abs(l - prev) > max) { max = Math.abs(l - prev); at = y; }
    prev = l;
  }
  console.log(`${b.prev} -> ${b.name}: max step ${max.toFixed(1)}/255 at y=${at}`);
}
console.log("console errors:", errs);
await ctx.close();
const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const mp = await m.newPage();
await mp.goto(base + "/about", { waitUntil: "load" });
await mp.waitForTimeout(2000);
await mp.getByRole("button", { name: /menu/i }).first().click().catch((e) => console.log("menu click failed", String(e).slice(0, 80)));
await mp.waitForTimeout(1200);
await mp.screenshot({ path: "qa-output/theme-m-menu-open.png" });
await browser.close();
