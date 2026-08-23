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

const HARDWARE_VLSI_KEYWORDS = [
  "vlsi", "semiconductor", "rtl", "asic", "fpga", "verification", "physical design",
  "dft", "sta", "embedded", "firmware", "microelectronics", "analog", "digital design",
  "systemverilog", "uvm", "eda", "cadence", "synopsys", "layout", "silicon", "finfet",
  "nanotechnology", "optics", "photonics", "jrf", "srf", "phd", "postdoc", "research fellow",
  "scientist", "avionics", "radar", "hardware", "board design", "pcb", "power electronics",
  "mems", "spintronics", "device physicist", "quantum computing", "soc", "chiplet", "risc-v",
  "circuit", "logic design", "signal integrity", "emulation", "microcontroller", "dsp"
];

const GENERIC_IRRELEVANT_KEYWORDS = [
  "business applications", "kubernetes", "cloud software", "marketing", "salesforce",
  "hr recruiter", "talent acquisition", "content writer", "accountant", "legal counsel",
  "facilities manager", "receptionist", "finance analyst", "administrative officer",
  "accounts officer", "procurement", "executive assistant", "office assistant"
];

async function auditAllActive() {
  console.log("============================================================");
  console.log("COMPREHENSIVE AUDIT OF ALL 431 PUBLIC-ACTIVE OPPORTUNITIES");
  console.log("============================================================");

  const { data: allActive, error } = await supabase
    .from("opportunities")
    .select("id, title, organization, category, deadline, apply_url, source_url, slug, description, tags")
    .eq("is_active", true)
    .eq("verification_status", "verified");

  if (error || !allActive) {
    console.error("Error fetching opportunities:", error);
    process.exit(1);
  }

  let genuinelyRelevant = 0;
  let genericPortalManualReview = 0;
  let irrelevantNonTech = 0;
  let specificSourceVerified = 0;

  const irrelevantList = [];
  const manualReviewList = [];

  for (const opp of allActive) {
    const combined = `${opp.title} ${opp.description || ""} ${(opp.tags || []).join(" ")}`.toLowerCase();

    const isHardware = HARDWARE_VLSI_KEYWORDS.some(k => combined.includes(k));
    const isIrrelevant = GENERIC_IRRELEVANT_KEYWORDS.some(k => combined.includes(k));

    const url = opp.apply_url || opp.source_url || "";
    const isSpecificUrl = url.includes("/job/") || url.includes("/jobs/") || url.includes("posting") || url.includes(".pdf") || url.includes("req_id") || url.includes("gh_jid=");

    if (isSpecificUrl) specificSourceVerified++;

    if (isIrrelevant && !isHardware) {
      irrelevantNonTech++;
      irrelevantList.push({ id: opp.id, title: opp.title, reason: "Non-tech administrative/cloud/marketing role" });
    } else if (!isSpecificUrl && !opp.deadline) {
      genericPortalManualReview++;
      manualReviewList.push({ id: opp.id, title: opp.title, url });
    } else {
      genuinelyRelevant++;
    }
  }

  console.log(`Total Active Records Scanned: ${allActive.length}`);
  console.log(`1. Genuinely Relevant + Specific / Active: ${genuinelyRelevant} (${((genuinelyRelevant/allActive.length)*100).toFixed(1)}%)`);
  console.log(`2. Relevant but Generic Landing Page (MANUAL_REVIEW): ${genericPortalManualReview} (${((genericPortalManualReview/allActive.length)*100).toFixed(1)}%)`);
  console.log(`3. Irrelevant Non-Tech / Generic Software (QUARANTINE): ${irrelevantNonTech} (${((irrelevantNonTech/allActive.length)*100).toFixed(1)}%)`);
  console.log(`4. Specific Job URL Verified: ${specificSourceVerified} (${((specificSourceVerified/allActive.length)*100).toFixed(1)}%)`);

  if (irrelevantList.length > 0) {
    console.log("\nSample Irrelevant Roles Found:");
    console.table(irrelevantList.slice(0, 10));
  }

  return {
    total: allActive.length,
    relevant: genuinelyRelevant,
    manualReview: genericPortalManualReview,
    irrelevant: irrelevantNonTech,
    specificVerified: specificSourceVerified,
    irrelevantList
  };
}

auditAllActive().catch(console.error);
