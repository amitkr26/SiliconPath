import { NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { FALLBACK_TRACKS } from "@/lib/academy/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ tracks: FALLBACK_TRACKS });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("learning_tracks")
      .select("*")
      .order("order_index", { ascending: true });

    if (error || !data || data.length === 0) {
      return NextResponse.json({ tracks: FALLBACK_TRACKS });
    }

    return NextResponse.json({ tracks: data });
  } catch (err) {
    console.error("Error fetching tracks:", err);
    return NextResponse.json({ tracks: FALLBACK_TRACKS });
  }
}