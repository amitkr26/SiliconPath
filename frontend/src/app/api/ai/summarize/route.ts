import { NextRequest, NextResponse } from "next/server";
import { summarizeOpportunity } from "@/lib/ai/summarizer";
import { serverError } from "@berojgardegreewala/api";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  // ponytail: require authentication to prevent free AI credit consumption
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { rawDescription, title, org } = await request.json();

    if (!rawDescription || !title) {
      return NextResponse.json(
        { error: "rawDescription and title are required." },
        { status: 400 }
      );
    }

    const summary = await summarizeOpportunity(rawDescription, title, org || "");
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error in AI summarize:", error);
    return serverError("Summarization failed");
  }
}
