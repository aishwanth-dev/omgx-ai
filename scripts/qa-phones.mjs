// Phone hero check at several sizes: node scripts/qa-phones.mjs [baseUrl]
import { chromium } from "playwright";
const base = process.argv[2] ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "msedge", args: ["--use-angle=d3d11", "--enable-gpu"] });
for (const [w, h] of [[390, 844], [360, 640], [430, 932]]) {
  const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await page.getByText(/skip intro/i).first().click({ timeout: 4000 }).catch(() => {});
  await page.waitForFunction(() => !/skip intro/i.test(document.body.innerText), null, { timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `qa-output/phone-${w}x${h}.png` });
  const r = await page.evaluate(() => {
    const b = (s) => { const e = document.querySelector(s)?.getBoundingClientRect(); return e && [Math.round(e.left), Math.round(e.top), Math.round(e.right), Math.round(e.bottom)]; };
    return { skip: b(".story__skip"), h1: b(".story__title"), foot: b(".story__foot"), lead: b(".story__lead"), vh: innerHeight, over: document.documentElement.scrollWidth - innerWidth };
  });
  console.log(w, h, JSON.stringify(r));
  await context.close();
}
await browser.close();
