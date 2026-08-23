import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../frontend/.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function checkDeadlines() {
  console.log("============================================================");
  console.log("3. DEADLINE INTEGRITY CHECK ACROSS ALL PUBLIC-ACTIVE OPPORTUNITIES");
  console.log("============================================================");

  const today = new Date().toISOString().split("T")[0];
  console.log(`Current Reference Date: ${today}`);

  const { data: activeOpps, error } = await supabase
    .from("opportunities")
    .select("id, title, deadline, category, is_active, verification_status")
    .eq("is_active", true)
    .eq("verification_status", "verified");

  if (error || !activeOpps) {
    console.error("Error fetching active opportunities:", error);
    process.exit(1);
  }

  console.log(`Total Public-Active Verified rows to check: ${activeOpps.length}`);

  let pastDeadlineCount = 0;
  let todayDeadlineCount = 0;
  let futureDeadlineCount = 0;
  let nullDeadlineCount = 0;

  const violations = [];

  for (const opp of activeOpps) {
    if (!opp.deadline) {
      nullDeadlineCount++;
    } else {
      const dStr = opp.deadline.split("T")[0];
      if (dStr < today) {
        pastDeadlineCount++;
        violations.push({ id: opp.id, title: opp.title, deadline: opp.deadline, violation: "DEADLINE_IN_PAST" });
      } else if (dStr === today) {
        todayDeadlineCount++;
      } else {
        futureDeadlineCount++;
      }
    }
  }

  console.log(`- Future Deadlines (deadline > today): ${futureDeadlineCount}`);
  console.log(`- Same-Day Deadlines (deadline = today): ${todayDeadlineCount}`);
  console.log(`- Ongoing / Rolling Deadlines (NULL deadline): ${nullDeadlineCount}`);
  console.log(`- Past Deadlines Active (VIOLATIONS): ${pastDeadlineCount}`);

  if (violations.length > 0) {
    console.error("DEADLINE VIOLATIONS FOUND:", violations);
  } else {
    console.log("ALL PUBLIC-ACTIVE OPPORTUNITIES SATISFY DEADLINE INTEGRITY 100%.");
  }

  return { violations: violations.length };
}

checkDeadlines().catch(err => {
  console.error("FATAL DEADLINE CHECK:", err);
  process.exit(1);
});
