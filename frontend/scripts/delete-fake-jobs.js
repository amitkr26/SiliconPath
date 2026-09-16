const { createClient } = require("@supabase/supabase-js");

// Credentials come from frontend/.env.local (never commit keys).
const fs = require("fs");
const path = require("path");
const env = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8")
  .split("\n").reduce((a, l) => { const m = l.match(/^([A-Z_]+)=(.*)/); if (m) a[m[1]] = m[2].trim(); return a; }, {});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function cleanFakeTestPostings() {
  console.log("=== STEP 2: QUERYING PRODUCTION OPPORTUNITIES FOR FAKE/TEST DATA ===");

  const { data: ops, error } = await supabase
    .from("opportunities")
    .select("*");

  if (error) {
    console.error("Error querying opportunities:", error);
    return;
  }

  console.log(`Total opportunities fetched: ${ops.length}`);

  // Find all test/fake postings:
  // 1. "Lead RISC-V SoC Architect (QA Audit Test)"
  // 2. Unrealistic salary/stipend (e.g. ₹18,000,000 / ₹24,000,000 or ₹1,80,00,000)
  // 3. "Senior ASIC Verification Engineer (UVM)" at "Qualcomm VLSI Lab"
  // 4. "Senior Physical Design Engineer (STA)" at "Semiconductor Lab Test"
  // 5. Any entry with apply_link pointing back to platform homepage
  // 6. Any entry with "QA Audit", "UI Verified", or test organization
  const fakeEntries = ops.filter((op) => {
    const title = (op.title || "").toLowerCase();
    const org = (op.organization || "").toLowerCase();
    const applyUrl = (op.apply_url || op.apply_link || "").toLowerCase();
    const desc = (op.description || "").toLowerCase();
    const fullStr = JSON.stringify(op).toLowerCase();

    const isTestTitle =
      title.includes("qa audit test") ||
      title.includes("lead risc-v soc architect") ||
      title.includes("senior asic verification engineer (uvm)") ||
      title.includes("senior physical design engineer (sta)") ||
      title.includes("ui verified") ||
      title.includes("test position") ||
      title.includes("test job");

    const isTestOrg =
      org.includes("qualcomm vlsi lab") ||
      org.includes("semiconductor lab test") ||
      org.includes("qa test");

    const isFakeSalary =
      fullStr.includes("1,80,00,000") ||
      fullStr.includes("2,40,00,000") ||
      fullStr.includes("24,000,000") ||
      fullStr.includes("18,000,000") ||
      fullStr.includes("22,00,000");

    const isSelfLink =
      applyUrl === "https://siliconpath.in" ||
      applyUrl === "https://siliconpath.in/" ||
      applyUrl === "http://localhost:3000";

    return isTestTitle || isTestOrg || isFakeSalary || isSelfLink;
  });

  console.log(`\nFound ${fakeEntries.length} fake/test opportunities to delete:`);
  for (const entry of fakeEntries) {
    console.log(`\n======================================================`);
    console.log(`ID: ${entry.id}`);
    console.log(`Title: ${entry.title}`);
    console.log(`Organization: ${entry.organization}`);
    console.log(`Category: ${entry.category}`);
    console.log(`Location: ${entry.location}`);
    console.log(`Apply URL: ${entry.apply_url || entry.apply_link}`);
    console.log(`Created At: ${entry.created_at}`);
    console.log(`Raw Record:`, JSON.stringify(entry, null, 2));
  }

  if (fakeEntries.length === 0) {
    console.log("\nNo fake/test entries found!");
    return;
  }

  const ids = fakeEntries.map((e) => e.id);
  console.log(`\nExecuting hard deletion of ${ids.length} records from Supabase...`);

  const { data: deletedData, error: deleteError } = await supabase
    .from("opportunities")
    .delete()
    .in("id", ids)
    .select();

  if (deleteError) {
    console.error("Deletion Error:", deleteError);
  } else {
    console.log(`\nSUCCESSFULLY DELETED ${deletedData ? deletedData.length : ids.length} RECORDS.`);
    console.log("Deleted IDs:", ids);
  }

  // Re-verify after deletion
  const { data: remaining } = await supabase
    .from("opportunities")
    .select("id, title, organization, apply_url, created_at");

  console.log(`\n=== REMAINING VERIFIED OPPORTUNITIES: ${remaining.length} ===`);
}

cleanFakeTestPostings();
