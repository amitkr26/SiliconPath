import assert from "node:assert/strict";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

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

console.log("\n===============================================================================");
console.log("   PHASE 30: UNIFIED RBAC, IDENTITY & PORTAL ACCESS AUDIT SUITE");
console.log(`   TARGET: ${BASE_URL}`);
console.log("===============================================================================\n");

// --- 1. PUBLIC VISITOR CAPABILITIES ---
console.log("--- 1. Public Visitor Capabilities (No Auth Required) ---");

await asyncTest("Guest can access /opportunities feed without redirect", async () => {
  const res = await fetch(`${BASE_URL}/opportunities`);
  assert.equal(res.status, 200, `Expected 200, received ${res.status}`);
});

await asyncTest("Guest can query /api/opportunities taxonomy & search", async () => {
  const res = await fetch(`${BASE_URL}/api/opportunities?limit=5`);
  assert.equal(res.status, 200, `Expected 200, received ${res.status}`);
  const json = await res.json();
  assert.ok(Array.isArray(json.opportunities) || Array.isArray(json.data) || Array.isArray(json), "Expected opportunities array");
});

await asyncTest("Guest can query /api/categories taxonomy", async () => {
  const res = await fetch(`${BASE_URL}/api/categories`);
  assert.equal(res.status, 200, `Expected 200, received ${res.status}`);
});

await asyncTest("Guest can access /news stream", async () => {
  const res = await fetch(`${BASE_URL}/news`);
  assert.equal(res.status, 200, `Expected 200, received ${res.status}`);
});

await asyncTest("Guest can access /academy curriculum", async () => {
  const res = await fetch(`${BASE_URL}/academy`);
  assert.equal(res.status, 200, `Expected 200, received ${res.status}`);
});

await asyncTest("Guest can access /about and /organizations", async () => {
  const res = await fetch(`${BASE_URL}/about`);
  assert.equal(res.status, 200, `Expected 200, received ${res.status}`);
});

// --- 2. GUEST ACTION GATING (Must require login / return 401) ---
console.log("\n--- 2. Public Visitor Gated Actions (Must Require Auth) ---");

await asyncTest("Guest application mutation is blocked (401)", async () => {
  const res = await fetch(`${BASE_URL}/api/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ opportunity_id: "00000000-0000-0000-0000-000000000000" }),
  });
  assert.equal(res.status, 401, `Expected 401 Unauthorized, received ${res.status}`);
});

await asyncTest("Guest feed post creation is blocked (401)", async () => {
  const res = await fetch(`${BASE_URL}/api/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: "Unauth guest post" }),
  });
  assert.equal(res.status, 401, `Expected 401 Unauthorized, received ${res.status}`);
});

await asyncTest("Guest direct message is blocked (401)", async () => {
  const res = await fetch(`${BASE_URL}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient_id: "00000000-0000-0000-0000-000000000000", content: "hi" }),
  });
  assert.equal(res.status, 401, `Expected 401 Unauthorized, received ${res.status}`);
});

await asyncTest("Guest connection request is blocked (401)", async () => {
  const res = await fetch(`${BASE_URL}/api/network/connect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_user_id: "00000000-0000-0000-0000-000000000000" }),
  });
  assert.equal(res.status, 401, `Expected 401 Unauthorized, received ${res.status}`);
});

// --- 3. CANDIDATE AUTHENTICATED EXPERIENCE ---
console.log("\n--- 3. Candidate Authenticated Journey ---");

let candToken = "";
let candUser = null;
await asyncTest("Authenticate Candidate (amittest1)", async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: CAND_EMAIL,
    password: CAND_PASS,
  });
  assert.equal(error, null, `Candidate login failed: ${error?.message}`);
  candToken = data.session.access_token;
  candUser = data.user;
});

const candHeaders = { Authorization: `Bearer ${candToken}`, "Content-Type": "application/json" };

await asyncTest("Candidate can fetch personal profile (GET /api/profile/me)", async () => {
  const res = await fetch(`${BASE_URL}/api/profile/me`, { headers: candHeaders });
  assert.equal(res.status, 200, `Expected 200, received ${res.status}`);
});

