import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
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

    const { error } = await supabaseAdmin
      .from("subscribers")
      .insert([
        {
          email,
          keywords,
          categories,
        },
      ]);

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Email already subscribed" }, { status: 409 });
      }
      console.error("Supabase subscribe insert error:", error.message);
      return NextResponse.json({ error: "Failed to save subscription. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ message: "Successfully subscribed!" }, { status: 201 });
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
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("subscribers")
      .delete()
      .eq("email", email.trim().toLowerCase());

    if (error) throw error;
    return NextResponse.json({ message: "Unsubscribed successfully" });
  } catch (error: any) {
    console.error("Error unsubscribing:", error);
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }
}
