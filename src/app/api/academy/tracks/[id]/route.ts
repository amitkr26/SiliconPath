import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";
import { FALLBACK_TRACKS } from "@/lib/academy/queries";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const fallbackTrack = FALLBACK_TRACKS.find(t => t.slug === id || t.id === id);

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isUuid = UUID_REGEX.test(id);

  if (isAdminConfigured && supabaseAdmin) {
    try {
      let query1 = supabaseAdmin.from("learning_tracks").select("*");
      query1 = isUuid ? query1.or(`id.eq.${id},slug.eq.${id}`) : query1.eq("slug", id);
      let { data } = await query1.maybeSingle();

      if (!data) {
        let query2 = supabaseAdmin.from("academy_tracks").select("*");
        query2 = isUuid ? query2.or(`id.eq.${id},slug.eq.${id}`) : query2.eq("slug", id);
        const res2 = await query2.maybeSingle();
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