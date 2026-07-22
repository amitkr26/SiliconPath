import { NextRequest } from "next/server";
import { scrapeGlobalSemiconductor } from "@/lib/scrapers/global-semiconductor-scraper";
import { runScraperRoute } from "../utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return runScraperRoute(scrapeGlobalSemiconductor, "Global & India Semiconductor Companies Scraper", ["Semiconductor", "VLSI", "RTL", "Verification"]);
}
