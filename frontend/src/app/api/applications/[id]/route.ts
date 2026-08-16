import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { applicationStatusUpdateSchema, validateOrThrow } from "@/lib/validation";

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

  // P0.5: whitelist status/notes (was any raw body → mass assignment /
  // invalid status values 400'ing on the live CHECK constraint).
  const body = await request.json();
  const updates = validateOrThrow(applicationStatusUpdateSchema, body);

  const { data, error } = await supabase
    .from("applications")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
  const { data, error } = await supabase
    .from("applications")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: "Application not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
