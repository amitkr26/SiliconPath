import { createClient } from "@supabase/supabase-js";

const db1 = createClient(
  "https://aqauempuwmbizqoaolop.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxYXVlbXB1d21iaXpxb2FvbG9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjYzNzQ0NSwiZXhwIjoyMDk4MjEzNDQ1fQ.0u5fIs35SW5lAtmdoxoOrFjLkBHqkPEbLC_oa925Vq4"
);

const db2 = createClient(
  "https://jbqjipwanfsxyqkfrrpx.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpicWppcHdhbmZzeHlxa2ZycnB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjgwNTE5MSwiZXhwIjoyMDk4MzgxMTkxfQ.yEDQacwudkd8Wv_kGsE9T4RgcGm0KRaoyXT8U41cPgk"
);

async function searchDB(name, client) {
  console.log(`\n=== Searching ${name} ===`);
  const tables = [
    "opportunities", "organizations", "company_pages", 
    "news_articles", "community_posts", "feed_posts", "scrape_sources"
  ];

  for (const table of tables) {
    try {
      const { data, error } = await client.from(table).select("*").limit(100);
      if (error) {
        // Table probably doesn't exist
        continue;
      }
      
      const matches = data.filter(row => {
        const str = JSON.stringify(row).toLowerCase();
        return str.includes("payment gateway") || str.includes("at a glance") || str.includes("nvidia devops");
      });

      if (matches.length > 0) {
        console.log(`  Found MATCH in table "${table}":`);
        matches.forEach(m => {
          console.log(`    - ID: ${m.id || m.slug || "unknown"}, Title/Name: "${m.title || m.name || "unknown"}"`);
        });
      }
    } catch (e) {
      // Ignored
    }
  }
}

async function main() {
  await searchDB("DB1 (aqauempuwmbizqoaolop)", db1);
  await searchDB("DB2 (jbqjipwanfsxyqkfrrpx)", db2);
}

main().catch(console.error);
