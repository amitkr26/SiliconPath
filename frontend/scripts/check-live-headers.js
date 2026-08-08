const https = require("https");

function checkSecurityHeaders() {
  console.log("=== INSPECTING LIVE PRODUCTION HEADERS FROM https://berojgardegreewala.vercel.app ===");
  const req = https.request(
    "https://berojgardegreewala.vercel.app",
    { method: "HEAD" },
    (res) => {
      console.log(`HTTP Status: ${res.statusCode} ${res.statusMessage}`);
      console.log("\nRaw Response Headers:\n", JSON.stringify(res.headers, null, 2));

      console.log("\n=== SECURITY HEADER EVALUATION ===");
      console.log("Strict-Transport-Security:", res.headers["strict-transport-security"] || "MISSING ❌");
      console.log("X-Frame-Options:          ", res.headers["x-frame-options"] || "MISSING ❌");
      console.log("X-Content-Type-Options:   ", res.headers["x-content-type-options"] || "MISSING ❌");
      console.log("Referrer-Policy:          ", res.headers["referrer-policy"] || "MISSING ❌");
      console.log("Content-Security-Policy:  ", res.headers["content-security-policy"] || "MISSING ❌");
    }
  );

  req.on("error", (e) => console.error("Error:", e.message));
  req.end();
}

checkSecurityHeaders();
