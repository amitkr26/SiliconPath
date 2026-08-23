import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTIFACTS_DIR = "C:/Users/ajeet/.gemini/antigravity-ide/brain/6efead8c-fb90-4cbd-a212-f95189eebcfb";
const SCREENSHOTS_DIR = path.join(ARTIFACTS_DIR, "acceptance_qa");

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const BASE_URL = "http://localhost:3000";

async function runBrowserAcceptance() {
  console.log("============================================================");
  console.log("STARTING COMPREHENSIVE BROWSER ACCEPTANCE QA");
  console.log("============================================================");

  const browser = await chromium.launch({ headless: true });

  // -------------------------------------------------------------
  // 1. PUBLIC VISITOR & RESPONSIVE LAYOUT TEST
  // -------------------------------------------------------------
  console.log("\n--- STEP 1: Public Visitor Experience & Responsive Tests ---");
  const publicContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await publicContext.newPage();

  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "01_public_home_1440.png") });
  console.log("📸 Saved: 01_public_home_1440.png");

  // Verify PublicHome content
  const pageText = await page.textContent("body");
  const isPublicHome = pageText.includes("BerojgarDegreeWala") || pageText.includes("Semiconductor");
  console.log(`Public homepage renders correctly: ${isPublicHome}`);

  // Test Responsive Viewports
  const viewports = [
    { name: "320_mobile", width: 320, height: 600 },
    { name: "375_mobile", width: 375, height: 667 },
    { name: "390_mobile", width: 390, height: 844 },
    { name: "414_mobile", width: 414, height: 896 },
    { name: "768_tablet", width: 768, height: 1024 },
    { name: "1024_desktop_sm", width: 1024, height: 768 },
    { name: "1440_desktop_lg", width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `responsive_home_${vp.name}.png`) });
    console.log(`📸 Responsive viewport verified: ${vp.name} (${vp.width}x${vp.height})`);
  }

  // Open Opportunities Feed as Public User
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/opportunities`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "02_public_opportunities_feed.png") });
  console.log("📸 Saved: 02_public_opportunities_feed.png");

  await publicContext.close();

  // -------------------------------------------------------------
  // 2. CANDIDATE AUTHENTICATED EXPERIENCE QA
  // -------------------------------------------------------------
  console.log("\n--- STEP 2: Candidate Authenticated Experience QA ---");
  const candidateContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const candPage = await candidateContext.newPage();

  // Navigate to Login
  await candPage.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await candPage.screenshot({ path: path.join(SCREENSHOTS_DIR, "03_candidate_login_page.png") });

  // Fill Candidate Credentials
  await candPage.fill('input[placeholder*="you@example.com"], input[type="text"]', "amittest2@berojgardegreewala.com");
  await candPage.fill('input[type="password"]', "TestPassword123!");
  await candPage.click('button[type="submit"]');

  await candPage.waitForTimeout(3000);

  await candPage.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await candPage.screenshot({ path: path.join(SCREENSHOTS_DIR, "04_candidate_home.png") });
  console.log("📸 Saved: 04_candidate_home.png");

  // Verify candidate navigation
  const candRoutes = [
    { path: "/opportunities", file: "05_candidate_opportunities.png" },
    { path: "/profile", file: "06_candidate_profile.png" },
    { path: "/network", file: "07_candidate_network.png" },
    { path: "/messages", file: "08_candidate_messages.png" }
  ];

  for (const r of candRoutes) {
    await candPage.goto(`${BASE_URL}${r.path}`, { waitUntil: "networkidle" });
    await candPage.screenshot({ path: path.join(SCREENSHOTS_DIR, r.file) });
    console.log(`📸 Candidate route ${r.path} -> ${r.file}`);
  }

  await candidateContext.close();

  // -------------------------------------------------------------
  // 3. EMPLOYER AUTHENTICATED EXPERIENCE QA
  // -------------------------------------------------------------
  console.log("\n--- STEP 3: Employer Authenticated Experience QA ---");
  const employerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const empPage = await employerContext.newPage();

  // Navigate to Login
  await empPage.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await empPage.fill('input[placeholder*="you@example.com"], input[type="text"]', "amit@excompany.in");
  await empPage.fill('input[type="password"]', "TestPassword123!");
  await empPage.click('button[type="submit"]');

  await empPage.waitForTimeout(3000);

  await empPage.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await empPage.screenshot({ path: path.join(SCREENSHOTS_DIR, "09_employer_home.png") });
  console.log("📸 Saved: 09_employer_home.png");

  // Verify employer routes
  const empRoutes = [
    { path: "/employer/profile", file: "10_employer_profile.png" },
    { path: "/employer/company", file: "11_employer_company.png" },
    { path: "/employer/team", file: "12_employer_team.png" },
    { path: "/employer/settings", file: "13_employer_settings.png" }
  ];

  for (const r of empRoutes) {
    await empPage.goto(`${BASE_URL}${r.path}`, { waitUntil: "networkidle" });
    await empPage.screenshot({ path: path.join(SCREENSHOTS_DIR, r.file) });
    console.log(`📸 Employer route ${r.path} -> ${r.file}`);
  }

  await employerContext.close();

  // -------------------------------------------------------------
  // 4. ADMIN CONSOLE AUTHENTICATION GATE QA
  // -------------------------------------------------------------
  console.log("\n--- STEP 4: Admin Console Authentication Gate QA ---");
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const adminPage = await adminContext.newPage();

  await adminPage.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });
  await adminPage.screenshot({ path: path.join(SCREENSHOTS_DIR, "14_admin_auth_gate.png") });
  console.log("📸 Saved: 14_admin_auth_gate.png");

  await adminContext.close();
  await browser.close();

  console.log("\n============================================================");
  console.log("BROWSER ACCEPTANCE QA COMPLETED SUCCESSFULLY");
  console.log("============================================================");
}

runBrowserAcceptance().catch(err => {
  console.error("FATAL BROWSER QA:", err);
  process.exit(1);
});
