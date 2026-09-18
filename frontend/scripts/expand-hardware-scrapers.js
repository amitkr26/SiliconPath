const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const https = require('https');
const cheerio = require('cheerio');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const HARDWARE_KEYWORDS = [
  'vlsi', 'asic', 'fpga', 'rtl', 'verilog', 'systemverilog', 'vhdl',
  'embedded', 'firmware', 'hardware', 'pcb', 'layout', 'analog',
  'rf', 'rfic', 'mixed-signal', 'physical design', 'timing', 'sta',
  'semiconductor', 'cleanroom', 'wafer', 'soc', 'mems', 'silicon',
  'validation', 'verification', 'uvm', 'dram', 'nand', 'eda', 'microelectronics',
  'ic design', 'board design', 'yield', 'dft', 'synthesis', 'device driver',
  'bsp', 'microcontroller', 'microprocessor', 'photonics', 'optics', 'avionics',
  'radar', 'power electronics', 'digital design', 'silicon architecture', 'risc-v'
];

const DISALLOWED_PATTERNS = [
  /\b(sales|account manager|marketing|human resources|recruiter|finance|payroll|tax|legal|compliance|security guard|cook|driver|receptionist)\b/i,
  /\b(fitter|welder|carpenter|plumber|painter|mason|machinist|turner|draughtsman|stenographer|typist)\b/i,
  /\b(clerk|peon|chowkidar|safaiwala|nurse|nursing|hospital|medical|doctor|mbbs|dental)\b/i,
  /\b(banking|vkyc|kyc|insurance|wealth management|financial advisor)\b/i,
  /undefined/i
];

function isHardwareRole(title, desc = '') {
  const text = `${title} ${desc}`.toLowerCase();
  for (const dis of DISALLOWED_PATTERNS) {
    if (dis.test(title)) return false;
  }
  return HARDWARE_KEYWORDS.some(k => text.includes(k));
}

function cleanSlug(title, org) {
  const base = `${title}-${org}`.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 70);
  return `${base}-${Date.now().toString().slice(-4)}`;
}

function postJson(url, payload) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const data = JSON.stringify(payload);
      const req = https.request(u, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            resolve({ ok: res.statusCode === 200, status: res.statusCode, data: json });
          } catch (e) {
            resolve({ ok: false, status: res.statusCode, error: 'JSON parse error' });
          }
        });
      });
      req.on('error', err => resolve({ ok: false, error: err.message }));
      req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'timeout' }); });
      req.write(data);
      req.end();
    } catch (e) {
      resolve({ ok: false, error: e.message });
    }
  });
}

function getJson(url) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      https.get(u, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            resolve({ ok: res.statusCode === 200, status: res.statusCode, data: json });
          } catch (e) {
            resolve({ ok: false, status: res.statusCode, error: 'JSON parse error' });
          }
        });
      }).on('error', err => resolve({ ok: false, error: err.message }));
    } catch (e) {
      resolve({ ok: false, error: e.message });
    }
  });
}

function getHtml(url) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      https.get(u, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 12000
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          resolve({ ok: res.statusCode === 200, status: res.statusCode, data: body });
        });
      }).on('error', err => resolve({ ok: false, error: err.message }));
    } catch (e) {
      resolve({ ok: false, error: e.message });
    }
  });
}

