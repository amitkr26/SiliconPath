

async function main() {
  console.log("=== Querying live API /api/opportunities ===");
  try {
    const res = await fetch("https://siliconpath.vercel.app/api/opportunities?verified=true");
    const json = await res.json();
    console.log("Status:", res.status);
    console.log("Count returned:", json.opportunities ? json.opportunities.length : "none");
    if (json.opportunities && json.opportunities.length > 0) {
      console.log("First 3 live opportunities:");
      console.log(json.opportunities.slice(0, 3).map(o => ({
        id: o.id,
        title: o.title,
        category: o.category,
        verification_status: o.verification_status,
        created_at: o.created_at,
        source_type: o.source_type
      })));
    } else {
      console.log("Response body:", JSON.stringify(json, null, 2));
    }
  } catch (e) {
    console.error("Failed to query opportunities:", e.message);
  }

  console.log("\n=== Querying live API /api/companies ===");
  try {
    const res = await fetch("https://siliconpath.vercel.app/api/companies");
    const json = await res.json();
    console.log("Status:", res.status);
    console.log("Count returned:", json.length || "none");
    if (json && json.length > 0) {
      console.log("First 3 live companies/organizations:");
      console.log(json.slice(0, 3));
    }
  } catch (e) {
    console.error("Failed to query companies:", e.message);
  }
}

main().catch(console.error);
