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

async function verifyFresherAndDomainFilters() {
  console.log("============================================================");
  console.log("4. FRESHER & DOMAIN FILTERS VERIFICATION");
  console.log("============================================================");

  const filters = [
    { name: "Fresher / Entry Level", category: "internship" },
    { name: "JRF (Junior Research Fellowship)", category: "jrf" },
    { name: "SRF (Senior Research Fellowship)", category: "srf" },
    { name: "Fellowship / Postdoc", category: "fellowship" },
    { name: "Government / PSU", category: "government" },
    { name: "VLSI / Semiconductor", tag: "VLSI" },
    { name: "Embedded Systems", tag: "Embedded" },
    { name: "Electronics", tag: "Electronics" }
  ];

  const results = [];

  for (const f of filters) {
    let query = supabase
      .from("opportunities")
      .select("id, title, organization, category, deadline, apply_url, tags")
      .eq("is_active", true)
      .eq("verification_status", "verified");

    if (f.category) {
      query = query.eq("category", f.category);
    }
    if (f.tag) {
      query = query.contains("tags", [f.tag]);
    }

    const { data, error } = await query.limit(5);
    const count = data ? data.length : 0;

    results.push({
      filter: f.name,
      activeMatchingCount: count,
      hasResults: count > 0,
      sampleTitle: data && data[0] ? data[0].title.slice(0, 40) + "..." : "None",
      sampleOrg: data && data[0] ? data[0].organization || "N/A" : "N/A"
    });
  }

  console.table(results);
  return results;
}

verifyFresherAndDomainFilters().catch(console.error);
