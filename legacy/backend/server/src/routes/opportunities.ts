import { Router } from "express";
import { AppError, NotFoundError, opportunityListQuerySchema } from "@berojgardegreewala/api";
import type { Deps } from "../types.js";
import { listOpportunities, getOpportunityByIdOrSlug } from "../repositories/opportunities.js";

export function opportunitiesRouter(deps: Deps): Router {
  const r = Router();

  // GET /api/v1/opportunities?page=&limit=&category=&eligibility=&location=&deadline=&search=
  r.get("/", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const parsed = opportunityListQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new AppError("Invalid query parameters", 400, "VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
      }
      const { data, count } = await listOpportunities(deps.supabaseAdmin, parsed.data);
      res.json({
        success: true,
        data,
        pagination: { page: parsed.data.page, limit: parsed.data.limit, total: count, pages: Math.ceil(count / parsed.data.limit) },
      });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/v1/opportunities/:idOrSlug — UUID or slug (frontend links by slug)
  r.get("/:idOrSlug", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const opp = await getOpportunityByIdOrSlug(deps.supabaseAdmin, req.params.idOrSlug);
      if (!opp) throw new NotFoundError("Opportunity not found");
      res.json({ success: true, data: opp });
    } catch (err) {
      next(err);
    }
  });

  return r;
}