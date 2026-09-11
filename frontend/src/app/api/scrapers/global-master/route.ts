import { NextRequest } from "next/server";
import { runScraperRoute } from "../utils";
import { scrapeGlobalSemiconductor } from "@/lib/scrapers/global-semiconductor-scraper";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return runScraperRoute(
    request,
    scrapeGlobalSemiconductor,
    "Global Semiconductor Scraper (Intel, Qualcomm, AMD, TSMC, Arm)",
    ["Global", "Semiconductor", "Foundry", "EDA", "Verified"]
  );
}

