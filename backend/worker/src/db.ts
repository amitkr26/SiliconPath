import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { WorkerEnv } from "./config.js";

export function createDbClient(env: WorkerEnv): SupabaseClient {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error(
      "[worker] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
    );
  }
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
