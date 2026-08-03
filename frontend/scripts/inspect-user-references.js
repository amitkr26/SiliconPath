const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://aqauempuwmbizqoaolop.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "REDACTED_SUPABASE_SECRET_DB1_OLD";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const targetUids = [
  "3935f5d0-62da-45ba-a18e-53e4a67bb959",
  "077f4ed3-3aff-4634-ab86-9af05921da64"
];

async function inspectUserReferences() {
  console.log("=================================================");
  console.log("🔍 INSPECTING REFERENCES FOR THE 2 REMAINING USERS");
  console.log("=================================================\n");

  const tablesToCheck = [
    "user_profiles",
    "applications",
    "saved_opportunities",
    "connections",
    "messages",
    "conversations",
    "notifications",
    "opportunities",
    "org_members",
    "user_skills",
    "user_education",
    "user_experience",
    "resumes",
    "forum_posts",
    "forum_comments"
  ];

  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase.from(table).select("*");
      if (error) continue;

      for (const row of data || []) {
        const rowStr = JSON.stringify(row);
        for (const uid of targetUids) {
          if (rowStr.includes(uid)) {
            console.log(`  📍 Reference found in table '${table}': Row ID = ${row.id || 'N/A'}`);
          }
        }
      }
    } catch { /* ignore */ }
  }

  // Attempt force deletion with auth admin API
  console.log("\nAttempting deletion via auth admin API...");
  for (const uid of targetUids) {
    const { error } = await supabase.auth.admin.deleteUser(uid);
    if (error) {
      console.log(`  ❌ Failed to delete ${uid}:`, error.message);
    } else {
      console.log(`  ✅ Successfully deleted user ${uid}!`);
    }
  }
}

inspectUserReferences();
