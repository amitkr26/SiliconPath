import { NextRequest } from "next/server";
import { runScraperRoute } from "../utils";
import { scrapeIndiaPSU } from "@/lib/scrapers/india-psu-scraper";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return runScraperRoute(
    request,
    scrapeIndiaPSU,
    "PSU Electronics Scraper (ECIL, ITI, RailTel, BSNL, BHEL, C-DOT)",
    ["PSU", "ECIL", "CDOT"]
  );
}

