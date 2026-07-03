import * as cheerio from "cheerio";

// Test DRDO in more detail - find the actual vacancy content
const DRDO_URL = "https://drdo.gov.in/drdo/en/offerings/vacancies";
const res = await fetch(DRDO_URL, {
  signal: AbortSignal.timeout(15000),
  headers: { "User-Agent": "Mozilla/5.0" },
});
const html = await res.text();
const $ = cheerio.load(html);

console.log("=== All HTML elements with text > 50 chars ===");
$("*").each((i, el) => {
  const text = $(el).text().trim();
  if (text.length > 50 && text.length < 500) {
    const tag = el.tagName;
    const cls = $(el).attr("class") || "";
    // Filter out navigation/menu noise
    if (!cls.includes("menu") && !cls.includes("nav") && !cls.includes("breadcrumb") && !cls.includes("footer")) {
      console.log(`  <${tag}> .${cls.slice(0, 50)}`);
      console.log(`    "${text.slice(0, 120)}"`);
    }
  }
});
