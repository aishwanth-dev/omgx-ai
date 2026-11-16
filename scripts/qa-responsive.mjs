// Responsive QA: every route at every device size.
// Reports horizontal overflow (with offending elements), tap targets under 44px on
// touch widths, console errors/warnings, mobile-menu behaviour and swipe-over-canvas
// scrolling. Screenshots of the home page go to qa-output/resp/.
// Usage: node scripts/qa-responsive.mjs [baseUrl] [--sizes=360,768] [--routes=/,/about] [--quick]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const args = process.argv.slice(2);
const base = args.find((a) => a.startsWith("http")) ?? "http://localhost:3000";
const opt = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1]?.split(",");
const quick = args.includes("--quick");
const out = "qa-output/resp";
mkdirSync(out, { recursive: true });

const VIEWPORTS = [
  [360, 740], [390, 844], [430, 932], // phones
  [768, 1024], [834, 1194], [1024, 1366], // tablets
  [844, 390], // landscape phone / short screen
  [1280, 720], [1920, 1080], [2560, 1440], // laptop / desktop / large
];
const SHOT_WIDTHS = new Set([360, 390, 768, 1280]);
const SHOT_ROUTES = new Set(["/", "/about"]); // home + one inner page
const ROUTES = [
  "/", "/about", "/work", "/work/ipdr-lms", "/work/bosch-assembly-line-data-acquisition", "/capabilities",
  "/capabilities/artificial-intelligence", "/capabilities/industrial-automation", "/products-research", "/contact",
  "/this-route-does-not-exist",
];
const only = opt("sizes");
const onlyRoutes = opt("routes");
const viewports = VIEWPORTS.filter(([w, h]) => !only || only.includes(String(w)) || only.includes(`${w}x${h}`));
const routes = onlyRoutes ?? ROUTES;

const IGNORE_LOG = [/THREE\.Clock/, /Download the React DevTools/, /\[Fast Refresh\]/, /\[HMR\]/];
const browser = await chromium.launch({ channel: "msedge", args: ["--use-gl=angle", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });

const problems = [];
const note = (vp, route, kind, msg) => problems.push({ vp, route, kind, msg });

const measure = () => {
  const vw = window.innerWidth;
  const de = document.documentElement;
  const sw = Math.max(de.scrollWidth, document.body.scrollWidth);
  if (sw <= vw) return { sw, vw, offenders: [] };
  const offenders = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right <= vw + 1 && r.left >= -1) continue;
    // skip anything inside an element that clips or scrolls its overflow
    let clipped = false;
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const o = getComputedStyle(p);
      if (/(hidden|clip|auto|scroll)/.test(o.overflowX) && p.getBoundingClientRect().right <= vw + 1) { clipped = true; break; }
    }
    if (clipped) continue;
    const cs = getComputedStyle(el);
    if (cs.position === "fixed" && r.right <= vw + 1) continue;
    const id = el.id ? `#${el.id}` : "";
    const cls = typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "";
    offenders.push(`${el.tagName.toLowerCase()}${id}${cls} [${Math.round(r.left)}..${Math.round(r.right)}]`);
    if (offenders.length >= 6) break;
  }
  return { sw, vw, offenders };
};

