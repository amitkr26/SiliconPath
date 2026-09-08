import { NextResponse } from "next/server";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";

// QA audit security: this route previously accepted hardcoded passwords
// authored in the bundle ("amitkr26", "siliconpath-admin-2026").
// Now it validates ONLY against the server-side ADMIN_PASSWORD env var with
// a constant-time compare. The returned token is an HMAC session signed with
// ADMIN_HMAC_SECRET (fallback: ADMIN_PASSWORD); verification lives in
// lib/admin-auth.ts. If ADMIN_PASSWORD is unset the route fails closed.
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function POST(request: Request) {
  const hmacKey = process.env.ADMIN_HMAC_SECRET || process.env.ADMIN_PASSWORD || "";
  try {
    const body = await request.json().catch(() => ({}));
    const usernameInput = (body.username || "").trim().toLowerCase();
    const passwordInput = (body.password || "").trim();

    const expectedUsername = (process.env.ADMIN_USERNAME || "").trim().toLowerCase();
    const expectedPassword = (process.env.ADMIN_PASSWORD || "").trim();

    if (!expectedPassword || !hmacKey) {
      return NextResponse.json(
        { authenticated: false, error: "Authentication is not configured on this deployment." },
        { status: 503 }
      );
    }

    if (usernameInput && !safeEqual(usernameInput, expectedUsername)) {
      return NextResponse.json(
        { authenticated: false, error: "Invalid admin username." },
        { status: 401 }
      );
    }

    if (!safeEqual(passwordInput, expectedPassword)) {
      return NextResponse.json(
        { authenticated: false, error: "Invalid admin password." },
        { status: 401 }
      );
    }

    const sessionId = randomBytes(16).toString("hex");
    const expiry = Date.now() + 24 * 60 * 60 * 1000;
    const token = `${sessionId}.${expiry}.${createHmac("sha256", hmacKey).update(`${sessionId}.${expiry}`).digest("hex")}`;

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