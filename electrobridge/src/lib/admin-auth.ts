import { NextRequest } from "next/server";

/**
 * Verify admin access.
 *
 * SECURITY: Never use a NEXT_PUBLIC_ prefixed variable for the admin secret,
 * those are inlined into the client bundle. ADMIN_PASSWORD and CRON_SECRET are
 * server-only environment variables.
 *
 * Accepts either:
 *   1. `x-admin-password: <ADMIN_PASSWORD>` header
 *   2. `Authorization: Bearer <ADMIN_PASSWORD>` header
 *   3. `Authorization: Bearer <CRON_SECRET>` header (for scheduled jobs)
 */
export function verifyAdmin(request: NextRequest | Request): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const cronSecret = process.env.CRON_SECRET;

  const directPassword = request.headers.get("x-admin-password");
  if (adminPassword && directPassword && directPassword === adminPassword) {
    return true;
  }

  const authHeader = request.headers.get("authorization") || "";
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/);
  if (bearerMatch) {
    const token = bearerMatch[1];
    if (adminPassword && token === adminPassword) return true;
    if (cronSecret && token === cronSecret) return true;
  }

  return false;
}

/**
 * Verify a request originates from an authorized cron job (CRON_SECRET only).
 */
export function verifyCron(request: NextRequest | Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const authHeader = request.headers.get("authorization") || "";
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/);
  return bearerMatch ? bearerMatch[1] === cronSecret : false;
}
