import { createClient } from '@supabase/supabase-js';
import { neon } from '@neondatabase/serverless';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ── DB2: Supabase Secondary — legacy social mirror (read-only fallback) ──
// Retained for compat; live social tables were consolidated into db1.
function getDb2() {
  if (!process.env.SUPABASE_2_URL || !process.env.SUPABASE_2_SERVICE_ROLE_KEY) {
    return null;
  }
  try {
    return createClient(
      process.env.SUPABASE_2_URL,
      process.env.SUPABASE_2_SERVICE_ROLE_KEY
    );
  } catch (error: any) {
    console.error('[DB Setup] Failed to initialize Supabase db2:', error.message);
    return null;
  }
}

// ── DB3: Neon1 — analytics, cache & mirrors ──
// Tables: click_events, page_views, search_queries, trending_cache,
//         keyword_stats, opportunities_mirror, news_mirror
function getNeon1() {
  if (!process.env.NEON_1_DATABASE_URL) return null;
  try {
    return neon(process.env.NEON_1_DATABASE_URL);
  } catch (error: any) {
    console.error('[DB Setup] Failed to initialize Neon db3:', error.message);
    return null;
  }
}

// ── DB4: Neon2 — cache mirror (subset of Neon1) ──
// Tables: page_views, search_queries, click_events
function getNeon2() {
  if (!process.env.NEON_2_DATABASE_URL) return null;
  try {
    return neon(process.env.NEON_2_DATABASE_URL);
  } catch (error: any) {
    console.error('[DB Setup] Failed to initialize Neon db4:', error.message);
    return null;
  }
}

export const db1 = supabaseAdmin;
export const db2 = getDb2();
export const neon1 = getNeon1();
export const neon2 = getNeon2();

// Alias exports to prevent breaking existing code
export const neonPrimary = neon1;
export const neonSecondary = neon2;

// Public anon clients (for SSR without service role)
export function getDb1Anon() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function getDb2Anon() {
  return createClient(
    process.env.SUPABASE_2_URL!,
    process.env.SUPABASE_2_ANON_KEY!
  );
}

// Purpose router
export function getDB(purpose:
  | 'opportunities'
  | 'news'
  | 'auth'
  | 'social'
  | 'analytics'
  | 'cache'
  | 'search'
) {
  switch (purpose) {
    case 'opportunities':
    case 'news':
    case 'auth':
      return { type: 'supabase' as const, client: db1 };
    case 'social':
      return { type: 'supabase' as const, client: db2 };
    case 'analytics':
      return { type: 'neon' as const, client: neon1 };
    case 'cache':
    case 'search':
      return { type: 'neon' as const, client: neon2 };
    default:
      return { type: 'supabase' as const, client: db1 };
  }
}

// User profiles synchronization between DB1 and DB2
export async function syncProfile(userId: string) {
  if (!db1 || !db2) return null;
  try {
    const { data: profile, error: fetchErr } = await db1
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (fetchErr || !profile) return null;

    const { data: upserted, error: upsertErr } = await db2
      .from("user_profiles")
      .upsert(profile)
      .select()
      .single();

    if (upsertErr) {
      console.error("[syncProfile] DB2 upsert error:", upsertErr.message);
      return null;
    }
    return upserted;
  } catch (err: any) {
    console.error("[syncProfile] error:", err.message);
    return null;
  }
}

