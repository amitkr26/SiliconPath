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
import {
  scrapeGlobalResearchLabs,
  scrapeGlobalUniversities,
  scrapeTopSemiconductorCompanies,
  scrapeEdaAndEquipment
} from "@/lib/scrapers/global-master-scraper";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = (params.slug || "").toLowerCase().trim();

  // Route to matching category or global organization scraper
  const scraperFn = async () => {
    let results: any[] = [];
    
    // National Scrapers
    results = results.concat(await scrapeSpaceAndDefence(slug));
    results = results.concat(await scrapeScientificResearch(slug));
    results = results.concat(await scrapeElectronicsAndSemiconductor(slug));
    results = results.concat(await scrapePsuElectronics(slug));
    results = results.concat(await scrapeRailways(slug));
    results = results.concat(await scrapeUniversitiesAndInstitutes(slug));

    // Global Master Scrapers
    results = results.concat(await scrapeGlobalResearchLabs(slug));
    results = results.concat(await scrapeGlobalUniversities(slug));
    results = results.concat(await scrapeTopSemiconductorCompanies(slug));
    results = results.concat(await scrapeEdaAndEquipment(slug));

    return results;
  };

  return runScraperRoute(
    request,
    scraperFn,
    `Master Scraper API [${slug.toUpperCase()}]`,
    [slug.toUpperCase(), "Verified Global Master Opening"]
  );
}
