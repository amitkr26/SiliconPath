import { NextResponse } from "next/server";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";

// QA audit security: this route previously accepted hardcoded passwords
// authored in the bundle ("amitkr26", "siliconpath-admin-2026").
// Now it validates ONLY against the server-side ADMIN_PASSWORD env var with
// a constant-time compare. The returned token is an HMAC session signed with
// ADMIN_HMAC_SECRET (fallback: ADMIN_PASSWORD); verification lives in
// lib/admin-auth.ts. If ADMIN_PASSWORD is unset the route fails closed.
const HMAC_KEY = process.env.ADMIN_HMAC_SECRET || process.env.ADMIN_PASSWORD || "";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const passwordInput = (body.password || "").trim();

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword || !HMAC_KEY) {
      return NextResponse.json(
        { authenticated: false, error: "Authentication is not configured on this deployment." },
        { status: 503 }
      );
    }

    if (!safeEqual(passwordInput, adminPassword)) {
      return NextResponse.json(
        { authenticated: false, error: "Invalid admin password." },
        { status: 401 }
      );
    }

    const sessionId = randomBytes(16).toString("hex");
    const expiry = Date.now() + 24 * 60 * 60 * 1000;
    const token = `${sessionId}.${expiry}.${createHmac("sha256", HMAC_KEY).update(`${sessionId}.${expiry}`).digest("hex")}`;

    return NextResponse.json({
      authenticated: true,
      token,
      admin: {
        username: "admin",
        email: "",
        role: "superadmin",
      },
    });
  } catch (err) {
    return NextResponse.json({ authenticated: false, error: "Authentication request failed" }, { status: 500 });
  }
}