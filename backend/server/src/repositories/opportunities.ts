import type { SupabaseClient } from "@supabase/supabase-js";

// Public opportunity shape returned to clients (mirrors frontend mapDbOpportunityToClient).
export interface Opportunity {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  location: string | null;
  stipend: string | null;
  deadline: string | null;
  eligibility: string | null;
  apply_url: string | null;
  source_url: string | null;
  source_type: string | null;
  tags: string[] | null;
  organization: { name: string; slug: string | null; website: string | null } | null;
  is_expired: boolean;
  created_at: string | null;
}

export interface OpportunityListParams {
  page: number;
  limit: number;
  category?: string;
  eligibility?: string;
  location?: string;
  deadline?: string;
  search?: string;
}

function mapRow(row: any): Opportunity {
  const deadline = row.deadline || null;
  return {
    id: row.id,
    slug: row.slug || row.id,
    title: row.title,
    description: row.description || null,
    category: row.category || null,
    location: row.location || null,
    stipend: row.stipend || null,
    deadline,
    eligibility: row.eligibility || null,
    apply_url: row.apply_url || row.apply_link || null,
    source_url: row.source_url || null,
    source_type: row.source_type || null,
    tags: row.tags || null,
    organization: row.organizations
      ? {
          name: row.organizations.name || row.organization,
          slug: row.organizations.slug || null,
          website: row.organizations.website || null,
        }
      : null,
    is_expired: !!deadline && !isNaN(Date.parse(deadline)) && new Date(deadline) < new Date(),
    created_at: row.created_at || null,
  };
}

const SELECT = "*, organizations(name, slug, website)";

export async function listOpportunities(
  client: SupabaseClient,
  params: OpportunityListParams
): Promise<{ data: Opportunity[]; count: number }> {
  const rangeFrom = (params.page - 1) * params.limit;
  const rangeTo = rangeFrom + params.limit - 1;

  let query = client
    .from("opportunities")
    .select(SELECT, { count: "exact" })
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (params.category && params.category !== "All") {
    query = query.eq("category", params.category);
  }
  if (params.eligibility && params.eligibility !== "All") {
    query = query.ilike("eligibility", `%${params.eligibility}%`);
  }
  if (params.location && params.location !== "All") {
    query = query.ilike("location", `%${params.location}%`);
  }
  if (params.deadline && params.deadline !== "All") {
    query = query
      .not("deadline", "is", null)
      .order("deadline", { ascending: true });
  }
  if (params.search && params.search.trim()) {
    const q = params.search.trim();
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const { data, error, count } = await query.range(rangeFrom, rangeTo);

  if (error) throw error;
  return { data: (data || []).map(mapRow), count: count ?? 0 };
}

export async function getOpportunityByIdOrSlug(
  client: SupabaseClient,
  idOrSlug: string
): Promise<Opportunity | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  let query = client.from("opportunities").select(SELECT).eq("is_active", true);
  query = isUuid ? query.eq("id", idOrSlug) : query.eq("slug", idOrSlug);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : null;
}