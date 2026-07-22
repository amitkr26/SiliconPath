import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { serverError } from "@berojgardegreewala/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isAdminConfigured) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const { slug } = await params;

    const { data, error } = await supabaseAdmin
      .from("organizations")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({ organization: data });
  } catch (error) {
    console.error("Error fetching organization:", error);
    return serverError("Failed to fetch organization");
  }
}