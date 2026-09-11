import { NextRequest } from "next/server";
import { runScraperRoute } from "../utils";
import { scrapeAllOpportunities } from "@/lib/scrapers/opportunity-scraper-impl";

export const dynamic = "force-dynamic";

const run = (request: NextRequest) => {
  return runScraperRoute(
    request,
    async () => (await scrapeAllOpportunities()).opportunities,
    "Master Live Opportunities Scraper Runner",
    ["Master Sync", "Verified Live"]
  );
};

export async function GET(request: NextRequest) {
  return run(request);
}

export async function POST(request: NextRequest) {
  return run(request);
}