const tapTargets = () => {
  const bad = new Map();
  const sel = "a[href], button, input:not([type=hidden]), select, textarea, [role=button], summary";
  for (const el of document.querySelectorAll(sel)) {
    if (el.closest("[aria-hidden=true], [inert]")) continue;
    if (el.classList.contains("skip-link")) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity === 0 || cs.pointerEvents === "none") continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (el.tagName === "A" && cs.display === "inline" && el.closest("p, li, span, small, h1, h2, h3, h4, dd")) continue; // inline text link
    if (el.matches("input[type=checkbox], input[type=radio]") && el.closest("label")) continue;
    if (r.width >= 43.5 && r.height >= 43.5) continue;
    const key = `${el.tagName.toLowerCase()}${typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\s+/)[0] : ""} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 24)}"`;
    if (!bad.has(key)) bad.set(key, `${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  return [...bad].slice(0, 12).map(([k, v]) => `${k} ${v}`);
};

// Text that is cut off by its own box (overflow hidden/clip, no ellipsis) or that pokes out of the viewport.
const clippedText = () => {
  const out = [];
  const vw = innerWidth;
  for (const el of document.querySelectorAll("body *")) {
    if (el.closest("[aria-hidden=true], [inert], svg, canvas, script, style")) continue;
    if (!Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const clips = /(hidden|clip)/.test(cs.overflowX) && cs.textOverflow !== "ellipsis" && !/^-webkit-box$/.test(cs.display);
    const wide = el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 4; // clientWidth<=4: sr-only text
    let msg = null;
    if (clips && wide && !cs.webkitLineClamp?.match(/^\d/)) msg = `clipped ${el.clientWidth}<${el.scrollWidth}`;
    const range = document.createRange();
    range.selectNodeContents(el);
    const tr = range.getBoundingClientRect();
    if (!msg && tr.width > 0 && (tr.right > vw + 2 || tr.left < -2) && !el.closest(".marquee, [class*=marquee]")) {
      let p = el, hid = false;
      for (; p && p !== document.body; p = p.parentElement) {
        const o = getComputedStyle(p);
        if (/(hidden|clip|auto|scroll)/.test(o.overflowX) && p.getBoundingClientRect().right <= vw + 1) { hid = true; break; }
      }
      if (!hid) msg = `text outside viewport [${Math.round(tr.left)}..${Math.round(tr.right)}]`;
    }
    if (msg) out.push(`${el.tagName.toLowerCase()}${typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\s+/)[0] : ""} "${el.textContent.trim().slice(0, 24)}" ${msg}`);
    if (out.length >= 8) break;
  }
  return out;
};

async function waitReady(page) {
  await page.waitForLoadState("load");
  await page.waitForFunction(() => !document.body.classList.contains("is-locked"), null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(700);
  await page.waitForFunction(() => !document.querySelector(".loader"), null, { timeout: 8000 }).catch(() => {});
}

for (const [w, h] of viewports) {
  const touch = w <= 1194 && !(w === 1280);
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 1,
    hasTouch: touch,
    isMobile: touch && w <= 1024,
  });
  for (const route of routes) {
    const vp = `${w}x${h}`;
    const page = await ctx.newPage();
    page.setDefaultTimeout(20000);
    if (args.includes("--verbose")) console.log(`  ${vp} ${route}`);
    page.on("console", (m) => {
      const t = m.text();
      if (!["error", "warning"].includes(m.type()) || IGNORE_LOG.some((r) => r.test(t))) return;
      if (route === "/this-route-does-not-exist" && /404/.test(t)) return; // expected for the 404 route
      note(vp, route, `console.${m.type()}`, t.slice(0, 160));
    });
    page.on("pageerror", (e) => note(vp, route, "pageerror", e.message.slice(0, 160)));
    try {
      const res = await page.goto(base + route, { waitUntil: "load" });
      if (route !== "/this-route-does-not-exist" && res && res.status() >= 400) note(vp, route, "http", String(res.status()));
      await waitReady(page);
      let worst = await page.evaluate(measure);
      const total = await page.evaluate(() => document.documentElement.scrollHeight);
      const steps = Math.min(quick ? 12 : 70, Math.ceil(total / (h * 0.8)));
      const shotAt = new Set(SHOT_ROUTES.has(route) && SHOT_WIDTHS.has(w) ? [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1].map((f) => Math.round(f * steps)) : []);
      for (let i = 0; i <= steps; i++) {
        await page.evaluate((y) => window.scrollTo(0, y), Math.round(i * h * 0.8));
        await page.waitForTimeout(quick ? 60 : 110);
        const m = await page.evaluate(measure);
        if (m.sw > worst.sw) worst = m;
        if (i % 4 === 0) for (const c of await page.evaluate(clippedText)) note(vp, route, "clipped", c);
        if (shotAt.has(i)) await page.screenshot({ path: `${out}/${route === "/" ? "home" : route.slice(1)}-${w}-${String(i).padStart(2, "0")}.png` });
      }
      if (worst.sw > worst.vw) note(vp, route, "overflow", `scrollWidth ${worst.sw} > ${worst.vw}: ${worst.offenders.join(" | ")}`);
      if (touch && w <= 1024) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(150);
        // tap targets are collected at several scroll positions (some elements mount late)
        const seen = new Set();
        for (let i = 0; i <= Math.min(steps, 30); i += 3) {
          await page.evaluate((y) => window.scrollTo(0, y), Math.round(i * h * 0.8));
          await page.waitForTimeout(90);
          for (const t of await page.evaluate(tapTargets)) seen.add(t);
        }
        for (const t of seen) note(vp, route, "tap<44", t);
        // form controls under 16px make iOS Safari zoom the page on focus
        const small = await page.evaluate(() =>
          [...document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea")]
            .filter((e) => !e.closest("[aria-hidden=true], [inert]") && parseFloat(getComputedStyle(e).fontSize) < 16 && e.getBoundingClientRect().width > 0)
            .map((e) => `${e.tagName.toLowerCase()}#${e.id || e.name} ${getComputedStyle(e).fontSize}`),
        );
        for (const s of small) note(vp, route, "font<16", s);
      }
      // mobile menu behaviour (once per viewport, on the home route)
      if (route === "/") {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(200);
        const toggle = page.locator(".menu-toggle");
        if (await toggle.isVisible()) {
          await toggle.click();
          await page.waitForTimeout(700);
          const open = await page.locator("#mobile-menu").isVisible();
          if (!open) note(vp, route, "menu", "did not open");
          else {
            const links = await page.$$eval("#mobile-menu a, #mobile-menu button", (els) =>
              els.map((e) => ({ t: e.textContent.trim().slice(0, 20), h: Math.round(e.getBoundingClientRect().height), b: Math.round(e.getBoundingClientRect().bottom) })),
            );
            for (const l of links) if (l.h < 44 && l.h > 0) note(vp, route, "menu", `item "${l.t}" ${l.h}px high`);
            if (links.some((l) => l.b > h + 1)) {
              const scrollable = await page.$eval("#mobile-menu", (m) => m.scrollHeight > m.clientHeight && /(auto|scroll)/.test(getComputedStyle(m).overflowY));
              if (!scrollable) note(vp, route, "menu", `items extend below ${h}px and menu does not scroll`);
            }
            let escaped = false;
            for (let i = 0; i < 14 && !escaped; i++) {
              await page.keyboard.press("Tab");
              escaped = !(await page.evaluate(() => !!document.activeElement?.closest("#mobile-menu, .menu-toggle, .site-header")));
            }
            if (escaped) note(vp, route, "menu", "focus escaped the open menu");
            await page.keyboard.press("Escape");
            await page.waitForTimeout(600);
            if (await page.locator("#mobile-menu").isVisible()) note(vp, route, "menu", "Escape did not close");
            if (!(await page.evaluate(() => !document.body.classList.contains("is-locked")))) note(vp, route, "menu", "body stays locked after close");
          }
        }
        // vertical swipe over a canvas must scroll the page
        if (touch) {
          const cdp = await ctx.newCDPSession(page);
          for (const where of ["canvas", "footer"]) {
            await page.evaluate(() => window.scrollTo(0, 0));
            if (where === "footer") await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
            await page.waitForTimeout(400);
            const y0 = await page.evaluate(() => window.scrollY);
            const pt = await page.evaluate((wh) => {
              const els = wh === "canvas" ? [...document.querySelectorAll("canvas")] : [document.querySelector("footer")].filter(Boolean);
              for (const c of els) {
                const r = c.getBoundingClientRect();
                const cx = Math.min(innerWidth - 4, Math.max(4, r.left + r.width / 2));
                const cy = Math.min(innerHeight - 40, Math.max(40, r.top + r.height / 2));
                if (r.bottom > 40 && r.top < innerHeight - 40) return { x: cx, y: cy };
              }
              return null;
            }, where);
            if (!pt) continue;
            const dir = where === "footer" ? 1 : -1; // finger down scrolls the page up (used at the bottom)
            await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: pt.x, y: pt.y }] });
            for (let i = 1; i <= 12; i++) {
              await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: pt.x, y: pt.y + dir * i * 20 }] });
              await page.waitForTimeout(16);
            }
            await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
            await page.waitForTimeout(600);
            const y1 = await page.evaluate(() => window.scrollY);
            if (Math.abs(y1 - y0) < 20) note(vp, route, "swipe", `swipe over ${where} did not scroll (${y0} -> ${y1})`);
          }
        }
      }
    } catch (e) {
      note(vp, route, "script", String(e.message).slice(0, 160));
    }
    await page.close();
  }
  await ctx.close();
  const mine = problems.filter((p) => p.vp === `${w}x${h}`);
  console.log(`${w}x${h}: ${mine.length ? mine.length + " issue(s)" : "ok"}`);
}
await browser.close();

const seen = new Set();
for (const p of problems) {
  const line = `${p.vp.padEnd(9)} ${p.route.padEnd(38)} ${p.kind.padEnd(14)} ${p.msg}`;
  if (!seen.has(line)) { seen.add(line); console.log(line); }
}
console.log(`\n${viewports.length} viewports x ${routes.length} routes, ${seen.size} issue line(s)`);
process.exit(problems.length ? 1 : 0);
