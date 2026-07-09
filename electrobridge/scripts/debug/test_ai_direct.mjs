import fs from 'fs';
import path from 'path';

// Load env variables
const envPath = path.resolve(process.cwd(), '.env.local');
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let geminiKey = process.env.GEMINI_API_KEY;

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
    if (match) {
      let key = match[1].trim();
      let value = match[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      if (key === 'GEMINI_API_KEY') geminiKey = value;
    }
  });
}

async function testCallAI() {
  const prompt = `You are helping an Indian electronics researcher understand this opportunity.

Opportunity: Test Opp
Organization: Test Org
Description: Test Desc
Eligibility: Test Elig
Category: VLSI

Provide a helpful, concise analysis strictly in the following JSON format. DO NOT use markdown formatting (like \`\`\`json), DO NOT include any text outside the JSON object. Return ONLY the raw JSON object:
{
  "what_you_will_do": "2-3 sentences about the actual research/work",
  "why_apply": "2-3 sentences on career value and growth",
  "typical_documents": ["CV", "MSc marksheets", "NET certificate"],
  "tips": "1-2 specific tips for this type of application",
  "difficulty_level": "Low / Medium / High",
  "career_stage": "Fresh MSc / 1-2 years experience / PhD required"
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1024, temperature: 0.3 },
        }),
      }
    );
    const data = await response.json();
    console.log("Raw Response:");
    console.log(data.candidates[0].content.parts[0].text);
  } catch (e) {
    console.error("Failed:", e.message);
  }
}

testCallAI();
