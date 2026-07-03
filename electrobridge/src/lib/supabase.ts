import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const urlOk = supabaseUrl.startsWith("http");
const anonOk = supabaseAnonKey.length > 0;
const serviceOk = supabaseServiceRoleKey.length > 0;

export const isConfigured = urlOk && anonOk;
export const isAdminConfigured = urlOk && serviceOk;

export const supabase = urlOk && anonOk
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as any);

export const supabaseAdmin = urlOk && serviceOk
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : (null as any);
