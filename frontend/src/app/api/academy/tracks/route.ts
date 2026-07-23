import { NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { FALLBACK_TRACKS } from "@/lib/academy/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ tracks: FALLBACK_TRACKS });
  }

  try {
    let data: any[] | null = null;
    let error: any = null;

    const res1 = await supabaseAdmin
      .from("academy_tracks")
      .select("*")
      .order("order_index", { ascending: true });

    if (!res1.error && res1.data && res1.data.length > 0) {
      data = res1.data;
    } else {
      const res2 = await supabaseAdmin
        .from("learning_tracks")
        .select("*")
        .order("order_index", { ascending: true });
      data = res2.data;
      error = res2.error;
    }

    if (error || !data || data.length === 0) {
      return NextResponse.json({ tracks: FALLBACK_TRACKS });
    }

    return NextResponse.json({ tracks: data });
  } catch (err) {
    console.error("Error fetching tracks:", err);
    return NextResponse.json({ tracks: FALLBACK_TRACKS });
  }
}