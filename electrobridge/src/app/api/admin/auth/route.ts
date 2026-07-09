import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = await request.json();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.json({ authenticated: false, error: "Server misconfigured" }, { status: 500 });
  }

  if (password === adminPassword) {
    const token = Buffer.from(`admin:${adminPassword}`).toString("base64");
    return NextResponse.json({ authenticated: true, token });
  }

  return NextResponse.json({ authenticated: false, error: "Invalid password" }, { status: 401 });
}
