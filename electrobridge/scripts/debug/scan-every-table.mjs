import { createClient } from "@supabase/supabase-js";

const db1 = createClient(
  "https://aqauempuwmbizqoaolop.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxYXVlbXB1d21iaXpxb2FvbG9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjYzNzQ0NSwiZXhwIjoyMDk4MjEzNDQ1fQ.0u5fIs35SW5lAtmdoxoOrFjLkBHqkPEbLC_oa925Vq4"
);

async function main() {
  console.log("Fetching all public tables...");
  // Query table list
  const { data: tables, error: tErr } = await db1.rpc("get_tables"); // If RPC exists, otherwise select from information_schema
  
  let tableNames = [];
  if (tErr) {
    // Fallback list of all tables we saw earlier
    tableNames = [
      "academy_assessments", "academy_days", "academy_tracks", "ai_usage_log", "applications", 
      "calendar_exports", "community_comments", "community_posts", "community_votes", "company_followers", 
      "company_pages", "connection_requests", "connections", "conversations", "feed_post_comments", 
      "feed_post_likes", "feed_post_reposts", "feed_posts", "learning_days", "learning_tracks", 
      "link_check_logs", "messages", "news_articles", "notifications", "opportunities", 
      "opportunity_reports", "organizations", "recommendations", "resource_bank", "resources", 
      "saved_opportunities", "scrape_runs", "scrape_sources", "skill_endorsements", "subscribers", 
      "suggestions", "telegram_subscribers", "track_checkpoints", "user_alerts", "user_follows", 
      "user_learning_progress", "user_profiles", "user_resumes"
    ];
  } else {
    tableNames = tables.map(t => t.table_name);
  }

  console.log(`Checking ${tableNames.length} tables for garbage data...`);
  for (const table of tableNames) {
    try {
      const { data, error } = await db1.from(table).select("*");
      if (error || !data) continue;
      
      const matches = data.filter(row => {
        const str = JSON.stringify(row).toLowerCase();
        return str.includes("payment gateway") || str.includes("at a glance") || str.includes("nvidia devops") || str.includes("micron");
      });

      if (matches.length > 0) {
        console.log(`\n🎉 Found MATCH in table "${table}":`);
        matches.forEach((m, idx) => {
          console.log(`  Row ${idx+1}:`, JSON.stringify(m, null, 2));
        });
      }
    } catch (e) {
      // ignore
    }
  }
  console.log("\nDone checking.");
}

main().catch(console.error);
