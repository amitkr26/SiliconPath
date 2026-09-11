import { NextRequest } from "next/server";
import { runScraperRoute } from "../utils";
import { scrapeCSIR } from "@/lib/scrapers/csir-scraper";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return runScraperRoute(
    request,
    scrapeCSIR,
    "Scientific Research Scraper (CSIR CEERI, NPL, CSIO, NAL)",
    ["Scientific Research", "CSIR"]
  );
}

