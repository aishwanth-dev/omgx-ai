// QA for the Work section, the closing CTA with its model, the footer seam and fonts.
// Usage: node scripts/qa-sections.mjs [baseUrl]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const base = process.argv[2] || "http://localhost:3000";
const out = "qa-output";
mkdirSync(out, { recursive: true });
const sizes = [
  { w: 1440, h: 900, tag: "1440" },
  { w: 390, h: 844, tag: "390" },
  { w: 834, h: 1194, tag: "834" },
];
const seamPages = ["/", "/about", "/contact", "/work", "/capabilities", "/products-research"];

const browser = await chromium.launch({ channel: "msedge", args: ["--use-gl=angle", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const cdn = [];
const report = { fonts: {}, seam: {}, misc: {} };

async function open(size, path) {
  const ctx = await browser.newContext({ viewport: { width: size.w, height: size.h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (!/^(localhost|127\.0\.0\.1)$/.test(u.hostname) && u.protocol.startsWith("http")) cdn.push(r.url());
  });
  for (let i = 0; i < 8; i++) {
    await page.goto(base + path, { waitUntil: "load" });
    await page.waitForTimeout(2500);
    if (await page.$("footer.hwf-root")) break;
    await page.waitForTimeout(15000);
  }
  await page.addStyleTag({ content: ".grain{display:none!important}" });
  return { ctx, page };
}

const scrollToEl = async (page, sel, offset = 0) => {
  await page.evaluate(
    ([s, o]) => {
      const el = document.querySelector(s);
      const y = el.getBoundingClientRect().top + window.scrollY - o;
      window.scrollTo(0, y);
    },
    [sel, offset],
  );
};

async function lum(page, buf, x0, x1) {
  const b64 = buf.toString("base64");
  return page.evaluate(
    async ([data, a, b]) => {
      const img = new Image();
      img.src = "data:image/png;base64," + data;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext("2d");
      g.drawImage(img, 0, 0);
      const px = g.getImageData(a, 0, b - a, img.height).data;
      const rows = [];
      for (let y = 0; y < img.height; y++) {
        let s = 0;
        for (let x = 0; x < b - a; x++) {
          const i = (y * (b - a) + x) * 4;
          s += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
        }
        rows.push(s / (b - a));
      }
      return rows;
    },
    [b64, x0, x1],
  );
}

for (const size of sizes) {
  // ---- Work section ----
  {
    const { ctx, page } = await open(size, "/");
    await scrollToEl(page, "section.wk", 80);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/${size.tag}-work-reveal-early.png` });
    await page.waitForTimeout(2200);
    await scrollToEl(page, "section.wk", 60);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${out}/${size.tag}-work.png` });
    const row = page.locator(".wk__row").nth(2);
    await row.hover();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${out}/${size.tag}-work-hover.png` });
    report.misc[`work-${size.tag}`] = await page.evaluate(() => ({
      rows: document.querySelectorAll(".wk__row").length,
      hrefs: [...document.querySelectorAll(".wk__row")].map((a) => a.getAttribute("href")),
      cta: document.querySelector(".wk__cta a")?.getAttribute("href"),
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
    }));
    if (size.tag === "1440") {
      report.fonts = await page.evaluate(async () => {
        await document.fonts.ready;
        const cs = (s) => {
          const el = document.querySelector(s);
          if (!el) return null;
          const c = getComputedStyle(el);
          return { family: c.fontFamily.slice(0, 60), weight: c.fontWeight };
        };
        return {
          body: cs("body"),
          h1: cs("h1"),
          wkTitle: cs(".wk__title"),
          lead: cs(".wk__lead"),
          btn: cs(".btn"),
          loaded: [...document.fonts].filter((f) => f.status === "loaded").map((f) => `${f.family} ${f.weight}`),
          synthesis: getComputedStyle(document.documentElement).fontSynthesis,
        };
      });
    }
    await ctx.close();
  }
  // ---- Start a project ----
  {
    const { ctx, page } = await open(size, "/");
    await scrollToEl(page, "#start", size.w < 600 ? 60 : 40);
    await page.waitForTimeout(5000);
    await page.screenshot({ path: `${out}/${size.tag}-cta.png` });
    report.misc[`cta-${size.tag}`] = await page.evaluate(() => {
      const v = document.querySelector(".final-cta__visual");
      const c = v?.querySelector("canvas");
      const f = document.querySelector(".final-cta__form input");
      const r = f?.getBoundingClientRect();
      const top = r ? document.elementFromPoint(r.left + 20, r.top + r.height / 2) : null;
      return {
        canvas: !!c,
        opacity: v && getComputedStyle(v).opacity,
        canvasPE: c && getComputedStyle(c).pointerEvents,
        hitIsInput: top === f,
        rect: v && JSON.stringify(v.getBoundingClientRect().toJSON()),
      };
    });
    // scroll reaction: rotation changes between two scroll positions
    await scrollToEl(page, "#start", size.w < 600 ? -200 : -250);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${out}/${size.tag}-cta-scrolled.png` });
    await ctx.close();
  }
  // ---- Seams ----
  for (const path of size.tag === "834" ? [] : seamPages) {
    const { ctx, page } = await open(size, path);
    if (!(await page.$("footer.hwf-root"))) { report.seam[`${size.tag} ${path}`] = "no footer (status/err)"; await ctx.close(); continue; }
    const yseam = Math.round(size.h * 0.5);
    await page.evaluate((y) => {
      const f = document.querySelector("footer.hwf-root");
      window.scrollTo(0, f.getBoundingClientRect().top + window.scrollY - y);
    }, yseam);
    await page.waitForTimeout(1500);
    const info = await page.evaluate((y) => {
      const f = document.querySelector("footer.hwf-root");
      return Math.round(f.getBoundingClientRect().top) - y;
    }, yseam);
    const buf = await page.screenshot();
    if (path === "/" || path === "/about") await page.screenshot({ path: `${out}/${size.tag}-seam${path === "/" ? "-home" : "-about"}.png` });
    const rows = await lum(page, buf, 0, 8);
    let maxStep = 0;
    let at = 0;
    for (let y = Math.max(1, yseam - 140); y < Math.min(rows.length, yseam + 140); y++) {
      const d = Math.abs(rows[y] - rows[y - 1]);
      if (d > maxStep) {
        maxStep = d;
        at = y;
      }
    }
    // right gutter strip (the glow sits on the right)
    const rows2 = await lum(page, buf, size.w - 8, size.w);
    let maxStep2 = 0;
    for (let y = Math.max(1, yseam - 140); y < Math.min(rows2.length, yseam + 140); y++) {
      maxStep2 = Math.max(maxStep2, Math.abs(rows2[y] - rows2[y - 1]));
    }
    report.seam[`${size.tag} ${path}`] = {
      footerTopOffset: info,
      maxStepLeftStrip: +maxStep.toFixed(2),
      at,
      maxStepRightStrip: +maxStep2.toFixed(2),
      sample: [yseam - 60, yseam - 20, yseam, yseam + 20, yseam + 60].map((y) => +rows2[y].toFixed(1)),
    };
    await ctx.close();
  }
}
report.cdnRequests = [...new Set(cdn)];
console.log(JSON.stringify(report, null, 1));
await browser.close();
