import { NextRequest } from "next/server";
import { scrapeISRO } from "@/lib/scrapers/isro-scraper";
import { runScraperRoute } from "../utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return runScraperRoute(scrapeISRO, "ISRO Careers Scraper", ["ISRO", "Space", "Avionics", "Electronics"]);
}
