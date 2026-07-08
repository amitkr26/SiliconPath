import { getDB } from "../db/index.js";

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  category: string;
  location: string | null;
  stipend: string | null;
  deadline: string | null;
  eligibility: string | null;
  description: string | null;
  apply_link: string | null;
  source_url: string;
  tags: string[];
  created_at: string;
}

export interface OpportunityFilters {
  category?: string;
  location?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export async function listOpportunities(filters: OpportunityFilters = {}): Promise<Opportunity[]> {
  const { client } = getDB("core");
  let query = client
    .from("opportunities")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(filters.offset ?? 0, (filters.offset ?? 0) + (filters.limit ?? 30) - 1);

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.location) query = query.ilike("location", `%${filters.location}%`);
  if (filters.q) query = query.or(`title.ilike.%${filters.q}%,description.ilike.%${filters.q}%,organization.ilike.%${filters.q}%`);

  const { data, error } = await query;
  if (error) throw new Error(`[data] listOpportunities: ${error.message}`);
  return (data ?? []) as Opportunity[];
}

export async function getOpportunity(id: string): Promise<Opportunity | null> {
  const { client } = getDB("core");
  const { data, error } = await client.from("opportunities").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`[data] getOpportunity: ${error.message}`);
  return (data as Opportunity) ?? null;
}

export async function listCategories(): Promise<string[]> {
  const { client } = getDB("core");
  const { data, error } = await client.from("opportunities").select("category").eq("is_active", true);
  if (error) throw new Error(`[data] listCategories: ${error.message}`);
  return Array.from(new Set((data ?? []).map((r: { category: string }) => r.category))).sort();
}
