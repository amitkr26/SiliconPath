import { neon } from "@neondatabase/serverless";
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

const neonUrl = env["NEON_1_DATABASE_URL"] || env["DATABASE_URL"] || env["NEON_DATABASE_URL"] || env["POSTGRES_URL"];

async function inspectNeon() {
  if (!neonUrl) {
    console.log("No Neon database URL found in .env.local");
    return;
  }
  console.log("Connecting to Neon Database...");
  const sql = neon(neonUrl);
  try {
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    console.log("--- NEON DATABASE TABLES (" + tables.length + ") ---");
    for (const t of tables) {
      const countRes = await sql`SELECT count(*) as count FROM information_schema.columns WHERE table_name = ${t.table_name}`;
      console.log(`Table: ${t.table_name.padEnd(25)}`);
    }
  } catch (err) {
    console.error("Neon query error:", err.message);
  }
}

inspectNeon().catch(console.error);
