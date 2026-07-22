import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";

/**
 * ponytail: Shared scraper runner that executes a scraper function,
 * normalizes opportunity items, and upserts them into Supabase.
 * Keeps individual scraper API routes to under 15 lines of clean code.
 */
export async function runScraperRoute(
  scraperFn: () => Promise<any[]>,
  scraperName: string,
  defaultTags: string[]
) {
  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const scraped = await scraperFn();
    let inserted = 0;

    for (const item of scraped) {
      if (!item.title) continue;
      const applyUrl = item.apply_link || item.source_url || "https://drdo.gov.in/drdo/careers";
      const slug = (item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36)).slice(0, 100);

      const { error } = await supabaseAdmin
        .from("opportunities")
        .insert({
          title: item.title,
          category: (item.category || "jrf").toLowerCase() === "govt job" ? "government" : (item.category || "jrf").toLowerCase(),
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
          tags: item.tags || defaultTags,
        });

      if (!error) inserted++;
    }

    return NextResponse.json({
      success: true,
      scraper: scraperName,
      totalScraped: scraped.length,
      insertedOrUpdated: inserted,
      sample: scraped.slice(0, 3),
    });
  } catch (err: any) {
    console.error(`${scraperName} API Error:`, err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
