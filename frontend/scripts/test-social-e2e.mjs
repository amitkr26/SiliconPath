// End-to-end test: connections + messaging between amittest1 and amittest2
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const envLines = readFileSync("D:\\Tinkerscape\\SiliconPath\\frontend\\.env.local", "utf8")
  .split("\n").reduce((a, l) => { const m = l.match(/^([A-Z_]+)=(.*)/); if (m) a[m[1]] = m[2].trim(); return a; }, {});

const url = envLines.NEXT_PUBLIC_SUPABASE_URL;
const BASE = process.env.TEST_BASE_URL || envLines.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Create user-session clients (not admin)
const user1 = createClient(url, envLines.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const user2 = createClient(url, envLines.NEXT_PUBLIC_SUPABASE_ANON_KEY);

let passed = 0;
let failed = 0;
function assert(label, cond, detail) {
  if (cond) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ ${label}${detail ? ': ' + detail : ''}`); }
}

// Helper to call API as a specific user
async function apiAs(supabase, method, path, body) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session?.access_token}`,
  };
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

async function main() {
  console.log("=== Step 1: Login as amittest1 ===");
  const { error: e1 } = await user1.auth.signInWithPassword({
    email: "amittest1@berojgardegreewala.com",
    password: "TestPassword123!"
  });
  assert("amittest1 login", !e1, e1?.message);

  console.log("\n=== Step 2: Login as amittest2 ===");
  const { error: e2 } = await user2.auth.signInWithPassword({
    email: "amittest2@berojgardegreewala.com",
    password: "TestPassword123!"
  });
  assert("amittest2 login", !e2, e2?.message);

  // Get user IDs
  const { data: { user: u1 } } = await user1.auth.getUser();
  const { data: { user: u2 } } = await user2.auth.getUser();
  console.log(`  amittest1 ID: ${u1?.id}`);
  console.log(`  amittest2 ID: ${u2?.id}`);

  console.log("\n=== Step 3: Network suggestions (as amittest1) ===");
  const { status: suggStatus, json: suggJson } = await apiAs(user1, "GET", "/api/network/suggestions");
  console.log(`  Status: ${suggStatus}`);
  assert("Suggestions returns 200", suggStatus === 200, JSON.stringify(suggJson));
  if (suggJson?.suggestions) {
    assert("Suggestions has amittest2", suggJson.suggestions.some(s => s.username === "amittest2"), `got: ${JSON.stringify(suggJson.suggestions?.map(s=>s.username))}`);
  }

  console.log("\n=== Step 4: Send connection request (amittest1 -> amittest2) ===");
  const { status: connStatus, json: connJson } = await apiAs(user1, "POST", "/api/network/connect", { receiverId: u2.id });
  console.log(`  Status: ${connStatus}`);
  assert("Connection request 201", connStatus === 201, JSON.stringify(connJson));

  console.log("\n=== Step 5: View incoming requests (as amittest2) ===");
  const { status: reqStatus, json: reqJson } = await apiAs(user2, "GET", "/api/network/connect");
  console.log(`  Status: ${reqStatus}`);
  assert("Requests returns 200", reqStatus === 200, JSON.stringify(reqJson));
  const myRequest = reqJson?.requests?.find(r => r.requester_id === u1.id);
  assert("Has pending request from amittest1", !!myRequest, `requests: ${JSON.stringify(reqJson?.requests?.map(r=>({from:r.requester_id, status:r.status})))}`);

  if (myRequest) {
    console.log("\n=== Step 6: Accept connection (as amittest2) ===");
    const { status: accStatus, json: accJson } = await apiAs(user2, "PATCH", `/api/network/connect/${myRequest.id}`, { status: "accepted" });
    console.log(`  Status: ${accStatus}`);
    assert("Accept returns 200", accStatus === 200, JSON.stringify(accJson));
  }

  console.log("\n=== Step 7: View connections (as amittest1) ===");
  const { status: connListStatus, json: connListJson } = await apiAs(user1, "GET", "/api/network/connections");
  console.log(`  Status: ${connListStatus}`);
  assert("Connections list returns 200", connListStatus === 200, JSON.stringify(connListJson));
  const connected = connListJson?.connections?.some(c =>
    (c.requester_id === u1.id || c.addressee_id === u1.id) && c.status === "accepted"
  );
  assert("Has accepted connection", !!connected, JSON.stringify(connListJson?.connections?.map(c=>({r:c.requester_id,a:c.addressee_id,s:c.status}))));

  console.log("\n=== Step 8: Send message (amittest1 -> amittest2) ===");
  const { status: msgStatus, json: msgJson } = await apiAs(user1, "POST", "/api/messages", { recipientId: u2.id, content: "Hello from Amit Test 1! Testing messaging." });
  console.log(`  Status: ${msgStatus}`);
  assert("Message send 201", msgStatus === 201, JSON.stringify(msgJson));

  console.log("\n=== Step 9: Send reply (amittest2 -> amittest1) ===");
  const { status: replyStatus, json: replyJson } = await apiAs(user2, "POST", "/api/messages", { recipientId: u1.id, content: "Hey Amit 1! Reply from Amit Test 2. Messaging works!" });
  console.log(`  Status: ${replyStatus}`);
  assert("Reply send 201", replyStatus === 201, JSON.stringify(replyJson));

  console.log("\n=== Step 10: List conversations (as amittest1) ===");
  const { status: convStatus, json: convJson } = await apiAs(user1, "GET", "/api/messages");
  console.log(`  Status: ${convStatus}`);
  assert("Conversations list returns 200", convStatus === 200, JSON.stringify(convJson));
  assert("Has conversation", convJson?.conversations?.length > 0, JSON.stringify(convJson?.conversations?.map(c=>({id:c.id, with:c.other_participant?.display_name}))));

  if (convJson?.conversations?.[0]) {
    const convId = convJson.conversations[0].id;
    console.log(`\n=== Step 11: Get messages in conversation ${convId} (as amittest1) ===`);
    const { status: histStatus, json: histJson } = await apiAs(user1, "GET", `/api/messages/${convId}`);
    console.log(`  Status: ${histStatus}`);
    assert("Message history returns 200", histStatus === 200, JSON.stringify(histJson));
    assert("Has messages", histJson?.messages?.length >= 2, `count: ${histJson?.messages?.length}`);
  }

  console.log("\n=== Step 12: Profile page check ===");
  const { status: profStatus, json: profJson } = await apiAs(user1, "GET", `/api/network/suggestions`);
  assert("Suggestions endpoint works", profStatus === 200);

  console.log(`\n${"=".repeat(50)}`);
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`${"=".repeat(50)}`);
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
