import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { serverError } from "@berojgardegreewala/api";

// GET /api/academy/days/[trackId]/[dayNumber]
// Returns the content of a specific day within a track.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string; dayNumber: string }> }
) {
  if (!isAdminConfigured) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const { trackId, dayNumber } = await params;
    const day = parseInt(dayNumber, 10);

    if (isNaN(day) || day < 1) {
      return NextResponse.json({ error: "Invalid day number" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("learning_days")
      .select("*")
      .eq("track_id", trackId)
      .eq("day_number", day)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Day not found" }, { status: 404 });
    }

    return NextResponse.json({ day: data });
  } catch (error) {
    console.error("Error fetching academy day:", error);
    return serverError("Failed to fetch day content");
  }
}
