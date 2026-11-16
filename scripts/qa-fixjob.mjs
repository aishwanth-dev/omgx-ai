// Fix-job QA: proof text, hero start, end-state statement and step cue at 1440x900 and 390x844.
// Usage: node scripts/qa-fixjob.mjs [baseUrl]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3000";
const out = "qa-output";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", args: ["--use-angle=d3d11", "--enable-gpu"] });

for (const [width, height] of [[1440, 900], [390, 844]]) {
  const mobile = width < 800;
  const context = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await page.getByText(/skip intro/i).first().click({ timeout: 4000 }).catch(() => {});
  await page.waitForFunction(() => !/skip intro/i.test(document.body.innerText), null, { timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${out}/fix-${width}-hero.png` });
  const dims = await page.evaluate(() => {
    const st = document.querySelector(".story").getBoundingClientRect();
    return { top: st.top + scrollY, h: st.height, vh: innerHeight, ticks: document.querySelectorAll(".story__progress").length, tickItems: document.querySelectorAll(".story__tick").length };
  });
  console.log(width, JSON.stringify(dims));
  const dist = dims.h - dims.vh;
  for (const p of [0.5, 0.995]) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(dims.top + dist * p));
    await page.waitForTimeout(1800);
    await page.screenshot({ path: `${out}/fix-${width}-story-${Math.round(p * 1000)}.png` });
  }
  const m = await page.evaluate(() => {
    const lines = [...document.querySelectorAll(".story__manifesto-line")].map((l) => {
      const r = l.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(l);
      const rr = range.getBoundingClientRect();
      return { l: Math.round(r.left), w: Math.round(r.width), tl: Math.round(rr.left), tr: Math.round(rr.right), top: Math.round(r.top), bottom: Math.round(r.bottom), lh: getComputedStyle(l).lineHeight, fs: getComputedStyle(l).fontSize };
    });
    const sub = document.querySelector(".story__manifesto-sub")?.getBoundingClientRect();
    return { lines, sub: sub && { top: Math.round(sub.top), bottom: Math.round(sub.bottom) } };
  });
  console.log(width, "manifesto", JSON.stringify(m));
  // proof section
  const proof = await page.evaluate(() => {
    const t = document.querySelector(".proof__track")?.getBoundingClientRect();
    return t && { top: t.top + scrollY, h: t.height };
  });
  if (proof) {
    const pd = proof.h - height;
    for (const p of mobile ? [0, 0.5] : [0.1, 0.35, 0.7]) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.round(proof.top + (mobile ? 0 : pd * p) + (mobile ? p * proof.h * 0.5 : 0)));
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${out}/fix-${width}-proof-${Math.round(p * 100)}.png` });
      const info = await page.evaluate(() => {
        const q = (s) => document.querySelector(s)?.getBoundingClientRect();
        const h = q(".proof__head");
        return h && { head: [Math.round(h.left), Math.round(h.top), Math.round(h.right), Math.round(h.bottom)], clear: document.querySelector(".proof__splines")?.dataset.clear };
      });
      console.log(width, "proof", p, JSON.stringify(info));
    }
  }
  console.log(width, "errors", errors.slice(0, 5));
  await context.close();
}
await browser.close();
