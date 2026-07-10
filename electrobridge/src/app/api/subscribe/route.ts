import { NextRequest, NextResponse } from "next/server";
import { supabase, isConfigured } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rate-limiter";
import { subscribeSchema, validateOrThrow } from "@/lib/validation";

export async function POST(request: NextRequest) {
  if (!isConfigured) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed, remaining } = checkRateLimit(ip, 3, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    );
  }

  try {
    const raw = await request.json();
    const { email, keywords, categories } = validateOrThrow(subscribeSchema, raw);
    const normalizedEmail = email.trim().toLowerCase();

    const { error } = await supabase
      .from("subscribers")
      .insert([
        {
          email: normalizedEmail,
          keywords: keywords || [],
          categories: categories || [],
          is_active: true,
        },
      ]);

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Email already subscribed" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json(
      { message: "Successfully subscribed!" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error subscribing:", error);
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isConfigured) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("subscribers")
      .update({ is_active: false })
      .eq("email", email);

    if (error) throw error;

    return NextResponse.json({ message: "Unsubscribed successfully" });
  } catch (error) {
    console.error("Error unsubscribing:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 }
    );
  }
}
