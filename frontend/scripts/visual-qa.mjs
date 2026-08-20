// Throwaway visual QA script — screenshots the redesigned surfaces on the local dev server.
// Usage: node scripts/visual-qa.mjs  (run from frontend/)
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const BASE = "http://localhost:3001";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "docs", "audit-reports", "redesign-screenshots");

const routes = [
  { name: "01-home", path: "/" },
  { name: "02-opportunities", path: "/opportunities" },
  { name: "03-opportunity-detail", path: "/opportunities/scl-mohali-semiconductor-fab-engineer-cmos-wafer-processing" },
  { name: "04-news", path: "/news" },
  { name: "05-academy", path: "/academy" },
  { name: "06-login", path: "/login" },
  { name: "07-signup", path: "/signup" },
  { name: "08-categories", path: "/categories" },
  { name: "09-resources", path: "/resources" },
  { name: "10-admin", path: "/admin" },
  { name: "11-network", path: "/network" },
  { name: "12-organizations", path: "/organizations" },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  let failures = [];
  for (const r of routes) {
    try {
      const resp = await page.goto(BASE + r.path, { waitUntil: "networkidle", timeout: 45000 });
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${OUT}/${r.name}.png`, fullPage: false });
      console.log(`OK  ${r.path} -> ${resp.status()}`);
    } catch (e) {
      failures.push(`${r.path}: ${e.message.split("\n")[0]}`);
      console.log(`ERR ${r.path} -> ${e.message.split("\n")[0]}`);
      try {
        await page.screenshot({ path: `${OUT}/${r.name}-error.png` });
      } catch {}
    }
  }

  await browser.close();
  console.log(failures.length ? `\n${failures.length} failures:` : "\nAll routes captured.");
  failures.forEach((f) => console.log("  - " + f));
})();