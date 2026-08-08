const https = require("https");

const p1 = {
  name: "Project 1 (aqauempuwmbizqoaolop)",
  url: "https://aqauempuwmbizqoaolop.supabase.co",
  anonKey: "sb_publishable_r3IO09AVXZd-D11-WwS3Uw_rHnJq3uj",
  serviceKey: "REDACTED_SUPABASE_SECRET_DB1_OLD"
};

function queryOps(select = "*", filter = "") {
  return new Promise((resolve) => {
    const url = new URL(`${p1.url}/rest/v1/opportunities?select=${select}${filter}`);
    const req = https.request(
      url,
      {
        method: "GET",
        headers: {
          apikey: p1.anonKey,
          Authorization: `Bearer ${p1.anonKey}`
        }
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve({ error: body });
          }
        });
      }
    );
    req.on("error", (e) => resolve({ error: e.message }));
    req.end();
  });
}

function deleteOp(id) {
  return new Promise((resolve) => {
    const url = new URL(`${p1.url}/rest/v1/opportunities?id=eq.${id}`);
    const req = https.request(
      url,
      {
        method: "DELETE",
        headers: {
          apikey: p1.serviceKey,
          Authorization: `Bearer ${p1.serviceKey}`,
          Prefer: "return=representation"
        }
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, body });
          }
        });
      }
    );
    req.on("error", (e) => resolve({ error: e.message }));
    req.end();
  });
}

async function inspectAndPurge() {
  const data = await queryOps("*");
  if (!Array.isArray(data)) {
    console.error("Query returned non-array:", data);
    return;
  }

  console.log(`Total opportunities in Project 1: ${data.length}`);
  if (data.length > 0) {
    console.log("Sample columns in opportunities table:", Object.keys(data[0]));
  }

  // Identify all fake / test entries
  const testEntries = data.filter((op) => {
    const title = (op.title || "").toLowerCase();
    const org = (op.organization || op.company || "").toLowerCase();
    const applyLink = (op.apply_link || op.url || op.link || "").toLowerCase();
    const salaryStr = JSON.stringify(op).toLowerCase();

    const isTestTitle =
      title.includes("qa audit test") ||
      title.includes("lead risc-v soc architect") ||
      title.includes("senior asic verification engineer (uvm)") ||
      title.includes("senior physical design engineer (sta)") ||
      title.includes("ui verified") ||
      title.includes("test position") ||
      title.startsWith("test ");

    const isTestOrg =
      org.includes("qa test") ||
      org.includes("semiconductor lab test") ||
      org.includes("qualcomm vlsi lab");

    const isFakeSalary =
      salaryStr.includes("1,80,00,000") ||
      salaryStr.includes("24,000,000") ||
      salaryStr.includes("18,000,000") ||
      salaryStr.includes("22,00,000") ||
      salaryStr.includes("18,00,000");

    const isSelfLink =
      applyLink.includes("berojgardegreewala.vercel.app") &&
      !applyLink.includes("/api/") &&
      !applyLink.includes("/resources/");

    return isTestTitle || isTestOrg || isFakeSalary || isSelfLink;
  });

  console.log(`\n=== FOUND ${testEntries.length} FAKE/TEST OPPORTUNITIES ===`);
  for (const entry of testEntries) {
    console.log(`\n--- [ID: ${entry.id}] ---`);
    console.log(`Title: ${entry.title}`);
    console.log(`Organization: ${entry.organization || entry.company}`);
    console.log(`Apply Link: ${entry.apply_link || entry.url || entry.link}`);
    console.log(`Created At: ${entry.created_at}`);
    console.log(`Full Record:`, JSON.stringify(entry, null, 2));

    console.log(`Deleting entry [${entry.id}]...`);
    const delRes = await deleteOp(entry.id);
    console.log(`Deletion Result (HTTP ${delRes.status}):`, delRes);
  }

  // Re-query to verify
  const remaining = await queryOps("id,title,organization,created_at");
  console.log(`\n=== VERIFICATION AFTER PURGE ===`);
  console.log(`Remaining verified opportunities: ${Array.isArray(remaining) ? remaining.length : 'N/A'}`);
}

inspectAndPurge();
