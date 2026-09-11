import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getURL } from '@/lib/utils';

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/', getURL()));
}
