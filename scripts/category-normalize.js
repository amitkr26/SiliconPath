// P1b: Category normalization backfill (idempotent).
// Maps legacy/display category values onto the canonical vocabulary
// (src/lib/categories.ts). Currently only "government" -> "govt-job" exists
// in the live DB; safe exact-token mapping, no guessing.
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const env = fs.readFileSync("/workspaces/SiliconPath/.env.local", "utf8")
  .split("\n").reduce((a, l) => { const m = l.match(/^([A-Z_]+)=(.*)/); if (m) a[m[1]] = m[2]; return a; }, {});
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY = process.argv.includes("--apply");

const ALIASES = { "govt-job": "government", "govt job": "government", "job": "industry", "private": "industry", "private job": "industry", "scholarship": "fellowship", "trainee": "internship" };

(async () => {
  const { data, error } = await db.from("opportunities").select("id, category");
  if (error) throw error;
  const hits = {};
  for (const r of data) {
    const key = (r.category || "").trim().toLowerCase();
    if (ALIASES[key]) hits[key] = (hits[key] || 0) + 1;
  }
  console.log("Rows needing normalization:");
  Object.entries(hits).forEach(([k, n]) => console.log(`  "${k}" -> "${ALIASES[k]}" x${n}`));

  if (APPLY) {
    let updated = 0;
    for (const [legacy, canonical] of Object.entries(ALIASES)) {
      const { error } = await db.from("opportunities")
        .update({ category: canonical })
        .eq("category", legacy);
      if (error) { console.error("  err for", legacy, error.message); continue; }
      updated += hits[legacy] || 0;
    }
    console.log(`Applied: ${updated} rows updated`);
  } else {
    console.log("(dry run — no changes)");
  }
})().catch((e) => console.log("FATAL", e.message));