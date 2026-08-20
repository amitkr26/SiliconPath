import { loadEnv, isAdminConfigured } from "./config/env.js";
import { createDbClients } from "./db/supabase.js";
import { createApp } from "./app.js";

const env = loadEnv();
if (!isAdminConfigured(env)) {
  // eslint-disable-next-line no-console
  console.warn(
    "[server] SUPABASE_SERVICE_ROLE_KEY missing - DB-backed routes will return 503 (health + boot still work)"
  );
}
if (!env.cronSecret) {
  // eslint-disable-next-line no-console
  console.warn(
    "[server] CRON_SECRET missing - /api/v1/cron/* will reject all requests (safe default)"
  );
}

const app = createApp({ env, ...createDbClients() });

const server = app.listen(env.port, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`[server] ${env.nodeEnv} listening on :${env.port}`);
});

// Graceful shutdown (Render sends SIGTERM on deploy/restart): stop taking
// new connections, finish in-flight requests, exit. Force-exit after 10s so
// a stuck request can't hang a deploy.
function shutdown(signal: string): void {
  // eslint-disable-next-line no-console
  console.log(`[server] ${signal} received — draining connections`);
  const force = setTimeout(() => {
    // eslint-disable-next-line no-console
    console.error("[server] forced exit after 10s");
    process.exit(1);
  }, 10_000);
  force.unref();
  server.close(() => {
    // eslint-disable-next-line no-console
    console.log("[server] connections drained — exiting");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));