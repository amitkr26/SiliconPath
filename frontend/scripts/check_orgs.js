const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://syxmjefskcydxmjefskc.supabase.co";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkOrgs() {
  const { data, error } = await supabase.from("organizations").select("id, name, slug").limit(20);
  if (data) {
    console.log("Organizations in DB:", data);
  } else {
    console.error("Error:", error);
  }
}

checkOrgs();
