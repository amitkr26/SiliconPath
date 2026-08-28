import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase";
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

export async function requireEmployerRole(request: NextRequest): Promise<User | null> {
  const user = await getAuthenticatedEmployerUser(request);
  if (!user) return null;

  // Check user_metadata.role or user_metadata.account_type for employer/admin
  const meta = user.user_metadata || {};
  const role = meta.role || meta.account_type;
  if (role === "employer" || role === "provider" || role === "admin") {
    return user;
  }

  return null;
}
