const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://syxmjefskcydxmjefskc.supabase.co";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkCategories() {
  const { data, error } = await supabase.from("opportunities").select("category");
  if (data) {
    const cats = [...new Set(data.map(d => d.category))];
    console.log("Allowed categories in DB:", cats);
  } else {
    console.error("Error:", error);
  }
}

checkCategories();
