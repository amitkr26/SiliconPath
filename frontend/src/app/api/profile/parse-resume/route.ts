import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callAI } from "@/lib/ai/providers";
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

  // Maximum upload size: 10MB
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  // If no AI provider is configured, the handler will use the deterministic parser fallback below

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "Uploaded file is empty" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 413 });
    }

    const arrayBuffer = await file.arrayBuffer();
    // pdf-parse v2.4.5 requires Uint8Array, not Buffer, but uploadToCloudStorage needs Buffer
    const buffer = Buffer.from(arrayBuffer);
    // pdf-parse v2.4.5 requires Uint8Array, not Buffer
    const data = new Uint8Array(arrayBuffer);

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
      logger.warn("[Resume Parser] Document AI fallback triggered.", { reason: docAiError?.message });
    }

    let extractedText = "";

    // 1. If text/markdown file, read directly
    if (file.type.includes("text") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      extractedText = buffer.toString("utf-8");
    } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      // 2. If PDF, extract text with PDFParse
      try {
        const { PDFParse } = await import("pdf-parse");
        const parser = new PDFParse({ data, verbosity: 0 });
        const textResult = await parser.getText();
        extractedText = textResult.text || "";
      } catch (parseError: any) {
        logger.warn("[Resume Parser] PDF extraction failed", { error: parseError?.message });
        return NextResponse.json({ 
          error: "Failed to parse PDF document. The file may be corrupted, password-protected, or invalid." 
        }, { status: 422 });
      }
    } else {
      return NextResponse.json({ 
        error: "Unsupported file format. Please upload a PDF, TXT, or MD resume." 
      }, { status: 415 });
    }

    if (!extractedText.trim()) {
      return NextResponse.json({ error: "No text content could be extracted from the file." }, { status: 422 });
    }

    // Detect scanned PDFs (no selectable text layer)
    const significantText = extractedText
      .replace(/\s+/g, "")
      .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, "")
      .replace(/page\s*\d+(\s*of\s*\d+)?/gi, "").length;

    if (significantText < 20) {
      return NextResponse.json({ 
        error: "This PDF appears to contain no selectable text. Please upload a text-based PDF or use OCR." 
      }, { status: 422 });
    }

    let parsedProfile: any = {};

    if (hasAIProviderConfigured()) {
      try {
        const parsePrompt = `
You are an expert resume parsing system for semiconductor and electronics engineering resumes. 
Extract information from the raw resume text and return it as a structured JSON object matching the schema below.

Raw Resume Text:
"""
${extractedText}
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
  "skills": ["skill1", "skill2"],
  "experience": [
    {
      "company": "company name",
      "role": "role title",
      "duration": "duration",
      "description": "short description of work"
    }
  ],
  "education": [
    {
      "institution": "university/college name",
      "degree": "degree/course",
      "duration": "graduation year or duration"
    }
  ],
  "projects": [
    {
      "name": "project title",
      "description": "project details"
    }
  ]
}
`;
        const aiRes = await callAI(parsePrompt, undefined, { feature: "resume_parse" });
        let jsonText = aiRes.text.trim();
        if (jsonText.startsWith("```")) {
          jsonText = jsonText.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
        }
        parsedProfile = JSON.parse(jsonText);
      } catch (aiErr: any) {
        logger.warn("[Resume Parser] AI structuring failed, applying deterministic fallback parser", { error: aiErr?.message });
        const { parseResumeTextDeterministically } = await import("@/lib/resume-text-parser");
        parsedProfile = parseResumeTextDeterministically(extractedText);
      }
    } else {
      const { parseResumeTextDeterministically } = await import("@/lib/resume-text-parser");
      parsedProfile = parseResumeTextDeterministically(extractedText);
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
