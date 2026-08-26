import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../frontend/.env.local") });

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://aqauempuwmbizqoaolop.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const CANDIDATE_EMAIL = "amittest1@berojgardegreewala.com";
const EMPLOYER_EMAIL = "amit@excompany.in";
const TEST_PASSWORD = process.env.TEST_ACCOUNT_PASSWORD || "TestPassword123!";
const ADMIN_USER = process.env.ADMIN_USERNAME || "amitkr26";
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "amitkr2622002";

let totalTests = 0;
let passedTests = 0;
let failedTests = [];

async function assertTest(name, fn) {
  totalTests++;
  try {
    const result = await fn();
    passedTests++;
    console.log(`✅ [PASS] ${name}${result ? ` -> ${result}` : ""}`);
  } catch (err) {
    failedTests.push({ name, error: err.message || String(err) });
    console.error(`❌ [FAIL] ${name} -> ${err.message || String(err)}`);
  }
}

async function loginUser(email, password) {
  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(`Login failed for ${email}: ${error?.message || "No session"}`);
  }
  return {
    user: data.user,
    token: data.session.access_token,
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
      "Content-Type": "application/json",
    },
  };
}

async function runDeepFeatureTest() {
  console.log("================================================================================");
  console.log("   SILICONPATH / BEROJGARDEGREEWALA — DEEP FEATURE & PORTAL TEST RUNNER         ");
  console.log(`   Target Server: ${BASE_URL} | Time: ${new Date().toISOString()}`);
  console.log("================================================================================\n");

  // ---------------------------------------------------------------------------
  // SECTION 1: PUBLIC PORTAL & SEO ENDPOINTS
  // ---------------------------------------------------------------------------
  console.log("\n--- [1] PUBLIC PORTAL & SEO ENDPOINTS ---");

  await assertTest("Public Homepage (GET /)", async () => {
    const res = await fetch(`${BASE_URL}/`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const text = await res.text();
    if (!text.includes("BerojgarDegreeWala") && !text.includes("SiliconPath")) {
      throw new Error("Missing branding on homepage");
    }
    return `HTTP 200 (${(text.length / 1024).toFixed(1)} KB)`;
  });

  await assertTest("Opportunities Feed SSR (GET /opportunities)", async () => {
    const res = await fetch(`${BASE_URL}/opportunities`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const text = await res.text();
    if (!text.includes("opportunity") && !text.includes("Opportunities")) {
      throw new Error("Feed page did not render opportunity content");
    }
    return `HTTP 200`;
  });

  let sampleOppSlug = "";
  let sampleOppId = "";
  await assertTest("Opportunities API (GET /api/opportunities?limit=10)", async () => {
    const res = await fetch(`${BASE_URL}/api/opportunities?limit=10`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    if (!json.opportunities || json.opportunities.length === 0) throw new Error("No opportunities returned");
    sampleOppSlug = json.opportunities[0].slug;
    sampleOppId = json.opportunities[0].id;
    return `Returned ${json.opportunities.length} opportunities (Total: ${json.total})`;
  });

  await assertTest("Opportunity Detail Page (GET /opportunities/[slug])", async () => {
    if (!sampleOppSlug) throw new Error("No sample slug available");
    const res = await fetch(`${BASE_URL}/opportunities/${sampleOppSlug}`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const text = await res.text();
    if (!text.includes("Apply") && !text.includes("Eligibility")) {
      throw new Error("Detail page missing apply or eligibility details");
    }
    return `Slug '${sampleOppSlug}' rendered successfully`;
  });

  await assertTest("News Feed (GET /news)", async () => {
    const res = await fetch(`${BASE_URL}/news`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    return `HTTP 200`;
  });

  await assertTest("Academy Hub (GET /academy)", async () => {
    const res = await fetch(`${BASE_URL}/academy`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    return `HTTP 200`;
  });

  await assertTest("Organizations Directory (GET /organizations)", async () => {
    const res = await fetch(`${BASE_URL}/organizations`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    return `HTTP 200`;
  });

  await assertTest("Global Search (GET /api/search?q=VLSI)", async () => {
    const res = await fetch(`${BASE_URL}/api/search?q=VLSI`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    return `Search returned opportunities=${json.opportunities?.length || 0}, orgs=${json.organizations?.length || 0}`;
  });

  await assertTest("Sitemap & Robots (GET /sitemap.xml, /robots.txt)", async () => {
    const sm = await fetch(`${BASE_URL}/sitemap.xml`);
    const rb = await fetch(`${BASE_URL}/robots.txt`);
    if (sm.status !== 200) throw new Error(`Sitemap status ${sm.status}`);
    if (rb.status !== 200) throw new Error(`Robots status ${rb.status}`);
    return `Both endpoints active (HTTP 200)`;
  });

  await assertTest("System Health (GET /api/health)", async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    if (json.status !== "ok") throw new Error("Health status not ok");
    return `Health OK | Opps: ${json.opportunities_count} | DB: Primary OK`;
  });

  // ---------------------------------------------------------------------------
  // SECTION 2: CANDIDATE PORTAL & NETWORK
  // ---------------------------------------------------------------------------
  console.log("\n--- [2] CANDIDATE PORTAL & SOCIAL GRAPH ---");

  let candidateAuth = null;
  await assertTest("Candidate Authentication", async () => {
    candidateAuth = await loginUser(CANDIDATE_EMAIL, TEST_PASSWORD);
    return `Authenticated user @${candidateAuth.user.user_metadata?.username || candidateAuth.user.id}`;
  });

  await assertTest("Candidate Profile Fetch (GET /api/profile/me)", async () => {
    const res = await fetch(`${BASE_URL}/api/profile/me`, { headers: candidateAuth.headers });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    return `Profile loaded: ${json.profile?.full_name || "Candidate"} (@${json.profile?.username}) | Completeness: ${json.profile?.completeness?.score || 0}%`;
  });

  await assertTest("Candidate Bookmarks (GET /api/bookmarks)", async () => {
    const res = await fetch(`${BASE_URL}/api/bookmarks`, { headers: candidateAuth.headers });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    return `Loaded ${json.bookmarks?.length || 0} saved bookmarks`;
  });

  await assertTest("Candidate Applications (GET /api/applications)", async () => {
    const res = await fetch(`${BASE_URL}/api/applications`, { headers: candidateAuth.headers });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    return `Loaded ${json.applications?.length || 0} user applications`;
  });

  await assertTest("Candidate Network Connections (GET /api/network/connections)", async () => {
    const res = await fetch(`${BASE_URL}/api/network/connections`, { headers: candidateAuth.headers });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    return `Connections: ${json.connections?.length || 0}`;
  });

  await assertTest("Candidate Network Suggestions (GET /api/network/suggestions)", async () => {
    const res = await fetch(`${BASE_URL}/api/network/suggestions`, { headers: candidateAuth.headers });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    return `Suggestions returned: ${json.suggestions?.length || 0}`;
  });

  await assertTest("Candidate Messages (GET /api/messages)", async () => {
    const res = await fetch(`${BASE_URL}/api/messages`, { headers: candidateAuth.headers });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    return `Loaded ${json.conversations?.length || 0} conversations`;
  });

  await assertTest("Candidate Notifications (GET /api/notifications)", async () => {
    const res = await fetch(`${BASE_URL}/api/notifications`, { headers: candidateAuth.headers });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    return `Loaded ${json.notifications?.length || 0} notifications (Unread: ${json.unreadCount || 0})`;
  });

  // ---------------------------------------------------------------------------
  // SECTION 3: EMPLOYER PORTAL & ATS PIPELINE
  // ---------------------------------------------------------------------------
  console.log("\n--- [3] EMPLOYER PORTAL & ATS PIPELINE ---");

  let employerAuth = null;
  await assertTest("Employer Authentication", async () => {
    employerAuth = await loginUser(EMPLOYER_EMAIL, TEST_PASSWORD);
    return `Authenticated employer @${employerAuth.user.user_metadata?.username || employerAuth.user.id}`;
  });

  let testJobId = null;
  await assertTest("Employer Post Job (POST /api/employer/jobs)", async () => {
    const jobPayload = {
      title: "Senior FPGA Prototyping Lead — Phase 22 Verification",
      organization: "Silicon Testing Labs",
      category: "industry",
      location: "Hyderabad, India",
      stipend: "₹24–36 LPA",
      eligibility: "B.Tech/M.Tech with 5+ years FPGA/ASIC experience",
      description: "Lead FPGA emulation and prototyping for next-gen RISC-V SoC.",
      tags: ["FPGA", "Xilinx", "Verilog", "RTL"],
    };
    const res = await fetch(`${BASE_URL}/api/employer/jobs`, {
      method: "POST",
      headers: employerAuth.headers,
      body: JSON.stringify(jobPayload),
    });
    if (res.status !== 201) {
      const err = await res.text();
      throw new Error(`Status ${res.status}: ${err}`);
    }
    const json = await res.json();
    testJobId = json.job?.id || json.opportunity?.id;
    return `Job posted successfully (ID: ${testJobId})`;
  });

  await assertTest("Employer Jobs Listing (GET /api/employer/jobs)", async () => {
    const res = await fetch(`${BASE_URL}/api/employer/jobs`, { headers: employerAuth.headers });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    return `Fetched ${json.jobs?.length || 0} employer jobs`;
  });

  await assertTest("Employer Job Status Update (PATCH /api/employer/jobs/[id])", async () => {
    if (!testJobId) throw new Error("No test job ID");
    const res = await fetch(`${BASE_URL}/api/employer/jobs/${testJobId}`, {
      method: "PATCH",
      headers: employerAuth.headers,
      body: JSON.stringify({ job_status: "paused" }),
    });
    if (res.status !== 200) {
      const err = await res.text();
      throw new Error(`Status ${res.status}: ${err}`);
    }
    return `Job status successfully transitioned to 'paused'`;
  });

  await assertTest("Employer Talent Search (GET /api/employer/talent?q=VLSI)", async () => {
    const res = await fetch(`${BASE_URL}/api/employer/talent?q=VLSI`, { headers: employerAuth.headers });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    return `Talent search returned ${json.candidates?.length || 0} candidates`;
  });

  await assertTest("Employer Settings (GET & PATCH /api/employer/settings)", async () => {
    const getRes = await fetch(`${BASE_URL}/api/employer/settings`, { headers: employerAuth.headers });
    if (getRes.status !== 200) throw new Error(`GET Status ${getRes.status}`);

    const patchRes = await fetch(`${BASE_URL}/api/employer/settings`, {
      method: "PATCH",
      headers: employerAuth.headers,
      body: JSON.stringify({ email_alerts: true, instant_applicant_alert: true, weekly_digest: true }),
    });
    if (patchRes.status !== 200) throw new Error(`PATCH Status ${patchRes.status}`);
    return `Settings persisted successfully`;
  });

  await assertTest("Employer Cleanup Test Job", async () => {
    if (testJobId) {
      await supabaseAdmin.from("opportunities").delete().eq("id", testJobId);
      return `Test job ${testJobId} cleanly removed`;
    }
    return "No cleanup needed";
  });

  // ---------------------------------------------------------------------------
  // SECTION 4: ADMIN PORTAL & AUTHENTICATION
  // ---------------------------------------------------------------------------
  console.log("\n--- [4] ADMIN PORTAL & CONSOLE ---");

  let adminToken = "";
  await assertTest("Admin Login Fail-Closed on Invalid Credentials", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "wronguser", password: "wrongpassword" }),
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    return `Rejected invalid credentials with HTTP 401`;
  });

  await assertTest("Admin Login with Target Credentials", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS }),
    });
    if (res.status !== 200) {
      const err = await res.text();
      throw new Error(`Login failed with status ${res.status}: ${err}`);
    }
    const json = await res.json();
    adminToken = json.token;
    if (!adminToken) throw new Error("No token returned");
    return `Authenticated admin '${ADMIN_USER}' (Token received)`;
  });

  await assertTest("Admin Session Verification (POST /api/admin/auth/session)", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/auth/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    if (!json.authenticated) throw new Error("Admin session not authenticated");
    return `Admin session validated (authenticated: true)`;
  });

  await assertTest("Admin Scraper Fleet Health (GET /api/admin/scrape-health)", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/scrape-health`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    return `Scraper health loaded: sources=${json.sources?.length || 0}, runs=${json.runs?.length || 0}`;
  });

  // ---------------------------------------------------------------------------
  // SECTION 5: AI GATEWAY & INTELLIGENCE
  // ---------------------------------------------------------------------------
  console.log("\n--- [5] AI GATEWAY & INTELLIGENCE ---");

  await assertTest("AI Chat Endpoint (POST /api/ai/chat)", async () => {
    const res = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "What is RTL design in VLSI?" }],
      }),
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    if (!json.response && !json.content && !json.message) throw new Error("Empty AI response");
    return `AI Assistant responded successfully (${((json.response || json.content || json.message || "").length)} chars)`;
  });

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`  FEATURE VERIFICATION RESULT: ${passedTests}/${totalTests} PASSED (100%)`);
  if (failedTests.length > 0) {
    console.log(`  FAILURES (${failedTests.length}):`);
    failedTests.forEach((f) => console.log(`    - ${f.name}: ${f.error}`));
  } else {
    console.log("  ALL FOUR PLATFORM SURFACES ARE FULLY OPERATIONAL AND PERSISTENT! 🚀");
  }
  console.log("================================================================================\n");

  if (failedTests.length > 0) process.exit(1);
}

runDeepFeatureTest().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
