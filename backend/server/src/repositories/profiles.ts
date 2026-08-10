import type { SupabaseClient } from "@supabase/supabase-js";

// Columns safe to expose on public profiles — never email / email_notifications.
// Mirrors the frontend PUBLIC_PROFILE_FIELDS from src/lib/utils.ts.
const PUBLIC_PROFILE_FIELDS =
  "id, username, display_name, headline, bio, location, country, job_title, current_company, experience_years, skills, interests, linkedin_url, github_url, website_url, avatar_url, is_open_to_work, profile_views, account_type, created_at";

export async function getProfileByUsername(
  client: SupabaseClient,
  username: string
): Promise<any | null> {
  const { data, error } = await client
    .from("user_profiles")
    .select(PUBLIC_PROFILE_FIELDS)
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProfileById(
  client: SupabaseClient,
  id: string
): Promise<any | null> {
  const { data, error } = await client
    .from("user_profiles")
    .select(PUBLIC_PROFILE_FIELDS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}