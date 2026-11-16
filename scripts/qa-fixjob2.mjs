// Inner pages carry no three.js; curtain, mobile menu, project and capability screenshots.
// Usage: node scripts/qa-fixjob2.mjs [baseUrl]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3000";
mkdirSync("qa-output", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
let bad = 0;

// 1. no WebGL / three on inner pages (fresh load of each)
const routes = ["/about", "/capabilities", "/capabilities/artificial-intelligence", "/capabilities/immersive-technologies", "/work", "/work/ashok-leyland-h-engine-scada", "/contact", "/products-research"];
for (const r of routes) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const hits = [];
  const jobs = [];
  page.on("response", (res) => {
    const u = res.url();
    if (/\.glb|draco/i.test(u)) hits.push(u);
    else if (/\.js(\?|$)/.test(u) || /_next\/static\/chunks/.test(u)) jobs.push(res.text().then((t) => /WebGLRenderer/.test(t) && hits.push(`three in ${u.split("/").pop()}`)).catch(() => {}));
  });
  await page.addInitScript(() => sessionStorage.setItem("omgx-intro-seen", "1"));
  await page.goto(base + r, { waitUntil: "load" });
  await page.waitForTimeout(3500);
  await page.mouse.wheel(0, 1200);
  await page.waitForTimeout(1200);
  await Promise.all(jobs);
  const canvases = await page.evaluate(() => [...document.querySelectorAll("canvas")].filter((c) => c.getContext && (c.getContext("webgl2") || c.getContext("webgl"))).length);
  const nums = await page.evaluate(() => [...document.querySelectorAll(".mega__item-index,.wk__num,.showcase__num,.cap-card__index,.about-vertical__index")].length);
  const ok = hits.length === 0 && canvases === 0;
  if (!ok) bad++;
  console.log(`${ok ? "ok  " : "FAIL"} ${r} three/glb hits=${hits.length} webgl canvases=${canvases} stray index nodes=${nums}`);
  hits.slice(0, 3).forEach((h) => console.log("   ", h));
  if (r === "/about") await page.screenshot({ path: "qa-output/inner-about-1440.png" });
  if (r === "/capabilities/artificial-intelligence") await page.screenshot({ path: "qa-output/inner-capability-1440.png" });
  if (r === "/work/ashok-leyland-h-engine-scada") await page.screenshot({ path: "qa-output/inner-project-1440.png" });
  await ctx.close();
}

// 2. curtain mid-transition (labels carry no index) + mobile menu
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript(() => sessionStorage.setItem("omgx-intro-seen", "1"));
  await page.goto(base + "/about", { waitUntil: "load" });
  await page.waitForTimeout(2500);
  await page.getByRole("button", { name: /menu/i }).first().click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "qa-output/inner-mobile-menu-390.png" });
  const menuText = await page.locator(".mobile-menu__link").allInnerTexts();
  console.log("mobile menu:", JSON.stringify(menuText));
  if (menuText.some((t) => /\d/.test(t))) bad++;
  await page.locator(".mobile-menu__link", { hasText: "Work" }).first().click();
  await page.waitForTimeout(420);
  await page.screenshot({ path: "qa-output/inner-curtain-390.png" });
  const label = await page.locator(".curtain__label").innerText();
  console.log("curtain label:", JSON.stringify(label));
  if (/\d/.test(label)) bad++;
  await ctx.close();
}
await browser.close();
console.log(bad ? `FAILED ${bad}` : "all ok");
process.exit(bad ? 1 : 0);
