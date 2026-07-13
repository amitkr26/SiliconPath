import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { neon, NeonQueryFunction } from "@neondatabase/serverless";

export type DatabaseClient = SupabaseClient;
export type NeonClient = NeonQueryFunction<any, any>;

export interface DatabaseClients {
  db1: SupabaseClient | null;
  db2: SupabaseClient | null;
  neon1: NeonClient | null;
  neon2: NeonClient | null;
}

let _clients: DatabaseClients | null = null;

export function createDatabaseClients(): DatabaseClients {
  return {
    db1: createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
    db2: createSupabaseClient(
      process.env.SUPABASE_2_URL,
      process.env.SUPABASE_2_SERVICE_ROLE_KEY
    ),
    neon1: createNeonClient(process.env.NEON_1_DATABASE_URL),
    neon2: createNeonClient(process.env.NEON_2_DATABASE_URL),
  };
}

function createSupabaseClient(
  url: string | undefined,
  key: string | undefined
): SupabaseClient | null {
  if (!url || !key) return null;
  try {
    return createClient(url, key);
  } catch {
    return null;
  }
}

function createNeonClient(
  url: string | undefined
): NeonClient | null {
  if (!url) return null;
  try {
    return neon(url);
  } catch {
    return null;
  }
}

export function getClients(): DatabaseClients {
  if (!_clients) {
    _clients = createDatabaseClients();
  }
  return _clients;
}

export function resetClients(): void {
  _clients = null;
}

export type DbPurpose = "opportunities" | "news" | "social" | "analytics" | "cache";

export function getClientForPurpose(
  purpose: DbPurpose
): { type: "supabase"; client: SupabaseClient | null } | { type: "neon"; client: NeonClient | null } {
  const clients = getClients();
  switch (purpose) {
    case "opportunities":
    case "news":
      return { type: "supabase", client: clients.db1 };
    case "social":
      return { type: "supabase", client: clients.db2 };
    case "analytics":
      return { type: "neon", client: clients.neon1 };
    case "cache":
      return { type: "neon", client: clients.neon2 };
  }
}

export async function checkAllDatabases(): Promise<Record<string, string>> {
  const clients = getClients();
  const results: Record<string, string> = {};

  for (const [name, client] of Object.entries({
    supabase_primary: clients.db1,
    supabase_secondary: clients.db2,
    neon_primary: clients.neon1,
    neon_secondary: clients.neon2,
  })) {
    if (!client) {
      results[name] = "not_configured";
      continue;
    }
    try {
      if (name.startsWith("neon")) {
        const sql = client as NeonClient;
        await sql`SELECT 1`;
      } else {
        const { error } = await (client as SupabaseClient)
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
