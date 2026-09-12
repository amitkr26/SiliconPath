import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { serverError } from "@berojgardegreewala/api";

/** POST /api/admin/scrape — Trigger scrape for specific sources or all active ones. */
export async function POST(request: NextRequest) {
  if (!await verifyAdmin(request)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { sourceIds } = body as { sourceIds?: string[] };

    let query = supabaseAdmin.from("scrape_sources").select("id, name, adapter").eq("is_active", true);
    if (sourceIds && sourceIds.length > 0) {
      query = query.in("id", sourceIds);
    }
    const { data: sources, error } = await query;
    if (error) throw error;

    if (!sources || sources.length === 0) {
      return NextResponse.json({ message: "No active sources to scrape", sources: [], count: 0 });
    }

    // Actually trigger the scrape pipeline in background (fire-and-forget).
    // The pipeline handles its own error logging to scrape_runs.
    import("@/lib/scrapers/run-opportunity-scrape").then(({ runOpportunityScrape }) => {
      runOpportunityScrape().catch((err) => console.error("[Admin scrape trigger]", err));
    }).catch((err) => console.error("[Admin scrape import]", err));

    return NextResponse.json({
      message: `Scrape triggered for ${sources.length} source(s)`,
      sources,
      count: sources.length,
    });
  } catch (error) {
    console.error("Admin scrape error:", error);
    return serverError("Failed to trigger scrape");
  }
}

/** PATCH /api/admin/scrape — Toggle source active/inactive status. */
export async function PATCH(request: NextRequest) {
  if (!await verifyAdmin(request)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { sourceId, isActive } = body as { sourceId?: string; isActive?: boolean };

    if (!sourceId || typeof isActive !== "boolean") {
      return NextResponse.json({ error: "sourceId and isActive required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("scrape_sources")
      .update({ is_active: isActive })
      .eq("id", sourceId)
      .select("id, name, is_active")
      .single();

    if (error) throw error;
    return NextResponse.json({ source: data });
  } catch (error) {
    console.error("Admin scrape toggle error:", error);
    return serverError("Failed to update source");
  }
}

/** GET /api/admin/scrape — List all scrape sources. */
export async function GET(request: NextRequest) {
  if (!await verifyAdmin(request)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("scrape_sources")
      .select("*")
      .order("last_scrape_at", { ascending: false, nullsFirst: true });

    if (error) throw error;

    return NextResponse.json({ sources: data || [] });
  } catch (error) {
    console.error("Admin scrape status error:", error);
    return serverError("Failed to fetch status");
  }
}