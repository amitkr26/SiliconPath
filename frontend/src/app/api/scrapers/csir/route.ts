import { NextRequest } from "next/server";
import { scrapeCSIR } from "@/lib/scrapers/csir-scraper";
import { runScraperRoute } from "../utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return runScraperRoute(scrapeCSIR, "CSIR Research Labs Scraper", ["CSIR", "Research", "Semiconductor", "JRF"]);
}
