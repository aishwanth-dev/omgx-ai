// QA for the "What we do" section on phones/tablets: taps each row, checks stage/header/overflow/scroll jump, saves shots.
// Usage: node scripts/qa-caps-mobile.mjs [baseUrl] [--sizes=390x844,...]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const args = process.argv.slice(2);
const base = args.find((a) => a.startsWith("http")) ?? "http://localhost:3000";
const sizes = (args.find((a) => a.startsWith("--sizes="))?.split("=")[1] ?? "360x740,390x844,430x932,768x1024,834x1194,844x390")
  .split(",").map((s) => s.split("x").map(Number));
mkdirSync("qa-output/caps", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", args: ["--use-gl=angle", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
let bad = 0;
for (const [w, h] of sizes) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const logs = [];
  page.on("pageerror", (e) => logs.push(e.message.slice(0, 160)));
  await page.goto(base + "/", { waitUntil: "load" });
  await page.waitForSelector(".loader", { state: "detached", timeout: 40000 }).catch(() => {});
  await page.waitForSelector(".cap-row__tab", { timeout: 60000 });
  await page.evaluate(() => document.querySelector(".caps").scrollIntoView());
  await page.waitForTimeout(2500);
  for (let i = 0; i < 4; i++) {
    const before = await page.evaluate((k) => {
      const t = document.querySelectorAll(".cap-row__tab")[k];
      return Math.round(t.getBoundingClientRect().top);
    }, i);
    await page.evaluate((k) => {
      const t = document.querySelectorAll(".cap-row__tab")[k];
      const v = document.querySelector(".cap-visual").getBoundingClientRect();
      window.scrollTo(0, scrollY + t.getBoundingClientRect().top - v.bottom - 90);
    }, i);
    await page.waitForTimeout(900);
    await page.tap(`.cap-row:nth-child(${i + 1}) .cap-row__tab`);
    await page.waitForTimeout(2300);
    const m = await page.evaluate((k) => {
      const r = (s) => document.querySelector(s)?.getBoundingClientRect();
      const v = r(".cap-visual"), hd = r("header, .site-header");
      const tab = document.querySelectorAll(".cap-row__tab")[k].getBoundingClientRect();
      const rows = [...document.querySelectorAll(".cap-row")];
      const cv = r(".cap-visual__canvas canvas");
      return {
        stage: v && [Math.round(v.left), Math.round(v.top), Math.round(v.width), Math.round(v.height)],
        headerBottom: hd && Math.round(hd.bottom),
        canvas: cv && [Math.round(cv.width), Math.round(cv.height)],
        activeRow: rows.findIndex((e) => e.classList.contains("is-active")),
        tabTop: Math.round(tab.top), tabUnderStage: tab.top < v.bottom - 1,
        overflowX: document.documentElement.scrollWidth > innerWidth,
      };
    }, i);
    const ok = m.activeRow === i && !m.overflowX && !m.tabUnderStage && (!m.headerBottom || m.stage[1] >= m.headerBottom - 1);
    if (!ok) bad++;
    console.log(`${w}x${h} row ${i} ${ok ? "ok " : "BAD"} ${JSON.stringify(m)}`);
    await page.screenshot({ path: `qa-output/caps/${w}x${h}-row${i + 1}.png` });
  }
  if (logs.length) console.log("page errors", logs);
  await ctx.close();
}
await browser.close();
process.exit(bad ? 1 : 0);