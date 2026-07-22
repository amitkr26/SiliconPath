import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin, isConfigured } from "@/lib/supabase";
import { requireAdmin, serverError } from "@berojgardegreewala/api";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isConfigured) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ opportunity: data });
  } catch (error) {
    console.error("Error fetching opportunity:", error);
    return serverError("Failed to fetch opportunity");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isConfigured) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }

  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Admin access not configured." }, { status: 503 });
    }
    try { await requireAdmin(request); } catch (e) { return e instanceof Response ? e : serverError("Unauthorized"); }
    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from("opportunities")
      .update(body)
      .eq("id", params.id)
      .select();

    if (error) throw error;

    return NextResponse.json({ opportunity: data?.[0] });
  } catch (error) {
    console.error("Error updating opportunity:", error);
    return serverError("Failed to update opportunity");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isConfigured) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }

  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Admin access not configured." }, { status: 503 });
    }
    try { await requireAdmin(request); } catch (e) { return e instanceof Response ? e : serverError("Unauthorized"); }
    const { error } = await supabaseAdmin
      .from("opportunities")
      .delete()
      .eq("id", params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting opportunity:", error);
    return serverError("Failed to delete opportunity");
  }
}
