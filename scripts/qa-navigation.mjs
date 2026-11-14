// Client-side navigation, back/forward and teardown checks (ScrollTrigger pins, canvases).
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:3200";
const browser = await chromium.launch({ channel: "msedge", args: ["--use-angle=d3d11"] });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

const state = async (label) => {
  const s = await page.evaluate(() => ({
    path: location.pathname,
    canvases: document.querySelectorAll("canvas").length,
    pinSpacers: document.querySelectorAll(".pin-spacer").length,
    locked: document.body.classList.contains("is-locked"),
    h1: document.querySelector("h1")?.textContent?.trim().slice(0, 40),
  }));
  console.log(label.padEnd(22), JSON.stringify(s));
};

await page.goto(base, { waitUntil: "load" });
await page.waitForSelector(".loader", { state: "detached", timeout: 15000 });
await page.evaluate(() => window.scrollTo(0, 2500));
await page.waitForTimeout(800);
await state("home (mid-story)");

await page.locator(".site-header").getByRole("link", { name: "About" }).click();
await page.waitForURL("**/about");
await page.waitForTimeout(1200);
await state("-> about");

await page.goBack();
await page.waitForURL(base + "/");
await page.waitForTimeout(1500);
await state("back -> home");

await page.goForward();
await page.waitForURL("**/about");
await page.waitForTimeout(1200);
await state("forward -> about");

await page.locator(".site-header").getByRole("button", { name: "Work" }).click();
await page.locator("#mega-work").getByRole("link", { name: "Underwater Monitoring" }).click();
await page.waitForURL("**/work?filter=underwater");
await page.waitForTimeout(1000);
await state("mega -> work filter");
console.log("cards:", await page.locator(".work-grid > li").count());

await page.locator(".work-card").first().click();
await page.waitForURL("**/work/**");
await page.waitForTimeout(800);
await state("-> project");

await page.goto(base + "/capabilities/immersive-technologies", { waitUntil: "load" });
await page.waitForTimeout(1200);
await state("direct capability");
await page.getByRole("link", { name: /Next capability/ }).click();
await page.waitForURL("**/hardware-engineering");
await page.waitForTimeout(1200);
await state("next capability");

console.log("errors:", errors.length, errors.slice(0, 5));
await browser.close();
