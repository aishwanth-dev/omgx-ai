// Browser QA for the About journey, discipline models, contact backdrop, CTA-to-footer seam and fonts.
// Usage: node scripts/qa-scenes.mjs [what: about|caps|cta|seam|fonts|all] [width] [height] [baseUrl]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const what = process.argv[2] ?? "all";
const width = Number(process.argv[3] ?? 1440);
const height = Number(process.argv[4] ?? 900);
const base = process.argv[5] ?? "http://localhost:3000";
const tag = width < 800 ? "m390" : "d1440";
const out = "qa-output";
mkdirSync(out, { recursive: true });
const mobile = width < 800;

const browser = await chromium.launch({ channel: "msedge", args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const context = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile });
const page = await context.newPage();
const logs = [];
page.on("console", (m) => {
  if (["error", "warning"].includes(m.type())) logs.push(`[${m.type()}] ${m.text().slice(0, 300)}`);
});
page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));
page.on("request", (r) => {
  if (!r.url().startsWith(base) && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) logs.push(`[external] ${r.url()}`);
});

const open = async (path = "/") => {
  await page.goto(base + path, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".loader", { state: "detached", timeout: 25000 }).catch(() => {});
  if (path === "/") await page.waitForSelector(".caps__track", { state: "attached", timeout: 60000 });
  else await page.waitForSelector(".hwf-root", { state: "attached", timeout: 60000 });
  await page.waitForTimeout(2000);
};
const go = async (y, wait = 1400) => {
  await page.evaluate((v) => window.scrollTo(0, v), Math.round(y));
  await page.waitForTimeout(wait);
};
const top = (sel) => page.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + scrollY, sel);
const shot = (name) => page.screenshot({ path: `${out}/${tag}-${name}.png` });

if (what === "about" || what === "all") {
  await open("/");
  const t = await top(".journey-track");
  const info = await page.evaluate(() => {
    const el = document.querySelector(".journey-track");
    return { h: el.offsetHeight, vh: innerHeight };
  });
  console.log("about track", JSON.stringify(info));
  const dist = info.h - info.vh;
  for (let i = 0; i < 4; i++) {
    await go(t + dist * ((i + 0.5) / 4), 1800);
    const st = await page.evaluate(() => ({
      pressed: [...document.querySelectorAll(".journey__btn")].findIndex((b) => b.getAttribute("aria-pressed") === "true"),
      live: document.querySelector(".journey-ring")?.getAttribute("data-live"),
      canvas: !!document.querySelector(".journey-ring canvas"),
      dots: [...document.querySelectorAll(".journey-ring__dot")].map((d) => {
        const r = d.getBoundingClientRect();
        return [Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2), d.dataset.active ?? ""];
      }),
      ring: (() => { const r = document.querySelector(".journey-ring").getBoundingClientRect(); return [Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2), Math.round(r.width)]; })(),
    }));
    console.log("stage", i + 1, JSON.stringify(st));
    await shot(`about-stage${i + 1}`);
  }
  await go(t + dist + height * 0.6, 900);
  await shot("about-after");
}

if (what === "caps" || what === "all") {
  await open("/");
  const t = await top(".caps__track");
  const dist = await page.evaluate(() => document.querySelector(".caps__track").offsetHeight - innerHeight);
  const n = 4;
  const names = ["neural", "robot", "headset", "board"];
  for (let i = 0; i < n; i++) {
    if (mobile) {
      await page.locator(".cap-row__tab").nth(i).click();
      await page.waitForTimeout(1800);
      await page.evaluate((i) => {
        // Park the viewport so the visual's lower part and the open row's header are both visible.
        const tab = document.querySelectorAll(".cap-row__tab")[i];
        const vis = document.querySelector(".cap-visual");
        const y = tab.getBoundingClientRect().top + scrollY - innerHeight * 0.44 + 2;
        window.__target = y;
        window.scrollTo(0, window.__target);
      }, i);
      await page.waitForTimeout(2200);
      console.log("caps", i, await page.evaluate(() => ({ active: [...document.querySelectorAll(".cap-row")].findIndex((r) => r.classList.contains("is-active")), canvas: !!document.querySelector(".cap-visual canvas") })));
      await shot(`caps-${names[i]}`);
      continue;
    }
    await go(t + (dist * (i + 0.5)) / n, 2600);
    console.log("caps", i, await page.evaluate(() => ({ active: [...document.querySelectorAll(".cap-row")].findIndex((r) => r.classList.contains("is-active")), canvas: !!document.querySelector(".cap-visual canvas") })));
    await shot(`caps-${names[i]}`);
  }
}

