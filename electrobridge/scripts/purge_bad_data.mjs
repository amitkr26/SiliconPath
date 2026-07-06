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

async function purgeBadData() {
  console.log("Starting DB purge...");

  // 1. Delete bad news
  console.log("Purging bad news...");
  const { data: badNews, error: newsErr } = await supabase
    .from('news_articles')
    .select('id, title')
    .or("title.ilike.%gaming%,title.ilike.%gamer%,source.ilike.%Tom's Hardware%,summary.ilike.%tktk%");

  if (newsErr) {
    console.error("Error finding bad news:", newsErr);
  } else if (badNews && badNews.length > 0) {
    console.log(`Found ${badNews.length} bad news articles to delete.`);
    const ids = badNews.map(n => n.id);
    const { error: delErr } = await supabase.from('news_articles').delete().in('id', ids);
    if (delErr) console.error("Error deleting news:", delErr);
    else console.log("Deleted bad news successfully.");
  } else {
    console.log("No bad news found.");
  }

  // 2. Delete bad organizations (Person names from scholarship site)
  console.log("Purging bad organizations from opportunities...");
  const { data: badOrgs, error: orgErr } = await supabase
    .from('opportunities')
    .select('id, organization, title')
    .or("organization.ilike.%Sadia%,organization.ilike.%Muhammad%,organization.ilike.%Faizan%");

  if (orgErr) {
    console.error("Error finding bad orgs:", orgErr);
  } else if (badOrgs && badOrgs.length > 0) {
    console.log(`Found ${badOrgs.length} opportunities with person names as organization.`);
    const ids = badOrgs.map(o => o.id);
    // Since these are likely scraped scholarship opportunities with totally messed up metadata, 
    // the safest and cleanest approach for data integrity is to delete them.
    const { error: delErr } = await supabase.from('opportunities').delete().in('id', ids);
    if (delErr) console.error("Error deleting opportunities:", delErr);
    else console.log("Deleted bad opportunities successfully.");
  } else {
    console.log("No bad organizations found.");
  }

  console.log("Purge complete.");
}

purgeBadData();
