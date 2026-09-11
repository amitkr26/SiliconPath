import { Router } from "express";
import { AppError, NotFoundError } from "@berojgardegreewala/api";
import type { Deps } from "../types.js";
import {
  listApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  listSavedOpportunities,
  saveOpportunity,
  deleteSavedOpportunity,
} from "../repositories/userdata.js";
import { requireAuth } from "../middleware/auth.js";
import { getOpportunityByIdOrSlug } from "../repositories/opportunities.js";

export function applicationsRouter(deps: Deps): Router {
  const r = Router();
  r.use(requireAuth(deps.supabase));

  // GET /api/v1/applications — caller's applications (mirrors /api/applications)
  r.get("/", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const data = await listApplications(deps.supabaseAdmin, req.authUser!.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/v1/applications — v1 addition (product tracks Apply via external
  // links today; this creates a tracked in-app application, deduped).
  r.post("/", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const { opportunityId, opportunity_id, notes } = req.body || {};
      const oppId = opportunityId || opportunity_id;
      if (typeof oppId !== "string" || oppId.length === 0) {
        throw new AppError("opportunityId is required", 400, "VALIDATION_ERROR");
      }
      const opp = await getOpportunityByIdOrSlug(deps.supabaseAdmin, oppId);
      if (!opp) throw new NotFoundError("Opportunity not found");
      const result = await createApplication(deps.supabaseAdmin, req.authUser!.id, opp.id, notes);
      res.status(result.created ? 201 : 200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  });

  // PATCH /api/v1/applications/:id — status/notes, caller-scoped
  r.patch("/:id", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const { status, notes } = req.body || {};
      if (status === undefined && notes === undefined) {
        throw new AppError("status or notes required", 400, "VALIDATION_ERROR");
      }
      await updateApplication(deps.supabaseAdmin, req.authUser!.id, req.params.id, { status, notes });
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  // DELETE /api/v1/applications/:id — caller-scoped
  r.delete("/:id", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      await deleteApplication(deps.supabaseAdmin, req.authUser!.id, req.params.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  return r;
}

export function savedRouter(deps: Deps): Router {
  const r = Router();
  r.use(requireAuth(deps.supabase));

  // GET /api/v1/saved-opportunities — caller's saved items (mirrors /api/bookmarks)
  r.get("/", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const limit = Math.min(parseInt(String(req.query.limit || "20"), 10) || 20, 50);
      const offset = Math.max(0, parseInt(String(req.query.offset || "0"), 10) || 0);
      const { data, count } = await listSavedOpportunities(deps.supabaseAdmin, req.authUser!.id, limit, offset);
      res.json({ success: true, data, count });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/v1/saved-opportunities { opportunityId } — mirrors POST /api/bookmarks
  r.post("/", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const { opportunityId, opportunity_id } = req.body || {};
      const oppId = opportunityId || opportunity_id;
      if (typeof oppId !== "string" || oppId.length === 0) {
        throw new AppError("opportunityId is required", 400, "VALIDATION_ERROR");
      }
      const result = await saveOpportunity(deps.supabaseAdmin, req.authUser!.id, oppId);
      res.status(result.created ? 201 : 200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  });

  // DELETE /api/v1/saved-opportunities/:id — by saved-row id, caller-scoped
  r.delete("/:id", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      await deleteSavedOpportunity(deps.supabaseAdmin, req.authUser!.id, req.params.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  return r;
}