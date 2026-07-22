import { createClient } from "@supabase/supabase-js";
import { unauthorized, forbidden } from "../response";
import type { AuthUser } from "../types";
export type { AuthUser };
function verifyAdminToken(token: string, adminPassword: string): boolean {
  const HMAC_KEY = process.env.ADMIN_HMAC_SECRET || adminPassword;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [sessionId, expiry, sig] = parts;
  if (Date.now() > parseInt(expiry, 10)) return false;
  // ponytail: dynamic require to avoid bundling Node.js crypto in Vercel Edge/middleware
  const crypto = require("crypto");
  const expected = crypto.createHmac("sha256", HMAC_KEY).update(`${sessionId}.${expiry}`).digest("hex");
  return sig === expected;
}

interface RequestLike {
  headers: { get(name: string): string | null };
}

export async function getUser(request: RequestLike): Promise<AuthUser | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return null;

  return { id: user.id, email: user.email || "", role: user.role };
}

export async function requireAuth(request: RequestLike): Promise<AuthUser> {
  const user = await getUser(request);
  if (!user) throw unauthorized();
  return user;
}

export async function requireAdmin(request: RequestLike): Promise<AuthUser> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const cronSecret = process.env.CRON_SECRET;

  if (!adminPassword && !cronSecret) throw forbidden("Server keys are missing");

  const directPassword = request.headers.get("x-admin-password");
  if (adminPassword && directPassword && directPassword === adminPassword) {
    return { id: "admin", email: "admin", role: "admin" };
  }

  const authHeader = request.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/);
  if (match) {
    const token = match[1];
    if (adminPassword && token === adminPassword) {
      return { id: "admin", email: "admin", role: "admin" };
    }
    if (adminPassword && verifyAdminToken(token, adminPassword)) {
      return { id: "admin", email: "admin", role: "admin" };
    }
    if (cronSecret && token === cronSecret) {
      return { id: "cron", email: "cron", role: "cron" };
    }
  }

  throw forbidden("Invalid admin credentials");
}

export async function requireCron(request: RequestLike): Promise<void> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) throw forbidden("Cron not configured");

  const authHeader = request.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/);
  if (!match || match[1] !== cronSecret) throw forbidden("Invalid cron secret");
}

export async function requireCronOrAdmin(request: RequestLike): Promise<AuthUser> {
  try {
    return await requireAdmin(request);
  } catch {
    throw forbidden("Unauthorized");
  }
}