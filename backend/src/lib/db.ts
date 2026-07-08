import { createClient } from "@supabase/supabase-js";
import { neon } from "@neondatabase/serverless";
import { logger } from "./logger.js";

type SupabaseClientT = ReturnType<typeof createClient>;
type NeonClientT = ReturnType<typeof neon>;

function initSupabase(urlVar: string, keyVar: string, label: string): SupabaseClientT | null {
  const url = process.env[urlVar];
  const key = process.env[keyVar];
  if (!url || !key) {
    logger.error(`[DB] ${label} not configured: missing ${!url ? urlVar : keyVar}`);
    return null;
  }
  try {
    return createClient(url, key);
  } catch (e: unknown) {
    logger.error(`[DB] Failed to init ${label}:`, e instanceof Error ? e.message : e);
    return null;
  }
}

function initNeon(urlVar: string, label: string): NeonClientT | null {
  const url = process.env[urlVar];
  if (!url) {
    logger.error(`[DB] ${label} not configured: missing ${urlVar}`);
    return null;
  }
  try {
    return neon(url);
  } catch (e: unknown) {
    logger.error(`[DB] Failed to init ${label}:`, e instanceof Error ? e.message : e);
    return null;
  }
}

export const db1 = initSupabase("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "db1 (Supabase Primary)");
export const db2 = initSupabase("SUPABASE_2_URL", "SUPABASE_2_SERVICE_ROLE_KEY", "db2 (Supabase Secondary)");
export const neon1 = initNeon("NEON_1_DATABASE_URL", "neon1 (Neon Primary)");
export const neon2 = initNeon("NEON_2_DATABASE_URL", "neon2 (Neon Secondary)");

type DBPurpose = "opportunities" | "news" | "social" | "analytics" | "cache";

const PURPOSE_MAP: Record<
  DBPurpose,
  { type: "supabase" | "neon"; get: () => SupabaseClientT | NeonClientT | null; label: string }
> = {
  opportunities: { type: "supabase", get: () => db1, label: "db1 (Supabase Primary)" },
  news: { type: "supabase", get: () => db1, label: "db1 (Supabase Primary)" },
  social: { type: "supabase", get: () => db2, label: "db2 (Supabase Secondary)" },
  analytics: { type: "neon", get: () => neon1, label: "neon1 (Neon Primary)" },
  cache: { type: "neon", get: () => neon2, label: "neon2 (Neon Secondary)" },
};

/**
 * Returns a live DB handle for the given purpose.
 *
 * Fails LOUDLY: if the underlying connection is not configured this throws a
 * clear error rather than returning a null/undefined client that a caller might
 * silently skip over. (See docs/CODEBASE_AUDIT.md — "silent DB failure".)
 */
export function getDB(purpose: DBPurpose) {
  const entry = PURPOSE_MAP[purpose];
  const client = entry.get();
  if (!client) {
    throw new Error(
      `[DB] getDB("${purpose}") failed: ${entry.label} is not configured. Refusing to continue silently.`
    );
  }
  return { type: entry.type, client };
}

/**
 * Tests all four connections with a REAL query against a table/statement that
 * actually exists in each database (not just an env-var presence check).
 */
export async function checkDbHealth(): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  const supabaseChecks: Array<[string, SupabaseClientT | null, string]> = [
    ["supabase_primary", db1, "opportunities"],
    ["supabase_secondary", db2, "users"],
  ];
  for (const [name, client, table] of supabaseChecks) {
    if (!client) {
      results[name] = "not_configured";
      continue;
    }
    try {
      const { error } = await client.from(table).select("*", { count: "exact", head: true });
      if (error) throw error;
      results[name] = "ok";
    } catch (e) {
      logger.error(`[DB] Health check failed for ${name}:`, e instanceof Error ? e.message : e);
      results[name] = "error";
    }
  }

  const neonChecks: Array<[string, NeonClientT | null]> = [
    ["neon_primary", neon1],
    ["neon_secondary", neon2],
  ];
  for (const [name, sql] of neonChecks) {
    if (!sql) {
      results[name] = "not_configured";
      continue;
    }
    try {
      await sql`SELECT 1`;
      results[name] = "ok";
    } catch (e) {
      logger.error(`[DB] Health check failed for ${name}:`, e instanceof Error ? e.message : e);
      results[name] = "error";
    }
  }

  return results;
}
