import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin-auth";
import { serverError } from "@berojgardegreewala/api";

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
    return serverError("Failed to fetch status");
  }
}