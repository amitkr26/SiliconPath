// Centralized capability resolution — single source of truth for what a user can do.
// ponytail: keep this file small and boring. All authorization decisions flow through here.

import type { User } from "@supabase/supabase-js";

export type UserRole = "candidate" | "employer" | "admin";
export type GlobalRole = "owner" | "platform_admin" | "manager" | "moderator" | "support" | "user";

export interface UserCapabilities {
  userId: string;
  email: string;
  role: UserRole;
  globalRole: GlobalRole;
  permissions: string[];
  isCandidate: boolean;
  isEmployer: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isOwner: boolean;
  hasEmployerCapability: boolean;
  hasManagerCapability: boolean;
}

export function resolveCapabilities(
  user: User | null,
  profileAccountType?: string | null
): UserCapabilities | null {
  if (!user) return null;

  const meta = user.user_metadata || {};

  let role: UserRole = "candidate";
  const sourceRole = profileAccountType || meta.role || meta.account_type;
  if (sourceRole === "employer" || sourceRole === "provider") {
    role = "employer";
  } else if (sourceRole === "admin") {
    role = "admin";
  }

  let globalRole: GlobalRole = role === "admin" ? "platform_admin" : "user";
  if (meta.global_role) {
    globalRole = meta.global_role as GlobalRole;
  }

  const permissions: string[] = meta.permissions || [];

  const isCandidate = role === "candidate";
  const isEmployer = role === "employer";
  const isAdmin = role === "admin" || globalRole === "platform_admin" || globalRole === "owner";
  const isManager = globalRole === "manager" || globalRole === "moderator" || globalRole === "support";
  const isOwner = globalRole === "owner";
  const hasEmployerCapability = isEmployer || isAdmin;
  const hasManagerCapability = isManager || isAdmin || isOwner;

  return {
    userId: user.id,
    email: user.email || "",
    role,
    globalRole,
    permissions,
    isCandidate,
    isEmployer,
    isAdmin,
    isManager,
    isOwner,
    hasEmployerCapability,
    hasManagerCapability,
  };
}

export function hasPermission(
  caps: UserCapabilities,
  permission: string
): boolean {
  if (caps.isOwner) return true;
  if (caps.permissions.includes(permission)) return true;

  const ROLE_DEFAULTS: Record<GlobalRole, string[]> = {
    owner: ["*"],
    platform_admin: [
      "opportunities.read", "opportunities.create", "opportunities.verify", "opportunities.delete",
      "users.read", "users.manage", "organizations.manage", "organizations.verify",
      "scrapers.read", "scrapers.run", "analytics.read",
    ],
    manager: [
      "opportunities.read", "opportunities.verify", "scrapers.read", "scrapers.run", "analytics.read",
    ],
    moderator: ["opportunities.read", "users.read"],
    support: ["opportunities.read", "users.read"],
    user: ["opportunities.read", "opportunities.apply", "opportunities.bookmark"],
  };

  const defaults = ROLE_DEFAULTS[caps.globalRole] || ROLE_DEFAULTS.user;
  return defaults.includes(permission) || defaults.includes("*");
}

export function canAccessEmployer(caps: UserCapabilities): boolean {
  return caps.hasEmployerCapability;
}

export function canAccessAdmin(caps: UserCapabilities): boolean {
  return caps.isAdmin || caps.isManager;
}

export function canPerformAdminAction(caps: UserCapabilities, permission: string): boolean {
  if (caps.isOwner) return true;
  if (caps.isAdmin) return hasPermission(caps, permission);
  return hasPermission(caps, permission);
}
