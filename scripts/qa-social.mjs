// QA for the footer/founder social links and console errors at 1440 and 390. Usage: node scripts/qa-social.mjs
import { chromium } from "playwright";
const b = await chromium.launch({ channel: "msedge", args: ["--use-gl=angle", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const c = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500 });
  const p = await c.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message.slice(0, 120)));
  p.on("console", (m) => m.type() === "error" && errs.push(m.text().slice(0, 120)));
  await p.goto("http://localhost:3000/", { waitUntil: "load" });
  await p.waitForSelector(".loader", { state: "detached", timeout: 40000 }).catch(() => {});
  await p.waitForTimeout(1500);
  await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await p.waitForTimeout(1200);
  if (w > 500) await p.hover(".social-chip");
  await p.waitForTimeout(500);
  const m = await p.evaluate(() => ({
    ox: document.documentElement.scrollWidth > innerWidth,
    chips: [...document.querySelectorAll(".social-chip")].map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), Math.round(r.left), Math.round(r.top)]; }),
    links: [...document.querySelectorAll(".social-chip,.social-pill")].map((e) => e.href + " | " + e.getAttribute("aria-label") + " | " + e.target + " " + e.rel),
  }));
  console.log(w, JSON.stringify(m), errs.filter((e) => !/THREE\.Clock/.test(e)));
  await p.screenshot({ path: `qa-output/wwd/footer-${w}.png` });
  await p.evaluate(() => document.querySelector(".founder")?.scrollIntoView({ block: "center" }));
  await p.waitForTimeout(800);
  await p.screenshot({ path: `qa-output/wwd/founder-${w}.png` });
  await c.close();
}
await b.close();
