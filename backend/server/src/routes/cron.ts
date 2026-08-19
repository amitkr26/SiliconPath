import { Router } from "express";
import { AppError, ForbiddenError } from "@berojgardegreewala/api";
import type { Deps } from "../types.js";
import { fetchAllNews, slugify } from "../services/news-sync.js";

// GET /api/v1/cron/news-sync — Bearer CRON_SECRET protected, mirrors the
// frontend /api/news/sync cron (vercel.json schedule 06:00 daily) without
// Next.js serverless constraints.
export function cronRouter(deps: Deps): Router {
  const r = Router();

  r.get("/news-sync", async (req, res, next) => {
    try {
      const auth = String(req.headers.authorization || "");
      if (!auth.startsWith("Bearer ") || auth.slice(7) !== deps.env.cronSecret) {
        throw new ForbiddenError("Invalid cron secret");
      }
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");

      const live = await fetchAllNews();
      if (live.length === 0) {
        res.json({ success: false, error: { code: "NO_FEED_ITEMS", message: "No news items fetched (feeds failed or all filtered)" }, scraped_count: 0, inserted_count: 0 });
        return;
      }

      const rows = live.map((a) => ({
        slug: slugify(a.title),
        title: a.title,
        summary: a.summary,
        source_name: a.source_name,
        url: a.url,
        published_at: a.published_at,
        image_url: a.image_url,
        tags: a.tags,
      }));

      // onConflict slug → skip re-inserts of the same article across runs.
      const { error } = await deps.supabaseAdmin.from("news_archive").upsert(rows, { onConflict: "slug", ignoreDuplicates: true });
      if (error) throw error;

      res.json({ success: true, scraped_count: live.length, inserted_count: rows.length });
    } catch (err) {
      next(err);
    }
  });

  return r;
}