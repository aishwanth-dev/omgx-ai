// QA for company details and removed wording at 1440 and 390. Usage: node scripts/qa-contact-details.mjs
import { chromium } from "playwright";

const BANNED = [/to be confirmed/i, /pending/i, /has not been supplied/i, /privacy policy will be/i, /awaiting/i, /coming soon/i, /placeholder/i];
const b = await chromium.launch({ channel: "msedge", args: ["--use-gl=angle", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
for (const [w, h] of [[1440, 900], [390, 844]]) {
  for (const path of ["/contact", "/about", "/"]) {
    const c = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500 });
    const p = await c.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(e.message.slice(0, 120)));
    p.on("console", (m) => m.type() === "error" && errs.push(m.text().slice(0, 120)));
    await p.goto("http://localhost:3000" + path, { waitUntil: "load" });
    await p.waitForSelector(".loader", { state: "detached", timeout: 40000 }).catch(() => {});
    await p.waitForTimeout(1500);
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await p.waitForTimeout(1000);
    const m = await p.evaluate(() => {
      // Visible text: skip script/style payloads (class names such as founder__placeholder live in the RSC payload).
      const text = (document.body.textContent || "").replace(/\s+/g, " ");
      const visible = [...document.body.querySelectorAll("*")]
        .filter((e) => !["SCRIPT", "STYLE", "NOSCRIPT"].includes(e.tagName))
        .map((e) => [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(" "))
        .join(" ");
      return {
        text: visible || text,
        ox: document.documentElement.scrollWidth > innerWidth,
        mailto: [...document.querySelectorAll('a[href^="mailto:"]')].map((a) => a.getAttribute("href")),
        tel: document.querySelectorAll('a[href^="tel:"]').length,
        social: [...document.querySelectorAll(".social-chip")].map((a) => a.href),
        pills: [...document.querySelectorAll(".social-pill")].map((a) => a.href),
        hasAddr: visible.includes("Ramanjeneya Nagar") && visible.includes("560061"),
      };
    });
    const banned = BANNED.filter((r) => r.test(m.text)).map(String);
    const real = errs.filter((e) => !/THREE\.Clock/.test(e));
    console.log(w, path, JSON.stringify({ ...m, text: undefined, banned, hasSupport: m.mailto.includes("mailto:support@omgxai.com") }), real);
    await c.close();
  }
}
await b.close();
