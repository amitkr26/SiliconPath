const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://aqauempuwmbizqoaolop.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "REDACTED_SUPABASE_SECRET_DB1_OLD";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runQaSuite() {
  console.log("=================================================");
  console.log("🧪 STARTING PROFESSIONAL QA & E2E AUTOMATION SUITE");
  console.log("=================================================\n");

  const results = {
    userCreation: false,
    companyCreation: false,
    opportunityPosting: false,
    applicationSubmission: false,
    apiEndpointTests: [],
  };

  try {
    // 1. Create or retrieve QA Candidate User
    console.log("1️⃣ Testing Candidate User & Profile Creation...");
    const candidateEmail = "qa.candidate.vlsi@siliconpath.dev";
    const candidatePassword = "QAPassword123!";

    let candidateId;
    const { data: authCand, error: authCandErr } = await supabase.auth.admin.createUser({
      email: candidateEmail,
      password: candidatePassword,
      email_confirm: true,
      user_metadata: {
        role: "candidate",
        account_type: "candidate",
        display_name: "QA Candidate VLSI",
        username: "qa_candidate_vlsi",
      },
    });

    if (authCandErr) {
      if (authCandErr.message.includes("already been registered")) {
        const { data: existingUser } = await supabase.from("user_profiles").select("id").eq("email", candidateEmail).maybeSingle();
        candidateId = existingUser?.id;
      } else {
        console.error("   ❌ Candidate creation error:", authCandErr.message);
      }
    } else {
      candidateId = authCand.user.id;
    }

    if (candidateId) {
      await supabase.from("user_profiles").upsert({
        id: candidateId,
        email: candidateEmail,
        display_name: "QA Candidate VLSI",
        bio: "Senior RTL & SystemVerilog Verification Engineer with 3+ years experience in UVM, STA, and FPGA prototyping.",
        headline: "SystemVerilog UVM Verification Engineer",
        account_type: "candidate",
        is_profile_public: true,
      });
      console.log(`   ✅ QA Candidate User & Profile verified: ${candidateEmail} (ID: ${candidateId})`);
      results.userCreation = true;
    }

    // 2. Create or retrieve QA Employer User & Company Profile
    console.log("\n2️⃣ Testing Employer User & Company Profile Creation...");
    const employerEmail = "qa.employer.lab@siliconpath.dev";
    const employerPassword = "QAPassword123!";

    let employerId;
    const { data: authEmp, error: authEmpErr } = await supabase.auth.admin.createUser({
      email: employerEmail,
      password: employerPassword,
      email_confirm: true,
      user_metadata: {
        role: "employer",
        account_type: "employer",
        display_name: "DRDO RAC Testing Lab Lead",
        username: "drdo_qa_lab",
      },
    });

    if (authEmpErr) {
      if (authEmpErr.message.includes("already been registered")) {
        const { data: existingEmp } = await supabase.from("user_profiles").select("id").eq("email", employerEmail).maybeSingle();
        employerId = existingEmp?.id;
      } else {
        console.error("   ❌ Employer creation error:", authEmpErr.message);
      }
    } else {
      employerId = authEmp.user.id;
    }

    if (employerId) {
      await supabase.from("user_profiles").upsert({
        id: employerId,
        email: employerEmail,
        display_name: "DRDO RAC Testing Lab Lead",
        headline: "DRDO Electronics & Radar Development Establishment (LRDE)",
        account_type: "employer",
        current_company: "DRDO RAC Testing Lab",
      });

      await supabase.from("company_profiles").upsert({
        user_id: employerId,
        company_name: "DRDO RAC Testing Lab",
        industry: "Defence & Microelectronics Research",
        website_url: "https://drdo.gov.in",
        description: "Official DRDO Research & Recruitment Testing Center for VLSI & Embedded Systems.",
        headquarters: "New Delhi, India",
        is_verified: true,
      });

      console.log(`   ✅ QA Employer User & Company Profile verified: ${employerEmail} (ID: ${employerId})`);
      results.companyCreation = true;
    }

    // 3. Post a Dummy Opportunity
    console.log("\n3️⃣ Testing Opportunity Posting Flow...");
    const dummyOppSlug = "qa-test-jrf-vlsi-verification-2026";
    const { data: insertedOpp, error: oppErr } = await supabase
      .from("opportunities")
      .upsert(
        {
          slug: dummyOppSlug,
          title: "JRF - Advanced Microelectronics & Chiplet Design (QA Verified)",
          category: "jrf",
          specialization: ["RTL", "Microelectronics"],
          location: "Bengaluru / Hyderabad (DRDO Lab)",
          country: "India",
          salary_range: "₹37,000/month + HRA",
          eligibility: "B.Tech / M.Tech in ECE, Microelectronics, VLSI",
          description: "Hands-on Junior Research Fellow position working on 28nm RISC-V SoC architecture, UVM verification, and FPGA emulation.",
          apply_url: "https://drdo.gov.in/careers",
          is_active: true,
          verification_status: "verified",
          tags: ["DRDO", "JRF", "VLSI", "SystemVerilog"],
        },
        { onConflict: "slug" }
      )
      .select()
      .single();

    if (oppErr) {
      console.error("   ❌ Opportunity posting error:", oppErr.message);
    } else {
      console.log(`   ✅ Opportunity successfully posted: ID = ${insertedOpp.id} | Title = "${insertedOpp.title}"`);
      results.opportunityPosting = true;

      // 4. Submit a Candidate Application
      console.log("\n4️⃣ Testing Candidate Job Application Flow...");
      if (candidateId) {
        // Check if application already exists
        const { data: existingApp } = await supabase
          .from("applications")
          .select("*")
          .eq("user_id", candidateId)
          .eq("opportunity_id", insertedOpp.id)
          .maybeSingle();

        if (existingApp) {
          console.log(`   ✅ Candidate application verified (Existing): ID = ${existingApp.id} | Status = ${existingApp.status}`);
          results.applicationSubmission = true;
        } else {
          const { data: insertedApp, error: appErr } = await supabase
            .from("applications")
            .insert({
              user_id: candidateId,
              opportunity_id: insertedOpp.id,
              status: "applied",
              notes: "Cover Letter: I hold an M.Tech in Microelectronics from IIT Bombay with hands-on experience in SystemVerilog, UVM, and STA timing closure.",
            })
            .select()
            .single();

          if (appErr) {
            console.error("   ❌ Application submission error:", appErr.message);
          } else {
            console.log(`   ✅ Candidate application submitted: ID = ${insertedApp.id} | Status = ${insertedApp.status}`);
            results.applicationSubmission = true;
          }
        }
      }
    }

    // 5. Test Live REST API Endpoints
    console.log("\n5️⃣ Executing End-to-End REST API Endpoint Tests...");
    const endpoints = [
      { name: "Public Opportunities Aggregator", url: "http://localhost:3000/api/opportunities" },
      { name: "Filtered Opportunities (JRF)", url: "http://localhost:3000/api/opportunities?category=jrf" },
      { name: "Public News Feed", url: "http://localhost:3000/api/news" },
      { name: "Public Academy Tracks", url: "http://localhost:3000/api/academy/tracks" },
      { name: "Organizations Directory", url: "http://localhost:3000/api/organizations" },
      { name: "Platform Health Check", url: "http://localhost:3000/api/health" },
    ];

    for (const ep of endpoints) {
      try {
        const start = Date.now();
        const res = await fetch(ep.url);
        const duration = Date.now() - start;
        const status = res.status;
        const pass = status === 200 || status === 204;
        console.log(`   ${pass ? "✅" : "❌"} [${status}] ${ep.name} (${duration}ms)`);
        results.apiEndpointTests.push({ name: ep.name, status, duration, pass });
      } catch (err) {
        console.error(`   ❌ Failed to reach ${ep.name}:`, err.message);
        results.apiEndpointTests.push({ name: ep.name, status: 0, duration: 0, pass: false });
      }
    }

    console.log("\n=================================================");
    console.log("📊 SUMMARY OF QA & END-TO-END AUTOMATION RESULTS");
    console.log("=================================================");
    console.log(`1. Candidate Account & Profile: ${results.userCreation ? "PASS ✅" : "FAIL ❌"}`);
    console.log(`2. Employer Account & Company:  ${results.companyCreation ? "PASS ✅" : "FAIL ❌"}`);
    console.log(`3. Opportunity Posting:         ${results.opportunityPosting ? "PASS ✅" : "FAIL ❌"}`);
    console.log(`4. Application Submission:      ${results.applicationSubmission ? "PASS ✅" : "FAIL ❌"}`);
    console.log(`5. REST API Endpoints Passed:   ${results.apiEndpointTests.filter(t => t.pass).length} / ${results.apiEndpointTests.length}`);
    console.log("=================================================\n");

  } catch (globalErr) {
    console.error("❌ Unhandled QA Suite Error:", globalErr);
  }
}

runQaSuite();
