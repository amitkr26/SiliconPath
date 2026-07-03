import * as cheerio from "cheerio";
import type { ScrapedOpportunity } from "./types";

interface EnrichedFields {
  description: string | null;
  eligibility: string | null;
  stipend: string | null;
  deadline: string | null;
  location: string | null;
  tags: string[];
  apply_link_type: "direct" | "homepage" | "pdf" | "email" | "portal" | null;
  official_page_url: string | null;
}

function extractStipend(text: string): string | null {
  const patterns = [
    /(?:stipend|fellowship|salary|pay|remuneration|emoluments?)\s*(?::|is|of|‑|–|—)?\s*(?:rs\.?|₹|inr)?\s*[\d,]+(?:\s*[–‑—to]+\s*(?:rs\.?|₹|inr)?\s*[\d,]+)?(?:\s*\/?\s*(?:per month|p\.?m\.?|monthly|pm|p\. m\.))?/gi,
    /(?:rs\.?|₹|inr)\s*[\d,]+(?:\s*[–‑—to]+\s*(?:rs\.?|₹|inr)?\s*[\d,]+)?(?:\s*\/?\s*(?:per month|p\.?m\.?|monthly|pm|p\. m\.))?/gi,
    /(?:stipend|fellowship|salary)\s*(?::|is|of)?\s*(?:rs\.?|₹|inr)?\s*[\d,]+/gi,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0].trim();
  }
  return null;
}

function extractDeadline(text: string): string | null {
  const patterns = [
    /(?:last date|deadline|closing date|apply by|due date|last date of receipt)\s*(?::|is|of)?\s*(.+?)(?:\.|,|$)/i,
    /(?:applications? must reach|should reach)\s*(?:by|on|before)\s*(.+?)(?:\.|,|$)/i,
    /(?:date of interview|walk‑in interview)\s*(?::|on)?\s*(.+?)(?:\.|,|$)/i,
    /(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4})/i,
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1]?.trim() || match[0].trim();
  }
  return null;
}

function extractEligibility(text: string): string | null {
  const patterns = [
    /(?:eligibility|essential qualification|educational qualification|required qualification|academic qualification|minimum qualification)\s*(?::|is|of)?\s*([\s\S]+?)(?:\.\s*(?:how|the last|application|interested|for more)|$)/i,
    /(?:candidates?\s+(?:must|should|possess|having|with|have))\s*([\s\S]+?)(?:\.\s*(?:the last|application|interested|for more|how)|$)/i,
    /(?:masters?\s+in|phd\s+in|b\.?tech\s+in|m\.?sc\s+in|m\.?e\.?\s+in|b\.?e\.?\s+in)\s*.+?(?:from|with|having|\b)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1]?.trim() || null;
  }
  return null;
}

function extractLocation(text: string): string | null {
  const cityPatterns = [
    /(?:location|place of posting|place of work|venue)\s*(?::|is)?\s*(.+?)(?:\.|,|$)/i,
    /at\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*(?:,\s*(?:India|Delhi|Bangalore|Chennai|Hyderabad|Kolkata|Mumbai|Pune))?/,
  ];
  for (const pattern of cityPatterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

function detectApplyLinkType(url: string, contentLength: number, contentType?: string): "direct" | "homepage" | "pdf" | "email" | "portal" {
  if (!url) return "homepage";
  if (/\.pdf(\?|$)/i.test(url) || contentType?.includes("pdf")) return "pdf";
  if (/mailto:/i.test(url)) return "email";
  if (/(apply|recruit|career|vacanc)/i.test(url)) return "portal";
  if (contentLength > 5000) return "direct";
  return "homepage";
}

function extractDescription(text: string): string | null {
  const cleaned = text
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length < 100) return null;
  return cleaned.substring(0, 3000);
}

function extractTags(text: string): string[] {
  const keywords = [
    "vlsi", "cmos", "fpga", "embedded", "semiconductor", "rf", "microwave",
    "signal processing", "machine learning", "ai", "vlsi design", "cadence",
    "verilog", "systemverilog", "matlab", "python", "thin film", "nanotechnology",
    "photonics", "sensor", "memristor", "quantum", "optoelectronics",
  ];
  const found = keywords.filter((kw) => text.toLowerCase().includes(kw));
  return found;
}

export async function enrichOpportunity(opp: ScrapedOpportunity, id: string): Promise<EnrichedFields> {
  const url = opp.apply_link || opp.source_url;
  if (!url) {
    return { description: null, eligibility: null, stipend: null, deadline: null, location: null, tags: [], apply_link_type: null, official_page_url: null };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ElectroBridge/1.0)" },
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!response.ok) return { description: null, eligibility: null, stipend: null, deadline: null, location: null, tags: [], apply_link_type: detectApplyLinkType(url, 0), official_page_url: null };

    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();

    const applyLinkType = detectApplyLinkType(url, text.length, contentType);

    if (contentType.includes("pdf") || url.match(/\.pdf/i)) {
      return {
        description: opp.description,
        eligibility: opp.eligibility,
        stipend: opp.stipend,
        deadline: opp.deadline,
        location: opp.location,
        tags: opp.tags,
        apply_link_type: "pdf",
        official_page_url: url,
      };
    }

    const $ = cheerio.load(text);

    $("script, style, nav, header, footer, iframe, .sidebar, .menu, .nav, .footer").remove();

    const pageText = $("body").text();

    const combinedText = pageText;

    const enrichedDescription = extractDescription(combinedText) || opp.description;
    const enrichedEligibility = extractEligibility(combinedText) || opp.eligibility;
    const enrichedStipend = extractStipend(combinedText) || opp.stipend;
    const enrichedDeadline = extractDeadline(combinedText) || opp.deadline;
    const enrichedLocation = extractLocation(combinedText) || opp.location;
    const enrichedTags = Array.from(new Set([...opp.tags, ...extractTags(combinedText)]));
    const officialUrl = $('link[rel="canonical"]').attr("href") || url;

    return {
      description: enrichedDescription,
      eligibility: enrichedEligibility,
      stipend: enrichedStipend,
      deadline: enrichedDeadline,
      location: enrichedLocation,
      tags: enrichedTags,
      apply_link_type: applyLinkType,
      official_page_url: officialUrl,
    };
  } catch {
    return {
      description: opp.description,
      eligibility: opp.eligibility,
      stipend: opp.stipend,
      deadline: opp.deadline,
      location: opp.location,
      tags: opp.tags,
      apply_link_type: null,
      official_page_url: null,
    };
  }
}
