import { NextRequest } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { requireAdmin, serverError } from "@berojgardegreewala/api";
import { adminOpportunityUpdateSchema } from "@/lib/validation";
import { validateOrThrow } from "@/lib/validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try { await requireAdmin(request); }
  catch (e) { return e instanceof Response ? e : serverError(); }

  if (!isAdminConfigured) {
    return new Response(JSON.stringify({ error: "Database not configured" }), { status: 503, headers: { "Content-Type": "application/json" } });
  }

  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from("opportunities")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ opportunity: data }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Admin fetch opportunity error:", error);
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
    const updates = validateOrThrow(adminOpportunityUpdateSchema, body);

    const { data, error } = await supabaseAdmin
      .from("opportunities")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ opportunity: data }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Admin update opportunity error:", error);
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
      .from("opportunities")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Admin delete opportunity error:", error);
    return new Response(JSON.stringify({ error: "Failed to delete" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
