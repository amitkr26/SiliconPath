import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';

export async function createClient() {
  let cookieStore: any;
  try {
    cookieStore = await cookies();
  } catch {
    cookieStore = (cookies as any)();
  }

  let token: string | null = null;
  try {
    const headerStore = await headers();
    const authHeader = headerStore.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  } catch {
    try {
      const headerStore = (headers as any)();
      const authHeader = headerStore.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    } catch {}
  }

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
      cookies: {
        getAll() {
          return cookieStore && typeof cookieStore.getAll === 'function'
            ? cookieStore.getAll()
            : [];
        },
        setAll(cookiesToSet) {
          try {
            if (cookieStore && typeof cookieStore.set === 'function') {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            }
          } catch {}
        },
      },
    }
  );

  if (token) {
    const origGetUser = client.auth.getUser.bind(client.auth);
    client.auth.getUser = (jwt?: string) => origGetUser(jwt || token!);
  }

  return client;
}
