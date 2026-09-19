import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser Supabase client.
 *
 * During CI (`next build` in GitHub Actions) the NEXT_PUBLIC_SUPABASE_* env
 * vars are empty, and any client component that calls this at render time gets
 * statically pre-rendered at build. `createBrowserClient('', '')` throws
 * "Your project's URL and API key are required", which failed the build on
 * /companies and /notifications (both call createClient() at component top
 * level, so it runs during static pre-render).
 *
 * Fallback to harmless placeholders when the env is absent so the client
 * constructs without throwing. At build these pages render as empty shells
 * (no network calls happen during pre-render); at runtime on Vercel the real
 * env vars are present, so the real client is used. This centralizes the fix
 * instead of editing every client page.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
  return createBrowserClient(url, anonKey);
}
