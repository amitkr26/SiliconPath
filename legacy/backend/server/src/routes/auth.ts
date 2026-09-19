import { Router } from "express";
import { AppError, ConflictError } from "@berojgardegreewala/api";
import type { Deps } from "../types.js";
import { rateLimit } from "../middleware/rate-limit.js";

const RESERVED_USERNAMES = new Set([
  "admin", "administrator", "moderator", "support", "staff", "system", "api",
  "opportunities", "news", "academy", "network", "messages", "feed", "profile",
]);

// POST /api/v1/auth/signup — mirrors frontend /api/auth/signup: creates the
// Supabase Auth user (identity stays in Supabase, Phase 8) and upserts the
// public profile row. Role is derived server-side from whitelisted accountType.
export function authRouter(deps: Deps): Router {
  const r = Router();
  r.use(rateLimit("auth"));

  r.post("/signup", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const { email, password, username, display_name, accountType } = req.body || {};
      if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new AppError("valid email is required", 400, "VALIDATION_ERROR");
      }
      if (typeof password !== "string" || password.length < 8) {
        throw new AppError("password must be at least 8 characters", 400, "VALIDATION_ERROR");
      }
      const role = accountType === "provider" ? "employer" : accountType === "candidate" ? "candidate" : null;
      if (!role) {
        throw new AppError("accountType must be candidate or provider", 400, "VALIDATION_ERROR");
      }
      if (typeof username !== "string" || !/^[a-z0-9_]{3,30}$/.test(username) || RESERVED_USERNAMES.has(username.toLowerCase())) {
        throw new AppError("username must be 3-30 chars [a-z0-9_] and not reserved", 400, "VALIDATION_ERROR");
      }

      const { data: existing } = await deps.supabaseAdmin
        .from("user_profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      if (existing) throw new ConflictError("Username already taken");

      const { data: user, error: createError } = await deps.supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role, username, display_name: display_name || null, account_type: accountType },
      });
      if (createError) {
        throw new ConflictError(createError.message.includes("already") ? "Email already registered" : createError.message);
      }
      if (!user?.user?.id) throw new AppError("User creation failed", 500, "INTERNAL_ERROR");

      const { error: profileError } = await deps.supabaseAdmin
        .from("user_profiles")
        .upsert(
          { id: user.user.id, username, display_name: display_name || null, account_type: accountType },
          { onConflict: "id" }
        );
      if (profileError) throw profileError;

      res.status(201).json({ success: true, data: { user: { id: user.user.id, email }, autoConfirmed: true } });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/v1/auth/check-username?username= — availability + suggestions
  r.get("/check-username", async (req, res, next) => {
    try {
      if (!deps.supabaseAdmin) throw new AppError("Database not configured", 503, "DB_UNAVAILABLE");
      const u = String(req.query.username || "").trim().toLowerCase();
      if (!/^[a-z0-9_]{1,30}$/.test(u)) {
        res.json({ success: true, data: { available: false, suggestions: [] } });
        return;
      }
      const { data, error } = await deps.supabaseAdmin
        .from("user_profiles")
        .select("username")
        .ilike("username", `${u}%`)
        .limit(5);
      if (error) throw error;
      const taken = new Set((data || []).map((row) => row.username));
      const available = !taken.has(u) && !RESERVED_USERNAMES.has(u);
      const suggestions = available ? [u] : Array.from({ length: 5 }, (_, i) => `${u}${i + 1}`).filter((s) => !taken.has(s));
      res.json({ success: true, data: { available, suggestions } });
    } catch (err) {
      next(err);
    }
  });

  return r;
}