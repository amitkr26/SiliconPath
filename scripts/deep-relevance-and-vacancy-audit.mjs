import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fetch from "node-fetch";
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

const HARDWARE_VLSI_KEYWORDS = [
  "vlsi", "semiconductor", "rtl", "asic", "fpga", "verification", "physical design",
  "dft", "sta", "embedded", "firmware", "microelectronics", "analog", "digital design",
  "systemverilog", "uvm", "eda", "cadence", "synopsys", "layout", "silicon", "finfet",
  "nanotechnology", "optics", "photonics", "jrf", "srf", "phd", "postdoc", "research fellow",
  "scientist", "avionics", "radar", "hardware", "board design", "pcb", "power electronics",
  "mems", "spintronics", "device physicist", "quantum computing", "soc", "chiplet", "risc-v"
];

const GENERIC_SOFTWARE_KEYWORDS = [
  "business applications", "kubernetes", "cloud software", "full stack", "react",
  "frontend developer", "salesforce", "devops engineer", "scrum master", "product manager",
  "marketing manager", "data analyst", "business analyst", "it administrator", "helpdesk",
  "hr recruiter", "talent acquisition", "content writer", "seo specialist", "accountant"
];

async function auditRelevanceAndSpecificVacancy() {
  console.log("============================================================");
  console.log("1. AUDITING 50 RANDOM PUBLIC-ACTIVE OPPORTUNITIES FOR STRICT RELEVANCE & VACANCIES");
  console.log("============================================================");

  const { data: activeOpps, error } = await supabase
    .from("opportunities")
    .select("id, title, organization, category, deadline, apply_url, source_url, slug, description, tags, is_active, verification_status")
    .eq("is_active", true)
    .eq("verification_status", "verified");

  if (error || !activeOpps) {
    console.error("Error fetching active opportunities:", error);
    process.exit(1);
  }

  console.log(`Total Active Verified Pool: ${activeOpps.length}`);

  // Shuffle and select 50
  const shuffled = [...activeOpps].sort(() => 0.5 - Math.random());
  const sample50 = shuffled.slice(0, 50);

  const auditRows = [];
  const toQuarantine = [];
  const manualReview = [];
  const keepList = [];

  for (let i = 0; i < sample50.length; i++) {
    const opp = sample50[i];
    const textToCheck = `${opp.title} ${opp.description || ""} ${(opp.tags || []).join(" ")}`.toLowerCase();

    // 1. Relevance Check
    const hasHardwareMatch = HARDWARE_VLSI_KEYWORDS.some(kw => textToCheck.includes(kw));
    const hasGenericSoftwareMatch = GENERIC_SOFTWARE_KEYWORDS.some(kw => textToCheck.includes(kw));
    
    let isRelevant = hasHardwareMatch;
    let relevanceNote = "Relevant: Hardware/VLSI/Research/JRF match";

    if (hasGenericSoftwareMatch && !hasHardwareMatch) {
      isRelevant = false;
      relevanceNote = "Irrelevant: Generic Software/Cloud/IT role";
    } else if (!hasHardwareMatch) {
      // Check if research / govt / apprentice
      if (opp.category === "jrf" || opp.category === "srf" || opp.category === "fellowship" || opp.category === "government") {
        isRelevant = true;
        relevanceNote = "Relevant: Government/Research Fellowship";
      } else {
        isRelevant = false;
        relevanceNote = "Irrelevant: No Hardware/VLSI/Electronics/Research signal";
      }
    }

    // 2. Specific Job vs Generic Portal Check
    const url = opp.apply_url || opp.source_url || "";
    let isSpecificPosting = false;
    let urlType = "Generic Portal";

    if (url.includes("/job/") || url.includes("/jobs/") || url.includes("/careers/") && url.split("/").length > 5 || url.includes("posting") || url.includes(".pdf") || url.includes("id=") || url.includes("gh_jid=") || url.includes("requisition") || url.includes("req_id") || url.includes("vacanc")) {
      isSpecificPosting = true;
      urlType = "Specific Vacancy URL";
    } else if (url.endsWith(".gov.in") || url.endsWith(".ac.in") || url.endsWith(".res.in") || url.endsWith("/careers") || url.endsWith("/careers/")) {
      urlType = "General Careers Portal";
      isSpecificPosting = false;
    }

    // 3. Availability & Deadline
    const today = new Date().toISOString().split("T")[0];
    const hasValidDeadline = !opp.deadline || opp.deadline >= today;
    const availabilityType = opp.deadline ? `Fixed (${opp.deadline})` : "Ongoing/Rolling";

    let verdict = "KEEP";
    let reason = "Verified Hardware/VLSI/Research opportunity with active vacancy";

    if (!isRelevant) {
      verdict = "REMOVE/QUARANTINE";
      reason = relevanceNote;
      toQuarantine.push(opp);
    } else if (!isSpecificPosting && !opp.deadline) {
      verdict = "MANUAL_REVIEW";
      reason = "Relevant, but apply URL points to general careers portal with ongoing status";
      manualReview.push(opp);
    } else {
      keepList.push(opp);
    }

    auditRows.push({
      idx: i + 1,
      id: opp.id,
      title: opp.title.slice(0, 32) + "...",
      category: opp.category,
      deadline: availabilityType,
      urlType,
      isRelevant,
      verdict,
      reason: reason.slice(0, 45) + "..."
    });
  }

  console.table(auditRows);

  console.log("\n============================================================");
  console.log("50-SAMPLE AUDIT SUMMARY");
  console.log("============================================================");
  console.log(`- KEEP (Genuinely Relevant + Specific Vacancy): ${keepList.length} (${((keepList.length/50)*100).toFixed(1)}%)`);
  console.log(`- MANUAL_REVIEW (Relevant but Generic Portal/Ongoing): ${manualReview.length} (${((manualReview.length/50)*100).toFixed(1)}%)`);
  console.log(`- REMOVE/QUARANTINE (Generic Software/Cloud/Irrelevant): ${toQuarantine.length} (${((toQuarantine.length/50)*100).toFixed(1)}%)`);

  return { keepList, manualReview, toQuarantine, totalActive: activeOpps.length };
}

auditRelevanceAndSpecificVacancy().catch(console.error);
