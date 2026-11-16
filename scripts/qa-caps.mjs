// QA for the "What we do" discipline section: desktop models, mid-transition, frame times, mobile rows.
// Usage: node scripts/qa-caps.mjs [desktop|perf|mobile|sizes|all] [baseUrl]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const what = process.argv[2] ?? "all";
const base = process.argv[3] ?? "http://localhost:3000";
const out = "qa-output";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel: "msedge", args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });

async function open(w, h, mobile) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1 });
  const page = await ctx.newPage();
  const logs = [];
  page.on("console", (m) => ["error", "warning"].includes(m.type()) && logs.push(`[${m.type()}] ${m.text().slice(0, 200)}`));
  page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));
  await page.goto(base + (process.env.QA_PATH || "/"), { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".loader", { state: "detached", timeout: 40000 }).catch(() => {});
  await page.waitForSelector(".caps__track", { state: "attached", timeout: 90000 });
  await page.waitForTimeout(1500);
  return { ctx, page, logs };
}
const go = async (page, y, wait = 1400) => {
  await page.evaluate((v) => window.scrollTo(0, v), Math.round(y));
  await page.waitForTimeout(wait);
};
const top = (page, sel) => page.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + scrollY, sel);

if (what === "desktop" || what === "all") {
  const { ctx, page, logs } = await open(1440, 900, false);
  const t = await top(page, ".caps__track");
  const h = await page.evaluate(() => document.querySelector(".caps__track").offsetHeight - innerHeight);
  const names = ["neural", "robot", "headset", "pcb"];
  for (let i = 0; i < 4; i++) {
    await go(page, t + h * ((i + 0.5) / 4), 2200);
    await page.screenshot({ path: `${out}/caps-d-${names[i]}.png` });
    const info = await page.evaluate(() => ({ canvases: document.querySelectorAll(".caps canvas").length }));
    console.log("row", i, JSON.stringify(info));
  }
  // Mid-transition frames: just past a segment boundary.
  await go(page, t + h * 0.2, 1500);
  await go(page, t + h * 0.26, 0);
  for (let k = 1; k <= 5; k++) {
    await page.waitForTimeout(60);
    await page.screenshot({ path: `${out}/caps-d-mid${k}.png` });
  }
  console.log("logs", logs.slice(0, 6));
  await ctx.close();
}

if (what === "perf" || what === "all") {
  const { ctx, page } = await open(1440, 900, false);
  const t = await top(page, ".caps__track");
  const h = await page.evaluate(() => document.querySelector(".caps__track").offsetHeight - innerHeight);
  if (process.env.NOCANVAS) await page.evaluate(() => Object.defineProperty(document, "hidden", { get: () => true }));
  await go(page, t - 400, 4000);
  const gpu = await page.evaluate(() => { const g = document.createElement("canvas").getContext("webgl2"); const e = g.getExtension("WEBGL_debug_renderer_info"); return g.getParameter(e.UNMASKED_RENDERER_WEBGL); });
  console.log("gpu", gpu);
  const base0 = await page.evaluate(() => new Promise((r) => { const d = []; let l = performance.now(); const f = (n) => { d.push(n - l); l = n; if (d.length < 90) requestAnimationFrame(f); else r({ avg: d.slice(2).reduce((a, c) => a + c, 0) / (d.length - 2), worst: Math.max(...d.slice(2)) }); }; requestAnimationFrame(f); }));
  console.log("baseline-idle-at-start", JSON.stringify(base0));
  const res = await page.evaluate(
    ([t0, hh]) =>
      new Promise((resolve) => {
        const d = [];
        let last = performance.now();
        const start = last;
        const step = (now) => {
          d.push(now - last);
          last = now;
          const f = Math.min(1, (now - start) / 3000);
          window.scrollTo(0, t0 - 400 + (hh + 400) * f);
          if (now - start < 3000) requestAnimationFrame(step);
          else {
            const s = d.slice(2);
            resolve({ frames: s.length, avg: s.reduce((a, c) => a + c, 0) / s.length, worst: Math.max(...s), over25: s.filter((x) => x > 25).length });
          }
        };
        requestAnimationFrame(step);
      }),
    [t, h],
  );
  console.log("perf", JSON.stringify(res));
  await ctx.close();
}

const mobileRows = async (w, h, tag) => {
  const { ctx, page, logs } = await open(w, h, true);
  const heads = await page.evaluate(() => [...document.querySelectorAll(".cap-row__tab")].length);
  for (let i = 0; i < heads; i++) {
    await page.evaluate((k) => document.querySelectorAll(".cap-row__tab")[k].scrollIntoView({ block: "center" }), i);
    await page.waitForTimeout(500);
    await page.tap(`.cap-row:nth-child(${i + 1}) .cap-row__tab`).catch(() => {});
    await page.waitForTimeout(1800);
    const m = await page.evaluate(() => {
      const r = (s) => document.querySelector(s)?.getBoundingClientRect();
      const v = r(".cap-visual");
      const hd = r(".site-header, header");
      return {
        stage: v && [Math.round(v.top), Math.round(v.height), Math.round(v.width)],
        header: hd && Math.round(hd.bottom),
        active: [...document.querySelectorAll(".cap-row")].findIndex((e) => e.classList.contains("is-active")),
        sx: document.documentElement.scrollWidth > innerWidth,
      };
    });
    console.log(tag, "row", i, JSON.stringify(m));
    await page.screenshot({ path: `${out}/caps-${tag}-row${i + 1}.png` });
  }
  console.log(tag, "logs", logs.slice(0, 4));
  await ctx.close();
};
if (what === "mobile" || what === "all") await mobileRows(390, 844, "m390");
if (what === "sizes") for (const [w, h] of [[360, 740], [430, 932], [768, 1024], [834, 1194]]) await mobileRows(w, h, `m${w}`);

await browser.close();