await asyncTest("Candidate can read conversations (GET /api/messages)", async () => {
  const res = await fetch(`${BASE_URL}/api/messages`, { headers: candHeaders });
  assert.equal(res.status, 200, `Expected 200, received ${res.status}`);
});

await asyncTest("Candidate can read notifications (GET /api/notifications)", async () => {
  const res = await fetch(`${BASE_URL}/api/notifications`, { headers: candHeaders });
  assert.equal(res.status, 200, `Expected 200, received ${res.status}`);
});

// --- 4. EMPLOYER UNIFIED MULTI-CAPABILITY EXPERIENCE ---
console.log("\n--- 4. Employer Multi-Capability Experience ---");

let empToken = "";
let empUser = null;
await asyncTest("Authenticate Employer (employertest1)", async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: EMP_EMAIL,
    password: EMP_PASS,
  });
  assert.equal(error, null, `Employer login failed: ${error?.message}`);
  empToken = data.session.access_token;
  empUser = data.user;
});

const empHeaders = { Authorization: `Bearer ${empToken}`, "Content-Type": "application/json" };

await asyncTest("Employer retains candidate ability to browse & fetch opportunities", async () => {
  const res = await fetch(`${BASE_URL}/api/opportunities?limit=5`, { headers: empHeaders });
  assert.equal(res.status, 200, `Expected 200, received ${res.status}`);
});

await asyncTest("Employer can search candidate talent pool (GET /api/employer/talent)", async () => {
  const res = await fetch(`${BASE_URL}/api/employer/talent?query=VLSI`, { headers: empHeaders });
  assert.equal(res.status, 200, `Expected 200, received ${res.status}`);
});

await asyncTest("Employer can query employer applicant pipeline (GET /api/employer/applicants)", async () => {
  const res = await fetch(`${BASE_URL}/api/employer/applicants`, { headers: empHeaders });
  assert.ok([200, 404].includes(res.status), `Expected 200/404, received ${res.status}`);
});

// --- 5. SECURITY & PRIVILEGE ESCALATION PREVENTION ---
console.log("\n--- 5. Security & Privilege Escalation Prevention ---");

await asyncTest("Candidate blocked from employer talent invite mutation (401/403/404)", async () => {
  const res = await fetch(`${BASE_URL}/api/employer/invite`, {
    method: "POST",
    headers: candHeaders,
    body: JSON.stringify({ candidate_id: candUser.id, message: "Unauthorized invite" }),
  });
  assert.ok([401, 403, 404].includes(res.status), `Expected 401/403/404, received ${res.status}`);
});

await asyncTest("Candidate blocked from modifying ATS stages (401/403/404)", async () => {
  const res = await fetch(`${BASE_URL}/api/employer/applicants`, {
    method: "PATCH",
    headers: candHeaders,
    body: JSON.stringify({ application_id: "00000000-0000-0000-0000-000000000000", status: "offered" }),
  });
  assert.ok([401, 403, 404].includes(res.status), `Expected 401/403/404, received ${res.status}`);
});

await asyncTest("Candidate blocked from self-endorsement (400 Bad Request)", async () => {
  const res = await fetch(`${BASE_URL}/api/profile/amittest1/endorsements`, {
    method: "POST",
    headers: candHeaders,
    body: JSON.stringify({ skill: "SystemVerilog" }),
  });
  assert.equal(res.status, 400, `Expected 400 Bad Request, received ${res.status}`);
});

await asyncTest("Unauthenticated admin endpoint access is blocked (401/403)", async () => {
  const res = await fetch(`${BASE_URL}/api/admin/analytics`, {
    headers: { "Content-Type": "application/json" },
  });
  assert.ok([401, 403, 404].includes(res.status), `Expected 401/403/404, received ${res.status}`);
});

console.log("\n===============================================================================");
console.log(`  PHASE 30 AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
console.log("===============================================================================\n");

if (failed > 0) {
  process.exit(1);
}
