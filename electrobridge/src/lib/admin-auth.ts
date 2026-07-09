export function verifyAdmin(request: Request): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;

  const directPassword = request.headers.get("x-admin-password");
  if (directPassword === password) return true;

  const authHeader = request.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/);
  if (match) {
    try {
      const decoded = Buffer.from(match[1], "base64").toString("utf-8");
      if (decoded === `admin:${password}`) return true;
    } catch {}
  }

  return false;
}
