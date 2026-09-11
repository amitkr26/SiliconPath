import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

// QA audit security: the admin UI previously trusted a hardcoded localStorage
// token with zero server involvement. Sessions are now re-validated against
// the server (x-admin-password or HMAC bearer token via verifyAdmin).
export async function POST(request: NextRequest) {
  const ok = await verifyAdmin(request);
  return NextResponse.json({ authenticated: ok }, { status: ok ? 200 : 401 });
}
