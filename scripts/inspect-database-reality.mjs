import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envContent = fs.readFileSync("frontend/.env.local", "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[match[1].trim()] = val;
  }
});

const supabaseUrl = env["NEXT_PUBLIC_SUPABASE_URL"];
const supabaseKey = env["SUPABASE_SERVICE_ROLE_KEY"] || env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectDb() {
  console.log("Connecting to Supabase:", supabaseUrl);

  const candidateTables = [
    "user_profiles", "profiles", "candidate_profiles", "employer_profiles",
    "user_resumes", "resumes",
    "opportunities", "applications", "saved_opportunities", "bookmarks",
    "feed_posts", "feed_post_comments", "feed_post_likes", "feed_post_reposts",
    "messages", "direct_messages", "conversations",
    "notifications", "connections", "connection_requests", "skill_endorsements", "recommendations",
    "news_articles", "organizations", "companies",
    "scrape_sources", "scrape_runs", "scraped_opportunities",
    "candidate_experiences", "candidate_educations", "candidate_projects", "candidate_certifications", "candidate_achievements",
    "resumes", "user_roles", "permissions", "role_permissions", "user_permissions",
    "click_events", "subscribers", "contact_messages", "reports", "audit_logs"
  ];

  const results = [];
  for (const table of candidateTables) {
    try {
      const { count, data, error } = await supabase.from(table).select("*", { count: "exact", head: true });
      if (error) {
        results.push({ table, exists: false, error: error.message });
      } else {
        const sample = await supabase.from(table).select("*").limit(1);
        const columns = sample.data && sample.data.length > 0 ? Object.keys(sample.data[0]) : [];
        results.push({ table, exists: true, count, columns });
      }
    } catch (e) {
      results.push({ table, exists: false, error: e.message });
    }
  }

  console.log("\n--- DATABASE TABLES DISCOVERY ---");
  for (const r of results) {
    if (r.exists) {
      console.log(`[EXISTS] Table: ${r.table.padEnd(26)} | Rows: ${String(r.count).padEnd(6)} | Columns (${r.columns.length}): ${r.columns.join(", ")}`);
    } else {
      console.log(`[MISSING] Table: ${r.table.padEnd(26)} -> ${r.error}`);
    }
  }
}

inspectDb().catch(console.error);
