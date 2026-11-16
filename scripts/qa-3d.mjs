// Focused 3D QA: About ring, hero journey, final CTA, discipline models.
// Usage: node scripts/qa-3d.mjs [what] [baseUrl] [width] [height]
//   what = about | hero | cta | caps | all
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const what = process.argv[2] ?? "all";
const base = process.argv[3] ?? "http://localhost:3000";
const width = Number(process.argv[4] ?? 1440);
const height = Number(process.argv[5] ?? 900);
const out = "qa-output";
mkdirSync(out, { recursive: true });
const mobile = width < 800;
const tag = mobile ? "m" : "d";

const browser = await chromium.launch({ channel: "msedge", args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const context = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile });
const page = await context.newPage();
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") errors.push(`[${m.type()}] ${m.text()}`);
});
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
const requests = [];
page.on("request", (r) => {
  const u = new URL(r.url());
  if (!u.hostname.includes("localhost")) requests.push(r.url());
});

await page.goto(base, { waitUntil: "domcontentloaded" });
await page.waitForSelector(".loader", { state: "detached", timeout: 30000 }).catch(() => {});
await page.waitForTimeout(1500);

const scrollTo = async (y, wait = 1800) => {
  await page.evaluate((yy) => window.scrollTo(0, yy), Math.round(y));
  await page.waitForTimeout(wait);
};
const shot = (name) => page.screenshot({ path: `${out}/${name}.png` });
const topOf = (sel) => page.evaluate((s) => { const el = document.querySelector(s); return el ? el.getBoundingClientRect().top + scrollY : null; }, sel);

if (what === "about" || what === "all") {
  const y = await topOf(".about-home");
  const ringTop = await page.evaluate(() => { const el = document.querySelector(".journey__ring"); return el ? el.getBoundingClientRect().top + scrollY : null; });
  await scrollTo((ringTop ?? y) - height * 0.25, 3000);
  await shot(`${tag}-about`);
  const info = await page.evaluate(() => {
    const r = document.querySelector(".journey__ring");
    const c = r?.querySelector("canvas");
    return { ring: r?.getBoundingClientRect().toJSON(), canvas: c?.getBoundingClientRect().toJSON(), live: r?.querySelector(".journey-ring")?.getAttribute("data-live"), canvases: document.querySelectorAll("canvas").length };
  });
  console.log("about", JSON.stringify(info));
}

if (what === "hero" || what === "all") {
  await scrollTo(0, 800);
  const storyH = await page.evaluate(() => document.querySelector(".story").getBoundingClientRect().height);
  const dist = storyH - height;
  const points = (process.env.HERO_POINTS ?? "0,0.1,0.25,0.4,0.55,0.7,0.8,0.88,0.94,1").split(",").map(Number);
  for (const p of points) {
    await scrollTo(dist * p, 2200);
    await shot(`hero-${tag}-${String(Math.round(p * 100)).padStart(3, "0")}`);
  }
  console.log("hero canvases", await page.evaluate(() => document.querySelectorAll("canvas").length));
}

if (what === "cta" || what === "all") {
  const y = await topOf(".final-cta");
  await scrollTo(y - 40, 3000);
  await shot(`${tag}-cta-top`);
  await scrollTo(y + 300, 2500);
  await shot(`${tag}-cta-mid`);
}

if (what === "caps" || what === "all") {
  const track = await page.evaluate(() => { const el = document.querySelector(".caps__track"); const r = el.getBoundingClientRect(); return { top: r.top + scrollY, h: r.height }; });
  const dist = track.h - height;
  const pts = [0.06, 0.3, 0.55, 0.8];
  if (!mobile) {
    for (let i = 0; i < 4; i++) {
      await scrollTo(track.top + dist * pts[i], 2800);
      await shot(`caps-${i + 1}`);
    }
    // mid-transition shot
    await scrollTo(track.top + dist * 0.18, 300);
    await shot(`caps-transition`);
  } else {
    for (let i = 0; i < 4; i++) {
      const y = await page.evaluate((k) => { const b = document.querySelectorAll(".cap-row__tab")[k]; return b.getBoundingClientRect().top + scrollY; }, i);
      await scrollTo(y - height * 0.45, 2500);
      await shot(`caps-m-${i + 1}`);
    }
  }
  console.log("caps canvases", await page.evaluate(() => document.querySelectorAll("canvas").length));
}

console.log("external requests:", requests.length, requests.slice(0, 5));
console.log("console errors/warnings:", errors.length);
errors.slice(0, 20).forEach((e) => console.log("  ", e.slice(0, 300)));
await browser.close();
