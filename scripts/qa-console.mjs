// Clean-state check: console messages and the Next dev overlay badge on every main route.
// Usage: node scripts/qa-console.mjs [baseUrl]
import { chromium } from "playwright";
const base = process.argv[2] ?? "http://localhost:3000";
const routes = ["/", "/about", "/work", "/capabilities", "/contact", "/products-research"];
const browser = await chromium.launch({ channel: "msedge", args: ["--use-gl=angle", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
let bad = 0;
for (const r of routes) {
  const page = await ctx.newPage();
  const msgs = [];
  page.on("console", (m) => {
    if (/THREE\.Clock/.test(m.text())) return;
    if (["error", "warning"].includes(m.type())) msgs.push(`${m.type()}: ${m.text().slice(0, 200)}`);
  });
  page.on("pageerror", (e) => msgs.push(`pageerror: ${e.message.slice(0, 200)}`));
  await page.goto(base + r, { waitUntil: "load" });
  await page.waitForFunction(() => !document.body.classList.contains("is-locked"), null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const badge = await page.evaluate(() => {
    const host = document.querySelector("nextjs-portal");
    const root = host?.shadowRoot;
    if (!root) return "";
    const txt = [...root.querySelectorAll("button, [role=dialog], [data-nextjs-toast], [data-issues]")]
      .map((e) => {
        const c = e.cloneNode(true);
        c.querySelectorAll("style").forEach((s) => s.remove());
        return c.textContent.replace(/\s+/g, " ").trim();
      })
      .join(" | ");
    return /\d+\s*issue|error/i.test(txt) ? txt.slice(0, 160) : "";
  });
  if (badge) msgs.push(`dev overlay: ${badge}`);
  console.log(`${r}: ${msgs.length ? msgs.join("\n   ") : "clean"}`);
  bad += msgs.length;
  await page.close();
}
await browser.close();
process.exit(bad ? 1 : 0);
