import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../frontend/.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function getUntruncatedCounts() {
  const { count: totalCount } = await supabase.from("opportunities").select("*", { count: "exact", head: true });
  const { count: activeVerified } = await supabase.from("opportunities").select("*", { count: "exact", head: true }).eq("is_active", true).eq("verification_status", "verified");
  const { count: expired } = await supabase.from("opportunities").select("*", { count: "exact", head: true }).eq("verification_status", "expired");
  const { count: rejected } = await supabase.from("opportunities").select("*", { count: "exact", head: true }).eq("verification_status", "rejected");
  const { count: pending } = await supabase.from("opportunities").select("*", { count: "exact", head: true }).eq("verification_status", "pending");
  const { count: linkUnavailable } = await supabase.from("opportunities").select("*", { count: "exact", head: true }).eq("verification_status", "link_unavailable");
  const { count: nullDeadlines } = await supabase.from("opportunities").select("*", { count: "exact", head: true }).eq("is_active", true).eq("verification_status", "verified").is("deadline", null);
  const { count: fixedDeadlines } = await supabase.from("opportunities").select("*", { count: "exact", head: true }).eq("is_active", true).eq("verification_status", "verified").not("deadline", "is", null);

  console.log("=== UNTRUNCATED DATABASE STATS ===");
  console.log(`Total DB Records: ${totalCount}`);
  console.log(`Public-Active Verified: ${activeVerified}`);
  console.log(`Expired (Quarantined): ${expired}`);
  console.log(`Rejected / Duplicates / Non-tech (Quarantined): ${rejected}`);
  console.log(`Pending Moderation (Quarantined): ${pending}`);
  console.log(`Link Unavailable (Quarantined): ${linkUnavailable}`);
  console.log(`Active NULL Deadlines (Ongoing / Rolling): ${nullDeadlines}`);
  console.log(`Active Fixed Future Deadlines: ${fixedDeadlines}`);
}

getUntruncatedCounts().catch(console.error);
