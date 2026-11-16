// QA for "What we do": stacked cards under a pinned stage on phones/tablets (desktop must just not overflow).
// Scans the track, asserts: open card never meets the stage, the card area and open card stay in the viewport, no horizontal overflow,
// the track adds <= 230svh of scroll, the next section follows the pin release with no big gap, a tap on a title bar re-selects its card.
// Shots at progress 0/25/50/75/100% in qa-output/wwd/. Usage: node scripts/qa-wwd.mjs [baseUrl] [--sizes=390x844,...]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const args = process.argv.slice(2);
const base = args.find((a) => a.startsWith("http")) ?? "http://localhost:3000";
const sizes = (args.find((a) => a.startsWith("--sizes="))?.split("=")[1] ?? "390x844,360x740,430x932,768x1024,1440x900")
  .split(",").map((s) => s.split("x").map(Number));
mkdirSync("qa-output/wwd", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", args: ["--use-gl=angle", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
let bad = 0;
for (const [w, h] of sizes) {
  const phone = w < 961;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: phone, hasTouch: phone, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message.slice(0, 160)));
  page.on("console", (m) => m.type() === "error" && errs.push(m.text().slice(0, 160)));
  await page.goto(base + "/", { waitUntil: "load" });
  await page.waitForSelector(".loader", { state: "detached", timeout: 40000 }).catch(() => {});
  await page.waitForSelector(".cap-row__tab", { timeout: 60000 });
  await page.waitForTimeout(1500);
  const tag = `${w}x${h}`;
  const geo = await page.evaluate(() => {
    const t = document.querySelector(".caps__track").getBoundingClientRect();
    return { top: Math.round(scrollY + t.top), height: Math.round(t.height) };
  });
  const scroll = geo.height - h; // pinned scroll distance
  const problems = [];
  if (phone && scroll > 2.3 * h + 1) problems.push(`track adds ${(scroll / h * 100).toFixed(0)}svh > 230svh`);
  const hit = (a, b) => a.t < b.b - 1 && b.t < a.b - 1 && a.l < b.r && b.l < a.r;
  const shots = new Set([0, 5, 10, 15, 20]);
  for (let s = 0; s <= 20; s++) {
    await page.evaluate((y) => window.scrollTo(0, y), geo.top + (s / 20) * scroll);
    await page.waitForTimeout(shots.has(s) ? 500 : 200);
    const m = await page.evaluate(`(${(() => {
      const R = (e) => { const r = e.getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom), l: Math.round(r.left), r: Math.round(r.right) }; };
      const rows = [...document.querySelectorAll(".cap-row")];
      const act = rows.findIndex((e) => e.classList.contains("is-active"));
      return {
        stage: R(document.querySelector(".cap-visual__canvas")), area: R(document.querySelector(".caps__tablist")),
        card: R(rows[act]), link: R(rows[act].querySelector(".link-arrow")), act, ox: document.documentElement.scrollWidth > innerWidth,
        tops: rows.map((e) => Math.round(e.getBoundingClientRect().top)), op: rows.map((e) => +(+getComputedStyle(e.firstElementChild).opacity).toFixed(2)),
      };
    }).toString()})()`);
    const p = [];
    if (m.ox) p.push("overflowX");
    if (phone) {
      if (hit(m.card, m.stage)) p.push("open card meets stage");
      if (m.area.t < m.stage.b - 1) p.push("card area overlaps stage");
      if (m.area.b > h + 1 || m.area.t < 0) p.push("stack outside viewport");
      if (s === 20 && m.link.b > m.area.b - 4) p.push("newest card link cut off");
      if (m.card.t - m.area.t <= m.act * 38 + 2 && m.card.b > m.area.b + 1) p.push("landed open card spills out of the area");
    }
    if (p.length) problems.push(`@${s * 5}% ${p.join(", ")}`);
    if (shots.has(s)) {
      console.log(`${tag} ${s * 5}% act=${m.act} tops=${m.tops} op=${m.op} stage=${m.stage.t}-${m.stage.b} area=${m.area.t}-${m.area.b}`);
      await page.screenshot({ path: `qa-output/wwd/${tag}-p${String(s * 5).padStart(3, "0")}.png` });
    }
  }
  // After the pin releases the next section starts right below the section.
  await page.evaluate((y) => window.scrollTo(0, y), geo.top + scroll + h * 0.5);
  await page.waitForTimeout(300);
  const gap = await page.evaluate(() => {
    const c = document.querySelector(".caps"), n = c.nextElementSibling;
    return n ? Math.round(n.getBoundingClientRect().top - c.getBoundingClientRect().bottom) : null;
  });
  console.log(`${tag} track=${geo.height}px extra=${(scroll / h * 100).toFixed(0)}svh nextGap=${gap}`);
  if (gap !== null && Math.abs(gap) > 8) problems.push(`gap to next section ${gap}px`);
  if (phone) {
    // Tap: from the end of the track, the first card's title bar selects card 0 again.
    await page.evaluate((y) => window.scrollTo(0, y), geo.top + scroll);
    await page.waitForTimeout(500);
    await page.locator(".cap-row__tab").first().tap().catch(() => {});
    await page.waitForTimeout(1800);
    const act = await page.evaluate(() => [...document.querySelectorAll(".cap-row")].findIndex((e) => e.classList.contains("is-active")));
    if (act !== 0) problems.push(`tap on title bar 0 left card ${act} active`);
  }
  console.log(`${tag}: ${problems.join("; ") || "ok"}`);
  if (problems.length) bad++;
  if (errs.length) console.log(tag, "errors:", [...new Set(errs)]);
  await ctx.close();
}
await browser.close();
process.exit(bad ? 1 : 0);