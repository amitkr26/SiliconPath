import express from "express";
import cors from "cors";
import type { Deps } from "./types.js";
import { logMiddleware } from "./middleware/log.js";
import { notFoundHandler, errorHandler } from "./middleware/error.js";
import { healthRouter } from "./routes/health.js";
import { opportunitiesRouter } from "./routes/opportunities.js";
import { profilesRouter } from "./routes/profiles.js";
import { organizationsRouter, newsRouter } from "./routes/content.js";
import { applicationsRouter, savedRouter } from "./routes/userdata.js";
import { aiRouter } from "./routes/ai.js";
import { adminRouter } from "./routes/admin.js";

// REST API (Express) — parallels the Next.js internal API routes with a
// consistent { success, data | error: { code, message } } envelope and the
// same zod validation / Supabase tables. No schema changes to the DBs.
export function createApp(deps: Deps) {
  const app = express();
  app.disable("x-powered-by");

  const dev = deps.env.nodeEnv !== "production";
  app.use(
    cors({
      origin: (origin, cb) => {
        // No Origin header (curl, cron) or listed origin — allowed.
        // In development any localhost origin is allowed.
        const allowed =
          !origin ||
          deps.env.allowedOrigins.includes(origin) ||
          (dev && /^http:\/\/localhost(:\d+)?$/.test(origin));
        cb(null, allowed);
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(logMiddleware);

  app.use("/health", healthRouter());

  app.use("/api/v1/opportunities", opportunitiesRouter(deps));
  app.use("/api/v1/profiles", profilesRouter(deps));
  app.use("/api/v1/organizations", organizationsRouter(deps));
  app.use("/api/v1/news", newsRouter(deps));
  app.use("/api/v1/applications", applicationsRouter(deps));
  app.use("/api/v1/saved-opportunities", savedRouter(deps));
  app.use("/api/v1/ai", aiRouter(deps));
  app.use("/api/v1/admin", adminRouter(deps));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}