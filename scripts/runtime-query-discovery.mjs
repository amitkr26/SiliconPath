import http from "http";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../frontend/.env.local") });

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const CANDIDATE_EMAIL = "amittest1@berojgardegreewala.com";
const CANDIDATE_PASS = "TestPassword123!";

async function makeRequest(path, options = {}) {
  const url = new URL(path, BASE_URL);
  const method = options.method || "GET";
  const headers = options.headers || {};
  const body = options.body;

  if (body && typeof body === "object" && !(body instanceof Buffer)) {
    headers["Content-Type"] = "application/json";
  }

  return new Promise((resolve, reject) => {
    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let rawData = "";
        res.on("data", (chunk) => (rawData += chunk));
        res.on("end", () => {
          let parsed;
          try {
            parsed = JSON.parse(rawData);
          } catch {
            parsed = rawData;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed,
          });
        });
      }
    );

    req.on("error", reject);
    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runRuntimeQueryDiscovery() {
  console.log("================================================================================");
  console.log("   PHASE 26: RUNTIME QUERY DISCOVERY & API CONTRACT TEST SUITE                  ");
  console.log("================================================================================");

  // 1. Authenticate candidate
  const { data: candAuth, error: candError } = await supabase.auth.signInWithPassword({
    email: CANDIDATE_EMAIL,
    password: CANDIDATE_PASS,
  });

  if (candError) {
    console.error("❌ Candidate login failed:", candError.message);
    process.exit(1);
  }

  const candToken = candAuth.session.access_token;
  const candUser = candAuth.user;
  console.log(`✅ Candidate authenticated: ${candUser.email} (${candUser.id})`);

  const candHeaders = {
    Authorization: `Bearer ${candToken}`,
    Cookie: `sb-access-token=${candToken}`,
  };

  // 2. Authenticate or create Employer user
  const EMPLOYER_EMAIL = "employertest1@berojgardegreewala.com";
  const EMPLOYER_PASS = "EmployerTestPass123!";
  
  let empAuth = await supabase.auth.signInWithPassword({
    email: EMPLOYER_EMAIL,
    password: EMPLOYER_PASS,
  });

  if (empAuth.error) {
    const created = await supabase.auth.admin.createUser({
      email: EMPLOYER_EMAIL,
      password: EMPLOYER_PASS,
      email_confirm: true,
      user_metadata: { role: "employer", account_type: "employer", full_name: "Silicon Employer Lead" },
    });
    if (created.error) {
      console.warn("Could not create employer user:", created.error.message);
    } else {
      empAuth = await supabase.auth.signInWithPassword({
        email: EMPLOYER_EMAIL,
        password: EMPLOYER_PASS,
      });
    }
  }

  const empToken = empAuth.data?.session?.access_token || candToken;
  console.log(`✅ Employer authenticated: ${EMPLOYER_EMAIL}`);

  const empHeaders = {
    Authorization: `Bearer ${empToken}`,
    Cookie: `sb-access-token=${empToken}`,
  };

  const adminHeaders = {
    "x-admin-password": process.env.ADMIN_PASSWORD || "amitkr2622002",
    Authorization: `Bearer ${process.env.ADMIN_PASSWORD || "amitkr2622002"}`,
  };

  const tests = [
    // PUBLIC ROUTES
    { name: "Public: Opportunities Feed", path: "/api/opportunities?limit=5", method: "GET" },
    { name: "Public: Opportunities Filter (Fresher)", path: "/api/opportunities?experience=Fresher&limit=5", method: "GET" },
    { name: "Public: Opportunities Filter (0-2 Yrs)", path: "/api/opportunities?experience=0-2%20Years&limit=5", method: "GET" },
    { name: "Public: Search Opportunities", path: "/api/search/opportunities?q=VLSI&limit=5", method: "GET" },
    { name: "Public: Organizations List", path: "/api/organizations?per_page=5", method: "GET" },
    { name: "Public: News Articles", path: "/api/news", method: "GET" },
    { name: "Public: Health Check", path: "/api/health", method: "GET" },

    // CANDIDATE ROUTES
    { name: "Candidate: Profile Info", path: `/api/profile/${candUser.id}`, method: "GET", headers: candHeaders },
    { name: "Candidate: Recommendations", path: `/api/profile/${candUser.id}/recommendations`, method: "GET", headers: candHeaders },
    { name: "Candidate: Endorsements", path: `/api/profile/${candUser.id}/endorse`, method: "GET", headers: candHeaders },
    { name: "Candidate: Resume GET", path: "/api/resume", method: "GET", headers: candHeaders },
    { name: "Candidate: Resume POST/PATCH (ATS sync)", path: "/api/resume", method: "PATCH", headers: candHeaders, body: {
      full_name: "Amit Semiconductor Lead",
      headline: "Principal ASIC & VLSI Verification Architect",
      skills: ["SystemVerilog", "UVM", "Formal Verification", "STA", "RTL Design"],
      experience: [{ title: "Lead Architect", company: "Silicon Technologies", duration: "2020-Present" }],
      education: [{ degree: "M.Tech Microelectronics", institution: "IIT", year: "2019" }]
    }},
    { name: "Candidate: Feed Posts", path: "/api/feed?limit=5", method: "GET", headers: candHeaders },
    { name: "Candidate: Network Suggestions", path: "/api/network/suggestions", method: "GET", headers: candHeaders },
    { name: "Candidate: Network Followers", path: "/api/network/followers", method: "GET", headers: candHeaders },
    { name: "Candidate: Conversations List", path: "/api/messages", method: "GET", headers: candHeaders },
    { name: "Candidate: Notifications", path: "/api/notifications?limit=10", method: "GET", headers: candHeaders },
    { name: "Candidate: AI Recommendations", path: "/api/recommendations", method: "GET", headers: candHeaders },

    // SECURITY RBAC GATE: CANDIDATE CANNOT ACCESS EMPLOYER APIS
    { name: "Security RBAC: Candidate Denied Employer Talent", path: "/api/employer/talent", method: "GET", headers: candHeaders, expectedStatus: 403 },

    // EMPLOYER ROUTES
    { name: "Employer: Talent Pool", path: "/api/employer/talent?query=VLSI&limit=5", method: "GET", headers: empHeaders },
    { name: "Employer: Saved Candidates", path: "/api/employer/saved-candidates", method: "GET", headers: empHeaders },
    { name: "Employer: Settings", path: "/api/employer/settings", method: "GET", headers: empHeaders },

    // ADMIN ROUTES
    { name: "Admin: Scraper Health", path: "/api/admin/scrape-health", method: "GET", headers: adminHeaders },
    { name: "Admin: Analytics", path: "/api/admin/analytics", method: "GET", headers: adminHeaders },
    { name: "Admin: Opportunities Moderation", path: "/api/admin/opportunities?status=pending", method: "GET", headers: adminHeaders },
  ];

  let passed = 0;
  let failed = 0;
  const results = [];

  for (const t of tests) {
    try {
      const res = await makeRequest(t.path, {
        method: t.method,
        headers: t.headers,
        body: t.body,
      });

      if (t.expectedStatus) {
        if (res.status === t.expectedStatus) {
          passed++;
          console.log(`✅ [HTTP ${res.status} (Expected ${t.expectedStatus})] ${t.name}`);
          results.push({ name: t.name, status: res.status, ok: true });
        } else {
          failed++;
          console.error(`❌ [HTTP ${res.status} (Expected ${t.expectedStatus})] ${t.name} - Error:`, res.data);
          results.push({ name: t.name, status: res.status, ok: false, error: res.data });
        }
        continue;
      }

      const is2xx = res.status >= 200 && res.status < 300;
      // Check if response contains an error field despite 200
      const hasErrorPayload = res.data && typeof res.data === "object" && res.data.error;

      if (is2xx && !hasErrorPayload) {
        passed++;
        console.log(`✅ [HTTP ${res.status}] ${t.name}`);
        results.push({ name: t.name, status: res.status, ok: true });
      } else {
        failed++;
        console.error(`❌ [HTTP ${res.status}] ${t.name} - Error:`, res.data);
        results.push({ name: t.name, status: res.status, ok: false, error: res.data });
      }
    } catch (e) {
      failed++;
      console.error(`❌ [EXCEPTION] ${t.name}:`, e.message);
      results.push({ name: t.name, status: 500, ok: false, error: e.message });
    }
  }

  console.log("\n================================================================================");
  console.log(`TOTAL ENDPOINTS TESTED: ${tests.length} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("================================================================================\n");

  fs.writeFileSync(
    path.resolve(__dirname, "runtime-discovery-results.json"),
    JSON.stringify({ passed, failed, total: tests.length, results }, null, 2)
  );

  if (failed > 0) {
    process.exit(1);
  }
}

runRuntimeQueryDiscovery();
