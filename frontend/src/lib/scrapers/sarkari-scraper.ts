import * as cheerio from "cheerio";

export interface ScrapedSarkariItem {
  title: string;
  organization: string;
  category: string;
  location: string;
  stipend?: string;
  deadline?: string;
  eligibility?: string;
  description: string;
  apply_link: string;
  source_url: string;
  tags: string[];
}

const TECH_INCLUDE_KEYWORDS = [
  "engineer", "engineering", "technical", "technician", "apprentice",
  "scientist", "b.tech", "btech", "m.tech", "mtech", "diploma", "gate",
  "junior engineer", "assistant engineer", "it officer", "semiconductor",
  "electronics", "electrical", "computer science", "isro", "drdo", "bel",
  "bhel", "sail", "gail", "iocl", "ongc", "ntpc", "barc", "npcil", "hal",
  "ecil", "cdot", "c-dac", "cdac", "sub engineer", "programmer"
];

const NON_TECH_EXCLUDE_KEYWORDS = [
  "constable", "police", "sub inspector", "si online", "patwari", "clerk",
  "safai", "peon", "driver", "anganwadi", "nursing", "cho", "medical officer",
  "mbbs", "bams", "bhms", "teacher", "tgt", "pgt hindi", "pgt sanskrit",
  "pgt history", "revenue inspector", "gram panchayat", "home guard", "forest guard",
  "stenographer", "court", "judicial", "law officer", "prosecution"
];

function extractOrganization(title: string): string {
  const t = title.toUpperCase();
  if (t.includes("ISRO")) return "ISRO";
  if (t.includes("DRDO")) return "DRDO";
  if (t.includes("BARC")) return "BARC";
  if (t.includes("NTPC")) return "NTPC";
  if (t.includes("BHEL")) return "BHEL";
  if (t.includes("BEL")) return "BEL";
  if (t.includes("RAILWAY") || t.includes("RRB")) return "Indian Railways";
  if (t.includes("IOCL")) return "IOCL";
  if (t.includes("ONGC")) return "ONGC";
  if (t.includes("GAIL")) return "GAIL";
  if (t.includes("SAIL")) return "SAIL";
  if (t.includes("HAL")) return "HAL";
  if (t.includes("ECIL")) return "ECIL";
  if (t.includes("CDAC") || t.includes("C-DAC")) return "C-DAC";
  if (t.includes("SSC")) return "SSC";
  if (t.includes("UPPSC")) return "UPPSC";
  if (t.includes("MPESB")) return "MPESB";
  if (t.includes("RSSB")) return "RSSB";
  return "Govt of India / PSU";
}

function parseDateToIso(dateStr: string): string | undefined {
  if (!dateStr) return undefined;
  const parts = dateStr.split(/[\/\-]/);
  if (parts.length === 3) {
    const day = parts[0].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    const year = parts[2];
    if (year.length === 4) {
      return `${year}-${month}-${day}`;
    }
  }
  return undefined;
}

export async function scrapeSarkariTechnicalOpportunities(): Promise<ScrapedSarkariItem[]> {
  const items: ScrapedSarkariItem[] = [];
  const today = new Date().toISOString().split("T")[0];

  const sourceUrls = [
    "https://www.sarkariresult.com/latestjob/",
    "https://www.sarkariresult.com/"
  ];

  const matchedLinks: { text: string; href: string }[] = [];

  for (const sUrl of sourceUrls) {
    try {
      const res = await fetch(sUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
        },
        signal: AbortSignal.timeout(12000)
      });

      if (!res.ok) continue;
      const html = await res.text();
      const $ = cheerio.load(html);

      $("a").each((_, el) => {
        const text = $(el).text().trim().replace(/\s+/g, " ");
        const href = $(el).attr("href");
        if (!text || !href || href.startsWith("#") || href.startsWith("javascript:")) return;

        const lower = text.toLowerCase();
        const isTech = TECH_INCLUDE_KEYWORDS.some(kw => lower.includes(kw));
        const isExcluded = NON_TECH_EXCLUDE_KEYWORDS.some(kw => lower.includes(kw));

        if (isTech && !isExcluded && text.length >= 10 && text.length <= 150) {
          const absoluteHref = href.startsWith("http") ? href : `https://www.sarkariresult.com${href}`;
          if (!matchedLinks.some(m => m.href === absoluteHref)) {
            matchedLinks.push({ text, href: absoluteHref });
          }
        }
      });
    } catch (err) {
      console.warn(`[Sarkari Scraper Warning]: Could not fetch ${sUrl}`, err);
    }
  }

  // Deep parse up to 15 top technical opportunities
  const targetLinks = matchedLinks.slice(0, 15);

  for (const target of targetLinks) {
    try {
      const detailRes = await fetch(target.href, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!detailRes.ok) continue;
      const detailHtml = await detailRes.text();
      const $d = cheerio.load(detailHtml);

      const rawTitle = $d("h1").text().trim() || target.text;
      const cleanTitle = rawTitle.replace(/\s+/g, " ").replace(/Online Form \d+/i, `Recruitment ${new Date().getFullYear()}`).trim();

      const bodyText = $d("body").text();

      // Extract Deadline
      const lastDateMatch = bodyText.match(/Last\s*Date\s*(?:for|to)?\s*Apply\s*Online\s*[:\-]?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/i)
        || bodyText.match(/Last\s*Date\s*[:\-]?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/i);

      let isoDeadline: string | undefined = undefined;
      if (lastDateMatch) {
        isoDeadline = parseDateToIso(lastDateMatch[1]);
      }

      // Filter out past deadlines
      if (isoDeadline && isoDeadline < today) {
        continue;
      }

      // Extract Eligibility
      const eligMatch = bodyText.match(/Eligibility\s*[:\-]?\s*([^\n\r]+)/i);
      const eligibility = eligMatch ? eligMatch[1].trim().slice(0, 200) : "Engineering Degree / Diploma in relevant discipline.";

      // Extract Official Links
      let applyLink = target.href;
      let officialWebsite = target.href;

      $d("a").each((_, aEl) => {
        const linkTxt = $d(aEl).text().trim().toLowerCase();
        const aHref = $d(aEl).attr("href");
        if (!aHref || aHref.startsWith("#") || aHref.startsWith("javascript:")) return;

        if (linkTxt.includes("apply online") && aHref.startsWith("http")) {
          applyLink = aHref;
        } else if (linkTxt.includes("official website") && aHref.startsWith("http")) {
          officialWebsite = aHref;
        }
      });

      const org = extractOrganization(cleanTitle);

      items.push({
        title: cleanTitle,
        organization: org,
        category: "government",
        location: "All India / Multiple Locations",
        stipend: "Pay Level as per Govt / PSU Norms",
        deadline: isoDeadline,
        eligibility,
        description: `Government / PSU Technical Recruitment for ${org}: ${cleanTitle}. Check notification for eligibility, syllabus, and application process.`,
        apply_link: applyLink,
        source_url: officialWebsite || target.href,
        tags: ["Government", "PSU", "Engineering", org, "Technical"]
      });
    } catch (err) {
      console.warn(`[Sarkari Detail Parse Warning]: ${target.href}`, err);
    }
  }

  return items;
}
