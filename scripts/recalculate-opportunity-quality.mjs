/**
 * Batch Opportunity Quality Recalculation Engine.
 * Usage:
 *   node --import tsx scripts/recalculate-opportunity-quality.mjs [options]
 *
 * Flags:
 *   --write          Actually write to DB (default: dry-run)
 *   --only-unscored  Only process rows with NULL quality_score
 *   --only-active    Only process is_active=true rows
 *   --limit N        Process at most N rows (default: 100)
 */

import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { computeOpportunityQualityScore } from "../frontend/src/lib/opportunity-quality.ts";

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

const args = process.argv.slice(2);
const WRITE    = args.includes("--write");
const UNSCORED = args.includes("--only-unscored");
const ACTIVE   = args.includes("--only-active");
const limitArg = args.findIndex(a => a === "--limit");
const LIMIT    = limitArg >= 0 ? parseInt(args[limitArg + 1]) || 100 : 100;

console.log(`\n======================================================================`);
console.log(`  OPPORTUNITY QUALITY SCORING ENGINE`);
console.log(`======================================================================`);
console.log(`Mode:      ${WRITE ? "PRODUCTION WRITE" : "DRY-RUN (In-Memory Analysis)"}`);
console.log(`Filters:   only-unscored=${UNSCORED}, only-active=${ACTIVE}`);
console.log(`Limit:     ${LIMIT}`);

// Check whether quality_score column exists
const { data: colCheck, error: colErr } = await sb.from("opportunities").select("quality_score").limit(1);
const hasQualityColumn = !colErr;

console.log(`Schema:    quality_score column ${hasQualityColumn ? "EXISTS in DB" : "NOT YET IN SCHEMA (Dry-run only)"}`);

if (WRITE && !hasQualityColumn) {
  console.error("\n[BLOCKED] quality_score column does not exist in live DB.");
  console.error("Apply migration frontend/supabase/migrations/20260829000001_phase30d_opportunity_quality_lifecycle_audit.sql first.");
  process.exit(1);
}

let query = sb.from("opportunities").select("*").order("created_at", { ascending: false }).limit(LIMIT);
if (UNSCORED && hasQualityColumn) query = query.is("quality_score", null);
if (ACTIVE) query = query.eq("is_active", true);

const { data: rows, error: fetchErr } = await query;
if (fetchErr) {
  console.error("Fetch error:", fetchErr);
  process.exit(1);
}

console.log(`\nFetched ${rows?.length ?? 0} rows for evaluation.\n`);

let scored = 0, written = 0, errors = 0;

// Distribution buckets
const dist = { "0-24": 0, "25-49": 0, "50-74": 0, "75-89": 0, "90-100": 0 };
const samples = [];

for (const row of rows ?? []) {
  const { score, reason, details } = computeOpportunityQualityScore(row);
  scored++;

  // Accumulate distribution
  if (score < 25) dist["0-24"]++;
  else if (score < 50) dist["25-49"]++;
  else if (score < 75) dist["50-74"]++;
  else if (score < 90) dist["75-89"]++;
  else dist["90-100"]++;

  if (samples.length < 15) {
    samples.push({
      score,
      title: (row.title ?? "").slice(0, 60),
      category: row.category,
      active: row.is_active,
      status: row.verification_status,
      linkScore: details.link_reachability_score,
      contentScore: details.content_completeness_score,
      sourceScore: details.source_trust_score,
      actionScore: details.actionability_score,
      risks: details.risk_signals,
    });
  }

  if (WRITE) {
    const { error } = await sb
      .from("opportunities")
      .update({
        quality_score: score,
        quality_reason: details,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (error) {
      console.error(`  [ERR] ${row.id}: ${error.message}`);
      errors++;
    } else {
      written++;
    }
  }
}

console.log(`--- SAMPLE EVALUATIONS (First ${samples.length}) ---`);
for (const s of samples) {
  const scoreStr = String(s.score).padStart(3);
  console.log(`  [Score: ${scoreStr}/100] [${s.category || "N/A"}] ${s.title}`);
  console.log(`      Breakdown: Link=${s.linkScore}/15, Content=${s.contentScore}/40, Source=${s.sourceScore}/20, Action=${s.actionScore}/25`);
  console.log(`      Risk Signals: ${s.risks.join(" | ") || "None"}`);
}

console.log(`\n--- RESULTS SUMMARY ---`);
console.log(`Total Evaluated: ${scored} | Written: ${written} | Errors: ${errors}`);
console.log(`\n--- SCORE DISTRIBUTION ---`);
for (const [bucket, count] of Object.entries(dist)) {
  const pct = scored > 0 ? ((count / scored) * 100).toFixed(1) : "0.0";
  const bar = "█".repeat(Math.round((count / Math.max(scored, 1)) * 25));
  console.log(`  Score ${bucket.padEnd(7)} : ${bar.padEnd(26)} ${count} (${pct}%)`);
}

if (!WRITE) {
  console.log(`\n[DRY-RUN COMPLETE] No database writes were performed.`);
  console.log(`To persist scores after applying Migration A, run with --write`);
}
