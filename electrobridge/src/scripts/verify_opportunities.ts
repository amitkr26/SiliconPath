import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data: total } = await supabase
    .from('opportunities')
    .select('id', { count: 'exact' });
  console.log(`Total opportunities in DB: ${total?.length}`);

  const orgs = ['Intel', 'TSMC', 'Samsung Semiconductor', 'Micron Technology', 'SK Hynix', 'Texas Instruments', 'Analog Devices', 'NVIDIA', 'AMD', 'Qualcomm', 'Broadcom', 'ARM Holdings'];
  
  for (const org of orgs) {
    const { data: opps, count } = await supabase
      .from('opportunities')
      .select('title, apply_link', { count: 'exact' })
      .ilike('organization', `%${org}%`)
      .limit(2);
      
    console.log(`\nOrganization: ${org}`);
    console.log(`Count: ${count}`);
    if (opps && opps.length > 0) {
      console.log(`Samples:`);
      opps.forEach(o => console.log(` - ${o.title} (Link: ${o.apply_link || 'null'})`));
    }
  }
}

main().catch(console.error);
