import { NextRequest } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { requireAdmin, serverError } from "@berojgardegreewala/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try { await requireAdmin(request); }
  catch (e) { return e instanceof Response ? e : serverError(); }

  if (!isAdminConfigured || !supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Database not configured" }), { status: 503, headers: { "Content-Type": "application/json" } });
  }

  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from("organizations")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ organization: data }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Admin fetch organization error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try { await requireAdmin(request); }
  catch (e) { return e instanceof Response ? e : serverError(); }

  if (!isAdminConfigured || !supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Database not configured" }), { status: 503, headers: { "Content-Type": "application/json" } });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from("organizations")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ organization: data }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Admin update organization error:", error);
    return new Response(JSON.stringify({ error: "Failed to update" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try { await requireAdmin(request); }
  catch (e) { return e instanceof Response ? e : serverError(); }

  if (!isAdminConfigured || !supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Database not configured" }), { status: 503, headers: { "Content-Type": "application/json" } });
  }

  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from("organizations")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Admin delete organization error:", error);
    return new Response(JSON.stringify({ error: "Failed to delete" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
