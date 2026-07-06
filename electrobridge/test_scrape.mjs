import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const { getTraditionalScrapeSources } = await import('./src/lib/scrapers/opportunity-scraper-impl.ts');
const { scrapeAllOpportunities } = await import('./src/lib/scrapers/opportunity-scraper.ts');
const { supabaseAdmin } = await import('./src/lib/supabase.ts');

async function run() {
  console.log("Supabase Admin: ", !!supabaseAdmin);
  console.log("Starting scrape pipeline...");
  const { opportunities, results, total } = await scrapeAllOpportunities();
  console.log(`Scrape finished. Total scraped: ${total}`);
  results.forEach(r => {
    console.log(`- ${r.source}: Success=${r.success}, Count=${r.count}, Error=${r.error || 'none'}`);
  });
}

run().catch(console.error);
