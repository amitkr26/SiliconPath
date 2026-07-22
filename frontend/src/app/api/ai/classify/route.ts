import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/ai/providers";
import { serverError } from "@berojgardegreewala/api";

export async function POST(request: NextRequest) {
  try {
    const { title, description } = await request.json();
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const prompt = `Classify this semiconductor/electronics opportunity into exactly one category from: JRF, SRF, PhD, Postdoc, Research Associate, Internship, Trainee, Govt Job, Private Job, Fellowship, Scholarship, Faculty.

Title: ${title}
${description ? `Description: ${description}` : ""}

Respond with ONLY the category name, nothing else.`;

    const { text } = await callAI(prompt, "You are a VLSI/electronics opportunity classifier. Respond only with the category name.", { feature: "classify" });
    const category = text.trim();
    const validCategories = ["JRF", "SRF", "PhD", "Postdoc", "Research Associate", "Internship", "Trainee", "Govt Job", "Private Job", "Fellowship", "Scholarship", "Faculty"];

    return NextResponse.json({
      category: validCategories.includes(category) ? category : "Unclassified",
      confidence: validCategories.includes(category) ? "high" : "low",
    });
  } catch (error) {
    console.error("Classify error:", error);
    return serverError("Classification failed");
  }
}
