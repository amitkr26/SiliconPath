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

// Graceful shutdown — Render/K8s/Docker send SIGTERM before SIGKILL.
// Drain in-flight requests before exiting.
function shutdown(signal: string) {
  // eslint-disable-next-line no-console
  console.log(`[server] ${signal} received — shutting down`);
  server.close(() => {
    // eslint-disable-next-line no-console
    console.log("[server] closed");
    process.exit(0);
  });
  // Force-kill after 10 s if connections hang.
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));