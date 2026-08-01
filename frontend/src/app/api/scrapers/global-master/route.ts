import { NextRequest, NextResponse } from "next/server";
import { runScraperRoute } from "../utils";
import {
  scrapeGlobalResearchLabs,
  scrapeGlobalUniversities,
  scrapeTopSemiconductorCompanies,
  scrapeEdaAndEquipment
} from "@/lib/scrapers/global-master-scraper";

export async function GET(request: NextRequest) {
  const masterGlobalScraper = async () => {
    let all: any[] = [];
    all = all.concat(await scrapeGlobalResearchLabs());
    all = all.concat(await scrapeGlobalUniversities());
    all = all.concat(await scrapeTopSemiconductorCompanies());
    all = all.concat(await scrapeEdaAndEquipment());
    return all;
  };

  return runScraperRoute(
    masterGlobalScraper,
    "Global Master Scraper Runner (NASA, CERN, IMEC, TSMC, NVIDIA, Intel, AMD, ARM, Synopsys, Cadence, ASML)",
    ["Global Master", "Semiconductor", "Foundry", "EDA", "Verified"]
  );
}
