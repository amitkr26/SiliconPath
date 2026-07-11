import { createClient } from "@supabase/supabase-js";

const db1 = createClient(
  "https://aqauempuwmbizqoaolop.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxYXVlbXB1d21iaXpxb2FvbG9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjYzNzQ0NSwiZXhwIjoyMDk4MjEzNDQ1fQ.0u5fIs35SW5lAtmdoxoOrFjLkBHqkPEbLC_oa925Vq4"
);

const db2 = createClient(
  "https://jbqjipwanfsxyqkfrrpx.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpicWppcHdhbmZzeHlxa2ZycnB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjgwNTE5MSwiZXhwIjoyMDk4MzgxMTkxfQ.yEDQacwudkd8Wv_kGsE9T4RgcGm0KRaoyXT8U41cPgk"
);

async function check(name, client) {
  console.log(`\n=== Checking ${name} ===`);
  try {
    const { data: tables, error: tErr } = await client.from("opportunities").select("count");
    if (tErr) {
      console.log(`Error querying count on opportunities:`, tErr.message);
    } else {
      const { count } = await client.from("opportunities").select("*", { count: "exact", head: true });
      console.log(`opportunities count:`, count);
      
      const { data: sample } = await client.from("opportunities").select("id, title, category, verification_status").limit(5);
      console.log(`opportunities sample:`, sample);
    }
  } catch (e) {
    console.error(`Failed to connect/query:`, e.message);
  }

  try {
    const { count } = await client.from("organizations").select("*", { count: "exact", head: true });
    console.log(`organizations count:`, count);
  } catch (e) {
    console.log(`organizations table query failed`);
  }

  try {
    const { count } = await client.from("company_pages").select("*", { count: "exact", head: true });
    console.log(`company_pages count:`, count);
  } catch (e) {
    console.log(`company_pages table query failed`);
  }
}

async function main() {
  await check("DB1 (aqauempuwmbizqoaolop)", db1);
  await check("DB2 (jbqjipwanfsxyqkfrrpx)", db2);
}

main().catch(console.error);
