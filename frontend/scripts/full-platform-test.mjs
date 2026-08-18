import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const envLines = readFileSync("D:\\Tinkerscape\\SiliconPath\\frontend\\.env.local", "utf8")
  .split("\n").reduce((a, l) => { const m = l.match(/^([A-Z_]+)=(.*)/); if (m) a[m[1]] = m[2].trim(); return a; }, {});

const BASE = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const admin = createClient(envLines.NEXT_PUBLIC_SUPABASE_URL, envLines.SUPABASE_SERVICE_ROLE_KEY);

const u1Client = createClient(envLines.NEXT_PUBLIC_SUPABASE_URL, envLines.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const u2Client = createClient(envLines.NEXT_PUBLIC_SUPABASE_URL, envLines.NEXT_PUBLIC_SUPABASE_ANON_KEY);

let passCount = 0;
let failCount = 0;
const results = [];

function assert(condition, name, detail) {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passCount++;
    results.push({ name, status: "PASS", detail });
  } else {
    console.error(`  ✗ ${name}${detail ? ": " + JSON.stringify(detail) : ""}`);
    failCount++;
    results.push({ name, status: "FAIL", detail });
  }
}

async function guestGet(path) {
  const res = await fetch(`${BASE}${path}`);
  const json = await res.json().catch(() => null);
  return { status: res.status, json, text: res.statusText };
}

async function guestGetHtml(path) {
  const res = await fetch(`${BASE}${path}`);
  const text = await res.text();
  return { status: res.status, text };
}

