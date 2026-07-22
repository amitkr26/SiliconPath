import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { callAI } from "@/lib/ai/providers";
import { serverError } from "@berojgardegreewala/api";

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

Provide a helpful, concise analysis strictly in the following JSON format. DO NOT use markdown formatting (like \`\`\`json), DO NOT include any text outside the JSON object. Return ONLY the raw JSON object:
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

    let summary;
    try {
      let rawText = response.text.replace(/```json|```/gi, "").trim();
      const startIndex = rawText.indexOf("{");
      const endIndex = rawText.lastIndexOf("}");
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        rawText = rawText.substring(startIndex, endIndex + 1);
      }
      summary = JSON.parse(rawText);
    } catch (parseError) {
      console.error("AI returned malformed JSON:", response.text);
      summary = {
        what_you_will_do: "Details unavailable. Please refer to the full description.",
        why_apply: "This opportunity provides relevant experience in your field.",
        typical_documents: ["CV"],
        tips: "Make sure your application is tailored to the role requirements.",
        difficulty_level: "Medium",
        career_stage: "Applicable to relevant researchers"
      };
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error in AI opportunity summary:", error);
    return serverError("Failed to generate summary");
  }
}
