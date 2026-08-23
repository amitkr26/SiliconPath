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

async function runSecurityAndWorkflows() {
  console.log("============================================================");
  console.log("5. CANDIDATE E2E, 6. EMPLOYER E2E, 7. ROLE ISOLATION, 10. SECURITY");
  console.log("============================================================");

  // 1. Authenticate Candidate
  console.log("\n--- STEP 1: Candidate Authentication ---");
  const { data: candAuth, error: candAuthErr } = await candidateClient.auth.signInWithPassword({
    email: "amittest2@berojgardegreewala.com",
    password: "TestPassword123!"
  });
  if (candAuthErr) throw new Error("Candidate login failed: " + candAuthErr.message);
  const candToken = candAuth.session.access_token;
  const candUserId = candAuth.user.id;
  console.log(`Candidate Authenticated: ${candUserId}`);

  // 2. Authenticate Employer
  console.log("\n--- STEP 2: Employer Authentication ---");
  const { data: empAuth, error: empAuthErr } = await employerClient.auth.signInWithPassword({
    email: "amit@excompany.in",
    password: "TestPassword123!"
  });
  if (empAuthErr) throw new Error("Employer login failed: " + empAuthErr.message);
  const empToken = empAuth.session.access_token;
  const empUserId = empAuth.user.id;
  console.log(`Employer Authenticated: ${empUserId}`);

  const results = [];

  // Candidate Bookmark Test (Save / Unsave)
  console.log("\n--- STEP 3: Candidate Bookmark Mutation & Persistence ---");
  const { data: sampleOpp } = await adminClient.from("opportunities").select("id").eq("is_active", true).limit(1).single();
  const testOppId = sampleOpp.id;

  // Insert bookmark
  const { error: bmInsertErr } = await adminClient.from("saved_opportunities").upsert({
    user_id: candUserId,
    opportunity_id: testOppId
  });
  const bmSaved = !bmInsertErr;
  
  // Verify persistence
  const { data: bmCheck } = await adminClient.from("saved_opportunities").select("id").eq("user_id", candUserId).eq("opportunity_id", testOppId);
  const bmPersisted = Boolean(bmCheck && bmCheck.length > 0);

  // Unsave bookmark
  const { error: bmDeleteErr } = await adminClient.from("saved_opportunities").delete().eq("user_id", candUserId).eq("opportunity_id", testOppId);
  const bmUnsaved = !bmDeleteErr;

  results.push({ test: "Candidate Save / Unsave Bookmark", pass: bmSaved && bmPersisted && bmUnsaved });

  // Candidate Profile Sub-resource CRUD
  console.log("\n--- STEP 4: Candidate Profile Sub-resources CRUD ---");
  // Education CRUD
  const eduItem = {
    candidate_id: candUserId,
    institution: "IIT Bombay Microelectronics",
    degree: "M.Tech",
    field_of_study: "VLSI Design",
    start_year: 2024,
    end_year: 2026
  };
  const { data: eduCreated, error: eduErr } = await adminClient.from("candidate_educations").insert(eduItem).select().single();
  const eduId = eduCreated?.id;
  let eduVerified = false;
  if (eduId) {
    const { data: eduRead } = await adminClient.from("candidate_educations").select("degree").eq("id", eduId).single();
    eduVerified = eduRead?.degree === "M.Tech";
    await adminClient.from("candidate_educations").delete().eq("id", eduId);
  }
  results.push({ test: "Candidate Education CRUD", pass: Boolean(eduVerified) });

  // Experience CRUD
  const expItem = {
    candidate_id: candUserId,
    company_name: "Cadence Design Systems",
    role_title: "RTL Design Intern",
    start_date: "2025-01-01",
    end_date: "2025-06-30"
  };
  const { data: expCreated } = await adminClient.from("candidate_experiences").insert(expItem).select().single();
  const expId = expCreated?.id;
  let expVerified = false;
  if (expId) {
    const { data: expRead } = await adminClient.from("candidate_experiences").select("company_name").eq("id", expId).single();
    expVerified = expRead?.company_name === "Cadence Design Systems";
    await adminClient.from("candidate_experiences").delete().eq("id", expId);
  }
  results.push({ test: "Candidate Experience CRUD", pass: Boolean(expVerified) });

  // Projects CRUD
  const projItem = {
    candidate_id: candUserId,
    title: "5-Stage Pipelined RISC-V RV32I Core",
    technologies: ["SystemVerilog", "ModelSim", "Vivado"]
  };
  const { data: projCreated } = await adminClient.from("candidate_projects").insert(projItem).select().single();
  const projId = projCreated?.id;
  let projVerified = false;
  if (projId) {
    const { data: projRead } = await adminClient.from("candidate_projects").select("title").eq("id", projId).single();
    projVerified = projRead?.title === "5-Stage Pipelined RISC-V RV32I Core";
    await adminClient.from("candidate_projects").delete().eq("id", projId);
  }
  results.push({ test: "Candidate Projects CRUD", pass: Boolean(projVerified) });

  // Employer Job Posting Lifecycle (Draft -> Publish -> Pause -> Delete)
  console.log("\n--- STEP 5: Employer Job Lifecycle ---");
  const testJob = {
    title: "QA Validation Senior VLSI Architect",
    category: "jrf",
    location: "Bangalore",
    apply_url: "https://excompany.in/careers/vlsi",
    slug: "qa-val-senior-vlsi-architect-" + Date.now(),
    is_active: false,
    verification_status: "pending"
  };
  const { data: jobCreated, error: jobErr } = await adminClient.from("opportunities").insert(testJob).select().single();
  const testJobId = jobCreated?.id;
  let jobLifecyclePass = false;

  if (testJobId) {
    // Publish
    await adminClient.from("opportunities").update({ is_active: true, verification_status: "verified" }).eq("id", testJobId);
    const { data: pubCheck } = await adminClient.from("opportunities").select("is_active").eq("id", testJobId).single();
    
    // Pause
    await adminClient.from("opportunities").update({ is_active: false }).eq("id", testJobId);
    const { data: pauseCheck } = await adminClient.from("opportunities").select("is_active").eq("id", testJobId).single();

    // Clean up
    await adminClient.from("opportunities").delete().eq("id", testJobId);

    jobLifecyclePass = pubCheck?.is_active === true && pauseCheck?.is_active === false;
  }
  results.push({ test: "Employer Job Lifecycle (Draft/Publish/Pause)", pass: jobLifecyclePass });

  // Security & Role Isolation Matrix
  console.log("\n--- STEP 6: Security & Role Isolation Matrix ---");

  // 1. Unauthenticated access to protected API
  const unauthRes = await fetch(`${BASE_URL}/api/employer/applicants`);
  results.push({ test: "Unauthenticated -> /api/employer/applicants (Expect 401)", pass: unauthRes.status === 401 });

  // 2. Candidate accessing employer API
  const candOnEmpRes = await fetch(`${BASE_URL}/api/employer/analytics`, {
    headers: { Authorization: `Bearer ${candToken}` }
  });
  results.push({ test: "Candidate -> /api/employer/analytics (Expect 401/403)", pass: candOnEmpRes.status === 401 || candOnEmpRes.status === 403 });

  // 3. Candidate accessing admin route directly
  const candOnAdminRes = await fetch(`${BASE_URL}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${candToken}` }
  });
  results.push({ test: "Candidate -> /api/admin/metrics (Expect 401/403/404)", pass: [401, 403, 404].includes(candOnAdminRes.status) });

  // 4. Employer accessing admin route directly
  const empOnAdminRes = await fetch(`${BASE_URL}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${empToken}` }
  });
  results.push({ test: "Employer -> /api/admin/metrics (Expect 401/403/404)", pass: [401, 403, 404].includes(empOnAdminRes.status) });

  // 5. Unauthenticated user cannot access applications
  const unauthAppRes = await fetch(`${BASE_URL}/api/applications`);
  results.push({ test: "Unauthenticated -> /api/applications (Expect 401)", pass: unauthAppRes.status === 401 });

  console.table(results);

  const failures = results.filter(r => !r.pass);
  console.log(`\nSecurity & Workflow Failures: ${failures.length}`);
  return { failures: failures.length };
}

runSecurityAndWorkflows().catch(err => {
  console.error("FATAL SECURITY & WORKFLOWS:", err);
  process.exit(1);
});
