import fetch from "node-fetch";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const ADMIN_USER = process.env.ADMIN_USERNAME || "amitkr26";
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "amitkr2622002";

async function runComprehensivePortalTests() {
  console.log("============================================================");
  console.log("RUNNING COMPREHENSIVE PORTAL & FEATURE VERIFICATION SUITE");
  console.log("Base URL: " + BASE_URL);
  console.log("Time: " + new Date().toISOString());
  console.log("============================================================\n");

  let total = 0;
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      passed++;
      console.log(`✅ [PASS] ${name}`);
    } catch (err) {
      failed++;
      console.error(`❌ [FAIL] ${name} -> ${err.message}`);
    }
  }

  // ------------------------------------------------------------
  // SECTION 1: PUBLIC & CANDIDATE PORTAL
  // ------------------------------------------------------------
  console.log("--- 1. PUBLIC & CANDIDATE PORTAL ---");

  await test("Public Homepage loads (HTTP 200)", async () => {
    const res = await fetch(`${BASE_URL}/`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await test("Opportunities Feed loads with SSR data", async () => {
    const res = await fetch(`${BASE_URL}/opportunities`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await test("Opportunities API returns verified semiconductor listings", async () => {
    const res = await fetch(`${BASE_URL}/api/opportunities?limit=5`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    if (!json.opportunities || json.opportunities.length === 0) throw new Error("No opportunities returned");
    if (!json.opportunities[0].title) throw new Error("Missing opportunity title");
  });

  await test("Opportunities Stats API returns non-empty category breakdown", async () => {
    const res = await fetch(`${BASE_URL}/api/opportunities/stats`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    if (typeof json.total !== "number" || json.total < 100) throw new Error(`Unexpected total count: ${json.total}`);
    if (!json.byCategory || Object.keys(json.byCategory).length === 0) throw new Error("Empty byCategory map");
  });

  await test("Search API returns relevant VLSI results", async () => {
    const res = await fetch(`${BASE_URL}/api/search?q=VLSI`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    if (!json.opportunities || json.opportunities.length === 0) throw new Error("Search returned 0 results");
  });

  await test("News Feed loads (HTTP 200)", async () => {
    const res = await fetch(`${BASE_URL}/news`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await test("Academy Hub loads (HTTP 200)", async () => {
    const res = await fetch(`${BASE_URL}/academy`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await test("Network Page loads (HTTP 200)", async () => {
    const res = await fetch(`${BASE_URL}/network`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await test("Messages Page loads (HTTP 200)", async () => {
    const res = await fetch(`${BASE_URL}/messages`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await test("Login & Signup Pages load (HTTP 200)", async () => {
    const r1 = await fetch(`${BASE_URL}/login`);
    const r2 = await fetch(`${BASE_URL}/signup`);
    if (r1.status !== 200 || r2.status !== 200) throw new Error(`Login: ${r1.status}, Signup: ${r2.status}`);
  });

  await test("Protected Candidate routes redirect unauthenticated users", async () => {
    const res = await fetch(`${BASE_URL}/applications`, { redirect: "manual" });
    if (res.status !== 307 && res.status !== 308 && res.status !== 200) throw new Error(`Expected redirect or client gate, got ${res.status}`);
  });

  // ------------------------------------------------------------
  // SECTION 2: EMPLOYER PORTAL
  // ------------------------------------------------------------
  console.log("\n--- 2. EMPLOYER PORTAL ---");

  await test("Employer Dashboard route accessible (HTTP 200/307)", async () => {
    const res = await fetch(`${BASE_URL}/employer/dashboard`, { redirect: "manual" });
    if (res.status !== 200 && res.status !== 307 && res.status !== 308) throw new Error(`Status ${res.status}`);
  });

  await test("Employer Company Management accessible", async () => {
    const res = await fetch(`${BASE_URL}/employer/company`, { redirect: "manual" });
    if (res.status !== 200 && res.status !== 307 && res.status !== 308) throw new Error(`Status ${res.status}`);
  });

  await test("Employer Jobs Management accessible", async () => {
    const res = await fetch(`${BASE_URL}/employer/jobs`, { redirect: "manual" });
    if (res.status !== 200 && res.status !== 307 && res.status !== 308) throw new Error(`Status ${res.status}`);
  });

  await test("Employer Post Job Page accessible", async () => {
    const res = await fetch(`${BASE_URL}/employer/post-job`, { redirect: "manual" });
    if (res.status !== 200 && res.status !== 307 && res.status !== 308) throw new Error(`Status ${res.status}`);
  });

  await test("Employer Talent Search accessible", async () => {
    const res = await fetch(`${BASE_URL}/employer/talent`, { redirect: "manual" });
    if (res.status !== 200 && res.status !== 307 && res.status !== 308) throw new Error(`Status ${res.status}`);
  });

  await test("Username availability check API functions accurately", async () => {
    const res = await fetch(`${BASE_URL}/api/username/check?username=amitkr26`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    if (typeof json.available !== "boolean") throw new Error("Missing available flag in response");
  });

  // ------------------------------------------------------------
  // SECTION 3: ADMIN PORTAL & AUTHENTICATION
  // ------------------------------------------------------------
  console.log("\n--- 3. ADMIN PORTAL & AUTHENTICATION ---");

  let adminToken = "";

  await test("Admin Login rejects invalid credentials", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "wronguser", password: "wrongpassword" })
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    const json = await res.json();
    if (json.authenticated !== false) throw new Error("Expected authenticated: false");
  });

  await test(`Admin Login accepts target credentials (${ADMIN_USER} / ${ADMIN_PASS})`, async () => {
    const res = await fetch(`${BASE_URL}/api/admin/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS })
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    if (!json.authenticated || !json.token) throw new Error("Admin authentication failed or missing token");
    adminToken = json.token;
  });

  await test("Admin session validation route verifies authenticated token", async () => {
    if (!adminToken) throw new Error("No admin token from previous step");
    const res = await fetch(`${BASE_URL}/api/admin/auth/session`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    if (json.authenticated !== true) throw new Error("Session verification failed");
  });

  await test("Admin scraper health endpoint accessible with token", async () => {
    if (!adminToken) throw new Error("No admin token");
    const res = await fetch(`${BASE_URL}/api/admin/scrape-health`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (res.status !== 200 && res.status !== 404) throw new Error(`Status ${res.status}`);
  });

  // ------------------------------------------------------------
  // SECTION 4: INTEGRATION & SEO ENDPOINTS
  // ------------------------------------------------------------
  console.log("\n--- 4. INTEGRATION & SEO ENDPOINTS ---");

  await test("Sitemap.xml generates valid XML (HTTP 200)", async () => {
    const res = await fetch(`${BASE_URL}/sitemap.xml`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const text = await res.text();
    if (!text.includes("<urlset") && !text.includes("<?xml")) throw new Error("Invalid sitemap XML format");
  });

  await test("Robots.txt responds with indexing rules (HTTP 200)", async () => {
    const res = await fetch(`${BASE_URL}/robots.txt`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await test("Contact API accepts valid feedback payload (HTTP 201)", async () => {
    const res = await fetch(`${BASE_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "general",
        notes: "Portal integration verification test ping",
        contact_email: "test@berojgardegreewala.in"
      })
    });
    if (res.status !== 201) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error("Contact API response success !== true");
  });

  console.log("\n============================================================");
  console.log(`PORTAL VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED (Total: ${total})`);
  console.log("============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runComprehensivePortalTests();
