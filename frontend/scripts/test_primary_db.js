const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://aqauempuwmbizqoaolop.supabase.co";
const supabaseServiceRoleKey = "REDACTED_SUPABASE_SECRET_DB1_OLD";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testPrimaryDb() {
  console.log("Testing connection to primary Supabase project (aqauempuwmbizqoaolop)...");
  
  const { data: orgs, error: orgErr } = await supabase.from("organizations").select("id, name, slug").limit(10);
  if (orgErr) {
    console.error("Org query error:", orgErr);
  } else {
    console.log("Organizations in Primary DB:", orgs);
  }

  const { count, error: oppErr } = await supabase.from("opportunities").select("id", { count: "exact", head: true });
  if (oppErr) {
    console.error("Opp query error:", oppErr);
  } else {
    console.log(`Total opportunities in Primary DB: ${count}`);
  }
}

testPrimaryDb();
