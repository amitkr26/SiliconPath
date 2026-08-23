import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://aqauempuwmbizqoaolop.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxYXVlbXB1d21iaXpxb2FvbG9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjYzNzQ0NSwiZXhwIjoyMDk4MjEzNDQ1fQ.0u5fIs35SW5lAtmdoxoOrFjLkBHqkPEbLC_oa925Vq4";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TODAY_IST = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD in IST

// Semiconductor & Research relevance terms
const RELEVANT_TERMS = [
  "vlsi", "rtl", "asic", "fpga", "verification", "systemverilog", "uvm",
  "physical design", "dft", "analog", "mixed signal", "semiconductor",
  "embedded", "firmware", "hardware", "microelectronics", "eda", "chip",
  "fabrication", "cleanroom", "research", "jrf", "srf", "phd", "fellowship",
  "drdo", "isro", "iit", "csir", "cdac", "bel", "scientist", "intern",
  "postdoc", "cadence", "synopsys", "verilog", "sta", "timing", "layout",
  "rfic", "photonics", "nanotechnology", "soc", "risc-v", "arm", "silicon",
  "signal processing", "electronics", "circuit", "wafer", "device", "sens"
];

const IRRELEVANT_TITLES = [
  /sales\s+(manager|executive|rep|associate)/i,
  /business\s+development/i,
  /real\s+estate/i,
  /marketing\s+(manager|executive|lead)/i,
  /digital\s+marketing/i,
  /seo\s+(specialist|expert)/i,
  /accountant|accounts\s+payable|tax\s+consultant/i,
  /hr\s+generalist|talent\s+acquisition\s+specialist|recruiter/i,
  /nursing|nurse|doctor|medical\s+officer|pharmacist/i,
  /hotel|cook|chef|waiter|hospitality/i,
  /legal\s+counsel|advocate|lawyer/i,
  /driver|security\s+guard|housekeeping/i,
  /content\s+writer|copywriter/i,
  /customer\s+support|call\s+center|telecaller/i,
];

const DISPLAY_GARBAGE_TITLES = [
  /^(home|contact|sitemap|about|privacy|terms|login|sign in|register|apply now|download|click here|read more|view all|payment gateway|at a glance|departments|reference designs|quick links|useful links|important links|all rights reserved|copyright|disclaimer|help|faq|search|breadcrumb|news & events|photo gallery|tender|archive|annual report|right to information|overview|scholarships & funding|academic positions|position paper archive)$/i,
  /^untitled/i,
  /^test(\s+job|\s+opportunity)?$/i,
  /^sample(\s+job)?$/i,
];

