import type { NextFunction, Request, Response } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";

// Extend Express Request with the authenticated user (set by requireAuth).
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      authUser?: { id: string; email: string | null; role: string };
    }
  }
}

// Verifies the Bearer token against Supabase and attaches authUser.
// Token metadata (role/admin) comes from the trusted auth server, not client claims.
export function requireAuth(client: SupabaseClient | null) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization || "";
      const token = header.startsWith("Bearer ") ? header.slice(7) : "";
      if (!token) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } });
        return;
      }
      if (!client) {
        res.status(503).json({ success: false, error: { code: "DB_UNAVAILABLE", message: "Database not configured" } });
        return;
      }
      const { data, error } = await client.auth.getUser(token);
      if (error || !data.user) {
        res.status(401).json({ success: false, error: { code: "INVALID_TOKEN", message: "Invalid or expired token" } });
        return;
      }
      req.authUser = {
        id: data.user.id,
        email: data.user.email ?? null,
        role: (data.user.app_metadata?.role as string) || "user",
      };
      next();
    } catch (err) {
      next(err);
    }
  };
}