async function authApi(supabase, method, path, body) {
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

async function run() {
  console.log("==================================================");
  console.log(`SILICONPATH FULL PLATFORM AUDIT & E2E TEST RUNNER`);
  console.log(`Target: ${BASE}`);
  console.log("==================================================\n");

  // SECTION 1: PUBLIC AGGREGATOR & GUEST EXPERIENCE
  console.log("--- [1/6] Testing Public Aggregator & Guest Pages ---");
  const home = await guestGetHtml("/");
  assert(home.status === 200 && home.text.includes("BerojgarDegreeWala"), "Public Homepage loads 200 with branding");

  const oppsHtml = await guestGetHtml("/opportunities");
  assert(oppsHtml.status === 200, "Public /opportunities page returns 200");

  const oppsApi = await guestGet("/api/opportunities?limit=5");
  assert(oppsApi.status === 200 && Array.isArray(oppsApi.json?.opportunities || oppsApi.json), "Public /api/opportunities returns active jobs array");

  const searchApi = await guestGet("/api/search?q=VLSI");
  assert(searchApi.status === 200, "Public /api/search?q=VLSI returns 200");

  const orgsApi = await guestGet("/api/organizations");
  assert(orgsApi.status === 200 && Array.isArray(orgsApi.json?.organizations || orgsApi.json), "Public /api/organizations returns list");

  const newsApi = await guestGet("/api/news?limit=5");
  assert(newsApi.status === 200, "Public /api/news returns 200");

  const academyHtml = await guestGetHtml("/academy");
  assert(academyHtml.status === 200, "Public /academy curriculum page returns 200");

  const resourcesHtml = await guestGetHtml("/resources");
  assert(resourcesHtml.status === 200, "Public /resources guide page returns 200");

  const health = await guestGet("/api/health");
  assert(health.status === 200, "API Health endpoint returns 200");

  // SECTION 2: CANDIDATE AUTHENTICATION
  console.log("\n--- [2/6] Testing Candidate Authentication ---");
  const { data: auth1, error: err1 } = await u1Client.auth.signInWithPassword({
    email: "amittest1@berojgardegreewala.com",
    password: "TestPassword123!"
  });
  assert(!err1 && !!auth1.user, "Candidate 1 Login (amittest1)");

  const { data: auth2, error: err2 } = await u2Client.auth.signInWithPassword({
    email: "amittest2@berojgardegreewala.com",
    password: "TestPassword123!"
  });
  assert(!err2 && !!auth2.user, "Candidate 2 Login (amittest2)");

  const u1Id = auth1.user?.id;
  const u2Id = auth2.user?.id;

  // SECTION 3: CANDIDATE SOCIAL & NETWORKING
  console.log("\n--- [3/6] Testing Candidate Social, Network & Messaging ---");
  const meRes = await authApi(u1Client, "GET", "/api/profile/me");
  assert(meRes.status === 200 && (meRes.json?.profile?.id === u1Id || meRes.json?.user?.id === u1Id), "GET /api/profile/me returns authenticated profile");

  const profileLookup = await authApi(u1Client, "GET", `/api/profile/${u2Id}`);
  assert(profileLookup.status === 200 && (profileLookup.json?.display_name || profileLookup.json?.profile?.display_name), "GET /api/profile/[id] resolves profile data");

  const suggRes = await authApi(u1Client, "GET", "/api/network/suggestions");
  assert(suggRes.status === 200 && Array.isArray(suggRes.json?.suggestions), "GET /api/network/suggestions returns candidates");

  const connReq = await authApi(u1Client, "POST", "/api/network/connect", { receiverId: u2Id });
  assert(connReq.status === 201 || connReq.status === 409 || connReq.status === 200, "POST /api/network/connect handles connection request");

  const pendingReqs = await authApi(u2Client, "GET", "/api/network/connect");
  assert(pendingReqs.status === 200, "GET /api/network/connect lists incoming requests");

  const myConns = await authApi(u1Client, "GET", "/api/network/connections");
  assert(myConns.status === 200 && Array.isArray(myConns.json?.connections), "GET /api/network/connections returns connection cards");

  const sendMsg = await authApi(u1Client, "POST", "/api/messages", {
    participantId: u2Id,
    content: "Platform Audit message test " + Date.now()
  });
  assert(sendMsg.status === 201, "POST /api/messages sends direct message");

  const replyMsg = await authApi(u2Client, "POST", "/api/messages", {
    participantId: u1Id,
    content: "Platform Audit reply test " + Date.now()
  });
  assert(replyMsg.status === 201, "POST /api/messages sends reply message");

  const convsList = await authApi(u1Client, "GET", "/api/messages");
  assert(convsList.status === 200 && Array.isArray(convsList.json?.conversations), "GET /api/messages returns user conversations");

  // SECTION 4: COMMUNITY FEED & INTERACTIONS
  console.log("\n--- [4/6] Testing Community Feed & Discussions ---");
  const postCreate = await authApi(u1Client, "POST", "/api/feed", {
    content: "Excited about VLSI Physical Design & Semiconductor growth in India! #SiliconPath " + Date.now()
  });
  assert(postCreate.status === 201 || postCreate.status === 200, "POST /api/feed creates community discussion post");

  const feedList = await authApi(u1Client, "GET", "/api/feed");
  assert(feedList.status === 200 && Array.isArray(feedList.json?.posts), "GET /api/feed returns posts array");

  const notifs = await authApi(u1Client, "GET", "/api/notifications");
  assert(notifs.status === 200 && Array.isArray(notifs.json?.notifications), "GET /api/notifications returns array");

  // SECTION 5: RESUME BUILDER & ATS SCORING
  console.log("\n--- [5/6] Testing Resume Builder & ATS Scoring ---");
  const resumeSave = await authApi(u1Client, "POST", "/api/resume", {
    name: "Amit Test User",
    email: "amittest1@berojgardegreewala.com",
    title: "Senior VLSI Design Engineer",
    summary: "Experienced in RTL design, Verilog, SystemVerilog, UVM, and physical verification with Synopsys and Cadence tools.",
    skills: ["Verilog", "SystemVerilog", "UVM", "Synopsys Design Compiler", "Physical Design", "STA", "DRC/LVS"],
    experience: [
      {
        company: "Semiconductor Lab",
        role: "VLSI Design Engineer",
        period: "2023 - Present",
        description: "Implemented ASIC digital blocks, performed synthesis, static timing analysis (STA), and power optimization."
      }
    ],
    education: [
      {
        institution: "Delhi University",
        degree: "B.Tech in Electronics Engineering",
        year: "2023"
      }
    ]
  });
  assert(resumeSave.status === 200, "POST /api/resume persists structured candidate resume");

  const resumeGet = await authApi(u1Client, "GET", "/api/resume");
  assert(resumeGet.status === 200 && (resumeGet.json?.resume || resumeGet.json?.skills), "GET /api/resume loads saved resume data");

  // SECTION 6: SAVED BOOKMARKS & 1-CLICK APPLICATIONS
  console.log("\n--- [6/6] Testing Saved Bookmarks & Applications ---");
  const bookmarksGet = await authApi(u1Client, "GET", "/api/bookmarks");
  assert(bookmarksGet.status === 200 && Array.isArray(bookmarksGet.json?.bookmarks || bookmarksGet.json?.saved), "GET /api/bookmarks returns list");

  const appsGet = await authApi(u1Client, "GET", "/api/applications");
  assert(appsGet.status === 200 && Array.isArray(appsGet.json?.applications), "GET /api/applications returns applications list");

  console.log("\n==================================================");
  console.log(`AUDIT RESULTS: ${passCount} passed, ${failCount} failed (${passCount + failCount} total)`);
  console.log("==================================================");
}

run().catch(console.error);
