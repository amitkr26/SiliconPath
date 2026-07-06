import fs from 'fs';
import path from 'path';

// Load env variables manually for the script
const envPath = path.resolve(process.cwd(), '.env.local');
let awsBearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK;

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
    if (match) {
      let key = match[1].trim();
      let value = match[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      if (key === 'AWS_BEARER_TOKEN_BEDROCK') awsBearerToken = value;
    }
  });
}

const MODELS_TO_TEST = [
  'openai.gpt-oss-120b', // Current baseline
  'anthropic.claude-3-haiku-20240307-v1:0',
  'meta.llama3-8b-instruct-v1:0'
];

const TEST_PROMPTS = [
  {
    type: 'ATS Scoring',
    content: `
You are an ATS (Applicant Tracking System) expert. Score this resume from 0-100 for ATS compatibility for an electronics JRF role.
Name: John Doe
Skills: Verilog, VHDL, C++, Python
Education: [{"institution": "IIT Bombay", "degree": "M.Tech VLSI", "duration": "2024"}]
Experience: [{"company": "Intel", "role": "Intern", "duration": "6 months", "description": "RTL design"}]

Return ONLY valid JSON (no markdown):
{"score": 85, "feedback": ["Add project details"]}
`
  },
  {
    type: 'Opportunity Matching',
    content: `
Extract insights from this opportunity.
Opportunity: JRF at IIT Hyderabad in 5G VLSI Design
Eligibility: M.Tech in VLSI or Microelectronics with valid GATE score.

Return ONLY valid JSON (no markdown):
{"what_you_will_do": "...", "why_apply": "..."}
`
  }
];

async function callBedrock(model, prompt) {
  const startTime = Date.now();
  let success = false;
  let responseLength = 0;
  
  try {
    const response = await fetch(
      "https://bedrock-mantle.us-east-1.api.aws/v1/chat/completions", // or actual bedrock URL
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${awsBearerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 500,
          temperature: 0.3,
        }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    success = true;
    responseLength = text.length;
    return { success, latency: Date.now() - startTime, responseLength, text };
  } catch (err) {
    return { success: false, latency: Date.now() - startTime, error: err.message };
  }
}

async function runEvaluation() {
  if (!awsBearerToken) {
    console.error("Skipping: AWS_BEARER_TOKEN_BEDROCK is not set.");
    return;
  }

  console.log("Starting Bedrock Model Evaluation...");
  const results = [];

  for (const model of MODELS_TO_TEST) {
    console.log(`\nEvaluating model: ${model}`);
    
    for (const test of TEST_PROMPTS) {
      console.log(`  Running test: ${test.type}...`);
      const result = await callBedrock(model, test.content);
      
      results.push({
        model,
        testType: test.type,
        success: result.success,
        latencyMs: result.latency,
        responseLength: result.responseLength || 0,
        error: result.error || null,
        sampleOutput: result.text ? result.text.substring(0, 50) + "..." : "N/A"
      });
      
      // Small sleep to avoid rate limits
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log("\n=== EVALUATION RESULTS ===");
  console.table(results);
  
  // Save to docs
  const mdContent = `# Bedrock Model Evaluation\n\nGenerated on: ${new Date().toISOString()}\n\n` + 
    `| Model | Test | Success | Latency (ms) | Output Length | Notes |\n` +
    `|---|---|---|---|---|---|\n` +
    results.map(r => `| ${r.model} | ${r.testType} | ${r.success ? '✅' : '❌'} | ${r.latencyMs} | ${r.responseLength} | ${r.error || 'OK'} |`).join('\n');
    
  fs.mkdirSync(path.join(process.cwd(), 'docs'), { recursive: true });
  fs.writeFileSync(path.join(process.cwd(), 'docs', 'BEDROCK_MODEL_EVALUATION.md'), mdContent);
  console.log("\nResults saved to docs/BEDROCK_MODEL_EVALUATION.md");
}

runEvaluation();
