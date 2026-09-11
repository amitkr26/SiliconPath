import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCandidateCertifications, createCandidateCertification } from "@/lib/candidate-profile-store";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const certifications = await getCandidateCertifications(user.id);
  return NextResponse.json({ certifications });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, issuing_org, issue_date, expiration_date, credential_id, credential_url } = body;

  if (!name || !issuing_org) {
    return NextResponse.json({ error: "Certification name and issuing organization are required" }, { status: 400 });
  }

  const cert = await createCandidateCertification(user.id, {
    name: String(name).trim(),
    issuing_org: String(issuing_org).trim(),
    issue_date: issue_date ? String(issue_date).trim() : null,
    expiration_date: expiration_date ? String(expiration_date).trim() : null,
    credential_id: credential_id ? String(credential_id).trim() : null,
    credential_url: credential_url ? String(credential_url).trim() : null,
  });

  return NextResponse.json({ certification: cert }, { status: 201 });
}
