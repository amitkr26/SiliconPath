import { NextRequest, NextResponse } from "next/server";
import { runScraperRoute } from "../utils";
import { scrapeElectronicsAndSemiconductor } from "@/lib/scrapers/national-scrapers";

export async function GET(request: NextRequest) {
  return runScraperRoute(
    () => scrapeElectronicsAndSemiconductor(),
    "Electronics & Semiconductor Scraper (C-DAC, SAMEER, SCL Mohali, MeitY, ISM)",
    ["Semiconductor", "Electronics", "C-DAC", "SCL Mohali"]
  );
}
