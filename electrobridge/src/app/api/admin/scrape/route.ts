import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { sourceIds } = body;

    const sources = await supabaseAdmin
      .from("scraper_sources")
      .select("*")
      .eq("is_active", true);

    if (sourceIds && sourceIds.length > 0) {
      sources.in("id", sourceIds);
    }

    const { data, error } = await sources;

    if (error) throw error;

    return NextResponse.json({
      message: "Scrape triggered",
      sources: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error("Admin scrape error:", error);
    return NextResponse.json({ error: "Failed to trigger scrape" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("scraper_sources")
      .select("*")
      .order("last_scraped_at", { ascending: false, nullsFirst: true });

    if (error) throw error;

    return NextResponse.json({ sources: data || [] });
  } catch (error) {
    console.error("Admin scrape status error:", error);
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}