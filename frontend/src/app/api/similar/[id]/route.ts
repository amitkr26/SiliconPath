import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { serverError } from "@berojgardegreewala/api";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminConfigured) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const { data: current } = await supabaseAdmin
      .from("opportunities")
      .select("tags, id")
      .eq("id", params.id)
      .single();

    if (!current || !current.tags || current.tags.length === 0) {
      return NextResponse.json({ opportunities: [] });
    }

    const today = new Date().toISOString().split("T")[0];

    const { data: similar } = await supabaseAdmin
      .from("opportunities")
      .select("*")
      .eq("is_active", true)
      .neq("id", params.id)
      .or(`deadline.gte.${today},deadline.is.null`)
      .overlaps("tags", current.tags)
      .order("created_at", { ascending: false })
      .limit(3);

    return NextResponse.json({ opportunities: similar || [] });
  } catch (error) {
    console.error("Error fetching similar opportunities:", error);
    return serverError("Failed to fetch similar opportunities");
  }
}
