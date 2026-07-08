import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client bound to the request's cookies. Uses the ANON key
 * (not the service role) so RLS applies — a signed-in user only ever reaches their
 * own rows. Service-role access stays in getDB('core') for trusted server jobs.
 *
 * Uses the @supabase/ssr getAll/setAll cookie interface (the get/set/remove form
 * was removed from the CookieMethodsServer type in 0.5.x).
 */
export function createSupabaseServer() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("[auth] Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  return createServerClient(url, anon, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component — safe to ignore; middleware refreshes the session.
        }
      },
    },
  });
}

export async function getCurrentUser() {
  const supabase = createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
