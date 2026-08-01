import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawUsername = searchParams.get("username") || "";
  const username = rawUsername.trim().toLowerCase().replace(/^@/, "");

  if (!username) {
    return NextResponse.json({ available: false, error: "Username is required." }, { status: 400 });
  }

  // Validate username format (3-20 chars, alphanumeric and underscores)
  const isValidFormat = /^[a-z0-9_]{3,20}$/.test(username);
  if (!isValidFormat) {
    return NextResponse.json({
      available: false,
      error: "Username must be 3-20 characters long and contain only letters, numbers, and underscores.",
    });
  }

  // Reserved system usernames
  const RESERVED_USERNAMES = ["admin", "root", "support", "help", "official", "berojgardegreewala", "siliconpath", "drdo", "isro", "csir"];
  if (RESERVED_USERNAMES.includes(username)) {
    return NextResponse.json({ available: false, error: "This username is reserved." });
  }

  if (!isAdminConfigured || !supabaseAdmin?.from) {
    // If DB is not available, allow standard username
    return NextResponse.json({ available: true, username });
  }

  try {
    const { data: existingUser } = await supabaseAdmin
      .from("user_profiles")
      .select("username")
      .eq("username", username)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({ available: false, error: "This username is already taken. Please try another." });
    }

    return NextResponse.json({ available: true, username });
  } catch (error) {
    console.error("Error checking username availability:", error);
    return NextResponse.json({ available: true, username });
  }
}
