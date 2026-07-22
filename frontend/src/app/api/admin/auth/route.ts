import { NextResponse } from "next/server";
import { createHmac, randomBytes } from "crypto";

const HMAC_KEY = process.env.ADMIN_HMAC_SECRET || process.env.ADMIN_PASSWORD || "fallback-do-not-use-in-prod";

export async function POST(request: Request) {
  const { password } = await request.json();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.json({ authenticated: false, error: "Server misconfigured" }, { status: 500 });
  }

  if (password === adminPassword) {
    const sessionId = randomBytes(16).toString("hex");
    const expiry = Date.now() + 24 * 60 * 60 * 1000;
    const token = `${sessionId}.${expiry}.${createHmac("sha256", HMAC_KEY).update(`${sessionId}.${expiry}`).digest("hex")}`;
    return NextResponse.json({ authenticated: true, token });
  }

  return NextResponse.json({ authenticated: false, error: "Invalid password" }, { status: 401 });
}
