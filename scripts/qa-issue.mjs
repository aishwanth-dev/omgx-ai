// Reports the Next dev overlay state and console output on several routes.
// QA_EXT=1 simulates an extension (Bitdefender-style) that stamps attributes on the DOM before React hydrates.
// Usage: node scripts/qa-issue.mjs [baseUrl]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3000";
mkdirSync("qa-output", { recursive: true });
const ext = process.env.QA_EXT === "1";
const browser = await chromium.launch({ channel: "msedge" });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
if (ext) {
  await context.addInitScript(() => {
    const stamp = (n) => {
      if (n.nodeType !== 1) return;
      if (n.tagName === "DIV") n.setAttribute("bis_skin_checked", "1");
      n.querySelectorAll?.("div").forEach((d) => d.setAttribute("bis_skin_checked", "1"));
    };
    new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach(stamp))).observe(document, { childList: true, subtree: true });
    document.addEventListener("DOMContentLoaded", () => {
      document.body.setAttribute("bis_register", "x");
      document.body.setAttribute("__processed_abc__", "true");
    });
  });
}
for (const route of ["/", "/about", "/work", "/contact"]) {
  const page = await context.newPage();
  const logs = [];
  page.on("console", (m) => {
    if (["error", "warning"].includes(m.type())) logs.push(`[${m.type()}] ${m.text().split("\n")[0].slice(0, 160)}`);
  });
  page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));
  await page.goto(base + route, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);
  const badge = await page.evaluate(() => {
    const r = document.querySelector("nextjs-portal")?.shadowRoot;
    const b = r?.querySelector("[data-nextjs-dev-tools-button]");
    return { text: b?.textContent?.trim() ?? null, issues: r?.querySelector("[data-issues-count], [data-issues]")?.textContent?.trim() ?? null };
  });
  console.log(route, JSON.stringify(badge), logs.length ? "\n  " + logs.join("\n  ") : "no console errors/warnings");
  if (route === "/") await page.screenshot({ path: `qa-output/issue-${ext ? "ext" : "clean"}.png`, clip: { x: 0, y: 780, width: 300, height: 120 } });
  await page.close();
}
await browser.close();
