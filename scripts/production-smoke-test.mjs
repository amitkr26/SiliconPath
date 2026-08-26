import https from "https";

const PROD_BASE = "https://berojgardegreewala.vercel.app";

const PROD_ROUTES = [
  { path: "/", expectStatus: 200, name: "Production Homepage" },
  { path: "/opportunities", expectStatus: 200, name: "Production Opportunities" },
  { path: "/news", expectStatus: 200, name: "Production News" },
  { path: "/academy", expectStatus: 200, name: "Production Academy" },
  { path: "/organizations", expectStatus: 200, name: "Production Organizations" },
  { path: "/resources", expectStatus: 200, name: "Production Resources" },
  { path: "/resources/jrf-guide", expectStatus: 200, name: "Production Resource JRF Guide" },
  { path: "/resources/jrf-vs-srf-difference", expectStatus: 200, name: "Production Resource JRF vs SRF" },
  { path: "/search", expectStatus: 200, name: "Production Search" },
  { path: "/sitemap.xml", expectStatus: 200, name: "Production Sitemap XML" },
  { path: "/robots.txt", expectStatus: 200, name: "Production Robots TXT" },
  { path: "/api/health", expectStatus: 200, name: "Production API Health" },
  { path: "/api/opportunities?limit=5", expectStatus: 200, name: "Production API Opportunities" },
  { path: "/api/news", expectStatus: 200, name: "Production API News" },
];

function checkProdUrl(item) {
  return new Promise((resolve) => {
    const url = new URL(item.path, PROD_BASE);
    const req = https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        const ok = res.statusCode === item.expectStatus;
        resolve({
          ...item,
          status: res.statusCode,
          ok,
          contentLength: data.length,
          contentType: res.headers["content-type"],
        });
      });
    });
    req.on("error", (err) => {
      resolve({
        ...item,
        status: 500,
        ok: false,
        error: err.message,
      });
    });
  });
}

async function runProductionSmoke() {
  console.log("================================================================================");
  console.log("   PHASE 26: PRODUCTION READ-ONLY SMOKE TEST                                    ");
  console.log(`   TARGET: ${PROD_BASE}`);
  console.log("================================================================================");

  let passed = 0;
  let failed = 0;
  const results = [];

  for (const item of PROD_ROUTES) {
    const res = await checkProdUrl(item);
    if (res.ok) {
      passed++;
      console.log(`✅ [HTTP ${res.status}] ${res.name} (${res.contentLength} bytes, ${res.contentType})`);
    } else {
      failed++;
      console.error(`❌ [HTTP ${res.status}] ${res.name} - Failed!`);
    }
    results.push(res);
  }

  console.log("\n================================================================================");
  console.log(`TOTAL PRODUCTION SMOKE ROUTES: ${PROD_ROUTES.length} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runProductionSmoke();
