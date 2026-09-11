// Neon MCP server: read-only SQL against the two Neon postgres databases.
// db="1" = main (neon1), db="2" = secondary replica (neon2).

import { startMcpServer } from "./_rpc.mjs";
import { readCredentialsFile } from "./_creds.mjs";

const { NEON_1_DATABASE_URL, NEON_2_DATABASE_URL } = {
  ...readCredentialsFile(),
  ...(process.env.NEON_1_DATABASE_URL ? { NEON_1_DATABASE_URL: process.env.NEON_1_DATABASE_URL } : {}),
  ...(process.env.NEON_2_DATABASE_URL ? { NEON_2_DATABASE_URL: process.env.NEON_2_DATABASE_URL } : {}),
};

if (!NEON_1_DATABASE_URL) {
  console.error("neon MCP: no connection string found (siliconpath-credentials.txt)");
  process.exit(1);
}

startMcpServer({
  name: "neon",
  version: "1.0.0",
  tools: [
    {
      name: "neon_query",
      description:
        "Run a read-only SQL query. neonly SELECT/EXPLAIN allowed; row limit 500. db: '1' main, '2' secondary. Returns rows.",
      inputSchema: {
        type: "object",
        properties: {
          sql: { type: "string" },
          params: { type: "array", items: {}, description: "Positional $1..$n parameters" },
          db: { type: "string", enum: ["1", "2"], default: "1" },
        },
        required: ["sql"],
      },
      handler: async ({ sql, params = [], db = "1" }, { require }) => {
        const upper = sql.trim().toUpperCase();
        if (!/^SELECT|^EXPLAIN|^WITH/.test(upper)) {
          throw new Error("only SELECT/EXPLAIN/WITH queries allowed");
        }
        const { Client } = require("pg");
        const url = db === "2" ? NEON_2_DATABASE_URL : NEON_1_DATABASE_URL;
        const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
        try {
          await client.connect();
          const res = await client.query(sql, params);
          const rows = res.rows.slice(0, 500);
          const truncated = res.rows.length > 500;
          return { rowCount: res.rowCount, truncated, rows };
        } finally {
          await client.end().catch(() => {});
        }
      },
    },
  ],
});
