import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * THE single database router. Every part of the app gets its connection through
 * getDB(purpose). No component may create a direct connection elsewhere.
 *
 * Design rules (see docs/DATABASE.md + ../GUARDRAILS_AND_LESSONS_LEARNED.md #4):
 *  - Fail LOUDLY: a missing env var or failed init throws a clear error. We never
 *    return null/undefined and let a caller silently skip the operation.
 *  - Default new tables to db1 (Primary) unless docs/DATABASE.md justifies otherwise.
 */

export type DBPurpose =
  | "core"       // db1: opportunities, news, companies, scraper_sources, users, community
  | "archive"    // db2: news_archive (>30d), overflow logs
  | "analytics"  // db3: ai_usage_log, scrape_logs, platform_analytics, cron_health
  | "replica";   // db4: opportunities_mirror, news_mirror (public read path)

type SupabaseHandle = { kind: "supabase"; client: SupabaseClient };
type NeonHandle = { kind: "neon"; sql: NeonQueryFunction<false, false> };
type DBHandle = SupabaseHandle | NeonHandle;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`[db] Missing required env var ${name}. Refusing to continue with a partial DB config.`);
  }
  return v;
}

let _db1: SupabaseClient | undefined;
let _db2: SupabaseClient | undefined;
let _neon1: NeonQueryFunction<false, false> | undefined;
let _neon2: NeonQueryFunction<false, false> | undefined;

function db1(): SupabaseClient {
  if (!_db1) {
    _db1 = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"));
  }
  return _db1;
}
function db2(): SupabaseClient {
  if (!_db2) {
    _db2 = createClient(requireEnv("SUPABASE_2_URL"), requireEnv("SUPABASE_2_SERVICE_ROLE_KEY"));
  }
  return _db2;
}
function neon1(): NeonQueryFunction<false, false> {
  if (!_neon1) _neon1 = neon(requireEnv("NEON_1_DATABASE_URL"));
  return _neon1;
}
function neon2(): NeonQueryFunction<false, false> {
  if (!_neon2) _neon2 = neon(requireEnv("NEON_2_DATABASE_URL"));
  return _neon2;
}

export function getDB(purpose: DBPurpose): DBHandle {
  switch (purpose) {
    case "core":
      return { kind: "supabase", client: db1() };
    case "archive":
      return { kind: "supabase", client: db2() };
    case "analytics":
      return { kind: "neon", sql: neon1() };
    case "replica":
      return { kind: "neon", sql: neon2() };
  }
}

/**
 * Tests all four connections with a REAL query (not just env presence).
 * Returns per-DB status; used by /api/health and `npm run db:health`.
 */
export async function checkDbHealth(): Promise<Record<DBPurpose, string>> {
  const out: Record<DBPurpose, string> = {
    core: "unknown",
    archive: "unknown",
    analytics: "unknown",
    replica: "unknown",
  };

  // core (db1): opportunities exists here
  try {
    const { client } = getDB("core") as SupabaseHandle;
    const { error } = await client.from("opportunities").select("id", { count: "exact", head: true });
    out.core = error ? "error" : "ok";
  } catch (e) {
    out.core = e instanceof Error && e.message.includes("Missing required env") ? "not_configured" : "error";
  }

  // archive (db2): news_archive exists here
  try {
    const { client } = getDB("archive") as SupabaseHandle;
    const { error } = await client.from("news_archive").select("id", { count: "exact", head: true });
    out.archive = error ? "error" : "ok";
  } catch (e) {
    out.archive = e instanceof Error && e.message.includes("Missing required env") ? "not_configured" : "error";
  }

  for (const p of ["analytics", "replica"] as const) {
    try {
      const { sql } = getDB(p) as NeonHandle;
      await sql`SELECT 1`;
      out[p] = "ok";
    } catch (e) {
      out[p] = e instanceof Error && e.message.includes("Missing required env") ? "not_configured" : "error";
    }
  }

  return out;
}