const WORKDAY_TARGETS = [
  {
    name: 'NVIDIA',
    slug: 'nvidia',
    url: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite',
    endpoint: 'https://nvidia.wd5.myworkdayjobs.com/wday/cxs/nvidia/NVIDIAExternalCareerSite/jobs',
    terms: ['VLSI', 'ASIC', 'Hardware', 'Verification', 'Physical Design', 'Silicon']
  },
  {
    name: 'Intel',
    slug: 'intel',
    url: 'https://intel.wd1.myworkdayjobs.com/External',
    endpoint: 'https://intel.wd1.myworkdayjobs.com/wday/cxs/intel/External/jobs',
    terms: ['VLSI', 'Hardware', 'Embedded', 'Firmware', 'Silicon', 'Analog']
  },
  {
    name: 'Micron Technology',
    slug: 'micron',
    url: 'https://micron.wd1.myworkdayjobs.com/External',
    endpoint: 'https://micron.wd1.myworkdayjobs.com/wday/cxs/micron/External/jobs',
    terms: ['DRAM', 'NAND', 'Semiconductor', 'Verification', 'Design']
  },
  {
    name: 'Broadcom',
    slug: 'broadcom',
    url: 'https://broadcom.wd1.myworkdayjobs.com/External_Career',
    endpoint: 'https://broadcom.wd1.myworkdayjobs.com/wday/cxs/broadcom/External_Career/jobs',
    terms: ['ASIC', 'Hardware', 'Silicon', 'Firmware']
  },
  {
    name: 'Marvell Technology',
    slug: 'marvell',
    url: 'https://marvell.wd1.myworkdayjobs.com/MarvellCareers',
    endpoint: 'https://marvell.wd1.myworkdayjobs.com/wday/cxs/marvell/MarvellCareers/jobs',
    terms: ['Physical Design', 'Verification', 'Storage', 'Firmware']
  },
  {
    name: 'Analog Devices',
    slug: 'analog-devices',
    url: 'https://analogdevices.wd1.myworkdayjobs.com/External',
    endpoint: 'https://analogdevices.wd1.myworkdayjobs.com/wday/cxs/analogdevices/External/jobs',
    terms: ['Analog', 'RF', 'Hardware', 'Mixed Signal', 'Semiconductor']
  },
  {
    name: 'NXP Semiconductors',
    slug: 'nxp',
    url: 'https://nxp.wd3.myworkdayjobs.com/careers',
    endpoint: 'https://nxp.wd3.myworkdayjobs.com/wday/cxs/nxp/careers/jobs',
    terms: ['Embedded', 'Firmware', 'Automotive', 'Silicon']
  },
  {
    name: 'Cadence Design Systems',
    slug: 'cadence',
    url: 'https://cadence.wd1.myworkdayjobs.com/External_Careers',
    endpoint: 'https://cadence.wd1.myworkdayjobs.com/wday/cxs/cadence/External_Careers/jobs',
    terms: ['EDA', 'Verification', 'Digital Design', 'VLSI']
  }
];

