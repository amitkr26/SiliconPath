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

async function realignCategories() {
  console.log("============================================================");
  console.log("REALIGNING CORPORATE SEMICONDUCTOR OPPORTUNITIES TO 'industry'");
  console.log("============================================================");

  const { data: allActive, error } = await supabase
    .from("opportunities")
    .select("id, title, category, tags, organization, is_active, verification_status")
    .eq("is_active", true)
    .eq("verification_status", "verified");

  if (error || !allActive) {
    console.error("Fetch error:", error);
    process.exit(1);
  }

  console.log(`Auditing ${allActive.length} active verified opportunities...`);

  let updatedToIndustry = 0;
  let updatedToInternship = 0;
  let updatedToFellowship = 0;
  let updatedToGovt = 0;
  let keptJrf = 0;

  for (const opp of allActive) {
    const titleLower = (opp.title || "").toLowerCase();
    const tagsLower = (opp.tags || []).map(t => (t || "").toLowerCase());
    const isPrivate = tagsLower.includes("private job") || tagsLower.includes("semiconductor");

    const isAcademicJrf = titleLower.includes("jrf") || titleLower.includes("junior research") || titleLower.includes("iit ") || titleLower.includes("iisc") || titleLower.includes("nit ") || titleLower.includes("project assistant");
    const isAcademicSrf = titleLower.includes("srf") || titleLower.includes("senior research");
    const isGovt = titleLower.includes("isro") || titleLower.includes("drdo") || titleLower.includes("ntpc") || titleLower.includes("railway") || titleLower.includes("rrb") || titleLower.includes("scientist 'b'") || titleLower.includes("advt. no.");
    const isIntern = titleLower.includes("intern") || titleLower.includes("apprentice");
    const isFellowship = titleLower.includes("fellowship") || titleLower.includes("postdoc");

    let newCategory = opp.category;

    if (isGovt && opp.category !== "government") {
      newCategory = "government";
      updatedToGovt++;
    } else if (isIntern && opp.category !== "internship") {
      newCategory = "internship";
      updatedToInternship++;
    } else if (isFellowship && opp.category !== "fellowship") {
      newCategory = "fellowship";
      updatedToFellowship++;
    } else if (isAcademicJrf) {
      newCategory = "jrf";
      keptJrf++;
    } else if (isAcademicSrf) {
      newCategory = "srf";
    } else if (isPrivate || opp.category === "jrf") {
      newCategory = "industry";
      updatedToIndustry++;
    }

    if (newCategory !== opp.category) {
      const { error: uErr } = await supabase.from("opportunities").update({ category: newCategory }).eq("id", opp.id);
      if (uErr) console.error(`Error updating ${opp.id} to ${newCategory}:`, uErr.message);
    }
  }

  console.log("Realignment complete:");
  console.log(`- Aligned to 'industry' (Corporate Semiconductor): ${updatedToIndustry}`);
  console.log(`- Aligned to 'internship': ${updatedToInternship}`);
  console.log(`- Aligned to 'government': ${updatedToGovt}`);
  console.log(`- Aligned to 'fellowship': ${updatedToFellowship}`);
  console.log(`- Retained 'jrf': ${keptJrf}`);

  // Fetch new distribution
  const { data: updatedPool } = await supabase.from("opportunities").select("category").eq("is_active", true).eq("verification_status", "verified");
  const dist = {};
  for (const o of updatedPool) {
    dist[o.category] = (dist[o.category] || 0) + 1;
  }
  console.log("\nNew Verified Active Category Distribution:", dist);
}

realignCategories().catch(console.error);
