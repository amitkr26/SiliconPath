import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Refreshes the Supabase session cookie on every request so server components
// see a current auth state. Does NOT gate routes — progressive disclosure means
// pages decide their own access; anonymous users browse freely.
//
// Uses the @supabase/ssr getAll/setAll cookie interface (get/set/remove was
// removed from CookieMethodsServer in 0.5.x).
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return response; // fail open for public pages

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/health).*)"],
};
