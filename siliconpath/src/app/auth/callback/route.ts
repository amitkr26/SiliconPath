import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/auth/server";

// Exchanges the OAuth/email-confirmation code for a session, then lands the user
// on the dashboard (feature-discovery), per progressive disclosure.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = createSupabaseServer();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(`${origin}/dashboard`);
}
