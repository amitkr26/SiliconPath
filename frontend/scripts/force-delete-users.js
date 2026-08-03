const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://aqauempuwmbizqoaolop.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "REDACTED_SUPABASE_SECRET_DB1_OLD";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const targetUids = [
  "3935f5d0-62da-45ba-a18e-53e4a67bb959",
  "077f4ed3-3aff-4634-ab86-9af05921da64"
];

async function forceDeleteUsers() {
  console.log("=================================================");
  console.log("⚡ FORCE PURGING REMAINING 2 USERS VIA ADMIN REST");
  console.log("=================================================\n");

  for (const uid of targetUids) {
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${uid}`, {
        method: "DELETE",
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json"
        }
      });
      const text = await res.text();
      console.log(`User ${uid}: HTTP ${res.status} | Response:`, text);
    } catch (err) {
      console.error(`User ${uid} error:`, err.message);
    }
  }

  const { data: list } = await supabase.auth.admin.listUsers();
  console.log(`\nRemaining Users Count: ${list?.users?.length || 0}`);
  if (list?.users) {
    console.log("Users:", list.users.map(u => ({ id: u.id, email: u.email, providers: u.app_metadata?.providers })));
  }
}

forceDeleteUsers();
