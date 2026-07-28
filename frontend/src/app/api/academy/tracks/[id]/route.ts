import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { FALLBACK_TRACKS } from "@/lib/academy/queries";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const fallbackTrack = FALLBACK_TRACKS.find(t => t.slug === id || t.id === id);

  if (isAdminConfigured && supabaseAdmin) {
    try {
      let { data } = await supabaseAdmin
        .from("academy_tracks")
        .select("*")
        .or(`id.eq.${id},slug.eq.${id}`)
        .maybeSingle();

      if (!data) {
        const res2 = await supabaseAdmin
          .from("learning_tracks")
          .select("*")
          .or(`id.eq.${id},slug.eq.${id}`)
          .maybeSingle();
        data = res2.data;
      }

      if (data) {
        return NextResponse.json(data);
      }
    } catch (err) {
      console.error("Error querying track DB:", err);
    }
  }

  if (fallbackTrack) {
    return NextResponse.json(fallbackTrack);
  }

  return NextResponse.json({ error: "Track not found" }, { status: 404 });
}