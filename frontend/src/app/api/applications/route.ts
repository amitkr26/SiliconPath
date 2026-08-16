import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('applications')
    .select('id, status, applied_at, notes, updated_at, opportunity:opportunities(id, title, organization:organizations(name), slug, deadline, location), user_profile:user_profiles!applications_user_id_fkey(display_name, avatar_url, headline)')
    .eq('user_id', user.id)
    .order('applied_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // P0.4: live schema has no `organization` text — preserve the wire contract
  // (client reads application.opportunity.organization as a string).
  const applications = (data || []).map((app: any) => ({
    ...app,
    opportunity: app.opportunity
      ? { ...app.opportunity, organization: app.opportunity.organization?.name ?? null }
      : app.opportunity,
  }));
  return NextResponse.json({ applications });
}

// POST: record an application (created by the in-app "Apply Now" tracking).
// Idempotent per (user_id, opportunity_id) — applying again returns the
// existing row instead of a duplicate.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { opportunity_id, status = 'applied' } = body;
  if (!opportunity_id) return NextResponse.json({ error: 'opportunity_id required' }, { status: 400 });

  const { data: existing } = await supabase
    .from('applications')
    .select('id')
    .eq('user_id', user.id)
    .eq('opportunity_id', opportunity_id)
    .maybeSingle();
  if (existing) return NextResponse.json({ application: existing, alreadyApplied: true }, { status: 200 });

  const { data, error } = await supabase
    .from('applications')
    .insert({ user_id: user.id, opportunity_id, status })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ application: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { id, status, notes } = body;

  if (!id) return NextResponse.json({ error: 'Application ID required' }, { status: 400 });

  const updates: Record<string, string> = { updated_at: new Date().toISOString() };
  if (status) updates.status = status;
  if (notes !== undefined) updates.notes = notes;

  const { error } = await supabase
    .from('applications')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'Application ID required' }, { status: 400 });

  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
