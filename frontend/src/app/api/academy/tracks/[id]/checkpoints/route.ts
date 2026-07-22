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

    const { data, error } = await supabaseAdmin
      .from("track_assessments")
      .select("*")
      .eq("track_id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Checkpoint not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ checkpoint: data });
  } catch (error) {
    console.error("Error fetching checkpoint:", error);
    return serverError("Failed to fetch checkpoint");
  }
}