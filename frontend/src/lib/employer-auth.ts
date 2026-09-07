import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { resolveCapabilities } from "@/lib/capabilities";
import type { User } from "@supabase/supabase-js";

export async function getAuthenticatedEmployerUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ") && supabaseAdmin) {
    const token = authHeader.replace("Bearer ", "").trim();
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (user) return user;
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return user;
  } catch {
    // Ignore cookie resolution errors
  }

  return null;
}

/**
 * Authoritative admin check: ONLY server-controlled app_metadata can grant admin.
 * user_metadata is client-writable in Supabase Auth and MUST NEVER be trusted for admin decisions.
 */
export function isUserAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  const appRole = user.app_metadata?.role;
  return appRole === "admin" || appRole === "super_admin";
}

/**
 * Authoritative employer check:
 * 1. Admin users (via server app_metadata) have full access.
 * 2. Server app_metadata with employer/provider role.
 * 3. Authoritative user_profiles.account_type in database.
 * 4. Non-admin employer/provider account_type in user_metadata (never grants admin).
 */
export async function isUserEmployer(user: User | null | undefined): Promise<boolean> {
  if (!user) return false;
  if (isUserAdmin(user)) return true;

  const appRole = user.app_metadata?.role;
  if (appRole === "employer" || appRole === "provider") return true;

  if (supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from("user_profiles")
      .select("account_type")
      .eq("id", user.id)
      .maybeSingle();
    const accountType = (data?.account_type || "").toLowerCase();
    if (accountType === "employer" || accountType === "provider" || accountType === "admin") {
      return true;
    }
  }

  const meta = user.user_metadata || {};
  const role = meta.account_type || meta.role;
  return role === "employer" || role === "provider";
}

export async function requireEmployerRole(request: NextRequest): Promise<User | null> {
  const user = await getAuthenticatedEmployerUser(request);
  if (!user) return null;

  const allowed = await isUserEmployer(user);
  if (allowed) return user;

  return null;
}
