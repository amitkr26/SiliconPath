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

const sb = createClient(env["NEXT_PUBLIC_SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"]);

async function analyzeTransitions() {
  console.log("=== APPROVAL CONDITION 5: is_active TRANSITIONS & LIFECYCLE SEMANTICS ===");

  let allRows = [];
  let page = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await sb
      .from("opportunities")
      .select("id, title, verification_status, is_active, deadline")
      .range(page * batchSize, (page + 1) * batchSize - 1);

    if (error) {
      console.error("Fetch error:", error);
      break;
    }
    allRows.push(...data);
    if (data.length < batchSize) hasMore = false;
    page++;
  }

  const todayStr = new Date().toISOString().split("T")[0];

  let trueToTrue = 0;
  let trueToFalse = 0;
  let falseToTrue = 0;
  let falseToFalse = 0;

  const trueToFalseReasons = {
    link_unavailable: 0,
    expired_deadline: 0,
    rejected: 0,
    pending: 0,
    other: 0,
  };

  const semanticLifecycleCounts = {
    active: 0,
    draft: 0,
    broken_link: 0,
    archived: 0,
    expired: 0,
    closed: 0,
  };

  for (const r of allRows) {
    const vs = r.verification_status;
    const isAct = r.is_active;
    const dl = r.deadline;

    // Rule:
    // 1. If vs == 'expired' OR (deadline < today) -> 'expired', is_active = false
    // 2. If vs == 'link_unavailable' -> 'broken_link', is_active = false
    // 3. If vs == 'rejected' -> 'archived', is_active = false
    // 4. If vs == 'pending' -> 'draft', is_active = false
    // 5. If vs == 'verified' AND is_active == true AND (deadline >= today OR deadline IS NULL) -> 'active', is_active = true
    // 6. If vs == 'verified' AND is_active == false -> 'closed', is_active = false

    let proposedActive = false;
    let proposedLifecycle = "draft";

    if (vs === "expired" || (dl && dl < todayStr)) {
      proposedLifecycle = "expired";
      proposedActive = false;
    } else if (vs === "link_unavailable") {
      proposedLifecycle = "broken_link";
      proposedActive = false;
    } else if (vs === "rejected") {
      proposedLifecycle = "archived";
      proposedActive = false;
    } else if (vs === "pending") {
      proposedLifecycle = "draft";
      proposedActive = false;
    } else if (vs === "verified") {
      if (isAct === false) {
        proposedLifecycle = "closed";
        proposedActive = false;
      } else {
        proposedLifecycle = "active";
        proposedActive = true;
      }
    }

    semanticLifecycleCounts[proposedLifecycle]++;

    // Transition tracking
    if (isAct === true && proposedActive === true) trueToTrue++;
    else if (isAct === true && proposedActive === false) {
      trueToFalse++;
      if (vs === "link_unavailable") trueToFalseReasons.link_unavailable++;
      else if (vs === "expired" || (dl && dl < todayStr)) trueToFalseReasons.expired_deadline++;
      else if (vs === "rejected") trueToFalseReasons.rejected++;
      else if (vs === "pending") trueToFalseReasons.pending++;
      else trueToFalseReasons.other++;
    } else if (isAct === false && proposedActive === true) falseToTrue++;
    else if (isAct === false && proposedActive === false) falseToFalse++;
  }

  console.log("Full Transition Table (CURRENT is_active vs PROPOSED is_active):");
  console.log(`  true  → true  : ${String(trueToTrue).padStart(5)}`);
  console.log(`  true  → false : ${String(trueToFalse).padStart(5)}`);
  console.log(`  false → true  : ${String(falseToTrue).padStart(5)}`);
  console.log(`  false → false : ${String(falseToFalse).padStart(5)}`);
  console.log(`  Total rows    : ${String(allRows.length).padStart(5)}\n`);

  console.log("Breakdown of true → false transitions (Total: " + trueToFalse + "):");
  console.log(`  - link_unavailable (broken links)    : ${trueToFalseReasons.link_unavailable}`);
  console.log(`  - expired deadline                   : ${trueToFalseReasons.expired_deadline}`);
  console.log(`  - rejected                           : ${trueToFalseReasons.rejected}`);
  console.log(`  - pending                            : ${trueToFalseReasons.pending}`);
  console.log(`  - other                              : ${trueToFalseReasons.other}`);

  console.log("\nSemantic Lifecycle Distribution (pending -> draft):");
  for (const [k, v] of Object.entries(semanticLifecycleCounts)) {
    console.log(`  ${k.padEnd(15)}: ${String(v).padStart(5)} (${((v / allRows.length) * 100).toFixed(2)}%)`);
  }
}

analyzeTransitions().catch(console.error);
