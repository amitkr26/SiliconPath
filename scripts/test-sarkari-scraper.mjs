import { scrapeSarkariTechnicalOpportunities } from "../frontend/src/lib/scrapers/sarkari-scraper.ts";

async function testScraper() {
  console.log("Testing Sarkari Technical Scraper...");
  const items = await scrapeSarkariTechnicalOpportunities();
  console.log(`Successfully scraped ${items.length} technical opportunities:`);
  console.table(items.map(i => ({
    title: i.title.slice(0, 45) + "...",
    org: i.organization,
    category: i.category,
    deadline: i.deadline || "Ongoing",
    apply_link: i.apply_link.slice(0, 35) + "..."
  })));
}

testScraper().catch(console.error);
