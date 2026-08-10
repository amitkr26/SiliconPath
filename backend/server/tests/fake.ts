import type { SupabaseClient } from "@supabase/supabase-js";

// Minimal chainable fake Supabase client. Chain methods (select, eq, order,
// range, ilike, not, insert, ...) return the same thenable, so `await query`
// resolves to { data, error, count } canned per table. maybeSingle/single
// return the first row or null. select(cols) filters returned objects to the
// requested columns — so repositories that forget a private column in their
// SELECT actually get caught by tests.

function filterColumns(data: unknown, columns?: string[]): unknown {
  if (!columns || data == null) return data;
  const pick = (obj: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(obj).filter(([k]) => columns.includes(k)));
  return Array.isArray(data) ? data.map(pick) : pick(data as Record<string, unknown>);
}

function parseSelect(arg: unknown, prev: string[] | undefined): string[] | undefined {
  const str = String(arg ?? "");
  if (str.includes("*")) return prev; // wildcard/nested join: keep all columns
  const cols = str.split(",").map((s) => s.trim()).filter((s) => s && !s.includes("("));
  return cols.length ? cols : prev;
}

function chain(data: unknown, error: unknown = null, count?: number, columns?: string[]): any {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "then") {
          return (resolve: (v: unknown) => void) =>
            resolve({ data: filterColumns(data, columns), error, count });
        }
        if (prop === "maybeSingle" || prop === "single") {
          return async () => {
            const row = Array.isArray(data) ? data[0] ?? null : data;
            return { data: filterColumns(row, columns), error };
          };
        }
        return (...args: unknown[]) =>
          chain(
            prop === "insert" ? { id: "new-id" } : data, // inserts fabricate a row
            error,
            prop === "insert" ? 1 : count,
            prop === "select" ? parseSelect(args[0], columns) : columns
          );
      },
    }
  );
}

function lookup(table: string, map: Record<string, unknown>): unknown {
  if (typeof map[table] === "function") return (map[table] as () => unknown)();
  return map[table];
}

interface FakeAuthUser {
  id?: string;
  email?: string | null;
  role?: string;
}

// dataByTable: { opportunities: [...rows], user_profiles: {...}, ... }
// A table value may also be a function returning rows (for per-call behavior).
export function fakeSupabase(
  dataByTable: Record<string, unknown> = {},
  authUser: FakeAuthUser = { id: "user-1", role: "user" }
): SupabaseClient {
  const validTokens = new Set(["good-token"]);
  return {
    auth: {
      getUser: async (token: string) =>
        validTokens.has(token)
          ? {
              data: {
                user: {
                  id: authUser.id ?? "user-1",
                  email: authUser.email ?? null,
                  app_metadata: { role: authUser.role ?? "user" },
                },
              },
              error: null,
            }
          : { data: { user: null }, error: { message: "invalid token" } },
    },
    from: (table: string) => {
      const v = lookup(table, dataByTable);
      return chain(v, null, Array.isArray(v) ? v.length : undefined);
    },
  } as unknown as SupabaseClient;
}