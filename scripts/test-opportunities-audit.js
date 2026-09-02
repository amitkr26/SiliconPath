const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function auditOpportunities() {
  console.log('=== REALITY AUDIT: OPPORTUNITIES DATA INTELLIGENCE ===');

  // 1. Total opportunities
  const { count: totalCount, error: err1 } = await supabase
    .from('opportunities')
    .select('*', { count: 'exact', head: true });

  if (err1) {
    console.error('Failed to query opportunities table:', err1.message);
    return;
  }
  console.log('Total Opportunities in DB:', totalCount);

  // 2. Active vs Inactive
  const { count: activeCount } = await supabase
    .from('opportunities')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  console.log('Active Opportunities (is_active = true):', activeCount);
  console.log('Inactive Opportunities (is_active = false):', totalCount - activeCount);

  // 3. Sample 50 opportunities to inspect dates & organizations
  const { data: samples, error: err2 } = await supabase
    .from('opportunities')
    .select('id, title, organization, category, deadline, is_active, verification_status, source_url, apply_url, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (err2) {
    console.error('Error fetching sample opportunities:', err2.message);
    return;
  }

  const now = new Date();
  let pastDeadlines = 0;
  let futureDeadlines = 0;
  let nullDeadlines = 0;
  const orgCounts = {};
  const catCounts = {};

  for (const item of samples) {
    // Org
    const org = item.organization || 'Unspecified';
    orgCounts[org] = (orgCounts[org] || 0) + 1;

    // Category
    const cat = item.category || 'Unspecified';
    catCounts[cat] = (catCounts[cat] || 0) + 1;

    // Deadline analysis
    if (!item.deadline) {
      nullDeadlines++;
    } else {
      const d = new Date(item.deadline);
      if (isNaN(d.getTime())) {
        nullDeadlines++;
      } else if (d < now) {
        pastDeadlines++;
      } else {
        futureDeadlines++;
      }
    }
  }

  console.log('\n--- Sample 50 Opportunities Breakdown ---');
  console.log('Organizations:', orgCounts);
  console.log('Categories:', catCounts);
  console.log(`Deadlines: Future = ${futureDeadlines}, Past = ${pastDeadlines}, Null/Undated = ${nullDeadlines}`);

  // 4. Check specific target organizations
  const targets = ['DRDO', 'ISRO', 'CSIR', 'IIT Delhi', 'IIT Bombay', 'IIT Madras', 'IISc'];
  console.log('\n--- Target Organizations Count in DB ---');
  for (const t of targets) {
    const { count: orgCount } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .ilike('organization', `%${t}%`);
    console.log(`${t}: ${orgCount} records`);
  }
}

auditOpportunities().catch(console.error);
