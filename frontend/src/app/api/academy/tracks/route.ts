import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { serverError } from "@berojgardegreewala/api";

export async function GET() {
  if (!isAdminConfigured) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("learning_tracks")
      .select("*")
      .eq("is_published", true)
      .order("order_index", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ tracks: data || [] });
  } catch (error) {
    console.error("Error fetching tracks:", error);
    return serverError("Failed to fetch tracks");
  }
}