import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { neon } from '@neondatabase/serverless';

function trySupabase(url: string | undefined, key: string | undefined, name: string) {
  if (!url || !key) {
    console.warn(`[DB Setup] Supabase ${name} is NOT configured. Missing URL or Key.`);
    return undefined as any;
  }
  try {
    return createSupabaseClient(url, key);
  } catch (error: any) {
    console.error(`[DB Setup] Failed to initialize Supabase ${name}:`, error.message);
    return undefined as any;
  }
}

function tryNeon(url: string | undefined, name: string) {
  if (!url) {
    console.warn(`[DB Setup] Neon ${name} is NOT configured. Missing URL.`);
    return undefined as any;
  }
  try {
    return neon(url);
  } catch (error: any) {
    console.error(`[DB Setup] Failed to initialize Neon ${name}:`, error.message);
    return undefined as any;
  }
}

export const db1 = trySupabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  'Primary (db1)'
);

export const db2 = trySupabase(
  process.env.SUPABASE_2_URL,
  process.env.SUPABASE_2_SERVICE_ROLE_KEY,
  'Secondary (db2)'
);

export const neonPrimary = tryNeon(process.env.NEON_1_DATABASE_URL, 'Primary (db3)');

export const neonSecondary = tryNeon(process.env.NEON_2_DATABASE_URL, 'Secondary (db4)');

export function getDB(purpose:
  | 'opportunities'
  | 'news'
  | 'auth'
  | 'community'
  | 'analytics'
  | 'news_archive'
  | 'read_replica'
) {
  switch (purpose) {
    case 'analytics':
      return { type: 'neon' as const, client: neonPrimary };
    case 'news_archive':
      return { type: 'supabase' as const, client: db2 };
    case 'read_replica':
      return { type: 'neon' as const, client: neonSecondary };
    default:
      return { type: 'supabase' as const, client: db1 };
  }
}
