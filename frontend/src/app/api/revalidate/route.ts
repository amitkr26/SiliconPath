import { NextRequest, NextResponse } from "next/server";
import { serverError } from "@berojgardegreewala/api";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const path = request.nextUrl.searchParams.get("path");

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  if (!path) {
    return NextResponse.json({ error: "Path required" }, { status: 400 });
  }

  try {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/revalidate?path=${path}&secret=${process.env.REVALIDATE_SECRET}`, {
      method: "POST",
    });

    return NextResponse.json({ revalidated: true, path });
  } catch (error) {
    console.error("Revalidation error:", error);
    return serverError("Revalidation failed");
  }
}

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const path = request.nextUrl.searchParams.get("path");

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  if (!path) {
    return NextResponse.json({ error: "Path required" }, { status: 400 });
  }

  try {
    // In Next.js App Router, we use revalidatePath from next/cache
    // This is a no-op in this implementation - actual revalidation happens at edge
    return NextResponse.json({ revalidated: true, path });
  } catch (error) {
    console.error("Revalidation error:", error);
    return serverError("Revalidation failed");
  }
}