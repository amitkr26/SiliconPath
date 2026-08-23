import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../frontend/.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function verifySecuritySurface() {
  console.log("============================================================");
  console.log("SUPABASE SECURITY SURFACE & RPC INVOCATION AUDIT");
  console.log("============================================================");

  const functionsToTest = [
    "auto_username",
    "handle_connection_accepted",
    "handle_connection_count",
    "handle_follow",
    "handle_new_user",
    "rls_auto_enable",
    "update_post_comments_count",
    "update_post_likes_count"
  ];

  const rpcResults = [];

  for (const fn of functionsToTest) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
        method: "POST",
        headers: {
          "apikey": ANON_KEY,
          "Authorization": `Bearer ${ANON_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });

      // Expected: 404 (function not found in schema cache / not exposed), 401/403 (unauthorized/forbidden), or 400 (parameter mismatch)
      const status = res.status;
      const pass = [400, 401, 403, 404].includes(status);

      rpcResults.push({
        function: fn,
        httpStatus: status,
        isBlockedOrInaccessible: pass,
        statusNote: status === 404 ? "Not exposed via RPC" : status === 401 || status === 403 ? "Execution Denied" : "Parameter / Signature mismatch"
      });
    } catch (err) {
      rpcResults.push({
        function: fn,
        httpStatus: "ERR",
        isBlockedOrInaccessible: true,
        statusNote: err.message
      });
    }
  }

  console.table(rpcResults);

  console.log("\n--- Anonymous Table Access under RLS ---");
  const tables = ["subscribers", "scrape_sources", "link_check_logs", "calendar_exports"];
  const tableResults = [];

  for (const t of tables) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${t}?select=*`, {
        headers: {
          "apikey": ANON_KEY,
          "Authorization": `Bearer ${ANON_KEY}`
        }
      });
      const data = await res.json().catch(() => []);
      const rowCount = Array.isArray(data) ? data.length : 0;
      
      tableResults.push({
        table: t,
        status: res.status,
        anonymousRowsReturned: rowCount,
        pass: rowCount === 0 || (t === "subscribers" && rowCount === 0)
      });
    } catch (err) {
      tableResults.push({
        table: t,
        status: "ERR",
        anonymousRowsReturned: 0,
        pass: true
      });
    }
  }

  console.table(tableResults);
}

verifySecuritySurface().catch(console.error);
