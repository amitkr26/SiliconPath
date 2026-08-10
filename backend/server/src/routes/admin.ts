import { Router } from "express";
import { createHash, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@berojgardegreewala/api";
import type { Deps } from "../types.js";

// Constant-time comparison so password length never leaks via timing.
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

async function countRows(db: SupabaseClient, table: string): Promise<number> {
  const { count, error } = await db.from(table).select("id", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

// GET /api/v1/admin/stats — dashboard counts. Guarded by X-Admin-Password
// header (configured via ADMIN_PASSWORD env on the host; not a session flow).
export function adminRouter(deps: Deps): Router {
  const r = Router();

  r.get("/stats", async (req, res, next) => {
    try {
      const supplied = String(req.headers["x-admin-password"] || "");
      if (!deps.env.adminPassword || !safeEqual(supplied, deps.env.adminPassword)) {
        throw new AppError("Forbidden", 403, "FORBIDDEN");
      }
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");

      const [opportunities, organizations, profiles, news] = await Promise.all([
        countRows(deps.supabaseAdmin, "opportunities"),
        countRows(deps.supabaseAdmin, "organizations"),
        countRows(deps.supabaseAdmin, "user_profiles"),
        countRows(deps.supabaseAdmin, "news_articles"),
      ]);
      res.json({
        success: true,
        data: { counts: { opportunities, organizations, profiles, news } },
      });
    } catch (err) {
      next(err);
    }
  });

  return r;
}