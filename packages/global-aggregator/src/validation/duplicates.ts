import type { NormalizedOpportunity } from "../types";
import { createHash } from "node:crypto";

export class DuplicateDetector {
  detect(items: NormalizedOpportunity[]): NormalizedOpportunity[] {
    const seen = new Map<string, NormalizedOpportunity>();
    const results: NormalizedOpportunity[] = [];

    for (const item of items) {
      const hash = this.computeHash(item);
      if (!seen.has(hash)) {
        seen.set(hash, item);
        results.push(item);
      }
    }

    return results;
  }

  private computeHash(item: NormalizedOpportunity): string {
    const parts = [
      item.canonicalUrl?.toLowerCase().trim() ?? "",
      item.sourceUrl?.toLowerCase().trim() ?? "",
      item.title?.toLowerCase().trim() ?? "",
      item.organization?.toLowerCase().trim() ?? "",
    ];
    return createHash("sha256").update(parts.join("|")).digest("hex");
  }
}
