import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { applicationStatusUpdateSchema, validateOrThrow } from "@/lib/validation";
import { apiError } from "@/lib/api-utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = user.user_metadata?.role;
  if (role !== "employer" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify employer owns the opportunity associated with this application (prevents IDOR)
  if (role !== "admin") {
    const { data: appData, error: appErr } = await supabaseAdmin
      .from("applications")
      .select("id, opportunity_id, opportunity:opportunities(id, created_by)")
      .eq("id", params.id)
      .maybeSingle();

    if (appErr || !appData) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const oppOwner = (appData as any).opportunity?.created_by;
    if (oppOwner && oppOwner !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own the opportunity for this application" }, { status: 403 });
    }
  }

  // P0.5: whitelist status/notes (was any raw body → mass assignment /
  // invalid status values 400'ing on the live CHECK constraint).
  const body = await request.json();
  const updates = validateOrThrow(applicationStatusUpdateSchema, body);

  const { data, error } = await supabaseAdmin
    .from("applications")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .maybeSingle();

  if (error) return apiError(error, "applications-update");
  if (!data) return NextResponse.json({ error: "Application not found" }, { status: 404 });
  return NextResponse.json({ success: true, application: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // P0.5 IDOR: DELETE was unscoped — any authenticated user could delete any
  // application by id. Now owner-scoped; a non-owned id returns 404.
  const { data, error } = await supabaseAdmin
    .from("applications")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select();

  if (error) return apiError(error, "applications-delete");
  if (!data || data.length === 0) return NextResponse.json({ error: "Application not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
