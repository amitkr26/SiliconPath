import { NextRequest } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { requireAdmin, serverError } from "@berojgardegreewala/api";
import { adminOpportunityUpdateSchema, mapAdminOpportunityColumns } from "@/lib/validation";
import { validateOrThrow } from "@/lib/validation";
import { resolveOrganizationId } from "@/lib/scrapers/run-opportunity-scrape";

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
    const { data, error } = await supabaseAdmin!.from("opportunities").select("*").eq("id", id).single();
    if (error || !data) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
    return new Response(JSON.stringify({ opportunity: data }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Admin fetch opportunity error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

// Phase 30D: Action router setting normalized verification_status, lifecycle_status, and derived is_active
const LIFECYCLE_ACTIONS: Record<string, Record<string, unknown>> = {
  approve:     { verification_status: "verified",         lifecycle_status: "active",      is_active: true  },
  reject:      { verification_status: "rejected",         lifecycle_status: "archived",    is_active: false },
  archive:     { verification_status: "expired",          lifecycle_status: "archived",    is_active: false },
  mark_broken: { verification_status: "link_unavailable", lifecycle_status: "broken_link", is_active: false },
  reactivate:  { verification_status: "pending",          lifecycle_status: "active",      is_active: true  },
};

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
    const { action } = body;

    // Phase 30D: action-based lifecycle path
    if (action) {
      const patch = LIFECYCLE_ACTIONS[action];
      if (!patch) {
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}. Valid: ${Object.keys(LIFECYCLE_ACTIONS).join(", ")}` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const extra: Record<string, unknown> = {};
      if (typeof body.audit_notes === "string")  extra.audit_notes   = body.audit_notes;
      if (typeof body.quality_score === "number") extra.quality_score = body.quality_score;

      const { data: updated, error: updateErr } = await supabaseAdmin
        .from("opportunities")
        .update({ ...patch, ...extra, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (updateErr) throw updateErr;

      // Audit log — silent fail if table doesn't exist yet (pre-migration)
      try {
        await supabaseAdmin.from("audit_logs").insert({
          action: `opportunity.${action}`,
          resource_type: "opportunity",
          resource_id: id,
          metadata: { new_state: patch, notes: body.audit_notes ?? null },
        });
      } catch { /* non-fatal */ }

      return new Response(
        JSON.stringify({ opportunity: updated, action, success: true }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Legacy field-update path
    const data = validateOrThrow(adminOpportunityUpdateSchema, body);
    const { data: orgRows } = await supabaseAdmin.from("organizations").select("id, name, slug, website");
    const orgId = await resolveOrganizationId(
      { title: data.title ?? "", organization: (data as any).organization, tags: data.tags },
      orgRows ?? []
    );
    const columns = mapAdminOpportunityColumns(data);

    const { data: updated, error } = await supabaseAdmin
      .from("opportunities")
      .update({ ...columns, ...(orgId ? { organization_id: orgId } : {}), updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    return new Response(JSON.stringify({ opportunity: updated }), { headers: { "Content-Type": "application/json" } });
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
    const { error } = await supabaseAdmin.from("opportunities").delete().eq("id", id);
    if (error) throw error;

    try {
      await supabaseAdmin.from("audit_logs").insert({
        action: "opportunity.delete",
        resource_type: "opportunity",
        resource_id: id,
        metadata: {},
      });
    } catch { /* non-fatal */ }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Admin delete opportunity error:", error);
    return new Response(JSON.stringify({ error: "Failed to delete" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
