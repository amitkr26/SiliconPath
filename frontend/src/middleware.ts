import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { applyRateLimit } from '@berojgardegreewala/api';

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://berojgardegreewala.vercel.app',
  'https://www.berojgardegreewala.vercel.app',
  'https://ponytail.dev',
  'https://www.ponytail.dev',
  'https://omniroute.online',
  'https://www.omniroute.online',
];

const MUTATION_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

const GATED_PATHS = [
  '/api/feed',
  '/api/network',
  '/api/companies',
  '/api/messages',
  '/api/notifications',
  '/api/people',
  '/api/resume',
  '/api/applications',
];

function addSecurityHeaders(response: NextResponse): void {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co https://plausible.io https://js.sentry-cdn.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co https://*.vercel.app https://img.youtube.com",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co https://plausible.io https://o4506458839588864.ingest.us.sentry.io",
    "frame-src 'self' https://www.youtube.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "report-uri /api/csp-report",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
}

function rateLimiterKey(path: string): 'api' | 'auth' | 'search' | 'scrape' | 'ai' | null {
  if (path.startsWith('/api/auth')) return 'auth';
  if (path.startsWith('/api/search')) return 'search';
  if (path.startsWith('/api/scrape') || path.startsWith('/api/cron/scrape')) return 'scrape';
  if (path.startsWith('/api/ai')) return 'ai';
  if (path.startsWith('/api/') && !path.startsWith('/api/cron')) return 'api';
  return null;
}

function csrfGuard(request: NextRequest): Response | null {
  if (!MUTATION_METHODS.includes(request.method)) return null;
  if (request.method === 'POST' && (
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname.startsWith('/api/subscribe') ||
    request.nextUrl.pathname.startsWith('/api/report-issue')
  )) return null;

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const source = origin || (referer ? new URL(referer).origin : null);
  if (!source) return null;
  if (ALLOWED_ORIGINS.includes(source)) return null;

  return new Response(JSON.stringify({ error: 'CSRF validation failed' }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const csrfResponse = csrfGuard(request);
  if (csrfResponse) return csrfResponse;

  const limiter = rateLimiterKey(path);
  if (limiter) {
    const rateLimitResponse = await applyRateLimit(request, limiter);
    if (rateLimitResponse) return rateLimitResponse;
  }

  const isGated = GATED_PATHS.some(p => path === p || path.startsWith(p + '/'));
  const isAdminPage = path.startsWith('/admin');
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

  const { data: { user } } = await supabase.auth.getUser();

  if (isGated && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (isAdminPage && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  addSecurityHeaders(supabaseResponse);
  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
