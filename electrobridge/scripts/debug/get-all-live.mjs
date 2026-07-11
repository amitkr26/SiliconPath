async function main() {
  const urls = [
    "https://siliconpath.vercel.app/api/opportunities",
    "https://siliconpath.vercel.app/api/opportunities?verified=true",
    "https://siliconpath.vercel.app/api/opportunities?verified=false"
  ];
  
  for (const url of urls) {
    console.log(`\nFetching: ${url}`);
    try {
      const res = await fetch(url);
      const json = await res.json();
      console.log("Status:", res.status);
      console.log("Count:", json.opportunities ? json.opportunities.length : "none");
      if (json.opportunities && json.opportunities.length > 0) {
        console.log("Titles:", json.opportunities.map(o => `${o.title} (${o.verification_status})`).slice(0, 10));
      }
    } catch (e) {
      console.error("Error:", e.message);
    }
  }
}
main();
