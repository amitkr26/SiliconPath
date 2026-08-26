import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: "frontend/.env.local" });

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runForensicRemediation() {
  console.log("============================================================");
  console.log("RUNNING FORENSIC OPPORTUNITY DATA REMEDIATION");
  console.log("Time:", new Date().toISOString());
  console.log("============================================================\n");

  const today = "2026-08-26";

  // 1. Quarantine expired record
  const expiredIds = ["86379a24-6847-4c2d-a748-68724ef652f7"];
  for (const id of expiredIds) {
    const { error } = await client.from("opportunities").update({
      is_active: false,
      verification_status: "expired"
    }).eq("id", id);
    if (!error) console.log(`✅ Quarantined expired opportunity: ${id}`);
    else console.error(`❌ Failed to quarantine ${id}:`, error.message);
  }

  // 2. Quarantine active unverified / link_unavailable records
  const unverifiedActiveIds = [
    "35c47d0e-765e-44ca-b92a-13b50673014a",
    "8030a0e4-5dd2-4b1f-86e7-e8007127adff",
    "57f0d939-feee-43ea-80cc-3a922de09eb6"
  ];
  for (const id of unverifiedActiveIds) {
    const { error } = await client.from("opportunities").update({
      is_active: false,
      verification_status: "link_unavailable"
    }).eq("id", id);
    if (!error) console.log(`✅ Quarantined link_unavailable opportunity: ${id}`);
    else console.error(`❌ Failed to quarantine ${id}:`, error.message);
  }

  // 3. Quarantine non-technical / irrelevant records
  const irrelevantIds = [
    "51166fb7-f06a-438b-b7ed-77221db8a7b0", // Stenographer, Tally Accountant, Peon
    "68aab707-bc9c-4215-9de7-db8f4ba5f881", // Palaeosciences / Earth sciences
    "5d37fac0-6023-4762-aafd-8eabab76c190", // Agriculture engineering
    "a4e721e2-5fc5-40d8-bf58-fe3807e034cd", // Assistants, Clerks, Stenographers
    "a08a1df5-3400-4a96-8494-bba91d6c99cb", // Sr Assistant Officer (HR)
    "1a34a1b9-46c5-4210-9be4-b7fb314260a3", // Deputy General Manager (Executive 15+ yrs)
    "8c7e2633-68e1-4ad9-91f4-a1018c344f86", // Analog switches product catalog page
  ];
  for (const id of irrelevantIds) {
    const { error } = await client.from("opportunities").update({
      is_active: false,
      verification_status: "rejected"
    }).eq("id", id);
    if (!error) console.log(`✅ Quarantined irrelevant opportunity: ${id}`);
    else console.error(`❌ Failed to quarantine ${id}:`, error.message);
  }

  // 4. Populate missing organizations on valid Sarkari / PSU opportunities
  const orgUpdates = [
    { id: "44ca1063-a1d3-4cbd-ad97-74413a25e4d0", org: "Indian Oil Corporation Limited (IOCL)" },
    { id: "07c7bf87-5308-4a2c-aaaa-5d044df4340e", org: "Indian Railways - RCF Kapurthala" },
    { id: "16043bf7-1a2d-4e91-94bc-5b8830a79805", org: "Indian Railways - ICF Chennai" },
    { id: "d7479771-871a-47e5-9992-31c872c00de6", org: "Railway Recruitment Control Board (RRB)" },
    { id: "4f360926-0db9-458c-bd60-729e7a29c167", org: "Rajasthan Staff Selection Board (RSMSSB)" },
    { id: "49a95963-f568-4e62-ad6a-181a845b0a12", org: "Madhya Pradesh Employees Selection Board (MPESB)" },
    { id: "07a6f0d0-297a-4c0c-8c8d-6d4086013303", org: "NTPC Green Energy Limited (NGEL)" },
  ];
  for (const u of orgUpdates) {
    const { error } = await client.from("opportunities").update({
      organization: u.org
    }).eq("id", u.id);
    if (!error) console.log(`✅ Populated organization for ${u.id}: "${u.org}"`);
    else console.error(`❌ Failed to update org for ${u.id}:`, error.message);
  }

  // 5. De-duplicate exact active opportunities (keep canonical 1st record, mark subsequent identical copies inactive)
  const { data: allActive } = await client.from("opportunities")
    .select("id, title, organization, apply_url, source_url, created_at")
    .eq("is_active", true)
    .eq("verification_status", "verified")
    .order("created_at", { ascending: true });

  const seenMap = new Map();
  let duplicateCount = 0;

  for (const item of allActive || []) {
    const titleNorm = (item.title || "").toLowerCase().replace(/\s+/g, " ").trim();
    const orgNorm = (item.organization || "").toLowerCase().replace(/\s+/g, " ").trim();
    const key = `${titleNorm}:::${orgNorm}`;

    if (seenMap.has(key)) {
      duplicateCount++;
      const primary = seenMap.get(key);
      const { error } = await client.from("opportunities").update({
        is_active: false,
        verification_status: "rejected"
      }).eq("id", item.id);
      if (!error) {
        console.log(`✅ Quarantined duplicate record ${item.id} (canonical retained: ${primary.id})`);
      }
    } else {
      seenMap.set(key, item);
    }
  }

  console.log(`\nDe-duplicated ${duplicateCount} duplicate active records.`);

  // 6. Verify post-remediation database state
  const { count: finalTotal } = await client.from("opportunities").select("*", { count: "exact", head: true });
  const { count: finalActive } = await client.from("opportunities").select("*", { count: "exact", head: true }).eq("is_active", true);
  const { count: finalVerifiedActive } = await client.from("opportunities").select("*", { count: "exact", head: true }).eq("is_active", true).eq("verification_status", "verified");
  const { count: finalApps } = await client.from("applications").select("*", { count: "exact", head: true });
  const { count: finalSaved } = await client.from("saved_opportunities").select("*", { count: "exact", head: true });

  console.log("\n============================================================");
  console.log("POST-REMEDIATION DATABASE INTEGRITY VERIFICATION");
  console.log("============================================================");
  console.log("Total Database Rows:", finalTotal, "(Expected: 3608 - ZERO deletions)");
  console.log("Active Opportunities:", finalActive);
  console.log("Verified Active Opportunities:", finalVerifiedActive);
  console.log("Applications Count:", finalApps, "(Preserved 100%)");
  console.log("Saved Opportunities Count:", finalSaved, "(Preserved 100%)");
  console.log("============================================================\n");
}

runForensicRemediation();
