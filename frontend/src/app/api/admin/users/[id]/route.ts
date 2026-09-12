import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { apiError } from "@/lib/api-utils";

/** PATCH /api/admin/users/[id] — Ban, suspend, or reactivate a user */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const adminErr = await verifyAdmin(request);
  if (adminErr) return adminErr;

  const resolvedParams = params instanceof Promise ? await params : params;
  const userId = resolvedParams.id;

  let raw: Record<string, unknown>;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { action, reason } = raw as { action?: string; reason?: string };

  const validActions = ["activate", "suspend", "ban"];
  if (!action || !validActions.includes(action)) {
    return NextResponse.json({ error: `action must be one of: ${validActions.join(", ")}` }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (action === "activate") {
    updates.account_status = "active";
    updates.banned_at = null;
    updates.banned_reason = null;
  } else {
    updates.account_status = action === "ban" ? "banned" : "suspended";
    updates.banned_at = new Date().toISOString();
    updates.banned_reason = reason || null;
  }

  const { data, error } = await supabaseAdmin
    .from("user_profiles")
    .update(updates)
    .eq("id", userId)
    .select("id, username, display_name, account_status, banned_at, banned_reason")
    .single();

  if (error) return apiError(error, "admin-user-update");
  return NextResponse.json({ user: data });
}
