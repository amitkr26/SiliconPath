import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { serverError } from "@berojgardegreewala/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminConfigured) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const publishedOnly = searchParams.get("published") !== "false";

    let query = supabaseAdmin
      .from("learning_days")
      .select("*")
      .eq("track_id", id)
      .order("day_number", { ascending: true });

    if (publishedOnly) {
      // Only return days that have content
      query = query.not("theory_summary", "is", null);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ days: data || [] });
  } catch (error) {
    console.error("Error fetching track days:", error);
    return serverError("Failed to fetch days");
  }
}