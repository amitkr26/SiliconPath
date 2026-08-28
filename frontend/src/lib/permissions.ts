import { NextRequest } from "next/server";
import { getAuthenticatedEmployerUser } from "./employer-auth";
import { verifyAdmin } from "./admin-auth";

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

export type Permission =
  | "opportunities.read"
  | "opportunities.apply"
  | "opportunities.bookmark"
  | "opportunities.create"
  | "opportunities.verify"
  | "opportunities.delete"
  | "users.read"
  | "users.manage"
  | "organizations.manage"
  | "organizations.verify"
  | "scrapers.read"
  | "scrapers.run"
  | "analytics.read"
  | "system.settings";

export const ROLE_PERMISSIONS: Record<GlobalRole, Permission[]> = {
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

export function getSafeRedirectUrl(targetUrl: string | null | undefined, defaultUrl: string = "/"): string {
  if (!targetUrl || typeof targetUrl !== "string") return defaultUrl;
  const trimmed = targetUrl.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\") || trimmed.includes("://")) {
    return defaultUrl;
  }
  return trimmed;
}

export function hasRole(
  role: GlobalRole = "user",
  targetRole: GlobalRole
): boolean {
  if (role === "owner") return true;
  if (targetRole === "user") return true;
  return role === targetRole;
}

export function hasPermission(
  role: GlobalRole = "user",
  permission: Permission,
  customPermissions: string[] = []
): boolean {
  if (role === "owner") return true;
  if (customPermissions.includes(permission)) return true;
  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.user;
  return permissions.includes(permission);
}

export function hasAnyPermission(
  role: GlobalRole = "user",
  permissions: Permission[],
  customPermissions: string[] = []
): boolean {
  return permissions.some((p) => hasPermission(role, p, customPermissions));
}

export function hasOrganizationPermission(
  role: GlobalRole = "user",
  orgRole: OrgRole | string,
  permission: Permission | string
): boolean {
  if (role === "owner" || role === "platform_admin") return true;
  if (orgRole === "org_owner" || orgRole === "org_admin") return true;
  if (orgRole === "hiring_manager") {
    return ["opportunities.create", "opportunities.read", "applications.read", "applications.manage"].includes(permission);
  }
  if (orgRole === "recruiter") {
    return ["opportunities.read", "applications.read", "talent.search", "talent.message"].includes(permission);
  }
  return permission === "opportunities.read";
}

export function canAccessRoute(
  role: GlobalRole = "user",
  pathname: string
): boolean {
  if (role === "owner" || role === "platform_admin") return true;

  if (pathname.startsWith("/admin")) {
    return role === "manager";
  }

  return true;
}

export async function requirePermission(
  request: NextRequest,
  permission: Permission
): Promise<{ authorized: boolean; user?: any; status: number }> {
  // Check admin password / HMAC secret first
  if (verifyAdmin(request)) {
    return { authorized: true, status: 200, user: { id: "admin", role: "platform_admin" } };
  }

  // Check authenticated Supabase user
  const user = await getAuthenticatedEmployerUser(request);
  if (!user) {
    return { authorized: false, status: 401 };
  }

  const role = (user.user_metadata?.role as GlobalRole) || "user";
  const userPerms = (user.user_metadata?.permissions as string[]) || [];

  if (!hasPermission(role, permission, userPerms)) {
    return { authorized: false, status: 403, user };
  }

  return { authorized: true, status: 200, user };
}
