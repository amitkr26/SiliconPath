// Source classification + verification (Phase 6 of CONTENT_UPGRADE_PLAN.md).
// source_type taxonomy: official | government | university | company |
// research | reputable_media | aggregator | social | unknown.
// Official sources may claim "verified"; aggregators are discovery-only.

export type SourceType =
  | "official"
  | "government"
  | "university"
  | "company"
  | "research"
  | "reputable_media"
  | "aggregator"
  | "social"
  | "unknown";

export const SOURCE_TYPES: SourceType[] = [
  "official", "government", "university", "company", "research",
  "reputable_media", "aggregator", "social", "unknown",
];

export const OFFICIAL_SOURCE_TYPES: SourceType[] = ["official", "government", "university", "company"];

export interface SourceRef {
  title: string;
  url: string;
  publisher: string;
  source_type: SourceType;
  published_at: string | null;
  accessed_at: string;
}

// Deterministic domain → source_type classification.
// Matching runs against the URL HOSTNAME (so path/query never hides the
// domain), plus the full URL and any publisher hint. Specific patterns are
// checked before the generic company TLD catch-all.
const DOMAIN_RULES: Array<{ type: SourceType; patterns: RegExp[] }> = [
  {
    type: "social",
    patterns: [/facebook/i, /twitter/i, /x\.com$/i, /telegram/i, /whatsapp/i, /youtube/i, /t\.me/i],
  },
  {
    type: "aggregator",
    patterns: [/academicpositions/i, /jobs\.ac\.uk/i, /scholarship/i, /linkedin/i, /indeed/i, /naukri/i, /foundit/i],
  },
  {
    type: "reputable_media",
    patterns: [/ieee/i, /spectrum/i, /eetimes/i, /semiengineering/i, /electronicsweekly/i, /chipdesign/i, /semiwiki/i, /electronicsforu/i],
  },
  {
    type: "university",
    patterns: [/\.edu(\.\w{2})?$/i, /\.ac\.(uk|au|sg|in)$/i, /iit/i, /iisc/i, /university/i],
  },
  {
    type: "government",
    patterns: [/\.gov\.(in|uk|us|au|ca|sg|jp|kr|de|fr)$/i, /\.nic\.in$/i],
  },
  {
    type: "research",
    patterns: [/research/i, /drdo/i, /isro/i, /csir/i, /barc/i, /tifr/i, /ceeri/i],
  },
  {
    type: "company",
    patterns: [
      /greenhouse/i, /workday/i, /smartrecruiters/i, /lever\.co/i,
      /careers?\./i, /jobs\./i,
      /\.(com|co|io|org|net|in)$/i,
    ],
  },
];

function hostnameOf(url: string | null | undefined): string {
  try {
    return new URL(url as string).hostname;
  } catch {
    return "";
  }
}

/** Classify a source URL (optionally with a publisher name hint) deterministically. */
export function classifySourceType(url: string | null | undefined, publisher?: string | null): SourceType {
  // Hostname only — anchored patterns like /\.gov\.in$/ must see the full
  // domain, not a path/query suffix. Publisher is only a secondary hint.
  const host = hostnameOf(url);
  if (host) {
    for (const rule of DOMAIN_RULES) {
      if (rule.patterns.some((re) => re.test(host))) return rule.type;
    }
  }
  if (publisher) {
    for (const rule of DOMAIN_RULES) {
      if (rule.patterns.some((re) => re.test(publisher))) return rule.type;
    }
  }
  return "unknown";
}

export function isOfficialSource(type: SourceType): boolean {
  return OFFICIAL_SOURCE_TYPES.includes(type);
}

/** Build the persisted sources[] entry (Phase 3 metadata shape). */
export function buildSourceRef(input: {
  title: string;
  url: string;
  publisher?: string | null;
  published_at?: string | null;
  accessed_at?: string;
}): SourceRef {
  return {
    title: input.title,
    url: input.url,
    publisher: input.publisher || classifyPublisher(input.url),
    source_type: classifySourceType(input.url, input.publisher),
    published_at: input.published_at || null,
    accessed_at: input.accessed_at || new Date().toISOString(),
  };
}

function classifyPublisher(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** URL sanity check for stored references — must be absolute http(s). */
export function isValidSourceUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Verification decision: official sources may be marked verified; anything
 * discovered via aggregators/social/unknown must stay pending.
 */
export function verificationFromSourceType(type: SourceType): "verified" | "pending" {
  return isOfficialSource(type) ? "verified" : "pending";
}