import { NextRequest } from "next/server";
import { runScraperRoute } from "../utils";
import { scrapeDRDO } from "@/lib/scrapers/drdo-scraper";
import { scrapeISRO } from "@/lib/scrapers/isro-scraper";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return runScraperRoute(
    request,
    async () => [...(await scrapeDRDO()), ...(await scrapeISRO())],
    "Space & Defence Scraper (DRDO, ISRO)",
    ["Space", "Defence", "DRDO", "ISRO"]
  );
}

