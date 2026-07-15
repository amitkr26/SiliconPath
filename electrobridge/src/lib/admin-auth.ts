import { NextRequest } from "next/server";
import { createHmac } from "crypto";

function verifyAdminToken(token: string, secret: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [sessionId, expiry, sig] = parts;
  if (Date.now() > parseInt(expiry, 10)) return false;
  const expected = createHmac("sha256", secret).update(`${sessionId}.${expiry}`).digest("hex");
  return sig === expected;
}

export function verifyAdmin(request: NextRequest | Request): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const cronSecret = process.env.CRON_SECRET;
  const hmacKey = process.env.ADMIN_HMAC_SECRET || adminPassword;

  const directPassword = request.headers.get("x-admin-password");
  if (adminPassword && directPassword && directPassword === adminPassword) {
    return true;
  }

  const authHeader = request.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/);
  if (match) {
    const token = match[1];
    if (adminPassword && token === adminPassword) return true;
    if (adminPassword && verifyAdminToken(token, hmacKey!)) return true;
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
