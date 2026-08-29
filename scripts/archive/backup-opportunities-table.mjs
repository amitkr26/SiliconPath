import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
fs.readFileSync("frontend/.env.local", "utf-8").split("\n").forEach((line) => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) {
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    env[m[1].trim()] = val;
  }
});

const sb = createClient(env["NEXT_PUBLIC_SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"]);

async function backupOpportunities() {
  console.log("=== PRE-MIGRATION DATA SNAPSHOT EXPORT ===");

  let allRows = [];
  let page = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await sb
      .from("opportunities")
      .select("*")
      .range(page * batchSize, (page + 1) * batchSize - 1);

    if (error) {
      console.error("Backup fetch error:", error);
      process.exit(1);
    }
    allRows.push(...data);
    if (data.length < batchSize) hasMore = false;
    page++;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = "project-bible/backups";
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupPath = `${backupDir}/opportunities_backup_${timestamp}.json`;
  fs.writeFileSync(backupPath, JSON.stringify(allRows, null, 2), "utf-8");

  console.log(`Successfully backed up ${allRows.length} opportunities rows.`);
  console.log(`Saved snapshot to: ${backupPath}`);
}

backupOpportunities().catch(console.error);
