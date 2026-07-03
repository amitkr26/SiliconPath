import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { callAI } from "@/lib/ai/providers";

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  if (!isAdminConfigured) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }

  try {
    const { data: opportunity } = await supabaseAdmin
      .from("opportunities")
      .select("*")
      .eq("slug", params.slug)
      .single();

    if (!opportunity) {
      return NextResponse.json(
        { error: "Opportunity not found." },
        { status: 404 }
      );
    }

    const prompt = `You are helping an Indian electronics researcher understand this opportunity.

Opportunity: ${opportunity.title}
Organization: ${opportunity.organization}
Description: ${opportunity.description || "N/A"}
Eligibility: ${opportunity.eligibility || "N/A"}
Category: ${opportunity.category}

Provide a helpful, concise analysis in this JSON format:
{
  "what_you_will_do": "2-3 sentences about the actual research/work",
  "why_apply": "2-3 sentences on career value and growth",
  "typical_documents": ["CV", "MSc marksheets", "NET certificate"],
  "tips": "1-2 specific tips for this type of application",
  "difficulty_level": "Low / Medium / High",
  "career_stage": "Fresh MSc / 1-2 years experience / PhD required"
}`;

    const response = await callAI(prompt, undefined, {
      preferredProvider: "gemini",
      feature: "opportunity-summary",
    });

    const summary = JSON.parse(
      response.text.replace(/```json|```/g, "").trim()
    );

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error in AI opportunity summary:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
