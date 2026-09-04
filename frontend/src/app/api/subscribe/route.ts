import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(request: NextRequest) {
  if (!isAdminConfigured) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { success } = await checkRateLimit(`subscribe:${ip}`, 5, 60 * 60);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    );
  }

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const email = (body.email || "").toString().trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const keywords = Array.isArray(body.keywords) ? body.keywords : [];
    const categories = Array.isArray(body.categories) ? body.categories : [];

    // Secure unsubscribe: every subscription gets a random token; the DELETE
    // path (below) requires it. The subscribers table already had the
    // unsubscribe_token column — it was never populated.
    const unsubscribeToken =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID().replace(/-/g, "")
        : `${Date.now()}${Math.random().toString(36).slice(2)}`;

    const { error } = await supabaseAdmin
      .from("subscribers")
      .insert([
        {
          email,
          keywords,
          categories,
          unsubscribe_token: unsubscribeToken,
        },
      ]);

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Email already subscribed" }, { status: 409 });
      }
      console.error("Supabase subscribe insert error:", error.message);
      return NextResponse.json({ error: "Failed to save subscription. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ message: "Successfully subscribed!", unsubscribe_token: unsubscribeToken }, { status: 201 });
  } catch (error: any) {
    console.error("Error subscribing:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminConfigured) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const token = searchParams.get("token");
    if (!email || !token) {
      return NextResponse.json(
        { error: "email and token are required. Use the unsubscribe link from your email." },
        { status: 400 }
      );
    }

    // QA audit security: deleting by raw email alone let anyone unsubscribe
    // anyone. The token must match the row's unsubscribe_token.
    const { data: row } = await supabaseAdmin
      .from("subscribers")
      .select("id, unsubscribe_token")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (!row) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }
    if (!row.unsubscribe_token || row.unsubscribe_token !== token) {
      return NextResponse.json({ error: "Invalid unsubscribe token" }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from("subscribers")
      .delete()
      .eq("id", row.id);

    if (error) throw error;
    return NextResponse.json({ message: "Unsubscribed successfully" });
  } catch (error: any) {
    console.error("Error unsubscribing:", error);
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }
}

// GET = unsubscribe link clicked from an email (mail clients only send GET).
// Same token validation as DELETE.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("token")) {
    return DELETE(
      new NextRequest(request.url, {
        method: "DELETE",
        headers: request.headers,
      })
    );
  }
  return NextResponse.json(
    { error: "email and token are required. Use the unsubscribe link from your email." },
    { status: 400 }
  );
}
