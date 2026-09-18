import { Router } from "express";
import { AppError } from "@berojgardegreewala/api";
import type { Deps } from "../types.js";
import { rateLimit } from "../middleware/rate-limit.js";
import { listOpportunities } from "../repositories/opportunities.js";

// GET /api/v1/search — opportunities + people in one endpoint
// (mirrors /api/search which wraps opportunity search + people search).
export function searchRouter(deps: Deps): Router {
  const r = Router();
  r.use(rateLimit("search"));

  r.get("/", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const q = String(req.query.q || "").trim();
      if (!q) {
        res.json({ success: true, data: { opportunities: [], people: [] } });
        return;
      }

      // Opportunities via the shared repository (reuses filters + mapping).
      const { data: opportunities } = await listOpportunities(deps.supabaseAdmin, {
        page: 1,
        limit: Math.min(20, parseInt(String(req.query.limit || "10"), 10) || 10),
        search: q,
      });

      // People on public profiles (mirrors /api/people/search semantics).
      const { data: people, error } = await deps.supabaseAdmin
        .from("user_profiles")
        .select("id, username, display_name, headline, current_company, location, skills")
        .eq("is_profile_public", true)
        .or(`display_name.ilike.%${q}%,headline.ilike.%${q}%,current_company.ilike.%${q}%,skills.cs.{${q}}`)
        .order("connection_count", { ascending: false })
        .limit(10);
      if (error) throw error;

      res.json({ success: true, data: { opportunities, people: people || [] } });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/v1/search/people — dedicated people search
  r.get("/people", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const q = String(req.query.q || "").trim();
      if (!q) {
        res.json({ success: true, data: [] });
        return;
      }
      const { data, error } = await deps.supabaseAdmin
        .from("user_profiles")
        .select("id, username, display_name, headline, current_company, location, skills")
        .eq("is_profile_public", true)
        .or(`display_name.ilike.%${q}%,headline.ilike.%${q}%,current_company.ilike.%${q}%`)
        .order("connection_count", { ascending: false })
        .limit(10);
      if (error) throw error;
      res.json({ success: true, data: data || [] });
    } catch (err) {
      next(err);
    }
  });

  return r;
}