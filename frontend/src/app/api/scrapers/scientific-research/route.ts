import { NextRequest, NextResponse } from "next/server";
import { runScraperRoute } from "../utils";
import { scrapeScientificResearch } from "@/lib/scrapers/national-scrapers";

export async function GET(request: NextRequest) {
  return runScraperRoute(
    () => scrapeScientificResearch(),
    "Scientific Research Scraper (CSIR CEERI, NPL, CSIO, NAL, TIFR, NCBS)",
    ["Scientific Research", "CSIR", "TIFR"]
  );
}