async function main() {
  console.log('====================================================');
  console.log('  BDW Live Hardware Scraper & Idempotent Ingestion');
  console.log('====================================================');

  const today = '2026-09-17';

  // 1. Load organizations map
  const { data: orgRows } = await supabase.from('organizations').select('id, name, slug');
  const orgMap = {};
  for (const org of orgRows || []) {
    if (org.slug) orgMap[org.slug.toLowerCase()] = org.id;
    if (org.name) orgMap[org.name.toLowerCase()] = org.id;
  }

  // Ensure NVIDIA org exists
  if (!orgMap['nvidia']) {
    console.log('Creating organization record for NVIDIA...');
    const { data: newOrg } = await supabase.from('organizations').insert([{
      name: 'NVIDIA',
      slug: 'nvidia',
      type: 'Private MNC',
      is_verified: true,
      website: 'https://nvidia.com'
    }]).select('id').single();
    if (newOrg) {
      orgMap['nvidia'] = newOrg.id;
      orgMap['NVIDIA'.toLowerCase()] = newOrg.id;
    }
  }

  // Ensure Tenstorrent org exists
  if (!orgMap['tenstorrent']) {
    console.log('Creating organization record for Tenstorrent...');
    const { data: newOrg } = await supabase.from('organizations').insert([{
      name: 'Tenstorrent',
      slug: 'tenstorrent',
      type: 'Startup',
      is_verified: true,
      website: 'https://tenstorrent.com'
    }]).select('id').single();
    if (newOrg) {
      orgMap['tenstorrent'] = newOrg.id;
      orgMap['Tenstorrent'.toLowerCase()] = newOrg.id;
    }
  }

  // Ensure Western Digital org exists
  if (!orgMap['western-digital']) {
    console.log('Creating organization record for Western Digital...');
    const { data: newOrg } = await supabase.from('organizations').insert([{
      name: 'Western Digital',
      slug: 'western-digital',
      type: 'Private MNC',
      is_verified: true,
      website: 'https://westerndigital.com'
    }]).select('id').single();
    if (newOrg) {
      orgMap['western-digital'] = newOrg.id;
      orgMap['Western Digital'.toLowerCase()] = newOrg.id;
    }
  }

  // Ensure ISRO org exists
  if (!orgMap['isro']) {
    const { data: newOrg } = await supabase.from('organizations').insert([{
      name: 'ISRO',
      slug: 'isro',
      type: 'Government',
      is_verified: true,
      website: 'https://isro.gov.in'
    }]).select('id').single();
    if (newOrg) {
      orgMap['isro'] = newOrg.id;
      orgMap['ISRO'.toLowerCase()] = newOrg.id;
    }
  }

  // Ensure DRDO org exists
  if (!orgMap['drdo']) {
    const { data: newOrg } = await supabase.from('organizations').insert([{
      name: 'DRDO',
      slug: 'drdo',
      type: 'Government',
      is_verified: true,
      website: 'https://drdo.gov.in'
    }]).select('id').single();
    if (newOrg) {
      orgMap['drdo'] = newOrg.id;
      orgMap['DRDO'.toLowerCase()] = newOrg.id;
    }
  }

  // 2. Pre-fetch existing opportunities for fast deduplication & idempotency
  console.log('\nLoading existing active opportunities for deduplication...');
  const { data: existingOpps } = await supabase
    .from('opportunities')
    .select('id, apply_url, source_url, title, organization_id, is_active')
    .limit(5000);

  const urlToOppMap = new Map();
  const orgTitleToOppMap = new Map();

  for (const opp of existingOpps || []) {
    if (opp.apply_url) urlToOppMap.set(opp.apply_url.toLowerCase().trim(), opp);
    if (opp.source_url) urlToOppMap.set(opp.source_url.toLowerCase().trim(), opp);
    if (opp.organization_id && opp.title) {
      const key = `${opp.organization_id}:${opp.title.toLowerCase().trim()}`;
      orgTitleToOppMap.set(key, opp);
    }
  }
  console.log(`Indexed ${urlToOppMap.size} existing URLs and ${orgTitleToOppMap.size} org+title pairs.`);

  let totalScraped = 0;
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  // -------------------------------------------------------------
  // A. WORKDAY SCRAPING
  // -------------------------------------------------------------
  for (const target of WORKDAY_TARGETS) {
    console.log(`\nScanning Workday for ${target.name}...`);
    const orgId = orgMap[target.slug.toLowerCase()] || orgMap[target.name.toLowerCase()];

    for (const term of target.terms) {
      const res = await postJson(target.endpoint, {
        limit: 20,
        offset: 0,
        searchText: term,
        appliedFacets: {}
      });

      if (!res.ok || !res.data?.jobPostings) {
        continue;
      }

      const postings = res.data.jobPostings;
      totalScraped += postings.length;

      for (const p of postings) {
        const title = p.title || '';
        const desc = p.jobDescriptionSnippet || `Position available at official ${target.name} careers portal. Requisition: ${p.jobRequisitionId || 'N/A'}`;
        if (!isHardwareRole(title, desc)) continue;

        const applyUrl = p.externalPath ? `${new URL(target.endpoint).origin}${p.externalPath}` : target.url;
        const normalizedApplyUrl = applyUrl.toLowerCase().trim();
        const orgTitleKey = orgId ? `${orgId}:${title.toLowerCase().trim()}` : null;

        const isIntern = /intern|co-op|apprentice|student|trainee/i.test(title);
        const category = isIntern ? 'internship' : 'industry';
        const isFresher = isIntern || /junior|entry|associate|graduate|college|0-1|0-2/i.test(title);

        const tags = [target.name, 'Semiconductor', 'Hardware'];
        if (isIntern) tags.push('Internship');
        if (isFresher) tags.push('Fresher');

        const existing = urlToOppMap.get(normalizedApplyUrl) || (orgTitleKey ? orgTitleToOppMap.get(orgTitleKey) : null);

        if (existing) {
          // Idempotent Update
          const { error: updErr } = await supabase
            .from('opportunities')
            .update({
              title,
              description: desc,
              location: p.locationsText || 'India',
              apply_url: applyUrl,
              verification_status: 'verified',
              is_active: true,
              tags: Array.from(new Set([...tags, target.name])),
              posted_date: today,
            })
            .eq('id', existing.id);

          if (!updErr) {
            totalUpdated++;
          }
        } else {
          // Idempotent Insert
          const slug = cleanSlug(title, target.name);
          const { data: newRow, error: insErr } = await supabase
            .from('opportunities')
            .insert([{
              title,
              slug,
              organization_id: orgId || null,
              category,
              location: p.locationsText || 'India',
              salary_range: isIntern ? '₹40,000 - ₹80,000 / month (Stipend)' : 'Competitive Hardware MNC Compensation',
              deadline: null, // Rolling
              eligibility: isIntern ? 'B.Tech / M.Tech in ECE / EEE / Microelectronics (Pre-final / Final Year)' : 'B.Tech / M.Tech / PhD in ECE / EEE / VLSI / Computer Engineering',
              description: desc,
              apply_url: applyUrl,
              source_url: target.url,
              tags,
              verification_status: 'verified',
              is_active: true,
              source_type: 'scraped',
              posted_date: today,
            }])
            .select('id, apply_url, title, organization_id')
            .single();

          if (!insErr && newRow) {
            totalInserted++;
            urlToOppMap.set(normalizedApplyUrl, newRow);
            if (orgTitleKey) orgTitleToOppMap.set(orgTitleKey, newRow);
          }
        }
      }
    }
  }

  // -------------------------------------------------------------
  // B. TENSTORRENT (GREENHOUSE)
  // -------------------------------------------------------------
  console.log('\nScanning Greenhouse for Tenstorrent...');
  const ttOrgId = orgMap['tenstorrent'];
  const ttRes = await getJson('https://boards-api.greenhouse.io/v1/boards/tenstorrent/jobs?content=true');
  if (ttRes.ok && ttRes.data?.jobs) {
    for (const job of ttRes.data.jobs) {
      totalScraped++;
      const title = job.title || '';
      if (!isHardwareRole(title, job.content || '')) continue;

      const applyUrl = job.absolute_url || 'https://boards.greenhouse.io/tenstorrent';
      const normalizedApplyUrl = applyUrl.toLowerCase().trim();
      const orgTitleKey = ttOrgId ? `${ttOrgId}:${title.toLowerCase().trim()}` : null;
      const isIntern = /intern|co-op|student|trainee/i.test(title);
      const category = isIntern ? 'internship' : 'industry';
      const isFresher = isIntern || /junior|entry|associate|graduate/i.test(title);
      const tags = ['Tenstorrent', 'RISC-V', 'AI Hardware', 'Semiconductor'];
      if (isIntern) tags.push('Internship');
      if (isFresher) tags.push('Fresher');

      const existing = urlToOppMap.get(normalizedApplyUrl) || (orgTitleKey ? orgTitleToOppMap.get(orgTitleKey) : null);

      if (existing) {
        await supabase.from('opportunities').update({
          title,
          location: job.location?.name || 'Bengaluru / Global',
          apply_url: applyUrl,
          verification_status: 'verified',
          is_active: true,
          posted_date: today,
        }).eq('id', existing.id);
        totalUpdated++;
      } else {
        const slug = cleanSlug(title, 'Tenstorrent');
        const { data: newRow, error: insErr } = await supabase.from('opportunities').insert([{
          title,
          slug,
          organization_id: ttOrgId || null,
          category,
          location: job.location?.name || 'Bengaluru / Global',
          salary_range: 'Top-tier Deep-Tech Compensation',
          deadline: null,
          eligibility: 'B.Tech / M.Tech in ECE / EE / Computer Engineering with Verilog / RTL expertise',
          description: `AI Processor and RISC-V Silicon Architecture role at Tenstorrent. Full requisition details available on official Greenhouse portal.`,
          apply_url: applyUrl,
          source_url: 'https://tenstorrent.com/careers',
          tags,
          verification_status: 'verified',
          is_active: true,
          source_type: 'scraped',
          posted_date: today,
        }]).select('id, apply_url, title, organization_id').single();

        if (!insErr && newRow) {
          totalInserted++;
          urlToOppMap.set(normalizedApplyUrl, newRow);
        }
      }
    }
  }

  // -------------------------------------------------------------
  // C. WESTERN DIGITAL (SMARTRECRUITERS)
  // -------------------------------------------------------------
  console.log('\nScanning SmartRecruiters for Western Digital...');
  const wdOrgId = orgMap['western-digital'];
  const wdRes = await getJson('https://api.smartrecruiters.com/v1/companies/WesternDigital/postings?limit=50&q=hardware');
  if (wdRes.ok && wdRes.data?.content) {
    for (const job of wdRes.data.content) {
      totalScraped++;
      const title = job.name || '';
      if (!isHardwareRole(title)) continue;

      const applyUrl = `https://jobs.smartrecruiters.com/WesternDigital/${job.id}`;
      const normalizedApplyUrl = applyUrl.toLowerCase().trim();
      const orgTitleKey = wdOrgId ? `${wdOrgId}:${title.toLowerCase().trim()}` : null;
      const isIntern = /intern|co-op|student|trainee/i.test(title);
      const category = isIntern ? 'internship' : 'industry';
      const tags = ['Western Digital', 'Storage', 'Semiconductor', 'NAND Flash'];
      if (isIntern) tags.push('Internship');

      const existing = urlToOppMap.get(normalizedApplyUrl) || (orgTitleKey ? orgTitleToOppMap.get(orgTitleKey) : null);

      if (existing) {
        await supabase.from('opportunities').update({
          title,
          location: job.location?.city ? `${job.location.city}, India` : 'Bengaluru, India',
          apply_url: applyUrl,
          verification_status: 'verified',
          is_active: true,
          posted_date: today,
        }).eq('id', existing.id);
        totalUpdated++;
      } else {
        const slug = cleanSlug(title, 'Western Digital');
        const { data: newRow, error: insErr } = await supabase.from('opportunities').insert([{
          title,
          slug,
          organization_id: wdOrgId || null,
          category,
          location: job.location?.city ? `${job.location.city}, India` : 'Bengaluru, India',
          salary_range: isIntern ? '₹35,000 - ₹60,000 / month' : 'Competitive MNC Salary',
          deadline: null,
          eligibility: 'B.Tech / M.Tech in ECE / EEE / Microelectronics',
          description: `Memory design and hardware engineering opportunity at Western Digital / SanDisk.`,
          apply_url: applyUrl,
          source_url: 'https://careers.smartrecruiters.com/WesternDigital',
          tags,
          verification_status: 'verified',
          is_active: true,
          source_type: 'scraped',
          posted_date: today,
        }]).select('id, apply_url, title, organization_id').single();

        if (!insErr && newRow) {
          totalInserted++;
          urlToOppMap.set(normalizedApplyUrl, newRow);
        }
      }
    }
  }

  // -------------------------------------------------------------
  // D. ISRO CAREERS LIVE SCRAPING
  // -------------------------------------------------------------
  console.log('\nScanning ISRO official careers page...');
  const isroOrgId = orgMap['isro'];
  const isroHtml = await getHtml('https://www.isro.gov.in/Careers.html');
  if (isroHtml.ok && isroHtml.data) {
    const $ = cheerio.load(isroHtml.data);
    $('tr').each((_, row) => {
      const text = $(row).text().trim();
      if (!text || text.length < 25) return;

      const linkEl = $(row).find('a').first();
      const href = linkEl.attr('href') || '';
      let title = linkEl.text().trim() || $(row).find('td').eq(1).text().trim();
      if (!title || title.length < 10) return;

      // Filter results/notices
      if (/result|selected candidates|provisionally|corrigendum|answer key/i.test(title)) return;
      if (!isHardwareRole(title, text)) return;

      const applyUrl = href.startsWith('http') ? href : `https://www.isro.gov.in/${href.replace(/^\//, '')}`;
      const normalizedApplyUrl = applyUrl.toLowerCase().trim();
      const orgTitleKey = isroOrgId ? `${isroOrgId}:${title.toLowerCase().trim()}` : null;

      const isJrf = /jrf|junior research|srf/i.test(title);
      const category = isJrf ? 'jrf' : 'government';

      // Look for deadline date
      let deadline = null;
      const dateMatch = text.match(/(\d{2})[.\/](\d{2})[.\/](\d{4})/);
      if (dateMatch) {
        deadline = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
      }

      const existing = urlToOppMap.get(normalizedApplyUrl) || (orgTitleKey ? orgTitleToOppMap.get(orgTitleKey) : null);
      if (existing) {
        supabase.from('opportunities').update({
          title,
          verification_status: 'verified',
          is_active: true,
          posted_date: today,
        }).eq('id', existing.id);
        totalUpdated++;
      } else {
        const slug = cleanSlug(title, 'ISRO');
        supabase.from('opportunities').insert([{
          title,
          slug,
          organization_id: isroOrgId || null,
          category,
          location: 'Bengaluru / Sriharikota / Thiruvananthapuram, India',
          salary_range: isJrf ? '₹37,000/month + HRA (DST Scale)' : 'Level 10 (₹56,100 - ₹1,77,500)',
          deadline: deadline && deadline >= today ? deadline : null,
          eligibility: 'B.Tech / M.Tech in Electronics / ECE / Avionics / Instrumentation with valid GATE score',
          description: `Official recruitment notification by Indian Space Research Organisation (ISRO). Requisition circular published on official portal.`,
          apply_url: applyUrl,
          source_url: 'https://www.isro.gov.in/Careers.html',
          tags: ['ISRO', 'Space Electronics', 'Govt Job', 'JRF'],
          verification_status: 'verified',
          is_active: true,
          source_type: 'scraped',
          posted_date: today,
        }]).select('id').single();
        totalInserted++;
      }
    });
  }

  // -------------------------------------------------------------
  // E. CLEANUP / DEACTIVATE MALFORMED OR GENERIC NON-HARDWARE
  // -------------------------------------------------------------
  console.log('\nAuditing active records for non-hardware / malformed entries...');
  const { data: activeList } = await supabase
    .from('opportunities')
    .select('id, title, category, description, apply_url, source_url')
    .eq('is_active', true);

  let deactivatedCount = 0;
  for (const opp of activeList || []) {
    const title = opp.title || '';
    // Garbage titles
    if (title.length < 5 || /^(engineering learn more|learn more|apply now|view details|click here)$/i.test(title)) {
      await supabase.from('opportunities').update({ is_active: false, verification_status: 'rejected' }).eq('id', opp.id);
      deactivatedCount++;
      continue;
    }
    // Generic scholarships completely unrelated to hardware
    if (/scholarshiproar\.com/i.test(opp.apply_url || '') || /scholarshiproar\.com/i.test(opp.source_url || '')) {
      await supabase.from('opportunities').update({ is_active: false, verification_status: 'rejected' }).eq('id', opp.id);
      deactivatedCount++;
      continue;
    }
    // Field sales / HR / finance
    if (/\b(field sales engineer|account executive|corporate recruiter|tax analyst)\b/i.test(title)) {
      await supabase.from('opportunities').update({ is_active: false, verification_status: 'rejected' }).eq('id', opp.id);
      deactivatedCount++;
      continue;
    }
  }

  // -------------------------------------------------------------
  // F. RESOLVE MISSING ORGANIZATION IDs
  // -------------------------------------------------------------
  console.log('Resolving missing organization IDs...');
  const { data: unmapped } = await supabase
    .from('opportunities')
    .select('id, title, apply_url, source_url')
    .is('organization_id', null)
    .eq('is_active', true);

  for (const opp of unmapped || []) {
    const text = `${opp.title} ${opp.apply_url} ${opp.source_url}`.toLowerCase();
    let matchedId = null;
    if (text.includes('nasa')) matchedId = orgMap['nasa'] || null;
    if (text.includes('iit hyderabad')) matchedId = orgMap['iit-hyderabad'] || orgMap['iith'] || null;
    if (text.includes('isro')) matchedId = orgMap['isro'];
    if (text.includes('skyworks')) matchedId = orgMap['skyworks'];

    if (matchedId) {
      await supabase.from('opportunities').update({ organization_id: matchedId }).eq('id', opp.id);
    }
  }

  console.log('\n=== Ingestion & Reconciliation Summary ===');
  console.log(`Total Scraped Candidates: ${totalScraped}`);
  console.log(`Newly Inserted Opportunities: ${totalInserted}`);
  console.log(`Updated Existing Opportunities: ${totalUpdated}`);
  console.log(`Deactivated Non-Hardware / Malformed: ${deactivatedCount}`);

  // Final count
  const { count: finalActive } = await supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('is_active', true);
  console.log(`Final Active Opportunities in DB: ${finalActive}`);
}

main().catch(console.error);
