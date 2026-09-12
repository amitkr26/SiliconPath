import { createClient } from '@supabase/supabase-js';
import { neon } from '@neondatabase/serverless';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ── DB2: Supabase Secondary — archive sink for old news articles ──
// Only used by archive-news and health check. Social tables consolidated into db1.
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

