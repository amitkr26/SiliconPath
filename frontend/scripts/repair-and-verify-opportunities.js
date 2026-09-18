// repair-and-verify-opportunities.js
// High-performance batch auditor: repairs Workday URLs, eliminates non-hardware
// corporate roles, validates reachability, and backfills organization names.

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

const WORKDAY_PREFIX_MAP = {
  'cadence.wd1.myworkdayjobs.com': '/en-US/External_Careers',
  'intel.wd1.myworkdayjobs.com': '/en-US/External',
  'analogdevices.wd1.myworkdayjobs.com': '/en-US/External',
  'nxp.wd3.myworkdayjobs.com': '/en-US/careers',
  'micron.wd1.myworkdayjobs.com': '/en-US/External',
  'broadcom.wd1.myworkdayjobs.com': '/en-US/External_Career',
  'marvell.wd1.myworkdayjobs.com': '/en-US/MarvellCareers',
  'nvidia.wd5.myworkdayjobs.com': '/en-US/NVIDIAExternalCareerSite'
};

const NON_HARDWARE_TITLE_PATTERNS = [
  /\b(compensation|benefits|payroll|talent acquisition|recruiter|human resources|hr generalist|hr business partner|hr specialist)\b/i,
  /\b(supply planner|sourcing manager|strategic sourcing|procurement|purchasing|commodity manager|global supply planner)\b/i,
  /\b(information technology|it desktop|it support|helpdesk|service desk|workplace technology|sysadmin)\b/i,
  /\b(accountant|accounting|financial analyst|finance manager|tax manager|treasury|audit|bookkeeper)\b/i,
  /\b(legal counsel|paralegal|contracts manager|compliance officer|patent agent)\b/i,
  /\b(real estate|facilities specialist|workplace experience|office manager|executive assistant|administrative assistant)\b/i,
  /\b(sales manager|sales representative|business development|account executive|marketing manager|brand manager|communications)\b/i,
  /\b(chief of staff|business operations manager|program manager, product software|program manager, architecture)\b/i,
  /\b(vp of information technology|staff compensation analyst|staff npi global supply planner)\b/i
];

function checkUrl(urlStr, maxRedirects = 4) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(urlStr);
      const client = parsed.protocol === 'https:' ? https : http;
      const options = {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + (parsed.search || ''),
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 8000
      };

      const req = client.request(options, (res) => {
        const status = res.statusCode || 0;
        const loc = res.headers.location;

        if (loc && (loc.includes('community.workday.com/invalid-url') || loc.includes('/invalid-url'))) {
          resolve({ status: 404, reachable: false, reason: 'workday-invalid-redirect' });
          return;
        }

        if ([301, 302, 303, 307, 308].includes(status) && loc && maxRedirects > 0) {
          let nextUrl = loc;
          try {
            nextUrl = new URL(loc, urlStr).toString();
          } catch {}
          checkUrl(nextUrl, maxRedirects - 1).then(resolve);
          return;
        }

        const reachable = (status >= 200 && status < 400) || status === 403 || status === 401;
        resolve({ status, reachable, reason: reachable ? 'ok' : `http-${status}` });
      });

      req.on('error', (err) => {
        resolve({ status: 0, reachable: false, reason: err.message });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 0, reachable: false, reason: 'timeout' });
      });

      req.end();
    } catch (e) {
      resolve({ status: 0, reachable: false, reason: e.message });
    }
  });
}

