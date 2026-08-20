import { Router } from "express";
import { createHash, timingSafeEqual } from "node:crypto";
import { AppError, ForbiddenError } from "@berojgardegreewala/api";
import {
  fetchAllNewsFeedResults,
  buildNewsArticleRows,
  upsertNewsArticles,
} from "@berojgardegreewala/api/src/content/news-sync";
import type { Deps } from "../types.js";

// Constant-time compare — the bearer secret must not leak via string timing.
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

// GET /api/v1/cron/news-sync — Bearer CRON_SECRET protected, mirrors the
// frontend /api/news/sync cron (vercel.json schedule 06:00 daily) without
// Next.js serverless constraints. Same production write contract: upsert
// into news_articles onConflict url (was news_archive onConflict slug — a
// parity bug, that table is db2's archive and slug has no unique key).
export function cronRouter(deps: Deps): Router {
  const r = Router();

  r.get("/news-sync", async (req, res, next) => {
    try {
      const auth = String(req.headers.authorization || "");
      if (!auth.startsWith("Bearer ") || !deps.env.cronSecret || !safeEqual(auth.slice(7), deps.env.cronSecret)) {
        throw new ForbiddenError("Invalid cron secret");
      }
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");

      const results = await fetchAllNewsFeedResults();
      const { rows, results: merged } = buildNewsArticleRows(results);
      if (rows.length === 0) {
        res.json({ success: false, error: { code: "NO_FEED_ITEMS", message: "No news items fetched (feeds failed or all filtered)" }, scraped_count: 0, inserted_count: 0, sources: merged });
        return;
      }

      const { inserted, error } = await upsertNewsArticles(deps.supabaseAdmin, rows);
      if (error) throw error;

      res.json({ success: true, scraped_count: rows.length, inserted_count: inserted, sources: merged });
    } catch (err) {
      next(err);
    }
  });

  return r;
}