const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://aqauempuwmbizqoaolop.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "REDACTED_SUPABASE_SECRET_DB1_OLD";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BASE_URL = "http://localhost:3000";

const testResults = [];

function recordTest(name, category, passed, details) {
  testResults.push({ name, category, status: passed ? "PASS ✅" : "FAIL ❌", details });
  console.log(`[${passed ? "PASS" : "FAIL"}] ${category} -> ${name}: ${details}`);
}

async function runFullQaAudit() {
  console.log("=================================================");
  console.log("🧪 EXHAUSTIVE PROFESSIONAL QA AUDIT & VERIFICATION");
  console.log("=================================================\n");

  // 1. Audit User Profiles & Auth Accounts
  console.log("--- 1. AUDITING AUTH & USER PROFILES ---");
  const { data: candUser, error: candErr } = await supabase.from("user_profiles").select("*").eq("email", "qa.candidate.vlsi@siliconpath.dev").single();
  recordTest("Candidate Profile Fetch", "Auth", !candErr && !!candUser, candErr ? candErr.message : `ID: ${candUser.id}`);

  const { data: empUser, error: empErr } = await supabase.from("user_profiles").select("*").eq("email", "qa.employer.lab@siliconpath.dev").single();
  recordTest("Employer Profile Fetch", "Auth", !empErr && !!empUser, empErr ? empErr.message : `ID: ${empUser.id}`);

  // 2. Audit Employer Postings Schema & Insert
  console.log("\n--- 2. AUDITING OPPORTUNITIES & JOB POSTINGS ---");
  const testSlug = `audit-job-post-${Date.now()}`;
  const jobPayload = {
    title: "Lead RISC-V SoC Architect (QA Audit Test)",
    category: "jrf",
    location: "Bengaluru, Karnataka",
    country: "India",
    salary_range: "₹2,500,000 - ₹3,500,000 / year",
    eligibility: "M.Tech / Ph.D in VLSI / Microelectronics with Chisel / SystemVerilog expertise",
    description: "Architect next-generation RISC-V vector processors for edge AI accelerators.",
    apply_url: "https://isro.gov.in/careers",
    tags: ["RISC-V", "Chisel", "SoC", "ISRO"],
    slug: testSlug,
    source_type: "employer_posted",
    verification_status: "verified",
    is_active: true
  };
  const { data: insertedJob, error: jobInsertErr } = await supabase.from("opportunities").insert([jobPayload]).select().single();
  recordTest("Employer Job Posting Insert", "Opportunities", !jobInsertErr && !!insertedJob, jobInsertErr ? jobInsertErr.message : `ID: ${insertedJob?.id}`);

  // 3. Audit Applications Table
  console.log("\n--- 3. AUDITING JOB APPLICATIONS ---");
  if (candUser && insertedJob) {
    const { data: appData, error: appErr } = await supabase.from("applications").insert([{
      user_id: candUser.id,
      opportunity_id: insertedJob.id,
      status: "applied",
      notes: "Submitted via QA Automated Test Suite"
    }]).select().single();
    recordTest("Candidate Application Submission", "Applications", !appErr && !!appData, appErr ? appErr.message : `App ID: ${appData?.id}`);
  }

  // 4. Audit Network Connections
  console.log("\n--- 4. AUDITING NETWORK & CONNECTIONS ---");
  if (candUser && empUser) {
    await supabase.from("connections").delete().or(`and(requester_id.eq.${candUser.id},addressee_id.eq.${empUser.id}),and(requester_id.eq.${empUser.id},addressee_id.eq.${candUser.id})`);
    const { data: connData, error: connErr } = await supabase.from("connections").insert([{
      requester_id: candUser.id,
      addressee_id: empUser.id,
      status: "pending"
    }]).select().single();
    recordTest("Network Connection Request", "Network", !connErr && !!connData, connErr ? connErr.message : `Conn ID: ${connData?.id}`);
  }

  // 5. Audit Direct Messaging
  console.log("\n--- 5. AUDITING DIRECT MESSAGES ---");
  if (candUser && empUser) {
    const a = candUser.id < empUser.id ? candUser.id : empUser.id;
    const b = candUser.id < empUser.id ? empUser.id : candUser.id;
    let { data: conv } = await supabase.from("conversations").select("*").eq("participant_a", a).eq("participant_b", b).maybeSingle();
    if (!conv) {
      const { data: newConv } = await supabase.from("conversations").insert([{ participant_a: a, participant_b: b, last_message_at: new Date().toISOString() }]).select().single();
      conv = newConv;
    }
    if (conv) {
      const { data: msgData, error: msgErr } = await supabase.from("messages").insert([{
        conversation_id: conv.id,
        sender_id: candUser.id,
        body: `QA Audit Message Ping at ${new Date().toISOString()}`,
        is_read: false
      }]).select().single();
      recordTest("Direct Message Send", "Messaging", !msgErr && !!msgData, msgErr ? msgErr.message : `Msg ID: ${msgData?.id}`);
    }
  }

  // 6. Audit REST API Endpoints Latency & Response Codes
  console.log("\n--- 6. AUDITING REST API ENDPOINTS ---");
  const endpoints = [
    { url: "/api/health", name: "Health Telemetry API" },
    { url: "/api/opportunities", name: "Opportunities Aggregator API" },
    { url: "/api/opportunities?category=jrf", name: "Filtered Opportunities API" },
    { url: "/api/news", name: "Semiconductor News API" },
    { url: "/api/academy/tracks", name: "VLSI Academy Tracks API" },
    { url: "/api/organizations", name: "Organizations Directory API" },
  ];

  for (const ep of endpoints) {
    try {
      const start = Date.now();
      const res = await fetch(BASE_URL + ep.url);
      const elapsed = Date.now() - start;
      const ok = res.status === 200;
      recordTest(ep.name, "REST API", ok, `HTTP ${res.status} (${elapsed}ms)`);
    } catch (err) {
      recordTest(ep.name, "REST API", false, err.message);
    }
  }

  console.log("\n=================================================");
  console.log("📊 QA AUDIT SUMMARY REPORT");
  console.log("=================================================");
  console.table(testResults);
}

// Allow dev server compilation time
setTimeout(runFullQaAudit, 3000);
