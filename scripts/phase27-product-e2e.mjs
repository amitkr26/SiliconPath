import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../frontend/.env.local") });

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";
const CAND_EMAIL = process.env.TEST_CANDIDATE_EMAIL || "amittest1@berojgardegreewala.com";
const CAND_PASS = process.env.TEST_CANDIDATE_PASSWORD || "TestPassword123!";
const EMP_EMAIL = process.env.TEST_EMPLOYER_EMAIL || "employertest1@berojgardegreewala.com";
const EMP_PASS = process.env.TEST_EMPLOYER_PASSWORD || "EmployerTestPass123!";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function runPhase27E2E() {
  console.log("================================================================================");
  console.log("   PHASE 27: COMPREHENSIVE PRODUCT & PROFESSIONAL NETWORKING E2E SUITE           ");
  console.log(`   TARGET: ${BASE_URL}`);
  console.log("================================================================================");

  let passed = 0;
  let failed = 0;
  const results = [];

  async function assertStep(name, fn) {
    try {
      await fn();
      passed++;
      console.log(`✅ [PASS] ${name}`);
      results.push({ name, ok: true });
    } catch (err) {
      failed++;
      console.error(`❌ [FAIL] ${name} ->`, err.message);
      results.push({ name, ok: false, error: err.message });
    }
  }

  // 1. Authenticate Candidate
  let candToken = "";
  let candUser = null;
  await assertStep("Authenticate Test Candidate", async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: CAND_EMAIL,
      password: CAND_PASS,
    });
    if (error || !data.session) throw new Error(error?.message || "No session");
    candToken = data.session.access_token;
    candUser = data.user;
  });

  const candHeaders = {
    Authorization: `Bearer ${candToken}`,
    "Content-Type": "application/json",
  };

  // 2. Authenticate Employer
  let empToken = "";
  await assertStep("Authenticate Test Employer", async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: EMP_EMAIL,
      password: EMP_PASS,
    });
    if (error || !data.session) throw new Error(error?.message || "No session");
    empToken = data.session.access_token;
  });

  const empHeaders = {
    Authorization: `Bearer ${empToken}`,
    "Content-Type": "application/json",
  };

  // 3. Candidate Profile Completeness & Timeline
  await assertStep("Candidate Profile & Timeline Fetch (GET /api/profile/me)", async () => {
    const res = await fetch(`${BASE_URL}/api/profile/me`, { headers: candHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.profile || !data.profile.completeness) throw new Error("Profile completeness missing");
  });

  // 4. Professional Feed & Tagged Post Lifecycle
  let createdPostId = "";
  await assertStep("Professional Feed Post Creation (POST /api/feed)", async () => {
    const res = await fetch(`${BASE_URL}/api/feed`, {
      method: "POST",
      headers: candHeaders,
      body: JSON.stringify({ content: "#RTL_Design Test automated discussion post from Phase 27 verification." }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.id) throw new Error("Post ID missing");
    createdPostId = data.id;
  });

  await assertStep("Professional Feed Post Like (POST /api/feed/posts/[id]/like)", async () => {
    const res = await fetch(`${BASE_URL}/api/feed/posts/${createdPostId}/like`, {
      method: "POST",
      headers: candHeaders,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });

  await assertStep("Professional Feed Post Comment (POST /api/feed/posts/[id]/comment)", async () => {
    const res = await fetch(`${BASE_URL}/api/feed/posts/${createdPostId}/comment`, {
      method: "POST",
      headers: candHeaders,
      body: JSON.stringify({ content: "Great technical milestone on RTL synthesis." }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });

  await assertStep("Professional Feed Post Comments Retrieval (GET /api/feed/posts/[id]/comment)", async () => {
    const res = await fetch(`${BASE_URL}/api/feed/posts/${createdPostId}/comment`, { headers: candHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.comments) || data.comments.length === 0) throw new Error("No comments returned");
  });

  await assertStep("Professional Feed Post Teardown (DELETE /api/feed/posts/[id])", async () => {
    const res = await fetch(`${BASE_URL}/api/feed/posts/${createdPostId}`, {
      method: "DELETE",
      headers: candHeaders,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });

  // 5. Professional Networking Hub
  await assertStep("Network Suggestions (GET /api/network/suggestions)", async () => {
    const res = await fetch(`${BASE_URL}/api/network/suggestions`, { headers: candHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.suggestions)) throw new Error("Invalid suggestions format");
  });

  await assertStep("Network Connections (GET /api/network/connections)", async () => {
    const res = await fetch(`${BASE_URL}/api/network/connections`, { headers: candHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.connections)) throw new Error("Invalid connections format");
  });

  await assertStep("Network Followers & Following (GET /api/network/followers)", async () => {
    const res = await fetch(`${BASE_URL}/api/network/followers`, { headers: candHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });

  // 6. Direct Messaging System
  await assertStep("Conversations List (GET /api/messages)", async () => {
    const res = await fetch(`${BASE_URL}/api/messages`, { headers: candHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.conversations)) throw new Error("Invalid conversations format");
  });

  // 7. Opportunity Discovery & Curated Collections
  await assertStep("Curated Discovery: Freshers (GET /api/opportunities?experience=Fresher)", async () => {
    const res = await fetch(`${BASE_URL}/api/opportunities?experience=Fresher&limit=5`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.opportunities)) throw new Error("Opportunities missing");
  });

  await assertStep("Curated Discovery: Closing Soon (GET /api/opportunities?sort=closing_soon)", async () => {
    const res = await fetch(`${BASE_URL}/api/opportunities?sort=closing_soon&limit=5`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });

  await assertStep("Curated Discovery: JRF / Research (GET /api/opportunities?category=jrf)", async () => {
    const res = await fetch(`${BASE_URL}/api/opportunities?category=jrf&limit=5`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });

  // 8. Candidate Application Tracking
  await assertStep("Candidate Applications (GET /api/applications)", async () => {
    const res = await fetch(`${BASE_URL}/api/applications`, { headers: candHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.applications)) throw new Error("Applications array missing");
  });

  // 9. Employer Talent Search
  await assertStep("Employer Talent Search (GET /api/employer/talent?query=VLSI)", async () => {
    const res = await fetch(`${BASE_URL}/api/employer/talent?query=VLSI`, { headers: empHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.candidates)) throw new Error("Candidates array missing");
  });

  // 10. Global Multi-Tab Search
  await assertStep("Multi-Tab Search (GET /api/search?q=VLSI)", async () => {
    const res = await fetch(`${BASE_URL}/api/search?q=VLSI`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.opportunities) || !Array.isArray(data.people)) {
      throw new Error("Search multi-entity response missing opportunities or people");
    }
  });

  // 11. Notification Center
  await assertStep("Notification Center (GET /api/notifications)", async () => {
    const res = await fetch(`${BASE_URL}/api/notifications`, { headers: candHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.notifications)) throw new Error("Notifications array missing");
  });

  console.log("\n================================================================================");
  console.log(`TOTAL PHASE 27 E2E CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase27E2E();
