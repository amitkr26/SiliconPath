import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
const env = fs.readFileSync(envPath, 'utf8');

const primaryUrlMatch = env.match(/DATABASE_URL=([^\n]+)/);
if (!primaryUrlMatch) {
  console.log("No DATABASE_URL");
  process.exit(1);
}

const sql = neon(primaryUrlMatch[1].replace(/['"]/g, '').trim());

async function run() {
  console.log("Adding canonical fields to user_profiles...");
  
  try {
    await sql`
      ALTER TABLE user_profiles
      ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS experience JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS projects JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS publications JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS resume_objective TEXT,
      ADD COLUMN IF NOT EXISTS ats_feedback JSONB DEFAULT '[]'::jsonb;
    `;
    console.log("Columns added successfully.");
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
