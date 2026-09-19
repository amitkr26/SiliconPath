import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadEnv, isDbConfigured, isAdminConfigured } from "../config/env.js";

// Mirrors frontend/src/lib/supabase.ts:
//  - anon client  -> user-scoped queries + auth.getUser(token)
//  - admin client -> service role (server-side only, never exposed to the browser)
// Same Supabase instance(s) the Next.js app uses; no schema changes.

export interface DbClients {
  supabase: SupabaseClient | null;      // anon
  supabaseAdmin: SupabaseClient | null; // service role (DB1)
  supabase2Admin: SupabaseClient | null; // service role (DB2 social layer, optional)
}

export function createDbClients(): DbClients {
  const env = loadEnv();
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  return {
    supabase: isDbConfigured(env)
      ? createClient(env.supabaseUrl, env.supabaseAnonKey, options)
      : null,
    supabaseAdmin: isAdminConfigured(env)
      ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey, options)
      : null,
    supabase2Admin:
      env.supabase2Url && env.supabase2ServiceRoleKey
        ? createClient(env.supabase2Url, env.supabase2ServiceRoleKey, options)
        : null,
  };
}