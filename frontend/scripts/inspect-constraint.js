const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://aqauempuwmbizqoaolop.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "REDACTED_SUPABASE_SECRET_DB1_OLD";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function inspectCategoryValues() {
  const categoriesToTest = ["jrf", "srf", "phd", "fellowship", "government", "internship", "job", "private", "other"];
  console.log("Testing category insert values with apply_url:");
  for (const cat of categoriesToTest) {
    const slug = `test-cat-${cat}-${Date.now()}`;
    const { data, error } = await supabase.from("opportunities").insert([{
      title: `Test Category ${cat}`,
      category: cat,
      location: "Bengaluru",
      country: "India",
      apply_url: "https://drdo.gov.in/careers",
      slug,
      verification_status: "verified",
      is_active: true
    }]).select("id, category").single();

    if (error) {
      console.log(`  ❌ '${cat}': FAIL - ${error.message}`);
    } else {
      console.log(`  ✅ '${cat}': ALLOWED! (ID: ${data.id})`);
      await supabase.from("opportunities").delete().eq("id", data.id);
    }
  }
}

inspectCategoryValues();
