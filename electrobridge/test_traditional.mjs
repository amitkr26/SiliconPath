import { scrapeIndiaPSU } from "./src/lib/scrapers/india-psu-scraper.js";
import { scrapeIndiaAcademic } from "./src/lib/scrapers/india-academic-scraper.js";
import "dotenv/config"; // Ensure .env is loaded

async function run() {
  console.log("Scraping India PSU...");
  const psu = await scrapeIndiaPSU();
  console.log(`PSU found: ${psu.length}`);

  console.log("Scraping India Academic...");
  const academic = await scrapeIndiaAcademic();
  console.log(`Academic found: ${academic.length}`);
}

run();
