/**
 * Automated Daily Scraper Service for BerojgarDegreeWala
 * Continuously runs daily automated scraping every 24 hours
 * Triggers India scrapers, Global scrapers, News scrapers, and link checkers.
 */

const cron = require("node-cron");

async function triggerScraper(endpoint, name) {
  try {
    console.log(`[${new Date().toISOString()}] 🚀 Triggering ${name} (${endpoint})...`);
    const res = await fetch(`http://localhost:3000${endpoint}`, {
      headers: { "x-cron-secret": process.env.CRON_SECRET || "berojgardegreewala-cron-2024-secret" }
    });
    if (res.ok) {
      const data = await res.json();
      console.log(`[${new Date().toISOString()}] ✅ ${name} completed:`, data);
    } else {
      console.error(`[${new Date().toISOString()}] ❌ ${name} failed with status:`, res.status);
    }
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ ${name} error:`, err.message);
  }
}

async function runAllScrapers() {
  console.log(`[${new Date().toISOString()}] 🔄 Starting Daily Automated Scraper Run...`);
  await triggerScraper("/api/cron/scrape-india", "India Opportunities Scraper");
  await triggerScraper("/api/cron/scrape-global", "Global Opportunities Scraper");
  await triggerScraper("/api/cron/scrape-news", "Semiconductor News Scraper");
  await triggerScraper("/api/cron/check-links", "Link Health Checker");
  console.log(`[${new Date().toISOString()}] 🎉 Daily Scraper Cycle Complete.`);
}

// Run immediately on boot
runAllScrapers();

// Schedule to run every day at midnight (00:00)
cron.schedule("0 0 * * *", () => {
  runAllScrapers();
});

console.log("⏰ Daily Scraper Service active. Scheduled every day at 00:00.");