if (what === "cta" || what === "all") {
  await open("/");
  const t = await top("#start");
  await go(t - 40, 3000);
  await shot("cta-form");
  console.log("cta canvas", await page.evaluate(() => !!document.querySelector(".final-cta__visual canvas")));
}

if (what === "seam" || what === "all") {
  for (const path of ["/", "/about", "/contact"]) {
    await open(path);
    const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    await go(max, 2500);
    const name = path === "/" ? "home" : path.slice(1);
    await shot(`seam-${name}`);
    // Per-row median luminance of the screenshot across the boundary above the footer.
    const foot = await page.evaluate(() => Math.round(document.querySelector(".hwf-root").getBoundingClientRect().top));
    const b64 = (await page.screenshot()).toString("base64");
    const res = await page.evaluate(
      async ({ b64, foot }) => {
        const img = new Image();
        img.src = "data:image/png;base64," + b64;
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        const g = c.getContext("2d", { willReadFrequently: true });
        g.drawImage(img, 0, 0);
        const bands = 16;
        const y0 = Math.max(80, foot - 30);
        const y1 = Math.min(img.height - 1, foot + 80);
        const cols = Array.from({ length: bands }, () => []);
        for (let y = y0; y <= y1; y++) {
          const d = g.getImageData(0, y, img.width, 1).data;
          for (let b = 0; b < bands; b++) {
            const v = [];
            for (let x = Math.floor((b * img.width) / bands); x < Math.floor(((b + 1) * img.width) / bands); x++) v.push(0.2126 * d[x * 4] + 0.7152 * d[x * 4 + 1] + 0.0722 * d[x * 4 + 2]);
            v.sort((a, c) => a - c);
            cols[b].push(v[v.length >> 1]);
          }
        }
        // Median per band and row; smooth over 3 rows to ignore grain; largest adjacent step in any band.
        let max = 0;
        let at = 0;
        let band = 0;
        for (let b = 0; b < bands; b++) {
          const lum = cols[b];
          const sm = lum.map((_, i) => (lum[Math.max(0, i - 1)] + lum[i] + lum[Math.min(lum.length - 1, i + 1)]) / 3);
          for (let i = 1; i < sm.length; i++) if (Math.abs(sm[i] - sm[i - 1]) > max) ((max = Math.abs(sm[i] - sm[i - 1])), (at = y0 + i), (band = b));
        }
        const s0 = cols[0];
        return { max: +max.toFixed(2), at, band, y0, band0: [0, 30, 60, 90, 120, 150, 180, 210].map((o) => +(s0[Math.min(s0.length - 1, o)] ?? 0).toFixed(1)) };
      },
      { b64, foot },
    );
    console.log("seam", path, "footerTop", foot, JSON.stringify(res));
  }
}

if (what === "fonts" || what === "all") {
  await open("/");
  const f = await page.evaluate(async () => {
    await document.fonts.ready;
    const q = (s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const c = getComputedStyle(el);
      return { family: c.fontFamily.slice(0, 80), weight: c.fontWeight, size: c.fontSize, stretch: c.fontStretch };
    };
    return {
      body: q("body"),
      h1: q("h1"),
      h2: q("h2"),
      utility: q(".t-utility"),
      btn: q(".btn"),
      loaded: [...document.fonts].filter((x) => x.status === "loaded").map((x) => `${x.family} ${x.weight}`),
    };
  });
  console.log("fonts", JSON.stringify(f, null, 1));
  await go(0, 500);
  await shot("fonts-top");
}

console.log("logs", logs.length ? "\n" + [...new Set(logs)].slice(0, 15).join("\n") : "none");
await browser.close();
