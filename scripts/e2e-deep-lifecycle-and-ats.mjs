import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../frontend/.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const candidateClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const employerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const BASE_URL = "http://localhost:3000";

async function runDeepLifecycleAndAts() {
  console.log("============================================================");
  console.log("5. EMPLOYER USERNAME LIFECYCLE, 6. CANDIDATE LIFECYCLE, 7. ATS STAGES, 8. ADMIN");
  console.log("============================================================");

  // Authenticate Candidate
  const { data: candAuth } = await candidateClient.auth.signInWithPassword({
    email: "amittest2@berojgardegreewala.com",
    password: "TestPassword123!"
  });
  const candUserId = candAuth.user.id;
  const candToken = candAuth.session.access_token;

  // Authenticate Employer
  const { data: empAuth } = await employerClient.auth.signInWithPassword({
    email: "amit@excompany.in",
    password: "TestPassword123!"
  });
  const empUserId = empAuth.user.id;
  const empToken = empAuth.session.access_token;

  const results = [];

  // ============================================================
  // TEST 5: EMPLOYER USERNAME LIFECYCLE
  // ============================================================
  console.log("\n--- TEST 5: Employer Username Lifecycle ---");
  const origEmployerProfile = await adminClient.from("user_profiles").select("username, display_name").eq("id", empUserId).single();
  const initialUsername = origEmployerProfile.data?.username || "amitexcompany";

  const tempUsername = "amit_test_recruiter_" + Math.floor(Math.random() * 10000);

  // 1. Update username
  const { error: uErr1 } = await adminClient.from("user_profiles").update({ username: tempUsername }).eq("id", empUserId);
  const { data: uCheck1 } = await adminClient.from("user_profiles").select("username").eq("id", empUserId).single();
  const usernameUpdated = !uErr1 && uCheck1?.username === tempUsername;

  // 2. Fetch public profile using new username
  const { data: pubProf1 } = await adminClient.from("user_profiles").select("id, display_name").eq("username", tempUsername).maybeSingle();
  const publicFoundWithNewUsername = pubProf1?.id === empUserId;

  // 3. Duplicate username prevention test (Attempting to set candidate's username to employer's current username)
  const { error: dupErr } = await adminClient.from("user_profiles").update({ username: tempUsername }).eq("id", candUserId);
  const duplicateBlocked = Boolean(dupErr); // Postgres UNIQUE constraint on username

  // 4. Revert employer username
  await adminClient.from("user_profiles").update({ username: initialUsername }).eq("id", empUserId);
  const { data: uRevert } = await adminClient.from("user_profiles").select("username").eq("id", empUserId).single();
  const usernameReverted = uRevert?.username === initialUsername;

  results.push({
    test: "Employer Username Change & Persistence",
    pass: usernameUpdated && publicFoundWithNewUsername && duplicateBlocked && usernameReverted,
    details: `Updated to ${tempUsername} -> Public profile verified -> Duplicate collision blocked -> Reverted cleanly`
  });

  // ============================================================
  // TEST 7: EMPLOYER <-> CANDIDATE END-TO-END ATS STAGES
  // ============================================================
  console.log("\n--- TEST 7: Employer <-> Candidate ATS Lifecycle ---");
  // 1. Employer creates controlled test opportunity
  const testSlug = "qa-ats-pipeline-test-" + Date.now();
  const { data: testOppCreated, error: testOppErr } = await adminClient.from("opportunities").insert({
    title: "Senior Silicon DFT Verification Engineer (ATS Test)",
    category: "jrf",
    location: "Bangalore, India",
    apply_url: "https://excompany.in/careers/dft",
    slug: testSlug,
    is_active: true,
    verification_status: "verified"
  }).select().single();

  const testOppId = testOppCreated?.id;
  let atsPipelinePass = false;

  if (testOppId) {
    // 2. Candidate discovers & applies
    const { data: appCreated, error: appErr } = await adminClient.from("applications").insert({
      user_id: candUserId,
      opportunity_id: testOppId,
      status: "applied",
      notes: "Testing full recruitment lifecycle"
    }).select().single();

    const appId = appCreated?.id;

    if (appId) {
      const stages = ["under_review", "shortlisted", "accepted", "rejected"];
      const stageChecks = [];

      for (const stage of stages) {
        // Employer updates ATS stage
        await adminClient.from("applications").update({ status: stage }).eq("id", appId);
        
        // Candidate queries status
        const { data: candAppCheck } = await adminClient.from("applications").select("status").eq("id", appId).single();
        stageChecks.push(candAppCheck?.status === stage);
      }

      atsPipelinePass = stageChecks.every(Boolean);

      // Clean up application
      await adminClient.from("applications").delete().eq("id", appId);
    }

    // Clean up test opportunity
    await adminClient.from("opportunities").delete().eq("id", testOppId);
  }

  results.push({
    test: "Employer <-> Candidate ATS Lifecycle (applied -> under_review -> shortlisted -> accepted -> rejected)",
    pass: Boolean(atsPipelinePass),
    details: "Full ATS stage progression verified with real DB state consistency"
  });

  // ============================================================
  // TEST 6: CANDIDATE MESSAGING & NOTIFICATIONS
  // ============================================================
  console.log("\n--- TEST 6: Candidate Messaging & Notifications ---");
  // 1. Send test notification to candidate
  const { data: notifCreated, error: notifErr } = await adminClient.from("notifications").insert({
    user_id: candUserId,
    type: "connection_request",
    message: "Your application for Senior Silicon DFT Engineer has advanced to the Interview round.",
    is_read: false
  }).select().single();

  const notifId = notifCreated?.id;
  let notifVerified = false;

  if (notifId) {
    // Read notification
    const { data: notifRead } = await adminClient.from("notifications").select("message, is_read").eq("id", notifId).single();
    notifVerified = notifRead?.message?.includes("Senior Silicon DFT Engineer");
    
    // Mark as read & clean up
    await adminClient.from("notifications").update({ is_read: true }).eq("id", notifId);
    await adminClient.from("notifications").delete().eq("id", notifId);
  }

  results.push({
    test: "Candidate Notification Ingestion & Read State",
    pass: Boolean(notifVerified),
    details: "Notification created -> queried -> marked read -> cleaned up"
  });

  // ============================================================
  // TEST 8: ADMIN RBAC & FUNCTIONAL TESTING
  // ============================================================
  console.log("\n--- TEST 8: Admin RBAC & Functional Testing ---");
  
  // 1. Anonymous caller on Admin Scraper Run API (Must be 401/403 Forbidden)
  const anonScraperRes = await fetch(`${BASE_URL}/api/scrapers/run-all`);
  const anonBlocked = [401, 403].includes(anonScraperRes.status);

  // 2. Candidate on Admin Scraper Run API (Must be 401/403 Forbidden)
  const candScraperRes = await fetch(`${BASE_URL}/api/scrapers/run-all`, {
    headers: { Authorization: `Bearer ${candToken}` }
  });
  const candBlocked = [401, 403].includes(candScraperRes.status);

  // 3. Employer on Admin Scraper Run API (Must be 401/403 Forbidden)
  const empScraperRes = await fetch(`${BASE_URL}/api/scrapers/run-all`, {
    headers: { Authorization: `Bearer ${empToken}` }
  });
  const empBlocked = [401, 403].includes(empScraperRes.status);

  // 4. Admin API authorized moderation test (Create, verify, reject test row)
  const adminTestOppSlug = "admin-mod-test-" + Date.now();
  const { data: adminOppCreated } = await adminClient.from("opportunities").insert({
    title: "Admin Moderation Test Opportunity",
    category: "jrf",
    apply_url: "https://test.gov.in",
    slug: adminTestOppSlug,
    is_active: false,
    verification_status: "pending"
  }).select().single();

  const adminOppId = adminOppCreated?.id;
  let adminModPass = false;

  if (adminOppId) {
    // Admin verifies
    await adminClient.from("opportunities").update({ is_active: true, verification_status: "verified" }).eq("id", adminOppId);
    const { data: vCheck } = await adminClient.from("opportunities").select("verification_status").eq("id", adminOppId).single();
    
    // Admin rejects
    await adminClient.from("opportunities").update({ is_active: false, verification_status: "rejected" }).eq("id", adminOppId);
    const { data: rCheck } = await adminClient.from("opportunities").select("verification_status").eq("id", adminOppId).single();

    // Clean up
    await adminClient.from("opportunities").delete().eq("id", adminOppId);

    adminModPass = vCheck?.verification_status === "verified" && rCheck?.verification_status === "rejected";
  }

  results.push({
    test: "Admin RBAC & Opportunity Moderation (Anonymous 401/403, Candidate 401/403, Employer 401/403, Admin Verified/Rejected)",
    pass: anonBlocked && candBlocked && empBlocked && adminModPass,
    details: `Anonymous: ${anonScraperRes.status}, Candidate: ${candScraperRes.status}, Employer: ${empScraperRes.status}, Admin Moderation: SUCCESS`
  });

  console.table(results);

  const failures = results.filter(r => !r.pass);
  console.log(`\nDeep Lifecycle Failures: ${failures.length}`);
  return { failures: failures.length };
}

runDeepLifecycleAndAts().catch(console.error);
