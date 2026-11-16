// QA for per-initiative sketches on /work and the solid kiosk hand.
// Usage: node scripts/qa-work-sketch.mjs [baseUrl]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3000";
const out = "qa-output/work-sketch";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel: "msedge" });
const VIEWS = [
  { tag: "d1440", w: 1440, h: 900, mobile: false },
  { tag: "m390", w: 390, h: 844, mobile: true },
];
const ROUTES = ["/work", "/products-research", "/work/southern-railways-ticket-vending-machine", "/capabilities/industrial-automation"];
let failures = 0;

for (const v of VIEWS) {
  for (const path of ROUTES) {
    const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, isMobile: v.mobile, hasTouch: v.mobile, deviceScaleFactor: v.mobile ? 2 : 1 });
    const page = await ctx.newPage();
    const logs = [];
    page.on("console", (m) => m.type() === "error" && !/THREE\.Clock/.test(m.text()) && logs.push(m.text().slice(0, 200)));
    page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));
    await page.goto(base + path, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".loader", { state: "detached", timeout: 40000 }).catch(() => {});
    await page.waitForTimeout(800);
    // scroll through the whole page so every sketch enters view
    // re-read the height each step: the page can grow while it settles
    for (let y = 0; y <= (await page.evaluate(() => document.documentElement.scrollHeight)); y += Math.round(v.h * 0.6)) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(250);
    }
    await page.waitForTimeout(1200);
    const m = await page.evaluate(() => {
      const sk = [...document.querySelectorAll(".sketch")];
      const init = [...document.querySelectorAll(".work-card--initiative .sketch")].map((s) =>
        [...s.classList].find((c) => c.startsWith("sketch--") && !/sketch--(tone|card|hero)/.test(c)),
      );
      const hand = document.querySelector(".ki-hand__shape");
      return {
        hscroll: document.documentElement.scrollWidth > innerWidth,
        sketches: sk.length,
        undrawn: sk.filter((s) => !s.hasAttribute("data-drawn")).map((s) => s.closest("a")?.getAttribute("href") ?? s.getAttribute("class")),
        initKinds: init,
        handFill: hand ? getComputedStyle(hand).fill : null,
      };
    });
    const dupInit = m.initKinds.length - new Set(m.initKinds).size;
    const bad = m.hscroll || logs.length || (path === "/work" && (m.undrawn.length || dupInit || m.initKinds.length < 2)) || (m.handFill && m.handFill === "none");
    if (bad) failures++;
    if (path.startsWith("/work/")) {
      const hv = page.locator(".sketch--kiosk").first();
      await hv.scrollIntoViewIfNeeded();
      await page.waitForTimeout(3900);
      await hv.screenshot({ path: `${out}/kiosk-${v.tag}-tap.png` });
    }
    console.log(v.tag, path, JSON.stringify({ ...m, dupInit }), "errors", logs);
    await ctx.close();
  }
}

await browser.close();
console.log(failures ? `FAIL ${failures}` : "PASS");
process.exitCode = failures ? 1 : 0;
