/**
 * small-batch-test.mjs  (v2)
 * Step 2 & 3: Run ISRO, DRDO, CSIR with correct URLs from actual scraper files.
 * Fixes title whitespace issue (collapse newlines/spaces from table HTML).
 *
 * Usage: node --env-file=.env.local scripts/debug/small-batch-test.mjs
 * Run from: electrobridge/ directory
 */

import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE env vars. Run from electrobridge/ with --env-file=.env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Collapse all whitespace (newlines, tabs, multiple spaces) in a title */
function cleanTitle(text) {
  return text.replace(/\s+/g, " ").trim().substring(0, 200);
}

function slugify(text, maxLen = 80) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").substring(0, maxLen).replace(/-+$/, "");
}

function normalizeCategory(raw) {
  const map = {
    "jrf": "jrf", "JRF": "jrf",
    "srf": "srf", "SRF": "srf",
    "phd": "phd", "PhD": "phd", "Fellowship": "fellowship",
    "fellowship": "fellowship", "internship": "internship", "Internship": "internship",
    "government": "government", "Govt Job": "government",
    "industry": "industry", "postdoc": "postdoc",
  };
  return map[raw] ?? "government";
}

function parseDeadline(text) {
  if (!text) return null;
  const dd = text.match(/(\d{2})[./](\d{2})[./](\d{4})/);
  if (dd) return `${dd[3]}-${dd[2]}-${dd[1]}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  return null;
}

async function resolveOrg(name, type) {
  const slug = slugify(name);
  const { data: existing } = await supabase.from("organizations").select("id").eq("name", name).maybeSingle();
  if (existing) return existing.id;
  const { data: created, error } = await supabase.from("organizations").insert([{ name, slug, type }]).select("id").single();
  if (error) { console.error(`  ORG CREATE ERROR for "${name}":`, error.message); return null; }
  console.log(`  Created org: "${name}" → id=${created.id}`);
  return created.id;
}

async function insertOpportunity(opp, orgId) {
  const title = cleanTitle(opp.title);

  // Dedup by title similarity first
  const { data: existTitle } = await supabase.from("opportunities").select("id").ilike("title", title).maybeSingle();
  if (existTitle) return { skipped: true, reason: "duplicate title" };

  let slug = slugify(title);
  if (!slug) slug = `opportunity-${Date.now()}`;
  const { data: existSlug } = await supabase.from("opportunities").select("id").eq("slug", slug).maybeSingle();
  if (existSlug) slug = `${slug}-${Date.now()}`;

  const { data, error } = await supabase.from("opportunities").insert([{
    title,
    slug,
    organization_id: orgId,
    category: normalizeCategory(opp.category),
    location: opp.location,
    salary_range: opp.stipend ?? null,
    deadline: parseDeadline(opp.deadline),
    eligibility: opp.eligibility ?? null,
    description: opp.description ? cleanTitle(opp.description) : null,
    apply_url: opp.apply_link || opp.source_url,
    source_url: opp.source_url,
    tags: opp.tags ?? [],
    verification_status: "verified",
    is_active: true,
    source_type: "scraped",
  }]).select("id, title, slug, category, deadline, apply_url, source_url").single();

  if (error) return { skipped: true, reason: error.message };
  return { inserted: true, row: data };
}

// ─── Scrapers (using exact URLs from actual scraper files) ─────────────────

const RESULT_PATTERNS = [
  /list of selected/i, /provisional/i, /corrigendum/i,
  /answer key/i, /revised.*list/i, /validity of the selection/i,
];

// ISRO — https://www.isro.gov.in/Careers.html
async function scrapeISRO() {
  const url = "https://www.isro.gov.in/Careers.html";
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const res = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { "User-Agent": "Mozilla/5.0 (SiliconPath/1.0)" } });
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";
  if (!res.ok) throw new Error(`ISRO HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const opps = [];
  $("tr").each((_, row) => {
    if (opps.length >= 15) return;
    const text = $(row).text().trim();
    if (!text || text.length < 30) return;
    const linkEl = $(row).find("a").first();
    const href = linkEl.attr("href") || "";
    const rawTitle = linkEl.text().trim() || text.split("\n")[0].trim();
    const title = cleanTitle(rawTitle);
    if (!title || title.length < 15) return;
    if (RESULT_PATTERNS.some(p => p.test(title))) return;
    if (title.includes("Home") || title.includes("Contact") || title.includes("Sitemap")) return;
    const fullUrl = href ? (href.startsWith("http") ? href : `https://www.isro.gov.in${href.startsWith("/") ? "" : "/"}${href}`) : url;
    const t = title.toUpperCase();
    const category = t.includes("JRF") ? "JRF" : t.includes("INTERN") || t.includes("APPRENTICE") ? "Internship" : "Govt Job";
    opps.push({ title, organization: "ISRO", category, location: "India", stipend: null, deadline: null, eligibility: null, description: cleanTitle(text).substring(0, 300), apply_link: fullUrl, source_url: fullUrl, tags: ["ISRO", "government", "space"] });
  });
  return opps;
}

