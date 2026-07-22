import { createClient } from '@supabase/supabase-js';
import { neon } from '@neondatabase/serverless';

// ── DB1: Supabase Primary — Core public platform data ──
// Tables: opportunities, news_articles, companies, scrapers_config,
//         subscribers, suggestions, link_check_results
function getDb1() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  try {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  } catch (error: any) {
    console.error('[DB Setup] Failed to initialize Supabase db1:', error.message);
    return null;
  }
}

// ── DB2: Supabase Secondary — User & social layer ──
// Tables: user_profiles, connections, feed_posts, messages,
//         notifications, saved_opportunities, applications,
//         community_posts, skill_endorsements, recommendations
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

// ── DB3: Neon Primary — Analytics & operational logs ──
// Tables: scrape_logs, ai_usage_log, platform_events,
//         link_check_logs, cron_health, error_logs
function getNeon1() {
  if (!process.env.NEON_1_DATABASE_URL) return null;
  try {
    return neon(process.env.NEON_1_DATABASE_URL);
  } catch (error: any) {
    console.error('[DB Setup] Failed to initialize Neon db3:', error.message);
    return null;
  }
}

// ── DB4: Neon Secondary — Cache & search acceleration ──
// Tables: trending_cache, popular_companies_cache,
//         keyword_stats, opportunities_search_index, api_response_cache
function getNeon2() {
  if (!process.env.NEON_2_DATABASE_URL) return null;
  try {
    return neon(process.env.NEON_2_DATABASE_URL);
  } catch (error: any) {
    console.error('[DB Setup] Failed to initialize Neon db4:', error.message);
    return null;
  }
}

export const db1 = getDb1();
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

