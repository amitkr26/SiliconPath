import { loadEnv } from "./config.js";
import { createDbClient } from "./db.js";
import { runNewsSync } from "./workers/news-sync.js";

const env = loadEnv();

if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
  console.error("[worker] FATAL: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  process.exit(1);
}

const supabase = createDbClient(env);
let running = false;
let timer: ReturnType<typeof setInterval> | null = null;

async function tick() {
  if (running) {
    console.log("[worker] Previous tick still running, skipping");
    return;
  }
  running = true;
  try {
    await runNewsSync(supabase);
  } catch (err) {
    console.error("[worker] news-sync failed:", err);
  } finally {
    running = false;
  }
}

// ── Graceful shutdown ──

function shutdown(signal: string) {
  console.log(`[worker] ${signal} received — shutting down`);
  if (timer) clearInterval(timer);
  // Let in-flight DB writes finish (max 5s).
  setTimeout(() => process.exit(0), 5_000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// ── Boot ──

console.log(`[worker] Starting news-sync worker (interval: ${env.newsSyncIntervalMs}ms, env: ${env.nodeEnv})`);

// Run immediately on boot, then on interval.
tick().then(() => {
  timer = setInterval(tick, env.newsSyncIntervalMs);
  console.log(`[worker] Listening for ticks every ${env.newsSyncIntervalMs / 1000}s`);
});
