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
  '/applications',
  '/saved',
];

const EMPLOYER_ONLY_PATHS = [
  '/post-job',
  '/employer',
  '/api/employer',
];

const ADMIN_PATHS = ['/api/admin'];

function addSecurityHeaders(response: NextResponse): void {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co https://plausible.io https://js.sentry-cdn.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co https://*.vercel.app https://img.youtube.com https://*.unsplash.com https://images.unsplash.com",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co https://plausible.io https://o4506458839588864.ingest.us.sentry.io",
    "frame-src 'self' https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://youtube-nocookie.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "report-uri /api/csp-report",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
}

function rateLimiterKey(path: string): 'api' | 'auth' | 'search' | 'scrape' | 'ai' | 'admin' | null {
  if (path.startsWith('/api/scrapers')) return null;
  if (path.startsWith('/api/admin')) return 'admin';
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
  const code = request.nextUrl.searchParams.get("code");

  if (code && (path === "/" || path === "/login")) {
    return NextResponse.redirect(new URL(`/auth/callback?code=${encodeURIComponent(code)}`, request.url));
  }

  const csrfResponse = csrfGuard(request);
  if (csrfResponse) return csrfResponse;

  const limiter = rateLimiterKey(path);
  if (limiter) {
    const rateLimitResponse = await applyRateLimit(request, limiter);
    if (rateLimitResponse) return rateLimitResponse;
  }

  const EMPLOYER_AUTH_PATHS = ['/employer/login', '/employer/signup', '/employer/register'];
  const isEmployerAuth = EMPLOYER_AUTH_PATHS.some(p => path === p || path.startsWith(p + '/'));
  const isGated = GATED_PATHS.some(p => path === p || path.startsWith(p + '/'));
  const isEmployerOnly = EMPLOYER_ONLY_PATHS.some(p => path === p || path.startsWith(p + '/')) && !isEmployerAuth;

  const authHeader = request.headers.get('authorization');
  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
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

  const adminPassword = process.env.ADMIN_PASSWORD || "";
  const directPassword = request.headers.get("x-admin-password") || "";
  const isAdminRequest = Boolean(
    adminPassword &&
    directPassword &&
    adminPassword.length === directPassword.length &&
    (() => {
      let diff = 0;
      for (let i = 0; i < adminPassword.length; i++) {
        diff |= adminPassword.charCodeAt(i) ^ directPassword.charCodeAt(i);
      }
      return diff === 0;
    })()
  );

  // Auth gate check
  if ((isGated || isEmployerOnly) && !user && !isAdminRequest) {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const destination = request.nextUrl.pathname + (request.nextUrl.search || "");
    url.searchParams.set('redirectTo', destination);
    return NextResponse.redirect(url);
  }

  // Progressive RBAC: Users can have multiple capabilities.
  // A candidate can become an employer later. An employer can also be a candidate.
  // Admin role is additive — it doesn't remove candidate/employer capabilities.

  // P0.5 RBAC: server-side employer role gate (was login-only — any logged-in
  // user could hit employer pages/APIs). Role lives in auth user_metadata
  // (set at signup from accountType, editable via profile/me which rejects
  // "admin"). Admin APIs are NOT gated here — the admin console authenticates
  // via x-admin-password/HMAC tokens (no Supabase session), enforced
  // fail-closed by requireAdmin at every /api/admin route.
  //
  // NOTE: This checks user_metadata only (cheap, no DB query). Legacy signups
  // where account_type lives only in user_profiles (not metadata) are not
  // caught here — those routes do their own requireEmployerRole() check.
  if (isEmployerOnly && user && !isAdminRequest) {
    const role = user.user_metadata?.role as string | undefined;
    const accountType = user.user_metadata?.account_type as string | undefined;
    if (role !== "employer" && role !== "admin" && accountType !== "provider") {
      if (path.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  // Admin/Manager API route gate — requires admin password/HMAC (no Supabase session needed)
  const isAdminOnly = ADMIN_PATHS.some(p => path === p || path.startsWith(p + '/'));
  if (isAdminOnly && !isAdminRequest) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  addSecurityHeaders(supabaseResponse);
  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
