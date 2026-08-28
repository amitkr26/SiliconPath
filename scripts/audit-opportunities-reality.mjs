import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envContent = fs.readFileSync("frontend/.env.local", "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[match[1].trim()] = val;
  }
});

const supabaseUrl = env["NEXT_PUBLIC_SUPABASE_URL"];
const supabaseKey = env["SUPABASE_SERVICE_ROLE_KEY"] || env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
const supabase = createClient(supabaseUrl, supabaseKey);

async function auditOpportunities() {
  console.log("Fetching all opportunities from Supabase...");
  
  let allOpportunities = [];
  let from = 0;
  const step = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from("opportunities")
      .select("id, title, slug, category, specialization, location, is_remote, deadline, verification_status, is_active, source_type, source_url, apply_url, organization, created_at")
      .range(from, from + step - 1);
      
    if (error) {
      console.error("Error fetching opportunities:", error);
      break;
    }
    if (!data || data.length === 0) break;
    allOpportunities = allOpportunities.concat(data);
    from += step;
    if (data.length < step) break;
  }

  console.log(`Total opportunities fetched: ${allOpportunities.length}`);

  const now = new Date();
  let activeCount = 0;
  let verifiedCount = 0;
  let expiredCount = 0;
  let futureDeadlineCount = 0;
  let noDeadlineCount = 0;
  let missingApplyUrl = 0;
  let categories = {};
  let verificationStatuses = {};
  let sourceTypes = {};
  let duplicateSlugs = 0;
  let duplicateTitles = 0;

  const slugsSeen = new Set();
  const titlesSeen = new Set();

  allOpportunities.forEach((op) => {
    if (op.is_active) activeCount++;
    if (op.verification_status === "verified") verifiedCount++;

    verificationStatuses[op.verification_status || "null"] = (verificationStatuses[op.verification_status || "null"] || 0) + 1;
    categories[op.category || "uncategorized"] = (categories[op.category || "uncategorized"] || 0) + 1;
    sourceTypes[op.source_type || "unknown"] = (sourceTypes[op.source_type || "unknown"] || 0) + 1;

    if (!op.apply_url && !op.source_url) missingApplyUrl++;

    if (slugsSeen.has(op.slug)) {
      duplicateSlugs++;
    } else {
      slugsSeen.add(op.slug);
    }

    const normTitle = (op.title || "").toLowerCase().trim();
    if (titlesSeen.has(normTitle)) {
      duplicateTitles++;
    } else {
      titlesSeen.add(normTitle);
    }

    if (op.deadline) {
      const d = new Date(op.deadline);
      if (!isNaN(d.getTime())) {
        if (d < now) {
          expiredCount++;
        } else {
          futureDeadlineCount++;
        }
      } else {
        noDeadlineCount++;
      }
    } else {
      noDeadlineCount++;
    }
  });

  console.log("\n--- OPPORTUNITY REALITY METRICS ---");
  console.log(`Total Records: ${allOpportunities.length}`);
  console.log(`Active (is_active=true): ${activeCount}`);
  console.log(`Inactive (is_active=false): ${allOpportunities.length - activeCount}`);
  console.log(`Verified Statuses:`, verificationStatuses);
  console.log(`Categories:`, categories);
  console.log(`Source Types:`, sourceTypes);
  console.log(`Expired Deadlines (< now): ${expiredCount}`);
  console.log(`Future Deadlines (>= now): ${futureDeadlineCount}`);
  console.log(`No/Invalid Deadline: ${noDeadlineCount}`);
  console.log(`Missing Apply & Source URLs: ${missingApplyUrl}`);
  console.log(`Duplicate Slugs: ${duplicateSlugs}`);
  console.log(`Duplicate Normalized Titles: ${duplicateTitles}`);
}

auditOpportunities().catch(console.error);
