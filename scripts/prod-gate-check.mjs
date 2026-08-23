import fetch from "node-fetch";

const PROD_BASE = "https://berojgardegreewala.vercel.app";

const ROUTES = [
  { path: "/", name: "Homepage" },
  { path: "/opportunities", name: "Opportunities Feed" },
  { path: "/news", name: "News Aggregator" },
  { path: "/academy", name: "Academy Hub" },
  { path: "/network", name: "Professional Network" },
  { path: "/messages", name: "Direct Messaging" },
  { path: "/profile", name: "Candidate Profile" },
  { path: "/applications", name: "My Applications" },
  { path: "/employer/profile", name: "Employer Profile" },
  { path: "/employer/company", name: "Employer Company" },
  { path: "/admin", name: "Admin Console" },
  { path: "/api/opportunities?limit=5", name: "API Opportunities" },
  { path: "/api/search?q=VLSI&limit=5", name: "API Search" },
  { path: "/sitemap.xml", name: "Sitemap XML" },
];

async function checkProd() {
  console.log("============================================================");
  console.log("1. PRODUCTION ENVIRONMENT PROBING (https://berojgardegreewala.vercel.app)");
  console.log("============================================================");

  const results = [];

  for (const r of ROUTES) {
    const url = `${PROD_BASE}${r.path}`;
    try {
      const res = await fetch(url, { redirect: "manual", timeout: 15000 });
      const status = res.status;
      const location = res.headers.get("location");
      const contentType = res.headers.get("content-type");
      
      let sampleText = "";
      if (status === 200) {
        const text = await res.text();
        sampleText = text.slice(0, 100).replace(/\s+/g, " ");
      }

      results.push({
        name: r.name,
        path: r.path,
        status,
        redirect: location || "None",
        contentType: contentType ? contentType.split(";")[0] : "N/A",
        preview: sampleText ? sampleText.slice(0, 40) + "..." : "N/A"
      });
    } catch (err) {
      results.push({
        name: r.name,
        path: r.path,
        status: "ERR",
        redirect: "ERR",
        contentType: "ERR",
        preview: err.message
      });
    }
  }

  console.table(results);
  return results;
}

checkProd().catch(err => {
  console.error("FATAL PROD CHECK:", err);
  process.exit(1);
});
