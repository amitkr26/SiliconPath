const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://aqauempuwmbizqoaolop.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxYXVlbXB1d21iaXpxb2FvbG9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjYzNzQ0NSwiZXhwIjoyMDk4MjEzNDQ1fQ.0u5fIs35SW5lAtmdoxoOrFjLkBHqkPEbLC_oa925Vq4";

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function inspectForeignKeys() {
  console.log("=== INSPECTING FOREIGN KEYS ON CONNECTIONS & MESSAGES ===");

  // Let's test inserting a row with different requester_id values to see what constraint fails
  // First check if user `7a8af57e-b309-4fab-a7b1-11aa8edf62c4` exists in auth.users and user_profiles
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", "7a8af57e-b309-4fab-a7b1-11aa8edf62c4")
    .maybeSingle();

  console.log("User profile in user_profiles table:", profile);

  // Check auth.users via admin API
  const { data: authUser, error: authErr } = await supabase.auth.admin.getUserById(
    "7a8af57e-b309-4fab-a7b1-11aa8edf62c4"
  );
  console.log("User in auth.users:", authUser ? authUser.user?.email : "NOT FOUND", authErr);

  // Try inserting into connections with service role
  const { data: insertTest, error: insertErr } = await supabase
    .from("connections")
    .insert({
      requester_id: "7a8af57e-b309-4fab-a7b1-11aa8edf62c4",
      addressee_id: "14738cfb-9629-4d9b-a116-719b5a825afe",
      status: "pending"
    })
    .select();

  console.log("Test insert result:", insertTest, "Error:", insertErr);
}

inspectForeignKeys();
