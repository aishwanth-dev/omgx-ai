// About journey sync check (homepage section). Scrolls in small steps forward and back and
// records the active stage against the stage the scroll position implies.
// Usage: node scripts/qa-about.mjs [baseUrl]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3000";
mkdirSync("qa-output", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const modes = [
  ["1440", { viewport: { width: 1440, height: 900 } }],
  ["390", { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
];
let bad = 0;
for (const [name, opts] of modes) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const logs = [];
  page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));
  await page.addInitScript(() => sessionStorage.setItem("omgx-intro-seen", "1"));
  await page.goto(base + "/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".omx-loader", { state: "detached", timeout: 90000 }).catch(() => {});
  await page.waitForSelector(".journey-track", { state: "attached", timeout: 60000 });
  await page.waitForTimeout(2500);
  const geo = () =>
    page.evaluate(() => {
      const t = document.querySelector(".journey-track");
      const r = t.getBoundingClientRect();
      const start = r.top + scrollY;
      const end = start + r.height - innerHeight;
      const p = Math.min(1, Math.max(0, (scrollY - start) / (end - start)));
      const stage = [...document.querySelectorAll(".journey__btn")].findIndex((b) => b.getAttribute("aria-pressed") === "true");
      return { y: Math.round(scrollY), start: Math.round(start), end: Math.round(end), p, expect: Math.min(3, Math.floor(p * 4)), stage, h: Math.round(r.height), vh: innerHeight };
    });
  // bring the track to its start
  let g = await geo();
  await page.mouse.move(opts.viewport.width / 2, opts.viewport.height / 2);
  await page.evaluate((y) => window.scrollTo(0, y - 300), g.start);
  await page.waitForTimeout(800);
  console.log(`\n== ${name}: track ${g.h}px (${(g.h / g.vh).toFixed(2)} x vh), scroll distance ${g.end - g.start}px (${((g.end - g.start) / g.vh).toFixed(2)} x vh)`);
  const rows = [];
  const step = async (dy, dir) => {
    await page.mouse.wheel(0, dy);
    await page.waitForTimeout(450);
    const s = await geo();
    const ok = s.stage === s.expect;
    if (!ok) bad++;
    rows.push(`${dir} y=${s.y} p=${s.p.toFixed(2)} expect=${s.expect + 1} stage=${s.stage + 1} ${ok ? "" : "MISMATCH"}`);
    return s;
  };
  const dy = Math.round((g.end - g.start) / 24);
  for (let i = 0; i < 40; i++) {
    const s = await step(dy, "down");
    if (s.y > s.end + 400) break;
  }
  for (let i = 0; i < 40; i++) {
    const s = await step(-dy, "up  ");
    if (s.y < s.start - 400) break;
  }
  console.log(rows.join("\n"));

  // screenshots: stage 1-4 via clicking the stage buttons (scroll lands mid-segment)
  for (let i = 0; i < 4; i++) {
    await page.locator(".journey__btn").nth(i).click();
    await page.waitForTimeout(1800);
    await page.screenshot({ path: `qa-output/about-${name}-stage${i + 1}.png` });
    const s = await geo();
    console.log(`click ${i + 1}: stage=${s.stage + 1} expect=${s.expect + 1}`);
    if (s.stage !== i) bad++;
  }
  // release: scroll on past the end, no dead zone
  await page.evaluate(() => window.scrollTo(0, document.querySelector(".journey-track").getBoundingClientRect().bottom + scrollY - innerHeight + 200));
  await page.waitForTimeout(600);
  await page.screenshot({ path: `qa-output/about-${name}-after.png` });
  if (logs.length) console.log(logs.join("\n"));
  await ctx.close();
}
await browser.close();
console.log(bad ? `\nFAILED: ${bad} mismatches` : "\nAll stage checks matched.");
process.exit(bad ? 1 : 0);
