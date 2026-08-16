import { NextRequest, NextResponse } from "next/server";
import { runScraperRoute } from "../utils";
import { scrapePsuElectronics } from "@/lib/scrapers/national-scrapers";

export async function GET(request: NextRequest) {
  return runScraperRoute(
    request,
    () => scrapePsuElectronics(),
    "PSU Electronics Scraper (ECIL, ITI, RailTel, BSNL, BHEL, C-DOT)",
    ["PSU", "ECIL", "CDOT"]
  );
}
