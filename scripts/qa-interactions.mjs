// Capability selector (mouse + keyboard), globe selection and keyboard focus checks on the homepage.
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:3100";
const out = "qa-output";
const browser = await chromium.launch({ channel: "msedge", args: ["--use-angle=d3d11"] });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

await page.addInitScript(() => sessionStorage.setItem("omgx-intro-seen", "1"));
await page.goto(base, { waitUntil: "load" });
await page.waitForSelector(".loader", { state: "detached", timeout: 15000 });

// Capabilities
await page.locator("#capabilities .caps__body").scrollIntoViewIfNeeded();
await page.waitForTimeout(1200);
const tabs = page.getByRole("tab");
console.log("tabs:", await tabs.allTextContents());
for (let i = 0; i < 4; i++) {
  await tabs.nth(i).click();
  await page.waitForTimeout(1600);
  const selected = await page.locator('[role="tab"][aria-selected="true"]').textContent();
  const chips = await page.locator(".cap-visual__chip").allTextContents();
  console.log(`click ${i}: selected="${selected}" labels=${JSON.stringify(chips)}`);
  await page.locator(".caps__body").screenshot({ path: `${out}/caps-state-${i}.png` });
}
await tabs.nth(3).focus();
await page.keyboard.press("ArrowDown");
await page.waitForTimeout(300);
console.log("ArrowDown from 4 ->", await page.evaluate(() => document.activeElement?.textContent), "selected:", await page.locator('[role="tab"][aria-selected="true"]').textContent());
await page.keyboard.press("End");
await page.waitForTimeout(300);
console.log("End ->", await page.locator('[role="tab"][aria-selected="true"]').textContent());

// Globe
await page.locator(".globe__visual").scrollIntoViewIfNeeded();
await page.waitForTimeout(1500);
await page.getByRole("button", { name: /Kenya/ }).click();
await page.waitForTimeout(2200);
console.log("Kenya pressed:", await page.getByRole("button", { name: /Kenya/ }).getAttribute("aria-pressed"));
const activeLabel = await page.locator('.globe__label[data-active="true"]').textContent();
console.log("active globe label:", activeLabel);
await page.locator(".globe").screenshot({ path: `${out}/globe-kenya.png` });

// Keyboard tab order from top of page
await page.reload({ waitUntil: "load" });
await page.waitForSelector(".loader", { state: "detached", timeout: 15000 });
await page.keyboard.press("Tab");
const skipVisible = await page.evaluate(() => {
  const r = document.querySelector(".skip-link")?.getBoundingClientRect();
  return r ? r.top >= 0 : false;
});
console.log("skip link visible on focus:", skipVisible);
const firstFocus = await page.evaluate(() => document.activeElement?.textContent?.trim());
await page.keyboard.press("Tab");
const second = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.textContent?.trim());
console.log("tab order:", firstFocus, "|", second);

console.log("errors:", errors.length, errors.slice(0, 5));
await browser.close();
