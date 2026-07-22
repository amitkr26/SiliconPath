import { NextRequest, NextResponse } from "next/server";
import { supabase, isConfigured } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rate-limiter";
import { subscribeSchema, validateOrThrow } from "@/lib/validation";
import { serverError } from "@berojgardegreewala/api";

export async function POST(request: NextRequest) {
  if (!isConfigured) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  // Durable rate limiter is async and returns { success, remaining, resetAt }.
  const { success } = await checkRateLimit(`subscribe:${ip}`, 3, 60 * 60);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    );
  }

  try {
    const raw = await request.json();
    const { email, keywords, categories } = validateOrThrow(subscribeSchema, raw);
    const normalizedEmail = email.trim().toLowerCase();

    // v2 subscribers schema: email, keywords, categories (no is_active column).
    const { error } = await supabase
      .from("subscribers")
      .insert([
        {
          email: normalizedEmail,
          keywords: keywords || [],
          categories: categories || [],
        },
      ]);

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Email already subscribed" }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ message: "Successfully subscribed!" }, { status: 201 });
  } catch (error) {
    console.error("Error subscribing:", error);
    return serverError("Failed to subscribe");
  }
}

export async function DELETE(request: NextRequest) {
  if (!isConfigured) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // v2: no soft-delete column; remove the subscriber row.
    const { error } = await supabase
      .from("subscribers")
      .delete()
      .eq("email", email.trim().toLowerCase());

    if (error) throw error;
    return NextResponse.json({ message: "Unsubscribed successfully" });
  } catch (error) {
    console.error("Error unsubscribing:", error);
    return serverError("Failed to unsubscribe");
  }
}
