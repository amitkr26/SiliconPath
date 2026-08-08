const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://aqauempuwmbizqoaolop.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxYXVlbXB1d21iaXpxb2FvbG9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjYzNzQ0NSwiZXhwIjoyMDk4MjEzNDQ1fQ.0u5fIs35SW5lAtmdoxoOrFjLkBHqkPEbLC_oa925Vq4";

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function deepScanOpportunities() {
  console.log("=== SCANNING FOR ANY REMAINING TEST/FAKE OPPORTUNITIES ===");

  const { data: allOps, error } = await supabase
    .from("opportunities")
    .select("id, title, organization, salary_range, apply_url, source_url, created_at, tags");

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(`Total rows in opportunities: ${allOps.length}`);

  // Find any remaining entries with test keywords, QA, audit, or self links
  const matches = allOps.filter((o) => {
    const s = JSON.stringify(o).toLowerCase();
    return (
      s.includes("qa audit") ||
      s.includes("ui verified") ||
      s.includes("lead risc-v soc architect") ||
      s.includes("qualcomm vlsi lab") ||
      s.includes("semiconductor lab test") ||
      s.includes("berojgardegreewala.vercel.app") ||
      s.includes("1,80,00,000") ||
      s.includes("2,40,00,000") ||
      s.includes("24,000,000") ||
      s.includes("18,000,000")
    );
  });

  console.log(`\nFound ${matches.length} matching rows:`);
  console.log(JSON.stringify(matches, null, 2));

  if (matches.length > 0) {
    const ids = matches.map(m => m.id);
    const { error: delErr } = await supabase
      .from("opportunities")
      .delete()
      .in("id", ids);
    console.log("Deleted remaining test rows. Error:", delErr);
  } else {
    console.log("Zero remaining test/fake opportunities in database! 100% clean.");
  }
}

deepScanOpportunities();
