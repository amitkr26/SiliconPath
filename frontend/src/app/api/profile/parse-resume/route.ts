import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callAI } from "@/lib/ai/providers";
import { apiError } from "@/lib/api-utils";
import { logger } from "@/lib/logger";
import { parseResumeTextDeterministically } from "@/lib/resume-text-parser";

function hasAIProviderConfigured(): boolean {
  const keys = [
    "GROQ_API_KEY", "OPENROUTER_API_KEY", "GEMINI_API_KEY",
    "NVIDIA_NIM_API_KEY", "AWS_BEARER_TOKEN_BEDROCK",
    "CLOUDFLARE_AI_TOKEN", "HUGGINGFACE_API_KEY",
  ];
  return keys.some((k) => !!process.env[k]);
}

// Magic bytes for legacy Microsoft Word 97-2003 binary .doc format (OLE Compound File)
function isLegacyBinaryDoc(buffer: Buffer): boolean {
  if (buffer.length < 8) return false;
  return (
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0 &&
    buffer[4] === 0xa1 &&
    buffer[5] === 0xb1 &&
    buffer[6] === 0x1a &&
    buffer[7] === 0xe1
  );
}

export async function POST(request: NextRequest) {
  // Auth check: only authenticated users can parse resumes
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Maximum upload size: 10MB
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
    const buffer = Buffer.from(arrayBuffer);
    const data = new Uint8Array(arrayBuffer);

    // Check for unsupported legacy binary .doc file
    if (isLegacyBinaryDoc(buffer) || (file.name.endsWith(".doc") && !file.name.endsWith(".docx"))) {
      return NextResponse.json({
        error: "Legacy binary (.doc) format is not supported. Please open the file in Word or Google Docs and save as (.docx) or (.pdf) before uploading.",
        isLegacyDoc: true,
      }, { status: 415 });
    }

    let extractedText = "";

    // 1. TXT / Markdown file
    if (file.type.includes("text") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      extractedText = buffer.toString("utf-8");
    }
    // 2. DOCX file (Word OpenXML)
    else if (
      file.name.endsWith(".docx") ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      try {
        const mammoth = await import("mammoth");
        const docxResult = await mammoth.extractRawText({ buffer });
        extractedText = docxResult.value || "";
      } catch (docxErr: any) {
        logger.warn("[Resume Parser] DOCX extraction failed", { error: docxErr?.message });
        return NextResponse.json({
          error: "Failed to parse DOCX document. Please ensure the Word file is not corrupted.",
        }, { status: 422 });
      }
    }
    // 3. PDF file
    else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      try {
        const { PDFParse } = await import("pdf-parse");
        const parser = new PDFParse({ data, verbosity: 0 });
        const textResult = await parser.getText();
        extractedText = textResult.text || "";
      } catch (parseError: any) {
        logger.warn("[Resume Parser] PDF extraction failed", { error: parseError?.message });
        return NextResponse.json({
          error: "Failed to parse PDF document. The file may be corrupted, password-protected, or invalid.",
        }, { status: 422 });
      }
    } else {
      return NextResponse.json({
        error: "Unsupported file format. Please upload a PDF, DOCX, or TXT resume.",
      }, { status: 415 });
    }

    if (!extractedText.trim()) {
      return NextResponse.json({
        error: "No readable text content could be extracted from this document.",
      }, { status: 422 });
    }

    // Detect scanned PDFs / image-only files with insufficient selectable text
    const significantChars = extractedText
      .replace(/\s+/g, "")
      .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, "")
      .replace(/page\s*\d+(\s*of\s*\d+)?/gi, "").length;

    if (significantChars < 20) {
      return NextResponse.json({
        error: "This document appears to be an image-only or scanned file with no selectable text. Please upload a text-based PDF or DOCX resume.",
      }, { status: 422 });
    }

    // Structure the extracted text into resume fields
    let parsedProfile: any = {};

    if (hasAIProviderConfigured()) {
      try {
        const parsePrompt = `
You are an expert resume parsing system specializing in semiconductor, VLSI, and electronics engineering resumes.
Extract all relevant candidate details from the raw resume text below and structure them into a valid JSON object.

Raw Resume Text:
"""
${extractedText.slice(0, 8000)}
"""

Return ONLY a valid JSON object matching the following structure without markdown fences or additional commentary:
{
  "full_name": "candidate full name",
  "email": "email address",
  "phone": "phone number",
  "headline": "professional title e.g. RTL Design Engineer | ASIC Verification",
  "about": "concise 2-4 sentence professional summary",
  "location": "City, Country",
  "skills": ["skill1", "skill2"],
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "duration": "Duration e.g. 2022 - Present",
      "description": "bullet points of accomplishments"
    }
  ],
  "education": [
    {
      "institution": "University / College",
      "degree": "Degree e.g. B.Tech in Electronics & Communication",
      "duration": "Year e.g. 2020 - 2024",
      "cgpa": "CGPA or percentage"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Details of what was designed/implemented",
      "technologies": "Tools / tech used e.g. Verilog, Vivado"
    }
  ],
  "certifications": [
    {
      "name": "Certification title",
      "year": "Year"
    }
  ],
  "publications": [
    {
      "title": "Paper / research title",
      "venue": "Conference / Journal",
      "year": "Year"
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
        logger.warn("[Resume Parser] AI structuring failed, using deterministic fallback", { error: aiErr?.message });
        parsedProfile = parseResumeTextDeterministically(extractedText);
      }
    } else {
      parsedProfile = parseResumeTextDeterministically(extractedText);
    }

    return NextResponse.json({
      success: true,
      profile: parsedProfile,
      rawTextLength: extractedText.length,
    });
  } catch (err: any) {
    return apiError(err, "parse-resume");
  }
}
