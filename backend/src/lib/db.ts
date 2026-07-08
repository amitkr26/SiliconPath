import { createClient } from "@supabase/supabase-js";
import { neon } from "@neondatabase/serverless";
import { logger } from "./logger.js";

function getDb1() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  } catch (e: unknown) {
    logger.error("[DB] Failed to init db1:", e instanceof Error ? e.message : e);
    return null;
  }
}

function getDb2() {
  if (!process.env.SUPABASE_2_URL || !process.env.SUPABASE_2_SERVICE_ROLE_KEY) return null;
  try {
    return createClient(process.env.SUPABASE_2_URL, process.env.SUPABASE_2_SERVICE_ROLE_KEY);
  } catch (e: unknown) {
    logger.error("[DB] Failed to init db2:", e instanceof Error ? e.message : e);
    return null;
  }
}

function getNeon1() {
  if (!process.env.NEON_1_DATABASE_URL) return null;
  try {
    return neon(process.env.NEON_1_DATABASE_URL);
  } catch (e: unknown) {
    logger.error("[DB] Failed to init neon1:", e instanceof Error ? e.message : e);
    return null;
  }
}

function getNeon2() {
  if (!process.env.NEON_2_DATABASE_URL) return null;
  try {
    return neon(process.env.NEON_2_DATABASE_URL);
  } catch (e: unknown) {
    logger.error("[DB] Failed to init neon2:", e instanceof Error ? e.message : e);
    return null;
  }
}

export const db1 = getDb1();
export const db2 = getDb2();
export const neon1 = getNeon1();
export const neon2 = getNeon2();

export function getDB(
  purpose: "opportunities" | "news" | "social" | "analytics" | "cache"
) {
  switch (purpose) {
    case "opportunities":
    case "news":
      return { type: "supabase" as const, client: db1 };
    case "social":
      return { type: "supabase" as const, client: db2 };
    case "analytics":
      return { type: "neon" as const, client: neon1 };
    case "cache":
      return { type: "neon" as const, client: neon2 };
  }
}

export async function checkDbHealth(): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  for (const [name, client] of Object.entries({
    supabase_primary: db1,
    supabase_secondary: db2,
    neon_primary: neon1,
    neon_secondary: neon2,
  })) {
    if (!client) {
      results[name] = "not_configured";
      continue;
    }
    try {
      if (name.startsWith("neon")) {
        const sql = client as ReturnType<typeof neon>;
        await sql`SELECT 1`;
      } else {
        const { error } = await (client as ReturnType<typeof createClient>)
          .from("opportunities")
          .select("id", { count: "exact", head: true });
        if (error) throw error;
      }
      results[name] = "ok";
    } catch {
      results[name] = "error";
    }
  }
  return results;
}
