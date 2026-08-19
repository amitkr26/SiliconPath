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

app.listen(env.port, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`[server] ${env.nodeEnv} listening on :${env.port}`);
});