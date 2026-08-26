import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: "frontend/.env.local" });

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runForensicRefinement() {
  console.log("============================================================");
  console.log("RUNNING TARGETED FORENSIC QUALITY REFINEMENT");
  console.log("============================================================\n");

  // 1. Quarantine expired/irrelevant opportunities identified in deep audit
  const toQuarantine = [
    // Expired
    { id: "4f4f1e5b-2dc1-4e70-b5d6-a263933f68ff", status: "expired" }, // CSIR CMERI [Last date: 03/08/2026]
    // Non-technical / non-semiconductor JRFs
    { id: "956ee303-786f-4619-9737-11b2842cc890", status: "rejected" }, // Hydraulic & Water Resources Civil JRF
    { id: "ab9410a4-f162-4ee7-818a-513623a09880", status: "rejected" }, // Environmental Engineering Civil JRF
    { id: "34a39024-3f8c-4180-9995-16d05b17581c", status: "rejected" }, // Indie Cinema / Filmmakers JRF
    { id: "07b8eb85-d2ab-4c86-abf6-bffa17dab534", status: "rejected" }, // Tissue growth Biology JRF
    { id: "f719bd1f-3a2b-4b44-a506-9347fc4a97dc", status: "rejected" }, // Indic Architecture Heritage JRF
    { id: "e7e182eb-a5d2-491d-baa6-ab5a6f17b0bd", status: "rejected" }, // Design Solution Forum event
    // Duplicate internship
    { id: "b11b8d9f-5fe6-4a89-874a-cfacb03442b7", status: "rejected" }, // Duplicate ISTRAC apprentice
  ];

  for (const item of toQuarantine) {
    const { error } = await client.from("opportunities").update({
      is_active: false,
      verification_status: item.status
    }).eq("id", item.id);
    if (!error) console.log(`✅ Quarantined opportunity ${item.id} with status '${item.status}'`);
    else console.error(`❌ Failed to quarantine ${item.id}:`, error.message);
  }

  // 2. Align misclassified category for 4 industry roles previously tagged as fellowship
  const misclassifiedIndustryRoles = [
    "8150dbcd-5d76-4f25-82f8-1135f77ff297", // Physical Design Engineer
    "37c7cff4-1c03-4685-b61e-bdc0788ed875", // Analog & Mixed-Signal IC Layout Engineer
    "7b71ca76-5f35-4cbc-b26e-4d2f809b0809", // Design Verification Engineer
    "eb0f29fa-63e0-41c5-a1e1-4864e6b534a8", // RTL Design Engineer
  ];
  for (const id of misclassifiedIndustryRoles) {
    const { error } = await client.from("opportunities").update({
      category: "industry"
    }).eq("id", id);
    if (!error) console.log(`✅ Aligned category to 'industry' for ${id}`);
    else console.error(`❌ Failed to update category for ${id}:`, error.message);
  }

  // 3. Populate missing organization names on Government & JRF records
  const orgUpdates = [
    { id: "d4770fd4-88c9-407b-8961-7caa969fea76", org: "ISRO - SDSC SHAR" },
    { id: "6f2764cc-b43d-4e64-bc34-6724fb873b78", org: "ISRO Centralised Recruitment Board (ICRB)" },
    { id: "2712a0e0-cf88-4453-8544-ea47f8ad7da6", org: "Bhabha Atomic Research Centre (BARC)" },
    { id: "e5ef2a2e-7d47-4835-aea8-f63a2978a450", org: "DRDO CEPTAM" },
    { id: "9b4543a8-1e5b-4be0-9b21-cfd8671c9ea1", org: "ISRO - ISTRAC Bengaluru" },
    { id: "3d7f5d55-a907-47e5-8dc0-edb4660c34b0", org: "IIT Hyderabad" },
    { id: "8bb4e849-4200-4dfc-85f3-7769873c5df1", org: "IIT Hyderabad" },
    { id: "a1d04145-dddd-4747-8ac5-707798c39283", org: "IIT Hyderabad" },
    { id: "b5adf751-c98f-428c-b6a6-492fd47ac835", org: "IIT Hyderabad" },
    { id: "cc91cfbd-3ddd-4b02-a27b-2c094e0a826e", org: "IIT Hyderabad" },
    { id: "cf5475a2-0727-4840-813f-081edfa01be4", org: "IIT Hyderabad" },
    { id: "3022339d-74a5-47d5-ac67-634454496cc4", org: "IIT Hyderabad" },
    { id: "681c5cbf-9073-46c0-af34-ef48317464cd", org: "IIT Hyderabad" },
    { id: "0173e520-4310-40c4-b107-9b3d1c744767", org: "IIT Hyderabad" },
    { id: "8643e8ca-e58b-4dc8-aca8-f5338ddd69c4", org: "IIT Hyderabad" },
    { id: "7de650bd-79a1-4a55-9a23-d770ffb1c299", org: "IIT Hyderabad" },
    { id: "32771fc5-1a6c-40a1-8494-f1a4c467fbb1", org: "IIT Hyderabad" },
    { id: "62394e53-182d-4ef2-a383-80fbeb6ed61c", org: "IIT Hyderabad" },
    { id: "29ef1f71-2ae6-4f9f-b0b0-a2955a1d9880", org: "IIT Hyderabad" },
    { id: "8cdbda19-41d8-4ea9-89e1-4f0d80c47084", org: "IIT Hyderabad" },
    { id: "4c2bca70-3799-4066-89d4-0f7dc2c4bb19", org: "IIT Hyderabad" },
    { id: "f01c680b-9939-4caf-a5e9-5f582872e0cc", org: "IIT Hyderabad" },
    { id: "812df6ad-1c50-46bc-a045-7d58c36a1f20", org: "IIT Hyderabad" },
    { id: "ebf702de-d2c0-4b26-8367-83111b3bc378", org: "IIT Hyderabad" },
    { id: "8175d11d-8a1d-486e-b228-e8c1928c9770", org: "IIT Hyderabad" },
    { id: "4c3a318e-8d83-4ccf-a3fb-04987480ad09", org: "IIIT Hyderabad" },
    { id: "be32896f-6259-48c6-9c91-fee9445853de", org: "IIIT Hyderabad" },
    { id: "0e2be0bc-51b5-4d5a-9879-b92ca70339d9", org: "IIIT Hyderabad" },
    { id: "c7b79f13-84af-4cf1-b887-6c2daa8b3fb8", org: "IIIT Hyderabad - CVEST" },
    { id: "568d1845-c6ed-415d-80aa-45df287d4b5d", org: "DRDO - CFEES Delhi" },
    { id: "1121467e-cb3d-48c0-9665-a065601bb038", org: "CSIR - CEERI Pilani" },
    { id: "fea09325-413d-4bd5-8dd5-51b5eede014d", org: "IIIT Hyderabad" },
    { id: "1b8e0f16-3748-4b35-b534-28d51e68aee3", org: "ISRO - URSC Bengaluru" },
  ];

  for (const u of orgUpdates) {
    const { error } = await client.from("opportunities").update({
      organization: u.org
    }).eq("id", u.id);
    if (!error) console.log(`✅ Populated organization for ${u.id}: "${u.org}"`);
    else console.error(`❌ Failed to update org for ${u.id}:`, error.message);
  }

  // 4. Final Verification
  const { count: finalTotal } = await client.from("opportunities").select("*", { count: "exact", head: true });
  const { count: finalActiveVerified } = await client.from("opportunities").select("*", { count: "exact", head: true }).eq("is_active", true).eq("verification_status", "verified");

  console.log("\n============================================================");
  console.log("FINAL POST-REFINEMENT AUDIT STATS");
  console.log("============================================================");
  console.log("Total DB Opportunities:", finalTotal, "(ZERO records deleted)");
  console.log("Active Verified Opportunities:", finalActiveVerified);
  console.log("============================================================\n");
}

runForensicRefinement();
