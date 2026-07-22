import { NextRequest } from "next/server";
import { scrapeIndiaAcademic } from "@/lib/scrapers/india-academic-scraper";
import { runScraperRoute } from "../utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return runScraperRoute(scrapeIndiaAcademic, "IIT / IISc Academic Scraper", ["IIT", "IISc", "Academia", "VLSI", "PhD"]);
}
