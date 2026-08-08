const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://aqauempuwmbizqoaolop.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxYXVlbXB1d21iaXpxb2FvbG9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjYzNzQ0NSwiZXhwIjoyMDk4MjEzNDQ1fQ.0u5fIs35SW5lAtmdoxoOrFjLkBHqkPEbLC_oa925Vq4";

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function inspectTables() {
  console.log("=== INSPECTING NETWORK & MESSAGES TABLES ===");

  const tables = ["connections", "connection_requests", "conversations", "messages", "user_profiles"];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select("*").limit(3);
    if (error) {
      console.log(`❌ Table '${t}' error:`, error.message);
    } else {
      console.log(`✅ Table '${t}' exists! Row count sample: ${data.length}`);
      if (data.length > 0) {
        console.log(`Columns in '${t}':`, Object.keys(data[0]));
      }
    }
  }
}

inspectTables();
