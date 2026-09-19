import { createClient } from "@supabase/supabase-js";
import { unauthorized, forbidden } from "../response";
import type { AuthUser } from "../types";
export type { AuthUser };

export type GlobalRole =
  | "owner"
  | "platform_admin"
  | "manager"
  | "moderator"
  | "support"
  | "user";

export type OrgRole =
  | "org_owner"
  | "org_admin"
  | "hiring_manager"
  | "recruiter"
  | "viewer";

export const ROLE_PERMISSIONS: Record<GlobalRole, string[]> = {
  owner: [
    "opportunities.read",
    "opportunities.apply",
    "opportunities.bookmark",
    "opportunities.create",
    "opportunities.verify",
    "opportunities.delete",
    "users.read",
    "users.manage",
    "organizations.manage",
    "organizations.verify",
    "scrapers.read",
    "scrapers.run",
    "analytics.read",
    "system.settings",
  ],
  platform_admin: [
    "opportunities.read",
    "opportunities.apply",
    "opportunities.bookmark",
    "opportunities.create",
    "opportunities.verify",
    "opportunities.delete",
    "users.read",
    "users.manage",
    "organizations.manage",
    "organizations.verify",
    "scrapers.read",
    "scrapers.run",
    "analytics.read",
  ],
  manager: [
    "opportunities.read",
    "opportunities.apply",
    "opportunities.bookmark",
    "opportunities.verify",
    "scrapers.read",
    "scrapers.run",
    "analytics.read",
  ],
  moderator: [
    "opportunities.read",
    "opportunities.apply",
    "opportunities.bookmark",
    "users.read",
  ],
  support: [
    "opportunities.read",
    "opportunities.apply",
    "opportunities.bookmark",
    "users.read",
  ],
  user: [
    "opportunities.read",
    "opportunities.apply",
    "opportunities.bookmark",
  ],
};

function safeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function computeHmacSha256Hex(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyAdminToken(token: string, adminPassword: string): Promise<boolean> {
  const HMAC_KEY = process.env.ADMIN_HMAC_SECRET || adminPassword;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [sessionId, expiry, sig] = parts;
  if (Date.now() > parseInt(expiry, 10)) return false;
  try {
    const expected = await computeHmacSha256Hex(HMAC_KEY, `${sessionId}.${expiry}`);
    return safeEqual(sig, expected);
  } catch {
    return false;
  }
}

interface RequestLike {
  headers: { get(name: string): string | null };
}

export function getSafeRedirectUrl(targetUrl: string | null | undefined, defaultUrl: string = "/"): string {
  if (!targetUrl || typeof targetUrl !== "string") return defaultUrl;
  const trimmed = targetUrl.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\") || trimmed.includes("://")) {
    return defaultUrl;
  }
  return trimmed;
}

export function hasRole(
  user: AuthUser | null | undefined,
  targetRole: GlobalRole
): boolean {
  if (!user) return false;
  const gRole = (user.global_role || (user.role === "admin" ? "platform_admin" : "user")) as GlobalRole;
  if (gRole === "owner") return true;
  if (targetRole === "user") return true;
  return gRole === targetRole;
}

export function hasPermission(
  user: AuthUser | null | undefined,
  permission: string
): boolean {
  if (!user) return false;
  const gRole = (user.global_role || (user.role === "admin" ? "platform_admin" : "user")) as GlobalRole;
  if (gRole === "owner") return true;
  if (user.permissions && user.permissions.includes(permission)) return true;
  const perms = ROLE_PERMISSIONS[gRole] || ROLE_PERMISSIONS.user;
  return perms.includes(permission);
}

export function hasAnyPermission(
  user: AuthUser | null | undefined,
  permissions: string[]
): boolean {
  if (!user) return false;
  return permissions.some((p) => hasPermission(user, p));
}

export function hasOrganizationPermission(
  user: AuthUser | null | undefined,
  orgRole: OrgRole | string,
  permission: string
): boolean {
  if (!user) return false;
  if (hasRole(user, "owner") || hasRole(user, "platform_admin")) return true;
  if (orgRole === "org_owner" || orgRole === "org_admin") return true;
  if (orgRole === "hiring_manager") {
    return ["opportunities.create", "opportunities.read", "applications.read", "applications.manage"].includes(permission);
  }
  if (orgRole === "recruiter") {
    return ["opportunities.read", "applications.read", "talent.search", "talent.message"].includes(permission);
  }
  return permission === "opportunities.read";
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

  // P0 Security: user_metadata is client-writable in Supabase GoTrue.
  // Admin and owner privileges MUST come from app_metadata (server-controlled).
  const appRole = user.app_metadata?.role;
  const rawMetaRole = user.user_metadata?.role;
  const safeRole = appRole || (rawMetaRole === "admin" ? "user" : rawMetaRole) || user.role;

  return {
    id: user.id,
    email: user.email || "",
    role: safeRole,
    global_role: user.app_metadata?.global_role || (safeRole === "admin" ? "platform_admin" : (user.user_metadata?.global_role === "platform_admin" || user.user_metadata?.global_role === "owner" ? "user" : user.user_metadata?.global_role)),
    permissions: user.app_metadata?.permissions || (safeRole === "admin" ? ROLE_PERMISSIONS.platform_admin : user.user_metadata?.permissions || []),
    account_type: user.user_metadata?.account_type,
  };
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
  if (adminPassword && directPassword && safeEqual(directPassword, adminPassword)) {
    return { id: "admin", email: "admin", role: "admin", global_role: "platform_admin" };
  }

  const authHeader = request.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/);
  if (match) {
    const token = match[1];
    if (adminPassword && safeEqual(token, adminPassword)) {
      return { id: "admin", email: "admin", role: "admin", global_role: "platform_admin" };
    }
    if (adminPassword && (await verifyAdminToken(token, adminPassword))) {
      return { id: "admin", email: "admin", role: "admin", global_role: "platform_admin" };
    }
    if (cronSecret && safeEqual(token, cronSecret)) {
      return { id: "cron", email: "cron", role: "cron", global_role: "platform_admin" };
    }
  }

  throw forbidden("Invalid admin credentials");
}

export async function requireCron(request: RequestLike): Promise<void> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) throw forbidden("Cron not configured");

  const authHeader = request.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/);
  if (!match || !safeEqual(match[1], cronSecret)) throw forbidden("Invalid cron secret");
}

export async function requireCronOrAdmin(request: RequestLike): Promise<AuthUser> {
  try {
    return await requireAdmin(request);
  } catch {
    throw forbidden("Unauthorized");
  }
}