// Loader QA: fast-3G throttle, real progress samples, screenshots at ~30/70/100%, then a full scroll
// that must trigger no new .glb/.webp/font requests. Usage: node scripts/qa-loader.mjs [baseUrl]
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
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (0.7 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  let phase = "loading";
  const late = [];
  const all = [];
  page.on("request", (r) => {
    const u = r.url();
    if (/\.(glb|webp|woff2?|otf|ttf|wasm)(\?|$)/.test(u)) {
      all.push(u.replace(base, ""));
      if (phase === "after") late.push(u.replace(base, ""));
    }
  });
  const t0 = Date.now();
  await page.goto(base + "/", { waitUntil: "commit" });
  const shots = new Set();
  const samples = [];
  let finished = false;
  while (Date.now() - t0 < 120000) {
    const v = await page.evaluate(() => {
      const el = document.querySelector(".omx-loader__count");
      return el ? Number(el.getAttribute("aria-valuenow")) : null;
    }).catch(() => null);
    if (v === null) {
      if (samples.length) { finished = true; break; }
    } else {
      samples.push([Date.now() - t0, v]);
      for (const t of [30, 70, 100]) {
        if (v >= t && !shots.has(t)) {
          shots.add(t);
          await page.screenshot({ path: `qa-output/loader-${name}-${String(t).padStart(3, "0")}.png` }).catch(() => {});
        }
      }
    }
    await page.waitForTimeout(40);
  }
  const mono = samples.every((s, i) => i === 0 || s[1] >= samples[i - 1][1]);
  console.log(name, "finished", finished, "ms", Date.now() - t0, "monotonic", mono, "samples", samples.filter((_, i) => i % Math.ceil(samples.length / 12) === 0).map((s) => s.join(":")).join(" "));
  // After exit: restore speed, scroll the whole page, count new asset requests.
  phase = "after";
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await page.waitForTimeout(1500);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 500) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(1500);
  console.log(name, "assets during load:", [...new Set(all)].join(", "));
  console.log(name, "NEW asset requests after loader:", late.length ? late.join(", ") : "none");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
  await page.screenshot({ path: `qa-output/header-logo-${name}.png`, clip: { x: 0, y: 0, width: opts.viewport.width, height: 90 } });
  await ctx.close();
}
await browser.close();