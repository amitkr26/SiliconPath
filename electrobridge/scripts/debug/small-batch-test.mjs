/**
 * small-batch-test.mjs
 * Step 2 & 3: Run ONLY 3 known-good scrapers (ISRO, DRDO, CSIR),
 * insert into live Supabase, then query and print LITERAL row contents.
 *
 * Usage: node small-batch-test.mjs
 * Run from: electrobridge/ directory
 */

import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE env vars. Run from electrobridge/ with .env.local loaded.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ─── Helpers ────────────────────────────────────────────────────────────────

function slugify(text, maxLen = 80) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").substring(0, maxLen).replace(/-+$/, "");
}

function normalizeCategory(raw) {
  const map = {
    "jrf": "jrf", "JRF": "jrf",
    "srf": "srf", "SRF": "srf",
    "phd": "phd", "PhD": "phd",
    "fellowship": "fellowship", "Fellowship": "fellowship",
    "internship": "internship", "Internship": "internship",
    "government": "government", "Govt Job": "government",
    "industry": "industry",
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
  const { data: existing } = await supabase.from("organizations").select("id").eq("name", name).maybeSingle();
  if (existing) return existing.id;
  const slug = slugify(name);
  const { data: created, error } = await supabase.from("organizations").insert([{ name, slug, type }]).select("id").single();
  if (error) { console.error(`  ORG CREATE ERROR for "${name}":`, error.message); return null; }
  console.log(`  Created org: "${name}" → id=${created.id}`);
  return created.id;
}

async function insertOpportunity(opp, orgId) {
  let slug = slugify(opp.title);
  if (!slug) slug = `opportunity-${Date.now()}`;
  const { data: existSlug } = await supabase.from("opportunities").select("id").eq("slug", slug).maybeSingle();
  if (existSlug) slug = `${slug}-${Date.now()}`;

  // Dedup by source_url
  const { data: existUrl } = await supabase.from("opportunities").select("id").eq("source_url", opp.source_url).maybeSingle();
  if (existUrl) return { skipped: true, reason: "duplicate source_url" };

  const { data, error } = await supabase.from("opportunities").insert([{
    title: opp.title,
    slug,
    organization_id: orgId,
    category: normalizeCategory(opp.category),
    location: opp.location,
    salary_range: opp.stipend ?? null,
    deadline: parseDeadline(opp.deadline),
    eligibility: opp.eligibility ?? null,
    description: opp.description ?? null,
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

// ─── Scrapers (inline, minimal, no TypeScript) ─────────────────────────────

const RESULT_PATTERNS = [/list of selected/i, /provisional/i, /corrigendum/i, /answer key/i, /revised.*list/i];

async function scrapeISRO() {
  const url = "https://www.isro.gov.in/Careers.html";
  const res = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`ISRO HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const opps = [];
  $("tr").each((_, row) => {
    if (opps.length >= 10) return;
    const text = $(row).text().trim();
    if (!text || text.length < 30) return;
    const linkEl = $(row).find("a").first();
    const href = linkEl.attr("href") || "";
    const title = (linkEl.text().trim() || text.split("\n")[0].trim()).substring(0, 200);
    if (!title || title.length < 15) return;
    if (RESULT_PATTERNS.some(p => p.test(title))) return;
    const fullUrl = href ? (href.startsWith("http") ? href : `https://www.isro.gov.in${href.startsWith("/") ? "" : "/"}${href}`) : url;
    const t = title.toUpperCase();
    const category = t.includes("JRF") || t.includes("JUNIOR RESEARCH") ? "JRF"
      : t.includes("INTERN") ? "Internship"
      : t.includes("SCIENTIST") || t.includes("ENGINEER") ? "Govt Job"
      : "Govt Job";
    opps.push({ title, organization: "ISRO", category, location: "India", stipend: null, deadline: null, eligibility: null, description: text.substring(0, 300), apply_link: fullUrl, source_url: url, tags: ["ISRO", "government"] });
  });
  return opps;
}

async function scrapeDRDO() {
  const url = "https://www.drdo.gov.in/careers";
  const res = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`DRDO HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const opps = [];
  $("a, li, tr").each((_, el) => {
    if (opps.length >= 10) return;
    const text = $(el).text().trim();
    const href = $(el).attr("href") || $(el).find("a").first().attr("href") || "";
    if (!text || text.length < 20) return;
    const t = text.toUpperCase();
    if (!t.includes("JRF") && !t.includes("RESEARCH") && !t.includes("SCIENTIST") && !t.includes("RECRUIT") && !t.includes("APPRENTICE")) return;
    if (RESULT_PATTERNS.some(p => p.test(text))) return;
    const title = text.split("\n")[0].trim().substring(0, 200);
    if (title.length < 15) return;
    const fullUrl = href ? (href.startsWith("http") ? href : `https://www.drdo.gov.in${href}`) : url;
    const category = t.includes("JRF") ? "JRF" : t.includes("INTERN") || t.includes("APPRENTICE") ? "Internship" : "Govt Job";
    opps.push({ title, organization: "DRDO", category, location: "India", stipend: null, deadline: null, eligibility: null, description: text.substring(0, 300), apply_link: fullUrl, source_url: url, tags: ["DRDO", "government", "defence"] });
  });
  return opps;
}

async function scrapeCSIR() {
  const url = "https://www.csir.res.in/careers";
  const res = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`CSIR HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const opps = [];
  $("a, li, tr, .views-row").each((_, el) => {
    if (opps.length >= 10) return;
    const text = $(el).text().trim();
    const href = $(el).attr("href") || $(el).find("a").first().attr("href") || "";
    if (!text || text.length < 20) return;
    const t = text.toUpperCase();
    if (!t.includes("JRF") && !t.includes("RESEARCH") && !t.includes("SCIENTIST") && !t.includes("FELLOW") && !t.includes("RECRUIT")) return;
    if (RESULT_PATTERNS.some(p => p.test(text))) return;
    const title = text.split("\n")[0].trim().substring(0, 200);
    if (title.length < 15) return;
    const fullUrl = href ? (href.startsWith("http") ? href : `https://www.csir.res.in${href}`) : url;
    const category = t.includes("JRF") ? "JRF" : t.includes("SRF") ? "SRF" : t.includes("FELLOW") ? "fellowship" : "Govt Job";
    opps.push({ title, organization: "CSIR", category, location: "India", stipend: null, deadline: null, eligibility: null, description: text.substring(0, 300), apply_link: fullUrl, source_url: url, tags: ["CSIR", "research", "government"] });
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
  console.log(" STEP 2: Small-Batch Scrape Test");
  console.log(" Sources: ISRO, DRDO, CSIR (3 only)");
  console.log("═══════════════════════════════════\n");

  const insertedIds = [];

  for (const { name, scraper, orgType } of SOURCES) {
    console.log(`\n── ${name} ─────────────────────────`);
    let opps = [];
    try {
      opps = await scraper();
      console.log(`  Scraped ${opps.length} candidates`);
    } catch (e) {
      console.error(`  SCRAPE ERROR: ${e.message}`);
      continue;
    }

    const orgId = await resolveOrg(name, orgType);

    let inserted = 0, skipped = 0;
    for (const opp of opps.slice(0, 5)) {  // max 5 per source for Step 2
      const r = await insertOpportunity(opp, orgId);
      if (r.inserted) {
        inserted++;
        insertedIds.push(r.row.id);
        console.log(`  ✅ INSERTED: "${r.row.title}" | cat=${r.row.category} | slug=${r.row.slug}`);
      } else {
        skipped++;
        console.log(`  ⏭  SKIPPED: "${opp.title.substring(0,60)}" (${r.reason})`);
      }
    }
    console.log(`  ${name}: inserted=${inserted} skipped=${skipped}`);
  }

  // ─── STEP 3: Query and print LITERAL row contents ─────────────────────────
  if (insertedIds.length === 0) {
    console.log("\n⚠️  No rows were inserted. Cannot run Step 3 inspection.");
    process.exit(0);
  }

  console.log("\n═══════════════════════════════════");
  console.log(" STEP 3: Literal Row Inspection");
  console.log("═══════════════════════════════════\n");

  const { data: rows, error } = await supabase
    .from("opportunities")
    .select("id, title, category, deadline, apply_url, source_url, organization_id, tags, verification_status")
    .in("id", insertedIds)
    .order("created_at", { ascending: false });

  if (error) { console.error("Query error:", error.message); process.exit(1); }

  // Fetch org names for the org IDs
  const orgIds = [...new Set(rows.map(r => r.organization_id).filter(Boolean))];
  const { data: orgs } = await supabase.from("organizations").select("id, name, type").in("id", orgIds);
  const orgMap = Object.fromEntries((orgs || []).map(o => [o.id, o]));

  console.log(`Found ${rows.length} inserted rows:\n`);
  rows.forEach((row, i) => {
    const org = orgMap[row.organization_id];
    console.log(`Row ${i + 1}:`);
    console.log(`  id:                  ${row.id}`);
    console.log(`  title:               "${row.title}"`);
    console.log(`  organization_id:     ${row.organization_id}`);
    console.log(`  org.name (resolved): "${org?.name ?? "NOT FOUND"}"`);
    console.log(`  org.type:            "${org?.type ?? "—"}"`);
    console.log(`  category:            "${row.category}"`);
    console.log(`  deadline:            ${row.deadline ?? "null"}`);
    console.log(`  apply_url:           "${row.apply_url}"`);
    console.log(`  source_url:          "${row.source_url}"`);
    console.log(`  tags:                [${(row.tags || []).join(", ")}]`);
    console.log(`  verification_status: "${row.verification_status}"`);
    console.log("");
  });

  console.log("═══════════════════════════════════");
  console.log(" END OF STEP 3 — Waiting for review");
  console.log("═══════════════════════════════════");
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
