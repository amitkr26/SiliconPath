import { NextRequest } from "next/server";
import { runScraperRoute } from "../utils";
import { scrapeDRDO } from "@/lib/scrapers/drdo-scraper";
import { scrapeISRO } from "@/lib/scrapers/isro-scraper";
import { scrapeCSIR } from "@/lib/scrapers/csir-scraper";
import { scrapeIndiaAcademic } from "@/lib/scrapers/india-academic-scraper";
import { scrapeIndiaPSU } from "@/lib/scrapers/india-psu-scraper";
import { scrapeGlobalSemiconductor } from "@/lib/scrapers/global-semiconductor-scraper";
import { scrapeSarkariTechnicalOpportunities } from "@/lib/scrapers/sarkari-scraper";
import { scrapeAllOpportunities } from "@/lib/scrapers/opportunity-scraper-impl";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = (params.slug || "").toLowerCase().trim();

  const scraperFn = async () => {
    switch (slug) {
      case "drdo":
        return scrapeDRDO();
      case "isro":
        return scrapeISRO();
      case "csir":
        return scrapeCSIR();
      case "academic":
      case "iit":
      case "iisc":
        return scrapeIndiaAcademic();
      case "psu":
        return scrapeIndiaPSU();
      case "semiconductor":
      case "vlsi":
        return scrapeGlobalSemiconductor();
      case "sarkari":
      case "railways":
        return scrapeSarkariTechnicalOpportunities();
      default:
        return (await scrapeAllOpportunities()).opportunities;
    }
  };

  return runScraperRoute(
    request,
    scraperFn,
    `Live Scraper Pipeline [${slug.toUpperCase()}]`,
    [slug.toUpperCase(), "Verified Live Opening"]
  );
}

