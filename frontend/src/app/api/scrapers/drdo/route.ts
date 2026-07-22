import { NextRequest } from "next/server";
import { scrapeDRDO } from "@/lib/scrapers/drdo-scraper";
import { runScraperRoute } from "../utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return runScraperRoute(scrapeDRDO, "DRDO Vacancies Scraper", ["DRDO", "Defense", "Electronics", "JRF"]);
}
