import type { SupabaseClient } from "@supabase/supabase-js";

// Organizations + news — read-only public content, mirrors the frontend routes.

export async function listOrganizations(
  client: SupabaseClient,
  page: number,
  limit: number
): Promise<{ data: any[]; count: number }> {
  const rangeFrom = (page - 1) * limit;
  const { data, error, count } = await client
    .from("organizations")
    .select("id, name, slug, description, website_url, logo_url, location, is_verified", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(rangeFrom, rangeFrom + limit - 1);
  if (error) throw error;
  return { data: data || [], count: count ?? 0 };
}

export async function getOrganizationBySlug(
  client: SupabaseClient,
  slug: string
): Promise<any | null> {
  const { data, error } = await client
    .from("organizations")
    .select("id, name, slug, description, website_url, logo_url, location, is_verified")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listNews(
  client: SupabaseClient,
  page: number,
  limit: number
): Promise<{ data: any[]; count: number }> {
  const rangeFrom = (page - 1) * limit;
  const { data, error, count } = await client
    .from("news_articles")
    .select("id, slug, title, summary, source, source_url, image_url, published_at, tags", { count: "exact" })
    .eq("is_active", true)
    .order("published_at", { ascending: false })
    .range(rangeFrom, rangeFrom + limit - 1);
  if (error) throw error;
  return { data: data || [], count: count ?? 0 };
}