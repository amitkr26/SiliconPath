import { NextRequest, NextResponse } from "next/server";
import { runScraperRoute } from "../utils";
import { scrapeUniversitiesAndInstitutes } from "@/lib/scrapers/national-scrapers";

export async function GET(request: NextRequest) {
  return runScraperRoute(
    () => scrapeUniversitiesAndInstitutes(),
    "IITs & IISc Scraper (IIT Bombay, IIT Madras, IIT Delhi, IISc Bangalore, IISERs)",
    ["IIT", "IISc", "PhD", "JRF"]
  );
}
