import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../frontend/.env.local") });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runDatabaseIntegrity() {
  console.log("================================================================================");
  console.log("   PHASE 26: DATABASE INTEGRITY & ORPHAN AUDIT                                 ");
  console.log("================================================================================");

  const results = {};

  // 1. Applications orphans check
  const { data: apps, error: appsErr } = await supabase.from("applications").select("id, user_id, opportunity_id");
  const { data: opps } = await supabase.from("opportunities").select("id");
  const { data: users } = await supabase.from("user_profiles").select("id");

  const validOppIds = new Set((opps || []).map((o) => o.id));
  const validUserIds = new Set((users || []).map((u) => u.id));

  let orphanApps = 0;
  for (const a of apps || []) {
    if (!validOppIds.has(a.opportunity_id) || !validUserIds.has(a.user_id)) {
      orphanApps++;
    }
  }
  results.orphanApplications = orphanApps;
  console.log(`Applications total: ${apps?.length || 0} | Orphan applications: ${orphanApps}`);

  // 2. Saved opportunities orphans check
  const { data: saved, error: savedErr } = await supabase.from("saved_opportunities").select("id, user_id, opportunity_id");
  let orphanSaved = 0;
  for (const s of saved || []) {
    if (!validOppIds.has(s.opportunity_id) || !validUserIds.has(s.user_id)) {
      orphanSaved++;
    }
  }
  results.orphanSavedOpportunities = orphanSaved;
  console.log(`Saved opportunities total: ${saved?.length || 0} | Orphan saved: ${orphanSaved}`);

  // 3. Duplicate usernames
  const { data: allProfiles } = await supabase.from("user_profiles").select("username");
  const usernameCounts = {};
  for (const p of allProfiles || []) {
    if (p.username) {
      usernameCounts[p.username] = (usernameCounts[p.username] || 0) + 1;
    }
  }
  const duplicateUsernames = Object.entries(usernameCounts).filter(([k, v]) => v > 1);
  results.duplicateUsernames = duplicateUsernames.length;
  console.log(`Duplicate usernames: ${duplicateUsernames.length}`);

  // 4. Duplicate connections
  const { data: allConnections } = await supabase.from("connections").select("requester_id, addressee_id");
  const connKeys = new Set();
  let duplicateConnections = 0;
  for (const c of allConnections || []) {
    const key = [c.requester_id, c.addressee_id].sort().join(":");
    if (connKeys.has(key)) {
      duplicateConnections++;
    }
    connKeys.add(key);
  }
  results.duplicateConnections = duplicateConnections;
  console.log(`Duplicate connections: ${duplicateConnections}`);

  // 5. Active opportunities count
  const { count: totalOpportunities } = await supabase.from("opportunities").select("*", { count: "exact", head: true });
  const { count: activeVerified } = await supabase.from("opportunities").select("*", { count: "exact", head: true })
    .eq("is_active", true)
    .eq("verification_status", "verified");

  results.totalOpportunities = totalOpportunities;
  results.activeVerifiedOpportunities = activeVerified;
  console.log(`Total opportunities preserved: ${totalOpportunities} | Verified active: ${activeVerified}`);

  fs.writeFileSync(
    path.resolve(__dirname, "database-integrity-results.json"),
    JSON.stringify(results, null, 2)
  );

  console.log("================================================================================\n");
}

runDatabaseIntegrity();
