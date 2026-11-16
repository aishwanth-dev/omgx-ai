// Theme QA: screenshots of the blue/red/white palette at 1440x900 and 390x844 into qa-output/theme-*.png.
// Usage: node scripts/qa-theme.mjs [baseUrl] [desktop|mobile]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const base = process.argv[2] ?? "http://localhost:3000";
const only = process.argv[3];
mkdirSync("qa-output", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const modes = [
  ["d", { viewport: { width: 1440, height: 900 } }],
  ["m", { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }],
].filter(([k]) => !only || only[0] === k);
const SECTIONS = [
  ["story", ".story", [0, 0.2, 0.45, 0.7, 0.9]],
  ["caps", "#capabilities", [0.1, 0.5]],
  ["work", ".work-intro", [0.3]],
  ["proof", ".proof", [0.15, 0.5, 0.85]],
  ["showcase", ".showcase", [0.3]],
  ["globe", ".globe", [0.4]],
  ["products", ".products", [0.3]],
  ["process", ".process", [0.2, 0.7]],
  ["about", ".about-home", [0.3]],
  ["cta", ".final-cta", [0.4]],
];
for (const [k, opts] of modes) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  await page.goto(base + "/", { waitUntil: "commit" });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `qa-output/theme-${k}-loader.png` });
  await page.waitForFunction(() => !document.querySelector(".omx-loader__badge"), null, { timeout: 90000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const H = await page.evaluate(() => innerHeight);
  for (const [name, sel, fr] of SECTIONS) {
    const box = await page.evaluate((s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top + scrollY, h: r.height };
    }, sel);
    if (!box) { console.log("missing", sel); continue; }
    let i = 0;
    for (const f of fr) {
      const y = Math.max(0, box.top + Math.max(0, box.h - H) * f - (box.h <= H ? (H - box.h) / 2 : 0));
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(1200);
      await page.screenshot({ path: `qa-output/theme-${k}-${name}-${i++}.png` });
    }
  }
  // footer
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `qa-output/theme-${k}-footer.png` });
  // header + menu
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
  const toggle = page.locator("button[aria-controls], .site-header__menu, .site-header__toggle").first();
  if (await toggle.count()) {
    await toggle.click().catch(() => {});
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `qa-output/theme-${k}-menu.png` });
  }
  for (const [name, path] of [["about", "/about"], ["capabilities", "/capabilities"], ["contact", "/contact"]]) {
    await page.goto(base + path, { waitUntil: "load" });
    await page.waitForTimeout(2200);
    await page.screenshot({ path: `qa-output/theme-${k}-page-${name}.png`, fullPage: false });
  }
  console.log(k, "errors:", errs.slice(0, 3));
  await ctx.close();
}
await browser.close();
