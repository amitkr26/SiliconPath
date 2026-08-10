import "dotenv/config";

// Loaded once at boot. All env access goes through this module so tests can
// set process.env before importing.

export interface Env {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  supabase2Url: string;
  supabase2ServiceRoleKey: string;
  allowedOrigins: string[];
  adminPassword: string;
  adminHmacSecret: string;
  port: number;
  nodeEnv: string;
}

function csv(value: string | undefined, fallback: string[]): string[] {
  return value
    ? value.split(",").map((s) => s.trim()).filter(Boolean)
    : fallback;
}

export function loadEnv(): Env {
  return {
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    supabase2Url: process.env.SUPABASE_2_URL || "",
    supabase2ServiceRoleKey: process.env.SUPABASE_2_SERVICE_ROLE_KEY || "",
    allowedOrigins: csv(process.env.ALLOWED_ORIGINS, ["http://localhost:3000"]),
    adminPassword: process.env.ADMIN_PASSWORD || "",
    adminHmacSecret: process.env.ADMIN_HMAC_SECRET || "",
    port: parseInt(process.env.PORT || "8080", 10),
    nodeEnv: process.env.NODE_ENV || "development",
  };
}

export const isDbConfigured = (env: Env): boolean =>
  env.supabaseUrl.startsWith("http") && env.supabaseAnonKey.length > 0;

export const isAdminConfigured = (env: Env): boolean =>
  env.supabaseUrl.startsWith("http") && env.supabaseServiceRoleKey.length > 0;