import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getURL } from '@/lib/utils';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error) {
    console.error('[Auth callback]', error, errorDescription);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, getURL()));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', getURL()));
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error('[Auth callback] exchange failed:', exchangeError.message);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, getURL()));
  }

  return NextResponse.redirect(new URL('/dashboard', getURL()));
}
