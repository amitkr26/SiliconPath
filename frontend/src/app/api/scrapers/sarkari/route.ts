import { NextRequest } from "next/server";
import { runScraperRoute } from "../utils";
import { scrapeSarkariTechnicalOpportunities } from "@/lib/scrapers/sarkari-scraper";

export async function GET(request: NextRequest) {
  return runScraperRoute(
    request,
    () => scrapeSarkariTechnicalOpportunities(),
    "Sarkari Result / Sarkari Exam Technical & PSU Scraper",
    ["Govt", "PSU", "Engineering", "Technical"]
  );
}
