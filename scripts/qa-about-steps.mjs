// About journey steps + other tracked sections: arrival, restore, route round trip, resize, clicks, fast scrubbing.
// Asserts via DOM that the active step matches the scroll progress, clicks land inside the step's range,
// the ring rider and the stage label match the active index, and there are no console errors.
// Usage: node scripts/qa-about-steps.mjs [baseUrl] [--sizes=390x844,1440x900]   (exit 1 on any failure)
import { chromium } from "playwright";

const args = process.argv.slice(2);
const base = args.find((a) => a.startsWith("http")) ?? "http://localhost:3000";
const sizes = (args.find((a) => a.startsWith("--sizes="))?.split("=")[1] ?? "390x844,1440x900").split(",").map((s) => s.split("x").map(Number));
const browser = await chromium.launch({ channel: "msedge", args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
let failures = 0;
let lastTick = Date.now();
let lastMsg = "start";
const trace = (m) => {
  lastTick = Date.now();
  lastMsg = m;
  if (process.env.QA_TRACE) console.error(new Date().toISOString().slice(11, 19), m);
};
// Watchdog: a frozen renderer must fail the run with a JS stack instead of hanging it.
setInterval(async () => {
  if (process.env.QA_TRACE) console.error('tick', Math.round((Date.now() - lastTick) / 1000));
  if (Date.now() - lastTick < 60000) return;
  console.error(`WATCHDOG: no progress for 60s after "${lastMsg}"`);
  for (const c of browser.contexts()) {
    for (const p of c.pages()) {
      try {
        const cdp = await c.newCDPSession(p);
        await cdp.send("Debugger.enable");
        const paused = new Promise((r) => cdp.on("Debugger.paused", r));
        await cdp.send("Debugger.pause");
        const ev = await Promise.race([paused, new Promise((r) => setTimeout(() => r(null), 5000))]);
        console.error(ev ? ev.callFrames.slice(0, 10).map((fr) => `  ${fr.functionName || "(anon)"} ${fr.url.split("/").slice(-1)[0]}:${fr.location.lineNumber}`).join("\n") : "  renderer unresponsive (no pause)");
      } catch (e) {
        console.error("  cdp failed", String(e.message).slice(0, 100));
      }
    }
  }
  process.exit(2);
}, 5000).unref();

const readState = () => {
  const t = document.querySelector(".journey-track");
  if (!t) return null;
  const r = t.getBoundingClientRect();
  const start = r.top + scrollY;
  const end = start + r.height - innerHeight;
  const p = (scrollY - start) / (end - start);
  const btns = [...document.querySelectorAll(".journey__btn")];
  const n = btns.length;
  const active = btns.findIndex((b) => b.getAttribute("aria-pressed") === "true");
  const label = document.querySelector(".journey__num")?.textContent ?? "";
  const rider = document.querySelector(".journey-ring__rider")?.style.transform ?? "";
  const rot = parseFloat((rider.match(/rotate\(([-\d.]+)deg\)/) ?? [])[1] ?? "NaN");
  return { y: Math.round(scrollY), start, end, p, n, active, label, rot };
};

const settle = async (page, ms = 350) => {
  let last = -1;
  let stable = 0;
  for (let i = 0; i < 60 && stable < ms; i += 1) {
    const y = await page.evaluate(() => Math.round(scrollY));
    stable = y === last ? stable + 50 : 0;
    last = y;
    await page.waitForTimeout(50);
  }
};

for (const [w, h] of sizes) {
  const phone = w < 961;
  const tag = `${w}x${h}`;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: phone, hasTouch: phone, deviceScaleFactor: 1 });
  const errs = [];
  const problems = [];
  const fail = (m) => problems.push(m);

  const open = async (url = "/", { seen = true } = {}) => {
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errs.push(e.message.slice(0, 200)));
    page.on("console", (m) => m.type() === "error" && errs.push(m.text().slice(0, 200)));
    if (seen) await page.addInitScript(() => sessionStorage.setItem("omgx-intro-seen", "1"));
    trace(`open ${url}`);
    await page.goto(base + url, { waitUntil: "load" });
    trace("loaded");
    await page.waitForSelector(".omx-loader", { state: "detached", timeout: 90000 }).catch(() => {});
    await page.waitForSelector(".journey-track", { state: "attached", timeout: 60000 });
    trace("track");
    await page.waitForTimeout(1500);
    return page;
  };

  // Active step must follow progress (a boundary tolerance of 0.03), and ring + label must follow the active step.
  const consistent = async (page, name, expectIndex) => {
    trace(name);
    await settle(page);
    const s = await page.evaluate(readState);
    if (!s) return fail(`${name}: no journey track`);
    const p = Math.min(1, Math.max(0, s.p));
    const exp = Math.min(s.n - 1, Math.floor(p * s.n));
    const nearEdge = [1, 2, 3].some((k) => Math.abs(p - k / s.n) < 0.03);
    const okIndex = s.active === exp || (nearEdge && Math.abs(s.active - exp) === 1);
    const info = `y=${s.y} p=${s.p.toFixed(2)} active=${s.active + 1}`;
    if (!okIndex) fail(`${name}: ${info} expected ${exp + 1}`);
    if (s.p < 0.25 && s.active !== 0) fail(`${name}: ${info} not 01 below progress 0.25`);
    if (expectIndex !== undefined && s.active !== expectIndex) fail(`${name}: ${info} expected step ${expectIndex + 1}`);
    if (s.label !== String(s.active + 1).padStart(2, "0")) fail(`${name}: label ${s.label} vs active ${s.active + 1}`);
    if (Math.abs(s.rot - (s.active * 360) / s.n) > 0.5) fail(`${name}: ring rotation ${s.rot} vs active ${s.active + 1}`);
    return s;
  };

  const toProgress = async (page, p) => {
    trace("toProgress " + p);
    await page.evaluate((q) => {
      const t = document.querySelector(".journey-track");
      const r = t.getBoundingClientRect();
      const start = r.top + scrollY;
      scrollTo(0, start + q * (r.height - innerHeight));
    }, p);
    await settle(page);
  };

  // (a) fresh load (loader included), scroll to the section by wheel.
  {
    const page = await open("/", { seen: false });
    await consistent(page, `${tag} a/arrive-top`, 0);
    await page.mouse.move(w / 2, h / 2);
    for (let i = 0; i < 80; i += 1) {
      const top = await page.evaluate(() => document.querySelector(".journey-track").getBoundingClientRect().top);
      if (top < h * 0.6) break;
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(120);
    }
    await consistent(page, `${tag} a/arrive-wheel`);
    await page.mouse.wheel(0, 300);
    await consistent(page, `${tag} a/in-section`);
    await page.close();
  }

  // (b) restored scroll position inside the section, and an anchor past the section.
  {
    const page = await open();
    await toProgress(page, 0.62);
    await page.reload({ waitUntil: "load" });
    await page.waitForSelector(".omx-loader", { state: "detached", timeout: 90000 }).catch(() => {});
    await page.waitForTimeout(2500);
    await consistent(page, `${tag} b/reload-restored`);
    await toProgress(page, 0.05);
    await page.reload({ waitUntil: "load" });
    await page.waitForSelector(".omx-loader", { state: "detached", timeout: 90000 }).catch(() => {});
    await page.waitForTimeout(2500);
    await consistent(page, `${tag} b/reload-early`);
    await page.close();
    const anchor = await open("/#about-title");
    await consistent(anchor, `${tag} b/anchor`);
    await anchor.close();
  }

  // (c) client-side round trip, then scroll to the section.
  {
    const page = await open();
    await page.evaluate(() => document.querySelector('.about-home a[href="/about"]').click());
    await page.waitForURL("**/about", { timeout: 30000 });
    await page.waitForTimeout(1200);
    await page.evaluate(() => (document.querySelector('.site-header a[href="/"]') ?? document.querySelector('a[href="/"]')).click());
    await page.waitForURL((u) => new URL(u).pathname === "/", { timeout: 30000 });
    await page.waitForSelector(".journey-track", { timeout: 30000 });
    await page.waitForTimeout(1500);
    await consistent(page, `${tag} c/back-home`);
    await page.mouse.move(w / 2, h / 2);
    for (let i = 0; i < 80; i += 1) {
      const top = await page.evaluate(() => document.querySelector(".journey-track").getBoundingClientRect().top);
      if (top < h * 0.6) break;
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(120);
    }
    await consistent(page, `${tag} c/arrive-after-nav`);
    await page.close();
  }

  // (d) resize mid-section: portrait <-> landscape.
  {
    const page = await open();
    await toProgress(page, 0.5);
    await consistent(page, `${tag} d/before`);
    await page.setViewportSize({ width: h, height: w });
    await page.waitForTimeout(1200);
    await consistent(page, `${tag} d/swapped`);
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(1200);
    await consistent(page, `${tag} d/restored`);
    await page.close();
  }

  // (e) real clicks 01, 02, 03, 04, 02, 01 and a repeated click on the active step.
  {
    const page = await open();
    await toProgress(page, 0.5);
    for (const i of [0, 1, 2, 3, 1, 0, 0]) {
      trace("click " + i);
      const before = await page.evaluate(readState);
      const btn = page.locator(".journey__btn").nth(i);
      if (phone) await btn.tap();
      else await btn.click();
      trace("clicked " + i);
      await page.waitForTimeout(1500);
      const s = await consistent(page, `${tag} e/click-${i + 1}`, i);
      if (!s) continue;
      const lo = s.start + (i / s.n) * (s.end - s.start) - 2;
      const hi = s.start + ((i + 1) / s.n) * (s.end - s.start) + 2;
      if (s.y < lo || s.y > hi) fail(`${tag} e/click-${i + 1}: y=${s.y} outside [${Math.round(lo)}, ${Math.round(hi)}]`);
      if (before.active === i && Math.abs(before.y - s.y) > 2) fail(`${tag} e/click-${i + 1}: active step click moved ${before.y} -> ${s.y}`);
    }
    await page.close();
  }

  // (f) quick scrubbing up and down.
  {
    const page = await open();
    await toProgress(page, 0.1);
    await page.mouse.move(w / 2, h / 2);
    for (const dy of [900, 700, -600, 800, -900, -500, 400, -300, 600, -700]) {
      await page.mouse.wheel(0, dy);
      await page.waitForTimeout(60);
    }
    await consistent(page, `${tag} f/scrub`);
    await page.close();
  }

  // "What we do" and the process deck.
  {
    const page = await open();
    const caps = await page.evaluate(() => {
      const t = document.querySelector(".caps__track");
      if (!t) return null;
      const r = t.getBoundingClientRect();
      return { start: r.top + scrollY, span: r.height - innerHeight };
    });
    if (!caps) fail(`${tag} caps: no .caps__track`);
    else {
      const capState = () =>
        page.evaluate(() => ({ y: Math.round(scrollY), act: [...document.querySelectorAll(".cap-row")].findIndex((e) => e.classList.contains("is-active")) }));
      await page.evaluate((y) => scrollTo(0, y - 60), caps.start);
      await settle(page);
      const arrive = await capState();
      if (arrive.act !== 0) fail(`${tag} caps/arrive: active ${arrive.act + 1} instead of 1`);
      const rows = await page.locator(".cap-row__tab").count();
      for (const i of [rows - 1, 1, 0, 2, 0]) {
        // Real pointer at a point where this tab is the hit target (a stacked card's bar can sit under the header).
        const pt = await page.evaluate((k) => {
          const tab = document.querySelectorAll(".cap-row__tab")[k];
          const r = tab.getBoundingClientRect();
          for (let f = 0.1; f < 1; f += 0.1) {
            const x = r.left + r.width * 0.5;
            const y = r.top + r.height * f;
            if (y > 0 && y < innerHeight && document.elementFromPoint(x, y)?.closest(".cap-row__tab") === tab) return { x, y };
          }
          return null;
        }, i);
        if (!pt) continue;
        if (phone) await page.touchscreen.tap(pt.x, pt.y);
        else await page.mouse.click(pt.x, pt.y);
        await page.waitForTimeout(1800);
        const s = await capState();
        if (s.act !== i) fail(`${tag} caps/click-${i + 1}: active ${s.act + 1}`);
        if (phone) {
          const lo = caps.start + (i / rows) * caps.span - 4;
          const hi = caps.start + ((i + 1) / rows) * caps.span + 4;
          if (s.y < lo || s.y > hi) fail(`${tag} caps/click-${i + 1}: y=${s.y} outside [${Math.round(lo)}, ${Math.round(hi)}]`);
        }
      }
    }
    const proc = await page.evaluate(() => {
      const t = document.querySelector(".process__track");
      if (!t) return null;
      const r = t.getBoundingClientRect();
      return { start: r.top + scrollY, span: r.height - innerHeight };
    });
    if (!proc) fail(`${tag} process: no .process__track`);
    else {
      await page.evaluate((y) => scrollTo(0, y - 60), proc.start);
      await settle(page);
      const act = () => page.evaluate(() => [...document.querySelectorAll(".process__step")].findIndex((e) => e.classList.contains("is-active")));
      if ((await act()) !== 0) fail(`${tag} process/arrive: step ${(await act()) + 1} instead of 1`);
      if (!phone) {
        await page.evaluate((y) => scrollTo(0, y), proc.start + proc.span);
        await settle(page);
        if ((await act()) < 3) fail(`${tag} process/end: step ${(await act()) + 1}`);
      }
    }
    await page.close();
  }

  const ignorable = (m) => /THREE\.Clock/i.test(m);
  const real = [...new Set(errs)].filter((m) => !ignorable(m));
  if (real.length) fail(`${tag} console errors: ${real.join(" | ")}`);
  console.log(`${tag}: ${problems.length ? "\n  " + problems.join("\n  ") : "ok"}`);
  if (problems.length) failures += 1;
  await ctx.close();
}
await browser.close();
console.log(failures ? `FAILED (${failures} size(s))` : "PASSED");
process.exit(failures ? 1 : 0);
