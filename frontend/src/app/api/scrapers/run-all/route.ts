import { NextRequest, NextResponse } from "next/server";
import { scrapeDRDO } from "@/lib/scrapers/drdo-scraper";
import { scrapeISRO } from "@/lib/scrapers/isro-scraper";
import { scrapeCSIR } from "@/lib/scrapers/csir-scraper";
import { scrapeIndiaAcademic } from "@/lib/scrapers/india-academic-scraper";
import { scrapeGlobalSemiconductor } from "@/lib/scrapers/global-semiconductor-scraper";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const startTime = Date.now();
  const summary: Record<string, number> = {};

  try {
    const [drdo, isro, csir, iit, semi] = await Promise.all([
      scrapeDRDO().catch(() => []),
      scrapeISRO().catch(() => []),
      scrapeCSIR().catch(() => []),
      scrapeIndiaAcademic().catch(() => []),
      scrapeGlobalSemiconductor().catch(() => []),
    ]);

    summary["DRDO Vacancies"] = drdo.length;
    summary["ISRO Careers"] = isro.length;
    summary["CSIR Labs"] = csir.length;
    summary["IIT / IISc Research"] = iit.length;
    summary["Semiconductor Fabs & EDA"] = semi.length;

    const allScraped = [...drdo, ...isro, ...csir, ...iit, ...semi];
    let inserted = 0;

    for (const item of allScraped) {
      const applyUrl = item.apply_link || item.source_url;
      if (!item.title || !applyUrl) continue;

      const slug = (item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36)).slice(0, 100);
      const catMap: Record<string, string> = {
        "jrf": "jrf",
        "srf": "srf",
        "phd": "phd",
        "govt job": "government",
        "government": "government",
        "job": "job",
        "fellowship": "fellowship",
        "internship": "internship",
      };
      const cleanCat = catMap[(item.category || "jrf").toLowerCase()] || "jrf";

      const { error } = await supabaseAdmin
        .from("opportunities")
        .insert({
          title: item.title,
          category: cleanCat,
          location: item.location || "India",
          salary_range: item.stipend || null,
          deadline: item.deadline || null,
          eligibility: item.eligibility || null,
          description: item.description || item.title,
          apply_url: applyUrl,
          source_url: applyUrl,
          verification_status: "verified",
          is_active: true,
          slug,
          tags: item.tags || [item.organization || "Electronics", "Verified", "Official Portal"],
        });

      if (!error) inserted++;
    }

    return NextResponse.json({
      success: true,
      executionTimeMs: Date.now() - startTime,
      totalAuthenticScraped: allScraped.length,
      upsertedVerifiedCount: inserted,
      breakdown: summary,
    });
  } catch (err: any) {
    console.error("Master Scraper API Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
