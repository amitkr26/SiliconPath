import { Router } from "express";
import { AppError, NotFoundError } from "@berojgardegreewala/api";
import type { Deps } from "../types.js";
import { listOrganizations, getOrganizationBySlug, listNews } from "../repositories/content.js";

function pagination(req: any): { page: number; limit: number } {
  const page = Math.max(1, parseInt(req.query.page || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10) || 20));
  return { page, limit };
}

export function organizationsRouter(deps: Deps): Router {
  const r = Router();

  r.get("/", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const { page, limit } = pagination(req);
      const { data, count } = await listOrganizations(deps.supabaseAdmin, page, limit);
      res.json({ success: true, data, pagination: { page, limit, total: count, pages: Math.ceil(count / limit) } });
    } catch (err) {
      next(err);
    }
  });

  r.get("/:slug", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const org = await getOrganizationBySlug(deps.supabaseAdmin, req.params.slug);
      if (!org) throw new NotFoundError("Organization not found");
      res.json({ success: true, data: org });
    } catch (err) {
      next(err);
    }
  });

  return r;
}

export function newsRouter(deps: Deps): Router {
  const r = Router();

  r.get("/", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const { page, limit } = pagination(req);
      const { data, count } = await listNews(deps.supabaseAdmin, page, limit);
      res.json({ success: true, data, pagination: { page, limit, total: count, pages: Math.ceil(count / limit) } });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/v1/news/:slug — single article (mirrors /api/news/[slug])
  r.get("/:slug", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const { data, error } = await deps.supabaseAdmin
        .from("news_articles")
        .select("id, slug, title, summary, source_name, url, image_url, published_at, tags")
        .eq("slug", req.params.slug)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new NotFoundError("Article not found");
      res.json({ success: true, data: { ...data, source: data.source_name || "Official Source", source_url: data.url || "#" } });
    } catch (err) {
      next(err);
    }
  });

  return r;
}