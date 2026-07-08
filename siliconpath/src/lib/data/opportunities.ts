import { getDB } from "../db/index.js";
import type { Opportunity, OpportunityFilters } from "../types.js";

/**
 * Public opportunity reads. All go through getDB('core'). No caller opens its
 * own connection. Filters are applied server-side so the anonymous browse path
 * never over-fetches.
 */
export async function listOpportunities(
  filters: OpportunityFilters = {}
): Promise<{ rows: Opportunity[]; total: number }> {
  const { client } = getDB("core");
  const limit = Math.min(filters.limit ?? 24, 100);
  const offset = filters.offset ?? 0;

  let query = client
    .from("opportunities")
    .select("*", { count: "exact" })
    .eq("is_active", true);

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.location) query = query.ilike("location", `%${filters.location}%`);
  if (filters.deadlineAfter) query = query.gte("deadline", filters.deadlineAfter);
  if (filters.search) {
    // Match title OR organization OR description.
    const term = filters.search.replace(/[%,]/g, " ").trim();
    query = query.or(
      `title.ilike.%${term}%,organization.ilike.%${term}%,description.ilike.%${term}%`
    );
  }

  query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(`[data] listOpportunities failed: ${error.message}`);
  return { rows: (data ?? []) as Opportunity[], total: count ?? 0 };
}

export async function getOpportunity(id: string): Promise<Opportunity | null> {
  const { client } = getDB("core");
  const { data, error } = await client.from("opportunities").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`[data] getOpportunity failed: ${error.message}`);
  return (data as Opportunity) ?? null;
}

export async function listCategoriesWithCounts(): Promise<Record<string, number>> {
  const { client } = getDB("core");
  const { data, error } = await client.from("opportunities").select("category").eq("is_active", true);
  if (error) throw new Error(`[data] listCategoriesWithCounts failed: ${error.message}`);
  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { category: string }[]) {
    counts[row.category] = (counts[row.category] ?? 0) + 1;
  }
  return counts;
}
