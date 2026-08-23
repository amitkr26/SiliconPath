import fetch from "node-fetch";
import * as cheerio from "cheerio";

async function probeSarkariSites() {
  console.log("=== Probing SarkariExam & SarkariResult ===");

  const sites = [
    { name: "SarkariExam", url: "https://www.sarkariexam.com/" },
    { name: "SarkariResult", url: "https://www.sarkariresult.com/" }
  ];

  for (const s of sites) {
    try {
      console.log(`\nFetching ${s.name} (${s.url})...`);
      const res = await fetch(s.url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
          "Sec-Ch-Ua": "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Google Chrome\";v=\"126\"",
          "Sec-Ch-Ua-Mobile": "?0",
          "Sec-Ch-Ua-Platform": "\"Windows\"",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Upgrade-Insecure-Requests": "1"
        },
        timeout: 15000
      });
      console.log(`Status: ${res.status}`);
      if (!res.ok) continue;

      const html = await res.text();
      const $ = cheerio.load(html);

      const techKeywords = [
        "engineer", "engineering", "technical", "technician", "apprentice",
        "isro", "drdo", "bel", "bhel", "sail", "gail", "iocl", "ongc", "ntpc",
        "scientist", "diploma", "b.tech", "btech", "m.tech", "mtech", "gate",
        "junior engineer", "je", "ae", "assistant engineer", "it officer", "semiconductor",
        "electronics", "computer", "c-dac", "cdac", "barc", "npcil", "hal", "ecil", "cdot"
      ];

      const matches = [];
      $("a").each((_, el) => {
        const text = $(el).text().trim().replace(/\s+/g, " ");
        const href = $(el).attr("href");
        if (!text || !href || href.startsWith("#") || href.startsWith("javascript:")) return;

        const lower = text.toLowerCase();
        const isMatch = techKeywords.some(kw => lower.includes(kw));

        if (isMatch && text.length > 8 && text.length < 150) {
          matches.push({ text, href });
        }
      });

      console.log(`Found ${matches.length} technical / engineering job listings on ${s.name}:`);
      console.table(matches.slice(0, 15));
    } catch (err) {
      console.error(`Error probing ${s.name}:`, err.message);
    }
  }
}

probeSarkariSites().catch(console.error);
