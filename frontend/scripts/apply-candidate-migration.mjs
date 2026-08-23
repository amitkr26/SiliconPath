import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const SUPABASE_MGMT_TOKEN = process.env.SUPABASE_MGMT_TOKEN || "";
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "aqauempuwmbizqoaolop";

async function runSQL(query) {
  if (!SUPABASE_MGMT_TOKEN) {
    console.log("⚠️ SUPABASE_MGMT_TOKEN not set in environment; skipping direct management API query.");
    return null;
  }
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SUPABASE_MGMT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`SQL Error [${res.status}]: ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  console.log("Applying Phase 9 Candidate Profile Entities Migration...");

  const migrationPath = path.resolve(__dirname, "../supabase/migrations/20260823000001_candidate_profile_entities.sql");
  const sql = fs.readFileSync(migrationPath, "utf-8");

  const res = await runSQL(sql);
  if (res) {
    console.log("✅ Phase 9 schema migration successfully executed on live Supabase PostgreSQL!");
  } else {
    console.log("ℹ️ In-memory resilient store active for sub-resources.");
  }
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
