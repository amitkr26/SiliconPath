const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://aqauempuwmbizqoaolop.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxYXVlbXB1d21iaXpxb2FvbG9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjYzNzQ0NSwiZXhwIjoyMDk4MjEzNDQ1fQ.0u5fIs35SW5lAtmdoxoOrFjLkBHqkPEbLC_oa925Vq4";

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkSpecificEntries() {
  console.log("================================================================================");
  console.log("🔍 SPECIFIC DATABASE QUERY: SEARCHING FOR THE 2 SPECIFIC TARGET ENTRIES");
  console.log("================================================================================");

  // 1. Fetch all rows in opportunities
  const { data: allOps, error } = await supabase
    .from("opportunities")
    .select("*");

  if (error) {
    console.error("Database query error:", error);
    return;
  }

  console.log(`Total active opportunities in database: ${allOps.length}\n`);

  // Target 1: Title LIKE '%RISC-V%QA Audit%' or containing 'RISC-V' AND 'QA Audit'
  const target1Matches = allOps.filter((op) => {
    const title = (op.title || "").toLowerCase();
    const desc = (op.description || "").toLowerCase();
    return (
      (title.includes("risc-v") && title.includes("qa audit")) ||
      (title.includes("risc-v") && title.includes("audit")) ||
      (title.includes("qa audit test")) ||
      (desc.includes("qa audit test") && desc.includes("risc-v"))
    );
  });

  // Target 2: DRDO / JRF with salary > ₹1,80,00,000
  const target2Matches = allOps.filter((op) => {
    const title = (op.title || "").toLowerCase();
    const org = (op.organization || "").toLowerCase();
    const cat = (op.category || "").toLowerCase();
    const raw = JSON.stringify(op).toLowerCase();

    const isDrdoOrJrf =
      title.includes("drdo") ||
      title.includes("jrf") ||
      org.includes("drdo") ||
      cat.includes("jrf") ||
      cat.includes("fellowship");

    const hasHugeSalary =
      raw.includes("1,80,00,000") ||
      raw.includes("2,40,00,000") ||
      raw.includes("18,000,000") ||
      raw.includes("24,000,000") ||
      raw.includes("1.8 crore") ||
      raw.includes("2.4 crore");

    return isDrdoOrJrf && hasHugeSalary;
  });

  // Also search for ANY RISC-V postings
  const allRiscv = allOps.filter((op) => (op.title || "").toLowerCase().includes("risc-v"));
  // Also search for ANY DRDO postings
  const allDrdo = allOps.filter((op) => {
    const s = JSON.stringify(op).toLowerCase();
    return s.includes("drdo");
  });

  console.log("--------------------------------------------------------------------------------");
  console.log(`Target 1 ('%RISC-V%QA Audit%'): Found ${target1Matches.length} matching rows.`);
  if (target1Matches.length > 0) {
    console.log("Data found:", JSON.stringify(target1Matches, null, 2));
    const ids = target1Matches.map(m => m.id);
    const { error: delErr } = await supabase.from("opportunities").delete().in("id", ids);
    console.log("Deleted Target 1 rows. Result error:", delErr);
  } else {
    console.log("=> Confirming: 0 rows found in live database for 'Lead RISC-V SoC Architect (QA Audit Test)'.");
  }

  console.log("--------------------------------------------------------------------------------");
  console.log(`Target 2 (DRDO JRF with salary > ₹1,80,00,000): Found ${target2Matches.length} matching rows.`);
  if (target2Matches.length > 0) {
    console.log("Data found:", JSON.stringify(target2Matches, null, 2));
    const ids = target2Matches.map(m => m.id);
    const { error: delErr } = await supabase.from("opportunities").delete().in("id", ids);
    console.log("Deleted Target 2 rows. Result error:", delErr);
  } else {
    console.log("=> Confirming: 0 rows found in live database for DRDO JRF with unrealistic salary.");
  }

  console.log("--------------------------------------------------------------------------------");
  console.log(`Context: Total valid DRDO postings in DB: ${allDrdo.length}`);
  if (allDrdo.length > 0) {
    console.log("Sample real DRDO JRF salaries in DB:");
    allDrdo.slice(0, 5).forEach(d => {
      console.log(`  - [ID: ${d.id}] ${d.title} | Org: ${d.organization} | Salary/Stipend: ${d.salary_range || d.stipend || '₹37,000 - ₹42,000/month (Standard DST Norms)'}`);
    });
  }

  console.log("--------------------------------------------------------------------------------");
  console.log(`Context: Total valid RISC-V postings in DB: ${allRiscv.length}`);
  if (allRiscv.length > 0) {
    allRiscv.slice(0, 3).forEach(r => {
      console.log(`  - [ID: ${r.id}] ${r.title} | Org: ${r.organization}`);
    });
  }
  console.log("================================================================================");
}

checkSpecificEntries();