// DRDO — https://drdo.gov.in/drdo/en/offerings/vacancies (correct URL from drdo-scraper.ts)
async function scrapeDRDO() {
  const url = "https://drdo.gov.in/drdo/en/offerings/vacancies";
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const res = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { "User-Agent": "Mozilla/5.0 (SiliconPath/1.0)" } });
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";
  if (!res.ok) throw new Error(`DRDO HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const opps = [];
  $(".vacanciess-title").each((_, el) => {
    if (opps.length >= 15) return;
    const rawTitle = $(el).text().trim();
    const title = cleanTitle(rawTitle);
    if (!title || title.length < 15) return;
    if (title === "Vacancies" || RESULT_PATTERNS.some(p => p.test(title))) return;
    const descText = cleanTitle($(el).siblings(".vacanciess-desc").first().text().trim() || title);
    const linkEl = $(el).find("a").first();
    const href = linkEl.attr("href") || "";
    const fullUrl = href ? (href.startsWith("http") ? href : `https://drdo.gov.in${href}`) : url;
    const t = title.toUpperCase();
    const category = t.includes("JRF") ? "JRF" : t.includes("SRF") || t.includes("RESEARCH ASSOCIATE") ? "SRF" : t.includes("INTERN") || t.includes("APPRENTICE") ? "Internship" : "Govt Job";
    opps.push({ title, organization: "DRDO", category, location: "India", stipend: null, deadline: null, eligibility: null, description: descText.substring(0, 300), apply_link: fullUrl, source_url: fullUrl, tags: ["DRDO", "defence", "government"] });
  });
  return opps;
}

// CSIR — https://www.csir.res.in/en/career-opportunities/recruitment (correct URL from csir-scraper.ts)
async function scrapeCSIR() {
  const url = "https://www.csir.res.in/en/career-opportunities/recruitment";
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const res = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { "User-Agent": "Mozilla/5.0 (SiliconPath/1.0)" } });
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";
  if (!res.ok) throw new Error(`CSIR HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const opps = [];
  $("table tbody tr, .views-table tbody tr").each((_, row) => {
    if (opps.length >= 15) return;
    const cells = $(row).find("td");
    if (cells.length < 2) return;
    const titleEl = $(cells[1] || cells[0]);
    const rawTitle = titleEl.text().trim();
    const title = cleanTitle(rawTitle);
    if (!title || title.length < 10) return;
    if (title === "Title" || title.includes("Sl No")) return;
    const linkEl = titleEl.find("a").first();
    const href = linkEl.attr("href") || "";
    const fullUrl = href ? (href.startsWith("http") ? href : `https://www.csir.res.in${href.startsWith("/") ? "" : "/"}${href}`) : url;
    let deadline = null;
    if (cells.length >= 3) deadline = $(cells[2]).text().trim() || null;
    const t = title.toUpperCase();
    const category = t.includes("JRF") ? "JRF" : t.includes("SRF") || t.includes("RESEARCH ASSOCIATE") ? "SRF" : t.includes("FELLOW") ? "fellowship" : "Govt Job";
    opps.push({ title, organization: "CSIR", category, location: "India", stipend: null, deadline, eligibility: null, description: null, apply_link: fullUrl, source_url: fullUrl, tags: ["CSIR", "research", "government"] });
  });
  return opps;
}

// ─── Main ────────────────────────────────────────────────────────────────────

