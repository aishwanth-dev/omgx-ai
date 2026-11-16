// QA for the proof text, hero title and manifesto fixes. Usage: node scripts/qa-fixpack.mjs [baseUrl]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3000";
const out = "qa-output";
mkdirSync(out, { recursive: true });
const sizes = [
  [1440, 900],
  [1280, 720],
  [1920, 1080],
  [390, 844],
  [834, 1194],
];
const browser = await chromium.launch({ channel: "msedge", args: ["--use-angle=d3d11", "--enable-gpu"] });
for (const [w, h] of sizes) {
  const mobile = w < 800;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".loader", { state: "detached", timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(4200);
  await page.screenshot({ path: `${out}/fix-hero-${w}x${h}.png` });
  const hero = await page.evaluate(() => {
    const pick = (s) => {
      const b = document.querySelector(s)?.getBoundingClientRect();
      return b ? [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)] : null;
    };
    return {
      top: pick(".story__top"), title: pick(".story__title"), phrases: pick(".story__phrases"),
      foot: pick(".story__foot"), left: pick(".story__foot-left"), right: pick(".story__foot-right"),
      eyebrow: !!document.querySelector(".story__eyebrow"),
      cy: getComputedStyle(document.querySelector(".story__stage") ?? document.body).getPropertyValue("--hero-cy"),
      hh: getComputedStyle(document.querySelector(".story__stage") ?? document.body).getPropertyValue("--hero-h"),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      name: document.querySelector("h1")?.textContent,
    };
  });
  console.log(w, h, "HERO", JSON.stringify(hero));
  if (w === 1440 || w === 390) {
    for (const t of [1500, 2400]) {
      await page.waitForTimeout(t);
      await page.screenshot({ path: `${out}/fix-hero-${w}x${h}-t${t}.png`, clip: { x: 0, y: 0, width: w, height: Math.min(h, 360) } });
    }
  }
  // Manifesto end state.
  const dist = await page.evaluate(() => {
    const s = document.querySelector(".story").getBoundingClientRect();
    return s.height - innerHeight;
  });
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(dist * 0.985));
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${out}/fix-manifesto-${w}x${h}.png` });
  const man = await page.evaluate(() => {
    const els = [...document.querySelectorAll(".story__manifesto-line, .story__manifesto-sub")].map((e) => {
      const b = e.getBoundingClientRect();
      return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom), getComputedStyle(e).opacity];
    });
    return els;
  });
  console.log(w, h, "MANIFESTO", JSON.stringify(man));
  // Proof section.
  const proofInfo = await page.evaluate(() => {
    const t = document.querySelector(".proof__track");
    const r = t.getBoundingClientRect();
    return { top: r.top + scrollY, h: r.height, vh: innerHeight, motion: document.documentElement.classList.contains("motion") };
  });
  const range = proofInfo.h - proofInfo.vh;
  for (const p of [0.5, 1]) {
    const y = Math.round(proofInfo.top + (w >= 900 ? range * p : 0) - (w >= 900 ? 0 : 0));
    if (w >= 900) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
    } else {
      await page.evaluate((frac) => {
        const t = document.querySelector(".proof__stage").getBoundingClientRect();
        window.scrollTo(0, t.top + scrollY + (t.height - innerHeight) * frac);
      }, p === 1 ? 0.55 : 0.1);
    }
    await page.waitForTimeout(1600);
    const tag = `${w}x${h}-p${String(Math.round(p * 100)).padStart(3, "0")}`;
    await page.screenshot({ path: `${out}/fix-proof-${tag}.png` });
    const head = await page.evaluate(() => {
      const hd = document.querySelector(".proof__head").getBoundingClientRect();
      const svg = document.querySelector(".proof__splines");
      return { head: [hd.left, hd.top, hd.right, hd.bottom].map(Math.round), clear: svg.dataset.clear, cx: svg.style.getPropertyValue("--clear-x"), cy: svg.style.getPropertyValue("--clear-y") };
    });
    console.log(w, h, "PROOF", p, JSON.stringify(head));
    // Contrast: hide the text, sample the real background under the head block, compare with the paragraph colour.
    const hideTxt = await page.addStyleTag({ content: ".proof__head *{color:transparent!important;text-shadow:none!important}" });
    const bg = await page.screenshot({ clip: { x: Math.max(0, head.head[0]), y: Math.max(0, head.head[1]), width: Math.max(2, head.head[2] - head.head[0]), height: Math.max(2, head.head[3] - head.head[1]) } });
    const worst = await page.evaluate(async (b64) => {
      const img = new Image();
      img.src = "data:image/png;base64," + b64;
      await img.decode();
      const cv = document.createElement("canvas");
      cv.width = img.width; cv.height = img.height;
      const g = cv.getContext("2d");
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, cv.width, cv.height).data;
      const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      let maxL = 0;
      for (let i = 0; i < d.length; i += 4) maxL = Math.max(maxL, 0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]));
      // paragraph is rgba(255,255,255,0.82) over the brightest background pixel
      const a = 0.82, fg = a * 1 + (1 - a) * maxL; // approx luminance blend
      return { maxBgLum: +maxL.toFixed(4), contrast: +((fg + 0.05) / (maxL + 0.05)).toFixed(2) };
    }, bg.toString("base64"));
    console.log(w, h, "CONTRAST", p, JSON.stringify(worst));
    await hideTxt.evaluate((e) => e.remove());
    await page.screenshot({
      path: `${out}/fix-proof-zoom-${tag}.png`,
      clip: { x: Math.max(0, head.head[0] - 20), y: Math.max(0, head.head[1] - 20), width: Math.min(w - Math.max(0, head.head[0] - 20), head.head[2] - head.head[0] + 140), height: Math.min(h - Math.max(0, head.head[1] - 20), head.head[3] - head.head[1] + 40) },
    }).catch((e) => console.log("zoom clip failed", e.message.slice(0, 80)));
  }
  console.log(w, h, "errors", errors.length, errors.slice(0, 3));
  await ctx.close();
}
await browser.close();
