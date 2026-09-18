/**
 * BDW SEO Intelligence — CLI site audit.
 * Usage:
 *   node --import tsx scripts/seo-audit.mjs [options]
 *
 * Flags:
 *   --strict     Exit non-zero if any programmatic quality-gate page is indexed
 *                below threshold or any critical finding exists.
 *   --json       Emit the full audit result as JSON (suppresses tables).
 *   --url=<url>  Audit only a single URL (already in the route set).
 *   --limit=N    Cap opportunity/organization/news rows loaded (default 300).
 *   --verbose    Print group-level breaks per page.
 *
 * Reads SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL from frontend/.env.local.
 */

import fs from "fs";
import { loadAuditDataset } from "../frontend/src/lib/seo/data-loader.ts";
import { runSiteAudit } from "../frontend/src/lib/seo/engine.ts";
import { CATEGORY_COPY } from "../frontend/src/lib/seo/category-copy.ts";
import { categoryUrl, locationUrl, LOCATION_SLUGS } from "../frontend/src/lib/seo/registry.ts";
import { SEVERITY_META } from "../frontend/src/lib/seo/types.ts";

const env = {};
try {
  fs.readFileSync("frontend/.env.local", "utf-8").split("\n").forEach((line) => {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) {
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
      env[m[1].trim()] = val;
    }
  });
} catch {
  console.error("[BLOCKED] frontend/.env.local not found — create it from frontend/.env.example (needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).");
  process.exit(1);
}

const args = process.argv.slice(2);
const STRICT = args.includes("--strict");
const JSON_OUT = args.includes("--json");
const VERBOSE = args.includes("--verbose");
const urlArg = args.find((a) => a.startsWith("--url="));
const URL_ONLY = urlArg ? urlArg.slice("--url=".length) : null;
const limitArg = args.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? parseInt(limitArg.slice("--limit=".length), 10) || 300 : 300;

if (!env["SUPABASE_SERVICE_ROLE_KEY"] || !env["NEXT_PUBLIC_SUPABASE_URL"]) {
  console.error("[BLOCKED] frontend/.env.local missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL.");
  process.exit(1);
}

// The data loader initializes its service client from process.env —
// expose the parsed .env.local values so it works outside Vercel.
for (const [k, v] of Object.entries(env)) process.env[k] = v;

const titles = {};
const content = {};
const h1 = {};
for (const slug of Object.keys(CATEGORY_COPY)) {
  const copy = CATEGORY_COPY[slug];
  const url = categoryUrl(slug);
  titles[url] = copy.title;
  content[url] = `${copy.description} ${copy.subline}`;
  h1[url] = copy.h1;
}
for (const city of LOCATION_SLUGS) {
  const cityName = city.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  titles[locationUrl(city)] = `VLSI & Semiconductor Jobs in ${cityName}`;
}

const dataset = await loadAuditDataset({ maxOpportunities: LIMIT, maxOrganizations: LIMIT, maxNews: LIMIT });
const result = runSiteAudit(dataset, { titles, content, h1 });

const reports = URL_ONLY ? result.reports.filter((r) => r.url === URL_ONLY) : result.reports;

if (JSON_OUT) {
  const payload = URL_ONLY
    ? { summary: result.summary, report: reports[0] ?? null }
    : { summary: result.summary, reports: result.reports, cannibalizationClusters: result.cannibalizationClusters, dataQuality: dataset.quality };
  console.log(JSON.stringify(payload, null, 2));
} else {
  console.log(`\n================================================================================`);
  console.log(`  BDW SEO INTELLIGENCE — SITE AUDIT (${result.summary.auditedPages} audited pages)`);
  console.log(`================================================================================`);
  console.log(`Average score:      ${result.summary.averageScore}/100`);
  console.log(`Indexable pages:    ${result.summary.indexablePages}`);
  console.log(`Gated pages:        ${result.summary.gatedPages} (noindex,follow / omitted)`);
  console.log(`Gate violations:    ${result.gateViolations.length}`);
  console.log(`Cannibalization:    ${result.cannibalizationClusters.length} cluster(s)`);
  console.log(`\n--- PROGRAMMATIC QUALITY GATE ---`);
  for (const r of result.reports.filter((x) => x.pageType === "category" || x.pageType === "location")) {
    const g = r.gate;
    console.log(`  ${r.indexable ? "INDEX " : "NOINDEX"} [count=${g ? String(g.activeVerifiedCount).padEnd(3) : "  -"}] ${r.pageType.padEnd(10)} ${r.url}`);
  }
  console.log(`\n--- WORST PAGES ---`);
  const ranked = [...reports].sort((a, b) => a.score - b.score).slice(0, 12);
  for (const r of ranked) {
    const sev = r.summary.critical + r.summary.warning + r.summary.improvement;
    console.log(`  ${String(r.score).padStart(3)}/100  crit=${String(r.summary.critical).padEnd(2)} warn=${String(r.summary.warning).padEnd(2)} imp=${String(r.summary.improvement).padEnd(2)}  GATE=${r.indexable ? "ok" : "FAIL"}  ${r.url}`);
    if (VERBOSE) {
      for (const c of r.checks.filter((c) => c.severity !== "pass")) {
        console.log(`         [${SEVERITY_META[c.severity].emoji}] ${c.title}${c.detail ? " — " + c.detail : ""}`);
      }
    }
  }
  console.log(`\n--- DATA QUALITY (active rows sampled) ---`);
  const q = dataset.quality;
  console.log(`  verified-eligible active: ${q.totalActive} | missing deadline: ${q.missingDeadline} | missing stipend: ${q.missingStipend} | missing link: ${q.missingLink} | thin description: ${q.missingDescription} | pending verify: ${q.pending}`);
  console.log(`================================================================================`);
}

const hasGateViolation = result.gateViolations.length > 0;
const hasCritical = reports.some((r) => r.summary.critical > 0);
if (STRICT && (hasGateViolation || hasCritical)) {
  console.error(`\n[STRICT] FAILED — gate violations: ${result.gateViolations.length}, pages with critical findings: ${reports.filter((r) => r.summary.critical > 0).length}`);
  process.exit(1);
}
if (STRICT) console.log("\n[STRICT] PASS — no gate violations and no critical findings.");
process.exit(0);