const SOURCES = [
  { name: "ISRO",  scraper: scrapeISRO,  orgType: "government" },
  { name: "DRDO",  scraper: scrapeDRDO,  orgType: "government" },
  { name: "CSIR",  scraper: scrapeCSIR,  orgType: "government" },
];

async function main() {
  console.log("\n═══════════════════════════════════");
  console.log(" STEP 2: Small-Batch Scrape Test v2");
  console.log(" Sources: ISRO, DRDO, CSIR");
  console.log("═══════════════════════════════════\n");

  const insertedIds = [];

  for (const { name, scraper, orgType } of SOURCES) {
    console.log(`\n── ${name} ─────────────────────────`);
    let opps = [];
    try {
      opps = await scraper();
      console.log(`  Scraped ${opps.length} candidates`);
      if (opps.length === 0) { console.log("  ⚠️  0 results — page structure may have changed"); continue; }
    } catch (e) {
      console.error(`  ❌ SCRAPE ERROR: ${e.message}`);
      continue;
    }

    const orgId = await resolveOrg(name, orgType);

    let inserted = 0, skipped = 0;
    for (const opp of opps.slice(0, 5)) {  // max 5 per source
      const r = await insertOpportunity(opp, orgId);
      if (r.inserted) {
        inserted++;
        insertedIds.push(r.row.id);
        console.log(`  ✅ INSERTED: "${r.row.title.substring(0,70)}" | cat=${r.row.category}`);
      } else {
        skipped++;
        console.log(`  ⏭  SKIPPED: "${opp.title.substring(0,60)}" (${r.reason})`);
      }
    }
    console.log(`  ${name}: inserted=${inserted} skipped=${skipped}`);
  }

  // ─── STEP 3: Literal Row Inspection ─────────────────────────────────────
  console.log("\n═══════════════════════════════════");
  console.log(" STEP 3: Literal Row Inspection");
  console.log("═══════════════════════════════════\n");

  if (insertedIds.length === 0) {
    console.log("⚠️  No new rows inserted this run. Showing last 10 rows in table:\n");
    const { data: recent } = await supabase.from("opportunities").select("id, title, category, deadline, apply_url, source_url, organization_id, tags, verification_status, created_at").order("created_at", { ascending: false }).limit(10);
    insertedIds.push(...(recent || []).map(r => r.id));
  }

  const { data: rows, error } = await supabase
    .from("opportunities")
    .select("id, title, category, deadline, apply_url, source_url, organization_id, tags, verification_status, created_at")
    .in("id", insertedIds)
    .order("created_at", { ascending: false });

  if (error) { console.error("Query error:", error.message); process.exit(1); }

  const orgIds = [...new Set(rows.map(r => r.organization_id).filter(Boolean))];
  const { data: orgs } = await supabase.from("organizations").select("id, name, type").in("id", orgIds);
  const orgMap = Object.fromEntries((orgs || []).map(o => [o.id, o]));

  console.log(`Found ${rows.length} rows:\n`);
  rows.forEach((row, i) => {
    const org = orgMap[row.organization_id];
    console.log(`Row ${i + 1}:`);
    console.log(`  id:                  ${row.id}`);
    console.log(`  title:               "${row.title}"`);
    console.log(`  org.name (resolved): "${org?.name ?? "NOT FOUND"}"`);
    console.log(`  org.type:            "${org?.type ?? "—"}"`);
    console.log(`  category:            "${row.category}"`);
    console.log(`  deadline:            ${row.deadline ?? "null"}`);
    console.log(`  apply_url:           "${row.apply_url}"`);
    console.log(`  tags:                [${(row.tags || []).join(", ")}]`);
    console.log(`  verification_status: "${row.verification_status}"`);
    console.log(`  created_at:          ${row.created_at}`);
    console.log("");
  });

  // Also confirm counts
  const { count: oppCount } = await supabase.from("opportunities").select("*", { count: "exact", head: true });
  const { count: orgCount } = await supabase.from("organizations").select("*", { count: "exact", head: true });
  console.log(`\n── Table Counts ──────────────────────`);
  console.log(`  opportunities: ${oppCount} rows`);
  console.log(`  organizations: ${orgCount} rows`);
  console.log(`\n═══════════════════════════════════`);
  console.log(" END — Waiting for your go-ahead to run more");
  console.log("═══════════════════════════════════");
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
