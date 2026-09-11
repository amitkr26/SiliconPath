// Labeled date extraction + normalization (Phase 4 of CONTENT_UPGRADE_PLAN.md).
// Rules:
//  - Never guess a date that is not present in the source → null.
//  - Internally dates are ISO (YYYY-MM-DD); the original source text is kept
//    alongside for auditing (deadline_raw / *_raw columns).
//  - Semantic labels are explicit: application deadline ≠ exam date ≠
//    interview date ≠ joining date.

export type DateLabel =
  | "application_deadline"
  | "application_start"
  | "posted_date"
  | "exam_date"
  | "interview_date"
  | "joining_date"
  | "event_date";

export interface LabeledDates {
  application_deadline: string | null;
  application_start: string | null;
  posted_date: string | null;
  exam_date: string | null;
  interview_date: string | null;
  joining_date: string | null;
  event_date: string | null;
  /** Original text snippets each date was extracted from (audit trail). */
  raw: Record<string, string>;
}

export const EMPTY_LABELED_DATES: LabeledDates = {
  application_deadline: null,
  application_start: null,
  posted_date: null,
  exam_date: null,
  interview_date: null,
  joining_date: null,
  event_date: null,
  raw: {},
};

const MONTHS = "(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)";

function pad(n: string | number): string {
  return String(n).padStart(2, "0");
}

const LABEL_CONTEXTS: Array<{ label: DateLabel; patterns: RegExp[] }> = [
  {
    label: "application_deadline",
    patterns: [
      /(?:last date(?: for (?:receipt of )?applications?)?|closing date|application deadline|deadline|apply by|due date|applications? close|last date for receipt)\s*(?::|is|of|on|before|by)?\s*([\w\s,]+?)(?:\.|,|;|$)/i,
      /(?:applications? (?:must|should) reach)\s*(?:by|on|before)\s*([\w\s,]+?)(?:\.|,|;|$)/i,
    ],
  },
  {
    label: "application_start",
    patterns: [
      /(?:applications? (?:window )?(?:opens?|start date|starting|begins)|online applications? open|start date of application)\s*(?::|is|on|from)?\s*([\w\s,]+?)(?:\.|,|;|$)/i,
      /(?:registration (?:opens|starts|begins))\s*(?:from|on)?\s*([\w\s,]+?)(?:\.|,|;|$)/i,
    ],
  },
  {
    label: "posted_date",
    patterns: [
      /(?:posted(?: on)?|published(?: on)?|issued on|notification dated)\s*(?::|on)?\s*([\w\s,]+?)(?:\.|,|;|$)/i,
    ],
  },
  {
    label: "exam_date",
    patterns: [
      /(?:exam(?:ination)? date|date of exam|date of examination|written test date|test date)\s*(?::|is|on)?\s*([\w\s,]+?)(?:\.|,|;|$)/i,
    ],
  },
  {
    label: "interview_date",
    patterns: [
      /(?:interview date|date of interview|walk[-‑ ]in (?:interview )?date|interview will be held)\s*(?::|is|on)?\s*([\w\s,]+?)(?:\.|,|;|$)/i,
    ],
  },
  {
    label: "joining_date",
    patterns: [
      /(?:joining date|date of joining|report by|reporting date|join by)\s*(?::|is|on)?\s*([\w\s,]+?)(?:\.|,|;|$)/i,
    ],
  },
  {
    label: "event_date",
    patterns: [
      /(?:event date|conference date|starts on|held on|scheduled on)\s*(?::|is|on)?\s*([\w\s,]+?)(?:\.|,|;|$)/i,
    ],
  },
];

/**
 * Normalize any supported date string to ISO YYYY-MM-DD.
 * Returns null when the input is not a recognizable date — callers must NOT
 * fall back to guessing.
 */
export function normalizeDate(input: string | null | undefined): string | null {
  if (!input) return null;
  const s = String(input).trim();
  if (!s) return null;

  // ISO: 2026-08-30 (year-month-day)
  const iso = s.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (iso) {
    const candidate = `${iso[1]}-${pad(iso[2])}-${pad(iso[3])}`;
    return validIso(candidate) ? candidate : null;
  }

  // DD/MM/YYYY | DD-MM-YYYY | DD.MM.YYYY (day-month-year)
  const dmy = s.match(/\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})\b/);
  if (dmy) {
    const candidate = `${dmy[3]}-${pad(dmy[2])}-${pad(dmy[1])}`;
    return validIso(candidate) ? candidate : null;
  }

  // month-name forms: 25 Sep 2026 | 25th September 2026 | September 25, 2026
  const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  for (let i = 0; i < monthNames.length; i++) {
    const m = s.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+${monthNames[i]}[a-z]*\\s+(\\d{4})\\b`, "i"));
    if (m) {
      const candidate = `${m[2]}-${pad(i + 1)}-${pad(m[1])}`;
      return validIso(candidate) ? candidate : null;
    }
    const m2 = s.match(new RegExp(`\\b${monthNames[i]}[a-z]*\\s+(\\d{1,2})(?:st|nd|rd|th)?[,]?\\s+(\\d{4})\\b`, "i"));
    if (m2) {
      const candidate = `${m2[2]}-${pad(i + 1)}-${pad(m2[1])}`;
      return validIso(candidate) ? candidate : null;
    }
  }
  return null;
}

function validIso(iso: string): boolean {
  const d = new Date(`${iso}T00:00:00Z`);
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso;
}

function extractMatchForLabel(text: string, label: DateLabel, labelPatterns: RegExp[]): { value: string; raw: string } | null {
  for (const pattern of labelPatterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const candidate = match[1]?.trim() || "";
    if (!candidate) continue;
    // first date-like token inside the captured phrase
    const datePart = candidate.split(/[;,]\s/)[0];
    const norm = normalizeDate(datePart);
    if (norm) return { value: norm, raw: datePart };
  }
  return null;
}

/**
 * Extract labeled dates from a source text. The first date found under each
 * labeled context wins; unlabeled bare dates are NOT assigned (avoiding the
 * "first date in page = deadline" mistake). Returns raw snippets for audit.
 */
export function extractDates(text: string | null | undefined): LabeledDates {
  const result: LabeledDates = { ...EMPTY_LABELED_DATES, raw: {} };
  if (!text) return result;
  for (const { label, patterns } of LABEL_CONTEXTS) {
    const found = extractMatchForLabel(text, label, patterns);
    if (found) {
      result[label] = found.value;
      result.raw[label] = found.raw;
    }
  }
  return result;
}

/**
 * "Closed in August" must NOT become "31 August 2026".
 * This is the Phase-15 safety guard: partial/ambiguous deadlines stay null.
 */
export function containsGuessableDeadline(text: string | null | undefined): boolean {
  if (!text) return false;
  // labeled date present → fine
  return /(?:last date(?: for (?:receipt of )?applications?)?|closing date|deadline|applications? close)\s*(?:is|of|on)?\s*(?:in|within|around|by the end of|next month|this month)/i.test(text);
}