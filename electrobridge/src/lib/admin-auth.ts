import { NextRequest } from "next/server";

/**
 * Verify admin access.
 *
 * Accepts EITHER:
 *  1. x-admin-password header matching ADMIN_PASSWORD (server-only env var)
 *  2. Authorization: Bearer <token> where token === ADMIN_PASSWORD
 *  3. Authorization: Bearer <token> where token === CRON_SECRET (for cron jobs)
 *
 * SECURITY: never expose these via NEXT_PUBLIC_* env vars.
 */
export function verifyAdmin(request: NextRequest | Request): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const cronSecret = process.env.CRON_SECRET;

  const directPassword = request.headers.get("x-admin-password");
  if (adminPassword && directPassword && directPassword === adminPassword) {
    return true;
  }

  const authHeader = request.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/);
  if (match) {
    const token = match[1];
    if (adminPassword && token === adminPassword) return true;
    if (cronSecret && token === cronSecret) return true;
  }

  return false;
}

export function verifyCron(request: NextRequest | Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const authHeader = request.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/);
  return match ? match[1] === cronSecret : false;
}
