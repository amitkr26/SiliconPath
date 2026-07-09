import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

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
const BASE_URL = 'https://siliconpath.vercel.app';

async function testAPIs() {
  const report = [];

  // 1. Opportunities filter test
  console.log("Testing opportunities API filters...");
  try {
    const res = await fetch(`${BASE_URL}/api/opportunities?category=Hardware`);
    const data = await res.json();
    if (data.opportunities && data.opportunities.length > 0) {
      const allHardware = data.opportunities.every(o => o.category === 'Hardware');
      if (allHardware) {
        report.push("[Opportunities API] Category filter works correctly.");
      } else {
        report.push("[Opportunities API] Category filter FAILED. Found non-Hardware items.");
      }
    } else {
      report.push("[Opportunities API] Category filter returned no results.");
    }
  } catch (e) {
    report.push(`[Opportunities API] Error: ${e.message}`);
  }

  // 2. News API contamination
  console.log("Testing news API for contamination...");
  try {
    const res = await fetch(`${BASE_URL}/api/news`);
    const data = await res.json();
    if (data.news) {
      const badNews = data.news.filter(n => 
        n.source_name === "Tom's Hardware" || 
        n.title.toLowerCase().includes('gaming') || 
        n.summary?.includes('tktk')
      );
      if (badNews.length > 0) {
        report.push(`[News API] Contamination/tktk found: ${badNews.length} articles.`);
        badNews.forEach(n => console.log(`  - ${n.title} (${n.source_name})`));
      } else {
        report.push("[News API] No obvious contamination found in latest fetch.");
      }
    }
  } catch (e) {
    report.push(`[News API] Error: ${e.message}`);
  }

  // 3. Organizations check directly in DB
  console.log("Checking DB for person names misattributed as organizations...");
  try {
    const { data: opps } = await supabase.from('opportunities').select('id, organization');
    if (opps) {
      const badOrgs = opps.filter(o => 
        o.organization?.includes('Sadia') || 
        o.organization?.includes('Muhammad') || 
        o.organization?.includes('Faizan')
      );
      if (badOrgs.length > 0) {
        report.push(`[DB Organizations] Found ${badOrgs.length} opportunities with person names as orgs.`);
      } else {
        report.push("[DB Organizations] No known person names found in 'organization' field.");
      }
    }
  } catch (e) {
    report.push(`[DB] Error: ${e.message}`);
  }

  fs.writeFileSync('api_test_results.txt', report.join('\n'));
  console.log("API testing complete. Saved to api_test_results.txt");
}

testAPIs();
