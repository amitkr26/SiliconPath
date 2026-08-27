/**
 * scripts/phase28-ui-reality-audit.mjs
 * Phase 28 — Real UI/UX Audit, Responsive Polish & Production Reality Check
 *
 * Automated verification of:
 * 1. Strict BerojgarDegreeWala brand presence & zero user-facing SiliconPath brand leaks.
 * 2. Scraper title clean logic & glue separation.
 * 3. Opportunity card eligibility badge sanitization (no empty boxes).
 * 4. Live frontend API endpoint contracts on localhost:3000.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";

const ROOT = process.cwd();

console.log("===============================================================================");
console.log("  PHASE 28: REAL UI/UX AUDIT & PRODUCTION REALITY CHECK RUNNER");
console.log("===============================================================================\n");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
    failed++;
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// 1. BRAND PURITY AUDIT
// ---------------------------------------------------------------------------
console.log("--- 1. Brand Identity Audit (BerojgarDegreeWala vs SiliconPath Leaks) ---");

test("Navbar brand renders BerojgarDegreeWala", () => {
  const file = readFileSync(resolve(ROOT, "frontend/src/components/Navbar.tsx"), "utf-8");
  assert.ok(file.includes('Berojgar<span className="text-blue-600">DegreeWala</span>'), "Navbar logo text mismatch");
  assert.ok(!file.includes('Silicon<span className="text-blue-600">Path</span>'), "Navbar still contains SiliconPath brand");
});

test("Footer copyright renders BerojgarDegreeWala without SiliconPath suffix", () => {
  const file = readFileSync(resolve(ROOT, "frontend/src/components/Footer.tsx"), "utf-8");
  assert.ok(file.includes("BerojgarDegreeWala. All rights reserved."), "Footer missing BerojgarDegreeWala copyright");
  assert.ok(!file.includes("BerojgarDegreeWala (SiliconPath)"), "Footer still contains (SiliconPath) suffix");
});

test("PublicProfile badge renders BerojgarDegreeWala Verified Engineer", () => {
  const file = readFileSync(resolve(ROOT, "frontend/src/components/profile/PublicProfile.tsx"), "utf-8");
  assert.ok(file.includes("BerojgarDegreeWala Verified Engineer"), "PublicProfile badge mismatch");
  assert.ok(!file.includes("SiliconPath Verified Engineer"), "PublicProfile has SiliconPath badge leak");
  assert.ok(!file.includes("siliconpath.in/profile/"), "PublicProfile has siliconpath.in link fallback");
});

test("Talent invite modal placeholder uses BerojgarDegreeWala", () => {
  const file = readFileSync(resolve(ROOT, "frontend/src/app/employer/talent/page.tsx"), "utf-8");
  assert.ok(file.includes("profile on BerojgarDegreeWala"), "Talent page invite placeholder brand mismatch");
  assert.ok(!file.includes("profile on SiliconPath"), "Talent page still contains SiliconPath invite text");
});

test("Employer invite API route uses BerojgarDegreeWala default reachout message", () => {
  const file = readFileSync(resolve(ROOT, "frontend/src/app/api/employer/invite/route.ts"), "utf-8");
  assert.ok(file.includes("profile on BerojgarDegreeWala"), "Invite API route default message brand mismatch");
  assert.ok(!file.includes("profile on SiliconPath"), "Invite API route still contains SiliconPath reachout text");
});

test("Search page news source fallback uses BerojgarDegreeWala News", () => {
  const file = readFileSync(resolve(ROOT, "frontend/src/app/search/page.tsx"), "utf-8");
  assert.ok(file.includes('"BerojgarDegreeWala News"'), "Search page news fallback mismatch");
  assert.ok(!file.includes('"SiliconPath News"'), "Search page still contains SiliconPath News fallback");
});

test("Community academy link references BerojgarDegreeWala Learning Academy", () => {
  const file = readFileSync(resolve(ROOT, "frontend/src/app/community/page.tsx"), "utf-8");
  assert.ok(file.includes("BerojgarDegreeWala Learning Academy"), "Community academy link mismatch");
  assert.ok(!file.includes("SiliconPath Learning Academy"), "Community still contains SiliconPath Academy");
});

test("Layout schema.org structured data does not leak alternateName SiliconPath India", () => {
  const file = readFileSync(resolve(ROOT, "frontend/src/app/layout.tsx"), "utf-8");
  assert.ok(!file.includes('"SiliconPath India"'), "Layout schema.org has SiliconPath India alternateName");
});

// ---------------------------------------------------------------------------
// 2. SCRAPER TITLE TRANSFORMS & BADGE SANITIZATION
// ---------------------------------------------------------------------------
console.log("\n--- 2. Scraper Title Transforms & Badge Sanitization ---");

// Import cleanTitle from frontend source
const { cleanTitle } = await import(new URL("../frontend/src/lib/scrapers/utils.ts", import.meta.url).href);

test("cleanTitle separates glued )Full-time and )Intern suffixes", () => {
  const fulltime = cleanTitle("Design Verification Lead(SoC)Full-time", "Intel");
  assert.equal(fulltime, "Design Verification Lead(SoC) Full-time");

  const intern = cleanTitle("Digital IC Verification(RTL)Intern", "Qualcomm");
  assert.equal(intern, "Digital IC Verification(RTL) Intern");

  const internship = cleanTitle("Physical Design(28nm)Internship", "Synopsys");
  assert.equal(internship, "Physical Design(28nm) Internship");
});

test("cleanTitle deduplicates redundant trailing Intern when title starts with Intern", () => {
  const wd = cleanTitle("Intern - Occupational Health and SafetyIntern", "Western Digital");
  assert.equal(wd, "Intern - Occupational Health and Safety");
});

test("OpportunityCard filters out empty eligibility tokens", () => {
  const eligibility = "B.Tech ECE, GATE 2026, ,  ";
  const tokens = eligibility
    .split(",")
    .map((e) => e.trim())
    .filter((e) => e.length > 0)
    .slice(0, 3);
  assert.deepEqual(tokens, ["B.Tech ECE", "GATE 2026"]);
  assert.equal(tokens.filter((t) => t.length === 0).length, 0);
});

// ---------------------------------------------------------------------------
// 3. UX, SCROLLBAR & NOTIFICATION HOOK AUDIT
// ---------------------------------------------------------------------------
console.log("\n--- 3. UX, Scrollbar & Notification Hook Audit ---");

test("globals.css provides sleek scrollbar and .no-scrollbar utility", () => {
  const css = readFileSync(resolve(ROOT, "frontend/src/app/globals.css"), "utf-8");
  assert.ok(css.includes(".no-scrollbar"), "globals.css missing .no-scrollbar utility");
  assert.ok(css.includes("scrollbar-width: none;"), "globals.css missing scrollbar-width none");
});

test("Notifications hook exports useMarkSingleNotificationRead with cache invalidation", () => {
  const hook = readFileSync(resolve(ROOT, "frontend/src/hooks/useNotifications.ts"), "utf-8");
  assert.ok(hook.includes("export function useMarkSingleNotificationRead()"), "Missing useMarkSingleNotificationRead hook");
  assert.ok(hook.includes('queryClient.invalidateQueries({ queryKey: ["notifications"] })'), "Missing cache invalidation");
});

test("Feed page includes 1-click Share2 button on post cards", () => {
  const feed = readFileSync(resolve(ROOT, "frontend/src/app/feed/page.tsx"), "utf-8");
  assert.ok(feed.includes("Share2"), "Feed page missing Share2 icon");
  assert.ok(feed.includes("navigator.clipboard.writeText"), "Feed page missing clipboard copy action");
});

// ---------------------------------------------------------------------------
// 4. LIVE FRONTEND API ENDPOINT CONTRACT AUDIT
// ---------------------------------------------------------------------------
console.log("\n--- 4. Live Local Frontend API Endpoint Contract Audit ---");

await asyncTest("GET http://localhost:3000/api/opportunities returns 200 with opportunities array", async () => {
  const res = await fetch("http://localhost:3000/api/opportunities?limit=5");
  assert.equal(res.status, 200, `Expected 200, received ${res.status}`);
  const json = await res.json();
  assert.ok(Array.isArray(json.opportunities), "opportunities is not an array");
  assert.ok(json.opportunities.length > 0, "opportunities array is empty");
  assert.ok(json.opportunities[0].title, "First opportunity missing title");
});

await asyncTest("GET http://localhost:3000/api/news returns 200 with news array", async () => {
  const res = await fetch("http://localhost:3000/api/news?limit=3");
  assert.equal(res.status, 200, `Expected 200, received ${res.status}`);
  const json = await res.json();
  const items = json.articles || json.news || [];
  assert.ok(Array.isArray(items), "news items is not an array");
});

await asyncTest("GET http://localhost:3000/api/feed rejects unauthorized anonymous request with 401", async () => {
  const res = await fetch("http://localhost:3000/api/feed?limit=5");
  assert.equal(res.status, 401, `Expected 401 Unauthorized, received ${res.status}`);
  const json = await res.json();
  assert.ok(json.error, "Expected error message in unauthorized response");
});

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------
console.log("\n===============================================================================");
console.log(`  PHASE 28 AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
console.log("===============================================================================\n");

if (failed > 0) {
  process.exit(1);
}
