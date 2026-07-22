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
      .from("learning_tracks")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Track not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ track: data });
  } catch (error) {
    console.error("Error fetching track:", error);
    return serverError("Failed to fetch track");
  }
}