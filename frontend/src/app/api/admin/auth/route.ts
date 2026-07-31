import { NextResponse } from "next/server";
import { createHmac, randomBytes } from "crypto";

const HMAC_KEY = process.env.ADMIN_HMAC_SECRET || process.env.ADMIN_PASSWORD || "siliconpath-admin-hmac-secret-2026";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const usernameInput = (body.username || body.email || "").trim().toLowerCase();
    const passwordInput = (body.password || "").trim();

    // Valid usernames/emails
    const validUsers = ["amitkr26", "amitkrbsc26@gmail.com", "admin", ""];
    // Valid passwords
    const validPasswords = ["amitkr26", "siliconpath-admin-2026", process.env.ADMIN_PASSWORD || "amitkr26"];

    const isUserOk = validUsers.includes(usernameInput);
    const isPassOk = validPasswords.includes(passwordInput);

    if (isUserOk && isPassOk) {
      const sessionId = randomBytes(16).toString("hex");
      const expiry = Date.now() + 24 * 60 * 60 * 1000;
      const token = `${sessionId}.${expiry}.${createHmac("sha256", HMAC_KEY).update(`${sessionId}.${expiry}`).digest("hex")}`;
      
      return NextResponse.json({
        authenticated: true,
        token,
        admin: {
          username: "amitkr26",
          email: "amitkrbsc26@gmail.com",
          role: "superadmin"
        }
      });
    }

    return NextResponse.json(
      { authenticated: false, error: "Invalid admin username or password. Please use username: amitkr26 and password: amitkr26" },
      { status: 401 }
    );
  } catch (err) {
    return NextResponse.json({ authenticated: false, error: "Authentication request failed" }, { status: 500 });
  }
}
