import { Router } from "express";
import { AppError } from "@berojgardegreewala/api";
import type { Deps } from "../types.js";

export function healthRouter(deps: Deps): Router {
  const r = Router();

  // Liveness — process is up. No auth, no DB, no config required.
  r.get("/", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Readiness — required dependency (DB1) is reachable and configured.
  // Cheap head-count query only; never calls AI or scrapers.
  r.get("/ready", async (_req, res, next) => {
    try {
      if (!deps.supabaseAdmin) {
        throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      }
      const { error } = await deps.supabaseAdmin
        .from("opportunities")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      res.json({ status: "ok", ready: true });
    } catch (err) {
      next(err);
    }
  });

  return r;
}