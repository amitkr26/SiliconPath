const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://syxmjefskcydxmjefskc.supabase.co";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.log("Missing Supabase credentials in env.");
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function fixVerification() {
  console.log("Fixing database verification status...");
  
  // 1. Update all active records to verified status
  const { data, error, count } = await supabase
    .from("opportunities")
    .update({ verification_status: "verified", is_active: true })
    .eq("is_active", true)
    .select("id", { count: "exact" });

  if (error) {
    console.error("Error updating opportunities verification status:", error);
  } else {
    console.log(`Successfully verified ${count || data?.length || 0} database opportunities.`);
  }
}

fixVerification();
