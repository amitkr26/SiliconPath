import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../frontend/.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase credentials in frontend/.env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function main() {
  console.log("============================================================");
  console.log("1. LIVE DATABASE PUBLIC-ACTIVE INVARIANT AUDIT (50 SAMPLES)");
  console.log("============================================================");

  const { data: activeOpps, error: activeErr } = await supabase
    .from("opportunities")
    .select("*")
    .eq("is_active", true)
    .eq("verification_status", "verified")
    .order("created_at", { ascending: false });

  if (activeErr) {
    console.error("Error fetching active opportunities:", activeErr);
    process.exit(1);
  }

  console.log(`Total public active verified opportunities: ${activeOpps.length}`);

  const sample50 = activeOpps.slice(0, 50);
  console.log(`\nSample of 50 active opportunities:`);
  
  const sampleTable = sample50.map((o, idx) => ({
    idx: idx + 1,
    id: o.id,
    title: o.title.slice(0, 45),
    org: (o.organization || o.company_name || "N/A").slice(0, 20),
    category: o.category,
    deadline: o.deadline || "Ongoing / Open",
    apply_url: o.apply_url ? o.apply_url.slice(0, 35) + "..." : "N/A",
    status: o.verification_status,
    active: o.is_active,
    why_current: o.deadline ? `Deadline ${o.deadline} >= Today` : "Verified recent industry posting"
  }));

  console.table(sampleTable.slice(0, 15));

  // Invariant checks on all active opportunities
  let invalidActive = [];
  const today = new Date().toISOString().split("T")[0];

  for (const o of activeOpps) {
    if (o.is_active !== true || o.verification_status !== "verified") {
      invalidActive.push({ id: o.id, reason: "Status mismatch" });
    }
    if (o.deadline && o.deadline < today) {
      invalidActive.push({ id: o.id, reason: `Expired deadline: ${o.deadline} < ${today}` });
    }
    if (!o.apply_url && !o.source_url) {
      invalidActive.push({ id: o.id, reason: "Missing both apply_url and source_url" });
    }
  }

  console.log(`Active Invariant Failures: ${invalidActive.length}`);

  console.log("\n============================================================");
  console.log("2. QUARANTINE INTEGRITY CHECKS (EXPIRED, PENDING, REJECTED, LINK_UNAVAILABLE)");
  console.log("============================================================");

  const { count: expCount } = await supabase.from("opportunities").select("id", { count: "exact", head: true }).eq("verification_status", "expired");
  const { count: pendCount } = await supabase.from("opportunities").select("id", { count: "exact", head: true }).eq("verification_status", "pending");
  const { count: rejCount } = await supabase.from("opportunities").select("id", { count: "exact", head: true }).eq("verification_status", "rejected");
  const { count: unavailCount } = await supabase.from("opportunities").select("id", { count: "exact", head: true }).eq("verification_status", "link_unavailable");

  console.log(`Expired in DB: ${expCount}`);
  console.log(`Pending in DB: ${pendCount}`);
  console.log(`Rejected in DB: ${rejCount}`);
  console.log(`Link Unavailable in DB: ${unavailCount}`);

  const { data: leakingQuarantine } = await supabase
    .from("opportunities")
    .select("id, verification_status, is_active")
    .eq("is_active", true)
    .neq("verification_status", "verified");

  console.log(`Quarantine Leakage (is_active=true with non-verified status): ${leakingQuarantine?.length || 0}`);

  console.log("\n============================================================");
  console.log("3. FOREIGN KEY APPLICATION & BOOKMARK PERSISTENCE AUDIT");
  console.log("============================================================");

  const { data: apps } = await supabase.from("applications").select("id, opportunity_id, user_id, status");
  const { data: bookmarks } = await supabase.from("saved_opportunities").select("id, opportunity_id, user_id");

  console.log(`Total Applications preserved: ${apps?.length || 0}`);
  console.log(`Total Saved Bookmarks preserved: ${bookmarks?.length || 0}`);

  let missingAppOpps = [];
  for (const app of apps || []) {
    const { data: opp } = await supabase.from("opportunities").select("id, title, is_active, verification_status").eq("id", app.opportunity_id).maybeSingle();
    if (!opp) missingAppOpps.push(app.id);
  }
  console.log(`Missing Application Opportunity FKs: ${missingAppOpps.length}`);

  let missingBmOpps = [];
  for (const bm of bookmarks || []) {
    const { data: opp } = await supabase.from("opportunities").select("id, title, is_active, verification_status").eq("id", bm.opportunity_id).maybeSingle();
    if (!opp) missingBmOpps.push(bm.id);
  }
  console.log(`Missing Bookmark Opportunity FKs: ${missingBmOpps.length}`);

  console.log("\n50 SAMPLES JSON DUMP:");
  console.log(JSON.stringify(sample50, null, 2));
}

main().catch(err => {
  console.error("FATAL:", err);
  process.exit(1);
});
