import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
fs.readFileSync("frontend/.env.local", "utf-8").split("\n").forEach((line) => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) {
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    env[m[1].trim()] = val;
  }
});

const targetBaseUrl = process.env.TARGET_URL || "http://localhost:3000";
const isProduction = targetBaseUrl.includes("vercel.app");

console.log(`========================================================================`);
console.log(`  MULTI-PRINCIPAL IDOR ATTACK HARNESS`);
console.log(`  Target Environment : ${isProduction ? "PRODUCTION" : "LOCAL HTTP"}`);
console.log(`  Target Base URL     : ${targetBaseUrl}`);
console.log(`========================================================================\n`);

const adminSb = createClient(env["NEXT_PUBLIC_SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"]);
const anonSb = createClient(env["NEXT_PUBLIC_SUPABASE_URL"], env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]);

async function runVerification() {
  const { data: { users }, error: uErr } = await adminSb.auth.admin.listUsers();
  if (uErr || !users || users.length < 3) {
    console.error("Insufficient users in database:", uErr);
    return;
  }

  const employers = users.filter(u => u.user_metadata?.role === "employer" || u.user_metadata?.account_type === "employer");
  const candidates = users.filter(u => u.user_metadata?.role === "seeker" || u.user_metadata?.account_type === "seeker" || !u.user_metadata?.role);

  const empA = employers[0];
  const empB = employers[1] || employers[0];
  const cand = candidates[0];

  console.log(`Principals Mapped:`);
  console.log(`  Employer A (Attacker 1) : ${empA.id} (${empA.email})`);
  console.log(`  Employer B (Owner)      : ${empB.id} (${empB.email})`);
  console.log(`  Candidate (Attacker 2)  : ${cand.id} (${cand.email})\n`);

  // Obtain authentic session tokens
  const linkA = await adminSb.auth.admin.generateLink({ type: "magiclink", email: empA.email });
  const linkB = await adminSb.auth.admin.generateLink({ type: "magiclink", email: empB.email });
  const linkC = await adminSb.auth.admin.generateLink({ type: "magiclink", email: cand.email });

  let tokenA, tokenB, tokenC;
  if (linkA.data?.properties?.hashed_token) {
    const sA = await anonSb.auth.verifyOtp({ token_hash: linkA.data.properties.hashed_token, type: "magiclink" });
    tokenA = sA.data.session?.access_token;
  }
  if (linkB.data?.properties?.hashed_token) {
    const sB = await anonSb.auth.verifyOtp({ token_hash: linkB.data.properties.hashed_token, type: "magiclink" });
    tokenB = sB.data.session?.access_token;
  }
  if (linkC.data?.properties?.hashed_token) {
    const sC = await anonSb.auth.verifyOtp({ token_hash: linkC.data.properties.hashed_token, type: "magiclink" });
    tokenC = sC.data.session?.access_token;
  }

  // Seed Disposable Test Fixtures
  await adminSb.from("applications").delete().eq("user_id", cand.id);
  await adminSb.from("opportunities").delete().eq("created_by", empB.id);

  const { data: oppB } = await adminSb
    .from("opportunities")
    .insert({
      title: "QA Test Opp - Employer B",
      category: "jrf",
      location: "Bengaluru",
      organization: "Employer B Test Corp",
      created_by: empB.id,
      is_active: true,
      source_type: "employer_posted",
      verification_status: "verified",
      apply_url: "https://example.com/apply-test",
      slug: `qa-test-opp-b-${Date.now()}`
    })
    .select()
    .single();

  const { data: appB } = await adminSb
    .from("applications")
    .insert({
      user_id: cand.id,
      opportunity_id: oppB.id,
      status: "applied",
      notes: "Original candidate submission"
    })
    .select()
    .single();

  console.log(`Seeded Test Fixtures:`);
  console.log(`  Opp B ID : ${oppB.id} (Owner: ${empB.id})`);
  console.log(`  App B ID : ${appB.id} (Candidate: ${cand.id})\n`);

  // TEST 1: Employer A attempts to PATCH Employer B's Job
  console.log(`[TEST 1] Employer A PATCH Employer B Job:`);
  const res1 = await fetch(`${targetBaseUrl}/api/employer/jobs`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenA}` },
    body: JSON.stringify({ id: oppB.id, title: "HACKED TITLE BY EMPLOYER A" })
  });
  const body1 = await res1.json();
  const pass1 = res1.status === 403;
  console.log(`  Status: ${res1.status} | Expected: 403 | Result: ${pass1 ? "PASS" : "FAIL"}`);
  console.log(`  Response:`, body1);

  // TEST 2: Employer A attempts to DELETE Employer B's Job
  console.log(`\n[TEST 2] Employer A DELETE Employer B Job:`);
  const res2 = await fetch(`${targetBaseUrl}/api/employer/jobs?id=${oppB.id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${tokenA}` }
  });
  const body2 = await res2.json();
  const pass2 = res2.status === 403;
  console.log(`  Status: ${res2.status} | Expected: 403 | Result: ${pass2 ? "PASS" : "FAIL"}`);
  console.log(`  Response:`, body2);

  // TEST 3: Employer B (Owner) PATCH own Job
  console.log(`\n[TEST 3] Employer B (Owner) PATCH own Job:`);
  const res3 = await fetch(`${targetBaseUrl}/api/employer/jobs`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenB}` },
    body: JSON.stringify({ id: oppB.id, title: "Legitimate Update by Owner B" })
  });
  const body3 = await res3.json();
  const pass3 = res3.status === 200;
  console.log(`  Status: ${res3.status} | Expected: 200 | Result: ${pass3 ? "PASS" : "FAIL"}`);

  // TEST 4: Employer A attempts to PATCH Applicant on Employer B's Job
  console.log(`\n[TEST 4] Employer A PATCH Applicant on Employer B Job:`);
  const res4 = await fetch(`${targetBaseUrl}/api/employer/applicants`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenA}` },
    body: JSON.stringify({ id: appB.id, status: "rejected", notes: "Malicious rejection" })
  });
  const body4 = await res4.json();
  const pass4 = res4.status === 403;
  console.log(`  Status: ${res4.status} | Expected: 403 | Result: ${pass4 ? "PASS" : "FAIL"}`);
  console.log(`  Response:`, body4);

  // TEST 5: Employer B (Owner) PATCH Applicant on own Job
  console.log(`\n[TEST 5] Employer B (Owner) PATCH Applicant on own Job:`);
  const res5 = await fetch(`${targetBaseUrl}/api/employer/applicants`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenB}` },
    body: JSON.stringify({ id: appB.id, status: "shortlisted" })
  });
  const body5 = await res5.json();
  const pass5 = res5.status === 200;
  console.log(`  Status: ${res5.status} | Expected: 200 | Result: ${pass5 ? "PASS" : "FAIL"}`);

  // TEST 6: Candidate attempts Self-Approval
  console.log(`\n[TEST 6] Candidate attempts Self-Approval to 'accepted':`);
  const res6 = await fetch(`${targetBaseUrl}/api/applications`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenC}` },
    body: JSON.stringify({ id: appB.id, status: "accepted" })
  });
  const body6 = await res6.json();
  const pass6 = res6.status === 403;
  console.log(`  Status: ${res6.status} | Expected: 403 | Result: ${pass6 ? "PASS" : "FAIL"}`);
  console.log(`  Response:`, body6);

  // TEST 7: Candidate withdraws own application via DELETE
  console.log(`\n[TEST 7] Candidate withdraws own application via DELETE:`);
  const res7 = await fetch(`${targetBaseUrl}/api/applications?id=${appB.id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${tokenC}` },
  });
  const body7 = await res7.json();
  const pass7 = res7.status === 200;
  console.log(`  Status: ${res7.status} | Expected: 200 | Result: ${pass7 ? "PASS" : "FAIL"}`);

  // Seed fresh app for Test 8
  const { data: appB2 } = await adminSb
    .from("applications")
    .insert({
      user_id: cand.id,
      opportunity_id: oppB.id,
      status: "applied",
      notes: "Second candidate submission for direct endpoint test"
    })
    .select()
    .single();

  // TEST 8: Direct application IDOR on /api/applications/[id]
  console.log(`\n[TEST 8] Employer A calls /api/applications/[id] on Employer B's Application:`);
  const res8 = await fetch(`${targetBaseUrl}/api/applications/${appB2.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenA}` },
    body: JSON.stringify({ status: "shortlisted" })
  });
  const body8 = await res8.json();
  const pass8 = res8.status === 403;
  console.log(`  Status: ${res8.status} | Expected: 403 | Result: ${pass8 ? "PASS" : "FAIL"}`);
  console.log(`  Response:`, body8);

  // Cleanup fixtures
  await adminSb.from("applications").delete().eq("id", appB2.id);
  await adminSb.from("opportunities").delete().eq("id", oppB.id);
  console.log(`\nCleaned up all test fixtures from database.`);
}

runVerification().catch(console.error);
