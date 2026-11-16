// Browser QA for the proof lines, process deck and Next.js issue badge.
// Usage: node scripts/qa-fixes.mjs [baseUrl] [width] [height] [what: all|issue|proof|process]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3000";
const width = Number(process.argv[3] ?? 1440);
const height = Number(process.argv[4] ?? 900);
const what = process.argv[5] ?? "all";
const tag = width < 800 ? "m390" : "d1440";
const out = "qa-output";
mkdirSync(out, { recursive: true });

const mobile = width < 800;
const browser = await chromium.launch({ channel: "msedge", args: ["--use-angle=d3d11", "--enable-gpu"] });
const context = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile });
const page = await context.newPage();
const logs = [];
page.on("console", (m) => {
  if (["error", "warning"].includes(m.type())) logs.push(`[${m.type()}] ${m.text().slice(0, 600)}`);
});
page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));

await page.goto(base, { waitUntil: "domcontentloaded" });
await page.waitForSelector(".loader", { state: "detached", timeout: 20000 }).catch(() => {});
await page.waitForTimeout(2500);

const go = async (y) => {
  await page.evaluate((v) => window.scrollTo(0, v), Math.round(y));
  await page.waitForTimeout(900);
};
const sectionTop = (sel) => page.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + scrollY, sel);

if (what === "all" || what === "issue") {
  const info = await page.evaluate(() => {
    const portal = document.querySelector("nextjs-portal");
    const root = portal?.shadowRoot;
    return {
      badge: root?.querySelector("[data-nextjs-dev-tools-button], [data-issues]")?.textContent ?? null,
      text: root?.textContent?.replace(/\s+/g, " ").slice(0, 600) ?? null,
    };
  });
  console.log("overlay", JSON.stringify(info));
  await page.screenshot({ path: `${out}/${tag}-issue-badge.png` });
}

if (what === "all" || what === "proof") {
  const top = await sectionTop(".proof__track");
  const dist = await page.evaluate(() => document.querySelector(".proof__track").offsetHeight - innerHeight);
  for (const p of [0.25, 0.5, 0.75, 1]) {
    await go(top + dist * p);
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${out}/${tag}-proof-${Math.round(p * 100)}.png` });
  }
  const geo = await page.evaluate(() => {
    const svg = document.querySelector(".proof__splines");
    const r = svg.getBoundingClientRect();
    return {
      svg: [r.width, r.height],
      paths: [...document.querySelectorAll(".proof__spline")].map((p) => {
        const b = p.getBBox();
        return { x: Math.round(b.x), w: Math.round(b.width), off: p.style.strokeDashoffset || getComputedStyle(p).strokeDashoffset };
      }),
      z: ["proof__field", "proof__splines", "proof__inner", "proof__head", "proof__cards"].map((c) => [c, getComputedStyle(document.querySelector("." + c)).zIndex]),
    };
  });
  console.log("proof", JSON.stringify(geo));
}

if (what === "all" || what === "process") {
  const top = await sectionTop(".process__track");
  const dist = await page.evaluate(() => document.querySelector(".process__track").offsetHeight - innerHeight);
  const sample = async (label) =>
    page.evaluate(() => {
      const cards = [...document.querySelectorAll(".process__card")];
      const vh = innerHeight;
      return {
        active: [...document.querySelectorAll(".process__step")].findIndex((s) => s.classList.contains("is-active")),
        cards: cards.map((c) => {
          const r = c.getBoundingClientRect();
          return `${Math.round(r.top)}${c.getAttribute("aria-hidden") === "true" ? "h" : ""}${c.inert ? "i" : ""}${r.top < vh && r.bottom > 0 ? "*" : ""}`;
        }),
      };
    });
  console.log("track", { top, dist, h: await page.evaluate(() => document.querySelector(".process__track").offsetHeight) });
  if (width >= 900) {
    const total = 9;
    // deck times that put each card fully on top: 0, 2, 4, 6, 8 (+ holds)
    for (let k = 0; k < 5; k++) {
      const t = k === 0 ? 0.4 : 2 * k - 0.05 + 0.05;
      await go(top + dist * (t / total));
      await page.waitForTimeout(500);
      console.log("card", k + 1, JSON.stringify(await sample()));
      await page.screenshot({ path: `${out}/${tag}-process-card${k + 1}.png` });
    }
    // reverse
    await go(top + dist * (4 / total));
    console.log("reverse t=4", JSON.stringify(await sample()));
  } else {
    const n = await page.evaluate(() => document.querySelectorAll(".process__card").length);
    for (let k = 0; k < n; k++) {
      const y = await page.evaluate((i) => {
        const c = document.querySelectorAll(".process__card")[i];
        return c.getBoundingClientRect().top + scrollY;
      }, k);
      // scroll so card k is at its sticky position
      await go(y - 120);
      console.log("card", k + 1, JSON.stringify(await sample()));
      await page.screenshot({ path: `${out}/${tag}-process-card${k + 1}.png` });
    }
  }
}

console.log("console:", logs.length ? "\n" + logs.join("\n") : "none");
await browser.close();
