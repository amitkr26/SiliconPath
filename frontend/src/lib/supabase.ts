import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const urlOk = supabaseUrl.startsWith("http");
const anonOk = supabaseAnonKey.length > 0;

export const isConfigured = urlOk && anonOk;
export const isAdminConfigured = urlOk && anonOk;

// ponytail: disable Next.js 14 global fetch caching on Supabase queries
const clientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    fetch: (url: any, options: any = {}) => fetch(url, { ...options, cache: "no-store" }),
  },
};

export const supabase = urlOk && anonOk
  ? createClient(supabaseUrl, supabaseAnonKey, clientOptions)
  : (null as any);
