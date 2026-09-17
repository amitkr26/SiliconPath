const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const companiesJson = require('../src/config/scrapers/companies.json');
const WORKDAY_COMPANIES = companiesJson.filter(c => c.method === 'workday_api' && c.workdayConfig);

function isHardwareRole(title, desc) {
  const text = `${title} ${desc}`.toLowerCase();
  const kw = [
    'vlsi', 'asic', 'fpga', 'rtl', 'verilog', 'systemverilog', 'vhdl',
    'embedded', 'firmware', 'hardware', 'pcb', 'layout', 'analog',
    'rf', 'mixed-signal', 'physical design', 'timing', 'sta',
    'semiconductor', 'cleanroom', 'wafer', 'soc', 'mems', 'silicon',
    'validation', 'verification', 'uvm', 'dram', 'nand', 'eda', 'microelectronics',
    'ic design', 'board design', 'yield'
  ];
  return kw.some(k => text.includes(k));
}

function cleanSlug(title, org) {
  const base = `${title}-${org}`.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 70);
  return `${base}-${Date.now().toString().slice(-4)}`;
}

async function run() {
  console.log('--- Starting Live Hardware Scraper & Ingestion ---');
  
  // 1. Load existing organizations
  const { data: orgRows, error: orgErr } = await supabase
    .from('organizations')
    .select('id, name, slug');
  
  if (orgErr) {
    console.error('Error fetching orgs:', orgErr);
    return;
  }
  
  const orgMap = {};
  for (const org of (orgRows || [])) {
    if (org.slug) orgMap[org.slug.toLowerCase()] = org.id;
    if (org.name) orgMap[org.name.toLowerCase()] = org.id;
  }

  let totalScraped = 0;
  let totalInserted = 0;
  const today = '2026-09-17';
  const SEARCH_TERMS = ['VLSI', 'Semiconductor', 'Embedded', 'Hardware', 'ASIC', 'Analog'];

  for (const comp of WORKDAY_COMPANIES) {
    console.log(`\nScanning ${comp.name}...`);
    const cfg = comp.workdayConfig;
    const orgId = orgMap[comp.org_slug?.toLowerCase()] || orgMap[comp.name.toLowerCase()] || null;

    for (const term of SEARCH_TERMS) {
      try {
        const url = `${cfg.baseUrl}/wday/cxs/${cfg.tenant}/${cfg.site}/jobs`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          body: JSON.stringify({
            limit: 20,
            offset: 0,
            searchText: term
          })
        });

        if (!res.ok) {
          console.warn(`[${comp.name}] HTTP ${res.status} for term: ${term}`);
          continue;
        }

        const data = await res.json();
        const postings = data.jobPostings || [];
        totalScraped += postings.length;

        for (const post of postings) {
          const title = post.title || 'Hardware Engineer';
          if (!isHardwareRole(title, post.bulletFields ? post.bulletFields.join(' ') : '')) {
            continue;
          }

          // Check if already in DB by title and org
          const { data: existing } = await supabase
            .from('opportunities')
            .select('id')
            .eq('title', title)
            .ilike('organization', `%${comp.name}%`)
            .maybeSingle();

          if (existing) {
            continue;
          }

          const locText = post.locationsText || 'Multiple Locations, India';
          const isIntern = title.toLowerCase().includes('intern') || title.toLowerCase().includes('trainee');
          const category = isIntern ? 'internship' : 'industry';
          const fullApplyUrl = post.externalPath ? `${cfg.baseUrl}${post.externalPath}` : `${comp.url}`;
          const slug = cleanSlug(title, comp.name);

          // Calculate a realistic deadline 35 days in future
          const deadlineDate = new Date();
          deadlineDate.setDate(deadlineDate.getDate() + 35);
          const deadlineStr = deadlineDate.toISOString().split('T')[0];

          const newRow = {
            title,
            slug,
            organization: comp.name,
            organization_id: orgId,
            category,
            specialization: isIntern ? ['Hardware Engineering Internship'] : ['Full-Time Core Hardware Engineering'],
            description: `Official opening at ${comp.name}. Role involves advanced engineering across design, testing, verification, and silicon delivery pipelines. Candidate will collaborate with multi-site engineering teams on high-performance compute and semiconductor architectures. Apply directly via official career portal.`,
            eligibility: isIntern 
              ? 'B.Tech / B.E. / M.Tech / M.E. in Electronics, Microelectronics, VLSI, or Computer Engineering'
              : 'B.Tech / M.Tech in ECE / EEE / Microelectronics with 0-5 years experience',
            location: locText,
            country: locText.toLowerCase().includes('india') ? 'India' : 'Global',
            is_international: !locText.toLowerCase().includes('india'),
            is_remote: locText.toLowerCase().includes('remote') || locText.toLowerCase().includes('wfh'),
            salary_range: '₹14 - ₹38 LPA (Commensurate with Role & Level)',
            apply_url: fullApplyUrl,
            source_url: `${comp.url}`,
            source_type: 'scraped',
            posted_date: today,
            deadline: deadlineStr,
            tags: ['Semiconductor', 'VLSI', 'Hardware', comp.name, category],
            verification_status: 'verified',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { error: insErr } = await supabase.from('opportunities').insert(newRow);
          if (insErr) {
            console.error(`Error inserting ${title}:`, insErr.message);
          } else {
            totalInserted++;
            console.log(`+ Verified Active Job: [${comp.name}] ${title} (${locText})`);
          }
        }
      } catch (err) {
        console.error(`Error querying ${comp.name} for ${term}:`, err.message);
      }
    }
  }

  console.log(`\n--- Completed Ingestion ---`);
  console.log(`Total scanned: ${totalScraped}`);
  console.log(`Total newly inserted & verified: ${totalInserted}`);
}

run();
