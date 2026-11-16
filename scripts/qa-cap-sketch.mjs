// QA for the route-curtain label and the capability line sketches.
// Usage: node scripts/qa-cap-sketch.mjs [curtain|sketch|all] [baseUrl]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const what = process.argv[2] ?? "all";
const base = process.argv[3] ?? "http://localhost:3000";
const out = "qa-output/cap-sketch";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel: "msedge" });
const VIEWS = [
  { tag: "d1440", w: 1440, h: 900, mobile: false },
  { tag: "m390", w: 390, h: 844, mobile: true },
];
const SLUGS = ["artificial-intelligence", "industrial-automation", "immersive-technologies", "hardware-engineering"];
let failures = 0;

async function open(v, path) {
  const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, isMobile: v.mobile, hasTouch: v.mobile, deviceScaleFactor: v.mobile ? 2 : 1 });
  const page = await ctx.newPage();
  const logs = [];
  page.on("console", (m) => m.type() === "error" && !/THREE\.Clock/.test(m.text()) && logs.push(m.text().slice(0, 200)));
  page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));
  await page.goto(base + path, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".loader", { state: "detached", timeout: 40000 }).catch(() => {});
  await page.waitForTimeout(800);
  return { ctx, page, logs };
}

/** Waits until the curtain label is fully shown, then measures clipping. */
async function measureCurtain(page, shot) {
  const ok = await page
    .waitForFunction(
      () => {
        const l = document.querySelector(".curtain__label");
        const c = document.querySelector(".curtain");
        if (!l || !c || getComputedStyle(c).visibility !== "visible") return false;
        const inner = l.parentElement;
        return parseFloat(getComputedStyle(inner.lastElementChild).opacity) > 0.97 && !/100%/.test(getComputedStyle(c).clipPath);
      },
      null,
      { timeout: 4000, polling: 16 },
    )
    .then(() => true)
    .catch(() => false);
  await page.screenshot({ path: shot });
  const m = await page.evaluate(() => {
    const l = document.querySelector(".curtain__label");
    const r = l.getBoundingClientRect();
    const clippedBy = [];
    for (let a = l.parentElement; a; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.overflow !== "visible" || cs.overflowX !== "visible" || cs.overflowY !== "visible") {
        const ar = a.getBoundingClientRect();
        if (r.top < ar.top - 0.5 || r.bottom > ar.bottom + 0.5 || r.left < ar.left - 0.5 || r.right > ar.right + 0.5) clippedBy.push(a.className || a.tagName);
      }
    }
    const offscreen = r.left < 0 || r.right > innerWidth || r.top < 0 || r.bottom > innerHeight;
    return { text: l.textContent, scrollH: l.scrollHeight, clientH: l.clientHeight, scrollW: l.scrollWidth, clientW: l.clientWidth, rect: [r.left, r.top, r.width, r.height].map(Math.round), clippedBy, offscreen };
  });
  const pass = ok && m.scrollH <= m.clientH && m.scrollW <= m.clientW && !m.clippedBy.length && !m.offscreen;
  if (!pass) failures++;
  return { shown: ok, pass, ...m };
}

if (what === "curtain" || what === "all") {
  // desktop: header Capabilities mega menu -> Industrial Automation & Robotics
  {
    const { ctx, page, logs } = await open(VIEWS[0], "/");
    await page.click('button[aria-controls="mega-capabilities"]');
    await page.waitForSelector('.mega a[href="/capabilities/industrial-automation"]', { state: "visible" });
    await page.waitForTimeout(500);
    await page.click('.mega a[href="/capabilities/industrial-automation"]');
    const r = await measureCurtain(page, `${out}/curtain-d1440.png`);
    console.log("curtain d1440", JSON.stringify(r));
    await page.waitForURL("**/capabilities/industrial-automation", { timeout: 10000 }).catch(() => {});
    console.log("curtain d1440 logs", logs);
    await ctx.close();
  }
  // phone: mobile menu -> Capabilities -> Industrial Automation & Robotics card
  {
    const { ctx, page, logs } = await open(VIEWS[1], "/");
    await page.tap(".menu-toggle");
    await page.waitForSelector('.mobile-menu__link[href="/capabilities"]', { state: "visible" });
    await page.waitForTimeout(700);
    await page.tap('.mobile-menu__link[href="/capabilities"]');
    const r1 = await measureCurtain(page, `${out}/curtain-m390-menu.png`);
    console.log("curtain m390 menu", JSON.stringify(r1));
    await page.waitForURL("**/capabilities", { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1500);
    const card = page.locator('a.cap-card[href="/capabilities/industrial-automation"]');
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await card.tap();
    const r2 = await measureCurtain(page, `${out}/curtain-m390-card.png`);
    console.log("curtain m390 card", JSON.stringify(r2));
    console.log("curtain m390 logs", logs);
    await ctx.close();
  }
}

if (what === "sketch" || what === "all") {
  for (const v of VIEWS) {
    for (const slug of SLUGS) {
      const { ctx, page, logs } = await open(v, `/capabilities/${slug}`);
      const vis = page.locator(".cap-hero__visual");
      await vis.scrollIntoViewIfNeeded();
      await page.waitForTimeout(2800);
      await vis.screenshot({ path: `${out}/${slug}-${v.tag}-drawn.png` });
      await page.waitForTimeout(2000);
      await vis.screenshot({ path: `${out}/${slug}-${v.tag}-loop.png` });
      const m = await page.evaluate(() => {
        const box = document.querySelector(".cap-hero__visual").getBoundingClientRect();
        const svg = document.querySelector(".cap-hero__visual svg").getBoundingClientRect();
        return {
          hscroll: document.documentElement.scrollWidth > innerWidth,
          visual: [box.width, box.height].map(Math.round),
          svgInside: svg.left >= box.left - 0.5 && svg.right <= box.right + 0.5 && svg.top >= box.top - 0.5 && svg.bottom <= box.bottom + 0.5,
          drawn: document.querySelector(".cap-hero__visual svg").hasAttribute("data-drawn"),
          run: document.querySelector(".cap-hero__visual svg").getAttribute("data-run"),
          theme: document.querySelector(".cap-hero").dataset.theme,
        };
      });
      if (m.hscroll || !m.svgInside || !m.drawn || logs.length) failures++;
      console.log(v.tag, slug, JSON.stringify(m), "errors", logs);
      await ctx.close();
    }
    const { ctx, page, logs } = await open(v, "/capabilities");
    const grid = page.locator(".cap-index");
    await grid.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2800);
    await page.screenshot({ path: `${out}/index-${v.tag}-drawn.png` });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${out}/index-${v.tag}-loop.png` });
    const m = await page.evaluate(() => ({
      hscroll: document.documentElement.scrollWidth > innerWidth,
      drawn: [...document.querySelectorAll(".cap-card .sketch")].map((s) => s.hasAttribute("data-drawn")),
    }));
    if (m.hscroll || logs.length) failures++;
    console.log(v.tag, "index", JSON.stringify(m), "errors", logs);
    await ctx.close();
  }
}

await browser.close();
console.log(failures ? `FAIL ${failures}` : "PASS");
process.exitCode = failures ? 1 : 0;
