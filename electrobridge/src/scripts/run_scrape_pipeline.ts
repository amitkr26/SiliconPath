import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { scrapeAllOpportunities } from '../lib/scrapers/opportunity-scraper';

async function main() {
  console.log("Starting scrape pipeline...");
  const { opportunities, results, total, run_ids } = await scrapeAllOpportunities();
  console.log(`Scrape finished. Total scraped: ${total}`);
  console.log("Opportunities:", opportunities.length);
  console.log("Results summary:");
  results.forEach(r => {
    console.log(`- ${r.source}: Success=${r.success}, Count=${r.count}, Error=${r.error || 'none'}`);
  });

  const { supabaseAdmin } = await import('../lib/supabase');
  if (!supabaseAdmin) {
    console.error("Supabase Admin not configured, skipping insertion.");
    return;
  }

  const { cleanTitle, normalizeUrl } = await import('../lib/scrapers/utils');
  let oppInserted = 0;
  let oppSkipped = 0;

  for (const opp of opportunities) {
    if (!opp.source_url) { oppSkipped++; continue; }
    
    const cleanedTitle = cleanTitle(opp.title, opp.organization);
    const normalizedUrl = normalizeUrl(opp.source_url);

    const { data: existingUrl } = await supabaseAdmin
      .from("opportunities")
      .select("id")
      .or(`source_url.eq."${opp.source_url.replace(/"/g, '""')}",source_url.eq."${normalizedUrl.replace(/"/g, '""')}"`)
      .maybeSingle();

    const { data: existingTitle } = await supabaseAdmin
      .from("opportunities")
      .select("id")
      .ilike("title", cleanedTitle)
      .maybeSingle();

    if (existingUrl || existingTitle) {
      oppSkipped++;
      continue;
    }

    const { error } = await supabaseAdmin
      .from("opportunities")
      .insert([{
        title: cleanedTitle,
        organization: opp.organization,
        category: opp.category,
        location: opp.location,
        stipend: opp.stipend,
        deadline: opp.deadline,
        eligibility: opp.eligibility,
        description: opp.description,
        apply_link: opp.apply_link,
        source_url: normalizedUrl,
        tags: opp.tags,
        verification_status: "verified",
        is_active: true,
      }]);
      
    if (!error) oppInserted++;
    else oppSkipped++;
  }
  
  console.log(`Insertion complete. Inserted: ${oppInserted}, Skipped/Duplicates: ${oppSkipped}`);
}

main().catch(console.error);
