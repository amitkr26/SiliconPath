import { Router } from "express";
import { AppError, NotFoundError } from "@berojgardegreewala/api";
import type { Deps } from "../types.js";
import { getProfileByUsername, getProfileById } from "../repositories/profiles.js";
import { requireAuth } from "../middleware/auth.js";

export function profilesRouter(deps: Deps): Router {
  const r = Router();

  // GET /api/v1/profiles/me — authenticated caller's full public profile.
  // Registered BEFORE /:username so "me" never matches the public route.
  r.get("/me", requireAuth(deps.supabase), async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const profile = await getProfileById(deps.supabaseAdmin, req.authUser!.id);
      if (!profile) throw new NotFoundError("Profile not found");
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/v1/profiles/:username — public, indexed username lookup.
  // Mirrors the frontend /profile/[username] behavior (lowercased, public fields only).
  r.get("/:username", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const username = req.params.username;
      if (!/^[a-z0-9_]{1,40}$/i.test(username)) throw new NotFoundError("Profile not found");
      const profile = await getProfileByUsername(deps.supabaseAdmin, username);
      if (!profile) throw new NotFoundError("Profile not found");
      res.json({
        success: true,
        data: { ...profile, profile_url: `/profile/${profile.username}` },
      });
    } catch (err) {
      next(err);
    }
  });

  return r;
}