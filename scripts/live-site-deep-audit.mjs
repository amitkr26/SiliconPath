import fetch from "node-fetch";

const BASE_URL = "https://berojgardegreewala.vercel.app";

const ROUTES = [
  { path: "/", expectedStatus: [200], name: "Homepage" },
  { path: "/opportunities", expectedStatus: [200], name: "Opportunities Feed" },
  { path: "/news", expectedStatus: [200], name: "News Feed" },
  { path: "/academy", expectedStatus: [200], name: "Academy Hub" },
  { path: "/network", expectedStatus: [200], name: "Network Page" },
  { path: "/messages", expectedStatus: [200], name: "Messages Page" },
  { path: "/profile", expectedStatus: [200, 307, 308], name: "Profile Page" },
  { path: "/admin", expectedStatus: [200, 307, 308, 401, 403], name: "Admin Entry" },
  { path: "/login", expectedStatus: [200], name: "Login Page" },
  { path: "/signup", expectedStatus: [200], name: "Signup Page" },
  { path: "/saved", expectedStatus: [200, 307, 308], name: "Saved Bookmarks" },
  { path: "/applications", expectedStatus: [200, 307, 308], name: "Candidate Applications (Protected)" },
  { path: "/employer/dashboard", expectedStatus: [200, 307, 308], name: "Employer Dashboard (Protected)" },
  { path: "/employer/company", expectedStatus: [200, 307, 308], name: "Employer Company (Protected)" },
  { path: "/employer/jobs", expectedStatus: [200, 307, 308], name: "Employer Jobs (Protected)" },
  { path: "/sitemap.xml", expectedStatus: [200], name: "Sitemap XML" },
  { path: "/robots.txt", expectedStatus: [200], name: "Robots TXT" },
];

const APIS = [
  { path: "/api/opportunities?limit=10", expectedStatus: [200], name: "Opportunities API" },
  { path: "/api/opportunities/stats", expectedStatus: [200], name: "Opportunities Stats API" },
  { path: "/api/search?q=VLSI", expectedStatus: [200], name: "Search API" },
  { path: "/api/username/check?username=testcandidate", expectedStatus: [200], name: "Username Check API" },
  { path: "/api/contact", method: "POST", body: JSON.stringify({ type: "general", notes: "Automated audit test verification payload", contact_email: "audit@test.com" }), expectedStatus: [200, 201], name: "Contact API" },
];

const DETAIL_SLUGS = [
  "inviting-online-applications-for-engagement-to-the-positions-of-junior-research-fellow-jrf-in-ursc-b",
  "asml-euv-lithography-systems-rd-specialist-2026",
  "staff-engineer-software-release-and-packaging-risc-v",
  "this-slug-definitely-does-not-exist-404-test"
];

async function runLiveAudit() {
  console.log("============================================================");
  console.log("STARTING LIVE SITE PRODUCTION AUDIT: " + BASE_URL);
  console.log("Time: " + new Date().toISOString());
  console.log("============================================================\n");

  let passed = 0;
  let failed = 0;
  const results = [];

  console.log("--- 1. CORE ROUTES ---");
  for (const route of ROUTES) {
    const url = `${BASE_URL}${route.path}`;
    try {
      const res = await fetch(url, { redirect: "manual" });
      const ok = route.expectedStatus.includes(res.status);
      if (ok) {
        passed++;
        console.log(`✅ [PASS] ${route.name} (${route.path}) -> HTTP ${res.status}`);
      } else {
        failed++;
        console.error(`❌ [FAIL] ${route.name} (${route.path}) -> HTTP ${res.status} (Expected: ${route.expectedStatus.join(",")})`);
      }
      results.push({ target: route.path, type: "route", status: res.status, ok });
    } catch (err) {
      failed++;
      console.error(`❌ [ERROR] ${route.name} (${route.path}) -> ${err.message}`);
      results.push({ target: route.path, type: "route", error: err.message, ok: false });
    }
  }

  console.log("\n--- 2. OPPORTUNITY DETAIL SLUG RESOLUTION ---");
  for (const slug of DETAIL_SLUGS) {
    const url = `${BASE_URL}/opportunities/${slug}`;
    try {
      const res = await fetch(url, { redirect: "manual" });
      const is404Test = slug.includes("does-not-exist");
      const ok = is404Test ? res.status === 404 : res.status === 200;
      if (ok) {
        passed++;
        console.log(`✅ [PASS] Slug: ${slug.slice(0, 45)}... -> HTTP ${res.status}`);
      } else {
        failed++;
        console.error(`❌ [FAIL] Slug: ${slug.slice(0, 45)}... -> HTTP ${res.status} (Expected: ${is404Test ? 404 : 200})`);
      }
      results.push({ target: `/opportunities/${slug}`, type: "slug", status: res.status, ok });
    } catch (err) {
      failed++;
      console.error(`❌ [ERROR] Slug: ${slug} -> ${err.message}`);
      results.push({ target: `/opportunities/${slug}`, type: "slug", error: err.message, ok: false });
    }
  }

  console.log("\n--- 3. API ENDPOINTS & SCHEMAS ---");
  for (const api of APIS) {
    const url = `${BASE_URL}${api.path}`;
    try {
      const options = {
        method: api.method || "GET",
        headers: { "Content-Type": "application/json" }
      };
      if (api.body) options.body = api.body;
      const res = await fetch(url, options);
      const ok = api.expectedStatus.includes(res.status);
      let bodySample = "";
      try {
        const json = await res.json();
        bodySample = JSON.stringify(json).slice(0, 100);
      } catch {
        bodySample = (await res.text()).slice(0, 100);
      }

      if (ok) {
        passed++;
        console.log(`✅ [PASS] ${api.name} -> HTTP ${res.status} | Data: ${bodySample}`);
      } else {
        failed++;
        console.error(`❌ [FAIL] ${api.name} -> HTTP ${res.status} | Data: ${bodySample}`);
      }
      results.push({ target: api.path, type: "api", status: res.status, ok });
    } catch (err) {
      failed++;
      console.error(`❌ [ERROR] ${api.name} -> ${err.message}`);
      results.push({ target: api.path, type: "api", error: err.message, ok: false });
    }
  }

  console.log("\n============================================================");
  console.log(`AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log("============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runLiveAudit();
