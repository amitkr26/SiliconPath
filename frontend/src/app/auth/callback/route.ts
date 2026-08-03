import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const nextPath = searchParams.get('next') || '/dashboard';

  if (error) {
    console.error('[Auth callback]', error, errorDescription);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url));
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error('[Auth callback] exchange failed:', exchangeError.message);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, request.url));
  }

  // Ensure Google OAuth user gets a unique handle generated from their email
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: existingProfile } = await supabase
        .from("user_profiles")
        .select("id, username")
        .eq("id", user.id)
        .maybeSingle();

      if (!existingProfile || !existingProfile.username) {
        const baseName = (user.email || "").split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
        let handle = baseName || `user_${Date.now()}`;

        const { data: check } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("username", handle)
          .maybeSingle();

        if (check && check.id !== user.id) {
          handle = `${handle}_vlsi`;
        }

        await supabase.from("user_profiles").upsert({
          id: user.id,
          email: user.email,
          display_name: user.user_metadata?.full_name || handle,
          username: handle,
          avatar_url: user.user_metadata?.avatar_url || null,
          account_type: "candidate",
          is_profile_public: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" });
      }
    }
  } catch (profileErr) {
    console.error("[Auth callback] profile creation error:", profileErr);
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
