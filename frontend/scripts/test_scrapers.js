const fetch = require("node-fetch");

async function testScraperEndpoints() {
  console.log("Testing National Scraper API Endpoints...");

  const endpoints = [
    "http://localhost:3000/api/scrapers/drdo",
    "http://localhost:3000/api/scrapers/isro",
    "http://localhost:3000/api/scrapers/cdac",
    "http://localhost:3000/api/scrapers/space-defence",
    "http://localhost:3000/api/scrapers/scientific-research",
    "http://localhost:3000/api/scrapers/electronics-semiconductor",
    "http://localhost:3000/api/scrapers/psu-electronics",
    "http://localhost:3000/api/scrapers/railways",
    "http://localhost:3000/api/scrapers/iits-iisc"
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep);
      const json = await res.json();
      console.log(`[${ep}] Status: ${res.status} | Inserted/Updated: ${json.insertedOrUpdated} | Scraper: ${json.scraper}`);
    } catch (err) {
      console.error(`[${ep}] Error:`, err.message);
    }
  }
}

testScraperEndpoints();
