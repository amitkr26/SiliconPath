import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../frontend/.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const BASE_URL = "http://localhost:3000";

async function runAcceptanceTests() {
  console.log("============================================================");
  console.log("STARTING FINAL PRODUCT ACCEPTANCE SUITE");
  console.log("============================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // TEST 1: PUBLIC-ACTIVE INVARIANT & SAMPLING
  // -------------------------------------------------------------
  console.log("\n--- TEST 1: Database Public-Active Invariant ---");
  const { data: activeList, error: actErr } = await supabaseAdmin
    .from("opportunities")
    .select("id, title, organization, category, deadline, apply_url, source_url, verification_status, is_active")
    .eq("is_active", true)
    .eq("verification_status", "verified");

  assert(!actErr && activeList.length === 431, `Active verified opportunities count is exactly 431 (got ${activeList?.length})`);

  const today = new Date().toISOString().split("T")[0];
  const expiredInActive = activeList.filter(o => o.deadline && o.deadline < today);
  assert(expiredInActive.length === 0, `Zero expired deadlines in public-active list (got ${expiredInActive.length})`);

  // -------------------------------------------------------------
  // TEST 2: EXPIRED OPPORTUNITY QUARANTINE & DETAIL LIFECYCLE
  // -------------------------------------------------------------
  console.log("\n--- TEST 2: Expired Opportunity Isolation ---");
  const { data: expiredOpps } = await supabaseAdmin
    .from("opportunities")
    .select("id, title, deadline, is_active, verification_status")
    .eq("verification_status", "expired")
    .limit(5);

  assert(expiredOpps && expiredOpps.length > 0, `Found ${expiredOpps?.length} quarantined expired opportunities`);
  
  if (expiredOpps && expiredOpps.length > 0) {
    const testExpired = expiredOpps[0];
    assert(testExpired.is_active === false, `Expired record ${testExpired.id} has is_active = false`);

    // Verify /api/opportunities?limit=100 does not return it
    const apiRes = await fetch(`${BASE_URL}/api/opportunities?limit=100`);
    const apiJson = await apiRes.json();
    const foundInApi = apiJson.data?.some(o => o.id === testExpired.id);
    assert(!foundInApi, `Expired opportunity ${testExpired.id} is NOT returned by /api/opportunities`);

    // Verify /api/search does not return it
    const searchRes = await fetch(`${BASE_URL}/api/search?q=${encodeURIComponent(testExpired.title.slice(0, 15))}`);
    const searchJson = await searchRes.json();
    const foundInSearch = searchJson.data?.some(o => o.id === testExpired.id);
    assert(!foundInSearch, `Expired opportunity ${testExpired.id} is NOT returned by /api/search`);

    // Verify sitemap.xml does not expose it
    const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`);
    const sitemapText = await sitemapRes.text();
    assert(!sitemapText.includes(testExpired.id), `Expired opportunity ${testExpired.id} is NOT in sitemap.xml`);
  }

  // -------------------------------------------------------------
  // TEST 3: PENDING, REJECTED & LINK_UNAVAILABLE ISOLATION
  // -------------------------------------------------------------
  console.log("\n--- TEST 3: Pending, Rejected & Link Unavailable Quarantine ---");
  const { data: pendingOpps } = await supabaseAdmin.from("opportunities").select("id, title").eq("verification_status", "pending").limit(3);
  const { data: rejectedOpps } = await supabaseAdmin.from("opportunities").select("id, title").eq("verification_status", "rejected").limit(3);
  const { data: unavailOpps } = await supabaseAdmin.from("opportunities").select("id, title").eq("verification_status", "link_unavailable").limit(3);

  const apiResAll = await fetch(`${BASE_URL}/api/opportunities?limit=100`);
  const apiJsonAll = await apiResAll.json();
  const activeIds = new Set(apiJsonAll.data?.map(o => o.id));

  let leakCount = 0;
  for (const p of pendingOpps || []) {
    if (activeIds.has(p.id)) leakCount++;
  }
  for (const r of rejectedOpps || []) {
    if (activeIds.has(r.id)) leakCount++;
  }
  for (const u of unavailOpps || []) {
    if (activeIds.has(u.id)) leakCount++;
  }
  assert(leakCount === 0, `Zero quarantined records (pending, rejected, link_unavailable) leaked to public API (leakCount=${leakCount})`);

  // -------------------------------------------------------------
  // TEST 4: DUPLICATE QUARANTINE INTEGRITY
  // -------------------------------------------------------------
  console.log("\n--- TEST 4: Duplicate Quarantine Integrity ---");
  const { count: dupRejCount } = await supabaseAdmin
    .from("opportunities")
    .select("id", { count: "exact", head: true })
    .eq("verification_status", "rejected")
    .eq("is_active", false);

  assert(dupRejCount >= 2896, `At least 2,896 duplicate records successfully quarantined (got ${dupRejCount})`);

  // -------------------------------------------------------------
  // TEST 5: FRESHER DISCOVERY & CATEGORY STATS
  // -------------------------------------------------------------
  console.log("\n--- TEST 5: Fresher Discovery Experience ---");
  const fresherApiRes = await fetch(`${BASE_URL}/api/opportunities?experience=fresher&limit=10`);
  const fresherJson = await fresherApiRes.json();
  assert(fresherApiRes.status === 200, `/api/opportunities?experience=fresher returns HTTP 200`);
  assert(fresherJson.total_count >= 10, `Fresher filter returns matching active verified results (got ${fresherJson.total_count})`);

  const jrfSearchRes = await fetch(`${BASE_URL}/api/search?category=jrf&limit=10`);
  const jrfJson = await jrfSearchRes.json();
  assert(jrfSearchRes.status === 200, `/api/search?category=jrf returns HTTP 200`);
  assert(jrfJson.total_count > 0, `JRF category search accurately returns active listings (got ${jrfJson.total_count})`);

  const vlsiSearchRes = await fetch(`${BASE_URL}/api/search?q=VLSI&limit=10`);
  const vlsiJson = await vlsiSearchRes.json();
  assert(vlsiSearchRes.status === 200, `/api/search?q=VLSI returns HTTP 200`);
  assert(vlsiJson.total_count > 0, `VLSI keyword search accurately returns active listings (got ${vlsiJson.total_count})`);

  // -------------------------------------------------------------
  // TEST 6 & 7: AUTH & ROLE-SPECIFIC HOMEPAGE & RBAC
  // -------------------------------------------------------------
  console.log("\n--- TEST 6 & 7: Auth, Role-Specific Routing & RBAC ---");
  
  // Public user gets HTTP 200 on /
  const publicHomeRes = await fetch(`${BASE_URL}/`);
  assert(publicHomeRes.status === 200, `Public visitor receives HTTP 200 on /`);

  // Anonymous user blocked on protected employer route
  const anonEmployerProfileRes = await fetch(`${BASE_URL}/api/employer/company`);
  assert(anonEmployerProfileRes.status === 401, `Anonymous request to /api/employer/company receives HTTP 401`);

  // Unauthenticated admin page renders successfully
  const adminPageRes = await fetch(`${BASE_URL}/admin`);
  assert(adminPageRes.status === 200, `Unauthenticated request to /admin returns HTTP 200 client shell`);

  console.log("\n============================================================");
  console.log(`ACCEPTANCE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("============================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runAcceptanceTests().catch(err => {
  console.error("FATAL E2E:", err);
  process.exit(1);
});
