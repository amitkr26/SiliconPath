import { NextRequest, NextResponse } from "next/server";
import { requireCronOrAdmin, serverError } from "@berojgardegreewala/api";
import { isAdminConfigured } from "@/lib/supabase";
import { runOpportunityScrape } from "@/lib/scrapers/run-opportunity-scrape";

export const dynamic = "force-dynamic";

/**
 * P0.1: Vercel cron target for the REAL scraping pipeline.
 * Previously the 00:00 cron hit /api/scrapers/run-all, which drove the
 * fabricated scraper path (national-scrapers, SCRAPER_ALLOW_FABRICATED-gated,
 * returns [] in production) — a silent no-op since 2026-08-02.
 * Now: cron -> runOpportunityScrape() (real engine + RSS, dedupe, org
 * resolution, upsert). Fabricated scrapers remain dev-only.
 *
 * Guard: requireCronOrAdmin (fail-closed — missing CRON_SECRET => 403).
 * Admin UI triggers the same pipeline via POST with admin credentials.
 */
async function handle(request: NextRequest) {
  if (!isAdminConfigured) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    await requireCronOrAdmin(request);
  } catch (e) {
    return e instanceof Response ? e : serverError();
  }

  try {
    const result = await runOpportunityScrape();
    // Admin-compatible summary fields (admin UI reads totalScraped/insertedOrUpdated)
    return NextResponse.json({
      success: true,
      message: "Scrape complete",
      totalScraped: result.total_fetched,
      insertedOrUpdated: result.inserted,
      ...result,
    });
  } catch (error) {
    console.error("Error in scrape-opportunities cron:", error);
    return serverError("Failed to scrape");
  }
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
