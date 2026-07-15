#!/usr/bin/env node
import pkg from "pg";
import { readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const { Client } = pkg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "..", "supabase", "migrations");

const target = process.argv.find((a) => a.startsWith("--target="))?.split("=")[1] || "";
const dbUrl = process.env.SUPABASE_DB_URL || process.env[`SUPABASE_${target.toUpperCase()}_DB_URL`];
if (!dbUrl) {
  console.error(`Missing database URL. Set SUPABASE_DB_URL or pass --target=<name> with SUPABASE_<NAME>_DB_URL`);
  process.exit(1);
}

const files = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const client = new Client({ connectionString: dbUrl });
await client.connect();

for (const file of files) {
  const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");

  // Skip if target doesn't match --target filter
  const targetMatch = sql.match(/^--\s*target:\s*(\S+)/m);
  if (target && (!targetMatch || targetMatch[1] !== target)) continue;

  const statements = sql.split(";").map((s) => s.trim()).filter((s) => s.length > 0);
  for (const stmt of statements) {
    try { await client.query(stmt + ";"); }
    catch (err) { console.error(`[${file}] Error: ${err.message}`); }
  }
  console.log(`✓ ${file}`);
}

await client.end();
console.log("Migration complete.");
