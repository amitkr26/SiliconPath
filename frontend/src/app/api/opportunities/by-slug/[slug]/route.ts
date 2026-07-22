import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { mapDbOpportunityToClient } from "@/lib/utils";
import { serverError } from "@berojgardegreewala/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isAdminConfigured) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }

  try {
    const { slug } = await params;

    const { data, error } = await supabaseAdmin
      .from("opportunities")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      );
    }

    const mapped = mapDbOpportunityToClient(data);
    return NextResponse.json({ opportunity: mapped });
  } catch (error) {
    console.error("Error fetching opportunity:", error);
    return serverError("Failed to fetch opportunity");
  }
}