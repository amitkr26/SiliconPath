import fetch from "node-fetch";
import * as cheerio from "cheerio";

async function checkDetailPage() {
  const url = "https://www.sarkariresult.com/2026/ntpc-ngel-august26/";
  console.log(`Fetching detail page: ${url}`);
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
  });

  const html = await res.text();
  const $ = cheerio.load(html);

  const title = $("h1").text().trim() || $("title").text().trim();
  console.log("Extracted Title:", title);

  const fullText = $("body").text();

  // Extract dates (e.g. Last Date for Apply Online : 15/09/2026)
  const lastDateMatch = fullText.match(/Last\s*Date\s*(?:for|to)?\s*Apply\s*Online\s*[:\-]?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/i)
    || fullText.match(/Last\s*Date\s*[:\-]?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/i);

  console.log("Extracted Deadline:", lastDateMatch ? lastDateMatch[1] : "None");

  // Extract Eligibility snippet
  const eligMatch = fullText.match(/Eligibility\s*[:\-]?\s*([^\n\r]+)/i);
  console.log("Extracted Eligibility:", eligMatch ? eligMatch[1].trim() : "None");

  // Extract Action Links (Official Apply Online, Download Notification, Official Website)
  const links = [];
  $("a").each((_, el) => {
    const txt = $(el).text().trim();
    const href = $(el).attr("href");
    if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
    if (/apply\s*online|official\s*website|download\s*notification/i.test(txt)) {
      links.push({ type: txt, url: href });
    }
  });

  console.log("Extracted Links:", links);
}

checkDetailPage().catch(console.error);
