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

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = (params.slug || "").toLowerCase().trim();

  // Route to matching category scraper
  const scraperFn = async () => {
    let results: any[] = [];
    
    results = results.concat(await scrapeSpaceAndDefence(slug));
    results = results.concat(await scrapeScientificResearch(slug));
    results = results.concat(await scrapeElectronicsAndSemiconductor(slug));
    results = results.concat(await scrapePsuElectronics(slug));
    results = results.concat(await scrapeRailways(slug));
    results = results.concat(await scrapeUniversitiesAndInstitutes(slug));

    return results;
  };

  return runScraperRoute(
    scraperFn,
    `Individual Scraper API [${slug.toUpperCase()}]`,
    [slug.toUpperCase(), "Official Scraped Opening"]
  );
}
