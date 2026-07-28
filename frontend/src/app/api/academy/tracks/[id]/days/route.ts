import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { FALLBACK_TRACKS } from "@/lib/academy/queries";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const targetTrack = FALLBACK_TRACKS.find(t => t.slug === id || t.id === id) || FALLBACK_TRACKS[0];

  if (isAdminConfigured && supabaseAdmin) {
    try {
      let actualTrackId = id;
      const { data: trackRow } = await supabaseAdmin
        .from("academy_tracks")
        .select("id")
        .or(`id.eq.${id},slug.eq.${id}`)
        .maybeSingle();

      if (trackRow?.id) {
        actualTrackId = trackRow.id;
      } else {
        const { data: legacyTrackRow } = await supabaseAdmin
          .from("learning_tracks")
          .select("id")
          .or(`id.eq.${id},slug.eq.${id}`)
          .maybeSingle();
        if (legacyTrackRow?.id) actualTrackId = legacyTrackRow.id;
      }

      let res = await supabaseAdmin
        .from("academy_days")
        .select("*")
        .eq("track_id", actualTrackId)
        .order("day_number", { ascending: true });

      if ((!res.data || res.data.length === 0) && actualTrackId !== id) {
        res = await supabaseAdmin
          .from("academy_days")
          .select("*")
          .eq("track_id", id)
          .order("day_number", { ascending: true });
      }

      if (res.data && res.data.length > 0) {
        return NextResponse.json(res.data);
      }
    } catch (err) {
      console.error("Error fetching days from DB:", err);
    }
  }

  const totalDays = targetTrack.estimated_days || 30;
  const fallbackDays = Array.from({ length: totalDays }, (_, i) => {
    const dayNum = i + 1;
    return {
      id: `${targetTrack.slug}-day-${dayNum}`,
      track_id: targetTrack.id,
      day_number: dayNum,
      title: `Day ${dayNum}: ${targetTrack.title} — Part ${dayNum}`,
      theory_summary: `Comprehensive module on ${targetTrack.title} focusing on core principles, RTL coding techniques, and practical industrial applications.`,
      key_concepts: [targetTrack.title, `Concept ${dayNum}`, "RTL Verification", "VLSI Design"],
      estimated_minutes: 45,
      practice_links: [],
    };
  });

  return NextResponse.json(fallbackDays);
}