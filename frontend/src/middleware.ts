import { NextResponse, type NextRequest } from 'next/server';
import { applyRateLimit } from '@berojgardegreewala/api';

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://siliconpath.vercel.app',
  'https://www.siliconpath.vercel.app',
];

const MUTATION_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

function addSecurityHeaders(response: NextResponse): void {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co https://*.vercel.app https://img.youtube.com",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co",
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

function rateLimiterKey(path: string): 'api' | 'search' | 'scrape' | 'ai' | null {
  if (path.startsWith('/api/search')) return 'search';
  if (path.startsWith('/api/scrape') || path.startsWith('/api/cron/scrape')) return 'scrape';
  if (path.startsWith('/api/ai')) return 'ai';
  if (path.startsWith('/api/') && !path.startsWith('/api/cron')) return 'api';
  return null;
}

function csrfGuard(request: NextRequest): Response | null {
  if (!MUTATION_METHODS.includes(request.method)) return null;
  if (request.method === 'POST' && (
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

  const response = NextResponse.next({ request });
  addSecurityHeaders(response);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
