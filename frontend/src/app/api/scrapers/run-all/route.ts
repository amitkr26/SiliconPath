import { NextRequest, NextResponse } from "next/server";
import { runScraperRoute } from "../utils";
import {
  scrapeSpaceAndDefence,
  scrapeScientificResearch,
  scrapeElectronicsAndSemiconductor,
  scrapePsuElectronics,
  scrapeRailways,
  scrapeUniversitiesAndInstitutes
} from "@/lib/scrapers/national-scrapers";
import { scrapeSarkariTechnicalOpportunities } from "@/lib/scrapers/sarkari-scraper";

// QA audit: previously an unauthenticated GET-only route while the admin UI
// POSTed to it (405) and Vercel cron needed protection. Now GET (Vercel cron)
// and POST (admin UI) both run behind requireCronOrAdmin — enforced centrally
// inside the shared runScraperRoute (P0.6).
const allScraperFn = async () => {
  let all: any[] = [];
  all = all.concat(await scrapeSpaceAndDefence());
  all = all.concat(await scrapeScientificResearch());
  all = all.concat(await scrapeElectronicsAndSemiconductor());
  all = all.concat(await scrapePsuElectronics());
  all = all.concat(await scrapeRailways());
  all = all.concat(await scrapeUniversitiesAndInstitutes());
  all = all.concat(await scrapeSarkariTechnicalOpportunities());
  return all;
};

const run = (request: NextRequest) => {
  return runScraperRoute(
    request,
    allScraperFn,
    "Master National Scraper Runner (80+ Institutions Across Space, Defence, CSIR, Semiconductor, Railways, IITs & IISc)",
    ["Master Sync", "National Scraper", "100% Verified"]
  );
};

export async function GET(request: NextRequest) {
  return run(request);
}

export async function POST(request: NextRequest) {
  return run(request);
}
