import type { SupabaseClient } from "@supabase/supabase-js";

// User-scoped data: applications + saved opportunities (mirrors the frontend
// /api/applications and /api/bookmarks routes — user_id scoping server-side).

const APPLICATION_SELECT =
  "id, status, applied_at, notes, updated_at, opportunity:opportunities(id, title, organization, slug, deadline, location)";

export async function listApplications(
  client: SupabaseClient,
  userId: string
): Promise<any[]> {
  const { data, error } = await client
    .from("applications")
    .select(APPLICATION_SELECT)
    .eq("user_id", userId)
    .order("applied_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// v1 addition: the current product tracks applications via external Apply links
// (no in-app create exists). Dedupes on (user_id, opportunity_id).
export async function createApplication(
  client: SupabaseClient,
  userId: string,
  opportunityId: string,
  notes?: string
): Promise<any> {
  const { data: existing } = await client
    .from("applications")
    .select("id")
    .eq("user_id", userId)
    .eq("opportunity_id", opportunityId)
    .maybeSingle();
  if (existing) return { id: existing.id, created: false };

  const { data, error } = await client
    .from("applications")
    .insert({
      user_id: userId,
      opportunity_id: opportunityId,
      status: "applied",
      applied_at: new Date().toISOString(),
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .select("id, status, applied_at, notes")
    .single();
  if (error) throw error;
  return { ...data, created: true };
}

export async function updateApplication(
  client: SupabaseClient,
  userId: string,
  id: string,
  updates: { status?: string; notes?: string }
): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.notes !== undefined) patch.notes = updates.notes;
  const { error } = await client
    .from("applications")
    .update(patch)
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function deleteApplication(
  client: SupabaseClient,
  userId: string,
  id: string
): Promise<void> {
  const { error } = await client
    .from("applications")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function listSavedOpportunities(
  client: SupabaseClient,
  userId: string,
  limit: number,
  offset: number
): Promise<{ data: any[]; count: number }> {
  const { data, error, count } = await client
    .from("saved_opportunities")
    .select("id, user_id, opportunity_id, saved_at, opportunities(*)")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return { data: data || [], count: count ?? 0 };
}

export async function saveOpportunity(
  client: SupabaseClient,
  userId: string,
  opportunityId: string
): Promise<{ id: string; created: boolean }> {
  const { data: existing } = await client
    .from("saved_opportunities")
    .select("id")
    .eq("user_id", userId)
    .eq("opportunity_id", opportunityId)
    .maybeSingle();
  if (existing) return { id: existing.id, created: false };

  const { data, error } = await client
    .from("saved_opportunities")
    .insert({ user_id: userId, opportunity_id: opportunityId })
    .select("id")
    .single();
  if (error) throw error;
  return { id: data.id, created: true };
}

export async function deleteSavedOpportunity(
  client: SupabaseClient,
  userId: string,
  id: string
): Promise<void> {
  const { error } = await client
    .from("saved_opportunities")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}