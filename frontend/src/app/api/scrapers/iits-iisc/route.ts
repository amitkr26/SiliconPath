import { NextRequest } from "next/server";
import { runScraperRoute } from "../utils";
import { scrapeIndiaAcademic } from "@/lib/scrapers/india-academic-scraper";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return runScraperRoute(
    request,
    scrapeIndiaAcademic,
    "IITs & IISc Academic Scraper",
    ["IIT", "IISc", "PhD", "JRF", "Academia"]
  );
}

