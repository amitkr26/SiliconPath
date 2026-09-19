// Supabase MCP server: CRUD via PostgREST (supabase-js) with the service
// role key. Read-only-safe defaults; mutating tools require explicit table.

import { startMcpServer } from "./_rpc.mjs";
import { readEnvLocal } from "./_creds.mjs";

const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = {
  ...readEnvLocal(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]),
  ...(process.env.NEXT_PUBLIC_SUPABASE_URL ? { NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL } : {}),
  ...(process.env.SUPABASE_SERVICE_ROLE_KEY ? { SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY } : {}),
};

if (!url || !key) {
  console.error("supabase MCP: SUPABASE_URL/SERVICE_ROLE_KEY missing (.env.local)");
  process.exit(1);
}

const { createClient } = await import("@supabase/supabase-js");
const sb = createClient(url, key);

const describe = { type: "object", properties: { table: { type: "string", description: "Table name, e.g. opportunities" } } };

const tools = [
  {
    name: "supabase_select",
    description: "Query rows: supabase_select(table, {eq?: {col: val}, ilike?: {col: pattern}, order?: {col, asc}, limit?, select?: string})",
    inputSchema: {
      type: "object",
      properties: {
        table: { type: "string" },
        eq: { type: "object", description: "Equality filters {column: value}" },
        ilike: { type: "object", description: "Case-insensitive match {column: '%pattern%'}" },
        order: { type: "object", properties: { col: { type: "string" }, asc: { type: "boolean" } } },
        limit: { type: "number", maximum: 500 },
        select: { type: "string", description: "Columns, comma separated (default *)" },
      },
      required: ["table"],
    },
    handler: async ({ table, eq, ilike, order, limit = 100, select = "*" }) => {
      let q = sb.from(table).select(select);
      for (const [c, v] of Object.entries(eq || {})) q = q.eq(c, v);
      for (const [c, p] of Object.entries(ilike || {})) q = q.ilike(c, p);
      if (order) q = q.order(order.col, { ascending: order.asc ?? true });
      const { data, error, count } = await q.limit(Math.min(limit, 500));
      if (error) throw new Error(error.message);
      return { count, rows: data };
    },
  },
  {
    name: "supabase_insert",
    description: "Insert rows: supabase_insert(table, rows[])",
    inputSchema: { type: "object", properties: { table: { type: "string" }, rows: { type: "array" } }, required: ["table", "rows"] },
    handler: async ({ table, rows }) => {
      const { data, error } = await sb.from(table).insert(rows).select();
      if (error) throw new Error(error.message);
      return { inserted: data };
    },
  },
  {
    name: "supabase_update",
    description: "Update rows matching eq filter: supabase_update(table, values, eq)",
    inputSchema: {
      type: "object",
      properties: { table: { type: "string" }, values: { type: "object" }, eq: { type: "object" } },
      required: ["table", "values", "eq"],
    },
    handler: async ({ table, values, eq }) => {
      let q = sb.from(table).update(values);
      for (const [c, v] of Object.entries(eq)) q = q.eq(c, v);
      const { data, error } = await q.select();
      if (error) throw new Error(error.message);
      return { updated: data };
    },
  },
  {
    name: "supabase_delete",
    description: "Delete rows matching eq filter (requireAtLeastOne: default true)",
    inputSchema: {
      type: "object",
      properties: { table: { type: "string" }, eq: { type: "object" } },
      required: ["table", "eq"],
    },
    handler: async ({ table, eq }) => {
      if (!Object.keys(eq).length) throw new Error("refusing delete without eq filter");
      let q = sb.from(table).delete();
      for (const [c, v] of Object.entries(eq)) q = q.eq(c, v);
      const { data, error } = await q.select();
      if (error) throw new Error(error.message);
      return { deleted: data };
    },
  },
];

startMcpServer({ name: "supabase", version: "1.0.0", tools });