async function runDeepAudit() {
  console.log(`[${new Date().toISOString()}] 🔍 Starting Deep Opportunity Audit on Live Supabase...`);
  console.log(`[${new Date().toISOString()}] 📅 Today IST: ${TODAY_IST}`);

  // 1. Fetch All Opportunities in batches
  let allOpportunities = [];
  let from = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, from + batchSize - 1);

    if (error) {
      console.error("Error fetching opportunities:", error);
      process.exit(1);
    }

    allOpportunities.push(...data);
    if (data.length < batchSize) {
      hasMore = false;
    } else {
      from += batchSize;
    }
  }

  console.log(`[${new Date().toISOString()}] ✅ Total Opportunities fetched: ${allOpportunities.length}`);

  // 2. Fetch Foreign Key references (applications, saved_opportunities)
  const { data: applications, error: appErr } = await supabase
    .from("applications")
    .select("id, opportunity_id, user_id, status");

  const appMap = new Map();
  if (applications) {
    for (const app of applications) {
      if (!appMap.has(app.opportunity_id)) appMap.set(app.opportunity_id, []);
      appMap.get(app.opportunity_id).push(app);
    }
  }
  console.log(`[${new Date().toISOString()}] 📋 Total Applications in DB: ${applications ? applications.length : 0} (covering ${appMap.size} distinct opportunities)`);

  const { data: savedOpps, error: savedErr } = await supabase
    .from("saved_opportunities")
    .select("id, opportunity_id, user_id");

  const savedMap = new Map();
  if (savedOpps) {
    for (const s of savedOpps) {
      if (!savedMap.has(s.opportunity_id)) savedMap.set(s.opportunity_id, []);
      savedMap.get(s.opportunity_id).push(s);
    }
  }
  console.log(`[${new Date().toISOString()}] 💾 Total Saved Opportunities in DB: ${savedOpps ? savedOpps.length : 0} (covering ${savedMap.size} distinct opportunities)`);

  // 3. Fetch Organizations
  const { data: orgs } = await supabase.from("organizations").select("id, name, slug, domain, is_verified");
  const orgMap = new Map();
  if (orgs) {
    for (const o of orgs) {
      orgMap.set(o.id, o);
    }
  }

  // 4. Run Forensic Classification
  const categories = {
    TOTAL: allOpportunities.length,
    ACTIVE: 0,
    INACTIVE: 0,
    VERIFIED: 0,
    PENDING: 0,
    REJECTED: 0,
    EXPIRED: 0,
    LINK_UNAVAILABLE: 0,
    EXPIRED_BY_DEADLINE: 0,
    FUTURE_DEADLINE: 0,
    MISSING_DEADLINE: 0,
    INVALID_DEADLINE: 0,
    DUPLICATES: 0,
    MISSING_APPLY_URL: 0,
    INVALID_APPLY_URL: 0,
    STALE: 0,
    POTENTIALLY_FAKE: 0,
    IRRELEVANT: 0,
    CURRENT_VALID: 0,
  };

  const classifications = {
    A_KEEP_VERIFIED: [],
    B_KEEP_OPEN_ENDED: [],
    C_EXPIRED: [],
    D_CLOSED_UNAVAILABLE: [],
    E_UNVERIFIED_PENDING: [],
    F_FAKE_SUSPICIOUS: [],
    G_IRRELEVANT: [],
    H_DUPLICATE: [],
    I_INVALID_DATA: [],
    J_STALE_UNKNOWN: [],
    K_MANUAL_REVIEW: [],
  };

  const urlSeen = new Map();
  const titleOrgSeen = new Map();

  for (const opp of allOpportunities) {
    const id = opp.id;
    const title = (opp.title || "").trim();
    const orgName = (opp.organization || "").trim();
    const cat = (opp.category || "").toLowerCase();
    const applyUrl = (opp.apply_url || opp.apply_link || opp.source_url || "").trim();
    const sourceUrl = (opp.source_url || "").trim();
    const deadline = opp.deadline;
    const status = opp.verification_status || "unverified";
    const isActive = opp.is_active === true;
    const hasApps = appMap.has(id);
    const hasSaved = savedMap.has(id);

    // Baseline counts
    if (isActive) categories.ACTIVE++; else categories.INACTIVE++;
    if (status === "verified") categories.VERIFIED++;
    else if (status === "pending") categories.PENDING++;
    else if (status === "rejected") categories.REJECTED++;
    else if (status === "expired") categories.EXPIRED++;
    else if (status === "link_unavailable") categories.LINK_UNAVAILABLE++;

    // Deadline check
    let isExpiredDeadline = false;
    let isFutureDeadline = false;
    let isMissingDeadline = false;
    let isInvalidDeadline = false;

    if (!deadline) {
      isMissingDeadline = true;
      categories.MISSING_DEADLINE++;
    } else {
      const dMatch = deadline.match(/^\d{4}-\d{2}-\d{2}/);
      if (!dMatch || isNaN(new Date(deadline).getTime())) {
        isInvalidDeadline = true;
        categories.INVALID_DEADLINE++;
      } else {
        const dStr = dMatch[0];
        if (dStr < TODAY_IST) {
          isExpiredDeadline = true;
          categories.EXPIRED_BY_DEADLINE++;
        } else {
          isFutureDeadline = true;
          categories.FUTURE_DEADLINE++;
        }
      }
    }

    // Apply URL check
    let isMissingApplyUrl = false;
    let isInvalidApplyUrl = false;

    if (!applyUrl || applyUrl === "#" || applyUrl === "null" || applyUrl.length < 5) {
      isMissingApplyUrl = true;
      categories.MISSING_APPLY_URL++;
    } else if (
      !applyUrl.startsWith("http://") &&
      !applyUrl.startsWith("https://") &&
      !applyUrl.startsWith("mailto:")
    ) {
      isInvalidApplyUrl = true;
      categories.INVALID_APPLY_URL++;
    }

    // Title Garbage Check
    let isGarbageTitle = false;
    if (title.length < 4 || DISPLAY_GARBAGE_TITLES.some((rx) => rx.test(title))) {
      isGarbageTitle = true;
    }

    // Irrelevance Check
    let isIrrelevant = false;
    if (IRRELEVANT_TITLES.some((rx) => rx.test(title))) {
      isIrrelevant = true;
      categories.IRRELEVANT++;
    }

    // Fake / Placeholder Check
    let isFakeSuspicious = false;
    let fakeReason = "";
    if (
      applyUrl.includes("example.com") ||
      applyUrl.includes("test.com") ||
      applyUrl.includes("localhost") ||
      applyUrl.includes("placeholder")
    ) {
      isFakeSuspicious = true;
      fakeReason = "Placeholder test domain in apply_url";
    } else if (title.toLowerCase().includes("lorem ipsum") || title.toLowerCase().includes("asdf")) {
      isFakeSuspicious = true;
      fakeReason = "Synthetic lorem ipsum in job title";
    }

    if (isFakeSuspicious) categories.POTENTIALLY_FAKE++;

    // Duplicate Check
    let isDuplicate = false;
    let canonicalId = null;
    const normUrl = applyUrl.toLowerCase().split("?")[0].replace(/\/+$/, "");
    const normTitleOrg = `${title.toLowerCase().trim()}_${orgName.toLowerCase().trim()}`;

    if (normUrl && normUrl.length > 15 && urlSeen.has(normUrl)) {
      isDuplicate = true;
      canonicalId = urlSeen.get(normUrl);
      categories.DUPLICATES++;
    } else if (normTitleOrg.length > 10 && titleOrgSeen.has(normTitleOrg)) {
      isDuplicate = true;
      canonicalId = titleOrgSeen.get(normTitleOrg);
      categories.DUPLICATES++;
    } else {
      if (normUrl && normUrl.length > 15) urlSeen.set(normUrl, id);
      if (normTitleOrg.length > 10) titleOrgSeen.set(normTitleOrg, id);
    }

    // CLASSIFICATION LOGIC
    const recordMeta = {
      id,
      title,
      organization: orgName,
      category: cat,
      deadline,
      apply_url: applyUrl,
      source_url: sourceUrl,
      verification_status: status,
      is_active: isActive,
      has_applications: hasApps,
      has_saved: hasSaved,
      applications_count: hasApps ? appMap.get(id).length : 0,
    };

    if (isGarbageTitle || isInvalidApplyUrl || isMissingApplyUrl) {
      classifications.I_INVALID_DATA.push({ ...recordMeta, reason: "Garbage title or invalid/missing application URL" });
    } else if (isFakeSuspicious) {
      classifications.F_FAKE_SUSPICIOUS.push({ ...recordMeta, reason: fakeReason });
    } else if (isIrrelevant) {
      classifications.G_IRRELEVANT.push({ ...recordMeta, reason: "Non-semiconductor/VLSI/research domain" });
    } else if (isDuplicate) {
      classifications.H_DUPLICATE.push({ ...recordMeta, reason: `Duplicate of ${canonicalId}` });
    } else if (isExpiredDeadline || status === "expired") {
      classifications.C_EXPIRED.push({ ...recordMeta, reason: `Deadline passed (${deadline})` });
    } else if (status === "rejected") {
      classifications.D_CLOSED_UNAVAILABLE.push({ ...recordMeta, reason: "Rejected during moderation" });
    } else if (status === "link_unavailable") {
      classifications.D_CLOSED_UNAVAILABLE.push({ ...recordMeta, reason: "Application link broken/unavailable" });
    } else if (status === "pending") {
      classifications.E_UNVERIFIED_PENDING.push({ ...recordMeta, reason: "Scraped circular pending verification" });
    } else if (isFutureDeadline && status === "verified") {
      classifications.A_KEEP_VERIFIED.push({ ...recordMeta, reason: "Verified circular with active future deadline" });
      categories.CURRENT_VALID++;
    } else if (isMissingDeadline && status === "verified") {
      // Check if it's an industry job or fellowship
      const isIndustryJob = cat === "job" || cat === "private" || cat === "industry" || cat.includes("engineer");
      if (isIndustryJob) {
        classifications.B_KEEP_OPEN_ENDED.push({ ...recordMeta, reason: "Verified open-ended semiconductor industry hiring" });
        categories.CURRENT_VALID++;
      } else {
        // Research fellowships without deadlines are usually continuous recruitment
        classifications.A_KEEP_VERIFIED.push({ ...recordMeta, reason: "Verified continuous fellowship/research listing" });
        categories.CURRENT_VALID++;
      }
    } else {
      classifications.K_MANUAL_REVIEW.push({ ...recordMeta, reason: `Uncertain status: ${status}, deadline: ${deadline}` });
    }
  }

  console.log("\n==================================================");
  console.log("DATABASE BASELINE AUDIT SUMMARY");
  console.log("==================================================");
  for (const [k, v] of Object.entries(categories)) {
    console.log(`${k.padEnd(25)}: ${v}`);
  }

  console.log("\n==================================================");
  console.log("CLASSIFICATION BREAKDOWN");
  console.log("==================================================");
  for (const [k, v] of Object.entries(classifications)) {
    console.log(`${k.padEnd(25)}: ${v.length}`);
  }

  // Ensure output directory exists
  const outDir = path.resolve("project-bible/qa/latest/opportunity-cleanup");
  fs.mkdirSync(outDir, { recursive: true });

  // 1. Write 01-BEFORE-SNAPSHOT.md
  const beforeSnapshot = `# 01 — BEFORE CLEANUP DATABASE SNAPSHOT
Generated: ${new Date().toISOString()} (IST: ${TODAY_IST})
Project: \`aqauempuwmbizqoaolop\` (Supabase Production Database)

## 1. High-Level Metrics Baseline
| Metric | Count | Description |
| :--- | :--- | :--- |
| **TOTAL OPPORTUNITIES** | **${categories.TOTAL}** | Total records currently in the \`opportunities\` table |
| **IS_ACTIVE = TRUE** | **${categories.ACTIVE}** | Marked as active in DB |
| **IS_ACTIVE = FALSE** | **${categories.INACTIVE}** | Marked as inactive in DB |
| **VERIFIED STATUS** | **${categories.VERIFIED}** | \`verification_status = 'verified'\` |
| **PENDING STATUS** | **${categories.PENDING}** | \`verification_status = 'pending'\` |
| **REJECTED STATUS** | **${categories.REJECTED}** | \`verification_status = 'rejected'\` |
| **EXPIRED STATUS** | **${categories.EXPIRED}** | \`verification_status = 'expired'\` |
| **LINK_UNAVAILABLE** | **${categories.LINK_UNAVAILABLE}** | \`verification_status = 'link_unavailable'\` |
| **EXPIRED BY DEADLINE** | **${categories.EXPIRED_BY_DEADLINE}** | \`deadline < ${TODAY_IST}\` |
| **FUTURE / TODAY DEADLINE** | **${categories.FUTURE_DEADLINE}** | \`deadline >= ${TODAY_IST}\` |
| **MISSING DEADLINE (NULL)** | **${categories.MISSING_DEADLINE}** | Open-ended or ongoing regular listings |
| **INVALID DEADLINE FORMAT** | **${categories.INVALID_DEADLINE}** | Corrupted date format |
| **DUPLICATES FOUND** | **${categories.DUPLICATES}** | Exact URL or Title+Org collisions |
| **MISSING APPLY URL** | **${categories.MISSING_APPLY_URL}** | Null, empty, or dummy '#' URL |
| **IRRELEVANT ROLES** | **${categories.IRRELEVANT}** | Sales, non-tech, hospital, real estate |
| **POTENTIALLY FAKE/TEST** | **${categories.POTENTIALLY_FAKE}** | Placeholder domains or test jobs |

## 2. Foreign Key & User Activity Protection
- **Candidate Applications in DB**: ${applications ? applications.length : 0} applications across ${appMap.size} opportunities.
- **Saved Opportunities / Bookmarks**: ${savedOpps ? savedOpps.length : 0} saved across ${savedMap.size} opportunities.
- **Data Protection Guarantee**: No opportunity with candidate applications or bookmarks will be hard-deleted from the database. Non-active or invalid records will be archived/quarantined via \`is_active = false\` and \`verification_status = 'expired' | 'rejected'\`.
`;
  fs.writeFileSync(path.join(outDir, "01-BEFORE-SNAPSHOT.md"), beforeSnapshot);

  // 2. Write 02-CLASSIFICATION.md
  const classificationDoc = `# 02 — OPPORTUNITY CLASSIFICATION MATRIX
Generated: ${new Date().toISOString()}

| Classification Code | Group Name | Count | Lifecycle Action |
| :--- | :--- | :--- | :--- |
| **A** | **KEEP — Verified + Current + Relevant** | ${classifications.A_KEEP_VERIFIED.length} | \`is_active = true\`, \`verification_status = 'verified'\` (Public Active) |
| **B** | **KEEP — Verified Open-Ended Industry** | ${classifications.B_KEEP_OPEN_ENDED.length} | \`is_active = true\`, \`verification_status = 'verified'\` (Public Active) |
| **C** | **EXPIRED — Deadline Elapsed** | ${classifications.C_EXPIRED.length} | \`is_active = false\`, \`verification_status = 'expired'\` (Archived) |
| **D** | **CLOSED / UNAVAILABLE** | ${classifications.D_CLOSED_UNAVAILABLE.length} | \`is_active = false\`, \`verification_status = 'link_unavailable'\` (Quarantined) |
| **E** | **UNVERIFIED — Pending Scraper Queue** | ${classifications.E_UNVERIFIED_PENDING.length} | \`is_active = false\`, \`verification_status = 'pending'\` (Admin Queue) |
| **F** | **FAKE / SUSPICIOUS / PLACEHOLDER** | ${classifications.F_FAKE_SUSPICIOUS.length} | \`is_active = false\`, \`verification_status = 'rejected'\` (Quarantined) |
| **G** | **IRRELEVANT NON-TECH** | ${classifications.G_IRRELEVANT.length} | \`is_active = false\`, \`verification_status = 'rejected'\` (Quarantined) |
| **H** | **DUPLICATE RECORD** | ${classifications.H_DUPLICATE.length} | \`is_active = false\`, \`verification_status = 'rejected'\` (Deduplicated) |
| **I** | **INVALID / CORRUPTED DATA** | ${classifications.I_INVALID_DATA.length} | \`is_active = false\`, \`verification_status = 'rejected'\` (Quarantined) |
| **J** | **STALE / UNKNOWN** | ${classifications.J_STALE_UNKNOWN.length} | \`is_active = false\`, \`verification_status = 'expired'\` (Archived) |
| **K** | **MANUAL REVIEW REQUIRED** | ${classifications.K_MANUAL_REVIEW.length} | \`is_active = false\`, \`verification_status = 'pending'\` (Review Stream) |

**Total Records Classified**: ${allOpportunities.length} (100.0% coverage)
`;
  fs.writeFileSync(path.join(outDir, "02-CLASSIFICATION.md"), classificationDoc);

  // Write individual lists
  const writeListFile = (filename, title, list) => {
    let content = `# ${title}\nTotal: ${list.length}\n\n| ID | Title | Organization | Category | Deadline | Reason | Has Applications |\n| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    for (const item of list.slice(0, 100)) {
      content += `| \`${item.id.substring(0, 8)}...\` | ${item.title.replace(/\|/g, "/").substring(0, 45)} | ${item.organization.replace(/\|/g, "/").substring(0, 25)} | ${item.category} | ${item.deadline || "NULL"} | ${item.reason} | ${item.has_applications ? `YES (${item.applications_count})` : "NO"} |\n`;
    }
    if (list.length > 100) {
      content += `\n*... and ${list.length - 100} more records recorded in database audit log.*\n`;
    }
    fs.writeFileSync(path.join(outDir, filename), content);
  };

  writeListFile("03-KEEP-LIST.md", "03 — KEEP LIST (Active & Verified)", [...classifications.A_KEEP_VERIFIED, ...classifications.B_KEEP_OPEN_ENDED]);
  writeListFile("04-EXPIRED-LIST.md", "04 — EXPIRED LIST", classifications.C_EXPIRED);
  writeListFile("05-UNVERIFIED-LIST.md", "05 — UNVERIFIED / PENDING LIST", classifications.E_UNVERIFIED_PENDING);
  writeListFile("06-FAKE-SUSPECT-LIST.md", "06 — FAKE & SUSPICIOUS LIST", classifications.F_FAKE_SUSPICIOUS);
  writeListFile("07-IRRELEVANT-LIST.md", "07 — IRRELEVANT LIST", classifications.G_IRRELEVANT);
  writeListFile("08-DUPLICATE-LIST.md", "08 — DUPLICATE LIST", classifications.H_DUPLICATE);
  writeListFile("09-MANUAL-REVIEW.md", "09 — MANUAL REVIEW LIST", [...classifications.I_INVALID_DATA, ...classifications.K_MANUAL_REVIEW]);

  console.log(`[${new Date().toISOString()}] ✅ All 7 snapshot audit files written to ${outDir}`);
}

runDeepAudit().catch(console.error);
