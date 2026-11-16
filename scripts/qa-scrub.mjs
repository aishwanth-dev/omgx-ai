// Scrubs a pinned track to given progress values and screenshots each state.
// Usage: node scripts/qa-scrub.mjs <proof|process> [baseUrl]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const which = process.argv[2] ?? "proof";
const base = process.argv[3] ?? "http://localhost:3000";
mkdirSync("qa-output", { recursive: true });
const PROGRESS = which === "proof" ? [0, 0.3, 0.6, 0.85, 1] : [0.02, 1.2 / 4.2, 2.15 / 4.2, 3.1 / 4.2, 4.05 / 4.2]; // process: each card landed, mid-hold (see processDeck.ts)
const browser = await chromium.launch({ channel: "msedge" });
for (const [name, viewport] of [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 390, height: 844 }],
]) {
  const page = await (await browser.newContext({ viewport, deviceScaleFactor: 1 })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(errs.length ? e.message : (e.stack ?? e.message).split("\n").slice(0, 5).join(" | ")));
  await page.goto(base + "/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(`.${which}__track`, { state: "attached" });
  await page.waitForSelector(".loader", { state: "detached", timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const meta = await page.evaluate((w) => {
    const t = document.querySelector(`.${w}__track`);
    const r = t.getBoundingClientRect();
    return { top: r.top + scrollY, h: r.height, vh: innerHeight };
  }, which);
  console.log(name, JSON.stringify(meta), `track = ${((meta.h / meta.vh) * 100).toFixed(0)}svh`);
  const scrollable = Math.max(1, meta.h - meta.vh);
  for (const p of PROGRESS) {
    const y = meta.top + (name === "desktop" ? p * scrollable : 0);
    if (name === "mobile" && which === "process") {
      // sticky stack: step through the section
      const target = meta.top - 80 + p * (meta.h - meta.vh * 0.4);
      await page.evaluate((v) => window.scrollTo(0, v), target);
    } else if (name === "mobile") {
      await page.evaluate((v) => window.scrollTo(0, v), meta.top + p * Math.max(0, meta.h - meta.vh));
    } else {
      await page.evaluate((v) => window.scrollTo(0, v), y);
    }
    await page.waitForTimeout(900);
    const probe = await page.evaluate((w) => {
      if (w === "proof")
        return [...document.querySelectorAll(".proof__spline")].map((p) => p.style.strokeDashoffset || getComputedStyle(p).strokeDashoffset);
      return {
        active: [...document.querySelectorAll(".process__step")].findIndex((s) => s.classList.contains("is-active")),
      };
    }, which);
    console.log(name, p, JSON.stringify(probe));
    await page.screenshot({ path: `qa-output/${which}-${name}-${String(Math.round(p * 100)).padStart(3, "0")}.png` });
  }
  if (errs.length) console.log("pageerrors", errs.length, errs[0]);
  await page.close();
}
await browser.close();
