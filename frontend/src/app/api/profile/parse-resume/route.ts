import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callAI } from "@/lib/ai/providers";
import { PDFParse } from "pdf-parse";
import { apiError } from "@/lib/api-utils";
import { logger } from "@/lib/logger";

function hasAIProviderConfigured(): boolean {
  const keys = [
    "GROQ_API_KEY", "OPENROUTER_API_KEY", "GEMINI_API_KEY",
    "NVIDIA_NIM_API_KEY", "AWS_BEARER_TOKEN_BEDROCK",
    "CLOUDFLARE_AI_TOKEN", "HUGGINGFACE_API_KEY",
  ];
  return keys.some((k) => !!process.env[k]);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasAIProviderConfigured()) {
    return NextResponse.json(
      { error: "Resume parsing is not available. No AI provider is configured." },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Try Document AI first as per GCP Credits Utilization Plan
    try {
      const { parseWithDocumentAI } = await import("@/lib/resume/document-ai-parser");
      const docAiProfile = await parseWithDocumentAI(buffer);
      logger.info("[Resume Parser] Document AI parsing succeeded.");
      if (docAiProfile.full_name || docAiProfile.email || docAiProfile.skills.length > 0) {
        return NextResponse.json({ success: true, profile: docAiProfile });
      } else {
        throw new Error("Document AI returned an empty profile mapping.");
      }
    } catch (docAiError: any) {
      logger.warn("[Resume Parser] Document AI fallback triggered.", { reason: docAiError.message });
    }

    let pdfText = "";
    try {
      const parser = new PDFParse({ data: buffer, verbosity: 0 });
      const textResult = await parser.getText();
      pdfText = textResult.text;
    } catch (parseError: any) {
      logger.error("PDF Parsing error", { error: parseError instanceof Error ? parseError.message : String(parseError) });
      return NextResponse.json({ error: "Could not read the PDF contents. Make sure it is not encrypted or corrupted." }, { status: 422 });
    }

    if (!pdfText.trim()) {
      return NextResponse.json({ error: "No text content could be extracted from the PDF." }, { status: 422 });
    }

    const parsePrompt = `
You are an expert resume parsing system for semiconductor and electronics engineering resumes. 
Extract information from the raw resume text and return it as a structured JSON object matching the schema below.

Raw Resume Text:
"""
${pdfText}
"""

Return ONLY a valid JSON object matching the following structure. Do not output markdown, notes, or wrap in backticks:
{
  "full_name": "extracted full name",
  "email": "extracted email",
  "phone": "extracted phone",
  "headline": "a professional short headline e.g., RTL Design Engineer | MS in VLSI",
  "about": "a summary/bio extracted from the resume",
  "current_position": "latest position title if currently working",
  "current_org": "latest employer/organization if currently working",
  "city": "city location",
  "country": "country location",
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {
      "company": "company name",
      "role": "role title",
      "duration": "duration (e.g. June 2024 - Present or 2 years)",
      "description": "bullet points or short description of work"
    }
  ],
  "education": [
    {
      "institution": "university/college name",
      "degree": "degree/course (e.g. B.Tech, M.S.)",
      "duration": "graduation year or duration"
    }
  ],
  "projects": [
    {
      "name": "project title",
      "description": "project details",
      "technologies": "comma-separated tech stack used",
      "link": "link if any"
    }
  ],
  "publications": [
    {
      "title": "paper title",
      "venue": "journal/conference name",
      "year": "publication year",
      "doi": "doi url/code if any"
    }
  ]
}
`;

    const aiRes = await callAI(parsePrompt, undefined, { feature: "resume_parse" });
    let jsonText = aiRes.text.trim();
    
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    let parsedProfile = {};
    try {
      parsedProfile = JSON.parse(jsonText);
    } catch (jsonErr) {
      logger.error("JSON parsing error of AI output", { jsonText, error: jsonErr instanceof Error ? jsonErr.message : String(jsonErr) });
      return NextResponse.json({ error: "Failed to structure the extracted text. Please try again." }, { status: 422 });
    }

    let resumeUrl = "";
    try {
      const { uploadToCloudStorage } = await import("@/lib/storage/gcp-storage");
      const filename = `resumes/${user.id}-${Date.now()}.pdf`;
      resumeUrl = await uploadToCloudStorage(buffer, filename, "application/pdf");
      logger.info("[Resume Parser] Uploaded to GCP Storage", { resumeUrl });
    } catch (uploadError: any) {
      logger.warn("[Resume Parser] GCP Storage upload failed or not configured", { error: uploadError.message });
    }

    return NextResponse.json({ success: true, profile: parsedProfile, resume_url: resumeUrl });
  } catch (err: any) {
    return apiError(err, "parse-resume");
  }
}
