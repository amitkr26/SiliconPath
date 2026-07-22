import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { serverError } from "@berojgardegreewala/api";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isAdminConfigured) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabaseAdmin
      .from("resources")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category && category !== "All") {
      query = query.eq("category", category);
    }

    const { data, count, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      resources: data || [],
      count: data?.length || 0,
      total_count: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching resources:", error);
    return serverError("Failed to fetch resources");
  }
}