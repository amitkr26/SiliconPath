import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://siliconpath.vercel.app';

async function testAI() {
  // First fetch an opportunity slug
  const oppsRes = await fetch(`${BASE_URL}/api/opportunities?limit=1`);
  const data = await oppsRes.json();
  if (data.opportunities && data.opportunities.length > 0) {
    const slug = data.opportunities[0].slug;
    console.log(`Testing AI summary for slug: ${slug}`);
    try {
      const aiRes = await fetch(`${BASE_URL}/api/ai/opportunity-summary/${slug}`);
      const aiData = await aiRes.json();
      console.log("AI Data:", aiData);
    } catch (e) {
      console.log("Error:", e.message);
    }
  }
}
testAI();
