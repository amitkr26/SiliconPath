import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env variables
const envPath = path.resolve(process.cwd(), '.env.local');
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
    if (match) {
      let key = match[1].trim();
      let value = match[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value;
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') supabaseKey = value;
    }
  });
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  console.log("Fixing bad video_refs in learning_days...");
  const badIds = ['qHkoikF1lHw', 'IVhZhs2rwok'];

  for (const badId of badIds) {
    const { data, error } = await supabase
      .from('learning_days')
      .update({ video_ref: 'FLAGGED_NEEDS_MANUAL_SELECTION' })
      .eq('video_ref', badId);

    if (error) {
      console.error(`Error updating ${badId}:`, error.message);
    } else {
      console.log(`Successfully flagged instances of ${badId}`);
    }
  }
}

fix();
