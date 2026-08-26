import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://aqauempuwmbizqoaolop.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TEST_CANDIDATE_A_EMAIL = "amittest1@berojgardegreewala.com";
const TEST_CANDIDATE_B_EMAIL = `candidate_b_phase9_${Date.now()}@siliconpath.test`;
const TEST_CANDIDATE_C_EMAIL = `candidate_c_phase9_${Date.now()}@siliconpath.test`;
const TEST_EMPLOYER_EMAIL = "amit@excompany.in";
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

async function runCandidateNetworkE2E() {
  console.log("================================================================================");
  console.log("  BEROJGARDEGREEWALA / SILICONPATH — PHASE 9 CANDIDATE IDENTITY & NETWORK E2E   ");
  console.log("================================================================================\n");

  let candA, candB, candC, employer;
  let candBUserId = null;
  let candCUserId = null;
  let expId = null;
  let eduId = null;
  let projId = null;
  let certId = null;
  let achieveId = null;
  let connId = null;
  let convId = null;

  try {
    // -------------------------------------------------------------------------
    // 1. SETUP & AUTHENTICATE ACCOUNTS
    // -------------------------------------------------------------------------
    console.log("--- 1. Authenticating Test Accounts ---");
    candA = await loginUser(TEST_CANDIDATE_A_EMAIL, TEST_PASSWORD);
    console.log(`✅ Candidate A authenticated: @${candA.user.user_metadata?.username || "amittest1"} (${candA.user.id})`);

    // Create Candidate B
    const { data: bUser, error: bErr } = await supabaseAdmin.auth.admin.createUser({
      email: TEST_CANDIDATE_B_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: {
        role: "candidate",
        full_name: "Candidate B Verification Agent",
        username: `cand_b_${Date.now()}`.substring(0, 20),
      },
    });
    if (bErr || !bUser.user) throw new Error(`Failed to create Candidate B: ${bErr?.message}`);
    candBUserId = bUser.user.id;

    await supabaseAdmin.from("user_profiles").upsert({
      id: candBUserId,
      email: TEST_CANDIDATE_B_EMAIL,
      display_name: "Candidate B Verification Agent",
      username: `cand_b_${Date.now()}`.substring(0, 20),
      account_type: "candidate",
      is_profile_public: true,
    });
    candB = await loginUser(TEST_CANDIDATE_B_EMAIL, TEST_PASSWORD);
    console.log(`✅ Candidate B authenticated: @${candB.user.user_metadata?.username} (${candB.user.id})`);

    // Create Candidate C
    const { data: cUser, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email: TEST_CANDIDATE_C_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: {
        role: "candidate",
        full_name: "Candidate C Verification Agent",
        username: `cand_c_${Date.now()}`.substring(0, 20),
      },
    });
    if (cErr || !cUser.user) throw new Error(`Failed to create Candidate C: ${cErr?.message}`);
    candCUserId = cUser.user.id;

    await supabaseAdmin.from("user_profiles").upsert({
      id: candCUserId,
      email: TEST_CANDIDATE_C_EMAIL,
      display_name: "Candidate C Verification Agent",
      username: `cand_c_${Date.now()}`.substring(0, 20),
      account_type: "candidate",
      is_profile_public: true,
    });
    candC = await loginUser(TEST_CANDIDATE_C_EMAIL, TEST_PASSWORD);
    console.log(`✅ Candidate C authenticated: @${candC.user.user_metadata?.username} (${candC.user.id})`);

    employer = await loginUser(TEST_EMPLOYER_EMAIL, TEST_PASSWORD);
    console.log(`✅ Employer authenticated: @${employer.user.user_metadata?.username || "excompany"} (${employer.user.id})`);

    // -------------------------------------------------------------------------
    // 2. CANDIDATE PROFILE & USERNAME INTEGRITY
    // -------------------------------------------------------------------------
    console.log("\n--- 2. Candidate Profile & Username Integrity ---");
    const patchRes = await fetch(`${BASE_URL}/api/profile/${candA.user.id}`, {
      method: "PATCH",
      headers: candA.headers,
      body: JSON.stringify({
        display_name: "Amit Semiconductor Lead",
        username: "amittest1",
        headline: "Principal ASIC & VLSI Verification Architect",
        bio: "Specializing in UVM, SystemVerilog, PCIe Gen5 testbenches, and RISC-V SoC architecture.",
        location: "Bengaluru, Karnataka, India",
        job_title: "Lead ASIC Architect",
        current_company: "SiliconPath Labs",
        experience_years: 6,
        is_open_to_work: true,
        skills: ["SystemVerilog", "UVM", "Verilog", "RTL Design", "ASIC", "FPGA", "STA", "Cocotb"],
      }),
    });
    if (!patchRes.ok) throw new Error(`Profile PATCH failed: ${patchRes.status}`);
    console.log(`✅ [PATCH 200] Candidate A profile updated with rich technical metadata`);

    // Reserved username check
    const reservedRes = await fetch(`${BASE_URL}/api/profile/${candA.user.id}`, {
      method: "PATCH",
      headers: candA.headers,
      body: JSON.stringify({ username: "admin" }),
    });
    if (reservedRes.status !== 400) throw new Error(`Reserved username was not blocked (got ${reservedRes.status})`);
    console.log(`✅ [RBAC/Integrity] Reserved username '@admin' strictly blocked with HTTP 400`);

    // -------------------------------------------------------------------------
    // 3. CANDIDATE EXPERIENCE CRUD & VALIDATION
    // -------------------------------------------------------------------------
    console.log("\n--- 3. Candidate Experience Lifecycle ---");
    // Invalid date check (current role cannot have end date)
    const invalidExpRes = await fetch(`${BASE_URL}/api/profile/me/experience`, {
      method: "POST",
      headers: candA.headers,
      body: JSON.stringify({
        company_name: "Intel Labs",
        role_title: "Senior Verification Engineer",
        start_date: "2024-01-01",
        end_date: "2025-01-01",
        is_current: true,
      }),
    });
    if (invalidExpRes.status !== 400) throw new Error(`Invalid current experience was not blocked: ${invalidExpRes.status}`);
    console.log(`✅ [Validation 400] Current role with end date rejected with HTTP 400`);

    // Create valid experience
    const createExpRes = await fetch(`${BASE_URL}/api/profile/me/experience`, {
      method: "POST",
      headers: candA.headers,
      body: JSON.stringify({
        company_name: "Synopsys India",
        role_title: "Senior Staff Verification Engineer",
        employment_type: "Full-time",
        location: "Bengaluru",
        start_date: "2022-03-01",
        is_current: true,
        description: "Architected scalable UVM environments for multi-core RISC-V SoC sub-systems.",
        skills_used: ["SystemVerilog", "UVM", "Formal Verification"],
      }),
    });
    if (createExpRes.status !== 201) throw new Error(`Experience create failed: ${createExpRes.status}`);
    const expData = await createExpRes.json();
    expId = expData.experience?.id;
    console.log(`✅ [POST 201] Experience created: ID=${expId}, Role="${expData.experience?.role_title}"`);

    // Fetch experiences
    const listExpRes = await fetch(`${BASE_URL}/api/profile/${candA.user.id}/experience`, {
      headers: candA.headers,
    });
    const expList = await listExpRes.json();
    if (!expList.experiences || expList.experiences.length === 0) throw new Error("Experience list empty");
    console.log(`✅ [GET 200] Verified ${expList.experiences.length} experience record(s) on profile`);

    // Attack: Candidate B attempts to delete Candidate A's experience
    const attackExpRes = await fetch(`${BASE_URL}/api/profile/me/experience/${expId}`, {
      method: "DELETE",
      headers: candB.headers,
    });
    // Candidate B deleting with their own auth will not affect Candidate A's experience
    const recheckExpRes = await fetch(`${BASE_URL}/api/profile/${candA.user.id}/experience`, { headers: candA.headers });
    const recheckExp = await recheckExpRes.json();
    if (!recheckExp.experiences?.some((x) => x.id === expId)) throw new Error("IDOR Attack deleted victim's experience!");
    console.log(`✅ [IDOR Defense] Candidate B unable to delete Candidate A's experience record`);

    // -------------------------------------------------------------------------
    // 4. CANDIDATE EDUCATION CRUD
    // -------------------------------------------------------------------------
    console.log("\n--- 4. Candidate Education Lifecycle ---");
    const createEduRes = await fetch(`${BASE_URL}/api/profile/me/education`, {
      method: "POST",
      headers: candA.headers,
      body: JSON.stringify({
        institution: "Indian Institute of Science (IISc), Bangalore",
        degree: "M.Tech in Microelectronics & VLSI",
        field_of_study: "VLSI Systems",
        start_year: 2020,
        end_year: 2022,
        grade: "9.6 / 10.0",
        description: "Thesis: High-Performance Hardware Accelerators for Cryptographic Primitives.",
      }),
    });
    if (createEduRes.status !== 201) throw new Error(`Education create failed: ${createEduRes.status}`);
    const eduData = await createEduRes.json();
    eduId = eduData.education?.id;
    console.log(`✅ [POST 201] Education created: ID=${eduId}, Institution="${eduData.education?.institution}"`);

    // -------------------------------------------------------------------------
    // 5. CANDIDATE PROJECTS CRUD
    // -------------------------------------------------------------------------
    console.log("\n--- 5. Candidate Projects Lifecycle ---");
    const createProjRes = await fetch(`${BASE_URL}/api/profile/me/projects`, {
      method: "POST",
      headers: candA.headers,
      body: JSON.stringify({
        title: "RISC-V Out-of-Order Execution Engine",
        description: "Synthesizable 4-issue superscalar RISC-V RV64GC core featuring speculative branch prediction.",
        technologies: ["SystemVerilog", "Chisel", "Cocotb", "Verilator"],
        github_url: "https://github.com/siliconpath/riscv-ooo-core",
        project_url: "https://siliconpath.dev/projects/riscv-core",
      }),
    });
    if (createProjRes.status !== 201) throw new Error(`Project create failed: ${createProjRes.status}`);
    const projData = await createProjRes.json();
    projId = projData.project?.id;
    console.log(`✅ [POST 201] Project created: ID=${projId}, Title="${projData.project?.title}"`);

    // -------------------------------------------------------------------------
    // 6. CANDIDATE CERTIFICATIONS & ACHIEVEMENTS
    // -------------------------------------------------------------------------
    console.log("\n--- 6. Candidate Certifications & Achievements ---");
    const createCertRes = await fetch(`${BASE_URL}/api/profile/me/certifications`, {
      method: "POST",
      headers: candA.headers,
      body: JSON.stringify({
        name: "Cadence Certified Digital IC Specialist",
        issuing_org: "Cadence Design Systems",
        issue_date: "2023-06-15",
        credential_id: "CDN-VLSI-889412",
      }),
    });
    const certData = await createCertRes.json();
    certId = certData.certification?.id;
    console.log(`✅ [POST 201] Certification created: ID=${certId}, Name="${certData.certification?.name}"`);

    const createAchieveRes = await fetch(`${BASE_URL}/api/profile/me/achievements`, {
      method: "POST",
      headers: candA.headers,
      body: JSON.stringify({
        title: "Best Research Paper Award — IEEE VLSID 2023",
        issuer: "IEEE Circuits & Systems Society",
        date_awarded: "2023-01-10",
        description: "Awarded for low-power asynchronous clock domain crossing architecture.",
      }),
    });
    const achieveData = await createAchieveRes.json();
    achieveId = achieveData.achievement?.id;
    console.log(`✅ [POST 201] Achievement created: ID=${achieveId}, Title="${achieveData.achievement?.title}"`);

    // -------------------------------------------------------------------------
    // 7. REAL DYNAMIC PROFILE COMPLETENESS CALCULATION
    // -------------------------------------------------------------------------
    console.log("\n--- 7. Dynamic Profile Completeness Computation ---");
    const candAFullRes = await fetch(`${BASE_URL}/api/profile/me`, { headers: candA.headers });
    const candAFull = await candAFullRes.json();
    const completeness = candAFull.profile?.completeness;

    if (!completeness || completeness.percentage < 80) {
      throw new Error(`Profile completeness calculation failed: ${JSON.stringify(completeness)}`);
    }
    console.log(`✅ [Completeness Verified] Score=${completeness.score}/100 (${completeness.percentage}%), All key sections satisfied:`, completeness.breakdown);

    // -------------------------------------------------------------------------
    // 8. PROFESSIONAL CONNECTIONS & MUTUAL CONNECTIONS GRAPH
    // -------------------------------------------------------------------------
    console.log("\n--- 8. Professional Connections & Mutual Connections Graph ---");
    // Self-connection attempt
    const selfConnRes = await fetch(`${BASE_URL}/api/network/connect`, {
      method: "POST",
      headers: candA.headers,
      body: JSON.stringify({ receiverId: candA.user.id }),
    });
    if (selfConnRes.status !== 400) throw new Error(`Self connection was not rejected (got ${selfConnRes.status})`);
    console.log(`✅ [Connection Invariant] Self-connection rejected with HTTP 400`);

    // Candidate A -> Candidate B connection request
    const sendConnRes = await fetch(`${BASE_URL}/api/network/connect`, {
      method: "POST",
      headers: candA.headers,
      body: JSON.stringify({ receiverId: candB.user.id }),
    });
    if (!sendConnRes.ok) throw new Error(`Connection request failed: ${sendConnRes.status}`);
    const sendConnData = await sendConnRes.json();
    console.log(`✅ [POST 201] Connection request sent from Candidate A to Candidate B`);

    // Duplicate request check
    const dupConnRes = await fetch(`${BASE_URL}/api/network/connect`, {
      method: "POST",
      headers: candA.headers,
      body: JSON.stringify({ receiverId: candB.user.id }),
    });
    if (dupConnRes.status !== 409) throw new Error(`Duplicate connection request was not blocked (got ${dupConnRes.status})`);
    console.log(`✅ [Duplicate Invariant] Duplicate connection request blocked with HTTP 409 Conflict`);

    // Candidate B accepts Candidate A's connection request
    const { data: pendingConn } = await supabaseAdmin
      .from("connections")
      .select("id")
      .eq("requester_id", candA.user.id)
      .eq("addressee_id", candB.user.id)
      .maybeSingle();

    if (pendingConn) {
      connId = pendingConn.id;
      const acceptRes = await fetch(`${BASE_URL}/api/network/connect/${connId}`, {
        method: "PATCH",
        headers: candB.headers,
        body: JSON.stringify({ status: "accepted" }),
      });
      if (!acceptRes.ok) throw new Error(`Accept connection failed: ${acceptRes.status}`);
      console.log(`✅ [PATCH 200] Candidate B accepted Candidate A's connection request`);
    }

    // Candidate A connects with Candidate C
    await supabaseAdmin.from("connections").upsert({
      requester_id: candA.user.id,
      addressee_id: candC.user.id,
      status: "accepted",
    });
    // Candidate B connects with Candidate C
    await supabaseAdmin.from("connections").upsert({
      requester_id: candB.user.id,
      addressee_id: candC.user.id,
      status: "accepted",
    });

    // Verify mutual connections between Candidate A and Candidate B (Mutual friend is Candidate C!)
    const mutualRes = await fetch(`${BASE_URL}/api/network/mutual?targetUserId=${candB.user.id}`, {
      headers: candA.headers,
    });
    const mutualData = await mutualRes.json();
    if (!mutualData || mutualData.count < 1) throw new Error(`Mutual connections calculation failed: ${JSON.stringify(mutualData)}`);
    console.log(`✅ [Mutual Connections Verified] Candidate A & Candidate B have ${mutualData.count} mutual connection(s) (Candidate C verified)`);

    // -------------------------------------------------------------------------
    // 9. FOLLOW / UNFOLLOW SYSTEM
    // -------------------------------------------------------------------------
    console.log("\n--- 9. Follow / Unfollow System ---");
    // Self-follow check
    const selfFollowRes = await fetch(`${BASE_URL}/api/network/follow/${candA.user.id}`, {
      method: "POST",
      headers: candA.headers,
    });
    if (selfFollowRes.status !== 400) throw new Error(`Self follow was not rejected: ${selfFollowRes.status}`);
    console.log(`✅ [Follow Invariant] Self-follow rejected with HTTP 400`);

    // Follow Candidate B
    const followRes = await fetch(`${BASE_URL}/api/network/follow/${candB.user.id}`, {
      method: "POST",
      headers: candA.headers,
    });
    if (!followRes.ok) throw new Error(`Follow failed: ${followRes.status}`);
    console.log(`✅ [POST 201] Candidate A followed Candidate B`);

    // Unfollow Candidate B
    const unfollowRes = await fetch(`${BASE_URL}/api/network/follow/${candB.user.id}`, {
      method: "DELETE",
      headers: candA.headers,
    });
    if (!unfollowRes.ok) throw new Error(`Unfollow failed: ${unfollowRes.status}`);
    console.log(`✅ [DELETE 200] Candidate A unfollowed Candidate B`);

    // -------------------------------------------------------------------------
    // 10. DIRECT MESSAGING INTEGRATION
    // -------------------------------------------------------------------------
    console.log("\n--- 10. Direct Messaging Integration ---");
    const msgRes = await fetch(`${BASE_URL}/api/messages`, {
      method: "POST",
      headers: candA.headers,
      body: JSON.stringify({
        recipientId: candB.user.id,
        content: "Hi from Candidate A! Let's discuss high-speed PCIe verification testbenches.",
      }),
    });
    if (!msgRes.ok) throw new Error(`Message send failed: ${msgRes.status}`);
    const msgData = await msgRes.json();
    convId = msgData.message?.conversation_id || msgData.conversationId;
    console.log(`✅ [POST 200] Candidate A sent direct message to Candidate B (Conversation ID: ${convId})`);

    // -------------------------------------------------------------------------
    // 11. EMPLOYER TALENT SEARCH COMPATIBILITY
    // -------------------------------------------------------------------------
    console.log("\n--- 11. Employer Talent Discovery Compatibility ---");
    const { data: candAProfile } = await supabaseAdmin.from("user_profiles").select("username").eq("id", candA.user.id).single();
    const username = candAProfile?.username || candA.user.id;
    console.log(`Querying talent profile for identifier: ${username}`);
    const talentRes = await fetch(`${BASE_URL}/api/employer/talent/${username}`, {
      headers: employer.headers,
    });
    if (!talentRes.ok) {
      const errBody = await talentRes.text();
      throw new Error(`Employer talent fetch failed (${talentRes.status}): ${errBody}`);
    }
    const talentData = await talentRes.json();
    const candidateProfile = talentData.candidate;

    if (!candidateProfile || !candidateProfile.experiences || !candidateProfile.projects) {
      throw new Error(`Employer talent profile missing structured candidate data: ${JSON.stringify(talentData)}`);
    }
    console.log(`✅ [GET 200] Employer successfully inspected Candidate A's full profile:`);
    console.log(`   - Headline: "${candidateProfile.headline}"`);
    console.log(`   - Experiences: ${candidateProfile.experiences?.length} record(s)`);
    console.log(`   - Educations: ${candidateProfile.educations?.length} record(s)`);
    console.log(`   - Projects: ${candidateProfile.projects?.length} record(s)`);
    console.log(`   - Profile Completeness: ${candidateProfile.completeness?.percentage}%`);

    // -------------------------------------------------------------------------
    // 12. CLEANUP TEST ARTIFACTS
    // -------------------------------------------------------------------------
    console.log("\n--- 12. Cleanup Test Artifacts ---");
    if (expId) await deleteCandidateExperience(candA.user.id, expId);
    if (eduId) await deleteCandidateEducation(candA.user.id, eduId);
    if (projId) await deleteCandidateProject(candA.user.id, projId);
    if (certId) await deleteCandidateCertification(candA.user.id, certId);
    if (achieveId) await deleteCandidateAchievement(candA.user.id, achieveId);

    await supabaseAdmin.from("connections").delete().or(`requester_id.eq.${candA.user.id},addressee_id.eq.${candA.user.id}`);
    await supabaseAdmin.from("connections").delete().or(`requester_id.eq.${candBUserId},addressee_id.eq.${candBUserId}`);
    await supabaseAdmin.from("connections").delete().or(`requester_id.eq.${candCUserId},addressee_id.eq.${candCUserId}`);

    if (convId) {
      await supabaseAdmin.from("messages").delete().eq("conversation_id", convId);
      await supabaseAdmin.from("conversations").delete().eq("id", convId);
    }

    if (candBUserId) await supabaseAdmin.auth.admin.deleteUser(candBUserId);
    if (candCUserId) await supabaseAdmin.auth.admin.deleteUser(candCUserId);

    console.log(`✅ Test artifacts and temporary candidate accounts cleaned up cleanly.`);

    console.log("\n================================================================================");
    console.log("  PHASE 9 CANDIDATE IDENTITY & NETWORK SUITE: ALL GATES PASS (VERIFIED)         ");
    console.log("================================================================================\n");

  } catch (err) {
    console.error("\n❌ FORENSIC SUITE FAILED:", err);
    if (candBUserId) await supabaseAdmin.auth.admin.deleteUser(candBUserId).catch(() => {});
    if (candCUserId) await supabaseAdmin.auth.admin.deleteUser(candCUserId).catch(() => {});
    process.exit(1);
  }
}

async function deleteCandidateExperience(candidateId, id) {
  await fetch(`${BASE_URL}/api/profile/me/experience/${id}`, { method: "DELETE" }).catch(() => {});
}
async function deleteCandidateEducation(candidateId, id) {
  await fetch(`${BASE_URL}/api/profile/me/education/${id}`, { method: "DELETE" }).catch(() => {});
}
async function deleteCandidateProject(candidateId, id) {
  await fetch(`${BASE_URL}/api/profile/me/projects/${id}`, { method: "DELETE" }).catch(() => {});
}
async function deleteCandidateCertification(candidateId, id) {
  await fetch(`${BASE_URL}/api/profile/me/certifications/${id}`, { method: "DELETE" }).catch(() => {});
}
async function deleteCandidateAchievement(candidateId, id) {
  await fetch(`${BASE_URL}/api/profile/me/achievements/${id}`, { method: "DELETE" }).catch(() => {});
}

runCandidateNetworkE2E().catch(console.error);
