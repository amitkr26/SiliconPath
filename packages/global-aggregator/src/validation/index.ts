import type {
  NormalizedOpportunity,
  ValidationError,
} from "../types";
import { DeadLinkChecker } from "./dead-links";
import { DuplicateDetector } from "./duplicates";
import { ExpiredDetector } from "./expired";
import { MalformedDetector } from "./malformed";
import { BrokenHtmlDetector } from "./broken-html";
import { RedirectDetector } from "./redirects";
import { SpamDetector } from "./spam";

export interface ValidateAllResult {
  valid: NormalizedOpportunity[];
  rejected: NormalizedOpportunity[];
  errors: ValidationError[];
}

export class Validator {
  private readonly deadLinkChecker: DeadLinkChecker;
  private readonly duplicateDetector: DuplicateDetector;
  private readonly expiredDetector: ExpiredDetector;
  private readonly malformedDetector: MalformedDetector;
  private readonly brokenHtmlDetector: BrokenHtmlDetector;
  private readonly redirectDetector: RedirectDetector;
  private readonly spamDetector: SpamDetector;

  constructor(
    deadLinkChecker: DeadLinkChecker,
    duplicateDetector: DuplicateDetector,
    expiredDetector: ExpiredDetector,
    malformedDetector: MalformedDetector,
    brokenHtmlDetector: BrokenHtmlDetector,
    redirectDetector: RedirectDetector,
    spamDetector: SpamDetector,
  ) {
    this.deadLinkChecker = deadLinkChecker;
    this.duplicateDetector = duplicateDetector;
    this.expiredDetector = expiredDetector;
    this.malformedDetector = malformedDetector;
    this.brokenHtmlDetector = brokenHtmlDetector;
    this.redirectDetector = redirectDetector;
    this.spamDetector = spamDetector;
  }

  async validateAll(
    items: NormalizedOpportunity[],
  ): Promise<ValidateAllResult> {
    const allErrors: ValidationError[] = [];
    const valid: NormalizedOpportunity[] = [];
    const rejected: NormalizedOpportunity[] = [];

    const deduplicated = this.duplicateDetector.detect(items);

    for (const item of deduplicated) {
      const errors: ValidationError[] = [];

      const malformedErrors = this.malformedDetector.validate(item);
      errors.push(...malformedErrors);

      if (this.expiredDetector.isExpired(item.deadline)) {
        errors.push({
          field: "deadline",
          message: "Opportunity has expired",
          code: "EXPIRED",
        });
      }

      const spamResult = this.spamDetector.isSpam(item);
      if (spamResult.spam) {
        for (const reason of spamResult.reasons) {
          errors.push({
            field: "title",
            message: reason,
            code: "SPAM_DETECTED",
          });
        }
      }

      if (item.applyLink) {
        try {
          const linkResult = await this.deadLinkChecker.check(
            item.applyLink,
          );
          if (!linkResult.valid) {
            errors.push({
              field: "applyLink",
              message: `Dead link: ${linkResult.error ?? `HTTP ${linkResult.statusCode}`}`,
              code: "DEAD_LINK",
            });
          }
        } catch {
          errors.push({
            field: "applyLink",
            message: "Failed to verify apply link",
            code: "LINK_CHECK_FAILED",
          });
        }
      }

      if (errors.length > 0) {
        item.verificationStatus = "rejected";
        rejected.push(item);
        allErrors.push(...errors);
      } else {
        item.verificationStatus = "verified";
        valid.push(item);
      }
    }

    return { valid, rejected, errors: allErrors };
  }
}

export { DeadLinkChecker } from "./dead-links";
export { DuplicateDetector } from "./duplicates";
export { ExpiredDetector } from "./expired";
export { MalformedDetector } from "./malformed";
export { BrokenHtmlDetector } from "./broken-html";
export { RedirectDetector } from "./redirects";
export { SpamDetector } from "./spam";
