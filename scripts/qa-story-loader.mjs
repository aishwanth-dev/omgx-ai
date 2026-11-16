// Quick QA: loader mid/pre-exit, hero after, Our story section, console errors, horizontal overflow.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const base = process.argv[2] ?? "http://localhost:3000";
mkdirSync("qa-output", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const modes = [
  ["1440", { viewport: { width: 1440, height: 900 } }],
  ["390", { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
];
for (const [name, opts] of modes) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.clearBrowserCache");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 120, downloadThroughput: (2 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  const errs = [];
  page.on("console", (m) => { if (["error", "warning"].includes(m.type())) errs.push(m.type() + ": " + m.text().slice(0, 220)); });
  page.on("pageerror", (e) => errs.push("pageerror: " + e.message.slice(0, 220)));
  const t0 = Date.now();
  await page.goto(base + "/", { waitUntil: "commit" });
  const shots = new Set();
  let last = -1;
  while (Date.now() - t0 < 90000) {
    const v = await page.evaluate(() => { const e = document.querySelector(".omx-loader__count"); return e ? Number(e.getAttribute("aria-valuenow")) : null; }).catch(() => null);
    if (v === null) { if (last >= 0) break; }
    else {
      if (v < last) console.log(name, "BACKWARDS", last, v);
      last = v;
      for (const t of [40, 100]) if (v >= t && !shots.has(t)) { shots.add(t); await page.screenshot({ path: `qa-output/ld-${name}-${t}.png` }).catch(() => {}); }
    }
    await page.waitForTimeout(40);
  }
  console.log(name, "loader ms", Date.now() - t0);
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `qa-output/hero-${name}.png` });
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log(name, "h-overflow px:", ov);
  const info = await page.evaluate(() => { const f = document.querySelector(".founder"); if (!f) return null; const r = f.getBoundingClientRect(); return { top: r.top + scrollY, h: r.height }; });
  if (info) {
    await page.evaluate((y) => window.scrollTo(0, y - 140), info.top);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `qa-output/story-${name}.png` });
    const m = await page.evaluate(() => { const c = document.querySelector(".founder .visual-caption"), p = document.querySelector(".founder__photo"); const a = c.getBoundingClientRect(), b = p.getBoundingClientRect(); return { capBottom: a.bottom, photoBottom: b.bottom, photoH: b.height, photoW: b.width, capH: c.scrollHeight, capClient: c.clientHeight }; });
    console.log(name, "founder", JSON.stringify(m));
  } else console.log(name, "no .founder");
  await page.goto(base + "/about", { waitUntil: "load" });
  await page.waitForTimeout(1500);
  const ov2 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log(name, "/about h-overflow", ov2);
  const f2 = await page.$(".founder");
  if (f2) { await f2.scrollIntoViewIfNeeded(); await page.waitForTimeout(600); await page.screenshot({ path: `qa-output/about-${name}.png` }); }
  console.log(name, "console:", [...new Set(errs)].join(" | ") || "none");
  await ctx.close();
}
await browser.close();