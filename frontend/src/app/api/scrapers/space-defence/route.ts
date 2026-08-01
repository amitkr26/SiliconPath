import { NextRequest, NextResponse } from "next/server";
import { runScraperRoute } from "../utils";
import { scrapeSpaceAndDefence } from "@/lib/scrapers/national-scrapers";

export async function GET(request: NextRequest) {
  return runScraperRoute(
    () => scrapeSpaceAndDefence(),
    "Space & Defence Scraper (DRDO, ISRO, BARC, DAE, HAL, BEL, BDL)",
    ["Space", "Defence", "DRDO", "ISRO"]
  );
}
