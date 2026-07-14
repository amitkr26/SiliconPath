import type { NormalizedOpportunity, ValidationError } from "../types";

const GARBAGE_PATTERNS = [
  /[#@$%^&*(){}[\]|\\<>]+/,
  /(.)\1{5,}/,
  /\b( undefined | null | NaN | true | false )\b/,
  /<script/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/,
];

export class MalformedDetector {
  validate(item: Partial<NormalizedOpportunity>): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!item.title || item.title.trim().length < 5) {
      errors.push({
        field: "title",
        message: "Title is too short (minimum 5 characters)",
        code: "TITLE_TOO_SHORT",
      });
    }

    if (!item.applyLink || item.applyLink.trim().length === 0) {
      errors.push({
        field: "applyLink",
        message: "Apply link is missing",
        code: "MISSING_APPLY_LINK",
      });
    }

    if (!item.sourceUrl || item.sourceUrl.trim().length === 0) {
      errors.push({
        field: "sourceUrl",
        message: "Source URL is missing",
        code: "MISSING_SOURCE_URL",
      });
    }

    if (item.title) {
      for (const pattern of GARBAGE_PATTERNS) {
        if (pattern.test(item.title)) {
          errors.push({
            field: "title",
            message: "Title contains garbage or suspicious patterns",
            code: "TITLE_GARBAGE",
          });
          break;
        }
      }
    }

    if (!item.description || item.description.trim().length < 20) {
      errors.push({
        field: "description",
        message: "Description is too short (minimum 20 characters)",
        code: "DESCRIPTION_TOO_SHORT",
      });
    }

    if (!item.location || item.location.trim().length === 0) {
      errors.push({
        field: "location",
        message: "Location is missing",
        code: "MISSING_LOCATION",
      });
    }

    return errors;
  }
}
