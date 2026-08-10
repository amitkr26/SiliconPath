import type { SupabaseClient } from "@supabase/supabase-js";
import type { Env } from "./config/env.js";

// Dependency container injected into createApp(). Tests provide fakes here so
// no production credentials are needed to run the test suite.
export interface Deps {
  env: Env;
  supabase: SupabaseClient | null;       // anon (auth.getUser, user-scoped)
  supabaseAdmin: SupabaseClient | null;  // service role (DB1 public reads)
  supabase2Admin: SupabaseClient | null; // service role (DB2 social layer)
}