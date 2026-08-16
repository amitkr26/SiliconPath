import { NextRequest, NextResponse } from "next/server";
import { runScraperRoute } from "../utils";
import { scrapeRailways } from "@/lib/scrapers/national-scrapers";

export async function GET(request: NextRequest) {
  return runScraperRoute(
    request,
    () => scrapeRailways(),
    "Railways Scraper (RDSO, Indian Railways, RVNL, DFCCIL, IRCON, CRIS)",
    ["Railways", "RDSO", "Kavach"]
  );
}
