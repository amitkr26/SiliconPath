import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callAI } from "@/lib/ai/providers";
import { PDFParse } from "pdf-parse";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from the PDF buffer
    let pdfText = "";
    try {
      const parser = new PDFParse({ data: buffer, verbosity: 0 });
      const textResult = await parser.getText();
      pdfText = textResult.text;
    } catch (parseError: any) {
      console.error("PDF Parsing error:", parseError);
      return NextResponse.json({ error: "Could not read the PDF contents. Make sure it is not encrypted or corrupted." }, { status: 422 });
    }

    if (!pdfText.trim()) {
      return NextResponse.json({ error: "No text content could be extracted from the PDF." }, { status: 422 });
    }

    // Call AI to parse text into structured user profile JSON
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
    
    // Clean potential markdown blocks
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    let parsedProfile = {};
    try {
      parsedProfile = JSON.parse(jsonText);
    } catch (jsonErr) {
      console.error("JSON parsing error of AI output:", jsonText, jsonErr);
      // Fallback: try parsing using regex or standard defaults
      return NextResponse.json({ error: "Failed to structure the extracted text. Please try again." }, { status: 422 });
    }

    return NextResponse.json({ success: true, profile: parsedProfile });
  } catch (err: any) {
    console.error("Error in parse-resume route:", err);
    return NextResponse.json({ error: err.message || "Failed to process resume" }, { status: 500 });
  }
}
