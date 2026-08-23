import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://aqauempuwmbizqoaolop.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function inspectCandidateTables() {
  console.log("================================================================================");
  console.log("  LIVE SUPABASE POSTGRESQL TABLES INSPECTION                                    ");
  console.log("================================================================================\n");

  const tables = [
    "user_profiles",
    "connections",
    "user_follows",
    "conversations",
    "messages",
    "notifications",
    "candidate_experiences",
    "candidate_educations",
    "candidate_projects",
    "candidate_certifications",
    "candidate_achievements",
  ];

  for (const t of tables) {
    const { data, error } = await supabase.from(t).select("*").limit(1);
    if (error) {
      console.log(`❌ Table '${t}': PostgREST Error [${error.code}]: ${error.message}`);
    } else {
      console.log(`✅ Table '${t}': EXISTS & ACCESSIBLE (Rows sample length: ${data?.length})`);
    }
  }
}

inspectCandidateTables().catch(console.error);
