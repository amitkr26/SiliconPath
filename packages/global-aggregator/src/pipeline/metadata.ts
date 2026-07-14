import type { RawScrapedOpportunity } from "../types";

const DATE_PATTERNS = [
  /(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/,
  /(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})/,
  /(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})/i,
  /(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2}),?\s+(\d{4})/i,
];

export class MetadataExtractor {
  extractPostedDate(raw: RawScrapedOpportunity): string | null {
    if (raw.postedDate) {
      const parsed = new Date(raw.postedDate);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }

    const sources = [
      raw.description ?? "",
      raw.title ?? "",
      raw.eligibility ?? "",
    ].join(" ");

    return this.extractDateFromText(sources);
  }

  extractDeadline(text: string): string | null {
    if (!text) return null;

    const lower = text.toLowerCase();
    if (
      lower.includes("rolling") ||
      lower.includes("ongoing") ||
      lower.includes("open until filled") ||
      lower.includes("open until filled") ||
      lower.includes("no deadline") ||
      lower.includes("continuous")
    ) {
      return null;
    }

    return this.extractDateFromText(text);
  }

  extractOrganization(raw: RawScrapedOpportunity): string {
    return (raw.organization ?? "").trim();
  }

  extractDepartment(raw: RawScrapedOpportunity): string | null {
    if (raw.department) return raw.department.trim();
    if (!raw.description) return null;

    const deptPatterns = [
      /department\s+of\s+([A-Z][\w\s&]+?)(?:\.|,|\n|$)/i,
      /dept\.?\s*[:]\s*([A-Z][\w\s&]+?)(?:\.|,|\n|$)/i,
      /division\s+of\s+([A-Z][\w\s&]+?)(?:\.|,|\n|$)/i,
      /school\s+of\s+([A-Z][\w\s&]+?)(?:\.|,|\n|$)/i,
      /college\s+of\s+([A-Z][\w\s&]+?)(?:\.|,|\n|$)/i,
    ];

    for (const pattern of deptPatterns) {
      const match = raw.description.match(pattern);
      if (match?.[1]) return match[1].trim();
    }

    return null;
  }

  private extractDateFromText(text: string): string | null {
    for (const pattern of DATE_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        let dateStr: string | undefined;

        if (pattern === DATE_PATTERNS[0]) {
          const [, m, d, y] = match;
          dateStr = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
        } else if (pattern === DATE_PATTERNS[1]) {
          const [, y, m, d] = match;
          dateStr = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
        } else if (pattern === DATE_PATTERNS[2]) {
          const [, d, mon, y] = match;
          const monthIdx = this.parseMonth(mon);
          if (monthIdx >= 0) {
            dateStr = `${y}-${String(monthIdx + 1).padStart(2, "0")}-${d.padStart(2, "0")}`;
          }
        } else if (pattern === DATE_PATTERNS[3]) {
          const [, mon, d, y] = match;
          const monthIdx = this.parseMonth(mon);
          if (monthIdx >= 0) {
            dateStr = `${y}-${String(monthIdx + 1).padStart(2, "0")}-${d.padStart(2, "0")}`;
          }
        }

        if (dateStr) {
          const parsed = new Date(dateStr);
          if (!Number.isNaN(parsed.getTime())) {
            return parsed.toISOString();
          }
        }
      }
    }

    const generic = new Date(text);
    if (!Number.isNaN(generic.getTime())) {
      return generic.toISOString();
    }

    return null;
  }

  private parseMonth(month: string): number {
    const months: Record<string, number> = {
      jan: 0,
      january: 0,
      feb: 1,
      february: 1,
      mar: 2,
      march: 2,
      apr: 3,
      april: 3,
      may: 4,
      jun: 5,
      june: 5,
      jul: 6,
      july: 6,
      aug: 7,
      august: 7,
      sep: 8,
      september: 8,
      oct: 9,
      october: 9,
      nov: 10,
      november: 10,
      dec: 11,
      december: 11,
    };
    return months[month.toLowerCase()] ?? -1;
  }
}
