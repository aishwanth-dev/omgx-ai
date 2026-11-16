// Dumps the Next dev overlay shadow DOM text and every console message on "/".
// Usage: node scripts/qa-overlay.mjs [baseUrl] [route]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3000";
const route = process.argv[3] ?? "/";
mkdirSync("qa-output", { recursive: true });
const browser = await chromium.launch({ channel: "msedge" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
if (process.env.QA_EXT === "1") {
  await ctx.addInitScript(() => {
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
if (process.env.QA_HEADSCRIPT === "1") {
  // Mimics a browser extension that appends its own <script> to <head> while the document is still parsing.
  await ctx.addInitScript(() => {
    let done = false;
    new MutationObserver((ms) => {
      if (done) return;
      for (const m of ms)
        for (const n of m.addedNodes)
          if (n.tagName === "SCRIPT" && !n.src && document.head && !done) {
            done = true;
            const s = document.createElement("script");
            s.setAttribute("bis_use", "true");
            s.type = "text/javascript";
            s.charset = "utf-8";
            s.src = "data:text/javascript,";
            document.head.appendChild(s);
          }
    }).observe(document, { childList: true, subtree: true });
  });
}
const page = await ctx.newPage();
const logs = [];
page.on("console", (m) => logs.push(`[${m.type()}] ${m.text().split("\n")[0].slice(0, 300)}`));
page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(base + route, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(6000);
const info = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll("nextjs-portal").forEach((p) => {
    const r = p.shadowRoot;
    out.push(r ? r.textContent.replace(/\s+/g, " ").slice(0, 600) : "(no shadow)");
    const b = r && r.querySelector("[data-next-badge]"); out.push("badge data-error=" + (b && b.getAttribute("data-error")) + " status=" + (b && b.getAttribute("data-status")) + " text=" + (b && b.textContent.trim()));
  });
  return out;
});
console.log(logs.join("\n"));
console.log(info.join("\n---\n"));
await page.screenshot({ path: "qa-output/overlay-full.png" });
await browser.close();
