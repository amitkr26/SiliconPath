import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateCandidateProject, deleteCandidateProject } from "@/lib/candidate-profile-store";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const id = resolvedParams?.id;
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const updated = await updateCandidateProject(user.id, id, body);
  if (!updated) return NextResponse.json({ error: "Project not found or forbidden" }, { status: 404 });

  return NextResponse.json({ project: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const id = resolvedParams?.id;
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const success = await deleteCandidateProject(user.id, id);
  return NextResponse.json({ success });
}
