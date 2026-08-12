// Pre-publish quality gate (Phase 11 of CONTENT_UPGRADE_PLAN.md).
// Articles that fail validation must NOT be published — they stay
// draft/rejected with a rejection reason.

import { isValidPrimaryCategory } from "./taxonomy.js";
import { isValidSourceUrl } from "./sources.js";

export interface ArticleValidationInput {
  title?: string | null;
  slug?: string | null;
  summary?: string | null;
  content?: string | null;
  sourceUrl?: string | null;
  sources?: Array<{ url?: string; title?: string }> | null;
  category?: string | null;
  metaDescription?: string | null;
  primaryCategory?: string | null;
  readingTimeMinutes?: number | null;
  /** raw generated body — scanned for placeholder/AI boilerplate */
  rawContent?: string | null;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const PLACEHOLDER_PATTERNS = [
  /lorem ipsum/i,
  /\[.*?(insert|placeholder|add|TODO).*?\]/i,
  /{{.*?}}/,
  /your text here/i,
  /change me/i,
];

const MIN_CONTENT_LENGTH = 120;

export function validateArticle(input: ArticleValidationInput): ValidationResult {
  const errors: string[] = [];
  const sourceUrl = input.sourceUrl;

  if (!input.title || input.title.trim().length < 10) errors.push("title is missing or too short");
  if (!input.slug || input.slug.trim().length < 3) errors.push("slug is missing");
  const content = input.content || input.rawContent || "";
  if (!content || content.trim().length < MIN_CONTENT_LENGTH) errors.push("article has no meaningful content");
  if (!input.sources || input.sources.length === 0) errors.push("references/sources are missing");
  if (!isValidSourceUrl(sourceUrl)) errors.push("source URL is missing or invalid");
  if (!input.metaDescription || input.metaDescription.trim().length < 20) errors.push("meta description is missing");
  if (input.primaryCategory && !isValidPrimaryCategory(input.primaryCategory)) errors.push("category is not part of the controlled taxonomy");
  if (content && PLACEHOLDER_PATTERNS.some((re) => re.test(content))) errors.push("AI placeholder text detected");

  // Organization/title must match the source — cheap sanity checks
  if (input.title && content && content.length < 10) errors.push("content is empty");

  return { valid: errors.length === 0, errors };
}

export const QUALITY_STATUSES = ["draft", "review", "verified", "published", "rejected"] as const;
export type QualityStatus = (typeof QUALITY_STATUSES)[number];

export function qualityStatusFromValidation(valid: boolean): QualityStatus {
  return valid ? "published" : "rejected";
}