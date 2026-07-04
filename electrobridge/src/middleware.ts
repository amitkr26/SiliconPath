import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { FEATURES } from './lib/feature-flags';

const GATED_PATHS = [
  '/api/feed',
  '/api/network',
  '/api/companies',
  '/api/messages',
  '/api/notifications',
  '/api/people'
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isGated = GATED_PATHS.some(p => path === p || path.startsWith(p + '/'));

  if (isGated && !FEATURES.LINKEDIN_ENABLED) {
    return NextResponse.json(
      { error: 'Feature not yet available' },
      { status: 503 }
    );
  }

  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );
  await supabase.auth.getUser();
  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
