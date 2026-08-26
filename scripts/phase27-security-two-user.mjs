import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../frontend/.env.local") });

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";
const CAND_EMAIL = process.env.TEST_CANDIDATE_EMAIL || "amittest1@berojgardegreewala.com";
const CAND_PASS = process.env.TEST_CANDIDATE_PASSWORD || "TestPassword123!";
const EMP_EMAIL = process.env.TEST_EMPLOYER_EMAIL || "employertest1@berojgardegreewala.com";
const EMP_PASS = process.env.TEST_EMPLOYER_PASSWORD || "EmployerTestPass123!";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function runSecurityAudit() {
  console.log("================================================================================");
  console.log("   PHASE 27: TWO-USER SECURITY & AUTHORIZATION ATTACK MATRIX                    ");
  console.log(`   TARGET: ${BASE_URL}`);
  console.log("================================================================================");

  let passed = 0;
  let failed = 0;
  const results = [];

  async function assertAttackBlocked(name, fn) {
    try {
      await fn();
      passed++;
      console.log(`🛡️ [SECURE] ${name}`);
      results.push({ name, blocked: true });
    } catch (err) {
      failed++;
      console.error(`💥 [VULNERABILITY] ${name} ->`, err.message);
      results.push({ name, blocked: false, error: err.message });
    }
  }

  // 1. Authenticate User A (Candidate)
  console.log("\n🔑 Authenticating User A (Candidate)...");
  const { data: authA, error: errA } = await supabase.auth.signInWithPassword({
    email: CAND_EMAIL,
    password: CAND_PASS,
  });
  if (errA || !authA.session) throw new Error(`Auth A failed: ${errA?.message}`);
  const tokenA = authA.session.access_token;
  const userA = authA.user;
  console.log(`   User A ID: ${userA.id} (${CAND_EMAIL})`);

  // 2. Authenticate User B (Employer)
  console.log("\n🔑 Authenticating User B (Employer)...");
  const { data: authB, error: errB } = await supabase.auth.signInWithPassword({
    email: EMP_EMAIL,
    password: EMP_PASS,
  });
  if (errB || !authB.session) throw new Error(`Auth B failed: ${errB?.message}`);
  const tokenB = authB.session.access_token;
  const userB = authB.user;
  console.log(`   User B ID: ${userB.id} (${EMP_EMAIL})`);

  const headersA = { Authorization: `Bearer ${tokenA}`, "Content-Type": "application/json" };
  const headersB = { Authorization: `Bearer ${tokenB}`, "Content-Type": "application/json" };
  const headersUnauth = { "Content-Type": "application/json" };

  // Setup: Create a post by User A
  console.log("\n📝 Setting up test post owned by User A...");
  const createPostRes = await fetch(`${BASE_URL}/api/feed`, {
    method: "POST",
    headers: headersA,
    body: JSON.stringify({ content: "Security test post by User A #RTL_Design" }),
  });
  if (!createPostRes.ok) {
    throw new Error(`Failed to create test post: HTTP ${createPostRes.status}`);
  }
  const postData = await createPostRes.json();
  const postAId = postData?.id;
  console.log(`   Created Post ID: ${postAId}`);

  // Test 1: User B attempts to edit User A's post
  await assertAttackBlocked("Cross-User Post Edit Attack (User B modifies User A's post)", async () => {
    const res = await fetch(`${BASE_URL}/api/feed/posts/${postAId}`, {
      method: "PATCH",
      headers: headersB,
      body: JSON.stringify({ content: "Hacked by User B!" }),
    });
    if (res.status === 200) {
      throw new Error(`Attack succeeded: HTTP 200 returned on unauthorized edit`);
    }
    if (res.status !== 401 && res.status !== 403 && res.status !== 404) {
      throw new Error(`Unexpected status code: HTTP ${res.status}`);
    }
  });

  // Test 2: User B attempts to delete User A's post
  await assertAttackBlocked("Cross-User Post Delete Attack (User B deletes User A's post)", async () => {
    const res = await fetch(`${BASE_URL}/api/feed/posts/${postAId}`, {
      method: "DELETE",
      headers: headersB,
    });
    if (res.status === 200) {
      throw new Error(`Attack succeeded: HTTP 200 returned on unauthorized delete`);
    }
    if (res.status !== 401 && res.status !== 403 && res.status !== 404) {
      throw new Error(`Unexpected status code: HTTP ${res.status}`);
    }
  });

  // Test 3: Anti-Self-Endorsement Enforcement
  await assertAttackBlocked("Anti-Self-Endorsement Attack (User A endorses own skill)", async () => {
    const res = await fetch(`${BASE_URL}/api/profile/amittest1/endorsements`, {
      method: "POST",
      headers: headersA,
      body: JSON.stringify({ skill: "Verilog RTL" }),
    });
    if (res.status === 200 || res.status === 201) {
      throw new Error(`Self-endorsement permitted: HTTP ${res.status}`);
    }
    if (res.status !== 400 && res.status !== 403) {
      throw new Error(`Unexpected status code: HTTP ${res.status}`);
    }
  });

  // Test 4: Unauthenticated Feed Post Creation Attack
  await assertAttackBlocked("Unauthenticated Post Creation Attack (No Auth Token)", async () => {
    const res = await fetch(`${BASE_URL}/api/feed`, {
      method: "POST",
      headers: headersUnauth,
      body: JSON.stringify({ content: "Anonymous spam post" }),
    });
    if (res.status === 200 || res.status === 201) {
      throw new Error(`Unauthenticated creation allowed: HTTP ${res.status}`);
    }
    if (res.status !== 401 && res.status !== 403) {
      throw new Error(`Unexpected status code: HTTP ${res.status}`);
    }
  });

  // Test 5: Unauthenticated Network Connection Request Attack
  await assertAttackBlocked("Unauthenticated Connection Request Attack", async () => {
    const res = await fetch(`${BASE_URL}/api/network/connect`, {
      method: "POST",
      headers: headersUnauth,
      body: JSON.stringify({ receiverId: userB.id }),
    });
    if (res.status === 200 || res.status === 201) {
      throw new Error(`Unauthenticated connection allowed: HTTP ${res.status}`);
    }
    if (res.status !== 401 && res.status !== 403) {
      throw new Error(`Unexpected status code: HTTP ${res.status}`);
    }
  });

  // Test 6: Candidate User A modifying Employer ATS Applicant Stage
  await assertAttackBlocked("Privilege Escalation Attack (Candidate modifies ATS stage)", async () => {
    const res = await fetch(`${BASE_URL}/api/employer/applicants`, {
      method: "PATCH",
      headers: headersA,
      body: JSON.stringify({ applicationId: "app-fake-123", stage: "accepted", notes: "Self-promoted" }),
    });
    if (res.status === 200) {
      throw new Error(`Privilege escalation succeeded: Candidate updated applicant stage`);
    }
    if (res.status !== 401 && res.status !== 403 && res.status !== 404) {
      throw new Error(`Unexpected status code: HTTP ${res.status}`);
    }
  });

  // Test 7: Unauthenticated Direct Message Sending Attack
  await assertAttackBlocked("Unauthenticated Direct Messaging Attack", async () => {
    const res = await fetch(`${BASE_URL}/api/messages`, {
      method: "POST",
      headers: headersUnauth,
      body: JSON.stringify({ recipientId: userA.id, content: "Unsolicited spam" }),
    });
    if (res.status === 200 || res.status === 201) {
      throw new Error(`Unauthenticated messaging allowed: HTTP ${res.status}`);
    }
    if (res.status !== 401 && res.status !== 403) {
      throw new Error(`Unexpected status code: HTTP ${res.status}`);
    }
  });

  // Cleanup: Delete test post by owner User A
  if (postAId) {
    console.log("\n🧹 Cleaning up test post by owner User A...");
    await fetch(`${BASE_URL}/api/feed/posts/${postAId}`, {
      method: "DELETE",
      headers: headersA,
    });
  }

  console.log("\n================================================================================");
  console.log(`   SECURITY AUDIT COMPLETE: ${passed} SECURE / ${failed} FAILED                 `);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAudit().catch((err) => {
  console.error("FATAL ERROR IN SECURITY AUDIT:", err);
  process.exit(1);
});
