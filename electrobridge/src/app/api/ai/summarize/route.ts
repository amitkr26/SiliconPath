import { NextRequest, NextResponse } from "next/server";
import { summarizeOpportunity } from "@/lib/ai/summarizer";

export async function POST(request: NextRequest) {
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
    return NextResponse.json(
      { error: "Summarization failed" },
      { status: 500 }
    );
  }
}
