const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://aqauempuwmbizqoaolop.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "REDACTED_SUPABASE_SECRET_DB1_OLD";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testRpc() {
  const { data, error } = await supabase.rpc("exec_sql", { query: "SELECT 1;" });
  if (error) {
    console.log("RPC exec_sql error:", error.message);
  } else {
    console.log("RPC exec_sql working:", data);
  }
}

testRpc();
