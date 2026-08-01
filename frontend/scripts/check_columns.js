const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://syxmjefskcydxmjefskc.supabase.co";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkColumns() {
  const { data, error } = await supabase.from("opportunities").select("*").limit(1);
  if (data && data.length > 0) {
    console.log("Columns in opportunities table:", Object.keys(data[0]));
  } else {
    console.error("Error or empty:", error);
  }
}

checkColumns();
