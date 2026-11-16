// Loads "/", waits for the loader, scrolls the whole page, then reports every console message and the dev overlay badge.
// Usage: node scripts/qa-issue-scroll.mjs [baseUrl]
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "msedge" });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const logs = [];
page.on("console", (m) => logs.push(`[${m.type()}] ${m.text().split("\n")[0].slice(0, 220)}`));
page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message.split("\n")[0].slice(0, 220)}`));
await page.goto(base + "/", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".loader", { state: "detached", timeout: 40000 }).catch(() => {});
await page.waitForTimeout(4000);
const h = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y <= h; y += 700) {
  await page.evaluate((v) => window.scrollTo(0, v), y);
  await page.waitForTimeout(120);
}
await page.waitForTimeout(1500);
const badge = await page.evaluate(() => {
  const r = document.querySelector("nextjs-portal")?.shadowRoot;
  const b = r?.querySelector("[data-next-badge]");
  return { error: b?.getAttribute("data-error"), status: b?.getAttribute("data-status"), text: b?.textContent?.trim(), dialog: !!r?.querySelector("[data-nextjs-dialog]") };
});
console.log(JSON.stringify(badge));
console.log([...new Set(logs)].join("\n"));
await browser.close();
