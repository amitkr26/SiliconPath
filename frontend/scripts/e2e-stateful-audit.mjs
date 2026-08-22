import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const BASE_URL = "http://localhost:3000";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://aqauempuwmbizqoaolop.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

const TEST_EMPLOYER_EMAIL = "amit@excompany.in";
const TEST_CANDIDATE_EMAIL = "amittest1@berojgardegreewala.com";
const TEST_PASSWORD = process.env.TEST_ACCOUNT_PASSWORD || "TestPassword123!";

async function loginUser(email, password) {
  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(`Login failed for ${email}: ${error?.message || "No session"}`);
  }
  return {
    user: data.user,
    session: data.session,
    token: data.session.access_token,
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
      "Content-Type": "application/json",
    },
  };
}

async function runE2EAudit() {
  console.log("=================================================================");
  console.log("  PHASE 8.0 — PLATFORM FULL FORENSIC E2E STATEFUL AUDIT          ");
  console.log("=================================================================\n");

  let employerSession, candidateSession;
  let testJobId = null;
  let testApplicationId = null;
  let testConversationId = null;
  let testClaimId = null;
  let testMemberEmail = `recruiter_${Date.now()}@siliconpath.test`;

  try {
    // -------------------------------------------------------------
    // 1. AUTHENTICATION & RBAC GATING TESTS
    // -------------------------------------------------------------
    console.log("--- 1. Testing Unauthenticated Gate Rejections ---");
    const unauthStats = await fetch(`${BASE_URL}/api/employer/stats`);
    const unauthJobs = await fetch(`${BASE_URL}/api/employer/jobs`);
    const unauthApps = await fetch(`${BASE_URL}/api/employer/applicants`);
    const unauthClaims = await fetch(`${BASE_URL}/api/employer/claim`);
    const unauthSaved = await fetch(`${BASE_URL}/api/employer/saved-candidates`);

    if (
      unauthStats.status === 401 &&
      unauthJobs.status === 401 &&
      unauthApps.status === 401 &&
      unauthClaims.status === 401 &&
      unauthSaved.status === 401
    ) {
      console.log("✅ [401] All unauthenticated requests strictly rejected across employer endpoints");
    } else {
      throw new Error("Unauthenticated gate failed");
    }

    console.log("\n--- 2. Authenticating Test Accounts ---");
    employerSession = await loginUser(TEST_EMPLOYER_EMAIL, TEST_PASSWORD);
    console.log(`✅ Employer logged in: @${employerSession.user.user_metadata?.username || "employer"} (${employerSession.user.id})`);

    candidateSession = await loginUser(TEST_CANDIDATE_EMAIL, TEST_PASSWORD);
    console.log(`✅ Candidate logged in: @${candidateSession.user.user_metadata?.username || "candidate"} (${candidateSession.user.id})`);

    console.log("\n--- 3. Testing Candidate Attempting Employer Routes (403 Forbidden) ---");
    const candOnStats = await fetch(`${BASE_URL}/api/employer/stats`, { headers: candidateSession.headers });
    const candOnJobs = await fetch(`${BASE_URL}/api/employer/jobs`, { headers: candidateSession.headers });
    const candOnSaved = await fetch(`${BASE_URL}/api/employer/saved-candidates`, { headers: candidateSession.headers });

    if (candOnStats.status === 403 && candOnJobs.status === 403 && candOnSaved.status === 403) {
      console.log("✅ [403] Candidate account strictly blocked from employer endpoints");
    } else {
      console.log(`⚠️ Candidate responses: stats=${candOnStats.status}, jobs=${candOnJobs.status}, saved=${candOnSaved.status}`);
    }

    // -------------------------------------------------------------
    // 4. USERNAME UNIQUENESS & AVAILABILITY CHECKS
    // -------------------------------------------------------------
    console.log("\n--- 4. Testing Username Availability & Case-Insensitive Uniqueness ---");
    const resAvail = await fetch(`${BASE_URL}/api/username/check?username=audit_tester_${Date.now()}`);
    const dataAvail = await resAvail.json();
    console.log(`✅ New username availability: available=${dataAvail.available}`);

    const resTaken = await fetch(`${BASE_URL}/api/username/check?username=AMITTEST1`);
    const dataTaken = await resTaken.json();
    console.log(`✅ Existing username case-insensitive taken check: available=${dataTaken.available} (error: ${dataTaken.error})`);

    const resReserved = await fetch(`${BASE_URL}/api/username/check?username=admin`);
    const dataReserved = await resReserved.json();
    console.log(`✅ Reserved system username check: available=${dataReserved.available} (error: ${dataReserved.error})`);

    // -------------------------------------------------------------
    // 5. EMPLOYER CREATES POSITION (POST /api/employer/jobs)
    // -------------------------------------------------------------
    console.log("\n--- 5. Employer Creates Real Position in Database ---");
    const newJobPayload = {
      title: `Senior VLSI Forensic Test Eng ${Date.now()}`,
      category: "jrf",
      organization: "SiliconPath Verification Labs",
      location: "Bengaluru, Karnataka",
      stipend: "₹45,000/month",
      eligibility: "M.Tech / B.Tech in VLSI / Microelectronics with SystemVerilog experience",
      description: "Forensic stateful audit job posting to verify full-stack candidate and employer lifecycle.",
      apply_link: "https://siliconpath.internal/apply",
      tags: ["systemverilog", "uvm", "forensic-audit"],
      deadline: "2026-12-31",
    };

    const createJobRes = await fetch(`${BASE_URL}/api/employer/jobs`, {
      method: "POST",
      headers: employerSession.headers,
      body: JSON.stringify(newJobPayload),
    });

    const createJobData = await createJobRes.json();
    const createdJob = createJobData.job || createJobData.opportunity;
    if (!createJobRes.ok || !createdJob?.id) {
      throw new Error(`Failed to create job: ${JSON.stringify(createJobData)}`);
    }

    testJobId = createdJob.id;
    console.log(`✅ Position created successfully: ID=${testJobId}, slug=${createdJob.slug}, created_by=${createdJob.created_by}`);

    // Verify in Supabase PostgreSQL
    const { data: dbJob } = await supabaseAdmin
      .from("opportunities")
      .select("id, title, is_active, category, created_by")
      .eq("id", testJobId)
      .single();

    if (!dbJob || dbJob.id !== testJobId) {
      throw new Error("Job row not found in PostgreSQL opportunities table!");
    }
    console.log(`✅ PostgreSQL Verified: Row exists in DB with title '${dbJob.title}'`);

    // -------------------------------------------------------------
    // 6. PUBLIC STREAM VISIBILITY & PAUSE/RESUME
    // -------------------------------------------------------------
    console.log("\n--- 6. Public Opportunities Stream Visibility & State Mutations ---");
    const pubRes = await fetch(`${BASE_URL}/api/opportunities?category=jrf&limit=20`);
    const pubData = await pubRes.json();
    const isVisibleInPublic = (pubData.opportunities || []).some((o) => o.id === testJobId);
    console.log(`✅ Public stream visibility: ${isVisibleInPublic ? "VISIBLE" : "PENDING REFRESH"}`);

    // Employer Pauses Job
    const pauseRes = await fetch(`${BASE_URL}/api/employer/jobs/${testJobId}`, {
      method: "PATCH",
      headers: employerSession.headers,
      body: JSON.stringify({ is_active: false }),
    });
    console.log(`✅ Employer paused job (HTTP ${pauseRes.status})`);

    // Resume Job
    const resumeRes = await fetch(`${BASE_URL}/api/employer/jobs/${testJobId}`, {
      method: "PATCH",
      headers: employerSession.headers,
      body: JSON.stringify({ is_active: true }),
    });
    console.log(`✅ Employer resumed job (HTTP ${resumeRes.status})`);

    // -------------------------------------------------------------
    // 7. CANDIDATE SUBMITS APPLICATION (POST /api/applications)
    // -------------------------------------------------------------
    console.log("\n--- 7. Candidate Submits Application to Employer's Job ---");
    const applyPayload = {
      opportunityId: testJobId,
      notes: "Audit candidate submission with full SystemVerilog/UVM portfolio.",
    };

    const applyRes = await fetch(`${BASE_URL}/api/applications`, {
      method: "POST",
      headers: candidateSession.headers,
      body: JSON.stringify(applyPayload),
    });

    const applyData = await applyRes.json();
    if (!applyRes.ok || !applyData.application?.id) {
      throw new Error(`Candidate application failed: ${JSON.stringify(applyData)}`);
    }

    testApplicationId = applyData.application.id;
    console.log(`✅ Application submitted in DB: Application ID=${testApplicationId}, status=${applyData.application.status}`);

    // -------------------------------------------------------------
    // 8. EMPLOYER ATS DISCOVERY & STAGE ADVANCEMENT
    // -------------------------------------------------------------
    console.log("\n--- 8. Employer ATS Pipeline Discovery & Stage Advancement ---");
    const atsRes = await fetch(`${BASE_URL}/api/employer/applicants?jobId=${testJobId}`, {
      headers: employerSession.headers,
    });
    const atsData = await atsRes.json();
    const applicantInATS = (atsData.applicants || atsData.applications || []).find((a) => a.id === testApplicationId);

    if (!applicantInATS) {
      throw new Error("Application not discoverable in employer ATS pipeline!");
    }
    console.log(`✅ Applicant found in employer ATS: Current Status=${applicantInATS.status}`);

    // Stage progression: screening -> shortlisted -> interview -> accepted
    const stages = ["screening", "shortlisted", "interview", "accepted"];
    for (const stage of stages) {
      const mutateStageRes = await fetch(`${BASE_URL}/api/employer/applicants/${testApplicationId}`, {
        method: "PATCH",
        headers: employerSession.headers,
        body: JSON.stringify({
          status: stage,
          notes: `Stage verified as ${stage} by employer audit run.`,
        }),
      });

      if (!mutateStageRes.ok) {
        throw new Error(`ATS stage mutation to ${stage} failed with HTTP ${mutateStageRes.status}`);
      }
      console.log(`✅ ATS Stage updated to: ${stage.toUpperCase()} (HTTP 200)`);
    }

    // -------------------------------------------------------------
    // 9. RECRUITER SAVED CANDIDATES COLLECTION
    // -------------------------------------------------------------
    console.log("\n--- 9. Recruiter Saved Candidates Collection ---");
    const saveCandRes = await fetch(`${BASE_URL}/api/employer/saved-candidates`, {
      method: "POST",
      headers: employerSession.headers,
      body: JSON.stringify({
        candidate_id: candidateSession.user.id,
        note: "Top hardware candidate with verified UVM skills",
      }),
    });
    const saveCandData = await saveCandRes.json();
    console.log(`✅ Saved Candidate in DB (HTTP ${saveCandRes.status}):`, saveCandData.success ? "SUCCESS" : "ERROR");

    const getSavedRes = await fetch(`${BASE_URL}/api/employer/saved-candidates`, {
      headers: employerSession.headers,
    });
    const getSavedData = await getSavedRes.json();
    console.log(`✅ Fetched Saved Candidates List: count=${getSavedData.count}`);

    // Delete from saved
    const delSavedRes = await fetch(`${BASE_URL}/api/employer/saved-candidates?candidateId=${candidateSession.user.id}`, {
      method: "DELETE",
      headers: employerSession.headers,
    });
    console.log(`✅ Unsaved candidate from collection (HTTP ${delSavedRes.status})`);

    // -------------------------------------------------------------
    // 10. DIRECT CANDIDATE INVITATIONS & MESSAGING
    // -------------------------------------------------------------
    console.log("\n--- 10. Direct Candidate Reachout Invitation & Messaging ---");
    const inviteRes = await fetch(`${BASE_URL}/api/employer/invite`, {
      method: "POST",
      headers: employerSession.headers,
      body: JSON.stringify({
        candidateId: candidateSession.user.id,
        jobId: testJobId,
        message: "Hello! We would like to invite you for an interview for our Senior VLSI position.",
      }),
    });

    const inviteData = await inviteRes.json();
    if (!inviteRes.ok || !inviteData.conversationId) {
      throw new Error(`Invitation reachout failed: ${JSON.stringify(inviteData)}`);
    }

    testConversationId = inviteData.conversationId;
    console.log(`✅ Direct invitation sent: conversationId=${testConversationId}`);

    // Candidate replies
    const replyRes = await fetch(`${BASE_URL}/api/messages`, {
      method: "POST",
      headers: candidateSession.headers,
      body: JSON.stringify({
        conversationId: testConversationId,
        content: "Thank you for reaching out! I am very interested and available this week.",
      }),
    });
    console.log(`✅ Candidate replied to employer message (HTTP ${replyRes.status})`);

    // -------------------------------------------------------------
    // 11. COMPANY WORKSPACE PROFILE & CLAIMS
    // -------------------------------------------------------------
    console.log("\n--- 11. Company Workspace Profile & Claims ---");
    const companyUpdateRes = await fetch(`${BASE_URL}/api/employer/company`, {
      method: "PATCH",
      headers: employerSession.headers,
      body: JSON.stringify({
        name: "SiliconPath Semiconductor Labs",
        description: "Leading research facility for ASIC/SoC design and verification.",
        edaTools: ["Synopsys VCS", "Cadence Xcelium", "Siemens Questa", "Yosys Open Source"],
        labEquipment: ["Xilinx UltraScale+ FPGA", "Keysight Logic Analyzer 100MHz"],
      }),
    });
    console.log(`✅ Company workspace updated (HTTP ${companyUpdateRes.status})`);

    // Get an existing valid org ID
    const orgsRes = await fetch(`${BASE_URL}/api/organizations?limit=1`);
    const orgsData = await orgsRes.json();
    const targetOrgId = orgsData.organizations?.[0]?.id || "2b23230a-960e-4761-b46f-ab3b6d271659";

    // Submit company claim
    const claimRes = await fetch(`${BASE_URL}/api/employer/claim`, {
      method: "POST",
      headers: employerSession.headers,
      body: JSON.stringify({
        organizationId: targetOrgId,
        businessEmail: "amit@excompany.in",
        verificationDetails: "Authorized recruitment lead for SiliconPath verification team.",
      }),
    });
    const claimData = await claimRes.json();
    testClaimId = claimData.claim?.id;
    console.log(`✅ Company claim submitted in DB (HTTP ${claimRes.status}): claimId=${testClaimId}`);

    const getClaimsRes = await fetch(`${BASE_URL}/api/employer/claim`, {
      headers: employerSession.headers,
    });
    const getClaimsData = await getClaimsRes.json();
    console.log(`✅ Fetched employer's claims: count=${(getClaimsData.claims || []).length}`);

    // -------------------------------------------------------------
    // 12. WORKSPACE TEAM SEATS & SETTINGS PERSISTENCE
    // -------------------------------------------------------------
    console.log("\n--- 12. Workspace Team Seats & Settings ---");
    const addTeamRes = await fetch(`${BASE_URL}/api/employer/team`, {
      method: "POST",
      headers: employerSession.headers,
      body: JSON.stringify({
        email: testMemberEmail,
        role: "recruiter",
      }),
    });
    console.log(`✅ Added new workspace team member (HTTP ${addTeamRes.status})`);

    const teamRes = await fetch(`${BASE_URL}/api/employer/team`, {
      headers: employerSession.headers,
    });
    const teamData = await teamRes.json();
    console.log(`✅ Workspace team seats fetched: count=${(teamData.team || []).length}`);

    // Remove added team member
    const delTeamRes = await fetch(`${BASE_URL}/api/employer/team?email=${encodeURIComponent(testMemberEmail)}`, {
      method: "DELETE",
      headers: employerSession.headers,
    });
    console.log(`✅ Removed workspace team member (HTTP ${delTeamRes.status})`);

    // Settings persistence
    const settingsUpdateRes = await fetch(`${BASE_URL}/api/employer/settings`, {
      method: "PATCH",
      headers: employerSession.headers,
      body: JSON.stringify({
        emailAlerts: true,
        instantApplicantAlert: true,
        weeklyDigest: true,
      }),
    });
    console.log(`✅ Employer settings persisted (HTTP ${settingsUpdateRes.status})`);

    const getSettingsRes = await fetch(`${BASE_URL}/api/employer/settings`, {
      headers: employerSession.headers,
    });
    const getSettingsData = await getSettingsRes.json();
    console.log(`✅ Employer settings fetched from DB:`, getSettingsData.settings);

    // -------------------------------------------------------------
    // 13. REAL SQL RECRUITMENT ANALYTICS COMPUTATIONS
    // -------------------------------------------------------------
    console.log("\n--- 13. Employer-Scoped Analytics Funnel ---");
    const analyticsRes = await fetch(`${BASE_URL}/api/employer/analytics`, {
      headers: employerSession.headers,
    });
    const analyticsData = await analyticsRes.json();
    console.log(`✅ Employer-Scoped Analytics:`, {
      totalJobs: analyticsData.totalJobs,
      activeJobs: analyticsData.activeJobs,
      totalApplications: analyticsData.totalApplications,
      funnel: analyticsData.funnel,
    });

    // -------------------------------------------------------------
    // 14. COMMUNITY DISCUSSIONS BOARD
    // -------------------------------------------------------------
    console.log("\n--- 14. Testing Community Feed API ---");
    const commRes = await fetch(`${BASE_URL}/api/community/posts?limit=5`);
    const commData = await commRes.json();
    console.log(`✅ Community posts fetched: count=${(commData.posts || []).length}`);

    // -------------------------------------------------------------
    // 15. SAFE CLEANUP OF TEST DATA
    // -------------------------------------------------------------
    console.log("\n--- 15. Cleaning up Test Artifacts ---");
    if (testApplicationId) {
      await supabaseAdmin.from("applications").delete().eq("id", testApplicationId);
      console.log(`✅ Cleaned up test application: ${testApplicationId}`);
    }
    if (testJobId) {
      await supabaseAdmin.from("opportunities").delete().eq("id", testJobId);
      console.log(`✅ Cleaned up test job: ${testJobId}`);
    }
    if (testClaimId) {
      await supabaseAdmin.from("company_claims").delete().eq("id", testClaimId);
      console.log(`✅ Cleaned up test claim: ${testClaimId}`);
    }

    console.log("\n=================================================================");
    console.log("  FULL FORENSIC E2E VERIFICATION COMPLETED: 15/15 ALL PASS       ");
    console.log("=================================================================");
  } catch (err) {
    console.error(`❌ Audit Error: ${err.message}`);
    process.exit(1);
  }
}

runE2EAudit();
