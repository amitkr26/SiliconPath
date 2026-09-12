import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";
function serverError(message: string) {
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminConfigured) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }

  try {
    const { id } = await params;

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isIdUuid = UUID_REGEX.test(id);
    let actualTrackId = isIdUuid ? id : null;

    if (!actualTrackId) {
      const { data: trackRow } = await supabaseAdmin
        .from("learning_tracks")
        .select("id")
        .eq("slug", id)
        .maybeSingle();

      if (trackRow?.id) actualTrackId = trackRow.id;
    }

    if (!actualTrackId || !UUID_REGEX.test(actualTrackId)) {
      return NextResponse.json(
        { error: "Track not found" },
        { status: 404 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("track_assessments")
      .select("*")
      .eq("track_id", actualTrackId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Assessment not found for this track" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching assessment:", error);
    return serverError("Failed to fetch assessment");
  }
}
