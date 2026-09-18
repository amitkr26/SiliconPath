import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, serverError } from "@berojgardegreewala/api";
import { loadAuditDataset } from "@/lib/seo/data-loader";
import { runSiteAudit } from "@/lib/seo/engine";
import { CATEGORY_COPY } from "@/lib/seo/category-copy";
import { categoryUrl, locationUrl, LOCATION_SLUGS as LOCATIONS } from "@/lib/seo/registry";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try { await requireAdmin(request); }
  catch (e) { return e instanceof Response ? e : serverError(); }

  const requestedUrl = request.nextUrl.searchParams.get("url");
  const dataset = await loadAuditDataset({
    maxOpportunities: 60,
    maxOrganizations: 50,
    maxNews: 50,
  });

  const titles: Record<string, string> = {};
  const content: Record<string, string> = {};
  const h1: Record<string, string> = {};

  for (const slug of Object.keys(CATEGORY_COPY)) {
    const copy = CATEGORY_COPY[slug];
    if (!copy) continue;
    const url = categoryUrl(slug);
    titles[url] = copy.title;
    content[url] = `${copy.description} ${copy.subline}`;
    h1[url] = copy.h1;
  }

  // Location hubs: template titles/subsistence from the slug (mirrors the location page).
  for (const city of LOCATIONS) {
    const cityName = city
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
    const url = locationUrl(city);
    titles[url] = `VLSI & Semiconductor Jobs in ${cityName}`;
  }

  let result;
  try {
    result = runSiteAudit(dataset, { titles, content, h1 });
  } catch (err) {
    console.error("[Admin SEO audit error]", err);
    return new Response(JSON.stringify({ error: "Failed to run SEO audit" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  if (requestedUrl) {
    const report = result.reports.find((r) => r.url === requestedUrl);
    if (!report) {
      return new Response(JSON.stringify({ error: "URL not in audit set" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }
    return NextResponse.json({ summary: result.summary, report });
  }

  return NextResponse.json({
    summary: result.summary,
    reports: result.reports,
    cannibalizationClusters: result.cannibalizationClusters,
    dataQuality: dataset.quality,
  });
}