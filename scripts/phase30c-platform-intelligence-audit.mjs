import assert from "node:assert/strict";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { computeOpportunityQualityScore } from "../frontend/src/lib/opportunity-quality.js";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const CAND_EMAIL = process.env.TEST_CANDIDATE_EMAIL || "amittest1@berojgardegreewala.com";
const CAND_PASS = process.env.TEST_CANDIDATE_PASSWORD || "TestPassword123!";
const EMP_EMAIL = process.env.TEST_EMPLOYER_EMAIL || "employertest1@berojgardegreewala.com";
const EMP_PASS = process.env.TEST_EMPLOYER_PASSWORD || "EmployerTestPass123!";

const envContent = fs.readFileSync("frontend/.env.local", "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[match[1].trim()] = val;
  }
});

const supabase = createClient(env["NEXT_PUBLIC_SUPABASE_URL"], env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]);

let passed = 0;
let failed = 0;

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

function syncTest(name, fn) {
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

console.log("\n===============================================================================");
console.log("   PHASE 30C: PLATFORM INTELLIGENCE, ONBOARDING & QUALITY AUDIT SUITE");
console.log(`   TARGET: ${BASE_URL}`);
console.log("===============================================================================\n");

// --- 1. GUEST EXPERIENCE & DESTINATION PRESERVATION ---
console.log("--- 1. Guest Experience & Destination Preservation ---");

await asyncTest("Guest can freely browse /opportunities feed without login", async () => {
  const res = await fetch(`${BASE_URL}/opportunities`);
  assert.equal(res.status, 200, `Expected 200, received ${res.status}`);
});

await asyncTest("Guest accessing gated action receives redirect with preserved destination", async () => {
  const res = await fetch(`${BASE_URL}/saved`, { redirect: "manual" });
  assert.ok([307, 308, 302].includes(res.status), `Expected redirect, received ${res.status}`);
  const location = res.headers.get("location") || "";
  assert.ok(location.includes("redirectTo=%2Fsaved") || location.includes("redirectTo=/saved"), `Location must preserve destination: ${location}`);
});

// --- 2. AUTHENTICATION & PERSONA ACTIVATION ---
console.log("\n--- 2. Persona Activation & Multi-Capability Verification ---");

let candToken = "";
let candUser = null;
let empToken = "";
let empUser = null;

await asyncTest("Authenticate Candidate (amittest1)", async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: CAND_EMAIL,
    password: CAND_PASS,
  });
  assert.equal(error, null, `Candidate login failed: ${error?.message}`);
  candToken = data.session.access_token;
  candUser = data.user;
});

await asyncTest("Authenticate Employer (employertest1)", async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: EMP_EMAIL,
    password: EMP_PASS,
  });
  assert.equal(error, null, `Employer login failed: ${error?.message}`);
  empToken = data.session.access_token;
  empUser = data.user;
});

const candHeaders = { Authorization: `Bearer ${candToken}`, "Content-Type": "application/json" };
const empHeaders = { Authorization: `Bearer ${empToken}`, "Content-Type": "application/json" };

await asyncTest("Candidate can access personal resume data (/api/resume)", async () => {
  const res = await fetch(`${BASE_URL}/api/resume`, { headers: candHeaders });
  assert.equal(res.status, 200, `Expected 200, received ${res.status}`);
});

await asyncTest("Employer can query talent discovery pool (/api/employer/talent)", async () => {
  const res = await fetch(`${BASE_URL}/api/employer/talent?query=FPGA`, { headers: empHeaders });
  assert.equal(res.status, 200, `Expected 200, received ${res.status}`);
});

await asyncTest("Employer retains candidate ability to browse and search jobs", async () => {
  const res = await fetch(`${BASE_URL}/api/opportunities?limit=3`, { headers: empHeaders });
  assert.equal(res.status, 200, `Expected 200, received ${res.status}`);
});

// --- 3. DETERMINISTIC OPPORTUNITY QUALITY SCORING ---
console.log("\n--- 3. Deterministic Opportunity Quality Scoring Engine ---");

syncTest("Official ISRO/DRDO research post achieves high quality score (>= 80)", () => {
  const futureDate = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  const res = computeOpportunityQualityScore({
    title: "Junior Research Fellow (JRF) in VLSI Architecture",
    description: "Candidates with M.Tech in VLSI or Microelectronics with valid GATE score are invited to apply.",
    source_url: "https://www.isro.gov.in/careers/advt-2026.html",
    application_url: "https://www.isro.gov.in/apply",
    deadline: futureDate,
    organization: { name: "ISRO SAC", is_verified: true },
    category: "jrf",
  });
  assert.ok(res.quality_score >= 80, `Expected score >= 80, received ${res.quality_score}`);
  assert.equal(res.recommended_lifecycle, "active");
  assert.equal(res.recommended_verification, "verified");
});

syncTest("Expired opportunity with past deadline receives penalty and expired status", () => {
  const pastDate = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const res = computeOpportunityQualityScore({
    title: "Old VLSI Internship 2025",
    description: "Old summer internship posting from last year.",
    source_url: "https://example.com/old-job",
    deadline: pastDate,
  });
  assert.equal(res.recommended_lifecycle, "expired");
  assert.ok(res.quality_breakdown.penalties >= 15, "Expired deadline penalty must be applied");
});

syncTest("Broken opportunity without valid links is flagged as broken_link", () => {
  const res = computeOpportunityQualityScore({
    title: "Incomplete listing",
    description: "Missing URLs",
  });
  assert.equal(res.recommended_lifecycle, "broken_link");
  assert.equal(res.recommended_verification, "rejected");
});

// --- 4. RESUME & AI ACCESS CONTROL ISOLATION ---
console.log("\n--- 4. Cross-User Resume & AI Access Control Isolation ---");

await asyncTest("Candidate cannot mutate another user's profile or resume", async () => {
  const res = await fetch(`${BASE_URL}/api/profile/otheruser`, {
    method: "PATCH",
    headers: candHeaders,
    body: JSON.stringify({ bio: "Hacked bio" }),
  });
  assert.ok([401, 403, 404, 405].includes(res.status), `Expected 401/403/404/405, received ${res.status}`);
});

await asyncTest("Candidate blocked from assigning admin roles via profile mutation", async () => {
  const res = await fetch(`${BASE_URL}/api/profile/me`, {
    method: "PATCH",
    headers: candHeaders,
    body: JSON.stringify({ role: "admin", account_type: "admin" }),
  });
  if (res.status === 200) {
    const json = await res.json();
    assert.notEqual(json.data?.account_type, "admin", "Role escalation to admin must be blocked");
  } else {
    assert.ok([400, 403].includes(res.status), `Expected 400/403, received ${res.status}`);
  }
});

console.log("\n===============================================================================");
console.log(`  PHASE 30C AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
console.log("===============================================================================\n");

if (failed > 0) {
  process.exit(1);
}
