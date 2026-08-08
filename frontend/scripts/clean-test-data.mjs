import { supabaseAdmin } from "../frontend/src/lib/supabase.js";

async function findAndCleanTestData() {
  console.log("=== STEP 2: QUERYING PRODUCTION OPPORTUNITIES TABLE FOR TEST DATA ===");

  // 1. Fetch all opportunities to inspect
  const { data: allOps, error } = await supabaseAdmin
    .from("opportunities")
    .select("id, title, organization, category, stipend, location, apply_link, is_active, created_at");

  if (error) {
    console.error("Error fetching opportunities:", error);
    return;
  }

  console.log(`Total opportunities in database: ${allOps.length}`);

  // 2. Identify test / fake entries
  const testEntries = allOps.filter((op) => {
    const title = (op.title || "").toLowerCase();
    const org = (op.organization || "").toLowerCase();
    const stipend = (op.stipend || "").toLowerCase();
    const applyLink = (op.apply_link || "").toLowerCase();

    const isTestTitle =
      title.includes("test") ||
      title.includes("qa") ||
      title.includes("audit") ||
      title.includes("lead risc-v soc architect") ||
      title.includes("senior asic verification engineer");

    const isTestOrg = org.includes("test") || org.includes("qualcomm vlsi lab");
    const isFakeStipend =
      stipend.includes("1,80,00,000") ||
      stipend.includes("24,000,000") ||
      stipend.includes("22,00,000") ||
      stipend.includes("18,00,000");
    const isSelfApplyLink = applyLink === "https://berojgardegreewala.vercel.app" || applyLink === "https://berojgardegreewala.vercel.app/";

    return isTestTitle || isTestOrg || isFakeStipend || isSelfApplyLink;
  });

  console.log("\n=== TEST ENTRIES IDENTIFIED FOR DELETION ===");
  console.log(JSON.stringify(testEntries, null, 2));

  if (testEntries.length === 0) {
    console.log("\nNo test entries found in database.");
    return;
  }

  // 3. Delete identified test entries
  const idsToDelete = testEntries.map((e) => e.id);
  console.log(`\nDeleting ${idsToDelete.length} test opportunities with IDs:`, idsToDelete);

  const { data: deletedData, error: deleteError } = await supabaseAdmin
    .from("opportunities")
    .delete()
    .in("id", idsToDelete)
    .select();

  if (deleteError) {
    console.error("Error deleting test opportunities:", deleteError);
  } else {
    console.log("\n=== SUCCESSFULLY DELETED TEST ENTRIES ===");
    console.log(`Successfully deleted ${deletedData ? deletedData.length : idsToDelete.length} records.`);
  }

  // 4. Verify after deletion
  const { data: remainingOps } = await supabaseAdmin
    .from("opportunities")
    .select("id, title, organization, stipend, apply_link");

  console.log(`\nRemaining verified opportunities count in database: ${remainingOps ? remainingOps.length : 'N/A'}`);
}

findAndCleanTestData();
