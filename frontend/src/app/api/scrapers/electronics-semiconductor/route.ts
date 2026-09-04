import { NextRequest } from "next/server";
import { runScraperRoute } from "../utils";
import { scrapeGlobalSemiconductor } from "@/lib/scrapers/global-semiconductor-scraper";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return runScraperRoute(
    request,
    scrapeGlobalSemiconductor,
    "Electronics & Semiconductor Scraper",
    ["Semiconductor", "Electronics", "VLSI"]
  );
}

