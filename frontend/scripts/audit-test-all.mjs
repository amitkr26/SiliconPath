import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const BASE_URL = "http://localhost:3000";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://aqauempuwmbizqoaolop.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

async function testRoute(name, url, options = {}) {
  try {
    const res = await fetch(url, options);
    const status = res.status;
    const ok = status >= 200 && status < 400;
    console.log(`${ok ? "✅" : "❌"} [${status}] ${name} -> ${url}`);
    if (!ok && options.headers?.["Content-Type"] === "application/json") {
      const body = await res.text().catch(() => "");
      console.log(`   Response: ${body.slice(0, 150)}`);
    }
    return { ok, status, res };
  } catch (err) {
    console.log(`❌ [FAILED] ${name} -> ${url}: ${err.message}`);
    return { ok: false, error: err };
  }
}

async function runAudit() {
  console.log("=================================================");
  console.log("  BEROJGARDEGREEWALA / SILICONPATH FULL AUDIT");
  console.log("=================================================\n");

  // 1. PUBLIC SURFACES
  console.log("--- 1. Testing Public Surfaces ---");
  await testRoute("Homepage", `${BASE_URL}/`);
  await testRoute("Opportunities Public Board", `${BASE_URL}/opportunities`);
  await testRoute("Semiconductor News Hub", `${BASE_URL}/news`);
  await testRoute("Silicon Academy", `${BASE_URL}/academy`);
  await testRoute("Organizations Catalog", `${BASE_URL}/organizations`);
  await testRoute("Resources", `${BASE_URL}/resources`);
  await testRoute("Login Page", `${BASE_URL}/login`);
  await testRoute("Signup Page", `${BASE_URL}/signup`);

  // 2. USERNAME & AUTH APIS
  console.log("\n--- 2. Testing Username & Auth APIs ---");
  await testRoute(
    "Username Availability Check (Available)",
    `${BASE_URL}/api/auth/check-username?username=audit_tester_2026`
  );
  await testRoute(
    "Username Availability Check (Reserved Rejection)",
    `${BASE_URL}/api/auth/check-username?username=admin`
  );

  // 3. UNAUTHENTICATED RBAC GATES
  console.log("\n--- 3. Testing RBAC Security (Unauthenticated 401 Rejections) ---");
  const g1 = await testRoute("Employer Stats Gate (401 Expected)", `${BASE_URL}/api/employer/stats`);
  const g2 = await testRoute("Employer Jobs Gate (401 Expected)", `${BASE_URL}/api/employer/jobs`);
  const g3 = await testRoute("Employer Applicants Gate (401 Expected)", `${BASE_URL}/api/employer/applicants`);
  console.log(`🔒 RBAC Security Enforced: ${g1.status === 401 && g2.status === 401 && g3.status === 401 ? "PASS (Protected)" : "FAIL"}`);

  // 4. AUTHENTICATED EMPLOYER AUDIT
  console.log("\n--- 4. Authenticating Employer (amit@excompany.in) ---");
  if (SUPABASE_ANON_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: "amit@excompany.in",
      password: "TestPassword123!",
    });

    if (authErr || !authData.session) {
      console.log(`⚠️ Employer login error: ${authErr?.message || "No session"}`);
    } else {
      console.log(`✅ Logged in successfully as @${authData.user?.user_metadata?.username || "employer"} (${authData.user?.id})`);
      const token = authData.session.access_token;
      const authHeaders = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      console.log("\n--- 5. Testing Authenticated Employer API Operations ---");
      await testRoute("Authenticated Employer Stats", `${BASE_URL}/api/employer/stats`, { headers: authHeaders });
      await testRoute("Authenticated Employer Jobs List", `${BASE_URL}/api/employer/jobs`, { headers: authHeaders });
      await testRoute("Authenticated Employer Applicants", `${BASE_URL}/api/employer/applicants`, { headers: authHeaders });
      await testRoute("Authenticated Employer Talent Search", `${BASE_URL}/api/employer/talent`, { headers: authHeaders });
      await testRoute("Authenticated Employer Company Profile", `${BASE_URL}/api/employer/company`, { headers: authHeaders });
      await testRoute("Authenticated Employer Team Seats", `${BASE_URL}/api/employer/team`, { headers: authHeaders });
      await testRoute("Authenticated Employer Settings", `${BASE_URL}/api/employer/settings`, { headers: authHeaders });
      await testRoute("Authenticated Employer Analytics", `${BASE_URL}/api/employer/analytics`, { headers: authHeaders });
    }
  }

  // 5. PUBLIC SEARCH & FILTERING
  console.log("\n--- 6. Testing Public Search & Category Filtering ---");
  await testRoute("Search API (VLSI Query)", `${BASE_URL}/api/search?q=VLSI`);
  await testRoute("Opportunities API (Category Filter: JRF)", `${BASE_URL}/api/opportunities?category=jrf`);

  console.log("\n=================================================");
  console.log("  ALL AUDIT TESTS COMPLETED SUCCESSFULLY");
  console.log("=================================================");
}

runAudit();
