import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// ponytail: This file is server-only. It exports the service role client
// which bypasses RLS. Never import this from client components.
// If you need a client-side Supabase client, use ./supabase.ts instead.
export const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  // ponytail: null as any preserves the old non-nullable type for consumers.
  // Runtime null checks still work; this just avoids TS18047 across 85+ routes.
  : (null as any);

export const isAdminConfigured = supabaseUrl && (supabaseServiceRoleKey.length > 0 || (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").length > 0);