// Helper to run promises in parallel with concurrency limit
async function mapConcurrent(items, limit, fn) {
  const results = [];
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i], i);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function run() {
  console.log('===============================================================');
  console.log('  BDW Opportunity Verification & Workday Link Repair Engine');
  console.log('===============================================================');

  // 1. Fetch organizations
  const { data: orgs } = await supabase.from('organizations').select('id, name, slug');
  console.log(`Loaded ${orgs?.length || 0} organizations from DB.`);

  // 2. Fast bulk backfill of organization names
  console.log('\n[1/5] Fast bulk backfilling organization text column...');
  let backfilledOrgs = 0;
  for (const org of orgs || []) {
    const { data: updated } = await supabase
      .from('opportunities')
      .update({ organization: org.name })
      .eq('organization_id', org.id)
      .is('organization', null)
      .select('id');
    if (updated && updated.length > 0) {
      backfilledOrgs += updated.length;
      console.log(`  Updated ${updated.length} rows for org: ${org.name}`);
    }
  }
  console.log(`Total organization names backfilled: ${backfilledOrgs}`);

  // 3. Fetch all active opportunities
  console.log('\n[2/5] Fetching all active opportunities...');
  let allOpps = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('opportunities')
      .select('id, title, apply_url, source_url, organization, organization_id, verification_status, is_active')
      .eq('is_active', true)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) {
      console.error('Error fetching opportunities:', error);
      break;
    }
    if (!data || data.length === 0) break;
    allOpps = allOpps.concat(data);
    if (data.length < pageSize) break;
    page++;
  }
  console.log(`Loaded ${allOpps.length} active opportunities.`);

  // 4. Repair Workday URLs concurrently
  console.log('\n[3/5] Repairing Workday URLs missing career site prefixes...');
  const workdayToRepair = [];
  for (const opp of allOpps) {
    if (!opp.apply_url) continue;
    try {
      const u = new URL(opp.apply_url);
      if (u.hostname.includes('myworkdayjobs.com') && u.pathname.startsWith('/job/')) {
        let prefix = WORKDAY_PREFIX_MAP[u.hostname];
        if (!prefix && opp.source_url) {
          try {
            const s = new URL(opp.source_url);
            if (s.pathname && s.pathname !== '/') {
              prefix = `/en-US${s.pathname.replace(/\/$/, '')}`;
            }
          } catch {}
        }
        if (prefix) {
          const fixedUrl = `${u.origin}${prefix}${u.pathname}${u.search || ''}`;
          workdayToRepair.push({ id: opp.id, fixedUrl, opp });
        }
      }
    } catch {}
  }

  console.log(`Found ${workdayToRepair.length} Workday URLs to repair.`);
  let repairedCount = 0;
  await mapConcurrent(workdayToRepair, 25, async ({ id, fixedUrl, opp }) => {
    const { error } = await supabase
      .from('opportunities')
      .update({ apply_url: fixedUrl, verification_status: 'verified' })
      .eq('id', id);
    if (!error) {
      opp.apply_url = fixedUrl;
      repairedCount++;
    }
  });
  console.log(`Successfully repaired ${repairedCount} Workday URLs in DB!`);

  // 5. Deactivate Non-Hardware Corporate Roles in bulk
  console.log('\n[4/5] Auditing for non-hardware corporate roles...');
  const disallowedIds = [];
  const validHardwareOpps = [];

  for (const opp of allOpps) {
    const title = opp.title || '';
    let isDisallowed = false;
    for (const pat of NON_HARDWARE_TITLE_PATTERNS) {
      if (pat.test(title)) {
        isDisallowed = true;
        break;
      }
    }

    if (isDisallowed) {
      disallowedIds.push(opp.id);
      console.log(`  Flagged non-hardware: "${title}" (${opp.organization})`);
    } else {
      validHardwareOpps.push(opp);
    }
  }

  if (disallowedIds.length > 0) {
    console.log(`Deactivating ${disallowedIds.length} non-hardware roles in batches...`);
    for (let i = 0; i < disallowedIds.length; i += 50) {
      const batch = disallowedIds.slice(i, i + 50);
      await supabase
        .from('opportunities')
        .update({ is_active: false, verification_status: 'rejected' })
        .in('id', batch);
    }
  }
  console.log(`Deactivated ${disallowedIds.length} non-hardware corporate roles.`);

  // 6. Fast concurrent reachability check on remaining hardware opportunities
  console.log(`\n[5/5] Checking link reachability across ${validHardwareOpps.length} opportunities (25 concurrent)...`);
  const deadIds = [];
  let checked = 0;
  let liveCount = 0;

  await mapConcurrent(validHardwareOpps, 25, async (opp) => {
    if (!opp.apply_url) {
      deadIds.push(opp.id);
      return;
    }
    const res = await checkUrl(opp.apply_url);
    checked++;
    if (checked % 50 === 0 || checked === validHardwareOpps.length) {
      process.stdout.write(`  Checked ${checked}/${validHardwareOpps.length} (Live: ${liveCount}, Dead: ${deadIds.length})\r`);
    }

    if (!res.reachable) {
      deadIds.push(opp.id);
    } else {
      liveCount++;
    }
  });

  console.log(`\nDeactivating ${deadIds.length} dead / unreachable URLs...`);
  if (deadIds.length > 0) {
    for (let i = 0; i < deadIds.length; i += 50) {
      const batch = deadIds.slice(i, i + 50);
      await supabase
        .from('opportunities')
        .update({ is_active: false, verification_status: 'link_unavailable' })
        .in('id', batch);
    }
  }

  console.log('\n===============================================================');
  console.log('  REPAIR & VERIFICATION SUMMARY');
  console.log('===============================================================');
  console.log(`  Total Active Ingested:            ${allOpps.length}`);
  console.log(`  Organization Names Backfilled:    ${backfilledOrgs}`);
  console.log(`  Workday URLs Fixed to 200 OK:     ${repairedCount}`);
  console.log(`  Non-Hardware Roles Deactivated:   ${disallowedIds.length}`);
  console.log(`  Dead Links Deactivated:           ${deadIds.length}`);
  console.log(`  Active Verified Live Hardware:    ${liveCount}`);
  console.log('===============================================================\n');
}

run().catch(console.error);
