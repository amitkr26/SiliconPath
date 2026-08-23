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

const BASE_URL = "http://localhost:3000";

async function validateSampleAndSlugs() {
  console.log("============================================================");
  console.log("2. AUDITING 25 RANDOM ACTIVE VERIFIED OPPORTUNITIES");
  console.log("============================================================");

  const { data: allActive, error } = await supabase
    .from("opportunities")
    .select("id, title, organization, category, deadline, apply_url, source_url, slug, verification_status, is_active, created_at, tags")
    .eq("is_active", true)
    .eq("verification_status", "verified");

  if (error || !allActive) {
    console.error("Error fetching active opportunities:", error);
    process.exit(1);
  }

  // Shuffle and pick 25
  const shuffled = [...allActive].sort(() => 0.5 - Math.random());
  const sample25 = shuffled.slice(0, 25);

  const auditReport = [];
  const today = new Date().toISOString().split("T")[0];

  for (let i = 0; i < sample25.length; i++) {
    const opp = sample25[i];
    const hasTitle = Boolean(opp.title && opp.title.trim().length > 3);
    const hasOrg = Boolean(opp.organization || opp.tags?.length);
    const hasCategory = Boolean(opp.category);
    const isUnexpired = !opp.deadline || opp.deadline >= today;
    const hasApplyUrl = Boolean(opp.apply_url && opp.apply_url.startsWith("http"));
    const hasSourceUrl = Boolean(opp.source_url && opp.source_url.startsWith("http"));

    // Check reachability of apply_url
    let urlReachable = false;
    let urlStatus = "ERR";
    try {
      const uRes = await fetch(opp.apply_url, { 
        method: "HEAD", 
        timeout: 8000, 
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
      });
      urlStatus = uRes.status;
      urlReachable = (uRes.status >= 200 && uRes.status < 400) || uRes.status === 403 || uRes.status === 405;
    } catch {
      // Retry with GET
      try {
        const uRes2 = await fetch(opp.apply_url, { 
          method: "GET", 
          timeout: 8000, 
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
        });
        urlStatus = uRes2.status;
        urlReachable = (uRes2.status >= 200 && uRes2.status < 400) || uRes2.status === 403;
      } catch (e2) {
        urlStatus = "UNREACHABLE";
      }
    }

    auditReport.push({
      idx: i + 1,
      id: opp.id,
      title: opp.title.slice(0, 35) + "...",
      category: opp.category,
      deadline: opp.deadline || "Ongoing",
      unexpired: isUnexpired,
      apply_url: opp.apply_url.slice(0, 30) + "...",
      url_status: urlStatus,
      valid: hasTitle && hasCategory && isUnexpired && hasApplyUrl
    });
  }

  console.table(auditReport);

  const sampleFailures = auditReport.filter(r => !r.valid);
  console.log(`\n25 Sample Invariant Failures: ${sampleFailures.length}`);

  console.log("\n============================================================");
  console.log("4. OPPORTUNITY URL & SLUG INTEGRITY (10 RANDOM SAMPLES)");
  console.log("============================================================");

  const sample10 = shuffled.slice(0, 10);
  const slugReport = [];

  for (let j = 0; j < sample10.length; j++) {
    const opp = sample10[j];
    const slug = opp.slug;
    const isSlugValid = Boolean(slug && !slug.includes("/") && !slug.includes("?") && slug !== opp.id);
    const detailUrl = `${BASE_URL}/opportunities/${slug}`;

    let detailStatus = 0;
    let detailMatched = false;

    try {
      const dRes = await fetch(detailUrl, { timeout: 8000 });
      detailStatus = dRes.status;
      if (detailStatus === 200) {
        const dText = await dRes.text();
        detailMatched = dText.includes(opp.title.slice(0, 20));
      }
    } catch (err) {
      detailStatus = "ERR";
    }

    slugReport.push({
      idx: j + 1,
      id: opp.id,
      slug: slug || "MISSING",
      isSlugNotUuid: isSlugValid,
      detailUrl: `/opportunities/${slug}`,
      httpStatus: detailStatus,
      titleMatched: detailMatched,
      integrityPass: isSlugValid && detailStatus === 200 && detailMatched
    });
  }

  console.table(slugReport);

  const slugFailures = slugReport.filter(r => !r.integrityPass);
  console.log(`\n10 Slug Integrity Failures: ${slugFailures.length}`);

  return { sampleFailures: sampleFailures.length, slugFailures: slugFailures.length };
}

validateSampleAndSlugs().catch(err => {
  console.error("FATAL SAMPLE & SLUG AUDIT:", err);
  process.exit(1);
});
