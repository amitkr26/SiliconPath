const EDUCATION_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bph\.?d\.?\b/i, label: "PhD" },
  { pattern: /\bphd\b/i, label: "PhD" },
  { pattern: /\bm\.?tech\.?\b/i, label: "M.Tech" },
  { pattern: /\bmtech\b/i, label: "M.Tech" },
  { pattern: /\bb\.?tech\.?\b/i, label: "B.Tech" },
  { pattern: /\bbtech\b/i, label: "B.Tech" },
  { pattern: /\bbe\b/i, label: "BE" },
  { pattern: /\bme\b/i, label: "ME" },
  { pattern: /\bb\.?sc\.?\b/i, label: "B.Sc" },
  { pattern: /\bm\.?sc\.?\b/i, label: "M.Sc" },
  { pattern: /\bmca\b/i, label: "MCA" },
  { pattern: /\bbca\b/i, label: "BCA" },
  { pattern: /\bmba\b/i, label: "MBA" },
  { pattern: /\bbs\b/i, label: "BS" },
  { pattern: /\bms\b/i, label: "MS" },
  { pattern: /\bbachelor'?s?\b/i, label: "Bachelor" },
  { pattern: /\bmaster'?s?\b/i, label: "Master" },
  { pattern: /\bpostdoc(?:toral)?\b/i, label: "Postdoc" },
  { pattern: /\bdiploma\b/i, label: "Diploma" },
];

const ELIGIBILITY_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\b(\d{1,2})\s*%\b/g, label: "marks" },
  { pattern: /\b(\d+(?:\.\d+)?)\s*cgpa\b/gi, label: "CGPA" },
  { pattern: /\bgate\s*(?:score|qualified|rank|AIR)?\s*(?:of\s*)?(\d+)?/gi, label: "GATE" },
  { pattern: /\b(?:net|ustre|csir)\b/gi, label: "NET" },
  { pattern: /\b(\d+)\s*\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)?\b/gi, label: "experience" },
  { pattern: /\bfresher\b/gi, label: "fresher" },
  { pattern: /\bfinal\s*year\b/gi, label: "final year" },
  { pattern: /\bpre-final\s*year\b/gi, label: "pre-final year" },
  { pattern: /\bsecond\s*year\b/gi, label: "second year" },
  { pattern: /\bfirst\s*year\b/gi, label: "first year" },
  { pattern: /\bgraduat(?:e|ed|ing)\b/gi, label: "graduate" },
  { pattern: /\b(\d+)\s*\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:relevant\s*)?(?:work\s*)?(?:experience|exp)\b/gi, label: "experience" },
];

export class EligibilityParser {
  parse(text: string | null): string[] {
    if (!text) return [];

    const criteria = new Set<string>();

    for (const { pattern, label } of EDUCATION_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(text)) {
        criteria.add(label);
      }
    }

    for (const { pattern, label } of ELIGIBILITY_PATTERNS) {
      pattern.lastIndex = 0;
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          criteria.add(`${label}: ${match[1]}`);
        } else {
          criteria.add(label);
        }
      }
    }

    const rangeMatch = text.match(
      /(\d{1,2})\s*(?:to|-)\s*(\d{1,2})\s*%/,
    );
    if (rangeMatch) {
      criteria.add(`marks: ${rangeMatch[1]}-${rangeMatch[2]}%`);
    }

    const cgpaMatch = text.match(
      /(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*(?:cgpa|gpa)/i,
    );
    if (cgpaMatch) {
      criteria.add(`CGPA: ${cgpaMatch[1]}-${cgpaMatch[2]}`);
    }

    return Array.from(criteria);
  }
}
