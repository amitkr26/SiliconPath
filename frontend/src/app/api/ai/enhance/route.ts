import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callAI } from "@/lib/ai/providers";
import { apiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, sectionType, content } = body;

    let aiPrompt = "";
    if (sectionType === "summary") {
      aiPrompt = `
You are an expert resume writer specializing in semiconductor and electronics engineering.
Create a compelling, professional 3-4 sentence resume summary/bio for an engineer based on:
Headline: ${content.headline || ""}
Skills: ${(content.skills || []).join(", ")}

Focus on technical keywords, research potential, and core VLSI/RTL/electronics competencies. Do not include boilerplate introductory text, greetings, or explanations. Just output the finished summary bio text directly.
`;
    } else if (sectionType.startsWith("experience_") || sectionType.startsWith("project_")) {
      aiPrompt = `
You are an expert technical editor. Rewrite the following resume work experience or project description to make it look professional, clean, action-oriented, and optimized for Applicant Tracking Systems (ATS) in the VLSI/hardware/semiconductor space:
"""
${content}
"""

Instructions:
1. Use strong action verbs (e.g. designed, verified, simulated, synthesized, verified, analyzed).
2. Highlight methodologies, tools used (e.g. Verilog, SystemVerilog, UVM, Cadence, Synopsys, Vivado), and metrics where possible.
3. Organize as clean, concise professional bullet points or a short paragraph.
4. Output ONLY the optimized description. No comments, no markdown codeblocks, no intro text.
`;
    } else {
      return NextResponse.json({ error: "Invalid section type" }, { status: 400 });
    }

    const aiRes = await callAI(aiPrompt, undefined, { feature: "resume_enhance" });
    const enhancedText = aiRes.text.trim();

    return NextResponse.json({ success: true, enhancedText });
  } catch (err: any) {
    return apiError(err, "ai-enhance");
  }
}
