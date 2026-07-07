import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verify() {
  // 1. Check remaining rows
  const { data, error } = await supabase
    .from("opportunities")
    .select("id, title, organization, category, source_url")
    .order("organization");

  if (error) { console.error(error); return; }

  console.log(`\n=== ${data.length} REMAINING ROWS ===\n`);
  for (const row of data) {
    console.log(`  ✅ ${row.organization.padEnd(20)} | ${row.category?.padEnd(12) || "N/A".padEnd(12)} | ${row.title?.substring(0, 70)}`);
  }

  // 2. Check if there's a separate table with scholarship data that might contain "Sadia Munir"
  // Try querying other possible tables
  for (const table of ["news", "scholarships", "posts", "feed_posts"]) {
    try {
      const { data: tData, error: tErr } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      if (!tErr) {
        console.log(`\nTable "${table}": exists, count = checking...`);
        const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
        console.log(`  -> ${count} rows`);
      }
    } catch (e) {
      // table doesn't exist
    }
  }

  // 3. Search for "Sadia" across all known tables
  console.log("\n=== SEARCHING FOR 'Sadia' ACROSS TABLES ===");
  
  const { data: sadiaOpps } = await supabase
    .from("opportunities")
    .select("id, title, organization")
    .or("title.ilike.%sadia%,organization.ilike.%sadia%,description.ilike.%sadia%");
  console.log(`opportunities table: ${sadiaOpps?.length || 0} matches`);
  if (sadiaOpps?.length) sadiaOpps.forEach(r => console.log(`  ${r.organization} | ${r.title}`));

  // Check secondary Supabase
  const supabase2 = createClient(
    process.env.SUPABASE_2_URL,
    process.env.SUPABASE_2_SERVICE_ROLE_KEY
  );

  try {
    const { data: s2Opps } = await supabase2
      .from("opportunities")
      .select("id, title, organization")
      .or("title.ilike.%sadia%,organization.ilike.%sadia%");
    console.log(`supabase2 opportunities: ${s2Opps?.length || 0} matches`);
    if (s2Opps?.length) s2Opps.forEach(r => console.log(`  ${r.organization} | ${r.title}`));
  } catch (e) {
    console.log("supabase2: no opportunities table or error");
  }
}

verify();
