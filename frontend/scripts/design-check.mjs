// Throwaway design-verification script — asserts the restrained brutalist system landed.
// Usage: node scripts/design-check.mjs  (run from frontend/, dev server on :3001)
import { chromium } from "playwright";

const BASE = "http://localhost:3001";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 160)); });
  page.on("pageerror", (e) => consoleErrors.push("PAGEERROR: " + e.message.slice(0, 160)));

  const results = [];
  const check = (label, ok, detail = "") => results.push(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? " — " + detail : ""}`);

  // HOME: hero + buttons + navbar
  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 45000 });
  const hero = await page.locator("h1").first().evaluate((el) => {
    const s = getComputedStyle(el);
    return { weight: s.fontWeight, size: s.fontSize };
  });
  check("home h1 font-black", hero.weight === "900", `weight=${hero.weight} size=${hero.size}`);

  const navBtn = await page.locator("header a").first().evaluate((el) => getComputedStyle(el).boxShadow);
  check("navbar brand has brutal shadow", navBtn.includes("rgb(15, 23, 42)"), navBtn);

  const heroBtn = await page.locator("main a").first().evaluate((el) => getComputedStyle(el).boxShadow);
  check("hero primary button hard shadow", heroBtn.includes("rgb(15, 23, 42)"), heroBtn);

  // No legacy raw shadow-[...] classes should exist in DOM
  const rawShadowCount = await page.locator('[class*="shadow-[4px"]').count();
  check("no raw 4px shadow classes on home", rawShadowCount === 0, `found=${rawShadowCount}`);

  // STATS strip uses Card primitive (border-2 => 2px)
  const statBorder = await page.locator("main section").nth(1).locator("div.rounded-2xl").first().evaluate((el) => getComputedStyle(el).borderWidth);
  check("stats card border 2px", statBorder === "2px", statBorder);

  // OPPORTUNITIES: FilterBar Card, no btn-glow/glass-premium
  await page.goto(BASE + "/opportunities", { waitUntil: "networkidle", timeout: 45000 });
  const legacy = await page.locator('[class*="btn-glow"],[class*="glass-premium"]').count();
  check("opportunities no legacy glass/glow classes", legacy === 0, `found=${legacy}`);

  // LOGIN: Input primitive border
  await page.goto(BASE + "/login", { waitUntil: "networkidle", timeout: 45000 });
  const inputBorder = await page.locator("input[type=email], input[type=text]").first().evaluate((el) => getComputedStyle(el).borderWidth);
  check("login input 2px border", inputBorder === "2px", inputBorder);

  // ADMIN: dark shell intact
  await page.goto(BASE + "/admin", { waitUntil: "networkidle", timeout: 45000 });
  const adminBg = await page.locator("div.min-h-screen").first().evaluate((el) => getComputedStyle(el).backgroundColor);
  check("admin dark shell", adminBg.includes("rgb(2, 6, 23)") || adminBg.includes("rgb(15, 23, 42)"), adminBg);

  // MOBILE: hamburger present, no horizontal overflow
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 45000 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check("no horizontal overflow @390px", overflow <= 0, `overflow=${overflow}px`);
  const burger = await page.locator('button[aria-label="Toggle menu"]').count();
  check("mobile hamburger visible", burger === 1);

  // console errors per page (only flag, don't fail on expected 404s from lazy content)
  check("no console errors on toured pages", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));

  await browser.close();
  console.log(results.join("\n"));
  const fails = results.filter((r) => r.startsWith("FAIL")).length;
  console.log(`\n${results.length - fails}/${results.length} checks passed`);
})();