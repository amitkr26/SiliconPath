import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrgs() {
  const { data, error } = await supabase
    .from("opportunities")
    .select("organization")

  if (error) {
    console.error(error);
    return;
  }

  const counts = {};
  for (const row of data) {
    counts[row.organization] = (counts[row.organization] || 0) + 1;
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  console.log("Top 50 Organizations:");
  for (const [org, count] of sorted.slice(0, 50)) {
    console.log(`${count.toString().padEnd(5)} | ${org}`);
  }

  // Find suspicious person names
  const suspicious = sorted.filter(([org]) => 
    org.includes("Sadia") || org.includes("Faizan") || org.includes("Muhammad") || 
    org.includes("Ali") || org.split(" ").length === 2 && !org.includes("University") && !org.includes("Institute")
  );
  
  console.log("\nSuspicious Organizations (Possible Name Misattribution):");
  for (const [org, count] of suspicious.slice(0, 30)) {
    console.log(`${count.toString().padEnd(5)} | ${org}`);
  }
}

checkOrgs();
