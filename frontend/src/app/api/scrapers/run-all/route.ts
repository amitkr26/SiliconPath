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

export async function GET(request: NextRequest) {
  const allScraperFn = async () => {
    let all: any[] = [];
    all = all.concat(await scrapeSpaceAndDefence());
    all = all.concat(await scrapeScientificResearch());
    all = all.concat(await scrapeElectronicsAndSemiconductor());
    all = all.concat(await scrapePsuElectronics());
    all = all.concat(await scrapeRailways());
    all = all.concat(await scrapeUniversitiesAndInstitutes());
    return all;
  };

  return runScraperRoute(
    allScraperFn,
    "Master National Scraper Runner (80+ Institutions Across Space, Defence, CSIR, Semiconductor, Railways, IITs & IISc)",
    ["Master Sync", "National Scraper", "100% Verified"]
  );
}
