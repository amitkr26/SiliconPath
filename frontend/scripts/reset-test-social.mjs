// Cleanly reset connections, conversations, and messages between test users
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "fs";

// Resolve .env.local relative to the repo root (works from any cwd; the old
// hardcoded D:\Tinkerscape path broke after the machine move).
const candidates = ["frontend/.env.local", ".env.local", process.env.SOCIAL_RESET_ENV].filter(Boolean);
const envPath = candidates.find((p) => existsSync(p));
if (!envPath) throw new Error("No .env.local found — run from the repo root or set SOCIAL_RESET_ENV");
const envLines = readFileSync(envPath, "utf8")
  .split("\n").reduce((a, l) => { const m = l.match(/^([A-Z_]+)=(.*)/); if (m) a[m[1]] = m[2].trim(); return a; }, {});

const admin = createClient(envLines.NEXT_PUBLIC_SUPABASE_URL, envLines.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log("=== Finding test users ===");
  const { data: users } = await admin
    .from("user_profiles")
    .select("id, username, email")
    .in("username", ["amittest1", "amittest2"]);

  const ids = (users || []).map(u => u.id);
  console.log("Test user IDs:", ids);

  if (ids.length > 0) {
    console.log("Cleaning test messages, conversations, connections...");
    for (const id of ids) {
      await admin.from("messages").delete().eq("sender_id", id);
      await admin.from("conversations").delete().or(`participant_a.eq.${id},participant_b.eq.${id}`);
      await admin.from("connections").delete().or(`requester_id.eq.${id},addressee_id.eq.${id}`);
    }
  }
  console.log("Social state reset complete!");
}

main().catch(console.error);
