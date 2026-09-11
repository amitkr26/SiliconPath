import { NextRequest } from "next/server";
import { runScraperRoute } from "../utils";
import { scrapeSarkariTechnicalOpportunities } from "@/lib/scrapers/sarkari-scraper";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return runScraperRoute(
    request,
    scrapeSarkariTechnicalOpportunities,
    "Technical Opportunities Scraper",
    ["Govt", "Railways", "Technical"]
  );
}

