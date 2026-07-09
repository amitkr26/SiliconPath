const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\n]+)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=([^\n]+)/);

if (!urlMatch || !keyMatch) {
  console.log("Missing env vars");
  process.exit(1);
}

const url = urlMatch[1].replace(/['"]/g, '').trim();
const key = keyMatch[1].replace(/['"]/g, '').trim();

const supabase = createClient(url, key);

async function checkSchema() {
  // Try to insert a dummy record or just select limit 1 to see columns
  const { data, error } = await supabase.from('user_profiles').select('*').limit(1);
  if (error) {
    console.error("Error reading user_profiles:", error);
  } else {
    if (data && data.length > 0) {
      console.log("Columns in user_profiles:", Object.keys(data[0]));
    } else {
      console.log("Table user_profiles is empty, cannot infer columns from data.");
    }
  }
}

checkSchema();
