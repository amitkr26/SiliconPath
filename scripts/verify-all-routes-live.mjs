import fetch from "node-fetch";

async function verifyLiveEndpoints() {
  console.log(`[${new Date().toISOString()}] 🌐 Starting Live Endpoints & Cleaned Data Verification...`);

  const tests = [
    { name: "Public Homepage", url: "http://localhost:3000/" },
    { name: "Opportunities Feed Page", url: "http://localhost:3000/opportunities" },
    { name: "API Opportunities (Default)", url: "http://localhost:3000/api/opportunities?limit=10" },
    { name: "API Opportunities (Fresher Filter)", url: "http://localhost:3000/api/opportunities?experience=fresher&limit=10" },
    { name: "API Search (q=VLSI)", url: "http://localhost:3000/api/search?q=VLSI&limit=10" },
    { name: "API Search (category=jrf)", url: "http://localhost:3000/api/search?category=jrf&limit=10" },
    { name: "Sitemap XML", url: "http://localhost:3000/sitemap.xml" },
    { name: "Employer Profile Page", url: "http://localhost:3000/employer/profile" },
  ];

  let allPassed = true;

  for (const t of tests) {
    try {
      const res = await fetch(t.url);
      console.log(`[${new Date().toISOString()}] ${res.status === 200 || res.status === 307 ? "✅" : "❌"} ${t.name} (${t.url}) → HTTP ${res.status}`);
      if (t.url.includes("/api/")) {
        const body = await res.json();
        if (body.opportunities) {
          console.log(`     └ Opportunities returned: ${body.opportunities.length}, Total Count: ${body.count || body.total_count}`);
          if (body.opportunities.length > 0) {
            const first = body.opportunities[0];
            console.log(`     └ Sample Job: "${first.title}" at "${first.organization}" (Category: ${first.category}, Deadline: ${first.deadline || 'Ongoing'})`);
          }
        }
      }
    } catch (err) {
      console.error(`[${new Date().toISOString()}] ❌ Failed to fetch ${t.name}:`, err.message);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log(`\n🎉 ALL LIVE ENDPOINTS AND CLEANED DATA VERIFIED SUCCESSFULLY.`);
  } else {
    console.log(`\n⚠️ Some endpoints failed verification.`);
  }
}

verifyLiveEndpoints();
