import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

function generateSuggestions(base: string): string[] {
  const clean = base.replace(/[^a-z0-9_]/g, "");
  return [
    `${clean}_vlsi`,
    `${clean}_asic`,
    `${clean}_silicon`,
    `${clean}_2026`,
    `${clean}_hardware`,
  ];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawUsername = searchParams.get("username") || "";
  const username = rawUsername.trim().toLowerCase().replace(/^@/, "");

  if (!username) {
    return NextResponse.json({ available: false, error: "Username is required.", suggestions: [] }, { status: 400 });
  }

  const suggestions = generateSuggestions(username);

  // Validate username format (3-35 chars, alphanumeric and underscores)
  const isValidFormat = /^[a-z0-9_]{3,35}$/.test(username);
  if (!isValidFormat) {
    return NextResponse.json({
      available: false,
      error: "Username must be 3-35 characters long (letters, numbers, underscores).",
      suggestions,
    });
  }

  // Reserved system usernames
  const RESERVED_USERNAMES = ["admin", "root", "support", "help", "official", "berojgardegreewala", "siliconpath", "drdo", "isro", "csir"];
  if (RESERVED_USERNAMES.includes(username)) {
    return NextResponse.json({ available: false, error: "This username is reserved.", suggestions });
  }

  if (!isAdminConfigured || !supabaseAdmin?.from) {
    return NextResponse.json({ available: true, username, suggestions });
  }

  try {
    const { data: existingUser } = await supabaseAdmin
      .from("user_profiles")
      .select("username")
      .ilike("username", username)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({ available: false, error: "Username already taken.", suggestions });
    }

    return NextResponse.json({ available: true, username, suggestions });
  } catch (error) {
    console.error("Error checking username availability:", error);
    return NextResponse.json({ available: true, username, suggestions });
  }
}
