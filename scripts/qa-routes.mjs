// Route smoke test + interaction QA for inner pages.
// Usage: node scripts/qa-routes.mjs [baseUrl]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3100";
const out = "qa-output";
mkdirSync(out, { recursive: true });

const routes = [
  "/capabilities",
  "/capabilities/artificial-intelligence",
  "/capabilities/industrial-automation",
  "/capabilities/immersive-technologies",
  "/capabilities/hardware-engineering",
  "/work",
  ...[
    "ashok-leyland-h-engine-scada", "bosch-assembly-line-data-acquisition", "bosch-wireless-nutrunner-monitoring",
    "beml-cylinder-head-assembly", "tvs-weld-frame-rectification", "tvs-kick-effort-test-rig", "ifb-window-regulator-test-rig",
    "wrigleys-pallet-coating-system", "apc-pick-and-place", "apc-wireless-andon", "iti-digital-coin-validator",
    "southern-railways-ticket-vending-machine", "bmtc-mobile-video-surveillance", "gvk-airstream", "anssird-mobicast",
    "ipdr-lms", "netgis", "bharatnet-network-monitoring", "mikrotik-network-monitoring", "rlms-tv-recorder",
    "log9-battery-vr-simulation", "aviation-vr-training", "industrial-ar-safety-training", "xr-training-content-platform",
    "unity-cloud-ide-xr-builder", "fishin-india-underwater-monitoring",
  ].map((s) => `/work/${s}`),
  "/products-research",
  "/about",
  "/contact",
  "/sitemap.xml",
  "/robots.txt",
  "/this-route-does-not-exist",
];

const browser = await chromium.launch({ channel: "msedge" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(`${page.url()} :: ${m.text().slice(0, 200)}`));
page.on("pageerror", (e) => errors.push(`${page.url()} :: pageerror ${e.message.slice(0, 200)}`));

const report = [];
for (const r of routes) {
  const res = await page.goto(base + r, { waitUntil: "load" });
  const h1 = await page.locator("h1").count();
  const title = await page.title();
  report.push(`${res?.status()} h1=${h1} ${r} — ${title}`);
  if (!r.includes("/work/") || r.endsWith("fishin-india-underwater-monitoring") || r.endsWith("ipdr-lms")) {
    await page.waitForTimeout(1200);
    const name = r.replace(/[/.]/g, "_") || "root";
    await page.screenshot({ path: `${out}/route${name}.png` });
  }
}
console.log(report.join("\n"));

// Work filters
await page.goto(`${base}/work`, { waitUntil: "load" });
for (const label of ["Underwater Monitoring", "Immersive Technologies (AR / VR / XR)", "Research & Other Initiatives", "All Work"]) {
  await page.getByRole("button", { name: label, exact: true }).click();
  await page.waitForTimeout(700);
  const n = await page.locator(".work-grid > li").count();
  console.log(`filter "${label}": ${n} cards, url=${page.url().replace(base, "")}`);
}
await page.goto(`${base}/work?filter=networking`, { waitUntil: "load" });
await page.waitForTimeout(700);
console.log(`direct ?filter=networking: ${await page.locator(".work-grid > li").count()} cards`);
await page.screenshot({ path: `${out}/work-filter-networking.png`, fullPage: false });

// Mega menu + keyboard
await page.goto(`${base}/about`, { waitUntil: "load" });
await page.getByRole("button", { name: "Capabilities" }).click();
await page.waitForTimeout(600);
console.log("mega visible:", await page.locator("#mega-capabilities").isVisible());
await page.screenshot({ path: `${out}/mega-capabilities.png` });
await page.keyboard.press("Escape");
await page.waitForTimeout(600);
console.log("mega after Esc:", await page.locator("#mega-capabilities").count(), "focused:", await page.evaluate(() => document.activeElement?.textContent));

// Contact form: validation then submission without a configured webhook
await page.goto(`${base}/contact`, { waitUntil: "load" });
await page.getByRole("button", { name: /Start an engineering conversation/ }).click();
await page.waitForTimeout(300);
console.log("validation errors shown:", await page.locator(".form__error").count());
await page.screenshot({ path: `${out}/contact-validation.png` });
await page.getByLabel("Full name *").fill("QA Tester");
await page.getByLabel("Work email *").fill("qa@example.com");
await page.getByLabel("Company / organisation *").fill("QA Org");
await page.getByLabel("Project category *").selectOption({ index: 1 });
await page.getByLabel("Project description *").fill("Local QA submission to verify honest delivery handling.");
await page.getByRole("button", { name: /Start an engineering conversation/ }).click();
await page.waitForSelector(".form__status", { timeout: 8000 });
console.log("submit status:", (await page.locator(".form__status").textContent())?.slice(0, 120));
await page.screenshot({ path: `${out}/contact-submitted.png` });

// Mobile menu
const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const mp = await m.newPage();
await mp.goto(`${base}/work`, { waitUntil: "load" });
await mp.getByRole("button", { name: "Menu" }).click();
await mp.waitForTimeout(800);
await mp.screenshot({ path: `${out}/mobile-menu.png` });
await mp.getByRole("link", { name: /About/ }).first().click();
await mp.waitForURL("**/about");
await mp.waitForTimeout(800);
console.log("mobile nav ->", mp.url().replace(base, ""), "menu open:", await mp.locator("#mobile-menu").count());
const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
console.log("mobile /about horizontal overflow:", overflow);

console.log(`console errors: ${errors.length}`);
errors.slice(0, 20).forEach((e) => console.log("  ", e));
await browser.close();
