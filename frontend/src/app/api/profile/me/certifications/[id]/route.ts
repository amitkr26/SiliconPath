import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteCandidateCertification } from "@/lib/candidate-profile-store";

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

  const success = await deleteCandidateCertification(user.id, id);
  return NextResponse.json({ success });
}
