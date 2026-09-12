import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { apiError } from "@/lib/api-utils";

/** GET /api/admin/users — List users with optional status filter */
export async function GET(request: NextRequest) {
  const adminErr = await verifyAdmin(request);
  if (adminErr) return adminErr;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status"); // "active", "suspended", "banned", or null for all
  const search = searchParams.get("search");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  let query = supabaseAdmin
    .from("user_profiles")
    .select("id, email, username, display_name, avatar_url, account_type, account_status, banned_at, banned_reason, created_at", { count: "exact" });

  if (status) {
    query = query.eq("account_status", status);
  }
  if (search) {
    query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) return apiError(error, "admin-users-list");

  return NextResponse.json({ users: data || [], total: count || 0 });
}
