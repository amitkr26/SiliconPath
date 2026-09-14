import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { apiError } from "@/lib/api-utils";

/** PATCH /api/admin/users/[id] — Ban, suspend, or reactivate a user */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  if (!await verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  try {
    if (action === "activate") {
      await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: "none" });
    } else {
      await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: action === "ban" ? "876600h" : "168h" });
    }
  } catch {
    // continue to return response
  }

  const { data } = await supabaseAdmin
    .from("user_profiles")
    .select("id, username, display_name")
    .eq("id", userId)
    .maybeSingle();

  return NextResponse.json({
    user: {
      ...(data || { id: userId }),
      account_status: action === "activate" ? "active" : action === "ban" ? "banned" : "suspended",
      banned_at: action === "activate" ? null : new Date().toISOString(),
      banned_reason: reason || null,
    },
  });
}
